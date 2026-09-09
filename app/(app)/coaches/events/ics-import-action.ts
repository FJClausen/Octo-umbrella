"use server";

import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";
import type { ParsedEvent } from "./import-action";

const MAX_BYTES = 2_000_000;
const MAX_EVENTS = 200;

/** Unfold RFC 5545 continuation lines and split into property lines. */
function icsLines(raw: string): string[] {
  return raw.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").split("\n");
}

function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

/** Milliseconds a zone is ahead of UTC at the given instant. */
function tzOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second")
  );
  return asUtc - date.getTime();
}

/** Wall-clock time in a named zone -> the UTC instant it refers to. */
function zonedToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  timeZone: string
): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const first = tzOffsetMs(new Date(guess), timeZone);
  let ts = guess - first;
  // One refinement handles instants that land near a DST transition.
  const second = tzOffsetMs(new Date(ts), timeZone);
  if (second !== first) ts = guess - second;
  return new Date(ts);
}

type IcsTime =
  | { kind: "instant"; iso: string }
  | { kind: "date"; date: string }
  | null;

/** Parse DTSTART/DTEND with its parameters into an absolute instant where
 *  possible. Floating times (no zone, no Z) are kept as wall clock. */
function parseIcsTime(params: string, value: string): IcsTime {
  const v = value.trim();
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
  if (dateOnly) {
    return { kind: "date", date: `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}` };
  }
  const dt = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(v);
  if (!dt) return null;

  const [, ys, mos, ds, hs, mis, , zulu] = dt;
  const y = Number(ys);
  const mo = Number(mos);
  const d = Number(ds);
  const h = Number(hs);
  const mi = Number(mis);

  if (zulu) {
    return { kind: "instant", iso: new Date(Date.UTC(y, mo - 1, d, h, mi)).toISOString() };
  }

  const tzid = /TZID=([^;:]+)/i.exec(params)?.[1]?.replace(/^"|"$/g, "");
  if (tzid) {
    try {
      return { kind: "instant", iso: zonedToUtc(y, mo, d, h, mi, tzid).toISOString() };
    } catch {
      // Unknown zone id — fall through to floating handling.
    }
  }
  // Floating: hand back the literal wall clock, which the browser shows as-is.
  return {
    kind: "date",
    date: `${ys}-${mos}-${ds}T${hs}:${mis}`,
  };
}

const PRACTICE_WORDS = /\b(practice|training|session|skills)\b/i;
const GAME_WORDS = /\b(game|match|scrimmage|friendly|tournament|cup|league)\b/i;

function classify(summary: string): ParsedEvent["type"] {
  if (PRACTICE_WORDS.test(summary)) return "practice";
  if (GAME_WORDS.test(summary) || /\svs\.?\s|\s@\s/i.test(summary))
    return "game";
  return "event";
}

/** Strip a leading label like "Game:" or "U10 Girls -" from a summary. */
function stripLabel(summary: string): string {
  return summary.replace(/^[^:]{0,40}:\s*/, "").trim() || summary.trim();
}

function isUs(name: string): boolean {
  const ours = site.teamName.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const theirs = name.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  if (!theirs) return false;
  if (theirs.includes(ours) || ours.includes(theirs)) return true;
  // Fall back to distinctive words (drop generic club/age tokens).
  const stop = new Set([
    "fc", "sc", "club", "united", "girls", "boys", "u8", "u9", "u10", "u11",
    "u12", "team", "soccer",
  ]);
  const oursWords = ours.split(/\s+/).filter((w) => w.length > 2 && !stop.has(w));
  return oursWords.some((w) => theirs.includes(w));
}

/** Pull opponent + home/away out of a summary like "A vs B" or "A @ B". */
function splitMatchup(summary: string): {
  opponent: string | null;
  jersey_color: "blue" | "red" | null;
} {
  const text = stripLabel(summary);
  const vs = /^(.+?)\s+(?:vs\.?|v\.?)\s+(.+)$/i.exec(text);
  const at = /^(.+?)\s+(?:@|at)\s+(.+)$/i.exec(text);
  const m = vs ?? at;
  if (!m) return { opponent: null, jersey_color: null };

  const left = m[1].trim();
  const right = m[2].trim();
  const weAreLeft = isUs(left);
  const weAreRight = isUs(right);
  if (!weAreLeft && !weAreRight) return { opponent: null, jersey_color: null };

  const opponent = weAreLeft ? right : left;
  // "A vs B" = A hosts; "A @ B" = B hosts.
  const weHost = vs ? weAreLeft : weAreRight;
  return {
    opponent: opponent || null,
    jersey_color: weHost ? "blue" : "red",
  };
}

