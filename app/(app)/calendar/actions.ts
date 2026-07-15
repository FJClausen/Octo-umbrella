"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { RSVP_STATUSES } from "@/lib/site";

export async function setRsvpAction(
  eventId: string,
  playerId: string,
  status: string
): Promise<{ error?: string }> {
  if (!RSVP_STATUSES.includes(status as (typeof RSVP_STATUSES)[number])) {
    return { error: "Invalid status" };
  }

  const supabase = createClient();
  // RLS ensures the signed-in parent may only RSVP for their own child.
  const { error } = await supabase
    .from("rsvps")
    .upsert(
      { event_id: eventId, player_id: playerId, status },
      { onConflict: "event_id,player_id" }
    );

  if (error) return { error: error.message };

  revalidatePath(`/calendar/${eventId}`);
  revalidatePath("/home");
  return {};
}
