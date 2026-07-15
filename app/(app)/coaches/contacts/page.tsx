import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState } from "@/components/ui";
import type { PlayerPrivate, Profile } from "@/lib/types";

export const metadata = { title: "Contacts" };

export default async function ContactsPage() {
  const supabase = createClient();

  const [{ data: players }, { data: priv }, { data: profiles }] =
    await Promise.all([
      supabase.from("players").select("*").order("first_name"),
      supabase.from("player_private").select("*"),
      supabase.from("profiles").select("*"),
    ]);

  const privById = new Map<string, PlayerPrivate>(
    (priv ?? []).map((p) => [p.player_id, p])
  );
  const profileById = new Map<string, Profile>(
    (profiles ?? []).map((p) => [p.id, p])
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Full player and family contact details. Coaches only — this is never
        shown to parents.
      </p>

      {players && players.length > 0 ? (
        <div className="space-y-2">
          {players.map((pl) => {
            const pv = privById.get(pl.id);
            const parent = pl.parent_id
              ? profileById.get(pl.parent_id)
              : undefined;
            return (
              <Card key={pl.id}>
                <p className="font-semibold text-brand-ink">
                  {pl.first_name}
                  {pv?.last_name ? ` ${pv.last_name}` : ""}
                  {pl.jersey_number != null ? (
                    <span className="text-slate-400"> #{pl.jersey_number}</span>
                  ) : null}
                  {pl.position ? (
                    <span className="ml-1 text-sm font-normal text-slate-500">
                      · {pl.position}
                    </span>
                  ) : null}
                </p>
                <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-400">Parent</dt>
                    <dd className="text-slate-700">
                      {parent?.full_name || (
                        <span className="text-amber-600">Not linked</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Parent email</dt>
                    <dd className="text-slate-700">
                      {parent?.email ? (
                        <a
                          href={`mailto:${parent.email}`}
                          className="text-brand-blue"
                        >
                          {parent.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Parent phone</dt>
                    <dd className="text-slate-700">
                      {parent?.phone ? (
                        <a
                          href={`tel:${parent.phone}`}
                          className="text-brand-blue"
                        >
                          {parent.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Emergency contact</dt>
                    <dd className="text-slate-700">
                      {pv?.emergency_contact || "—"}
                    </dd>
                  </div>
                  {pv?.medical_notes ? (
                    <div className="sm:col-span-2">
                      <dt className="text-slate-400">Medical notes</dt>
                      <dd className="text-slate-700">{pv.medical_notes}</dd>
                    </div>
                  ) : null}
                </dl>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No players yet"
          hint="Add players in the Roster tab to build your contact list."
        />
      )}
    </div>
  );
}
