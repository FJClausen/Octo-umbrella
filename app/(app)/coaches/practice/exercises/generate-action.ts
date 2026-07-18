"use server";

import Anthropic from "@anthropic-ai/sdk";
import type { SketchDiagram } from "@/components/FieldSketch";
import { requireCoach } from "@/lib/auth";
import {
  DIFFICULTY_LEVELS,
  EXERCISE_TAGS,
  site,
  type Difficulty,
  type ExerciseTag,
} from "@/lib/site";

export type GeneratedExercise = {
  title: string;
  setup: string;
  run_of_play: string;
  tags: string[];
  diagram?: SketchDiagram | null;
};

export type GenerateInput = {
  players: number;
  focus: string[];
  difficulty: Difficulty;
  instructions: string;
};

// Calibrated to what a typical 9-year-old rec player can actually do.
const DIFFICULTY_GUIDANCE: Record<Difficulty, string> = {
  Easy:
    "Difficulty: EASY. Assume beginners — some players are still working on basic ball control and confidence. No pressure from defenders (or shadow/passive pressure at most), big spaces, unlimited touches, lots of guaranteed success. Every player should succeed most of the time.",
  Standard:
    "Difficulty: STANDARD. Assume a typical 9-year-old rec player — can dribble at moderate speed, pass over short distances with some accuracy, but decision-making under pressure is still developing. Light-to-moderate pressure, moderate space, simple rules. Success roughly 60-70% of attempts.",
  Challenge:
    "Difficulty: CHALLENGE. For the stronger players on a 9-year-old rec team — still NOT club/travel level. Add real (but fair) defensive pressure, tighter space, or quicker decisions. Keep rules simple enough to explain in under a minute, and include an easier regression so weaker players can still join in.",
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
    diagram: {
      type: "object",
      description:
        "Tactics-board diagram of the setup, drawn on a landscape soccer pitch. All coordinates are fractions of the pitch: x runs 0 (left goal line) to 1 (right goal line), y runs 0 (top touchline) to 1 (bottom touchline). Show only what's needed to understand the setup: cones marking the grid/channels, one token per player (matching the player counts in the exercise), the ball(s), and arrows for the key movements. Space elements out so nothing overlaps.",
      properties: {
        tokens: {
          type: "array",
          maxItems: 30,
          description:
            "Players and equipment. attacker = navy player circle, defender = red player circle, ball = soccer ball, cone = yellow training cone.",
          items: {
            type: "object",
            properties: {
              kind: {
                type: "string",
                enum: ["attacker", "defender", "ball", "cone"],
              },
              x: { type: "number", minimum: 0, maximum: 1 },
              y: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["kind", "x", "y"],
            additionalProperties: false,
          },
        },
        arrows: {
          type: "array",
          maxItems: 12,
          description:
            "Key movements only (usually 2-6). pass = solid arrow (ball travel), run = dashed arrow (player run without ball), dribble = wavy arrow (player carrying the ball).",
          items: {
            type: "object",
            properties: {
              kind: { type: "string", enum: ["pass", "run", "dribble"] },
              from_x: { type: "number", minimum: 0, maximum: 1 },
              from_y: { type: "number", minimum: 0, maximum: 1 },
              to_x: { type: "number", minimum: 0, maximum: 1 },
              to_y: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["kind", "from_x", "from_y", "to_x", "to_y"],
            additionalProperties: false,
          },
        },
      },
      required: ["tokens", "arrows"],
      additionalProperties: false,
    },
  },
  required: ["title", "setup", "run_of_play", "tags", "diagram"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You are an experienced youth soccer coach designing practice exercises for ${site.teamName}, a recreational team of 9-year-old girls that plays 7-a-side. Design age-appropriate, fun, high-repetition exercises with minimal standing in line. Keep equipment simple (cones, pinnies, balls, small goals). Setup should be quick to lay out. Write concisely and practically — the coach reads this on the field.`;

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
  const difficulty: Difficulty = DIFFICULTY_LEVELS.includes(input.difficulty)
    ? input.difficulty
    : "Standard";
  const instructions = input.instructions.trim().slice(0, 2000);

  const prompt = [
    `Design one practice exercise.`,
    `Players available: ${players}`,
    focus.length
      ? `Focus area(s): ${focus.join(", ")}`
      : `Focus area: coach's choice — pick what suits the group.`,
    DIFFICULTY_GUIDANCE[difficulty],
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
