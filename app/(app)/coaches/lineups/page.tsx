import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, EventTypeBadge, SubmitButton } from "@/components/ui";
import { formatEventWhen } from "@/lib/format";
import { DEFAULT_FORMATION_KEY, type FormationKey } from "@/lib/site";
import type { Lineup } from "@/lib/types";
import { LineupEditor } from "@/components/LineupEditor";
import {
  saveGeneralLineup,
  saveEventLineup,
  copyGeneralLineupToEvent,
} from "./actions";

export const metadata = { title: "Lineups & Game Plans" };

export default async function LineupsPage() {
  const supabase = createClient();
  const dayStart = `${new Date().toISOString().slice(0, 10)}T00:00:00`;

  const [{ data: events }, { data: generalLineup }, { data: players }] =
    await Promise.all([
      supabase
        .from("events")
        .select("*")
        .gte("starts_at", dayStart)
        .order("starts_at"),
      supabase.from("lineups").select("*").is("event_id", null).maybeSingle(),
      supabase
        .from("players")
        .select("id, first_name")
        .eq("active", true)
        .order("first_name"),
    ]);

  const eventIds = (events ?? []).map((e) => e.id);

  const [{ data: eventLineups }, { data: goingRsvps }] = eventIds.length
    ? await Promise.all([
        supabase.from("lineups").select("*").in("event_id", eventIds),
        supabase
          .from("rsvps")
          .select("event_id, player_id, status")
          .in("event_id", eventIds)
          .eq("status", "going"),
      ])
    : [{ data: [] }, { data: [] }];

  const lineupByEvent = new Map<string, Lineup>(
    (eventLineups ?? []).map((l) => [l.event_id as string, l])
  );
  const playerList = players ?? [];
  const playerName = new Map(playerList.map((p) => [p.id, p.first_name]));
  const goingByEvent = new Map<string, string[]>();
  for (const r of goingRsvps ?? []) {
    const list = goingByEvent.get(r.event_id) ?? [];
    list.push(playerName.get(r.player_id) ?? "Player");
    goingByEvent.set(r.event_id, list);
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-semibold text-brand-ink">General Lineup</h2>
        <p className="mb-3 text-sm text-slate-500">
          Your default plan, independent of any single game. Use “Copy from
          general lineup” on a game below to start its variation from this.
        </p>
        <LineupEditor
          initialFormationKey={
            (generalLineup?.formation_key as FormationKey) ??
            DEFAULT_FORMATION_KEY
          }
          initialSlots={generalLineup?.slots ?? []}
          initialPlan={generalLineup?.plan ?? ""}
          players={playerList}
          onSave={saveGeneralLineup}
          saveLabel="Save general lineup"
        />
      </Card>

      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Event Variations
      </h2>

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

              {!lineup ? (
                <form action={copyGeneralLineupToEvent} className="mt-3">
                  <input type="hidden" name="event_id" value={e.id} />
                  <SubmitButton variant="outline">
                    Copy from general lineup
                  </SubmitButton>
                </form>
              ) : null}

              <div className="mt-3">
                <LineupEditor
                  initialFormationKey={
                    (lineup?.formation_key as FormationKey) ??
                    DEFAULT_FORMATION_KEY
                  }
                  initialSlots={lineup?.slots ?? []}
                  initialPlan={lineup?.plan ?? ""}
                  players={playerList}
                  onSave={saveEventLineup.bind(null, e.id)}
                  saveLabel="Save event lineup"
                />
              </div>
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
