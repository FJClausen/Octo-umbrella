import Link from "next/link";
import { Card, EventTypeBadge } from "@/components/ui";
import { formatEventWhen } from "@/lib/format";
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
 * The shared event card used on the home page and calendar: title, time,
 * location, jersey color, snack duty, and (for played games) the score.
 */
export function EventCard({
  event,
  snack,
  currentUserId,
}: {
  event: EventRowType;
  snack?: SnackInfo | null;
  currentUserId?: string | null;
}) {
  const jersey = event.jersey_color
    ? JERSEY_CHIP[event.jersey_color]
    : undefined;

  return (
    <Link href={`/calendar/${event.id}`}>
      <Card className="hover:border-brand-green/40">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <EventTypeBadge type={event.type} />
              <span className="truncate font-semibold text-brand-ink">
                {event.title}
                {event.opponent ? (
                  <span className="font-normal text-slate-500">
                    {" "}
                    vs {event.opponent}
                  </span>
                ) : null}
              </span>
              <ScoreBadge event={event} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {formatEventWhen(event.starts_at, event.ends_at)}
            </p>

            {event.location || jersey ? (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {event.location ? (
                  <span className="badge bg-slate-100 text-slate-600">
                    📍 {event.location}
                  </span>
                ) : null}
                {jersey ? (
                  <span className={`badge ${jersey.cls}`}>{jersey.label}</span>
                ) : null}
              </div>
            ) : null}
          </div>
          <span className="text-slate-300">→</span>
        </div>

        {snack ? (
          snack.claimed_by ? (
            <div className="mt-3 rounded-lg bg-brand-green-light px-3 py-2 text-sm font-medium text-brand-green-dark">
              🍊 Snacks:{" "}
              {currentUserId && snack.claimed_by === currentUserId
                ? "you're bringing them! 🎉"
                : `${snack.claimed_by_name || "covered"} ✓`}
            </div>
          ) : (
            <div className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
              🍊 Snack duty open — tap to sign up!
            </div>
          )
        ) : null}
      </Card>
    </Link>
  );
}
