import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { SnackButton } from "@/components/SnackButton";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Snack Schedule" };

export default async function SnacksPage() {
  const supabase = createClient();
  const current = await getCurrentProfile();
  const today = new Date().toISOString().slice(0, 10);

  const { data: slots } = await supabase
    .from("snack_slots")
    .select("*")
    .gte("slot_date", today)
    .order("slot_date", { ascending: true });

  const openCount = (slots ?? []).filter((s) => !s.claimed_by).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Snack Schedule"
        subtitle="Sign up to bring snacks for a game or event. Tap “I’ll bring it” to claim an open slot."
      />

      {openCount > 0 ? (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          🍊 {openCount} open snack slot{openCount === 1 ? "" : "s"} still need a
          volunteer.
        </div>
      ) : null}

      {slots && slots.length > 0 ? (
        <div className="space-y-2">
          {slots.map((s) => {
            const mine = s.claimed_by === current?.userId;
            const open = !s.claimed_by;
            return (
              <Card
                key={s.id}
                className={`flex items-center justify-between gap-3 ${
                  open ? "border-amber-200" : ""
                }`}
              >
                <div>
                  <p className="font-semibold text-brand-ink">
                    {formatDate(s.slot_date)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {s.label || "Team snack"}
                  </p>
                  <p className="mt-0.5 text-sm">
                    {open ? (
                      <span className="text-amber-600">Open — needs a volunteer</span>
                    ) : mine ? (
                      <span className="font-medium text-brand-green-dark">
                        You’re bringing this! 🎉
                      </span>
                    ) : (
                      <span className="text-slate-600">
                        {s.claimed_by_name || "Covered"} is bringing it ✓
                      </span>
                    )}
                  </p>
                </div>
                <SnackButton slotId={s.id} mine={mine} open={open} />
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No snack slots yet"
          hint="Your coach will add snack slots for upcoming games and events."
        />
      )}
    </div>
  );
}
