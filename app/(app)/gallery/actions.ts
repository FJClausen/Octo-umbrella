"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { uploadPhotoDetailed } from "@/lib/upload";

export async function uploadGalleryPhoto(formData: FormData) {
  const current = await getCurrentProfile();
  if (!current) return;

  const supabase = createClient();
  const uploaded = await uploadPhotoDetailed(
    supabase,
    formData.get("photo"),
    "gallery"
  );
  if (!uploaded) return;

  const caption = String(formData.get("caption") || "").trim() || null;

  const { error } = await supabase.from("gallery_photos").insert({
    url: uploaded.url,
    storage_path: uploaded.path,
    caption,
    uploaded_by: current.userId,
  });

  if (error) {
    // Avoid an orphaned file in storage if the metadata row failed to save.
    await supabase.storage.from("photos").remove([uploaded.path]);
    return;
  }

  revalidatePath("/gallery");
}

export async function deleteGalleryPhoto(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  const storagePath = String(formData.get("storage_path") || "");
  if (!id || !storagePath) return;

  // Delete the storage object first — its RLS policy checks this row's
  // uploaded_by (or coach status), so the row must still exist for that
  // check to succeed for a non-coach deleting their own upload.
  await supabase.storage.from("photos").remove([storagePath]);
  await supabase.from("gallery_photos").delete().eq("id", id);

  revalidatePath("/gallery");
}
