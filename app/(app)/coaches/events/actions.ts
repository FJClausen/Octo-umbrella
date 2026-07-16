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
  revalidatePath("/coaches/snacks");
  revalidatePath("/calendar");
  revalidatePath("/snacks");
  revalidatePath("/home");
}

export async function createEvent(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  const starts_at = clean(formData.get("starts_at"));
  if (!starts_at) return;

  const { data: inserted } = await supabase
    .from("events")
    .insert({
      type: String(formData.get("type") || "game"),
      title: String(formData.get("title") || "Event").trim() || "Event",
      opponent: clean(formData.get("opponent")),
      location: clean(formData.get("location")),
      starts_at,
      ends_at: clean(formData.get("ends_at")),
      notes: clean(formData.get("notes")),
    })
    .select("id")
    .single();

  if (inserted && formData.get("add_snack_slot") === "on") {
    await supabase.from("snack_slots").insert({
      event_id: inserted.id,
      slot_date: starts_at.slice(0, 10),
      label: clean(formData.get("snack_label")),
    });
  }

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
