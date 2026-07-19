"use server";

import Anthropic from "@anthropic-ai/sdk";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export type GeneratedPlan = {
  concept: string;
  warmup: string;
  drills: string[];
  scrimmage: string;
};

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    concept: {
      type: "string",
      description:
        "2-4 sentences explaining the session's idea: how the warmup, drills, and scrimmage build on each other toward the focus area, written for the coach",
    },
    warmup: {
      type: "string",
      description:
        "EXACT title of one catalogue exercise tagged Warmup. Empty string if none available.",
    },
    drills: {
      type: "array",
      items: { type: "string" },
      description:
        "EXACT titles of 2-3 catalogue exercises that together cover the focus areas (not warmups, not scrimmage variations)",
    },
    scrimmage: {
      type: "string",
      description:
        "EXACT title of one catalogue exercise tagged Scrimmage Variations, ideally one that reinforces the focus. Empty string if none available.",
    },
  },
  required: ["concept", "warmup", "drills", "scrimmage"],
  additionalProperties: false,
} as const;

const ALLOWED_FOCUS = [
  "Attacking",
  "Defending",
  "Dribbling",
  "Passing",
  "Shooting",
  "Technique",
];

export async function generatePracticePlanAction(
  focusInput: string[]
): Promise<{ plan?: GeneratedPlan; error?: string }> {
  await requireCoach();

  const focus = focusInput.filter((f) => ALLOWED_FOCUS.includes(f));
  if (!focus.length) {
    return { error: "Pick at least one focus area." };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      error:
        "The AI planner isn't configured yet — add an ANTHROPIC_API_KEY environment variable in Vercel and redeploy.",
    };
  }

  const supabase = createClient();
  const { data: templates } = await supabase
    .from("exercise_templates")
    .select("title, tags, difficulty, rating");
  if (!templates?.length) {
    return {
      error:
        "The exercise catalogue is empty — save a few exercises first (including a warmup and a scrimmage variation).",
    };
  }

  const catalogue = templates
    .map((t) => {
      const meta = [
        (t.tags ?? []).join("/") || "untagged",
        t.difficulty,
        t.rating ? `rated ${t.rating}/5` : null,
      ]
        .filter(Boolean)
        .join(", ");
      return `- "${t.title}" (${meta})`;
    })
    .join("\n");

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      output_config: {
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      system: `You are an experienced youth soccer coach planning a practice session for ${site.teamName}, a recreational team of 9-year-old girls that plays 7-a-side. You compose sessions ONLY from the coach's saved exercise catalogue — you must copy titles EXACTLY as written, and never invent exercises. Prefer highly rated exercises. A good session has an arc: warm up, build the skill in drills, then apply it in a game-like scrimmage.`,
      messages: [
        {
          role: "user",
          content: `Focus area${focus.length > 1 ? "s" : ""} for this session: ${focus.join(", ")}\n\nExercise catalogue:\n${catalogue}\n\nPick one Warmup-tagged exercise, 2-3 drills that together cover ${focus.join(" and ")}${
            focus.length > 1
              ? " (each focus area should be trained by at least one drill; drills covering several of them are ideal)"
              : ""
          }, and one Scrimmage Variations exercise — ideally one where the focus skills come up naturally. In the concept, explain how the session builds from warmup through the drills to the scrimmage${
            focus.length > 1 ? " and how the focus areas connect" : ""
          }.`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return { error: "The model declined this request — please try again." };
    }

    let out = "";
    for (const block of response.content) {
      if (block.type === "text") out += block.text;
    }
    if (!out) return { error: "The model returned no content — please try again." };

    const parsed = JSON.parse(out) as GeneratedPlan;

    // Only titles that actually exist in the catalogue survive — matched
    // case-insensitively, returned in their canonical casing so the
    // planner's link chips work.
    const canonical = new Map(
      templates.map((t) => [t.title.toLowerCase(), t.title])
    );
    const resolve = (title: string) =>
      canonical.get(title.trim().toLowerCase()) ?? null;

    const plan: GeneratedPlan = {
      concept: parsed.concept?.trim() || "",
      warmup: resolve(parsed.warmup ?? "") ?? "",
      drills: (parsed.drills ?? [])
        .map(resolve)
        .filter((t): t is string => t != null)
        .slice(0, 3),
      scrimmage: resolve(parsed.scrimmage ?? "") ?? "",
    };
    if (!plan.warmup && !plan.drills.length && !plan.scrimmage) {
      return {
        error:
          "Couldn't build a session from the catalogue — make sure you have exercises tagged for the focus areas, a Warmup, and a Scrimmage Variation.",
      };
    }
    return { plan };
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
    return { error: "Something went wrong planning the session — please try again." };
  }
}
