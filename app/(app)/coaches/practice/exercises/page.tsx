import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, SubmitButton } from "@/components/ui";
import { PracticeSubTabs } from "@/components/PracticeSubTabs";
import {
  EXERCISE_TAGS,
  EXERCISE_TAG_STYLES,
  type ExerciseTag,
} from "@/lib/site";
import type { ExerciseTemplate } from "@/lib/types";
import { FieldSketch } from "@/components/FieldSketch";
import { ExerciseGenerator } from "@/components/ExerciseGenerator";
import {
  createExerciseTemplate,
  updateExerciseTemplate,
  deleteExerciseTemplate,
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
  searchParams: { error?: string; tag?: string };
}) {
  const supabase = createClient();
  const { data: templates } = await supabase
    .from("exercise_templates")
    .select("*")
    .order("title");

  const templateList = templates ?? [];
  const activeTag = EXERCISE_TAGS.includes(searchParams.tag as ExerciseTag)
    ? (searchParams.tag as ExerciseTag)
    : null;
  const visibleTemplates = activeTag
    ? templateList.filter((t) => (t.tags ?? []).includes(activeTag))
    : templateList;

  return (
    <div className="space-y-4">
      <PracticeSubTabs active="exercises" />

      {searchParams.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      ) : null}

      <ExerciseGenerator />

      <details className="card p-4">
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
              href="/coaches/practice/exercises"
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
                href={`/coaches/practice/exercises?tag=${tag}`}
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
                  <p className="font-semibold text-brand-ink">{t.title}</p>
                  <TagChips tags={t.tags ?? []} />
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
                    <summary className="cursor-pointer text-sm text-brand-blue">
                      Edit
                    </summary>
                    <form
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
          No saved exercises yet — save one above to build your catalogue.
        </p>
      )}
    </div>
  );
}
