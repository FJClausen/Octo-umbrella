import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, EventTypeBadge, SubmitButton } from "@/components/ui";
import { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/lib/site";
import { formatEventWhen } from "@/lib/format";
import type { EventRow, SnackSlot } from "@/lib/types";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  removeEventSnackSlot,
} from "./actions";

export const metadata = { title: "Manage Events" };

function toInputDT(value?: string | null): string {
  if (!value) return "";
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}

function AddSnackSlotFields() {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" name="add_snack_slot" />
        Also create a snack slot for this event
      </label>
      <div className="mt-2">
        <label className="label">Snack slot label (optional)</label>
        <input
          name="snack_label"
          className="input"
          placeholder="e.g. Half-time snack + water"
        />
      </div>
    </div>
  );
}

function EventFields({ event }: { event?: EventRow }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label">Type</label>
        <select name="type" defaultValue={event?.type ?? "game"} className="input">
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Title</label>
        <input
          name="title"
          required
          defaultValue={event?.title ?? ""}
          className="input"
          placeholder="e.g. Home Game"
        />
      </div>
      <div>
        <label className="label">Opponent (games)</label>
        <input
          name="opponent"
          defaultValue={event?.opponent ?? ""}
          className="input"
          placeholder="e.g. Northside United"
        />
      </div>
      <div>
        <label className="label">Location</label>
        <input
          name="location"
          defaultValue={event?.location ?? ""}
          className="input"
          placeholder="e.g. Riverside Field 1"
        />
      </div>
      <div>
        <label className="label">Starts</label>
        <input
          type="datetime-local"
          name="starts_at"
          required
          defaultValue={toInputDT(event?.starts_at)}
          className="input"
        />
      </div>
      <div>
        <label className="label">Ends (optional)</label>
        <input
          type="datetime-local"
          name="ends_at"
          defaultValue={toInputDT(event?.ends_at)}
          className="input"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Notes (optional)</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={event?.notes ?? ""}
          className="input"
          placeholder="Arrive 30 minutes early…"
        />
      </div>
    </div>
  );
}

export default async function ManageEventsPage() {
  const supabase = createClient();
  const [{ data: events }, { data: snackSlots }] = await Promise.all([
    supabase.from("events").select("*").order("starts_at", { ascending: false }),
    supabase.from("snack_slots").select("*"),
  ]);

  const snackSlotByEvent = new Map<string, SnackSlot>(
    (snackSlots ?? [])
      .filter((s) => s.event_id)
      .map((s) => [s.event_id as string, s])
  );

  return (
    <div className="space-y-6">
      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-brand-ink">
          + Add an event
        </summary>
        <form action={createEvent} className="mt-4 space-y-4">
          <EventFields />
          <AddSnackSlotFields />
          <SubmitButton>Add event</SubmitButton>
        </form>
      </details>

      <div className="space-y-2">
        {(events ?? []).map((e) => {
          const slot = snackSlotByEvent.get(e.id);
          return (
          <Card key={e.id}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <EventTypeBadge type={e.type} />
                  <span className="font-semibold text-brand-ink">
                    {e.title}
                    {e.opponent ? (
                      <span className="font-normal text-slate-500">
                        {" "}
                        vs {e.opponent}
                      </span>
                    ) : null}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {formatEventWhen(e.starts_at, e.ends_at)}
                </p>
              </div>
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-brand-blue">
                Edit
              </summary>
              <form action={updateEvent} className="mt-3 space-y-4">
                <input type="hidden" name="id" value={e.id} />
                <EventFields event={e} />
                {!slot ? <AddSnackSlotFields /> : null}
                <div className="flex gap-2">
                  <SubmitButton>Save</SubmitButton>
                </div>
              </form>

              {slot ? (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">
                      🍊 Snack slot: {slot.label || "Team snack"}
                    </p>
                    <p className="text-slate-500">
                      {slot.claimed_by
                        ? `${slot.claimed_by_name || "Covered"} ✓`
                        : "Open — needs a volunteer"}
                    </p>
                  </div>
                  <form action={removeEventSnackSlot}>
                    <input type="hidden" name="id" value={slot.id} />
                    <SubmitButton variant="danger">Remove</SubmitButton>
                  </form>
                </div>
              ) : null}

              <form action={deleteEvent} className="mt-2">
                <input type="hidden" name="id" value={e.id} />
                <SubmitButton variant="danger">Delete event</SubmitButton>
              </form>
            </details>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
