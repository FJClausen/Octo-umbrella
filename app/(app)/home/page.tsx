import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Alert, Card, EmptyState, SectionHeading } from "@/components/ui";
import {
  PlayerLinkPicker,
  type LinkablePlayer,
} from "@/components/PlayerLinkPicker";
import { EventCard } from "@/components/EventCard";
import { RsvpControl } from "@/components/RsvpControl";
import { SnackButton } from "@/components/SnackButton";
import { formatDay } from "@/lib/format";
import { rsvpCountsFromRpc } from "@/lib/rsvp";
import { site, type RsvpStatus } from "@/lib/site";

export const metadata = { title: "Home" };

export default async function HomePage() {
  const supabase = createClient();
  const current = await getCurrentProfile();
  const today = new Date().toISOString().slice(0, 10);
  const dayStart = `${today}T00:00:00`;
  const twoWeeksOut = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [
    { data: upcoming },
    { data: latestNews },
    { data: snackSlots },
    { data: rsvps },
    { data: rsvpCountRows },
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
    // Only this family's rows come back — headcounts come from the
    // rsvp_counts() function below.
    supabase.from("rsvps").select("event_id, player_id, status"),
    supabase.rpc("rsvp_counts"),
    supabase
      .from("players")
      .select("id, first_name")
      .eq("parent_id", current?.userId ?? "")
      .eq("active", true)
      .order("first_name"),
  ]);

  // Events over the next two weeks, for the "action needed" strip.
  const { data: fortnight } = await supabase
    .from("events")
    .select("id, type, title, opponent, starts_at")
    .gte("starts_at", dayStart)
    .lte("starts_at", `${twoWeeksOut}T23:59:59`)
    .order("starts_at");

  const snackByEvent = new Map(
    (snackSlots ?? [])
      .filter((s) => s.event_id)
      .map((s) => [s.event_id as string, s])
  );
  const rsvpCounts = rsvpCountsFromRpc(rsvpCountRows);
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

  // Roster to choose from when this parent has no child linked yet, with
  // any request they've already raised.
  let linkablePlayers: LinkablePlayer[] = [];
  if (!isCoach && (myPlayers ?? []).length === 0) {
    const [{ data: roster }, { data: myRequests }] = await Promise.all([
      supabase
        .from("players")
        .select("id, first_name")
        .eq("active", true)
        .order("first_name"),
      supabase
        .from("player_link_requests")
        .select("id, player_id, status")
        .eq("parent_id", current?.userId ?? ""),
    ]);
    const requestByPlayer = new Map(
      (myRequests ?? []).map((r) => [r.player_id, r])
    );
    linkablePlayers = (roster ?? []).map((p) => {
      const request = requestByPlayer.get(p.id);
      return {
        id: p.id,
        first_name: p.first_name,
        request: request
          ? { id: request.id, status: request.status }
          : undefined,
      };
    });
  }

  // What still needs this family's attention: missing RSVPs for the next
  // two events only (the ones shown below), and unclaimed game snacks
  // across the coming fortnight.
  const eventLabel = (e: {
    title: string;
    opponent: string | null;
    starts_at: string;
  }) =>
    `${e.title}${e.opponent ? ` vs ${e.opponent}` : ""} (${formatDay(e.starts_at)})`;
  const actionItems: { href: string; text: string }[] = [];
  for (const e of (fortnight ?? []).slice(0, 2)) {
    const unanswered = (myPlayers ?? []).filter(
      (p) => !myStatusByEventPlayer.has(`${e.id}:${p.id}`)
    );
    if (unanswered.length > 0) {
      actionItems.push({
        href: `/calendar/${e.id}`,
        text: `RSVP for ${unanswered.map((p) => p.first_name).join(" & ")} — ${eventLabel(e)}`,
      });
    }
  }
  for (const e of fortnight ?? []) {
    const slot = snackByEvent.get(e.id);
    if (e.type === "game" && slot && !slot.claimed_by) {
      actionItems.push({
        href: `/calendar/${e.id}`,
        text: `🍊 Snack still open — ${eventLabel(e)}`,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Welcome back,</p>
        <h1 className="text-2xl font-bold text-brand-ink">{firstName}</h1>
      </div>

      {/* Until a child is linked, a parent has nothing to RSVP for — let
          them claim their player instead of sending them to find a coach. */}
      {!isCoach && (myPlayers ?? []).length === 0 ? (
        <PlayerLinkPicker players={linkablePlayers} />
      ) : null}

      {actionItems.length > 0 ? (
        <Alert variant="warning" title="Action needed">
          <ul className="space-y-1">
            {actionItems.slice(0, 4).map((item, i) => (
              <li key={i}>
                <Link
                  href={item.href}
                  className="underline-offset-2 hover:underline"
                >
                  • {item.text}
                </Link>
              </li>
            ))}
            {actionItems.length > 4 ? (
              <li>
                …and {actionItems.length - 4} more —{" "}
                <Link href="/calendar" className="underline">
                  see the calendar
                </Link>
              </li>
            ) : null}
          </ul>
        </Alert>
      ) : null}

      {/* Next two events, with snack duty inline */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <SectionHeading>Next Up</SectionHeading>
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
                  // The inline snack row below covers it — no chip too.
                  snack={showSnack ? null : slot}
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
            <EmptyState
              title="No upcoming events"
              hint="Nothing on the calendar yet — check back soon!"
            />
          )}
        </div>
      </section>

      {/* Latest news */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <SectionHeading>Team News</SectionHeading>
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
            <EmptyState
              title="No news yet"
              hint="Announcements from the coaches will show up here."
            />
          )}
        </div>
      </section>

      <p className="pt-2 text-center text-xs text-slate-400">
        {site.teamName} · {site.season}
      </p>
    </div>
  );
}
