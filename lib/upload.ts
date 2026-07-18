import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string }
  | null; // null = no file was provided (not an error)

/**
 * Uploads an image File to the public "photos" bucket. Returns the public
 * URL + storage path on success, an error message on failure, or null when
 * no file was attached to the form.
 */
export async function uploadPhotoDetailed(
  supabase: SupabaseClient<Database>,
  file: FormDataEntryValue | null,
  folder: string
): Promise<UploadResult> {
  if (!file || typeof file === "string") return null;
  const blob = file as File;
  if (!blob.size) return null;

  const ext = (blob.name.split(".").pop() || "jpg").toLowerCase();
  const rand = crypto.randomUUID();
  const path = `${folder}/${rand}.${ext}`;

  const { error } = await supabase.storage
    .from("photos")
    .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });

  if (error) {
    console.error(`Photo upload failed (${path}):`, error.message);
    return { ok: false, error: error.message };
  }

  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}

/**
 * Uploads a base64 data-URL image (e.g. a canvas sketch) to the public
 * "photos" bucket. Returns null when the value is empty / not a data URL.
 */
export async function uploadDataUrl(
  supabase: SupabaseClient<Database>,
  dataUrl: FormDataEntryValue | null,
  folder: string
): Promise<UploadResult> {
  const s = String(dataUrl ?? "");
  if (!s.startsWith("data:image/")) return null;

  const commaIdx = s.indexOf(",");
  if (commaIdx < 0) return null;
  const meta = s.slice(5, s.indexOf(";")); // e.g. "image/png"
  const bytes = Buffer.from(s.slice(commaIdx + 1), "base64");
  if (!bytes.length) return null;

  const ext = meta.split("/")[1] || "png";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("photos")
    .upload(path, bytes, { contentType: meta, upsert: false });

  if (error) {
    console.error(`Sketch upload failed (${path}):`, error.message);
    return { ok: false, error: error.message };
  }

  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}

/**
 * Convenience wrapper for callers that only need the public URL (news
 * images, player headshots). Returns null on no-file or failure.
 */
export async function uploadPhoto(
  supabase: SupabaseClient<Database>,
  file: FormDataEntryValue | null,
  folder: string
): Promise<string | null> {
  const result = await uploadPhotoDetailed(supabase, file, folder);
  return result?.ok ? result.url : null;
}
