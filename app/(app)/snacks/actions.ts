"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function claimSnackAction(
  slotId: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.rpc("claim_snack_slot", { slot_id: slotId });
  if (error) return { error: error.message };
  revalidatePath("/snacks");
  revalidatePath("/home");
  return {};
}

export async function releaseSnackAction(
  slotId: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.rpc("release_snack_slot", {
    slot_id: slotId,
  });
  if (error) return { error: error.message };
  revalidatePath("/snacks");
  revalidatePath("/home");
  return {};
}
