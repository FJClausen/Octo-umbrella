"use client";

import { useState, useTransition } from "react";
import { PracticePlanEditor } from "@/components/PracticePlanEditor";
import { clearPlanDraft } from "@/lib/planDraft";
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
  const [focus, setFocus] = useState<string[]>([]);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [generation, setGeneration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleFocus(area: string) {
    setFocus((prev) =>
      prev.includes(area) ? prev.filter((f) => f !== area) : [...prev, area]
    );
  }

  function generate() {
    setError(null);
    startTransition(async () => {
      const res = await generatePracticePlanAction(focus);
      if (res.error) {
        setError(res.error);
      } else if (res.plan) {
        // Replace any in-progress draft so the remounted editor picks up
        // the freshly generated plan.
        clearPlanDraft("new");
        setPlan(res.plan);
        setGeneration((g) => g + 1);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-brand-blue/30 bg-brand-blue-light/30 p-3">
        <p className="mb-2 text-sm font-medium text-brand-blue-dark">
          ✨ Let AI plan this session from your saved exercises — pick one or
          more focus areas
        </p>
        <div className="flex flex-wrap gap-2">
          {FOCUS_AREAS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => toggleFocus(f)}
              className={`badge transition ${
                focus.includes(f)
                  ? "bg-brand-blue text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={isPending || focus.length === 0}
          className="btn-blue mt-2 disabled:opacity-50"
        >
          {isPending
            ? "Planning…"
            : plan
              ? "↻ Replan"
              : focus.length === 0
                ? "✨ Plan session (pick a focus first)"
                : `✨ Plan ${focus.join(" + ")} session`}
        </button>
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
        draftKey="new"
        initialSessionDate={initialSessionDate}
        initialWarmup={plan?.warmup ?? ""}
        initialExercises={plan?.drills.join("\n") ?? ""}
        initialScrimmages={plan?.scrimmage ?? ""}
        initialNotes={plan?.concept ? `💡 ${plan.concept}` : ""}
        templates={templates}
        onSave={onSave}
        saveLabel="Save practice plan"
      />
    </div>
  );
}
