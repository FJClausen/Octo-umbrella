import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

/**
 * Uploads an image File to the public "photos" bucket and returns its public
 * URL, or null if there was no file / the upload failed. Coaches only (enforced
 * by storage RLS).
 */
export async function uploadPhoto(
  supabase: SupabaseClient<Database>,
  file: FormDataEntryValue | null,
  folder: string
): Promise<string | null> {
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
  return data.publicUrl;
}
