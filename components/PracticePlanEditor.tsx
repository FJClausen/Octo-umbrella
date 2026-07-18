"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { formatDate } from "@/lib/format";
import { EXERCISE_TAG_STYLES, type ExerciseTag } from "@/lib/site";

type EventOption = { id: string; title: string; starts_at: string };
type Template = {
  id: string;
  title: string;
  setup: string | null;
  run_of_play: string | null;
  tags: string[] | null;
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
        {(exercise.tags ?? []).length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
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

function FieldWithTemplates({
  label,
  value,
  setValue,
  templates,
  onOpenExercise,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  templates: Template[];
  onOpenExercise: (t: Template) => void;
}) {
  // Any saved exercise whose title appears in the field text gets a
  // clickable chip below the field (also matches plans saved before
  // this feature, which pasted the full text including the title).
  const linked = templates.filter(
    (t) => t.title && value.toLowerCase().includes(t.title.toLowerCase())
  );

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="label mb-0">{label}</label>
        {templates.length > 0 ? (
          <select
            className="rounded border border-slate-300 text-xs text-slate-600"
            defaultValue=""
            onChange={(e) => {
              const templateId = e.target.value;
              const t = templates.find((tpl) => tpl.id === templateId);
              if (t) {
                setValue(value ? `${value}\n${t.title}` : t.title);
              }
              e.target.value = "";
            }}
          >
            <option value="">+ Insert a saved exercise…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <textarea
        className="input"
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {linked.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {linked.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onOpenExercise(t)}
              className="badge bg-brand-blue-light text-brand-blue-dark transition hover:bg-brand-blue hover:text-white"
            >
              🔗 {t.title}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PracticePlanEditor({
  initialEventId,
  initialSessionDate,
  initialWarmup = "",
  initialExercises = "",
  initialScrimmages = "",
  initialImageUrl = null,
  events,
  templates,
  onSave,
  saveLabel = "Save practice plan",
}: {
  initialEventId?: string | null;
  initialSessionDate: string;
  initialWarmup?: string;
  initialExercises?: string;
  initialScrimmages?: string;
  initialImageUrl?: string | null;
  events: EventOption[];
  templates: Template[];
  onSave: (formData: FormData) => Promise<{ error?: string } | void>;
  saveLabel?: string;
}) {
  const [eventId, setEventId] = useState(initialEventId ?? "");
  const [sessionDate, setSessionDate] = useState(initialSessionDate);
  const [warmup, setWarmup] = useState(initialWarmup);
  const [exercises, setExercises] = useState(initialExercises);
  const [scrimmages, setScrimmages] = useState(initialScrimmages);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openExercise, setOpenExercise] = useState<Template | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("event_id", eventId);
      formData.set("session_date", sessionDate);
      formData.set("warmup", warmup);
      formData.set("exercises", exercises);
      formData.set("scrimmages", scrimmages);
      const file = imageInputRef.current?.files?.[0];
      if (file) formData.set("image", file);

      const result = await onSave(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
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
        </div>
        <div>
          <label className="label">Linked practice (optional)</label>
          <select
            className="input"
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value);
              setSaved(false);
            }}
          >
            <option value="">— none —</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({formatDate(e.starts_at)})
              </option>
            ))}
          </select>
        </div>
      </div>

      <FieldWithTemplates
        label="Warmup"
        value={warmup}
        setValue={(v) => {
          setWarmup(v);
          setSaved(false);
        }}
        templates={templates}
        onOpenExercise={setOpenExercise}
      />
      <FieldWithTemplates
        label="Exercises"
        value={exercises}
        setValue={(v) => {
          setExercises(v);
          setSaved(false);
        }}
        templates={templates}
        onOpenExercise={setOpenExercise}
      />
      <FieldWithTemplates
        label="Scrimmages"
        value={scrimmages}
        setValue={(v) => {
          setScrimmages(v);
          setSaved(false);
        }}
        templates={templates}
        onOpenExercise={setOpenExercise}
      />

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
