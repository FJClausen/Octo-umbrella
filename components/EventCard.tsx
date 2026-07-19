import Link from "next/link";
import { Card, eventCardTint } from "@/components/ui";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/site";
import { formatEventWhen } from "@/lib/format";
import type { RsvpCounts } from "@/lib/rsvp";
import type { EventRow as EventRowType } from "@/lib/types";

export type SnackInfo = {
  claimed_by: string | null;
  claimed_by_name: string | null;
};

const JERSEY_CHIP: Record<string, { label: string; cls: string }> = {
  blue: {
    label: "👕 Blue (home)",
    cls: "bg-brand-blue text-white",
  },
  red: {
    label: "👕 Red (away)",
    cls: "bg-red-600 text-white",
  },
};

/** W/D/L result badge for a played game with a recorded score. */
export function ScoreBadge({ event }: { event: EventRowType }) {
  if (event.score_us == null || event.score_them == null) return null;
  const result =
    event.score_us > event.score_them
      ? { label: "W", cls: "bg-brand-green-light text-brand-green-dark" }
      : event.score_us < event.score_them
        ? { label: "L", cls: "bg-red-100 text-red-700" }
        : { label: "D", cls: "bg-slate-100 text-slate-600" };
  return (
    <span
      className={`badge ${result.cls} font-bold`}
    >{`${result.label} ${event.score_us}–${event.score_them}`}</span>
  );
}

/**
 * The inner content of an event card (title row, time, location/jersey
 * chips, snack banner) — reusable outside the link wrapper, e.g. in the
 * Coaching Corner event manager.
 */
export function EventCardBody({
  event,
  snack,
  currentUserId,
  rsvpCounts,
  showArrow = false,
}: {
  event: EventRowType;
  snack?: SnackInfo | null;
  currentUserId?: string | null;
  rsvpCounts?: RsvpCounts | null;
  showArrow?: boolean;
}) {
  const jersey = event.jersey_color
    ? JERSEY_CHIP[event.jersey_color]
    : undefined;
  const showRsvps =
    rsvpCounts != null &&
    rsvpCounts.going + rsvpCounts.maybe + rsvpCounts.not_going > 0;
  // Snack duty only applies to games — never show the chip on practices.
  const snackChip = event.type === "game" ? snack : null;

  // The type badge already says Game / Practice / Team Event — don't repeat
  // it as the title (e.g. a practice titled "Practice" or "Team Practice").
  const normalizedTitle = event.title.trim().toLowerCase();
  const redundantTitle = [
    "game",
    "practice",
    "team practice",
    "event",
    "team event",
  ].includes(normalizedTitle);

  // The type is part of the heading, colored per type — so "Game" and
  // "Practice" carry the same optical weight as the rest of the title.
  const typeColor =
    event.type === "game"
      ? "text-brand-green-dark"
      : event.type === "practice"
        ? "text-brand-blue-dark"
        : "text-amber-800";
  const typeLabel =
    EVENT_TYPE_LABELS[event.type as EventType] ?? "Team Event";

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 font-display text-lg font-bold leading-snug">
            <span className={typeColor}>{typeLabel}</span>
            {!redundantTitle ? (
              <span className="text-brand-ink">· {event.title}</span>
            ) : null}
            {event.opponent ? (
              <span className="text-brand-ink">vs {event.opponent}</span>
            ) : null}
            <ScoreBadge event={event} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {formatEventWhen(event.starts_at, event.ends_at)}
          </p>

          {event.location || jersey || showRsvps || snackChip ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {event.location ? (
                <span className="badge bg-slate-100 text-slate-600">
                  📍 {event.location}
                </span>
              ) : null}
              {jersey ? (
                <span className={`badge ${jersey.cls}`}>{jersey.label}</span>
              ) : null}
              {showRsvps ? (
                <span className="badge bg-brand-green-light text-brand-green-dark">
                  ✅ {rsvpCounts.going} going
                  {rsvpCounts.maybe > 0 ? ` · ${rsvpCounts.maybe} maybe` : ""}
                  {rsvpCounts.not_going > 0
                    ? ` · ${rsvpCounts.not_going} out`
                    : ""}
                </span>
              ) : null}
              {snackChip ? (
                snackChip.claimed_by ? (
                  <span className="badge bg-brand-green-light text-brand-green-dark">
                    🍊{" "}
                    {currentUserId && snackChip.claimed_by === currentUserId
                      ? "You 🎉"
                      : `${snackChip.claimed_by_name || "Covered"} ✓`}
                  </span>
                ) : (
                  <span className="badge bg-amber-100 font-semibold text-amber-800">
                    🍊 Open — sign up!
                  </span>
                )
              ) : null}
            </div>
          ) : null}
        </div>
        {showArrow ? <span className="text-slate-300">→</span> : null}
      </div>
    </>
  );
}

/**
 * The shared event card used on the home page and calendar: title, time,
 * location, jersey color, snack duty, and (for played games) the score.
 */
export function EventCard({
  event,
  snack,
  currentUserId,
  rsvpCounts,
  href,
  children,
}: {
  event: EventRowType;
  snack?: SnackInfo | null;
  currentUserId?: string | null;
  rsvpCounts?: RsvpCounts | null;
  /** Override the card's link target (e.g. straight to edit for coaches). */
  href?: string;
  /** Inline actions (RSVP, snack signup) rendered below the linked body. */
  children?: React.ReactNode;
}) {
  return (
    <Card
      className={`${eventCardTint(event.type)} transition hover:brightness-[0.98]`}
    >
      <Link href={href ?? `/calendar/${event.id}`} className="block">
        <EventCardBody
          event={event}
          snack={snack}
          currentUserId={currentUserId}
          rsvpCounts={rsvpCounts}
          showArrow
        />
      </Link>
      {children ? (
        <div className="mt-3 border-t border-black/10 pt-3">{children}</div>
      ) : null}
    </Card>
  );
}
