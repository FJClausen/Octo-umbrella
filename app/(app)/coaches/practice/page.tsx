import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, SubmitButton, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { EXERCISE_TAGS, EXERCISE_TAG_STYLES, type ExerciseTag } from "@/lib/site";
import type { ExerciseTemplate } from "@/lib/types";
import { PracticePlanEditor } from "@/components/PracticePlanEditor";
import {
  savePracticePlan,
  deletePracticePlan,
  createExerciseTemplate,
  deleteExerciseTemplate,
} from "./actions";

export const metadata = { title: "Practice Planner" };

/** Text inserted into a plan field when a coach picks a saved exercise. */
function exerciseInsertText(t: ExerciseTemplate): string {
  const parts = [t.title];
  if (t.setup) parts.push(`Setup: ${t.setup}`);
  if (t.run_of_play) parts.push(`Run of play: ${t.run_of_play}`);
  return parts.join("\n");
}

function TagChips({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`badge ${
            EXERCISE_TAG_STYLES[tag as ExerciseTag] ??
            "bg-slate-100 text-slate-600"
          }`}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export default async function PracticePlannerPage({
  searchParams,
}: {
  searchParams: { error?: string; tag?: string };
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
  const editorTemplates = templateList.map((t) => ({
    id: t.id,
    title: t.title,
    insertText: exerciseInsertText(t),
  }));
  const activeTag = EXERCISE_TAGS.includes(searchParams.tag as ExerciseTag)
    ? (searchParams.tag as ExerciseTag)
    : null;
  const visibleTemplates = activeTag
    ? templateList.filter((t) => (t.tags ?? []).includes(activeTag))
    : templateList;
  const eventOptions = practiceEvents ?? [];
  const eventTitleById = new Map(eventOptions.map((e) => [e.id, e.title]));

  return (
    <div className="space-y-6">
      {searchParams.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-brand-ink">
            Saved Exercises ({templateList.length})
          </h2>
        </div>

        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-semibold text-brand-blue">
            + Save a new exercise
          </summary>
          <form action={createExerciseTemplate} className="mt-4 space-y-3">
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
              <label className="label">Setup</label>
              <textarea
                name="setup"
                rows={2}
                className="input"
                placeholder="Field markings, cones, groups, equipment…"
              />
            </div>
            <div>
              <label className="label">Run of play</label>
              <textarea
                name="run_of_play"
                rows={3}
                className="input"
                placeholder="How the exercise runs, progressions, coaching points…"
              />
            </div>
            <div>
              <label className="label">Tags</label>
              <div className="flex flex-wrap gap-3">
                {EXERCISE_TAGS.map((tag) => (
                  <label
                    key={tag}
                    className="flex items-center gap-1.5 text-sm text-slate-700"
                  >
                    <input type="checkbox" name="tags" value={tag} />
                    {tag}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">
                Photo / diagram (optional)
              </label>
              <input
                type="file"
                name="image"
                accept="image/*"
                className="text-sm"
              />
            </div>
            <SubmitButton>Save exercise</SubmitButton>
          </form>
        </details>

        {templateList.length > 0 ? (
          <>
            {/* Tag filter */}
            <div className="flex flex-wrap gap-1.5">
              <Link
                href="/coaches/practice"
                className={`badge ${
                  !activeTag
                    ? "bg-brand-ink text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                All
              </Link>
              {EXERCISE_TAGS.map((tag) => (
                <Link
                  key={tag}
                  href={`/coaches/practice?tag=${tag}`}
                  className={`badge ${
                    activeTag === tag
                      ? "bg-brand-ink text-white"
                      : `${EXERCISE_TAG_STYLES[tag]} hover:opacity-80`
                  }`}
                >
                  {tag}
                </Link>
              ))}
            </div>

            {visibleTemplates.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleTemplates.map((t) => (
                  <Card key={t.id} className="flex flex-col gap-2">
                    {t.image_url ? (
                      <a
                        href={t.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={t.image_url}
                          alt={t.title}
                          className="h-32 w-full rounded-lg object-cover"
                        />
                      </a>
                    ) : null}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-brand-ink">{t.title}</p>
                      <form action={deleteExerciseTemplate}>
                        <input type="hidden" name="id" value={t.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                    <TagChips tags={t.tags ?? []} />
                    {t.setup ? (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium text-slate-500">
                          Setup:
                        </span>{" "}
                        {t.setup}
                      </p>
                    ) : null}
                    {t.run_of_play ? (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium text-slate-500">
                          Run of play:
                        </span>{" "}
                        {t.run_of_play}
                      </p>
                    ) : null}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No exercises tagged “{activeTag}” yet.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500">
            No saved exercises yet — save one above to reuse it in future
            practice plans.
          </p>
        )}
      </section>

      <Card>
        <h2 className="mb-3 font-semibold text-brand-ink">
          + New practice session
        </h2>
        <PracticePlanEditor
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
