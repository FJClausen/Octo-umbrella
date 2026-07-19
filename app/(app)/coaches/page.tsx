import Link from "next/link";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, EventTypeBadge, eventCardTint } from "@/components/ui";
import { formatEventWhen, formatDay } from "@/lib/format";
import { reminderMessage } from "@/lib/whatsapp";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const metadata = { title: "Coaching Corner" };

async function count(
  promise: PromiseLike<{ count: number | null }>
): Promise<number> {
  const { count: c } = await promise;
  return c ?? 0;
}

export default async function CoachesOverview() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const dayStart = `${today}T00:00:00`;
  const reminderEnd = `${addDays(new Date(), 2).toISOString().slice(0, 10)}T23:59:59`;

  const [pending, { data: upcomingEvents }, { data: allSnacks }] =
    await Promise.all([
      count(
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")
      ),
      supabase
        .from("events")
        .select("*")
        .gte("starts_at", dayStart)
        .order("starts_at"),
      supabase
        .from("snack_slots")
        .select("event_id, claimed_by, claimed_by_name"),
    ]);

  const snackByEvent = new Map(
    (allSnacks ?? [])
      .filter((s) => s.event_id)
      .map((s) => [s.event_id as string, s])
  );

  // Next game: does it have a lineup and enough RSVPs?
  const nextGame = (upcomingEvents ?? []).find((e) => e.type === "game") ?? null;
  let nextGameHasLineup = false;
  let nextGameGoing = 0;
  if (nextGame) {
    const [{ data: lineup }, going] = await Promise.all([
      supabase
        .from("lineups")
        .select("id")
        .eq("event_id", nextGame.id)
        .maybeSingle(),
      count(
        supabase
          .from("rsvps")
          .select("*", { count: "exact", head: true })
          .eq("event_id", nextGame.id)
          .eq("status", "going")
      ),
    ]);
    nextGameHasLineup = !!lineup;
    nextGameGoing = going;
  }

  const label = (e: {
    title: string;
    opponent: string | null;
    starts_at: string;
  }) =>
    `${e.title}${e.opponent ? ` vs ${e.opponent}` : ""} (${formatDay(e.starts_at)})`;

  // The coach's to-do list: everything that still needs a decision or a tap.
  const todos: { href: string; text: string }[] = [];
  if (pending > 0) {
    todos.push({
      href: "/coaches/approvals",
      text: `${pending} parent account${pending === 1 ? "" : "s"} waiting for approval`,
    });
  }
  if (nextGame && !nextGameHasLineup) {
    todos.push({
      href: "/coaches/gameday",
      text: `No lineup yet for ${label(nextGame)}`,
    });
  }
  if (nextGame && nextGameGoing < 7) {
    todos.push({
      href: "/coaches/gameday",
      text: `Only ${nextGameGoing} "going" RSVP${nextGameGoing === 1 ? "" : "s"} for ${label(nextGame)} — nudge the group?`,
    });
  }
  for (const e of upcomingEvents ?? []) {
    if (e.type !== "game") continue;
    const slot = snackByEvent.get(e.id);
    if (slot && !slot.claimed_by) {
      todos.push({
        href: `/coaches/events?edit=${e.id}#event-${e.id}`,
        text: `🍊 Snack slot still open — ${label(e)}`,
      });
    }
  }

  // Events within the next ~2 days, for one-tap WhatsApp reminders.
  const soonEvents = (upcomingEvents ?? []).filter(
    (e) => e.starts_at <= reminderEnd
  );

  return (
    <div className="space-y-5">
      {todos.length > 0 ? (
        <Card className="border-amber-300/70 bg-amber-50/80">
          <h2 className="mb-1.5 font-semibold text-amber-900">⚠️ To do</h2>
          <ul className="space-y-1">
            {todos.map((t, i) => (
              <li key={i}>
                <Link
                  href={t.href}
                  className="text-sm text-amber-800 underline-offset-2 hover:underline"
                >
                  • {t.text}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="border-brand-green/40 bg-brand-green-light/60">
          <p className="font-medium text-brand-green-dark">
            ✅ All caught up — nothing needs your attention right now.
          </p>
        </Card>
      )}

      {soonEvents && soonEvents.length > 0 ? (
        <Card className="border-[#25D366]/40">
          <h2 className="font-semibold text-brand-ink">
            ⏰ Reminders due — next 2 days
          </h2>
          <p className="mb-3 text-sm text-slate-500">
            One tap opens WhatsApp with the reminder pre-written — pick the
            team group and send.
          </p>
          <ul className="space-y-3">
            {soonEvents.map((e) => {
              const snack = snackByEvent.get(e.id) ?? null;
              return (
                <li
                  key={e.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${eventCardTint(e.type)}`}
                >
                  <Link
                    href={`/coaches/events?edit=${e.id}#event-${e.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-2">
                      <EventTypeBadge type={e.type} />
                      <span className="text-sm font-medium text-brand-ink">
                        {e.title}
                        {e.opponent ? ` vs ${e.opponent}` : ""}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatEventWhen(e.starts_at, e.ends_at)}
                      {snack && !snack.claimed_by ? (
                        <span className="ml-2 font-medium text-amber-600">
                          🍊 snack slot still open
                        </span>
                      ) : null}
                    </p>
                  </Link>
                  <WhatsAppButton
                    text={reminderMessage(e, snack)}
                    label="Send reminder"
                    small
                  />
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
        <Link href="/coaches/approvals" className="hover:text-brand-ink">
          Approvals
        </Link>
        <Link href="/coaches/news" className="hover:text-brand-ink">
          Manage news
        </Link>
        <Link href="/coaches/documents" className="hover:text-brand-ink">
          Documents
        </Link>
      </div>
    </div>
  );
}
