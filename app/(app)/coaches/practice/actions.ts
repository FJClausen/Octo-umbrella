"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth";
import { uploadDataUrl, uploadPhotoDetailed } from "@/lib/upload";
import type { Database } from "@/lib/types";

function revalidate() {
  revalidatePath("/coaches/practice");
  revalidatePath("/coaches/practice/exercises");
}

const VALID_TAGS = [
  "Passing",
  "Dribbling",
  "Defending",
  "Attacking",
  "Shooting",
  "Scrimmage Variations",
];

function parseTags(formData: FormData): string[] {
  return formData
    .getAll("tags")
    .map((t) => String(t))
    .filter((t) => VALID_TAGS.includes(t));
}

function exercisesError(message: string): never {
  redirect(`/coaches/practice/exercises?error=${encodeURIComponent(message)}`);
}

/**
 * Resolve an exercise's image: a drawn field sketch wins over an attached
 * photo file. Redirects with an error message if either upload fails.
 */
async function resolveExerciseImage(
  supabase: ReturnType<typeof createClient>,
  formData: FormData
): Promise<string | null> {
  const sketch = await uploadDataUrl(
    supabase,
    formData.get("sketch_data"),
    "practice"
  );
  if (sketch && !sketch.ok) {
    exercisesError(`Sketch upload failed: ${sketch.error}`);
  }
  if (sketch?.ok) return sketch.url;

  const uploaded = await uploadPhotoDetailed(
    supabase,
    formData.get("image"),
    "practice"
  );
  if (uploaded && !uploaded.ok) {
    exercisesError(`Photo upload failed: ${uploaded.error}`);
  }
  return uploaded?.ok ? uploaded.url : null;
}

export async function savePracticePlan(
  planId: string | null,
  formData: FormData
): Promise<{ error?: string }> {
  await requireCoach();

  const sessionDate = String(formData.get("session_date") || "").trim();
  if (!sessionDate) return { error: "Please pick a session date." };
  const supabase = createClient();

  const payload: Database["public"]["Tables"]["practice_plans"]["Insert"] = {
    event_id: String(formData.get("event_id") || "").trim() || null,
    session_date: sessionDate,
    warmup: String(formData.get("warmup") || "").trim() || null,
    exercises: String(formData.get("exercises") || "").trim() || null,
    scrimmages: String(formData.get("scrimmages") || "").trim() || null,
  };

  const uploaded = await uploadPhotoDetailed(
    supabase,
    formData.get("image"),
    "practice"
  );
  if (uploaded && !uploaded.ok) {
    return { error: `Photo upload failed: ${uploaded.error}` };
  }
  if (uploaded?.ok) payload.image_url = uploaded.url;

  const { error } = planId
    ? await supabase.from("practice_plans").update(payload).eq("id", planId)
    : await supabase.from("practice_plans").insert(payload);

  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deletePracticePlan(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  await supabase
    .from("practice_plans")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidate();
}

export async function createExerciseTemplate(formData: FormData) {
  await requireCoach();
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const supabase = createClient();

  const image_url = await resolveExerciseImage(supabase, formData);

  const { error } = await supabase.from("exercise_templates").insert({
    title,
    setup: String(formData.get("setup") || "").trim() || null,
    run_of_play: String(formData.get("run_of_play") || "").trim() || null,
    tags: parseTags(formData),
    image_url,
  });
  if (error) exercisesError(error.message);
  revalidate();
}

export async function updateExerciseTemplate(formData: FormData) {
  await requireCoach();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!id || !title) return;
  const supabase = createClient();

  const patch: Database["public"]["Tables"]["exercise_templates"]["Update"] = {
    title,
    setup: String(formData.get("setup") || "").trim() || null,
    run_of_play: String(formData.get("run_of_play") || "").trim() || null,
    tags: parseTags(formData),
  };

  const image_url = await resolveExerciseImage(supabase, formData);
  if (image_url) patch.image_url = image_url;

  const { error } = await supabase
    .from("exercise_templates")
    .update(patch)
    .eq("id", id);
  if (error) exercisesError(error.message);
  revalidate();
}

export async function deleteExerciseTemplate(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  await supabase
    .from("exercise_templates")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidate();
}
