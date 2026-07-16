import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Card, EventTypeBadge, LinkButton } from "@/components/ui";
import { CleatsIcon } from "@/components/CleatsIcon";
import { formatEventWhen, formatDay, formatDate } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata = { title: "Home" };

export default async function HomePage() {
  const supabase = createClient();
  const current = await getCurrentProfile();
  const today = new Date().toISOString().slice(0, 10);
  const dayStart = `${today}T00:00:00`;

  const [{ data: upcoming }, { data: latestNews }, { data: mySnacks }] =
    await Promise.all([
      supabase
        .from("events")
        .select("*")
        .gte("starts_at", dayStart)
        .order("starts_at", { ascending: true })
        .limit(3),
      supabase
        .from("news")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("snack_slots")
        .select("*")
        .eq("claimed_by", current?.userId ?? "")
        .gte("slot_date", today)
        .order("slot_date", { ascending: true }),
    ]);

  const firstName = current?.profile?.full_name?.split(" ")[0] || "there";
  const next = upcoming?.[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Welcome back,</p>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-brand-ink">
          {firstName}
          <CleatsIcon className="h-8 w-auto" />
        </h1>
      </div>

      {/* Next event highlight */}
      {next ? (
        <Card className="border-brand-green/30 bg-gradient-to-br from-white to-brand-green-light/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-green-dark">
              Next up
            </span>
            <EventTypeBadge type={next.type} />
          </div>
          <h2 className="mt-1 text-lg font-bold text-brand-ink">
            {next.title}
            {next.opponent ? (
              <span className="font-normal text-slate-500"> vs {next.opponent}</span>
            ) : null}
          </h2>
          <p className="text-sm text-slate-600">
            {formatEventWhen(next.starts_at, next.ends_at)}
          </p>
          {next.location ? (
            <p className="text-sm text-slate-500">📍 {next.location}</p>
          ) : null}
          <div className="mt-3">
            <LinkButton href={`/calendar/${next.id}`} variant="primary">
              View & RSVP
            </LinkButton>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-slate-500">
            No upcoming events on the calendar yet. Check back soon!
          </p>
        </Card>
      )}

      {/* Your snack duty */}
      {mySnacks && mySnacks.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <h3 className="font-semibold text-amber-900">🍊 Your snack duty</h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {mySnacks.map((s) => (
              <li key={s.id}>
                <span className="font-medium">{formatDate(s.slot_date)}</span>
                {s.label ? ` — ${s.label}` : ""}
              </li>
            ))}
          </ul>
          <Link
            href="/calendar"
            className="mt-2 inline-block text-sm font-medium text-amber-800 underline"
          >
            View on the calendar
          </Link>
        </Card>
      ) : null}

      {/* Upcoming list */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-brand-ink">Upcoming</h3>
          <Link href="/calendar" className="text-sm text-brand-blue">
            Full calendar →
          </Link>
        </div>
        <div className="space-y-2">
          {upcoming && upcoming.length > 0 ? (
            upcoming.map((e) => (
              <Link key={e.id} href={`/calendar/${e.id}`}>
                <Card className="flex items-center justify-between hover:border-brand-green/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <EventTypeBadge type={e.type} />
                      <span className="font-medium text-brand-ink">
                        {e.title}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {formatEventWhen(e.starts_at, e.ends_at)}
                    </p>
                  </div>
                  <span className="text-slate-300">→</span>
                </Card>
              </Link>
            ))
          ) : (
            <p className="text-sm text-slate-500">Nothing scheduled yet.</p>
          )}
        </div>
      </section>

      {/* Latest news */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-brand-ink">Team news</h3>
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
            <p className="text-sm text-slate-500">No news yet.</p>
          )}
        </div>
      </section>

      <p className="pt-2 text-center text-xs text-slate-400">
        {site.teamName} · {site.season}
      </p>
    </div>
  );
}
