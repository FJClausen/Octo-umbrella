"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays, format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth";
import { site } from "@/lib/site";

function clean(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

function num(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const TYPE_TITLES: Record<string, string> = {
  game: "Game",
  practice: "Practice",
  event: "Team Event",
};

/** Shared form parsing for create/update. Title falls back to the type name;
 *  an auto-generated title ("Game", "Practice"…) follows a type change
 *  instead of sticking to the old type. */
function eventPayload(formData: FormData, starts_at: string) {
  const type = String(formData.get("type") || "game");
  const jersey = clean(formData.get("jersey_color"));
  const rawTitle = String(formData.get("title") || "").trim();
  const autoTitles = new Set(
    Object.values(TYPE_TITLES).map((t) => t.toLowerCase())
  );
  const title =
    !rawTitle || autoTitles.has(rawTitle.toLowerCase())
      ? TYPE_TITLES[type] || "Event"
      : rawTitle;
  return {
    type,
    title,
    opponent: clean(formData.get("opponent")),
    location: clean(formData.get("location")),
    starts_at,
    ends_at: clean(formData.get("ends_at")),
    notes: clean(formData.get("notes")),
    jersey_color: jersey === "blue" || jersey === "red" ? jersey : null,
    score_us: num(formData.get("score_us")),
    score_them: num(formData.get("score_them")),
  };
}

function revalidate() {
  revalidatePath("/coaches/events");
  revalidatePath("/calendar");
  revalidatePath("/calendar/[id]", "page");
  revalidatePath("/home");
}

/** Shift a datetime-local string ("yyyy-MM-ddTHH:mm") by n days,
 *  keeping the wall-clock time. */
function shiftDT(value: string, days: number): string {
  return format(addDays(new Date(value), days), "yyyy-MM-dd'T'HH:mm");
}

export async function createEvent(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  const starts_at = clean(formData.get("starts_at"));
  if (!starts_at) return;

  const payload = eventPayload(formData, starts_at);

  const { data: inserted } = await supabase
    .from("events")
    .insert(payload)
    .select("id")
    .single();

  if (inserted && formData.get("add_snack_slot") === "on") {
    await supabase.from("snack_slots").insert({
      event_id: inserted.id,
      slot_date: starts_at.slice(0, 10),
      label: clean(formData.get("snack_label")),
    });
  }

  // Weekly repeats: create a copy every 7 days through the end date
  // (capped at 30 extra events as a safety net).
  const repeatUntil = clean(formData.get("repeat_until"));
  if (repeatUntil) {
    const repeats = [];
    for (let i = 1; i <= 30; i++) {
      const s = shiftDT(starts_at, 7 * i);
      if (s.slice(0, 10) > repeatUntil) break;
      repeats.push({
        ...payload,
        starts_at: s,
        ends_at: payload.ends_at ? shiftDT(payload.ends_at, 7 * i) : null,
        score_us: null,
        score_them: null,
      });
    }
    if (repeats.length) await supabase.from("events").insert(repeats);
  }

  revalidate();
  // Land on the events list with a "share to WhatsApp" prompt for the new event.
  if (inserted) redirect(`/coaches/events?share=${inserted.id}`);
}

/** Bulk insert for the AI schedule import. */
export async function createEventsBulk(
  events: {
    type: string;
    title: string;
    opponent: string | null;
    location: string | null;
    starts_at: string;
    ends_at: string | null;
    jersey_color: string | null;
  }[]
): Promise<{ created?: number; error?: string }> {
  await requireCoach();
  const supabase = createClient();

  const rows = events
    .filter((e) => e.starts_at)
    .slice(0, 60)
    .map((e) => ({
      type: ["game", "practice", "event"].includes(e.type) ? e.type : "game",
      title: e.title || TYPE_TITLES[e.type] || "Game",
      opponent: e.opponent || null,
      location: e.location || null,
      starts_at: e.starts_at,
      ends_at: e.ends_at || null,
      jersey_color:
        e.jersey_color === "blue" || e.jersey_color === "red"
          ? e.jersey_color
          : null,
    }));
  if (!rows.length) return { error: "Nothing to import." };

  const { error } = await supabase.from("events").insert(rows);
  if (error) return { error: error.message };
  revalidate();
  return { created: rows.length };
}

export async function updateEvent(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  const id = String(formData.get("id"));
  const starts_at = clean(formData.get("starts_at"));
  if (!id || !starts_at) return;

  const { data: before } = await supabase
    .from("events")
    .select("type, score_us, score_them")
    .eq("id", id)
    .maybeSingle();

  const payload = eventPayload(formData, starts_at);
  await supabase.from("events").update(payload).eq("id", id);

  // A game's score was just recorded for the first time — offer to share it.
  const newlyScored =
    before?.type === "game" &&
    before.score_us == null &&
    before.score_them == null &&
    payload.score_us != null &&
    payload.score_them != null;

  if (formData.get("add_snack_slot") === "on") {
    const { data: existing } = await supabase
      .from("snack_slots")
      .select("id")
      .eq("event_id", id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("snack_slots").insert({
        event_id: id,
        slot_date: starts_at.slice(0, 10),
        label: clean(formData.get("snack_label")),
      });
    }
  }

  revalidate();
  if (newlyScored) redirect(`/coaches/events?result=${id}`);
}

/** One-tap news post for a freshly recorded game result. */
export async function postResultNews(formData: FormData) {
  const coach = await requireCoach();
  const supabase = createClient();
  const id = String(formData.get("id"));

  const { data: e } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (e && e.score_us != null && e.score_them != null) {
    const us = e.score_us;
    const them = e.score_them;
    const emoji = us > them ? "🎉" : us < them ? "💪" : "🤝";
    const word = us > them ? "Win" : us < them ? "Tough loss" : "Draw";
    await supabase.from("news").insert({
      title: `${emoji} ${word}: ${site.teamName} ${us}–${them}${e.opponent ? ` vs ${e.opponent}` : ""}`,
      body:
        us > them
          ? "What a game — great job, girls! 🌈⚽"
          : us < them
            ? "Hard-fought game — proud of the effort, girls! 🌈⚽"
            : "An even battle — well played, girls! 🌈⚽",
      published: true,
      author_id: coach.id,
    });
    revalidatePath("/news");
    revalidatePath("/home");
    revalidatePath("/coaches/news");
  }
  redirect("/coaches/events");
}

/** One-tap news post after a schedule import. */
export async function postScheduleNews(
  count: number
): Promise<{ error?: string }> {
  const coach = await requireCoach();
  const supabase = createClient();
  const { error } = await supabase.from("news").insert({
    title: `📅 Schedule updated — ${count} new event${count === 1 ? "" : "s"}`,
    body: "New games and practices were just added to the calendar. Take a look and RSVP! ⚽",
    published: true,
    author_id: coach.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/news");
  revalidatePath("/home");
  revalidatePath("/coaches/news");
  return {};
}

export async function deleteEvent(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  await supabase.from("events").delete().eq("id", String(formData.get("id")));
  revalidate();
}

export async function removeEventSnackSlot(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  await supabase
    .from("snack_slots")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidate();
}
