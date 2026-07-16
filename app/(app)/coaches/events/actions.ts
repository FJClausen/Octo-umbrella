"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth";

function clean(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

function num(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const TYPE_TITLES: Record<string, string> = {
  game: "Game",
  practice: "Practice",
  event: "Team Event",
};

/** Shared form parsing for create/update. Title falls back to the type name. */
function eventPayload(formData: FormData, starts_at: string) {
  const type = String(formData.get("type") || "game");
  const jersey = clean(formData.get("jersey_color"));
  return {
    type,
    title:
      String(formData.get("title") || "").trim() ||
      TYPE_TITLES[type] ||
      "Event",
    opponent: clean(formData.get("opponent")),
    location: clean(formData.get("location")),
    starts_at,
    ends_at: clean(formData.get("ends_at")),
    notes: clean(formData.get("notes")),
    jersey_color: jersey === "blue" || jersey === "red" ? jersey : null,
    score_us: num(formData.get("score_us")),
    score_them: num(formData.get("score_them")),
  };
}

function revalidate() {
  revalidatePath("/coaches/events");
  revalidatePath("/calendar");
  revalidatePath("/calendar/[id]", "page");
  revalidatePath("/home");
}

export async function createEvent(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  const starts_at = clean(formData.get("starts_at"));
  if (!starts_at) return;

  const { data: inserted } = await supabase
    .from("events")
    .insert(eventPayload(formData, starts_at))
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
  // Land on the events list with a "share to WhatsApp" prompt for the new event.
  if (inserted) redirect(`/coaches/events?share=${inserted.id}`);
}

export async function updateEvent(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  const id = String(formData.get("id"));
  const starts_at = clean(formData.get("starts_at"));
  if (!id || !starts_at) return;

  await supabase
    .from("events")
    .update(eventPayload(formData, starts_at))
    .eq("id", id);

  if (formData.get("add_snack_slot") === "on") {
    const { data: existing } = await supabase
      .from("snack_slots")
      .select("id")
      .eq("event_id", id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("snack_slots").insert({
        event_id: id,
        slot_date: starts_at.slice(0, 10),
        label: clean(formData.get("snack_label")),
      });
    }
  }

  revalidate();
}

export async function deleteEvent(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  await supabase.from("events").delete().eq("id", String(formData.get("id")));
  revalidate();
}

export async function removeEventSnackSlot(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  await supabase
    .from("snack_slots")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidate();
}
