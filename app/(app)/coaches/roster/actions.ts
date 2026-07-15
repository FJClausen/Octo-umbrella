"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth";
import { uploadPhoto } from "@/lib/upload";
import type { PlayerUpdate } from "@/lib/types";

function clean(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

function num(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function revalidate() {
  revalidatePath("/coaches/roster");
  revalidatePath("/coaches/contacts");
  revalidatePath("/roster");
}

export async function createPlayer(formData: FormData) {
  await requireCoach();
  const supabase = createClient();

  const first_name = String(formData.get("first_name") || "").trim();
  if (!first_name) return;

  const photo_url = await uploadPhoto(supabase, formData.get("photo"), "players");

  const { data: inserted } = await supabase
    .from("players")
    .insert({
      first_name,
      jersey_number: num(formData.get("jersey_number")),
      position: clean(formData.get("position")),
      parent_id: clean(formData.get("parent_id")),
      photo_url,
    })
    .select("id")
    .single();

  if (inserted) {
    await supabase.from("player_private").insert({
      player_id: inserted.id,
      last_name: clean(formData.get("last_name")),
      medical_notes: clean(formData.get("medical_notes")),
      emergency_contact: clean(formData.get("emergency_contact")),
    });
  }
  revalidate();
}

export async function updatePlayer(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  const id = String(formData.get("id"));
  if (!id) return;

  const patch: PlayerUpdate = {
    first_name: String(formData.get("first_name") || "").trim(),
    jersey_number: num(formData.get("jersey_number")),
    position: clean(formData.get("position")),
    parent_id: clean(formData.get("parent_id")),
    active: formData.get("active") === "on",
  };

  const photo_url = await uploadPhoto(supabase, formData.get("photo"), "players");
  if (photo_url) patch.photo_url = photo_url;

  await supabase.from("players").update(patch).eq("id", id);

  await supabase.from("player_private").upsert({
    player_id: id,
    last_name: clean(formData.get("last_name")),
    medical_notes: clean(formData.get("medical_notes")),
    emergency_contact: clean(formData.get("emergency_contact")),
  });
  revalidate();
}

export async function deletePlayer(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  await supabase.from("players").delete().eq("id", String(formData.get("id")));
  revalidate();
}
