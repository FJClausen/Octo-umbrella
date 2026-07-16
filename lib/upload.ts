import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

/**
 * Uploads an image File to the public "photos" bucket and returns both its
 * public URL and its storage path (needed later to delete the object).
 * Returns null if there was no file / the upload failed.
 */
export async function uploadPhotoDetailed(
  supabase: SupabaseClient<Database>,
  file: FormDataEntryValue | null,
  folder: string
): Promise<{ url: string; path: string } | null> {
  if (!file || typeof file === "string") return null;
  const blob = file as File;
  if (!blob.size) return null;

  const ext = (blob.name.split(".").pop() || "jpg").toLowerCase();
  const rand = crypto.randomUUID();
  const path = `${folder}/${rand}.${ext}`;

  const { error } = await supabase.storage
    .from("photos")
    .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });

  if (error) return null;

  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/**
 * Convenience wrapper over uploadPhotoDetailed for callers that only need
 * the public URL (news images, player headshots — coach-only uploads,
 * enforced by storage RLS).
 */
export async function uploadPhoto(
  supabase: SupabaseClient<Database>,
  file: FormDataEntryValue | null,
  folder: string
): Promise<string | null> {
  const result = await uploadPhotoDetailed(supabase, file, folder);
  return result?.url ?? null;
}
