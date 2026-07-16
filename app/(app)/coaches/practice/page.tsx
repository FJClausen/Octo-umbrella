import { createClient } from "@/lib/supabase/server";
import { Card, SubmitButton, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { PracticePlanEditor } from "@/components/PracticePlanEditor";
import {
  savePracticePlan,
  deletePracticePlan,
  createExerciseTemplate,
  deleteExerciseTemplate,
} from "./actions";

export const metadata = { title: "Practice Planner" };

export default async function PracticePlannerPage({
  searchParams,
}: {
  searchParams: { error?: string };
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

  const templateList = templates ?? [];
  const eventOptions = practiceEvents ?? [];
  const eventTitleById = new Map(eventOptions.map((e) => [e.id, e.title]));

  return (
    <div className="space-y-6">
      {searchParams.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      ) : null}

      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-brand-ink">
          Exercise Templates ({templateList.length})
        </summary>
        <div className="mt-4 space-y-3">
          <form
            action={createExerciseTemplate}
            className="space-y-2 rounded-lg border border-slate-200 p-3"
          >
            <div>
              <label className="label">Title</label>
              <input
                name="title"
                required
                className="input"
                placeholder="e.g. Cone weave dribbling"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                name="description"
                rows={2}
                className="input"
                placeholder="How to run the drill…"
              />
            </div>
            <div>
              <label className="label">
                Photo / note (optional — e.g. drill diagram)
              </label>
              <input
                type="file"
                name="image"
                accept="image/*"
                className="text-sm"
              />
            </div>
            <SubmitButton>Save template</SubmitButton>
          </form>

          {templateList.length > 0 ? (
            <ul className="space-y-2">
              {templateList.map((t) => (
                <li
                  key={t.id}
                  className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 p-2 text-sm"
                >
                  <div className="flex items-start gap-2">
                    {t.image_url ? (
                      <a
                        href={t.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={t.image_url}
                          alt=""
                          className="h-12 w-12 rounded object-cover"
                        />
                      </a>
                    ) : null}
                    <div>
                      <p className="font-medium text-brand-ink">{t.title}</p>
                      {t.description ? (
                        <p className="text-slate-500">{t.description}</p>
                      ) : null}
                    </div>
                  </div>
                  <form action={deleteExerciseTemplate}>
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              No saved exercises yet — add one above to reuse it in future
              practice plans.
            </p>
          )}
        </div>
      </details>

      <Card>
        <h2 className="mb-3 font-semibold text-brand-ink">
          + New practice session
        </h2>
        <PracticePlanEditor
          initialSessionDate={today}
          events={eventOptions}
          templates={templateList}
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
              <details className="mt-2">
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
                    templates={templateList}
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
