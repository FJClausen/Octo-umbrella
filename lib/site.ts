/**
 * Central site configuration. Edit team identity here.
 * Colors live in tailwind.config.ts.
 */
export const site = {
  teamName: process.env.NEXT_PUBLIC_TEAM_NAME || "Mundo Rainbows",
  season: process.env.NEXT_PUBLIC_SEASON || "Fall 2026",
  tagline: "Girls Soccer",
  // Set NEXT_PUBLIC_LOGO_URL once the team crest is hosted somewhere (e.g.
  // Supabase Storage or a file committed to /public) to swap it in across
  // the nav bar and sign-in screen with no further code changes.
  logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || null,
  // Public URL of the deployed site — used in WhatsApp share messages.
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://mundorainbows.com",
};

export const PLAYER_POSITIONS = [
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Forward",
] as const;

export const EVENT_TYPES = ["game", "practice", "event"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  game: "Game",
  practice: "Practice",
  event: "Team Event",
};

export const RSVP_STATUSES = ["going", "maybe", "not_going"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export const RSVP_LABELS: Record<RsvpStatus, string> = {
  going: "Going",
  maybe: "Maybe",
  not_going: "Can't make it",
};

/** One assignable spot in a lineup formation. */
export type LineupSlot = {
  slot: string;
  position: string;
  playerId: string | null;
  note: string | null;
};

export type FormationKey = "2-3-1" | "3-2-1" | "2-2-2" | "3-1-2";

/**
 * Preset 7-a-side formations. Selecting one populates the lineup editor
 * with blank slots (GK + 6 outfield players) for a coach to assign.
 */
export const FORMATIONS: Record<
  FormationKey,
  { label: string; slots: { slot: string; position: string }[] }
> = {
  "2-3-1": {
    label: "2-3-1 (Standard)",
    slots: [
      { slot: "Goalkeeper", position: "Goalkeeper" },
      { slot: "Defender 1", position: "Defender" },
      { slot: "Defender 2", position: "Defender" },
      { slot: "Midfielder 1", position: "Midfielder" },
      { slot: "Midfielder 2", position: "Midfielder" },
      { slot: "Midfielder 3", position: "Midfielder" },
      { slot: "Forward", position: "Forward" },
    ],
  },
  "3-2-1": {
    label: "3-2-1",
    slots: [
      { slot: "Goalkeeper", position: "Goalkeeper" },
      { slot: "Defender 1", position: "Defender" },
      { slot: "Defender 2", position: "Defender" },
      { slot: "Defender 3", position: "Defender" },
      { slot: "Midfielder 1", position: "Midfielder" },
      { slot: "Midfielder 2", position: "Midfielder" },
      { slot: "Forward", position: "Forward" },
    ],
  },
  "2-2-2": {
    label: "2-2-2",
    slots: [
      { slot: "Goalkeeper", position: "Goalkeeper" },
      { slot: "Defender 1", position: "Defender" },
      { slot: "Defender 2", position: "Defender" },
      { slot: "Midfielder 1", position: "Midfielder" },
      { slot: "Midfielder 2", position: "Midfielder" },
      { slot: "Forward 1", position: "Forward" },
      { slot: "Forward 2", position: "Forward" },
    ],
  },
  "3-1-2": {
    label: "3-1-2",
    slots: [
      { slot: "Goalkeeper", position: "Goalkeeper" },
      { slot: "Defender 1", position: "Defender" },
      { slot: "Defender 2", position: "Defender" },
      { slot: "Defender 3", position: "Defender" },
      { slot: "Midfielder", position: "Midfielder" },
      { slot: "Forward 1", position: "Forward" },
      { slot: "Forward 2", position: "Forward" },
    ],
  },
};

export const DEFAULT_FORMATION_KEY: FormationKey = "2-3-1";

export function blankSlotsFor(key: FormationKey): LineupSlot[] {
  return FORMATIONS[key].slots.map((s) => ({
    slot: s.slot,
    position: s.position,
    playerId: null,
    note: null,
  }));
}
