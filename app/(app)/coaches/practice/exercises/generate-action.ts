"use server";

import Anthropic from "@anthropic-ai/sdk";
import { requireCoach } from "@/lib/auth";
import { EXERCISE_TAGS, site, type ExerciseTag } from "@/lib/site";

export type GeneratedExercise = {
  title: string;
  setup: string;
  run_of_play: string;
  tags: string[];
};

export type GenerateInput = {
  players: number;
  focus: string[];
  instructions: string;
};

// Structured-output schema: the model must return exactly the shape our
// exercise catalogue stores.
const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Short, memorable exercise name (max ~6 words)",
    },
    setup: {
      type: "string",
      description:
        "Field markings, cone layout, grid dimensions, groups, and equipment needed",
    },
    run_of_play: {
      type: "string",
      description:
        "How the exercise runs: rules, rotations, progressions to make it harder, and 2-3 coaching points",
    },
    tags: {
      type: "array",
      items: { type: "string", enum: [...EXERCISE_TAGS] },
      description: "Focus areas this exercise trains",
    },
  },
  required: ["title", "setup", "run_of_play", "tags"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You are an experienced youth soccer coach designing practice exercises for ${site.teamName}, a girls' youth team that plays 7-a-side. Design age-appropriate, fun, high-repetition exercises with minimal standing in line. Keep equipment simple (cones, pinnies, balls, small goals). Setup should be quick to lay out. Write concisely and practically — the coach reads this on the field.`;

export async function generateExerciseAction(
  input: GenerateInput
): Promise<{ exercise?: GeneratedExercise; error?: string }> {
  await requireCoach();

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      error:
        "The AI generator isn't configured yet — add an ANTHROPIC_API_KEY environment variable in Vercel and redeploy.",
    };
  }

  const players = Math.max(2, Math.min(30, Math.round(input.players) || 8));
  const focus = input.focus.filter((t) =>
    EXERCISE_TAGS.includes(t as ExerciseTag)
  );
  const instructions = input.instructions.trim().slice(0, 2000);

  const prompt = [
    `Design one practice exercise.`,
    `Players available: ${players}`,
    focus.length
      ? `Focus area(s): ${focus.join(", ")}`
      : `Focus area: coach's choice — pick what suits the group.`,
    instructions ? `Additional instructions from the coach: ${instructions}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: {
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal") {
      return { error: "The model declined this request — try rephrasing." };
    }

    let text = "";
    for (const block of response.content) {
      if (block.type === "text") text += block.text;
    }
    if (!text) {
      return { error: "The model returned no content — please try again." };
    }

    const parsed = JSON.parse(text) as GeneratedExercise;
    parsed.tags = (parsed.tags ?? []).filter((t) =>
      EXERCISE_TAGS.includes(t as ExerciseTag)
    );
    return { exercise: parsed };
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
    return { error: "Something went wrong generating the exercise — please try again." };
  }
}
