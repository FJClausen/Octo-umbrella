"use client";

import { useState, useTransition } from "react";
import { PracticePlanEditor } from "@/components/PracticePlanEditor";
import {
  generatePracticePlanAction,
  type GeneratedPlan,
} from "@/app/(app)/coaches/practice/generate-plan-action";

const FOCUS_AREAS = [
  "Attacking",
  "Defending",
  "Dribbling",
  "Passing",
  "Shooting",
  "Technique",
];

type Template = React.ComponentProps<typeof PracticePlanEditor>["templates"];

/** The "+ New practice session" editor with an AI session planner on top:
 *  pick a focus area and the AI assembles warmup → drills → scrimmage
 *  from the saved exercise catalogue, explaining its concept. */
export function NewSessionPlanner({
  initialSessionDate,
  templates,
  onSave,
}: {
  initialSessionDate: string;
  templates: Template;
  onSave: (formData: FormData) => Promise<{ error?: string } | void>;
}) {
  const [focus, setFocus] = useState(FOCUS_AREAS[0]);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [generation, setGeneration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function generate() {
    setError(null);
    startTransition(async () => {
      const res = await generatePracticePlanAction(focus);
      if (res.error) {
        setError(res.error);
      } else if (res.plan) {
        setPlan(res.plan);
        setGeneration((g) => g + 1);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-brand-blue/30 bg-brand-blue-light/30 p-3">
        <p className="mb-2 text-sm font-medium text-brand-blue-dark">
          ✨ Let AI plan this session from your saved exercises
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            className="input w-auto"
          >
            {FOCUS_AREAS.map((f) => (
              <option key={f} value={f}>
                Focus: {f}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={generate}
            disabled={isPending}
            className="btn-blue"
          >
            {isPending ? "Planning…" : plan ? "↻ Replan" : "✨ Plan session"}
          </button>
        </div>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {plan?.concept ? (
          <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-slate-700">
            💡 <span className="font-medium">Session concept:</span>{" "}
            {plan.concept}
          </p>
        ) : null}
      </div>

      {/* Remounts on each generation so the fields pick up the new plan;
          the coach can edit everything before saving. */}
      <PracticePlanEditor
        key={generation}
        initialSessionDate={initialSessionDate}
        initialWarmup={plan?.warmup ?? ""}
        initialExercises={plan?.drills.join("\n") ?? ""}
        initialScrimmages={plan?.scrimmage ?? ""}
        templates={templates}
        onSave={onSave}
        saveLabel="Save practice plan"
      />
    </div>
  );
}
