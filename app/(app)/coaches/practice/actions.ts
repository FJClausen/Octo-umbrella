"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth";

function revalidate() {
  revalidatePath("/coaches/practice");
}

export async function savePracticePlan(
  planId: string | null,
  eventId: string | null,
  sessionDate: string,
  warmup: string,
  exercises: string,
  scrimmages: string
) {
  await requireCoach();
  if (!sessionDate) return;
  const supabase = createClient();

  const payload = {
    event_id: eventId,
    session_date: sessionDate,
    warmup: warmup.trim() || null,
    exercises: exercises.trim() || null,
    scrimmages: scrimmages.trim() || null,
  };

  if (planId) {
    await supabase.from("practice_plans").update(payload).eq("id", planId);
  } else {
    await supabase.from("practice_plans").insert(payload);
  }
  revalidate();
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
  await supabase.from("exercise_templates").insert({
    title,
    description: String(formData.get("description") || "").trim(),
  });
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
