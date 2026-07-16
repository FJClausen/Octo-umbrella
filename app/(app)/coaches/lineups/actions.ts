"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth";
import type { LineupSlot } from "@/lib/site";

function revalidate() {
  revalidatePath("/coaches/lineups");
}

/** The general/base lineup — a singleton row with event_id = null. */
export async function saveGeneralLineup(
  formationKey: string,
  slots: LineupSlot[],
  plan: string
) {
  await requireCoach();
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("lineups")
    .select("id")
    .is("event_id", null)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("lineups")
      .update({ formation_key: formationKey, slots, plan })
      .eq("id", existing.id);
  } else {
    await supabase.from("lineups").insert({
      event_id: null,
      formation_key: formationKey,
      slots,
      plan,
    });
  }
  revalidate();
}

/** An event-specific lineup variation. */
export async function saveEventLineup(
  eventId: string,
  formationKey: string,
  slots: LineupSlot[],
  plan: string
) {
  await requireCoach();
  const supabase = createClient();
  await supabase
    .from("lineups")
    .upsert(
      { event_id: eventId, formation_key: formationKey, slots, plan },
      { onConflict: "event_id" }
    );
  revalidate();
}

/** Start an event's lineup from a copy of the current general lineup. */
export async function copyGeneralLineupToEvent(formData: FormData) {
  await requireCoach();
  const eventId = String(formData.get("event_id") || "");
  if (!eventId) return;

  const supabase = createClient();
  const { data: general } = await supabase
    .from("lineups")
    .select("formation_key, slots, plan")
    .is("event_id", null)
    .maybeSingle();

  if (!general) return;

  await supabase.from("lineups").upsert(
    {
      event_id: eventId,
      formation_key: general.formation_key,
      slots: general.slots,
      plan: general.plan,
    },
    { onConflict: "event_id" }
  );
  revalidate();
}
