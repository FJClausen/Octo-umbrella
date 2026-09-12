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
 * How long an event stays under "Upcoming" after it kicks off. Without this
 * a game vanishes the moment it starts; with it, the card stays put while
 * everyone's actually at the field and drops to "played" afterwards.
 */
const IN_PROGRESS_GRACE_MINUTES = 150;

/**
 * The boundary between upcoming and past: events starting before this have
 * finished. Compare against `starts_at`.
 */
export function pastCutoff(): string {
  return teamWallClock(-IN_PROGRESS_GRACE_MINUTES);
}
