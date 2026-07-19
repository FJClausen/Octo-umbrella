"use client";

import { useState } from "react";
import { format } from "date-fns";
import { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/lib/site";
import type { EventRow } from "@/lib/types";

function toInputDT(value?: string | null): string {
  if (!value) return "";
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}

/** Event create/edit fields — only shows what's relevant for the chosen
 *  type (opponent, jerseys, and score are game-only). */
export function EventFields({ event }: { event?: EventRow }) {
  const [type, setType] = useState(event?.type ?? "game");
  const isGame = type === "game";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label">Type</label>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Title (optional)</label>
        <input
          name="title"
          defaultValue={event?.title ?? ""}
          className="input"
          placeholder="Defaults to Game / Practice / Team Event"
        />
      </div>
      {isGame ? (
        <>
          <div>
            <label className="label">Opponent</label>
            <input
              name="opponent"
              defaultValue={event?.opponent ?? ""}
              className="input"
              placeholder="e.g. Northside United"
            />
          </div>
          <div>
            <label className="label">Jersey color</label>
            <select
              name="jersey_color"
              defaultValue={event?.jersey_color ?? ""}
              className="input"
            >
              <option value="">— not set —</option>
              <option value="blue">🔵 Blue (home game)</option>
              <option value="red">🔴 Red (away game)</option>
            </select>
          </div>
        </>
      ) : null}
      <div>
        <label className="label">Location</label>
        <input
          name="location"
          defaultValue={event?.location ?? ""}
          className="input"
          placeholder="e.g. Riverside Field 1"
        />
      </div>
      <div>
        <label className="label">Starts</label>
        <input
          type="datetime-local"
          name="starts_at"
          required
          defaultValue={toInputDT(event?.starts_at)}
          className="input"
        />
      </div>
      <div>
        <label className="label">Ends (optional)</label>
        <input
          type="datetime-local"
          name="ends_at"
          defaultValue={toInputDT(event?.ends_at)}
          className="input"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Notes (optional)</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={event?.notes ?? ""}
          className="input"
          placeholder="Arrive 30 minutes early…"
        />
      </div>
      {isGame ? (
        <div className="sm:col-span-2">
          <label className="label">
            Final score (fill in after playing)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="score_us"
              min={0}
              defaultValue={event?.score_us ?? ""}
              className="input w-24"
              placeholder="Us"
            />
            <span className="text-slate-400">–</span>
            <input
              type="number"
              name="score_them"
              min={0}
              defaultValue={event?.score_them ?? ""}
              className="input w-24"
              placeholder="Them"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
