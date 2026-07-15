"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth";

export async function saveLineup(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  const event_id = String(formData.get("event_id"));
  if (!event_id) return;

  await supabase.from("lineups").upsert(
    {
      event_id,
      formation: String(formData.get("formation") || "").trim() || null,
      plan: String(formData.get("plan") || "").trim() || null,
    },
    { onConflict: "event_id" }
  );
  revalidatePath("/coaches/lineups");
}
