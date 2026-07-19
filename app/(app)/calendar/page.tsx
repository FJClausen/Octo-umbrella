import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui";
import { EventCard } from "@/components/EventCard";
import { countRsvpsByEvent } from "@/lib/rsvp";

export const metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const supabase = createClient();
  const current = await getCurrentProfile();
  const dayStart = `${new Date().toISOString().slice(0, 10)}T00:00:00`;

  const [
    { data: upcoming },
    { data: past },
    { data: snackSlots },
    { data: rsvps },
  ] = await Promise.all([
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
      .limit(20),
    supabase
      .from("snack_slots")
      .select("event_id, claimed_by, claimed_by_name"),
    supabase.from("rsvps").select("event_id, status"),
  ]);

  const snackByEvent = new Map(
    (snackSlots ?? [])
      .filter((s) => s.event_id)
      .map((s) => [s.event_id as string, s])
  );
  const rsvpCounts = countRsvpsByEvent(rsvps);
  const countsFor = (e: { id: string; type: string }) =>
    e.type === "game" ? rsvpCounts.get(e.id) : undefined;
  // Coaches jump straight to the event's edit form; parents to the detail.
  const isCoach = current?.profile?.role === "coach";
  const hrefFor = (e: { id: string }) =>
    isCoach ? `/coaches/events?edit=${e.id}#event-${e.id}` : undefined;

  const playedGames = (past ?? []).filter((e) => e.type === "game");
  const otherPast = (past ?? []).filter((e) => e.type !== "game");

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
          upcoming.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              snack={snackByEvent.get(e.id)}
              currentUserId={current?.userId}
              rsvpCounts={countsFor(e)}
              href={hrefFor(e)}
            />
          ))
        ) : (
          <EmptyState
            title="No upcoming events"
            hint="Your coach hasn’t posted the next games or practices yet."
          />
        )}
      </section>

      {playedGames.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Played Games
          </h2>
          <div className="space-y-2">
            {playedGames.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                rsvpCounts={countsFor(e)}
                href={hrefFor(e)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {otherPast.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Past
          </h2>
          <div className="space-y-2 opacity-75">
            {otherPast.map((e) => (
              <EventCard key={e.id} event={e} href={hrefFor(e)} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
