"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth";
import { uploadPhotoDetailed } from "@/lib/upload";
import type { NewsUpdate } from "@/lib/types";

function revalidate() {
  revalidatePath("/coaches/news");
  revalidatePath("/news");
  revalidatePath("/home");
}

function newsError(message: string): never {
  redirect(`/coaches/news?error=${encodeURIComponent(message)}`);
}

/** Upload the attached photo, reporting a failure instead of silently
 *  posting without it. */
async function resolveImage(
  supabase: ReturnType<typeof createClient>,
  formData: FormData
): Promise<string | null> {
  const uploaded = await uploadPhotoDetailed(
    supabase,
    formData.get("image"),
    "news"
  );
  if (uploaded && !uploaded.ok) {
    newsError(`Photo upload failed: ${uploaded.error}`);
  }
  return uploaded?.ok ? uploaded.url : null;
}

export async function createNews(formData: FormData) {
  const coach = await requireCoach();
  const supabase = createClient();

  const title = String(formData.get("title") || "").trim();
  if (!title) newsError("Give the announcement a title.");

  const image_url = await resolveImage(supabase, formData);

  const { error } = await supabase.from("news").insert({
    title,
    body: String(formData.get("body") || "").trim(),
    published: formData.get("published") === "on",
    image_url,
    author_id: coach.id,
  });
  if (error) newsError(error.message);
  revalidate();
}

export async function updateNews(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  const id = String(formData.get("id"));
  if (!id) return;

  const title = String(formData.get("title") || "").trim();
  if (!title) newsError("Give the announcement a title.");

  const patch: NewsUpdate = {
    title,
    body: String(formData.get("body") || "").trim(),
    published: formData.get("published") === "on",
  };
  const newImage = await resolveImage(supabase, formData);
  if (newImage) patch.image_url = newImage;

  const { error } = await supabase.from("news").update(patch).eq("id", id);
  if (error) newsError(error.message);
  revalidate();
}

export async function deleteNews(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  const { error } = await supabase
    .from("news")
    .delete()
    .eq("id", String(formData.get("id")));
  if (error) newsError(error.message);
  revalidate();
}
