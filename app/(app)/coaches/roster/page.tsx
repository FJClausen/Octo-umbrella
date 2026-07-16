import { createClient } from "@/lib/supabase/server";
import { Card, SubmitButton, EmptyState } from "@/components/ui";
import { PLAYER_POSITIONS } from "@/lib/site";
import type { Player, PlayerPrivate, Profile } from "@/lib/types";
import { createPlayer, updatePlayer, deletePlayer } from "./actions";

export const metadata = { title: "Manage Roster" };

function ParentSelect({
  parents,
  value,
}: {
  parents: Pick<Profile, "id" | "full_name" | "email">[];
  value?: string | null;
}) {
  return (
    <select name="parent_id" defaultValue={value ?? ""} className="input">
      <option value="">— no parent linked —</option>
      {parents.map((p) => (
        <option key={p.id} value={p.id}>
          {p.full_name || p.email}
        </option>
      ))}
    </select>
  );
}

function PositionCheckboxes({ selected = [] }: { selected?: string[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {PLAYER_POSITIONS.map((p) => (
        <label
          key={p}
          className="flex items-center gap-1.5 text-sm text-slate-700"
        >
          <input
            type="checkbox"
            name="positions"
            value={p}
            defaultChecked={selected.includes(p)}
            className="rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
          />
          {p}
        </label>
      ))}
    </div>
  );
}

export default async function ManageRosterPage() {
  const supabase = createClient();

  const [{ data: players }, { data: priv }, { data: parents }] =
    await Promise.all([
      supabase.from("players").select("*").order("first_name"),
      supabase.from("player_private").select("*"),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("status", "approved")
        .order("full_name"),
    ]);

  const privById = new Map<string, PlayerPrivate>(
    (priv ?? []).map((p) => [p.player_id, p])
  );
  const parentList = parents ?? [];

  return (
    <div className="space-y-6">
      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-brand-ink">
          + Add a player
        </summary>
        <form action={createPlayer} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">First name</label>
            <input name="first_name" required className="input" />
          </div>
          <div>
            <label className="label">Last name (coaches only)</label>
            <input name="last_name" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Positions</label>
            <PositionCheckboxes />
          </div>
          <div>
            <label className="label">Parent account</label>
            <ParentSelect parents={parentList} />
          </div>
          <div>
            <label className="label">Photo</label>
            <input type="file" name="photo" accept="image/*" className="text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Coaching notes (coaches only)</label>
            <textarea
              name="coaching_notes"
              rows={3}
              className="input"
              placeholder="Development notes, strategy, things to work on…"
            />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton>Add player</SubmitButton>
          </div>
        </form>
      </details>

      {players && players.length > 0 ? (
        <div className="space-y-2">
          {players.map((pl: Player) => {
            const pv = privById.get(pl.id);
            return (
              <Card key={pl.id}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-brand-ink">
                    {pl.first_name}
                    {pv?.last_name ? ` ${pv.last_name}` : ""}
                    {!pl.active ? (
                      <span className="ml-2 badge bg-slate-100 text-slate-500">
                        Inactive
                      </span>
                    ) : null}
                  </p>
                  <span className="text-sm text-slate-400">
                    {pl.positions && pl.positions.length > 0
                      ? pl.positions.join(", ")
                      : "—"}
                  </span>
                </div>

                {pv?.coaching_notes ? (
                  <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-sm text-slate-600">
                    {pv.coaching_notes}
                  </p>
                ) : null}

                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-brand-blue">
                    Edit
                  </summary>
                  <form
                    action={updatePlayer}
                    className="mt-3 grid gap-3 sm:grid-cols-2"
                  >
                    <input type="hidden" name="id" value={pl.id} />
                    <div>
                      <label className="label">First name</label>
                      <input
                        name="first_name"
                        required
                        defaultValue={pl.first_name}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Last name</label>
                      <input
                        name="last_name"
                        defaultValue={pv?.last_name ?? ""}
                        className="input"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Positions</label>
                      <PositionCheckboxes selected={pl.positions ?? []} />
                    </div>
                    <div>
                      <label className="label">Parent account</label>
                      <ParentSelect parents={parentList} value={pl.parent_id} />
                    </div>
                    <div>
                      <label className="label">Replace photo</label>
                      <input
                        type="file"
                        name="photo"
                        accept="image/*"
                        className="text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Coaching notes</label>
                      <textarea
                        name="coaching_notes"
                        rows={3}
                        defaultValue={pv?.coaching_notes ?? ""}
                        className="input"
                        placeholder="Development notes, strategy, things to work on…"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={pl.active}
                      />{" "}
                      Active (shown on the roster)
                    </label>
                    <div className="sm:col-span-2">
                      <SubmitButton>Save</SubmitButton>
                    </div>
                  </form>
                  <form action={deletePlayer} className="mt-2">
                    <input type="hidden" name="id" value={pl.id} />
                    <SubmitButton variant="danger">Delete player</SubmitButton>
                  </form>
                </details>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No players yet" hint="Add your roster above." />
      )}
    </div>
  );
}
