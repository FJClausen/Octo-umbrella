import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";

export const metadata = { title: "Coaches Corner" };

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

  const [pending, upcoming, players, openSnacks] = await Promise.all([
    count(
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
    ),
    count(
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .gte("starts_at", dayStart)
    ),
    count(
      supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("active", true)
    ),
    count(
      supabase
        .from("snack_slots")
        .select("*", { count: "exact", head: true })
        .is("claimed_by", null)
        .gte("slot_date", today)
    ),
  ]);

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
      href: "/coaches/snacks",
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

      <Card>
        <h2 className="mb-2 font-semibold text-brand-ink">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/coaches/events" className="btn-outline text-sm">
            + Add event
          </Link>
          <Link href="/coaches/news" className="btn-outline text-sm">
            + Post news
          </Link>
          <Link href="/coaches/snacks" className="btn-outline text-sm">
            + Snack slot
          </Link>
          <Link href="/coaches/roster" className="btn-outline text-sm">
            + Add player
          </Link>
        </div>
      </Card>
    </div>
  );
}
