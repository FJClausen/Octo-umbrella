// In-progress practice-session drafts, kept in localStorage so nothing is
// lost while the coach browses the exercise catalogue to pick exercises.

export type PlanSection = "warmup" | "exercises" | "scrimmages";

export const PLAN_SECTIONS: { key: PlanSection; label: string }[] = [
  { key: "warmup", label: "Warmup" },
  { key: "exercises", label: "Exercises" },
  { key: "scrimmages", label: "Scrimmage" },
];

export type PlanDraft = {
  sessionDate?: string;
  warmup?: string[];
  exercises?: string[];
  scrimmages?: string[];
  notes?: string;
};

function storageKey(draftKey: string): string {
  return `mr-plan-draft-${draftKey}`;
}

export function readPlanDraft(draftKey: string): PlanDraft | null {
  try {
    const raw = localStorage.getItem(storageKey(draftKey));
    return raw ? (JSON.parse(raw) as PlanDraft) : null;
  } catch {
    return null;
  }
}

export function writePlanDraft(draftKey: string, draft: PlanDraft): void {
  try {
    localStorage.setItem(storageKey(draftKey), JSON.stringify(draft));
  } catch {
    // Storage full or unavailable — selections just won't survive navigation.
  }
}

export function clearPlanDraft(draftKey: string): void {
  try {
    localStorage.removeItem(storageKey(draftKey));
  } catch {
    // ignore
  }
}
