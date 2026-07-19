import { format } from "date-fns";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, SubmitButton, eventCardTint } from "@/components/ui";
import { EventCardBody } from "@/components/EventCard";
import { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/lib/site";
import { countRsvpsByEvent } from "@/lib/rsvp";
import { newEventMessage } from "@/lib/whatsapp";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ImportSchedule } from "@/components/ImportSchedule";
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
        <label className="label">Title (optional)</label>
        <input
          name="title"
          defaultValue={event?.title ?? ""}
          className="input"
          placeholder="Defaults to Game / Practice / Team Event"
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
        <label className="label">Jersey color (games)</label>
        <select
          name="jersey_color"
          defaultValue={event?.jersey_color ?? ""}
          className="input"
        >
          <option value="">— not set —</option>
          <option value="blue">🔵 Blue (home game)</option>
          <option value="red">🔴 Red (away game)</option>
        </select>
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
      <div className="sm:col-span-2">
        <label className="label">Final score (games — fill in after playing)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="score_us"
            min={0}
            defaultValue={event?.score_us ?? ""}
            className="input w-24"
            placeholder="Us"
          />
          <span className="text-slate-400">–</span>
          <input
            type="number"
            name="score_them"
            min={0}
            defaultValue={event?.score_them ?? ""}
            className="input w-24"
            placeholder="Them"
          />
        </div>
      </div>
    </div>
  );
}

export default async function ManageEventsPage({
  searchParams,
}: {
  searchParams: { share?: string; edit?: string };
}) {
  const supabase = createClient();
  const [{ data: events }, { data: snackSlots }, { data: rsvps }] =
    await Promise.all([
      supabase
        .from("events")
        .select("*")
        .order("starts_at", { ascending: false }),
      supabase.from("snack_slots").select("*"),
      supabase.from("rsvps").select("event_id, status"),
    ]);

  const snackSlotByEvent = new Map<string, SnackSlot>(
    (snackSlots ?? [])
      .filter((s) => s.event_id)
      .map((s) => [s.event_id as string, s])
  );
  const rsvpCounts = countRsvpsByEvent(rsvps);

  const shareEvent = searchParams.share
    ? (events ?? []).find((e) => e.id === searchParams.share)
    : undefined;

  return (
    <div className="space-y-6">
      {shareEvent ? (
        <div className="card border-[#25D366]/40 bg-[#25D366]/5 p-4">
          <p className="font-semibold text-brand-ink">
            ✅ Event added: {shareEvent.title}
          </p>
          <p className="mb-3 text-sm text-slate-500">
            Want to alert the team? This opens WhatsApp with the announcement
            pre-written — pick your team group and hit send.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <WhatsAppButton
              text={newEventMessage(
                shareEvent,
                snackSlotByEvent.get(shareEvent.id) ?? null
              )}
              label="Announce on WhatsApp"
            />
            <Link href="/coaches/events" className="text-sm text-slate-500">
              Skip
            </Link>
          </div>
        </div>
      ) : null}

      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-brand-ink">
          + Add an event
        </summary>
        <form action={createEvent} className="mt-4 space-y-4">
          <EventFields />
          <div className="rounded-lg border border-slate-200 p-3">
            <label className="label">
              🔁 Repeat weekly until (optional — e.g. for practices)
            </label>
            <input type="date" name="repeat_until" className="input" />
            <p className="mt-1 text-xs text-slate-500">
              Creates a copy of this event every week through the chosen
              date.
            </p>
          </div>
          <AddSnackSlotFields />
          <SubmitButton>Add event</SubmitButton>
        </form>
      </details>

      <ImportSchedule />

      <div className="space-y-2">
        {(events ?? []).map((e) => {
          const slot = snackSlotByEvent.get(e.id);
          return (
          <Card key={e.id} className={eventCardTint(e.type)}>
            {/* Anchor target so links can land on (and auto-open) this event */}
            <div id={`event-${e.id}`} className="scroll-mt-20" />
            <EventCardBody
              event={e}
              snack={slot ?? null}
              rsvpCounts={e.type === "game" ? rsvpCounts.get(e.id) : undefined}
            />

            <div className="mt-3">
              <WhatsAppButton
                text={newEventMessage(e, slot ?? null)}
                label="Share"
                small
              />
            </div>

            <details className="mt-3" open={searchParams.edit === e.id}>
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
