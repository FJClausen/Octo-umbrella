"use server";

import Anthropic from "@anthropic-ai/sdk";
import { requireCoach } from "@/lib/auth";
import { site } from "@/lib/site";

export type ParsedEvent = {
  type: "game" | "practice" | "event";
  title: string;
  opponent: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  jersey_color: "blue" | "red" | null;
};

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    events: {
      type: "array",
      description: "Every game/practice/event found in the pasted schedule",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["game", "practice", "event"] },
          title: {
            type: "string",
            description:
              "Short title. For plain games/practices just 'Game' or 'Practice'; use something specific only for special events (tournament, picnic…).",
          },
          opponent: {
            type: "string",
            description: "Opposing team name for games, empty if unknown",
          },
          date: { type: "string", description: "YYYY-MM-DD" },
          start_time: {
            type: "string",
            description: "24h HH:MM local start time",
          },
          end_time: {
            type: "string",
            description: "24h HH:MM local end time, empty if not stated",
          },
          location: {
            type: "string",
            description: "Field/venue as written, empty if not stated",
          },
          jersey_color: {
            type: "string",
            enum: ["blue", "red", ""],
            description:
              "blue if we're the home team, red if away, empty if unclear",
          },
        },
        required: [
          "type",
          "title",
          "opponent",
          "date",
          "start_time",
          "end_time",
          "location",
          "jersey_color",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["events"],
  additionalProperties: false,
} as const;

export async function parseScheduleAction(
  text: string
): Promise<{ events?: ParsedEvent[]; error?: string }> {
  await requireCoach();

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      error:
        "The AI import isn't configured yet — add an ANTHROPIC_API_KEY environment variable in Vercel and redeploy.",
    };
  }
  const raw = text.trim().slice(0, 20000);
  if (!raw) return { error: "Paste a schedule first." };

  const today = new Date().toISOString().slice(0, 10);
  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: {
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      system: `You extract a youth soccer team's schedule from pasted text (league website tables, emails, PDFs, or iCal contents). Our team is "${site.teamName}". Today's date is ${today} — use it to infer the year when the schedule omits it (schedules are usually for upcoming dates). When a row lists two teams, the one that is not ours is the opponent; if we're listed as home, jersey_color is blue, if away, red. Ignore standings, headers, and anything that isn't a dated event. Do not invent events or details that aren't in the text.`,
      messages: [{ role: "user", content: raw }],
    });

    if (response.stop_reason === "refusal") {
      return { error: "The model declined this request — try different text." };
    }

    let out = "";
    for (const block of response.content) {
      if (block.type === "text") out += block.text;
    }
    if (!out) return { error: "No events found — is this a schedule?" };

    const parsed = JSON.parse(out) as { events: ParsedEvent[] };
    const events = (parsed.events ?? [])
      .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date))
      .map((e) => ({
        ...e,
        opponent: e.opponent || null,
        end_time: e.end_time || null,
        location: e.location || null,
        jersey_color:
          e.jersey_color === "blue" || e.jersey_color === "red"
            ? e.jersey_color
            : null,
      }));
    if (!events.length) {
      return { error: "No dated events found in that text." };
    }
    return { events };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return { error: "The Anthropic API key is invalid — check ANTHROPIC_API_KEY in Vercel." };
    }
    if (err instanceof Anthropic.RateLimitError) {
      return { error: "The AI service is rate-limited right now — try again in a minute." };
    }
    if (err instanceof Anthropic.APIError) {
      return { error: `AI service error: ${err.message}` };
    }
    return { error: "Something went wrong parsing the schedule — please try again." };
  }
}
