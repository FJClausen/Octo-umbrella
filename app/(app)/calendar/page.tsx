import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { pastCutoff } from "@/lib/time";
import {
  PageHeader,
  EmptyState,
  SectionHeading,
  SubmitButton,
} from "@/components/ui";
import { EventCard } from "@/components/EventCard";
import { rsvpCountsFromRpc } from "@/lib/rsvp";
import { saveGameNote } from "./actions";

export const metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const supabase = createClient();
  const current = await getCurrentProfile();
  // Games drop out of Upcoming once they have actually been played.
  const cutoff = pastCutoff();

  const [
    { data: upcoming },
    { data: past },
    { data: snackSlots },
    { data: rsvpCountRows },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .gte("starts_at", cutoff)
      .order("starts_at", { ascending: true }),
    supabase
      .from("events")
      .select("*")
      .lt("starts_at", cutoff)
      .order("starts_at", { ascending: false })
      .limit(20),
    supabase
      .from("snack_slots")
      .select("event_id, claimed_by, claimed_by_name"),
    supabase.rpc("rsvp_counts"),
  ]);

  const snackByEvent = new Map(
    (snackSlots ?? [])
      .filter((s) => s.event_id)
      .map((s) => [s.event_id as string, s])
  );
  const rsvpCounts = rsvpCountsFromRpc(rsvpCountRows);
  const countsFor = (e: { id: string; type: string }) =>
    e.type === "game" ? rsvpCounts.get(e.id) : undefined;
  // Coaches jump straight to the event's edit form; parents to the detail.
  const isCoach = current?.profile?.role === "coach";
  const hrefFor = (e: { id: string }) =>
    isCoach ? `/coaches/events?edit=${e.id}#event-${e.id}` : undefined;

  // "Games Played" is games only — past practices and team events drop off
  // the calendar rather than cluttering it.
  const playedGames = (past ?? []).filter((e) => e.type === "game");

  // Coaches' private notes on those games.
  const { data: gameNotes } = isCoach
    ? await supabase.from("game_notes").select("event_id, note, updated_at")
    : { data: [] };
  const noteByEvent = new Map(
    (gameNotes ?? []).map((n) => [n.event_id, n])
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        subtitle="Games, practices, and team events. Tap an event to RSVP."
      />

      <section className="space-y-2">
        <SectionHeading>Upcoming</SectionHeading>
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
          <SectionHeading>Games Played</SectionHeading>
          <div className="space-y-2">
            {playedGames.map((e) => (
              <div key={e.id} className="space-y-1">
                <EventCard
                  event={e}
                  rsvpCounts={countsFor(e)}
                  href={hrefFor(e)}
                />
                {isCoach ? (
                  <details className="card p-3">
                    <summary className="cursor-pointer text-sm text-brand-blue">
                      Coach’s game notes
                      {noteByEvent.get(e.id)?.note ? " ✓" : ""}
                    </summary>
                    <form
                      action={saveGameNote}
                      className="mt-2 space-y-2"
                      key={noteByEvent.get(e.id)?.updated_at ?? "new"}
                    >
                      <input type="hidden" name="event_id" value={e.id} />
                      <textarea
                        name="note"
                        rows={3}
                        defaultValue={noteByEvent.get(e.id)?.note ?? ""}
                        className="input"
                        placeholder="How did it go? What worked, what to work on next?"
                      />
                      <SubmitButton>Save notes</SubmitButton>
                    </form>
                    <p className="mt-1 text-xs text-slate-400">
                      Only coaches can see these.
                    </p>
                  </details>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
