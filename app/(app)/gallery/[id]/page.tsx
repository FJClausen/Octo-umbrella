import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Alert, Card, SubmitButton } from "@/components/ui";
import { formatDay } from "@/lib/format";
import {
  deleteGalleryPhoto,
  addPhotoComment,
  deletePhotoComment,
} from "../actions";

export const metadata = { title: "Photo" };

export default async function PhotoDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const current = await getCurrentProfile();
  const isCoach = current?.profile?.role === "coach";

  const { data: photo } = await supabase
    .from("gallery_photos")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!photo) notFound();

  const [{ data: comments }, { data: profiles }] = await Promise.all([
    supabase
      .from("photo_comments")
      .select("*")
      .eq("photo_id", photo.id)
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const uploaderName =
    nameById.get(photo.uploaded_by ?? "") || "A parent";
  const canDeletePhoto = isCoach || photo.uploaded_by === current?.userId;

  return (
    <div className="space-y-4">
      <Link href="/gallery" className="text-sm text-brand-blue">
        ← Back to gallery
      </Link>

      {searchParams.error ? (
        <Alert variant="error">{searchParams.error}</Alert>
      ) : null}

      {/* Full-size photo, uncropped */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption ?? "Team photo"}
          className="mx-auto h-auto max-h-[80vh] w-auto max-w-full"
        />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          {photo.caption ? (
            <p className="font-medium text-brand-ink">{photo.caption}</p>
          ) : null}
          <p className="text-sm text-slate-500">
            {uploaderName} · {formatDay(photo.created_at)}
          </p>
        </div>
        {canDeletePhoto ? (
          <form action={deleteGalleryPhoto}>
            <input type="hidden" name="id" value={photo.id} />
            <input
              type="hidden"
              name="storage_path"
              value={photo.storage_path}
            />
            <input type="hidden" name="redirect_to_gallery" value="1" />
            <SubmitButton variant="danger">Delete photo</SubmitButton>
          </form>
        ) : null}
      </div>

      <Card>
        <h2 className="mb-3 font-semibold text-brand-ink">
          Comments ({(comments ?? []).length})
        </h2>

        {comments && comments.length > 0 ? (
          <ul className="mb-4 space-y-3">
            {comments.map((c) => {
              const canDeleteComment =
                isCoach || c.author_id === current?.userId;
              return (
                <li key={c.id} className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-700">{c.body}</p>
                    {canDeleteComment ? (
                      <form action={deletePhotoComment}>
                        <input type="hidden" name="id" value={c.id} />
                        <input
                          type="hidden"
                          name="photo_id"
                          value={photo.id}
                        />
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {c.author_name ||
                      nameById.get(c.author_id ?? "") ||
                      "A parent"}{" "}
                    · {formatDay(c.created_at)}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-slate-500">
            No comments yet — be the first!
          </p>
        )}

        <form action={addPhotoComment} className="flex gap-2">
          <input type="hidden" name="photo_id" value={photo.id} />
          <input
            name="body"
            required
            maxLength={500}
            className="input"
            placeholder="Add a comment…"
          />
          <SubmitButton>Post</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
