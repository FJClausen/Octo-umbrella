"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireCoach } from "@/lib/auth";

export async function createNote(formData: FormData) {
  await requireCoach();
  const current = await getCurrentProfile();
  const supabase = createClient();
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  await supabase.from("coach_notes").insert({
    title,
    body: String(formData.get("body") || "").trim(),
    author_id: current?.userId ?? null,
  });
  revalidatePath("/coaches/notes");
}

export async function updateNote(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  await supabase
    .from("coach_notes")
    .update({
      title: String(formData.get("title") || "").trim(),
      body: String(formData.get("body") || "").trim(),
    })
    .eq("id", String(formData.get("id")));
  revalidatePath("/coaches/notes");
}

export async function deleteNote(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  await supabase
    .from("coach_notes")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidatePath("/coaches/notes");
}
