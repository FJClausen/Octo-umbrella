import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui";

export const metadata = { title: "Roster" };

export default async function RosterPage() {
  const supabase = createClient();
  // Only kid-safe fields are exposed here (no last names — those live in the
  // coaches-only table).
  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, positions, photo_url")
    .eq("active", true)
    .order("first_name", { ascending: true });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team Roster"
        subtitle="Our players. First names only for the girls’ privacy."
      />

      {players && players.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {players.map((p) => (
            <div
              key={p.id}
              className="card flex flex-col items-center p-4 text-center"
            >
              <div className="relative mb-2 h-20 w-20 overflow-hidden rounded-full bg-brand-green-light">
                {p.photo_url ? (
                  <Image
                    src={p.photo_url}
                    alt={p.first_name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl">
                    ⚽
                  </span>
                )}
              </div>
              <p className="font-semibold text-brand-ink">{p.first_name}</p>
              {p.positions && p.positions.length > 0 ? (
                <p className="text-xs text-slate-500">
                  {p.positions.join(", ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Roster coming soon"
          hint="Your coach will add players to the roster shortly."
        />
      )}
    </div>
  );
}
