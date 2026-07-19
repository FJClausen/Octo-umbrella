import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/ui";
import { PracticeSubTabs } from "@/components/PracticeSubTabs";
import {
  DIFFICULTY_LEVELS,
  DIFFICULTY_STYLES,
  EXERCISE_TAGS,
  EXERCISE_TAG_STYLES,
  exerciseSortRank,
  type Difficulty,
  type ExerciseTag,
} from "@/lib/site";
import type { ExerciseNote, ExerciseTemplate } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { FieldSketch } from "@/components/FieldSketch";
import { ExerciseGenerator } from "@/components/ExerciseGenerator";
import { PickExerciseButton } from "@/components/PickExerciseButton";
import { PLAN_SECTIONS, type PlanSection } from "@/lib/planDraft";
import {
  createExerciseTemplate,
  updateExerciseTemplate,
  deleteExerciseTemplate,
  rateExercise,
  addExerciseNote,
  deleteExerciseNote,
} from "../actions";

export const metadata = { title: "Exercise Catalogue" };

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

function ExerciseFields({ exercise }: { exercise?: ExerciseTemplate }) {
  return (
    <>
      <div>
        <label className="label">Title</label>
        <input
          name="title"
          required
          defaultValue={exercise?.title ?? ""}
          className="input"
          placeholder="e.g. Cone weave dribbling"
        />
      </div>
      <div>
        <label className="label">Setup</label>
        <textarea
          name="setup"
          rows={2}
          defaultValue={exercise?.setup ?? ""}
          className="input"
          placeholder="Field markings, cones, groups, equipment…"
        />
      </div>
      <div>
        <label className="label">Run of play</label>
        <textarea
          name="run_of_play"
          rows={3}
          defaultValue={exercise?.run_of_play ?? ""}
          className="input"
          placeholder="How the exercise runs, progressions, coaching points…"
        />
      </div>
      <div>
        <label className="label">Difficulty</label>
        <select
          name="difficulty"
          defaultValue={exercise?.difficulty ?? ""}
          className="input"
        >
          <option value="">— not set —</option>
          {DIFFICULTY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Tags</label>
        <div className="flex flex-wrap gap-3">
          {EXERCISE_TAGS.map((tag) => (
            <label
              key={tag}
              className="flex items-center gap-1.5 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                name="tags"
                value={tag}
                defaultChecked={(exercise?.tags ?? []).includes(tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label">
          Sketch the setup (optional — draw on the field, saved as the
          exercise diagram)
        </label>
        <FieldSketch />
      </div>
      <div>
        <label className="label">
          {exercise?.image_url
            ? "…or replace the diagram with a photo (optional)"
            : "…or attach a photo instead (optional)"}
        </label>
        <input type="file" name="image" accept="image/*" className="text-sm" />
      </div>
    </>
  );
}

export default async function ExerciseCataloguePage({
  searchParams,
}: {
  searchParams: {
    error?: string;
    tag?: string;
    add?: string;
    pick?: string;
    draft?: string;
  };
}) {
  const supabase = createClient();
  const [{ data: templates }, { data: notes }, { data: coaches }] =
    await Promise.all([
      supabase.from("exercise_templates").select("*").order("title"),
      supabase
        .from("exercise_notes")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name").eq("role", "coach"),
    ]);

  const templateList = [...(templates ?? [])].sort(
    (a, b) =>
      exerciseSortRank(a.tags) - exerciseSortRank(b.tags) ||
      a.title.localeCompare(b.title)
  );
  const coachNameById = new Map(
    (coaches ?? []).map((c) => [c.id, c.full_name])
  );
  const notesByExercise = new Map<string, ExerciseNote[]>();
  for (const n of notes ?? []) {
    const list = notesByExercise.get(n.exercise_id) ?? [];
    list.push(n);
    notesByExercise.set(n.exercise_id, list);
  }
  const activeTag = EXERCISE_TAGS.includes(searchParams.tag as ExerciseTag)
    ? (searchParams.tag as ExerciseTag)
    : null;
  const visibleTemplates = activeTag
    ? templateList.filter((t) => (t.tags ?? []).includes(activeTag))
    : templateList;

  // Pick mode: choosing exercises for a practice-session section.
  const pickSection = PLAN_SECTIONS.find((s) => s.key === searchParams.pick);
  const pickDraft = searchParams.draft || "new";
  const doneHref =
    pickDraft === "new"
      ? "/coaches/practice"
      : `/coaches/practice?open=${pickDraft}#plan-${pickDraft}`;

  return (
    <div className="space-y-4">
      <PracticeSubTabs active="exercises" />

      {pickSection ? (
        <div className="card sticky top-16 z-20 flex items-center justify-between gap-3 border-brand-blue/40 bg-brand-blue-light/70 p-3">
          <p className="text-sm font-medium text-brand-blue-dark">
            Choosing <strong>{pickSection.label}</strong> exercises for your
            session — tap “＋ Add” on any card.
          </p>
          <Link
            href={doneHref}
            className="btn-primary whitespace-nowrap text-sm"
          >
            ✓ Done
          </Link>
        </div>
      ) : null}

      {searchParams.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      ) : null}

      <ExerciseGenerator />

      <details className="card p-4" open={searchParams.add === "1"}>
        <summary className="cursor-pointer text-sm font-semibold text-brand-blue">
          + Save a new exercise
        </summary>
        <form action={createExerciseTemplate} className="mt-4 space-y-3">
          <ExerciseFields />
          <SubmitButton>Save exercise</SubmitButton>
        </form>
      </details>

      {templateList.length > 0 ? (
        <>
          {/* Tag filter */}
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={`/coaches/practice/exercises${
                pickSection ? `?pick=${pickSection.key}&draft=${pickDraft}` : ""
              }`}
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
                href={`/coaches/practice/exercises?tag=${tag}${
                  pickSection
                    ? `&pick=${pickSection.key}&draft=${pickDraft}`
                    : ""
                }`}
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
            <div className="space-y-2">
              {visibleTemplates.map((t) => (
                <details key={t.id} className="card group">
                  {/* Collapsed row: title + focus areas (and rating if set) */}
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 p-4 [&::-webkit-details-marker]:hidden sm:px-5">
                    <span className="text-xs text-slate-400 transition-transform group-open:rotate-90">
                      ▶
                    </span>
                    <span className="font-semibold text-brand-ink">
                      {t.title}
                    </span>
                    {t.difficulty ? (
                      <span
                        className={`badge shrink-0 ${
                          DIFFICULTY_STYLES[t.difficulty as Difficulty] ??
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {t.difficulty}
                      </span>
                    ) : null}
                    <TagChips tags={t.tags ?? []} />
                    {pickSection ? (
                      <span className="ml-auto">
                        <PickExerciseButton
                          draftKey={pickDraft}
                          section={pickSection.key as PlanSection}
                          title={t.title}
                        />
                      </span>
                    ) : null}
                    {t.rating ? (
                      <span className={`${pickSection ? "" : "ml-auto"} shrink-0 text-sm leading-none text-amber-400`}>
                        {"★".repeat(t.rating)}
                        <span className="text-slate-300">
                          {"★".repeat(5 - t.rating)}
                        </span>
                      </span>
                    ) : null}
                  </summary>

                  <div className="flex flex-col gap-2 px-4 pb-4 sm:px-5 sm:pb-5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">
                        Coaches’ rating:
                      </span>
                      <form
                        action={rateExercise}
                        className="flex items-center"
                        title="Tap a star to grade this exercise"
                      >
                        <input type="hidden" name="id" value={t.id} />
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="submit"
                            name="rating"
                            value={star}
                            aria-label={`Rate ${star} out of 5`}
                            className={`px-0.5 text-lg leading-none transition ${
                              (t.rating ?? 0) >= star
                                ? "text-amber-400 hover:text-amber-500"
                                : "text-slate-300 hover:text-amber-300"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </form>
                    </div>
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
                          className="h-40 w-full rounded-lg object-cover"
                        />
                      </a>
                    ) : null}
                    {t.setup ? (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-500">Setup:</span>{" "}
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

                  <details className="mt-1">
                    <summary className="cursor-pointer text-sm text-brand-green-dark">
                      📝 Experience notes (
                      {(notesByExercise.get(t.id) ?? []).length})
                    </summary>
                    <div className="mt-2 space-y-2">
                      {(notesByExercise.get(t.id) ?? []).map((n) => (
                        <div
                          key={n.id}
                          className="rounded-lg bg-slate-50 px-3 py-2"
                        >
                          <p className="whitespace-pre-wrap text-sm text-slate-700">
                            {n.note}
                          </p>
                          <div className="mt-1 flex items-center justify-between">
                            <p className="text-xs text-slate-400">
                              {n.author_id
                                ? coachNameById.get(n.author_id) ?? "Coach"
                                : "Coach"}{" "}
                              · {formatDate(n.created_at)}
                            </p>
                            <form action={deleteExerciseNote}>
                              <input type="hidden" name="id" value={n.id} />
                              <button
                                type="submit"
                                className="text-xs text-slate-400 hover:text-red-600"
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        </div>
                      ))}
                      <form action={addExerciseNote} className="space-y-2">
                        <input type="hidden" name="exercise_id" value={t.id} />
                        <textarea
                          name="note"
                          rows={2}
                          required
                          className="input"
                          placeholder="How did it go? What would you change next time?"
                        />
                        <SubmitButton>Add note</SubmitButton>
                      </form>
                    </div>
                  </details>

                  <details key={`edit-${t.id}`} className="mt-1">
                    <summary className="cursor-pointer text-sm text-brand-blue">
                      Edit
                    </summary>
                    {/* Keyed to the exercise's content so the form always
                        remounts with fresh defaults — prevents stale text
                        from a reused form after the list re-sorts. */}
                    <form
                      key={`${t.id}:${t.title}:${(t.setup ?? "").length}:${(t.run_of_play ?? "").length}:${(t.tags ?? []).join(",")}`}
                      action={updateExerciseTemplate}
                      className="mt-3 space-y-3"
                    >
                      <input type="hidden" name="id" value={t.id} />
                      <ExerciseFields exercise={t} />
                      <SubmitButton>Save changes</SubmitButton>
                    </form>
                    <form action={deleteExerciseTemplate} className="mt-2">
                      <input type="hidden" name="id" value={t.id} />
                      <SubmitButton variant="danger">
                        Delete exercise
                      </SubmitButton>
                    </form>
                  </details>
                  </div>
                </details>
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
          No saved exercises yet — save one above to build your catalogue.
        </p>
      )}
    </div>
  );
}
