import { createClient } from "@/lib/supabase/server";
import { Card, SubmitButton, EmptyState } from "@/components/ui";
import { createDocument, deleteDocument } from "./actions";

export const metadata = { title: "Documents & Links" };

export default async function DocumentsPage() {
  const supabase = createClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-brand-ink">
          + Add a document or link
        </summary>
        <form action={createDocument} className="mt-4 space-y-3">
          <div>
            <label className="label">Title</label>
            <input
              name="title"
              required
              className="input"
              placeholder="e.g. Practice plan — week 3"
            />
          </div>
          <div>
            <label className="label">Link (URL)</label>
            <input
              name="url"
              required
              className="input"
              placeholder="https://docs.google.com/…"
            />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <input name="description" className="input" />
          </div>
          <SubmitButton>Add</SubmitButton>
        </form>
      </details>

      {docs && docs.length > 0 ? (
        <div className="space-y-2">
          {docs.map((d) => (
            <Card key={d.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-blue hover:underline"
                >
                  {d.title} ↗
                </a>
                {d.description ? (
                  <p className="text-sm text-slate-500">{d.description}</p>
                ) : null}
                <p className="truncate text-xs text-slate-400">{d.url}</p>
              </div>
              <form action={deleteDocument}>
                <input type="hidden" name="id" value={d.id} />
                <SubmitButton variant="danger">Remove</SubmitButton>
              </form>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No documents yet"
          hint="Add links to practice plans, league forms, drills, and anything else your coaching staff shares."
        />
      )}
    </div>
  );
}
