"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireCoach } from "@/lib/auth";
import { uploadPhoto } from "@/lib/upload";
import type { NewsUpdate } from "@/lib/types";

function revalidate() {
  revalidatePath("/coaches/news");
  revalidatePath("/news");
  revalidatePath("/home");
}

export async function createNews(formData: FormData) {
  const coach = await requireCoach();
  const current = await getCurrentProfile();
  const supabase = createClient();

  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const image_url = await uploadPhoto(supabase, formData.get("image"), "news");

  await supabase.from("news").insert({
    title,
    body: String(formData.get("body") || "").trim(),
    published: formData.get("published") === "on",
    image_url,
    author_id: current?.userId ?? coach.id,
  });
  revalidate();
}

export async function updateNews(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  const id = String(formData.get("id"));
  if (!id) return;

  const newImage = await uploadPhoto(supabase, formData.get("image"), "news");
  const patch: NewsUpdate = {
    title: String(formData.get("title") || "").trim(),
    body: String(formData.get("body") || "").trim(),
    published: formData.get("published") === "on",
  };
  if (newImage) patch.image_url = newImage;

  await supabase.from("news").update(patch).eq("id", id);
  revalidate();
}

export async function deleteNews(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  await supabase.from("news").delete().eq("id", String(formData.get("id")));
  revalidate();
}
