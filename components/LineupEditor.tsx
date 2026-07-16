"use client";

import { useState, useTransition } from "react";
import {
  FORMATIONS,
  blankSlotsFor,
  type FormationKey,
  type LineupSlot,
} from "@/lib/site";

type PlayerOption = { id: string; first_name: string };

export function LineupEditor({
  initialFormationKey,
  initialSlots,
  initialPlan,
  players,
  onSave,
  saveLabel = "Save lineup",
}: {
  initialFormationKey: FormationKey;
  initialSlots: LineupSlot[];
  initialPlan: string;
  players: PlayerOption[];
  onSave: (
    formationKey: string,
    slots: LineupSlot[],
    plan: string
  ) => Promise<{ error?: string } | void>;
  saveLabel?: string;
}) {
  const [formationKey, setFormationKey] = useState<FormationKey>(
    initialFormationKey
  );
  const [slots, setSlots] = useState<LineupSlot[]>(
    initialSlots.length ? initialSlots : blankSlotsFor(initialFormationKey)
  );
  const [plan, setPlan] = useState(initialPlan);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFormationChange(key: FormationKey) {
    setFormationKey(key);
    setSlots(blankSlotsFor(key));
    setSaved(false);
  }

  function updateSlot(index: number, patch: Partial<LineupSlot>) {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await onSave(formationKey, slots, plan);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Formation</label>
        <select
          className="input"
          value={formationKey}
          onChange={(e) => handleFormationChange(e.target.value as FormationKey)}
        >
          {Object.entries(FORMATIONS).map(([key, f]) => (
            <option key={key} value={key}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {slots.map((slot, i) => (
          <div
            key={`${formationKey}-${slot.slot}`}
            className="grid gap-2 rounded-lg border border-slate-200 p-2 sm:grid-cols-3"
          >
            <div className="flex items-center text-sm font-medium text-slate-600">
              {slot.slot}
            </div>
            <select
              className="input"
              value={slot.playerId ?? ""}
              onChange={(e) =>
                updateSlot(i, { playerId: e.target.value || null })
              }
            >
              <option value="">— unassigned —</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name}
                </option>
              ))}
            </select>
            <input
              className="input"
              placeholder="Short note (optional)"
              value={slot.note ?? ""}
              onChange={(e) => updateSlot(i, { note: e.target.value || null })}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="label">General notes</label>
        <textarea
          className="input"
          rows={3}
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value);
            setSaved(false);
          }}
          placeholder="Substitution plan, overall strategy…"
        />
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
    </div>
  );
}
