"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  DIFFICULTY_STYLES,
  EXERCISE_TAG_STYLES,
  type Difficulty,
  type ExerciseTag,
} from "@/lib/site";
import {
  PLAN_SECTIONS,
  readPlanDraft,
  writePlanDraft,
  clearPlanDraft,
  type PlanSection,
} from "@/lib/planDraft";

type Template = {
  id: string;
  title: string;
  setup: string | null;
  run_of_play: string | null;
  tags: string[] | null;
  difficulty: string | null;
  image_url: string | null;
};

/** Pop-out view of a full saved exercise (diagram included). Closing it
 *  simply returns to the practice-session form underneath. */
function ExerciseModal({
  exercise,
  onClose,
}: {
  exercise: Template;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-brand-ink">
            {exercise.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full px-2 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ×
          </button>
        </div>
        {(exercise.tags ?? []).length > 0 || exercise.difficulty ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {exercise.difficulty ? (
              <span
                className={`badge ${
                  DIFFICULTY_STYLES[exercise.difficulty as Difficulty] ??
                  "bg-slate-100 text-slate-600"
                }`}
              >
                {exercise.difficulty}
              </span>
            ) : null}
            {(exercise.tags ?? []).map((tag) => (
              <span
                key={tag}
                className={`badge ${
                  EXERCISE_TAG_STYLES[tag as ExerciseTag] ??
                  "bg-slate-100 text-slate-600"
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        {exercise.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exercise.image_url}
            alt={exercise.title}
            className="mt-3 w-full rounded-lg"
          />
        ) : null}
        {exercise.setup ? (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Setup
            </p>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {exercise.setup}
            </p>
          </div>
        ) : null}
        {exercise.run_of_play ? (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Run of play
            </p>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {exercise.run_of_play}
            </p>
          </div>
        ) : null}
        <button type="button" onClick={onClose} className="btn-outline mt-4">
          Back to practice session
        </button>
      </div>
    </div>
  );
}

function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function PracticePlanEditor({
  draftKey,
  initialSessionDate,
  initialWarmup = "",
  initialExercises = "",
  initialScrimmages = "",
  initialNotes = "",
  initialImageUrl = null,
  templates,
  onSave,
  saveLabel = "Save practice plan",
}: {
  /** Identifies this plan's in-progress draft ("new" or the plan id). */
  draftKey: string;
  initialSessionDate: string;
  initialWarmup?: string;
  initialExercises?: string;
  initialScrimmages?: string;
  initialNotes?: string;
  initialImageUrl?: string | null;
  templates: Template[];
  onSave: (formData: FormData) => Promise<{ error?: string } | void>;
  saveLabel?: string;
}) {
  const [sessionDate, setSessionDate] = useState(initialSessionDate);
  const [sections, setSections] = useState<Record<PlanSection, string[]>>({
    warmup: parseLines(initialWarmup),
    exercises: parseLines(initialExercises),
    scrimmages: parseLines(initialScrimmages),
  });
  const [notes, setNotes] = useState(initialNotes);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openExercise, setOpenExercise] = useState<Template | null>(null);
  const loadedRef = useRef(false);

  // Pick up the in-progress draft (e.g. returning from the catalogue picker).
  useEffect(() => {
    const draft = readPlanDraft(draftKey);
    if (draft) {
      if (draft.sessionDate) setSessionDate(draft.sessionDate);
      setSections({
        warmup: draft.warmup ?? [],
        exercises: draft.exercises ?? [],
        scrimmages: draft.scrimmages ?? [],
      });
      if (draft.notes != null) setNotes(draft.notes);
    }
    loadedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the draft in sync so nothing is lost while browsing the catalogue.
  useEffect(() => {
    if (!loadedRef.current) return;
    writePlanDraft(draftKey, { sessionDate, ...sections, notes });
  }, [draftKey, sessionDate, sections, notes]);

  function removeItem(section: PlanSection, index: number) {
    setSections((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("session_date", sessionDate);
      formData.set("warmup", sections.warmup.join("\n"));
      formData.set("exercises", sections.exercises.join("\n"));
      formData.set("scrimmages", sections.scrimmages.join("\n"));
      formData.set("notes", notes);
      const file = imageInputRef.current?.files?.[0];
      if (file) formData.set("image", file);

      const result = await onSave(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        clearPlanDraft(draftKey);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Session date</label>
        <input
          type="date"
          className="input"
          value={sessionDate}
          onChange={(e) => {
            setSessionDate(e.target.value);
            setSaved(false);
          }}
          required
        />
        <p className="mt-1 text-xs text-slate-500">
          A practice on this date in the calendar is linked automatically.
        </p>
      </div>

      {PLAN_SECTIONS.map(({ key, label }) => (
        <div key={key}>
          {/* Heading links to the catalogue in pick-mode for this section */}
          <Link
            href={`/coaches/practice/exercises?pick=${key}&draft=${draftKey}`}
            className="flex items-center justify-between rounded-lg border border-dashed border-brand-blue/40 bg-brand-blue-light/20 px-3 py-2 transition hover:bg-brand-blue-light/50"
          >
            <span className="font-semibold text-brand-ink">{label}</span>
            <span className="text-sm text-brand-blue">
              ＋ choose from catalogue
            </span>
          </Link>
          {sections[key].length > 0 ? (
            <ul className="mt-1.5 space-y-1.5">
              {sections[key].map((title, i) => {
                const t = templates.find(
                  (tpl) => tpl.title.toLowerCase() === title.toLowerCase()
                );
                return (
                  <li
                    key={`${title}-${i}`}
                    className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    {t ? (
                      <button
                        type="button"
                        onClick={() => setOpenExercise(t)}
                        className="text-left font-medium text-brand-blue hover:underline"
                      >
                        🔗 {t.title}
                      </button>
                    ) : (
                      <span className="text-slate-600">{title}</span>
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${title}`}
                      onClick={() => removeItem(key, i)}
                      className="px-1 text-slate-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              Nothing selected yet.
            </p>
          )}
        </div>
      ))}

      <div>
        <label className="label">Coach’s notes</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setSaved(false);
          }}
          className="input"
          placeholder="Session concept, things to emphasize, reminders…"
        />
      </div>

      <div>
        <label className="label">
          Attach a photo or note (optional — e.g. drill diagram)
        </label>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="text-sm"
          onChange={() => setSaved(false)}
        />
        {initialImageUrl ? (
          <p className="mt-1 text-xs text-slate-500">
            📎 Photo attached —{" "}
            <a
              href={initialImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-blue underline"
            >
              view
            </a>{" "}
            (uploading a new one replaces it)
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="btn-primary"
        >
          {isPending ? "Saving…" : saveLabel}
        </button>
        {saved && !isPending ? (
          <span className="text-sm text-brand-green-dark">Saved ✓</span>
        ) : null}
      </div>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Couldn’t save: {error}
        </p>
      ) : null}

      {openExercise ? (
        <ExerciseModal
          exercise={openExercise}
          onClose={() => setOpenExercise(null)}
        />
      ) : null}
    </div>
  );
}
