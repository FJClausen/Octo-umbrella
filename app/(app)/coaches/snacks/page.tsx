import { createClient } from "@/lib/supabase/server";
import { Card, SubmitButton, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { createSnackSlot, deleteSnackSlot, clearSnackSlot } from "./actions";

export const metadata = { title: "Manage Snacks" };

export default async function ManageSnacksPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: slots }, { data: games }] = await Promise.all([
    supabase.from("snack_slots").select("*").order("slot_date"),
    supabase
      .from("events")
      .select("id, title, starts_at, type")
      .gte("starts_at", `${today}T00:00:00`)
      .order("starts_at"),
  ]);

  return (
    <div className="space-y-6">
      <details className="card p-4" open>
        <summary className="cursor-pointer font-semibold text-brand-ink">
          + Add a snack slot
        </summary>
        <form action={createSnackSlot} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Date</label>
            <input type="date" name="slot_date" required className="input" />
          </div>
          <div>
            <label className="label">Link to event (optional)</label>
            <select name="event_id" className="input" defaultValue="">
              <option value="">— none —</option>
              {(games ?? []).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({formatDate(g.starts_at)})
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Label (optional)</label>
            <input
              name="label"
              className="input"
              placeholder="e.g. Half-time oranges + water"
            />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton>Add slot</SubmitButton>
          </div>
        </form>
      </details>

      {slots && slots.length > 0 ? (
        <div className="space-y-2">
          {slots.map((s) => (
            <Card key={s.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-brand-ink">
                  {formatDate(s.slot_date)}
                </p>
                <p className="text-sm text-slate-500">{s.label || "Team snack"}</p>
                <p className="text-sm">
                  {s.claimed_by ? (
                    <span className="text-brand-green-dark">
                      {s.claimed_by_name || "Covered"} ✓
                    </span>
                  ) : (
                    <span className="text-amber-600">Open</span>
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {s.claimed_by ? (
                  <form action={clearSnackSlot}>
                    <input type="hidden" name="id" value={s.id} />
                    <SubmitButton variant="outline">Clear</SubmitButton>
                  </form>
                ) : null}
                <form action={deleteSnackSlot}>
                  <input type="hidden" name="id" value={s.id} />
                  <SubmitButton variant="danger">Delete</SubmitButton>
                </form>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No snack slots yet" hint="Add slots for upcoming games above." />
      )}
    </div>
  );
}
