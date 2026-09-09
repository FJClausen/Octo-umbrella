import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

export type MyPlayer = { id: string; first_name: string };

/**
 * The children linked to this account. A child can have several parents
 * (two guardians, separated families, a grandparent who does pickup), so
 * links live in player_parents rather than a column on the player.
 */
export async function getMyPlayers(
  supabase: SupabaseClient<Database>,
  userId: string | null | undefined
): Promise<MyPlayer[]> {
  if (!userId) return [];

  const { data: links } = await supabase
    .from("player_parents")
    .select("player_id")
    .eq("parent_id", userId);

  const ids = (links ?? []).map((l) => l.player_id);
  if (!ids.length) return [];

  const { data: players } = await supabase
    .from("players")
    .select("id, first_name")
    .in("id", ids)
    .eq("active", true)
    .order("first_name");

  return players ?? [];
}
