"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireApproved, requireCoach } from "@/lib/auth";

function revalidateParent() {
  revalidatePath("/home");
  revalidatePath("/account");
  revalidatePath("/coaches");
  revalidatePath("/coaches/approvals");
}

/** A parent claims a player from the roster; a coach approves it. */
export async function requestPlayerLink(formData: FormData) {
  const profile = await requireApproved();
  const playerId = String(formData.get("player_id") || "");
  if (!playerId) return;

  const supabase = createClient();
  await supabase.from("player_link_requests").upsert(
    { player_id: playerId, parent_id: profile.id, status: "pending" },
    { onConflict: "player_id,parent_id" }
  );
  revalidateParent();
}

/** Withdraw a request you raised yourself. */
export async function cancelPlayerLinkRequest(formData: FormData) {
  await requireApproved();
  const supabase = createClient();
  // RLS limits this to the caller's own pending requests.
  await supabase
    .from("player_link_requests")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidateParent();
}

export async function approvePlayerLink(formData: FormData) {
  await requireCoach();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = createClient();
  const { data: request } = await supabase
    .from("player_link_requests")
    .select("player_id, parent_id")
    .eq("id", id)
    .maybeSingle();
  if (!request) return;

  // Linking the player is what actually grants the parent RSVP access.
  await supabase
    .from("players")
    .update({ parent_id: request.parent_id })
    .eq("id", request.player_id);

  await supabase
    .from("player_link_requests")
    .update({ status: "approved" })
    .eq("id", id);

  revalidateParent();
  revalidatePath("/coaches/roster");
}

export async function denyPlayerLink(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  await supabase
    .from("player_link_requests")
    .update({ status: "denied" })
    .eq("id", String(formData.get("id")));
  revalidateParent();
}
