import { site } from "@/lib/site";

/**
 * Event times are stored as plain wall-clock strings ("2026-09-12T09:00"),
 * with no timezone. The server runs on UTC, so comparing those against
 * `new Date()` is wrong by the team's UTC offset — on the US East Coast
 * that silently moved evening events into "past" from 8pm onwards.
 * Everything here works in the team's own timezone instead.
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** "Now" as the team experiences it, as a naive (timezone-less) Date. */
function teamNow(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: site.timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  // hour can come back as 24 at midnight under hour12: false.
  return new Date(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second")
  );
}

/** Wall clock in the team's timezone, shifted by `minutes`, as stored. */
export function teamWallClock(minutes = 0): string {
  const d = teamNow();
  d.setMinutes(d.getMinutes() + minutes);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/** Today's date in the team's timezone, "YYYY-MM-DD". */
export function teamToday(): string {
  return teamWallClock().slice(0, 10);
}

/** Date `days` from today in the team's timezone, "YYYY-MM-DD". */
export function teamDateIn(days: number): string {
  return teamWallClock(days * 24 * 60).slice(0, 10);
}

/**
 * Assumed length of an event with no end time recorded. Imported games and
 * practices usually carry a real `ends_at`, which is always preferred.
 */
const ASSUMED_DURATION_MINUTES = 90;

/** How far back to fetch, so nothing still in progress is missed. */
const FETCH_WINDOW_MINUTES = 6 * 60;

/**
 * Lower bound for "might still be upcoming" when querying the database.
 * Deliberately generous — narrow the result with `eventFinishedCheck`,
 * which knows about end times.
 */
export function fetchWindowStart(): string {
  return teamWallClock(-FETCH_WINDOW_MINUTES);
}

type TimedEvent = { starts_at: string; ends_at?: string | null };

/**
 * Has this event finished? Uses the recorded end time where there is one,
 * otherwise assumes a typical session length after kickoff. Returns a
 * single-snapshot checker so every event on a page is judged against the
 * same moment.
 */
export function eventFinishedCheck(): (event: TimedEvent) => boolean {
  const now = teamWallClock();
  const noEndTimeCutoff = teamWallClock(-ASSUMED_DURATION_MINUTES);
  return (event) =>
    event.ends_at ? event.ends_at <= now : event.starts_at <= noEndTimeCutoff;
}
