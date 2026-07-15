import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EventTypeBadge, EmptyState } from "@/components/ui";
import { formatEventWhen } from "@/lib/format";

export const metadata = { title: "Calendar" };

function EventRow({
  event,
}: {
  event: {
    id: string;
    type: string;
    title: string;
    opponent: string | null;
    location: string | null;
    starts_at: string;
    ends_at: string | null;
  };
}) {
  return (
    <Link href={`/calendar/${event.id}`}>
      <Card className="hover:border-brand-green/40">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
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
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {formatEventWhen(event.starts_at, event.ends_at)}
            </p>
            {event.location ? (
              <p className="text-sm text-slate-400">📍 {event.location}</p>
            ) : null}
          </div>
          <span className="text-slate-300">→</span>
        </div>
      </Card>
    </Link>
  );
}

export default async function CalendarPage() {
  const supabase = createClient();
  const dayStart = `${new Date().toISOString().slice(0, 10)}T00:00:00`;

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .gte("starts_at", dayStart)
      .order("starts_at", { ascending: true }),
    supabase
      .from("events")
      .select("*")
      .lt("starts_at", dayStart)
      .order("starts_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        subtitle="Games, practices, and team events. Tap an event to RSVP."
      />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Upcoming
        </h2>
        {upcoming && upcoming.length > 0 ? (
          upcoming.map((e) => <EventRow key={e.id} event={e} />)
        ) : (
          <EmptyState
            title="No upcoming events"
            hint="Your coach hasn’t posted the next games or practices yet."
          />
        )}
      </section>

      {past && past.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Past
          </h2>
          <div className="space-y-2 opacity-75">
            {past.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
