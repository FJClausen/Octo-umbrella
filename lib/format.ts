import { format, isSameDay } from "date-fns";

export function formatDate(value: string | Date): string {
  return format(new Date(value), "EEE, MMM d");
}

export function formatDateLong(value: string | Date): string {
  return format(new Date(value), "EEEE, MMMM d, yyyy");
}

export function formatTime(value: string | Date): string {
  return format(new Date(value), "h:mm a");
}

/** e.g. "Sat, Oct 4 · 10:00 AM – 11:30 AM" */
export function formatEventWhen(
  startsAt: string,
  endsAt?: string | null
): string {
  const start = new Date(startsAt);
  const base = `${formatDate(start)} · ${formatTime(start)}`;
  if (!endsAt) return base;
  const end = new Date(endsAt);
  if (isSameDay(start, end)) return `${base} – ${formatTime(end)}`;
  return `${base} – ${formatDate(end)} ${formatTime(end)}`;
}

/** For grouping snack slots / date-only display */
export function formatDay(value: string | Date): string {
  return format(new Date(value), "EEEE, MMMM d");
}
