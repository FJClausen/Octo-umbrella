"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth";

function clean(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

function revalidate() {
  revalidatePath("/coaches/events");
  revalidatePath("/calendar");
  revalidatePath("/home");
}

export async function createEvent(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  const starts_at = clean(formData.get("starts_at"));
  if (!starts_at) return;

  await supabase.from("events").insert({
    type: String(formData.get("type") || "game"),
    title: String(formData.get("title") || "Event").trim() || "Event",
    opponent: clean(formData.get("opponent")),
    location: clean(formData.get("location")),
    starts_at,
    ends_at: clean(formData.get("ends_at")),
    notes: clean(formData.get("notes")),
  });
  revalidate();
}

export async function updateEvent(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  const id = String(formData.get("id"));
  const starts_at = clean(formData.get("starts_at"));
  if (!id || !starts_at) return;

  await supabase
    .from("events")
    .update({
      type: String(formData.get("type") || "game"),
      title: String(formData.get("title") || "Event").trim() || "Event",
      opponent: clean(formData.get("opponent")),
      location: clean(formData.get("location")),
      starts_at,
      ends_at: clean(formData.get("ends_at")),
      notes: clean(formData.get("notes")),
    })
    .eq("id", id);
  revalidate();
}

export async function deleteEvent(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  await supabase.from("events").delete().eq("id", String(formData.get("id")));
  revalidate();
}
