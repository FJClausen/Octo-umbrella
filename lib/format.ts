import { format, isSameDay } from "date-fns";

/**
 * Parse a value from the database into a Date.
 *
 * A bare "YYYY-MM-DD" (a Postgres `date`, e.g. a practice's session date)
 * is parsed as UTC midnight by `new Date`, which lands on the previous day
 * for anyone west of UTC. Those are calendar dates with no timezone, so
 * build them in local time instead. Timestamps keep their normal handling.
 */
function toDate(value: string | Date): Date {
  if (typeof value === "string") {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnly) {
      return new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3])
      );
    }
  }
  return new Date(value);
}

export function formatDate(value: string | Date): string {
  return format(toDate(value), "EEE, MMM d");
}

export function formatDateLong(value: string | Date): string {
  return format(toDate(value), "EEEE, MMMM d, yyyy");
}

export function formatTime(value: string | Date): string {
  return format(toDate(value), "h:mm a");
}

/** e.g. "Sat, Oct 4 · 10:00 AM – 11:30 AM" */
export function formatEventWhen(
  startsAt: string,
  endsAt?: string | null
): string {
  const start = toDate(startsAt);
  const base = `${formatDate(start)} · ${formatTime(start)}`;
  if (!endsAt) return base;
  const end = toDate(endsAt);
  if (isSameDay(start, end)) return `${base} – ${formatTime(end)}`;
  return `${base} – ${formatDate(end)} ${formatTime(end)}`;
}

/** For grouping snack slots / date-only display */
export function formatDay(value: string | Date): string {
  return format(toDate(value), "EEEE, MMMM d");
}
