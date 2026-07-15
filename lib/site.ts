/**
 * Central site configuration. Edit team identity here.
 * Colors live in tailwind.config.ts.
 */
export const site = {
  teamName: process.env.NEXT_PUBLIC_TEAM_NAME || "Mundo Rainbows",
  season: process.env.NEXT_PUBLIC_SEASON || "Fall 2026",
  tagline: "Girls Soccer",
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
