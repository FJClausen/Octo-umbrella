import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, EventTypeBadge, SubmitButton } from "@/components/ui";
import { formatEventWhen } from "@/lib/format";
import { DEFAULT_FORMATION_KEY, type FormationKey } from "@/lib/site";
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

  // The only event-specific lineup shown is the next upcoming game.
  const [{ data: nextGame }, { data: generalLineup }, { data: players }] =
    await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("type", "game")
        .gte("starts_at", dayStart)
        .order("starts_at")
        .limit(1)
        .maybeSingle(),
      supabase.from("lineups").select("*").is("event_id", null).maybeSingle(),
      supabase
        .from("players")
        .select("id, first_name, positions")
        .eq("active", true)
        .order("first_name"),
    ]);

  const playerList = (players ?? []).map((p) => ({
    id: p.id,
    first_name: p.first_name,
  }));
  const positionsById = new Map(
    (players ?? []).map((p) => [p.id, p.positions ?? []])
  );

  let gameLineup = null;
  let goingPlayers: { id: string; positions: string[] }[] = [];
  if (nextGame) {
    const [{ data: lineup }, { data: goingRsvps }] = await Promise.all([
      supabase
        .from("lineups")
        .select("*")
        .eq("event_id", nextGame.id)
        .maybeSingle(),
      supabase
        .from("rsvps")
        .select("player_id")
        .eq("event_id", nextGame.id)
        .eq("status", "going"),
    ]);
    gameLineup = lineup;
    goingPlayers = (goingRsvps ?? []).map((r) => ({
      id: r.player_id,
      positions: positionsById.get(r.player_id) ?? [],
    }));
  }

  const playerName = new Map(
    (players ?? []).map((p) => [p.id, p.first_name])
  );

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-semibold text-brand-ink">General Lineup</h2>
        <p className="mb-3 text-sm text-slate-500">
          Your default plan, independent of any single game. Use “Copy from
          general lineup” on the next game below to start from this.
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
        Next Game
      </h2>

      {nextGame ? (
        <Card>
          <div className="flex items-center gap-2">
            <EventTypeBadge type={nextGame.type} />
            <span className="font-semibold text-brand-ink">
              {nextGame.title}
              {nextGame.opponent ? (
                <span className="font-normal text-slate-500">
                  {" "}
                  vs {nextGame.opponent}
                </span>
              ) : null}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            {formatEventWhen(nextGame.starts_at, nextGame.ends_at)}
          </p>

          <div className="mt-3 rounded-lg bg-brand-green-light/50 p-2 text-sm">
            <span className="font-medium text-brand-green-dark">
              Going ({goingPlayers.length}):
            </span>{" "}
            <span className="text-slate-600">
              {goingPlayers.length
                ? goingPlayers
                    .map((p) => playerName.get(p.id) ?? "Player")
                    .join(", ")
                : "No RSVPs yet"}
            </span>
          </div>

          {!gameLineup ? (
            <form action={copyGeneralLineupToEvent} className="mt-3">
              <input type="hidden" name="event_id" value={nextGame.id} />
              <SubmitButton variant="outline">
                Copy from general lineup
              </SubmitButton>
            </form>
          ) : null}

          <div className="mt-3">
            <LineupEditor
              initialFormationKey={
                (gameLineup?.formation_key as FormationKey) ??
                DEFAULT_FORMATION_KEY
              }
              initialSlots={gameLineup?.slots ?? []}
              initialPlan={gameLineup?.plan ?? ""}
              players={playerList}
              availablePlayers={goingPlayers}
              onSave={saveEventLineup.bind(null, nextGame.id)}
              saveLabel="Save game lineup"
            />
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No upcoming game"
          hint="Add the next game in the Events tab to plan its lineup."
        />
      )}
    </div>
  );
}
