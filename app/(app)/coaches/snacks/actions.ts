"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth";

function revalidate() {
  revalidatePath("/coaches/snacks");
  revalidatePath("/snacks");
  revalidatePath("/home");
}

export async function createSnackSlot(formData: FormData) {
  await requireCoach();
  const supabase = createClient();

  const slot_date = String(formData.get("slot_date") || "").trim();
  if (!slot_date) return;
  const eventId = String(formData.get("event_id") || "").trim();

  await supabase.from("snack_slots").insert({
    slot_date,
    label: String(formData.get("label") || "").trim() || null,
    event_id: eventId || null,
  });
  revalidate();
}

export async function deleteSnackSlot(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  await supabase
    .from("snack_slots")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidate();
}

export async function clearSnackSlot(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  // Coaches are allowed to clear any slot via this RPC.
  await supabase.rpc("release_snack_slot", {
    slot_id: String(formData.get("id")),
  });
  revalidate();
}
