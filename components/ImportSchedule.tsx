"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui";
import {
  parseScheduleAction,
  type ParsedEvent,
} from "@/app/(app)/coaches/events/import-action";
import { importFromIcsUrlAction } from "@/app/(app)/coaches/events/ics-import-action";
import {
  createEventsBulk,
  postScheduleNews,
} from "@/app/(app)/coaches/events/actions";

const TYPE_ICON: Record<ParsedEvent["type"], string> = {
  game: "⚽",
  practice: "🏃",
  event: "🎉",
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Absolute timestamps from a calendar feed are shown in the coach's own
 *  timezone — that's the wall-clock time everyone turns up at. */
function toLocalParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function normalize(e: ParsedEvent): ParsedEvent {
  if (!e.start_iso) return e;
  const start = toLocalParts(e.start_iso);
  const end = e.end_iso ? toLocalParts(e.end_iso) : null;
  return {
    ...e,
    date: start.date,
    start_time: start.time,
    end_time: end && end.date === start.date ? end.time : null,
  };
}

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
    e.jersey_color
      ? `(${e.jersey_color === "blue" ? "🔵 home" : "🔴 away"})`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function ImportSchedule() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedEvent[] | null>(null);
  const [duplicates, setDuplicates] = useState<boolean[]>([]);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const [newsPosted, setNewsPosted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function receive(events: ParsedEvent[], existing: string[] = []) {
    const normalized = events.map(normalize);
    const seen = new Set(existing);
    const dupes = normalized.map((e) =>
      seen.has(`${e.date}T${e.start_time}`)
    );
    setParsed(normalized);
    setDuplicates(dupes);
    // Anything already on the calendar starts unchecked.
    setChecked(dupes.map((d) => !d));
  }

  function fetchFromLink() {
    setError(null);
    setNote(null);
    setDone(null);
    startTransition(async () => {
      const res = await importFromIcsUrlAction(url);
      if (res.error) setError(res.error);
      else if (res.events) {
        receive(res.events, res.existing ?? []);
        setNote(res.note ?? null);
      }
    });
  }

  function parseText() {
    setError(null);
    setNote(null);
    setDone(null);
    startTransition(async () => {
      const res = await parseScheduleAction(text);
      if (res.error) setError(res.error);
      else if (res.events) receive(res.events);
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

  const selectedCount = checked.filter(Boolean).length;
  const dupeCount = duplicates.filter(Boolean).length;

  return (
    <details className="card border-brand-blue/30 p-4">
      <summary className="cursor-pointer font-semibold text-brand-blue">
        ✨ Import season schedule
      </summary>
      <div className="mt-3 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-brand-ink">
            From your club’s calendar link
          </p>
          <p className="text-sm text-slate-500">
            In PlayMetrics open the Calendar, tap <strong>Sync Calendar</strong>
            , pick the team, and copy the calendar link — then paste it here.
          </p>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input font-mono text-xs"
            placeholder="webcal://… or https://…/calendar.ics"
          />
          <button
            type="button"
            onClick={fetchFromLink}
            disabled={isPending || !url.trim()}
            className="btn-blue"
          >
            {isPending ? "Reading calendar…" : "Preview events"}
          </button>
        </div>

        <details className="rounded-lg border border-slate-200 p-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-600">
            No link? Paste the schedule instead
          </summary>
          <div className="mt-2 space-y-2">
            <p className="text-sm text-slate-500">
              Paste a schedule copied from a website, an email, or a PDF and
              the AI turns it into events.
            </p>
            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="input font-mono text-xs"
              placeholder={
                "Sep 12  9:00 AM  Mundo Rainbows vs Thunder  Riverside Field 1\nSep 19 10:30 AM  Storm vs Mundo Rainbows  Central Park 3\n…"
              }
            />
            <button
              type="button"
              onClick={parseText}
              disabled={isPending || !text.trim()}
              className="btn-blue"
            >
              {isPending ? "Reading schedule…" : "Preview events"}
            </button>
          </div>
        </details>

        {error ? <Alert variant="error">{error}</Alert> : null}
        {note ? <Alert variant="warning">{note}</Alert> : null}
        {done != null ? (
          <Alert variant="success">
            <p>
              Added {done} event{done === 1 ? "" : "s"} to the calendar.
            </p>
            {newsPosted ? (
              <p className="mt-1">Posted to team news.</p>
            ) : (
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    const res = await postScheduleNews(done);
                    if (res.error) setError(res.error);
                    else setNewsPosted(true);
                  })
                }
                disabled={isPending}
                className="mt-1 font-medium underline underline-offset-2"
              >
                Post to team news so parents know?
              </button>
            )}
          </Alert>
        ) : null}

        {parsed ? (
          <div className="space-y-2 rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-medium text-slate-700">
              Found {parsed.length} event{parsed.length === 1 ? "" : "s"} —
              review before adding
              {dupeCount > 0
                ? `; ${dupeCount} already on your calendar ${
                    dupeCount === 1 ? "is" : "are"
                  } unchecked`
                : ""}
              :
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
                    <span className={duplicates[i] ? "text-slate-400" : ""}>
                      {TYPE_ICON[e.type]} {describe(e)}
                      {duplicates[i] ? " · already added" : ""}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={importChecked}
              disabled={isPending || selectedCount === 0}
              className="btn-primary"
            >
              {isPending
                ? "Adding…"
                : `Add ${selectedCount} event${selectedCount === 1 ? "" : "s"}`}
            </button>
          </div>
        ) : null}
      </div>
    </details>
  );
}
