import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Returns the current auth user + their profile, or null if signed out.
 */
export async function getCurrentProfile(): Promise<{
  userId: string;
  email: string | null;
  profile: Profile | null;
} | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, email: user.email ?? null, profile: profile ?? null };
}

/**
 * Require an approved account. Redirects to /login or /pending as needed.
 * Returns the guaranteed-present profile.
 */
export async function requireApproved(): Promise<Profile> {
  const current = await getCurrentProfile();
  if (!current) redirect("/login");
  if (!current.profile || current.profile.status !== "approved") {
    redirect("/pending");
  }
  return current.profile;
}

/**
 * Require an approved coach. Redirects non-coaches to the parent home.
 */
export async function requireCoach(): Promise<Profile> {
  const profile = await requireApproved();
  if (profile.role !== "coach") redirect("/home");
  return profile;
}
