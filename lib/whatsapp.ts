import { site } from "@/lib/site";
import { formatEventWhen } from "@/lib/format";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/site";

type EventLike = {
  id: string;
  type: string;
  title: string;
  opponent: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  jersey_color?: string | null;
};

type SnackLike = {
  claimed_by: string | null;
  claimed_by_name: string | null;
} | null;

/** Opens WhatsApp's share sheet with the given prefilled text. */
export function waShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function typeLabel(event: EventLike): string {
  const t = event.type as EventType;
  return (EVENT_TYPE_LABELS[t] ?? "Event").toLowerCase();
}

function eventLine(event: EventLike): string {
  const vs = event.opponent ? ` vs ${event.opponent}` : "";
  const loc = event.location ? `\n📍 ${event.location}` : "";
  const jersey =
    event.jersey_color === "blue"
      ? `\n👕 Wear BLUE jerseys (home)`
      : event.jersey_color === "red"
        ? `\n👕 Wear RED jerseys (away)`
        : "";
  return `${event.title}${vs}\n🗓 ${formatEventWhen(event.starts_at, event.ends_at)}${loc}${jersey}`;
}

function snackLine(snack: SnackLike): string {
  if (!snack) return "";
  return snack.claimed_by
    ? `\n🍊 Snacks: ${snack.claimed_by_name || "covered"}`
    : `\n🍊 Snacks: still needs a volunteer!`;
}

function eventUrl(event: EventLike): string {
  return `${site.siteUrl}/calendar/${event.id}`;
}

/** Message for announcing a newly created event. */
export function newEventMessage(event: EventLike, snack: SnackLike): string {
  return (
    `⚽ ${site.teamName} — new ${typeLabel(event)} added!\n\n` +
    eventLine(event) +
    snackLine(snack) +
    `\n\nRSVP here: ${eventUrl(event)}`
  );
}

/** Message for sharing a recorded final score. */
export function resultMessage(
  event: EventLike & { score_us: number | null; score_them: number | null }
): string {
  const us = event.score_us ?? 0;
  const them = event.score_them ?? 0;
  const headline =
    us > them ? "🎉 We WON" : us < them ? "💪 Tough one today" : "🤝 A draw";
  const vs = event.opponent ? ` vs ${event.opponent}` : "";
  return `${headline}!\n\n⚽ ${site.teamName} ${us}–${them}${vs}\nGreat job, girls! 🌈`;
}

/** Message for reminding the group about an upcoming event. */
export function reminderMessage(event: EventLike, snack: SnackLike): string {
  return (
    `⏰ ${site.teamName} reminder — ${typeLabel(event)} coming up!\n\n` +
    eventLine(event) +
    snackLine(snack) +
    `\n\nRSVP here: ${eventUrl(event)}`
  );
}
