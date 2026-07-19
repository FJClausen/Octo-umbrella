import { createClient } from "@/lib/supabase/server";
import { Card, SubmitButton, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { PracticePlanEditor } from "@/components/PracticePlanEditor";
import { PracticeSubTabs } from "@/components/PracticeSubTabs";
import { exerciseSortRank } from "@/lib/site";
import { savePracticePlan, deletePracticePlan } from "./actions";

export const metadata = { title: "Practice Planner" };

export default async function PracticePlannerPage({
  searchParams,
}: {
  searchParams: { error?: string; open?: string; event?: string };
}) {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: plans }, { data: templates }, { data: practiceEvents }] =
    await Promise.all([
      supabase
        .from("practice_plans")
        .select("*")
        .order("session_date", { ascending: false }),
      supabase.from("exercise_templates").select("*").order("title"),
      supabase
        .from("events")
        .select("id, title, starts_at")
        .eq("type", "practice")
        .order("starts_at", { ascending: false }),
    ]);

  const editorTemplates = [...(templates ?? [])]
    .sort(
      (a, b) =>
        exerciseSortRank(a.tags) - exerciseSortRank(b.tags) ||
        a.title.localeCompare(b.title)
    )
    .map((t) => ({
    id: t.id,
    title: t.title,
    setup: t.setup,
    run_of_play: t.run_of_play,
    tags: t.tags,
    difficulty: t.difficulty,
    image_url: t.image_url,
  }));
  const eventOptions = practiceEvents ?? [];
  const eventTitleById = new Map(eventOptions.map((e) => [e.id, e.title]));

  return (
    <div className="space-y-4">
      <PracticeSubTabs active="sessions" />

      {searchParams.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      ) : null}

      <Card>
        <h2 className="mb-3 font-semibold text-brand-ink">
          + New practice session
        </h2>
        <PracticePlanEditor
          initialEventId={
            eventOptions.some((e) => e.id === searchParams.event)
              ? searchParams.event
              : undefined
          }
          initialSessionDate={today}
          events={eventOptions}
          templates={editorTemplates}
          onSave={savePracticePlan.bind(null, null)}
          saveLabel="Save practice plan"
        />
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Past Sessions
        </h2>
        {plans && plans.length > 0 ? (
          plans.map((p) => (
            <Card key={p.id}>
              <div id={`plan-${p.id}`} className="scroll-mt-20" />
              <div className="flex items-center justify-between">
                <p className="font-semibold text-brand-ink">
                  {formatDate(p.session_date)}
                  {p.image_url ? (
                    <span className="ml-1.5 text-sm" title="Photo attached">
                      📎
                    </span>
                  ) : null}
                </p>
                {p.event_id && eventTitleById.get(p.event_id) ? (
                  <span className="text-sm text-slate-400">
                    {eventTitleById.get(p.event_id)}
                  </span>
                ) : null}
              </div>
              <details className="mt-2" open={searchParams.open === p.id}>
                <summary className="cursor-pointer text-sm text-brand-blue">
                  View / edit
                </summary>
                <div className="mt-3">
                  <PracticePlanEditor
                    initialEventId={p.event_id ?? undefined}
                    initialSessionDate={p.session_date}
                    initialWarmup={p.warmup ?? ""}
                    initialExercises={p.exercises ?? ""}
                    initialScrimmages={p.scrimmages ?? ""}
                    initialImageUrl={p.image_url}
                    events={eventOptions}
                    templates={editorTemplates}
                    onSave={savePracticePlan.bind(null, p.id)}
                    saveLabel="Save changes"
                  />
                </div>
                <form action={deletePracticePlan} className="mt-2">
                  <input type="hidden" name="id" value={p.id} />
                  <SubmitButton variant="danger">Delete session</SubmitButton>
                </form>
              </details>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No practice sessions yet"
            hint="Plan your first session above."
          />
        )}
      </div>
    </div>
  );
}
