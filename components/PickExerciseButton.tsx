"use client";

import { useEffect, useState } from "react";
import {
  readPlanDraft,
  writePlanDraft,
  type PlanSection,
} from "@/lib/planDraft";

/** "＋ Add" toggle shown on catalogue cards while picking exercises for a
 *  practice-session section. Writes to the session draft in localStorage. */
export function PickExerciseButton({
  draftKey,
  section,
  title,
}: {
  draftKey: string;
  section: PlanSection;
  title: string;
}) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const draft = readPlanDraft(draftKey);
    setAdded((draft?.[section] ?? []).includes(title));
  }, [draftKey, section, title]);

  function toggle(e: React.MouseEvent) {
    // Inside a <summary> — don't expand/collapse the card.
    e.preventDefault();
    e.stopPropagation();
    const draft = readPlanDraft(draftKey) ?? {};
    const list = draft[section] ?? [];
    const next = list.includes(title)
      ? list.filter((t) => t !== title)
      : [...list, title];
    writePlanDraft(draftKey, { ...draft, [section]: next });
    setAdded(next.includes(title));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`badge shrink-0 transition ${
        added
          ? "bg-brand-green text-white"
          : "border border-brand-blue/40 bg-white text-brand-blue hover:bg-brand-blue-light"
      }`}
    >
      {added ? "✓ Added" : "＋ Add"}
    </button>
  );
}
