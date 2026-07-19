"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  parseScheduleAction,
  type ParsedEvent,
} from "@/app/(app)/coaches/events/import-action";
import { createEventsBulk } from "@/app/(app)/coaches/events/actions";

const TYPE_ICON: Record<ParsedEvent["type"], string> = {
  game: "⚽",
  practice: "🏃",
  event: "🎉",
};

function describe(e: ParsedEvent): string {
  const day = new Date(`${e.date}T${e.start_time || "00:00"}`);
  const when = day.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = e.start_time
    ? day.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : "";
  return [
    e.title + (e.opponent ? ` vs ${e.opponent}` : ""),
    `— ${when}${time ? `, ${time}` : ""}`,
    e.location ? `@ ${e.location}` : "",
    e.jersey_color ? `(${e.jersey_color === "blue" ? "🔵 home" : "🔴 away"})` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function ImportSchedule() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedEvent[] | null>(null);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function parse() {
    setError(null);
    setDone(null);
    startTransition(async () => {
      const res = await parseScheduleAction(text);
      if (res.error) {
        setError(res.error);
      } else if (res.events) {
        setParsed(res.events);
        setChecked(res.events.map(() => true));
      }
    });
  }

  function importChecked() {
    if (!parsed) return;
    const selected = parsed.filter((_, i) => checked[i]);
    setError(null);
    startTransition(async () => {
      const res = await createEventsBulk(
        selected.map((e) => ({
          type: e.type,
          title: e.title,
          opponent: e.opponent,
          location: e.location,
          starts_at: `${e.date}T${e.start_time || "09:00"}`,
          ends_at: e.end_time ? `${e.date}T${e.end_time}` : null,
          jersey_color: e.jersey_color,
        }))
      );
      if (res.error) {
        setError(res.error);
      } else {
        setDone(res.created ?? 0);
        setParsed(null);
        setText("");
        router.refresh();
      }
    });
  }

  return (
    <details className="card border-brand-blue/30 p-4">
      <summary className="cursor-pointer font-semibold text-brand-blue">
        📥 Import season schedule with AI
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-sm text-slate-500">
          Paste the league schedule — copied from the league website, an
          email, a PDF, or an iCal export — and the AI turns it into events.
          You review the list before anything is created.
        </p>
        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input font-mono text-xs"
          placeholder={"Sep 12  9:00 AM  Mundo Rainbows vs Thunder  Riverside Field 1\nSep 19 10:30 AM  Storm vs Mundo Rainbows  Central Park 3\n…"}
        />
        <button
          type="button"
          onClick={parse}
          disabled={isPending || !text.trim()}
          className="btn-blue"
        >
          {isPending && !parsed ? "Reading schedule…" : "Preview events"}
        </button>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {done != null ? (
          <p className="rounded-lg bg-brand-green-light px-3 py-2 text-sm text-brand-green-dark">
            ✅ Added {done} event{done === 1 ? "" : "s"} to the calendar.
          </p>
        ) : null}

        {parsed ? (
          <div className="space-y-2 rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-medium text-slate-700">
              Found {parsed.length} event{parsed.length === 1 ? "" : "s"} —
              uncheck any you don’t want:
            </p>
            <ul className="space-y-1.5">
              {parsed.map((e, i) => (
                <li key={i}>
                  <label className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={checked[i] ?? false}
                      onChange={() =>
                        setChecked((prev) =>
                          prev.map((c, j) => (j === i ? !c : c))
                        )
                      }
                      className="mt-0.5"
                    />
                    <span>
                      {TYPE_ICON[e.type]} {describe(e)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={importChecked}
              disabled={isPending || !checked.some(Boolean)}
              className="btn-primary"
            >
              {isPending
                ? "Adding…"
                : `Add ${checked.filter(Boolean).length} event${
                    checked.filter(Boolean).length === 1 ? "" : "s"
                  }`}
            </button>
          </div>
        ) : null}
      </div>
    </details>
  );
}
