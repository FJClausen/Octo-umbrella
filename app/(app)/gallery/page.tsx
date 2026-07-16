import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeader, EmptyState, SubmitButton } from "@/components/ui";
import { formatDay } from "@/lib/format";
import { uploadGalleryPhoto, deleteGalleryPhoto } from "./actions";

export const metadata = { title: "Team Gallery" };

export default async function GalleryPage() {
  const supabase = createClient();
  const current = await getCurrentProfile();
  const isCoach = current?.profile?.role === "coach";

  const [{ data: photos }, { data: profiles }] = await Promise.all([
    supabase
      .from("gallery_photos")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team Gallery"
        subtitle="Share your favorite game-day and practice photos with the team."
      />

      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-brand-ink">
          + Add a photo
        </summary>
        <form action={uploadGalleryPhoto} className="mt-4 space-y-3">
          <div>
            <label className="label">Photo</label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              required
              className="text-sm"
            />
          </div>
          <div>
            <label className="label">Caption (optional)</label>
            <input
              name="caption"
              className="input"
              placeholder="e.g. Great win against Northside!"
            />
          </div>
          <SubmitButton>Upload</SubmitButton>
        </form>
      </details>

      {photos && photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => {
            const mine = p.uploaded_by === current?.userId;
            return (
              <div key={p.id} className="card overflow-hidden p-0">
                <div className="relative aspect-square w-full bg-slate-100">
                  <Image
                    src={p.url}
                    alt={p.caption ?? "Team photo"}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-2">
                  {p.caption ? (
                    <p className="line-clamp-2 text-xs text-slate-600">
                      {p.caption}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {nameById.get(p.uploaded_by ?? "") || "A parent"} ·{" "}
                    {formatDay(p.created_at)}
                  </p>
                  {mine || isCoach ? (
                    <form action={deleteGalleryPhoto} className="mt-1">
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="storage_path"
                        value={p.storage_path}
                      />
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No photos yet"
          hint="Be the first to share a team photo!"
        />
      )}
    </div>
  );
}
