"use client";

import { useState, useTransition } from "react";
import { formatDate } from "@/lib/format";

type EventOption = { id: string; title: string; starts_at: string };
type Template = { id: string; title: string; description: string };

function FieldWithTemplates({
  label,
  value,
  setValue,
  templates,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  templates: Template[];
}) {
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
                setValue(value ? `${value}\n${t.description}` : t.description);
              }
              e.target.value = "";
            }}
          >
            <option value="">+ Insert saved exercise…</option>
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
    </div>
  );
}

export function PracticePlanEditor({
  initialEventId,
  initialSessionDate,
  initialWarmup = "",
  initialExercises = "",
  initialScrimmages = "",
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
  events: EventOption[];
  templates: Template[];
  onSave: (
    eventId: string | null,
    sessionDate: string,
    warmup: string,
    exercises: string,
    scrimmages: string
  ) => Promise<void>;
  saveLabel?: string;
}) {
  const [eventId, setEventId] = useState(initialEventId ?? "");
  const [sessionDate, setSessionDate] = useState(initialSessionDate);
  const [warmup, setWarmup] = useState(initialWarmup);
  const [exercises, setExercises] = useState(initialExercises);
  const [scrimmages, setScrimmages] = useState(initialScrimmages);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await onSave(eventId || null, sessionDate, warmup, exercises, scrimmages);
      setSaved(true);
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
      />
      <FieldWithTemplates
        label="Exercises"
        value={exercises}
        setValue={(v) => {
          setExercises(v);
          setSaved(false);
        }}
        templates={templates}
      />
      <FieldWithTemplates
        label="Scrimmages"
        value={scrimmages}
        setValue={(v) => {
          setScrimmages(v);
          setSaved(false);
        }}
        templates={templates}
      />

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
    </div>
  );
}
