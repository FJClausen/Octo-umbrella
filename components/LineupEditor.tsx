"use client";

import { useState, useTransition } from "react";
import {
  FORMATIONS,
  blankSlotsFor,
  type FormationKey,
  type LineupSlot,
} from "@/lib/site";

type PlayerOption = { id: string; first_name: string };
type AvailablePlayer = { id: string; positions: string[] };

export function LineupEditor({
  initialFormationKey,
  initialSlots,
  initialPlan,
  players,
  availablePlayers,
  onSave,
  saveLabel = "Save lineup",
}: {
  initialFormationKey: FormationKey;
  initialSlots: LineupSlot[];
  initialPlan: string;
  players: PlayerOption[];
  /** Players who RSVP'd "going" (with their positions) — enables auto-suggest. */
  availablePlayers?: AvailablePlayer[];
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
  // Slot assignments are kept per formation, so switching formations (to
  // compare, or by accident) never wipes work — switching back restores it.
  const [slotsByFormation, setSlotsByFormation] = useState<
    Partial<Record<FormationKey, LineupSlot[]>>
  >({
    [initialFormationKey]: initialSlots.length
      ? initialSlots
      : blankSlotsFor(initialFormationKey),
  });
  const [plan, setPlan] = useState(initialPlan);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slots = slotsByFormation[formationKey] ?? blankSlotsFor(formationKey);

  function handleFormationChange(key: FormationKey) {
    setFormationKey(key);
    setSlotsByFormation((prev) => {
      if (prev[key]) return prev; // already visited: restore as-is
      // First visit: seed the new formation by carrying over players/notes
      // from same-named slots in the current formation (e.g. "Goalkeeper",
      // "Defender 1" exist in most presets).
      const current = prev[formationKey] ?? [];
      const bySlotName = new Map(current.map((s) => [s.slot, s]));
      const seeded = blankSlotsFor(key).map((s) => {
        const match = bySlotName.get(s.slot);
        return match
          ? { ...s, playerId: match.playerId, note: match.note }
          : s;
      });
      return { ...prev, [key]: seeded };
    });
    setSaved(false);
  }

  function updateSlot(index: number, patch: Partial<LineupSlot>) {
    setSlotsByFormation((prev) => {
      const current = prev[formationKey] ?? blankSlotsFor(formationKey);
      return {
        ...prev,
        [formationKey]: current.map((s, i) =>
          i === index ? { ...s, ...patch } : s
        ),
      };
    });
    setSaved(false);
  }

  /**
   * Fill the current formation from the players who RSVP'd "going":
   * first pass matches players to slots by position, second pass places
   * any remaining available players into still-empty slots.
   */
  function suggestLineup() {
    const pool = availablePlayers ?? [];
    if (!pool.length) return;

    const used = new Set<string>();
    const next = slots.map((s) => ({ ...s, playerId: null as string | null }));

    for (const slot of next) {
      const match = pool.find(
        (p) => !used.has(p.id) && p.positions.includes(slot.position)
      );
      if (match) {
        slot.playerId = match.id;
        used.add(match.id);
      }
    }
    for (const slot of next) {
      if (slot.playerId) continue;
      const anyone = pool.find((p) => !used.has(p.id));
      if (anyone) {
        slot.playerId = anyone.id;
        used.add(anyone.id);
      }
    }

    setSlotsByFormation((prev) => ({ ...prev, [formationKey]: next }));
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
        <p className="mt-1 text-xs text-slate-400">
          You can switch formations to compare without losing your work —
          hitting Save stores the formation currently shown.
        </p>
      </div>

      {availablePlayers && availablePlayers.length > 0 ? (
        <button
          type="button"
          onClick={suggestLineup}
          className="btn-outline text-sm"
        >
          ✨ Suggest lineup from RSVPs ({availablePlayers.length} going)
        </button>
      ) : null}

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
