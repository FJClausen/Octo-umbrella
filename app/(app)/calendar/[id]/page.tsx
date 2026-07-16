import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Card, EventTypeBadge } from "@/components/ui";
import { RsvpControl } from "@/components/RsvpControl";
import { SnackButton } from "@/components/SnackButton";
import { formatEventWhen, formatDay } from "@/lib/format";
import { RSVP_LABELS, type RsvpStatus } from "@/lib/site";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const current = await getCurrentProfile();
  const isCoach = current?.profile?.role === "coach";

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!event) notFound();

  const [{ data: myPlayers }, { data: snackSlots }] = await Promise.all([
    supabase
      .from("players")
      .select("id, first_name")
      .eq("parent_id", current?.userId ?? "")
      .eq("active", true)
      .order("first_name"),
    supabase
      .from("snack_slots")
      .select("id, label, claimed_by, claimed_by_name")
      .eq("event_id", event.id),
  ]);

  const playerIds = (myPlayers ?? []).map((p) => p.id);
  const { data: myRsvps } = playerIds.length
    ? await supabase
        .from("rsvps")
        .select("player_id, status")
        .eq("event_id", event.id)
        .in("player_id", playerIds)
    : { data: [] };

  const statusByPlayer = new Map(
    (myRsvps ?? []).map((r) => [r.player_id, r.status as RsvpStatus])
  );

  const rsvpPlayers = (myPlayers ?? []).map((p) => ({
    playerId: p.id,
    playerName: p.first_name,
    status: statusByPlayer.get(p.id) ?? null,
  }));

  // Coach headcount
  let headcount: { going: number; maybe: number; not_going: number } | null =
    null;
  if (isCoach) {
    const { data: allRsvps } = await supabase
      .from("rsvps")
      .select("status")
      .eq("event_id", event.id);
    headcount = { going: 0, maybe: 0, not_going: 0 };
    for (const r of allRsvps ?? []) {
      if (r.status in headcount) {
        headcount[r.status as keyof typeof headcount]++;
      }
    }
  }

  return (
    <div className="space-y-5">
      <Link href="/calendar" className="text-sm text-brand-blue">
        ← Back to calendar
      </Link>

      <Card>
        <div className="flex items-center justify-between">
          <EventTypeBadge type={event.type} />
          {isCoach ? (
            <Link
              href="/coaches/events"
              className="text-sm text-brand-blue underline"
            >
              Manage
            </Link>
          ) : null}
        </div>
        <h1 className="mt-2 text-xl font-bold text-brand-ink">
          {event.title}
          {event.opponent ? (
            <span className="font-normal text-slate-500">
              {" "}
              vs {event.opponent}
            </span>
          ) : null}
        </h1>
        <dl className="mt-3 space-y-1 text-sm text-slate-600">
          <div>⏱️ {formatEventWhen(event.starts_at, event.ends_at)}</div>
          {event.location ? <div>📍 {event.location}</div> : null}
        </dl>
        {event.notes ? (
          <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            {event.notes}
          </p>
        ) : null}
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-brand-ink">
          Will your player be there?
        </h2>
        <RsvpControl eventId={event.id} players={rsvpPlayers} />
      </Card>

      {snackSlots && snackSlots.length > 0 ? (
        <Card>
          <h2 className="mb-2 font-semibold text-brand-ink">🍊 Snacks</h2>
          <ul className="space-y-2">
            {snackSlots.map((s) => {
              const mine = s.claimed_by === current?.userId;
              const open = !s.claimed_by;
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 text-sm text-slate-600"
                >
                  <div>
                    <p>{s.label || "Team snack"}</p>
                    <p
                      className={
                        open ? "text-amber-600" : "text-brand-green-dark"
                      }
                    >
                      {open
                        ? "Open — needs a volunteer"
                        : mine
                          ? "You're bringing this! 🎉"
                          : `${s.claimed_by_name || "Covered"} ✓`}
                    </p>
                  </div>
                  <SnackButton slotId={s.id} mine={mine} open={open} />
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      {headcount ? (
        <Card className="border-brand-blue/30 bg-brand-blue-light/40">
          <h2 className="mb-2 font-semibold text-brand-blue-dark">
            Coach headcount
          </h2>
          <div className="flex gap-4 text-sm">
            <span>
              <strong className="text-brand-green-dark">
                {headcount.going}
              </strong>{" "}
              {RSVP_LABELS.going}
            </span>
            <span>
              <strong className="text-amber-700">{headcount.maybe}</strong>{" "}
              {RSVP_LABELS.maybe}
            </span>
            <span>
              <strong className="text-slate-600">
                {headcount.not_going}
              </strong>{" "}
              {RSVP_LABELS.not_going}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Updated {formatDay(new Date())}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
