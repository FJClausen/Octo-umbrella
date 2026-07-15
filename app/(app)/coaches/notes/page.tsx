import { createClient } from "@/lib/supabase/server";
import { Card, SubmitButton, EmptyState } from "@/components/ui";
import { formatDay } from "@/lib/format";
import { createNote, updateNote, deleteNote } from "./actions";

export const metadata = { title: "Coach Notes" };

export default async function NotesPage() {
  const supabase = createClient();
  const { data: notes } = await supabase
    .from("coach_notes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-brand-ink">
          + New private note
        </summary>
        <form action={createNote} className="mt-4 space-y-3">
          <div>
            <label className="label">Title</label>
            <input name="title" required className="input" />
          </div>
          <div>
            <label className="label">Note</label>
            <textarea name="body" rows={4} className="input" />
          </div>
          <SubmitButton>Save note</SubmitButton>
        </form>
      </details>

      {notes && notes.length > 0 ? (
        <div className="space-y-2">
          {notes.map((n) => (
            <Card key={n.id}>
              <p className="font-semibold text-brand-ink">{n.title}</p>
              <p className="text-xs text-slate-400">{formatDay(n.created_at)}</p>
              {n.body ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                  {n.body}
                </p>
              ) : null}
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-brand-blue">
                  Edit
                </summary>
                <form action={updateNote} className="mt-3 space-y-3">
                  <input type="hidden" name="id" value={n.id} />
                  <input
                    name="title"
                    required
                    defaultValue={n.title}
                    className="input"
                  />
                  <textarea
                    name="body"
                    rows={4}
                    defaultValue={n.body}
                    className="input"
                  />
                  <SubmitButton>Save</SubmitButton>
                </form>
                <form action={deleteNote} className="mt-2">
                  <input type="hidden" name="id" value={n.id} />
                  <SubmitButton variant="danger">Delete</SubmitButton>
                </form>
              </details>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No notes yet"
          hint="Jot down player development notes, strategy, and to-dos — visible only to coaches."
        />
      )}
    </div>
  );
}
