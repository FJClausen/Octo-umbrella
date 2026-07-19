import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Card } from "@/components/ui";
import { EventCard } from "@/components/EventCard";
import { RsvpControl } from "@/components/RsvpControl";
import { SnackButton } from "@/components/SnackButton";
import { formatDay } from "@/lib/format";
import { countRsvpsByEvent } from "@/lib/rsvp";
import { site, type RsvpStatus } from "@/lib/site";

export const metadata = { title: "Home" };

export default async function HomePage() {
  const supabase = createClient();
  const current = await getCurrentProfile();
  const today = new Date().toISOString().slice(0, 10);
  const dayStart = `${today}T00:00:00`;

  const [
    { data: upcoming },
    { data: latestNews },
    { data: snackSlots },
    { data: rsvps },
    { data: myPlayers },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .gte("starts_at", dayStart)
      .order("starts_at", { ascending: true })
      .limit(2),
    supabase
      .from("news")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("snack_slots")
      .select("id, event_id, label, claimed_by, claimed_by_name"),
    supabase.from("rsvps").select("event_id, player_id, status"),
    supabase
      .from("players")
      .select("id, first_name")
      .eq("parent_id", current?.userId ?? "")
      .eq("active", true)
      .order("first_name"),
  ]);

  const snackByEvent = new Map(
    (snackSlots ?? [])
      .filter((s) => s.event_id)
      .map((s) => [s.event_id as string, s])
  );
  const rsvpCounts = countRsvpsByEvent(rsvps);
  const isCoach = current?.profile?.role === "coach";

  // My kids' RSVP status per event, for the inline RSVP buttons.
  const myPlayerIds = new Set((myPlayers ?? []).map((p) => p.id));
  const myStatusByEventPlayer = new Map<string, RsvpStatus>();
  for (const r of rsvps ?? []) {
    if (myPlayerIds.has(r.player_id)) {
      myStatusByEventPlayer.set(
        `${r.event_id}:${r.player_id}`,
        r.status as RsvpStatus
      );
    }
  }
  const rsvpPlayersFor = (eventId: string) =>
    (myPlayers ?? []).map((p) => ({
      playerId: p.id,
      playerName: p.first_name,
      status: myStatusByEventPlayer.get(`${eventId}:${p.id}`) ?? null,
    }));

  const firstName = current?.profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Welcome back,</p>
        <h1 className="text-2xl font-bold text-brand-ink">{firstName}</h1>
      </div>

      {/* Next two events, with snack duty inline */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-brand-ink">Next Up</h3>
          <Link href="/calendar" className="text-sm text-brand-blue">
            Full calendar →
          </Link>
        </div>
        <div className="space-y-2">
          {upcoming && upcoming.length > 0 ? (
            upcoming.map((e) => {
              const slot = snackByEvent.get(e.id);
              const players = rsvpPlayersFor(e.id);
              const snackOpen = slot ? !slot.claimed_by : false;
              const snackMine = slot
                ? slot.claimed_by === current?.userId
                : false;
              const showSnack = e.type === "game" && slot;
              return (
                <EventCard
                  key={e.id}
                  event={e}
                  snack={slot}
                  currentUserId={current?.userId}
                  rsvpCounts={
                    e.type === "game" ? rsvpCounts.get(e.id) : undefined
                  }
                  href={
                    isCoach
                      ? `/coaches/events?edit=${e.id}#event-${e.id}`
                      : undefined
                  }
                >
                  {players.length > 0 || showSnack ? (
                    <div className="space-y-3">
                      {players.length > 0 ? (
                        <RsvpControl eventId={e.id} players={players} />
                      ) : null}
                      {showSnack ? (
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <p
                            className={
                              snackOpen
                                ? "text-amber-700"
                                : "text-brand-green-dark"
                            }
                          >
                            🍊 {slot!.label || "Team snack"}:{" "}
                            {snackOpen
                              ? "needs a volunteer"
                              : snackMine
                                ? "you're bringing it 🎉"
                                : `${slot!.claimed_by_name || "covered"} ✓`}
                          </p>
                          <SnackButton
                            slotId={slot!.id}
                            mine={snackMine}
                            open={snackOpen}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </EventCard>
              );
            })
          ) : (
            <Card>
              <p className="text-sm text-slate-500">
                No upcoming events on the calendar yet. Check back soon!
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* Latest news */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-brand-ink">Team news</h3>
          <Link href="/news" className="text-sm text-brand-blue">
            All news →
          </Link>
        </div>
        <div className="space-y-2">
          {latestNews && latestNews.length > 0 ? (
            latestNews.map((n) => (
              <Link key={n.id} href={`/news#${n.id}`}>
                <Card className="hover:border-brand-blue/40">
                  <p className="font-medium text-brand-ink">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                    {n.body}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDay(n.created_at)}
                  </p>
                </Card>
              </Link>
            ))
          ) : (
            <p className="text-sm text-slate-500">No news yet.</p>
          )}
        </div>
      </section>

      <p className="pt-2 text-center text-xs text-slate-400">
        {site.teamName} · {site.season}
      </p>
    </div>
  );
}
