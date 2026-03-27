export const ARCHETYPES = [
  "Rain", "Sun", "Sand", "Snow", "Trick Room", "Semi-TR",
  "Hyper Offense", "Balance", "Bulky Offense", "Tailwind", "Goodstuffs",
  "Mega Offense", "Primal Weather",
] as const;

export const REGULATIONS = [
  "Reg A", "Reg B", "Reg C", "Reg D", "Reg E",
  "Reg F", "Reg G", "Reg H", "Reg I", "Reg M-A",
] as const;

export const EVENT_TYPES = [
  "Local", "Regional", "National", "International",
  "Online", "Worlds", "Other",
] as const;

export type Archetype = (typeof ARCHETYPES)[number];
export type Regulation = (typeof REGULATIONS)[number];
export type EventType = (typeof EVENT_TYPES)[number];

export interface ReportTags {
  archetype?: string[];
  regulation?: string;
  eventType?: string;
}
