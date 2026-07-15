"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export async function updateProfileAction(
  formData: FormData
): Promise<void> {
  const current = await getCurrentProfile();
  if (!current) return;

  const full_name = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  const supabase = createClient();
  // The guard trigger prevents role/status changes here regardless of input.
  await supabase
    .from("profiles")
    .update({ full_name, phone: phone || null })
    .eq("id", current.userId);

  revalidatePath("/account");
}
