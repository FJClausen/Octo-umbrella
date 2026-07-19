"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui";
import { DIFFICULTY_LEVELS, EXERCISE_TAGS, type Difficulty } from "@/lib/site";
import { FieldSketch, diagramToElements } from "@/components/FieldSketch";
import {
  generateExerciseAction,
  type GeneratedExercise,
} from "@/app/(app)/coaches/practice/exercises/generate-action";
import { createExerciseTemplate } from "@/app/(app)/coaches/practice/actions";

export function ExerciseGenerator() {
  const [players, setPlayers] = useState(8);
  const [focus, setFocus] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("Standard");
  const [instructions, setInstructions] = useState("");
  const [draft, setDraft] = useState<GeneratedExercise | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleFocus(tag: string) {
    setFocus((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function generate() {
    setError(null);
    startTransition(async () => {
      const res = await generateExerciseAction({
        players,
        focus,
        difficulty,
        instructions,
      });
      if (res.error) {
        setError(res.error);
      } else if (res.exercise) {
        setDraft(res.exercise);
      }
    });
  }

  return (
    <details className="card border-brand-blue/30 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-brand-blue">
        ✨ Generate an exercise with AI
      </summary>

      <div className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Number of players</label>
            <input
              type="number"
              min={2}
              max={30}
              value={players}
              onChange={(e) => setPlayers(Number(e.target.value))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Focus areas (optional)</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {EXERCISE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleFocus(tag)}
                  className={`badge transition ${
                    focus.includes(tag)
                      ? "bg-brand-blue text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="label">Difficulty (for 9-year-old rec players)</label>
          <div className="flex flex-wrap gap-2 pt-1">
            {DIFFICULTY_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`badge transition ${
                  difficulty === level
                    ? "bg-brand-green text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {difficulty === "Easy"
              ? "Big spaces, no pressure, lots of guaranteed success — great for building confidence."
              : difficulty === "Standard"
                ? "A typical rec-level session: light pressure, simple rules, success most of the time."
                : "Tighter space and real (but fair) pressure for the stronger players — with an easier option built in."}
          </p>
        </div>
        <div>
          <label className="label">Additional instructions (optional)</label>
          <textarea
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="input"
            placeholder="e.g. Only half the field available; work on quick first touch; keep it high-energy…"
          />
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={isPending}
          className="btn-blue"
        >
          {isPending ? "Generating…" : draft ? "↻ Regenerate" : "Generate"}
        </button>
        {error ? <Alert variant="error">{error}</Alert> : null}
      </div>

      {draft ? (
        <div className="mt-4 rounded-lg border border-brand-blue/30 bg-brand-blue-light/30 p-3">
          <p className="mb-3 text-sm font-medium text-brand-blue-dark">
            Draft ready — review, tweak anything, then save it to the
            catalogue.
          </p>
          {/* key resets the defaults when a new draft is generated */}
          <form
            key={`${draft.title}-${draft.setup.length}`}
            action={async (formData: FormData) => {
              await createExerciseTemplate(formData);
              // Saved — clear the draft and instructions so the next
              // exercise can be designed from a clean slate.
              setDraft(null);
              setInstructions("");
            }}
            className="space-y-3"
          >
            <div>
              <label className="label">Title</label>
              <input
                name="title"
                required
                defaultValue={draft.title}
                className="input"
              />
            </div>
            <div>
              <label className="label">Setup</label>
              <textarea
                name="setup"
                rows={3}
                defaultValue={draft.setup}
                className="input"
              />
            </div>
            <div>
              <label className="label">Run of play</label>
              <textarea
                name="run_of_play"
                rows={5}
                defaultValue={draft.run_of_play}
                className="input"
              />
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select
                name="difficulty"
                defaultValue={difficulty}
                className="input"
              >
                {DIFFICULTY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tags</label>
              <div className="flex flex-wrap gap-3">
                {EXERCISE_TAGS.map((tag) => (
                  <label
                    key={tag}
                    className="flex items-center gap-1.5 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      name="tags"
                      value={tag}
                      defaultChecked={draft.tags.includes(tag)}
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">
                Field sketch (AI-drawn — tweak it with the tools below, or
                Clear and draw your own)
              </label>
              <FieldSketch
                initialElements={
                  draft.diagram ? diagramToElements(draft.diagram) : []
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" className="btn-primary">
                Save to catalogue
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="btn-outline"
              >
                Discard
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </details>
  );
}
