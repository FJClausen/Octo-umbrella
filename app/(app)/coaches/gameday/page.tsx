import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, SubmitButton } from "@/components/ui";
import { EventCardBody } from "@/components/EventCard";
import { LineupEditor } from "@/components/LineupEditor";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { reminderMessage } from "@/lib/whatsapp";
import { DEFAULT_FORMATION_KEY, type FormationKey } from "@/lib/site";
import {
  saveGeneralLineup,
  saveEventLineup,
  copyGeneralLineupToEvent,
} from "../lineups/actions";

export const metadata = { title: "Game Day" };

export default async function GameDayPage() {
  const supabase = createClient();
  const dayStart = `${new Date().toISOString().slice(0, 10)}T00:00:00`;

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
  const playerName = new Map((players ?? []).map((p) => [p.id, p.first_name]));

  let gameLineup = null;
  let rsvpsByStatus = { going: [] as string[], maybe: [] as string[], not_going: [] as string[] };
  let goingPlayers: { id: string; positions: string[] }[] = [];
  let snack: { id: string; label: string | null; claimed_by: string | null; claimed_by_name: string | null } | null =
    null;
  if (nextGame) {
    const [{ data: lineup }, { data: gameRsvps }, { data: slot }] =
      await Promise.all([
        supabase
          .from("lineups")
          .select("*")
          .eq("event_id", nextGame.id)
          .maybeSingle(),
        supabase
          .from("rsvps")
          .select("player_id, status")
          .eq("event_id", nextGame.id),
        supabase
          .from("snack_slots")
          .select("id, label, claimed_by, claimed_by_name")
          .eq("event_id", nextGame.id)
          .maybeSingle(),
      ]);
    gameLineup = lineup;
    snack = slot;
    for (const r of gameRsvps ?? []) {
      const name = playerName.get(r.player_id) ?? "Player";
      if (r.status === "going") {
        rsvpsByStatus.going.push(name);
        goingPlayers.push({
          id: r.player_id,
          positions: positionsById.get(r.player_id) ?? [],
        });
      } else if (r.status === "maybe") rsvpsByStatus.maybe.push(name);
      else if (r.status === "not_going") rsvpsByStatus.not_going.push(name);
    }
  }

  return (
    <div className="space-y-6">
      {nextGame ? (
        <>
          <Card>
            <EventCardBody event={nextGame} snack={snack} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <WhatsAppButton
                text={reminderMessage(nextGame, snack)}
                label="Send reminder"
                small
              />
              <Link
                href={`/coaches/events?edit=${nextGame.id}#event-${nextGame.id}`}
                className="btn-outline px-3 py-1 text-sm"
              >
                Edit event
              </Link>
            </div>
          </Card>

          <Card>
            <h2 className="mb-2 font-semibold text-brand-ink">
              Who's coming ({rsvpsByStatus.going.length} going)
            </h2>
            <div className="space-y-1.5 text-sm">
              <p>
                <span className="font-medium text-brand-green-dark">
                  ✅ Going:
                </span>{" "}
                <span className="text-slate-600">
                  {rsvpsByStatus.going.join(", ") || "No RSVPs yet"}
                </span>
              </p>
              {rsvpsByStatus.maybe.length > 0 ? (
                <p>
                  <span className="font-medium text-amber-700">🤔 Maybe:</span>{" "}
                  <span className="text-slate-600">
                    {rsvpsByStatus.maybe.join(", ")}
                  </span>
                </p>
              ) : null}
              {rsvpsByStatus.not_going.length > 0 ? (
                <p>
                  <span className="font-medium text-slate-500">❌ Out:</span>{" "}
                  <span className="text-slate-600">
                    {rsvpsByStatus.not_going.join(", ")}
                  </span>
                </p>
              ) : null}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-brand-ink">Game lineup</h2>
            <p className="mb-3 text-sm text-slate-500">
              Players who RSVP’d “going” are highlighted in the picker.
            </p>
            {!gameLineup ? (
              <form action={copyGeneralLineupToEvent} className="mb-3">
                <input type="hidden" name="event_id" value={nextGame.id} />
                <SubmitButton variant="outline">
                  Copy from general lineup
                </SubmitButton>
              </form>
            ) : null}
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
          </Card>
        </>
      ) : (
        <EmptyState
          title="No upcoming game"
          hint="Add the next game in the Events tab and it will show up here with RSVPs and the lineup planner."
        />
      )}

      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-brand-ink">
          General lineup (default plan, independent of any game)
        </summary>
        <div className="mt-3">
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
        </div>
      </details>
    </div>
  );
}
