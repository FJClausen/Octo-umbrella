import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Alert,
  Card,
  EmptyState,
  SectionHeading,
  SubmitButton,
  eventCardTint,
} from "@/components/ui";
import { EventCardBody } from "@/components/EventCard";
import { EventFields } from "@/components/EventFields";
import { countRsvpsByEvent } from "@/lib/rsvp";
import { newEventMessage, resultMessage } from "@/lib/whatsapp";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ImportSchedule } from "@/components/ImportSchedule";
import type { EventRow, SnackSlot } from "@/lib/types";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  removeEventSnackSlot,
  postResultNews,
  backfillGameSnackSlots,
} from "./actions";

export const metadata = { title: "Manage Events" };

export default async function ManageEventsPage({
  searchParams,
}: {
  searchParams: { share?: string; edit?: string; add?: string; result?: string };
}) {
  const supabase = createClient();
  const [{ data: events }, { data: snackSlots }, { data: rsvps }, { data: plans }] =
    await Promise.all([
      supabase
        .from("events")
        .select("*")
        .order("starts_at", { ascending: true }),
      supabase.from("snack_slots").select("*"),
      supabase.from("rsvps").select("event_id, status"),
      supabase.from("practice_plans").select("id, event_id"),
    ]);

  const planByEvent = new Map(
    (plans ?? [])
      .filter((p) => p.event_id)
      .map((p) => [p.event_id as string, p.id])
  );

  const snackSlotByEvent = new Map<string, SnackSlot>(
    (snackSlots ?? [])
      .filter((s) => s.event_id)
      .map((s) => [s.event_id as string, s])
  );
  const rsvpCounts = countRsvpsByEvent(rsvps);

  // Chronological: the next event first, past events after it (most recent
  // first) so the season reads in order without old dates on top.
  const dayStart = `${new Date().toISOString().slice(0, 10)}T00:00:00`;
  const eventList = events ?? [];
  const upcoming = eventList.filter((e) => e.starts_at >= dayStart);
  const past = eventList.filter((e) => e.starts_at < dayStart).reverse();

  // Games without snack duty, so they can be backfilled in one tap.
  const gamesMissingSnacks = eventList.filter(
    (e) => e.type === "game" && !snackSlotByEvent.has(e.id)
  ).length;

  const shareEvent = searchParams.share
    ? (events ?? []).find((e) => e.id === searchParams.share)
    : undefined;
  const resultEvent = searchParams.result
    ? (events ?? []).find(
        (e) =>
          e.id === searchParams.result &&
          e.score_us != null &&
          e.score_them != null
      )
    : undefined;

  return (
    <div className="space-y-6">
      {resultEvent ? (
        <div className="card border-brand-green/40 bg-brand-green-light/40 p-4">
          <p className="font-semibold text-brand-ink">
            Score saved: {resultEvent.score_us}–{resultEvent.score_them}
            {resultEvent.opponent ? ` vs ${resultEvent.opponent}` : ""}
          </p>
          <p className="mb-3 text-sm text-slate-500">
            Share the result with the team?
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <form action={postResultNews}>
              <input type="hidden" name="id" value={resultEvent.id} />
              <SubmitButton>Post to team news</SubmitButton>
            </form>
            <WhatsAppButton
              text={resultMessage(resultEvent)}
              label="WhatsApp"
              small
            />
            <Link href="/coaches/events" className="text-sm text-slate-500">
              Skip
            </Link>
          </div>
        </div>
      ) : null}
      {shareEvent ? (
        <div className="card border-[#25D366]/40 bg-[#25D366]/5 p-4">
          <p className="font-semibold text-brand-ink">
            Event added: {shareEvent.title}
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

      <details className="card p-4" open={searchParams.add === "1"}>
        <summary className="cursor-pointer font-semibold text-brand-ink">
          ＋ Add event
        </summary>
        <form action={createEvent} autoComplete="off" className="mt-4 space-y-4">
          <EventFields />
          <div className="rounded-lg border border-slate-200 p-3">
            <label className="label">
              Repeat weekly until (optional — e.g. for practices)
            </label>
            <input type="date" name="repeat_until" className="input" />
            <p className="mt-1 text-xs text-slate-500">
              Creates a copy of this event every week through the chosen
              date.
            </p>
          </div>
          <SubmitButton>Add event</SubmitButton>
        </form>
      </details>

      <ImportSchedule />

      {gamesMissingSnacks > 0 ? (
        <Alert variant="warning" title="Games without a snack slot">
          <p className="mb-2">
            {gamesMissingSnacks} game
            {gamesMissingSnacks === 1 ? " has" : "s have"} no snack duty yet,
            so parents can’t sign up for {gamesMissingSnacks === 1 ? "it" : "them"}.
          </p>
          <form action={backfillGameSnackSlots}>
            <SubmitButton>
              Add snack slots to {gamesMissingSnacks} game
              {gamesMissingSnacks === 1 ? "" : "s"}
            </SubmitButton>
          </form>
        </Alert>
      ) : null}

      {renderSection("Upcoming", upcoming)}
      {past.length > 0 ? renderSection("Past", past) : null}
    </div>
  );

  function renderSection(label: string, list: EventRow[]) {
    if (list.length === 0) {
      return (
        <div className="space-y-2">
          <SectionHeading>{label}</SectionHeading>
          <EmptyState
            title="No upcoming events"
            hint="Add one above, or import your season schedule."
          />
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <SectionHeading>{label}</SectionHeading>
        {list.map((e) => {
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

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <WhatsAppButton
                text={newEventMessage(e, slot ?? null)}
                label="Share"
                small
              />
              {e.type === "practice" ? (
                planByEvent.has(e.id) ? (
                  <Link
                    href={`/coaches/practice?open=${planByEvent.get(e.id)}#plan-${planByEvent.get(e.id)}`}
                    className="btn-outline px-3 py-1 text-sm"
                  >
                    Practice plan
                  </Link>
                ) : (
                  <Link
                    href={`/coaches/practice?event=${e.id}`}
                    className="btn-outline px-3 py-1 text-sm"
                  >
                    ＋ Plan this practice
                  </Link>
                )
              ) : null}
              {e.type === "game" ? (
                <Link
                  href="/coaches/gameday"
                  className="btn-outline px-3 py-1 text-sm"
                >
                  Game Day / lineup
                </Link>
              ) : null}
            </div>

            <details className="mt-3" open={searchParams.edit === e.id}>
              <summary className="cursor-pointer text-sm text-brand-blue">
                Edit
              </summary>
              {/* autoComplete off + a content-derived key: the form always
                  remounts with fresh DB values and the browser never
                  restores another form's field values into this one. */}
              <form
                action={updateEvent}
                autoComplete="off"
                className="mt-3 space-y-4"
              >
                <input type="hidden" name="id" value={e.id} />
                <EventFields
                  key={`${e.id}:${e.type}:${e.starts_at}:${e.title}:${e.opponent ?? ""}:${e.location ?? ""}`}
                  event={e}
                  hasSnackSlot={!!slot}
                />
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
    );
  }
}
