import Link from "next/link";
import { Card, EventTypeBadge, eventCardTint } from "@/components/ui";
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
 * Coaches Corner event manager.
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

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <EventTypeBadge type={event.type} />
            {!redundantTitle || event.opponent ? (
              <span className="truncate font-semibold text-brand-ink">
                {!redundantTitle ? event.title : null}
                {event.opponent ? (
                  <span
                    className={
                      redundantTitle
                        ? "font-semibold text-brand-ink"
                        : "font-normal text-slate-500"
                    }
                  >
                    {!redundantTitle ? " " : ""}vs {event.opponent}
                  </span>
                ) : null}
              </span>
            ) : null}
            <ScoreBadge event={event} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {formatEventWhen(event.starts_at, event.ends_at)}
          </p>

          {event.location || jersey || showRsvps || snack ? (
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
              {snack ? (
                snack.claimed_by ? (
                  <span className="badge bg-brand-green-light text-brand-green-dark">
                    🍊{" "}
                    {currentUserId && snack.claimed_by === currentUserId
                      ? "You 🎉"
                      : `${snack.claimed_by_name || "Covered"} ✓`}
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
}: {
  event: EventRowType;
  snack?: SnackInfo | null;
  currentUserId?: string | null;
  rsvpCounts?: RsvpCounts | null;
}) {
  return (
    <Link href={`/calendar/${event.id}`}>
      <Card
        className={`${eventCardTint(event.type)} transition hover:brightness-[0.98]`}
      >
        <EventCardBody
          event={event}
          snack={snack}
          currentUserId={currentUserId}
          rsvpCounts={rsvpCounts}
          showArrow
        />
      </Card>
    </Link>
  );
}