function splitDateTime(input: string): { date: string; time: string } {
  const [date, time] = input.split("T");
  return { date, time: time ?? "" };
}

export async function importFromIcsUrlAction(rawUrl: string): Promise<{
  events?: ParsedEvent[];
  existing?: string[];
  error?: string;
  note?: string;
}> {
  await requireCoach();

  const trimmed = rawUrl.trim();
  if (!trimmed) return { error: "Paste your calendar link first." };

  const url = trimmed.replace(/^webcal:\/\//i, "https://");
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { error: "That doesn't look like a calendar link." };
  }
  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    return { error: "Calendar links must start with https:// or webcal://" };
  }

  let raw: string;
  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: { Accept: "text/calendar, text/plain, */*" },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      return {
        error: `The calendar link returned ${response.status}. Check that you copied the whole link and that it's still active.`,
      };
    }
    raw = (await response.text()).slice(0, MAX_BYTES);
  } catch {
    return {
      error:
        "Couldn't reach that calendar link — check the link and your connection, then try again.",
    };
  }

  if (!/BEGIN:VCALENDAR/i.test(raw)) {
    return {
      error:
        "That link didn't return a calendar file. In PlayMetrics use Sync Calendar and copy the calendar link.",
    };
  }

  const events: ParsedEvent[] = [];
  let current: Record<string, { params: string; value: string }> | null = null;
  let sawRecurrence = false;

  for (const line of icsLines(raw)) {
    if (/^BEGIN:VEVENT/i.test(line)) {
      current = {};
      continue;
    }
    if (/^END:VEVENT/i.test(line)) {
      if (current) {
        const summary = unescapeText(current.SUMMARY?.value ?? "");
        const start = parseIcsTime(
          current.DTSTART?.params ?? "",
          current.DTSTART?.value ?? ""
        );
        if (summary && start) {
          const type = classify(summary);
          const { opponent, jersey_color } =
            type === "game"
              ? splitMatchup(summary)
              : { opponent: null, jersey_color: null };

          const end = parseIcsTime(
            current.DTEND?.params ?? "",
            current.DTEND?.value ?? ""
          );

          const base: ParsedEvent = {
            type,
            title:
              type === "game"
                ? "Game"
                : type === "practice"
                  ? "Practice"
                  : stripLabel(summary).slice(0, 80) || "Team Event",
            opponent,
            date: "",
            start_time: "",
            end_time: null,
            location: unescapeText(current.LOCATION?.value ?? "") || null,
            jersey_color,
          };

          if (start.kind === "instant") {
            base.start_iso = start.iso;
            if (end?.kind === "instant") base.end_iso = end.iso;
          } else {
            const s = splitDateTime(start.date);
            base.date = s.date;
            base.start_time = s.time;
            if (end?.kind === "date") {
              const e = splitDateTime(end.date);
              base.end_time = e.time || null;
            }
          }
          events.push(base);
        }
      }
      current = null;
      continue;
    }
    if (!current) continue;
    if (/^RRULE[:;]/i.test(line)) sawRecurrence = true;

    const sep = line.indexOf(":");
    if (sep < 1) continue;
    const head = line.slice(0, sep);
    const value = line.slice(sep + 1);
    const semi = head.indexOf(";");
    const name = (semi === -1 ? head : head.slice(0, semi)).toUpperCase();
    const params = semi === -1 ? "" : head.slice(semi + 1);
    current[name] = { params, value };
    if (events.length >= MAX_EVENTS) break;
  }

  if (!events.length) {
    return { error: "No events found in that calendar." };
  }

  // Hand back what's already on the calendar so the browser — which is the
  // only side that knows the coach's local wall time for absolute
  // timestamps — can flag re-imports instead of creating duplicates.
  const supabase = createClient();
  const { data: existing } = await supabase.from("events").select("starts_at");

  return {
    events: events.slice(0, MAX_EVENTS),
    existing: (existing ?? []).map((e) => e.starts_at.slice(0, 16)),
    note: sawRecurrence
      ? "Some entries repeat via a rule; only the dates listed in the file were read, so double-check recurring practices."
      : undefined,
  };
}
