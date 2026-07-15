"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RSVP_STATUSES, RSVP_LABELS, type RsvpStatus } from "@/lib/site";
import { setRsvpAction } from "@/app/(app)/calendar/actions";

type PlayerRsvp = {
  playerId: string;
  playerName: string;
  status: RsvpStatus | null;
};

const STYLES: Record<RsvpStatus, string> = {
  going: "bg-brand-green text-white border-brand-green",
  maybe: "bg-amber-400 text-amber-950 border-amber-400",
  not_going: "bg-slate-500 text-white border-slate-500",
};

export function RsvpControl({
  eventId,
  players,
}: {
  eventId: string;
  players: PlayerRsvp[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState<Record<string, RsvpStatus | null>>(
    Object.fromEntries(players.map((p) => [p.playerId, p.status]))
  );
  const [error, setError] = useState<string | null>(null);

  if (players.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No players are linked to your account yet. A coach can link your child
        to you from the roster.
      </p>
    );
  }

  function choose(playerId: string, status: RsvpStatus) {
    setError(null);
    setLocal((prev) => ({ ...prev, [playerId]: status }));
    startTransition(async () => {
      const res = await setRsvpAction(eventId, playerId, status);
      if (res?.error) setError(res.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {players.map((p) => (
        <div key={p.playerId}>
          <p className="mb-1 text-sm font-medium text-brand-ink">
            {p.playerName}
          </p>
          <div className="flex flex-wrap gap-2">
            {RSVP_STATUSES.map((s) => {
              const active = local[p.playerId] === s;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={isPending}
                  onClick={() => choose(p.playerId, s)}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition disabled:opacity-60 ${
                    active
                      ? STYLES[s]
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {RSVP_LABELS[s]}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
