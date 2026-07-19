import Link from "next/link";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, EventTypeBadge, eventCardTint } from "@/components/ui";
import { formatEventWhen } from "@/lib/format";
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

  const [pending, players, { data: upcomingEvents }, { data: allSnacks }] =
    await Promise.all([
      count(
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")
      ),
      count(
        supabase
          .from("players")
          .select("*", { count: "exact", head: true })
          .eq("active", true)
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

  const upcoming = (upcomingEvents ?? []).length;

  // "Open snack slots" = upcoming GAMES whose snack duty nobody has claimed.
  // Practices don't need snack duty, and games already covered don't count.
  const openSnacks = (upcomingEvents ?? []).filter((e) => {
    if (e.type !== "game") return false;
    const slot = snackByEvent.get(e.id);
    return slot != null && !slot.claimed_by;
  }).length;

  // Events within the next ~2 days, for one-tap WhatsApp reminders.
  const soonEvents = (upcomingEvents ?? []).filter(
    (e) => e.starts_at <= reminderEnd
  );

  const tiles = [
    {
      href: "/coaches/approvals",
      label: "Pending approvals",
      value: pending,
      accent: pending > 0 ? "text-amber-600" : "text-slate-400",
    },
    { href: "/coaches/events", label: "Upcoming events", value: upcoming },
    { href: "/coaches/roster", label: "Active players", value: players },
    {
      href: "/coaches/events",
      label: "Open snack slots",
      value: openSnacks,
      accent: openSnacks > 0 ? "text-amber-600" : "text-slate-400",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href}>
            <Card className="hover:border-brand-blue/40">
              <p className={`text-3xl font-bold ${t.accent ?? "text-brand-ink"}`}>
                {t.value}
              </p>
              <p className="text-sm text-slate-500">{t.label}</p>
            </Card>
          </Link>
        ))}
      </div>

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

      <Card>
        <h2 className="mb-2 font-semibold text-brand-ink">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/coaches/events" className="btn-outline text-sm">
            + Add event
          </Link>
          <Link href="/coaches/news" className="btn-outline text-sm">
            + Post news
          </Link>
          <Link href="/coaches/roster" className="btn-outline text-sm">
            + Add player
          </Link>
        </div>
      </Card>
    </div>
  );
}
