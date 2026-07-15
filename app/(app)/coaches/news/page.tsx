import { createClient } from "@/lib/supabase/server";
import { Card, SubmitButton } from "@/components/ui";
import { formatDay } from "@/lib/format";
import { createNews, updateNews, deleteNews } from "./actions";

export const metadata = { title: "Manage News" };

export default async function ManageNewsPage() {
  const supabase = createClient();
  const { data: news } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <details className="card p-4" open>
        <summary className="cursor-pointer font-semibold text-brand-ink">
          + Post an announcement
        </summary>
        <form action={createNews} className="mt-4 space-y-3">
          <div>
            <label className="label">Title</label>
            <input name="title" required className="input" />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea name="body" rows={4} className="input" />
          </div>
          <div>
            <label className="label">Photo (optional)</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              className="text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="published" defaultChecked /> Publish now
            (visible to parents)
          </label>
          <SubmitButton>Post</SubmitButton>
        </form>
      </details>

      <div className="space-y-2">
        {(news ?? []).map((n) => (
          <Card key={n.id}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-brand-ink">{n.title}</p>
                <p className="text-xs text-slate-400">
                  {formatDay(n.created_at)} ·{" "}
                  {n.published ? (
                    <span className="text-brand-green-dark">Published</span>
                  ) : (
                    <span className="text-amber-600">Draft</span>
                  )}
                </p>
              </div>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-brand-blue">
                Edit
              </summary>
              <form action={updateNews} className="mt-3 space-y-3">
                <input type="hidden" name="id" value={n.id} />
                <div>
                  <label className="label">Title</label>
                  <input
                    name="title"
                    required
                    defaultValue={n.title}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea
                    name="body"
                    rows={4}
                    defaultValue={n.body}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">
                    Replace photo (optional)
                  </label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    className="text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="published"
                    defaultChecked={n.published}
                  />{" "}
                  Published
                </label>
                <SubmitButton>Save</SubmitButton>
              </form>
              <form action={deleteNews} className="mt-2">
                <input type="hidden" name="id" value={n.id} />
                <SubmitButton variant="danger">Delete</SubmitButton>
              </form>
            </details>
          </Card>
        ))}
      </div>
    </div>
  );
}
