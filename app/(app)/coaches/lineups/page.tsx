import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, SubmitButton, EventTypeBadge } from "@/components/ui";
import { formatEventWhen } from "@/lib/format";
import type { Lineup } from "@/lib/types";
import { saveLineup } from "./actions";

export const metadata = { title: "Lineups & Game Plans" };

export default async function LineupsPage() {
  const supabase = createClient();
  const dayStart = `${new Date().toISOString().slice(0, 10)}T00:00:00`;

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .gte("starts_at", dayStart)
    .order("starts_at");

  const eventIds = (events ?? []).map((e) => e.id);

  const [{ data: lineups }, { data: goingRsvps }, { data: players }] =
    eventIds.length
      ? await Promise.all([
          supabase.from("lineups").select("*").in("event_id", eventIds),
          supabase
            .from("rsvps")
            .select("event_id, player_id, status")
            .in("event_id", eventIds)
            .eq("status", "going"),
          supabase.from("players").select("id, first_name"),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

  const lineupByEvent = new Map<string, Lineup>(
    (lineups ?? []).map((l) => [l.event_id, l])
  );
  const playerName = new Map(
    (players ?? []).map((p) => [p.id, p.first_name])
  );
  const goingByEvent = new Map<string, string[]>();
  for (const r of goingRsvps ?? []) {
    const list = goingByEvent.get(r.event_id) ?? [];
    list.push(playerName.get(r.player_id) ?? "Player");
    goingByEvent.set(r.event_id, list);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Plan your formation and starting lineup for each upcoming event. Only
        coaches can see this. The “Going” list reflects parent RSVPs.
      </p>

      {events && events.length > 0 ? (
        events.map((e) => {
          const lineup = lineupByEvent.get(e.id);
          const going = goingByEvent.get(e.id) ?? [];
          return (
            <Card key={e.id}>
              <div className="flex items-center gap-2">
                <EventTypeBadge type={e.type} />
                <span className="font-semibold text-brand-ink">
                  {e.title}
                  {e.opponent ? (
                    <span className="font-normal text-slate-500">
                      {" "}
                      vs {e.opponent}
                    </span>
                  ) : null}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {formatEventWhen(e.starts_at, e.ends_at)}
              </p>

              <div className="mt-3 rounded-lg bg-brand-green-light/50 p-2 text-sm">
                <span className="font-medium text-brand-green-dark">
                  Going ({going.length}):
                </span>{" "}
                <span className="text-slate-600">
                  {going.length ? going.join(", ") : "No RSVPs yet"}
                </span>
              </div>

              <form action={saveLineup} className="mt-3 space-y-3">
                <input type="hidden" name="event_id" value={e.id} />
                <div>
                  <label className="label">Formation</label>
                  <input
                    name="formation"
                    defaultValue={lineup?.formation ?? ""}
                    className="input"
                    placeholder="e.g. 4-3-3"
                  />
                </div>
                <div>
                  <label className="label">Game plan / starting lineup</label>
                  <textarea
                    name="plan"
                    rows={5}
                    defaultValue={lineup?.plan ?? ""}
                    className="input"
                    placeholder={
                      "GK: …\nDefense: …\nMidfield: …\nForwards: …\nSubs & rotations: …"
                    }
                  />
                </div>
                <SubmitButton>Save plan</SubmitButton>
              </form>
            </Card>
          );
        })
      ) : (
        <EmptyState
          title="No upcoming events"
          hint="Add games or practices in the Events tab to plan lineups."
        />
      )}
    </div>
  );
}
