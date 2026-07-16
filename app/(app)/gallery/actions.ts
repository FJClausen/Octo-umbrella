"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { uploadPhotoDetailed } from "@/lib/upload";

function fail(message: string): never {
  redirect(`/gallery?error=${encodeURIComponent(message)}`);
}

export async function uploadGalleryPhoto(formData: FormData) {
  const current = await getCurrentProfile();
  if (!current) fail("You must be signed in to upload.");

  const supabase = createClient();
  const uploaded = await uploadPhotoDetailed(
    supabase,
    formData.get("photo"),
    "gallery"
  );
  if (!uploaded) fail("No photo was selected.");
  if (!uploaded.ok) fail(`Upload failed: ${uploaded.error}`);

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
    fail(`Could not save photo: ${error.message}`);
  }

  revalidatePath("/gallery");
  redirect("/gallery");
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
  // If deleted from the photo's own page, go back to the gallery.
  if (formData.get("redirect_to_gallery") === "1") {
    redirect("/gallery");
  }
}

export async function addPhotoComment(formData: FormData) {
  const current = await getCurrentProfile();
  if (!current) return;

  const photoId = String(formData.get("photo_id") || "");
  const body = String(formData.get("body") || "").trim();
  if (!photoId || !body) return;

  const supabase = createClient();
  const { error } = await supabase.from("photo_comments").insert({
    photo_id: photoId,
    author_id: current.userId,
    author_name: current.profile?.full_name || "A parent",
    body,
  });

  if (error) {
    redirect(
      `/gallery/${photoId}?error=${encodeURIComponent(error.message)}`
    );
  }
  revalidatePath(`/gallery/${photoId}`);
}

export async function deletePhotoComment(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  const photoId = String(formData.get("photo_id") || "");
  if (!id) return;

  await supabase.from("photo_comments").delete().eq("id", id);
  if (photoId) revalidatePath(`/gallery/${photoId}`);
}
