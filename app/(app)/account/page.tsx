import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import { getMyPlayers } from "@/lib/players";
import {
  PlayerLinkPicker,
  type LinkablePlayer,
} from "@/components/PlayerLinkPicker";
import { updateProfileAction } from "./actions";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const supabase = createClient();
  const current = await getCurrentProfile();
  const profile = current?.profile;

  const myPlayers = await getMyPlayers(supabase, current?.userId);

  // Siblings: let a parent claim another child without a coach's help.
  const mineIds = new Set(myPlayers.map((p) => p.id));
  const [{ data: roster }, { data: myRequests }] = await Promise.all([
    supabase
      .from("players")
      .select("id, first_name")
      .eq("active", true)
      .order("first_name"),
    supabase
      .from("player_link_requests")
      .select("id, player_id, status")
      .eq("parent_id", current?.userId ?? ""),
  ]);
  const requestByPlayer = new Map(
    (myRequests ?? []).map((r) => [r.player_id, r])
  );
  const linkable: LinkablePlayer[] = (roster ?? [])
    .filter((p) => !mineIds.has(p.id))
    .map((p) => {
      const request = requestByPlayer.get(p.id);
      return {
        id: p.id,
        first_name: p.first_name,
        request: request ? { id: request.id, status: request.status } : undefined,
      };
    });

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
              </li>
            ))}
          </ul>
        ) : null}

        {myPlayers.length > 0 ? (
          <div className="mt-3">
            <PlayerLinkPicker players={linkable} mode="add" />
          </div>
        ) : null}

        {myPlayers.length === 0 ? (
          <p className="text-sm text-slate-500">
            No players are linked to your account yet — pick your child on the{" "}
            <Link href="/home" className="text-brand-blue underline">
              home page
            </Link>{" "}
            and your coach will confirm it.
          </p>
        ) : null}
      </Card>

      <p className="text-center text-xs text-slate-400">
        Role: {profile?.role === "coach" ? "Coach" : "Parent"}
      </p>
    </div>
  );
}
