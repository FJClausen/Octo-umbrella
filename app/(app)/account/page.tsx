import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import { updateProfileAction } from "./actions";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const supabase = createClient();
  const current = await getCurrentProfile();
  const profile = current?.profile;

  const { data: myPlayers } = await supabase
    .from("players")
    .select("id, first_name, positions")
    .eq("parent_id", current?.userId ?? "")
    .order("first_name");

  return (
    <div className="space-y-6">
      <PageHeader title="Your Account" subtitle={current?.email ?? undefined} />

      <Card>
        <form action={updateProfileAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="full_name">
              Name
            </label>
            <input
              id="full_name"
              name="full_name"
              className="input"
              defaultValue={profile?.full_name ?? ""}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Phone (optional — shared only with coaches)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="input"
              defaultValue={profile?.phone ?? ""}
              placeholder="(555) 123-4567"
            />
          </div>
          <button type="submit" className="btn-primary">
            Save changes
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-2 font-semibold text-brand-ink">Your players</h2>
        {myPlayers && myPlayers.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {myPlayers.map((p) => (
              <li key={p.id} className="flex items-center gap-2 py-2 text-sm">
                <span className="font-medium text-brand-ink">
                  {p.first_name}
                </span>
                {p.positions && p.positions.length > 0 ? (
                  <span className="text-slate-500">
                    · {p.positions.join(", ")}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">
            No players are linked to your account yet. Ask your coach to link
            your child to you so you can RSVP for games.
          </p>
        )}
      </Card>

      <p className="text-center text-xs text-slate-400">
        Role: {profile?.role === "coach" ? "Coach" : "Parent"}
      </p>
    </div>
  );
}
