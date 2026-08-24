export const ARCHETYPES = [
  "Rain", "Sun", "Sand", "Snow", "Trick Room", "Semi-TR",
  "Hyper Offense", "Balance", "Bulky Offense", "Tailwind", "Goodstuffs",
  "Mega Offense", "Primal Weather",
] as const;

export const REGULATIONS = [
  "Reg A", "Reg B", "Reg C", "Reg D", "Reg E",
  "Reg F", "Reg G", "Reg H", "Reg I", "Reg M-A", "Reg M-B",
  "Custom",
] as const;

/**
 * Pokémon Champions formats. Reg M-A and Reg M-B share the same engine —
 * Mega Evolution, Stat Points (32/66) instead of EVs, IVs locked to 31, and
 * no Tera. Reg M-B is a superset of M-A (every M-A Pokémon is M-B legal, plus
 * extra species and Megas; M-B-only picks are NOT legal in M-A).
 *
 * Use this everywhere instead of `regulation === "Reg M-A"` so both Champions
 * regs get the same Mega/SP/IV treatment in the report.
 */
export function isChampionsFormat(regulation?: string | null): boolean {
  return regulation === "Reg M-A" || regulation === "Reg M-B";
}

export const EVENT_TYPES = [
  "Local", "Regional", "National", "International",
  "Online", "Worlds", "Other",
] as const;

export type Archetype = (typeof ARCHETYPES)[number];
export type Regulation = (typeof REGULATIONS)[number];

export interface ReportTags {
  archetype?: string[];
  regulation?: string;
  eventType?: string;
  /**
   * True when the regulation tag was set by the auto-detector, false or
   * omitted when the user picked it manually. Surfaced in the UI so
   * viewers can distinguish a user-claimed format from a machine guess.
   */
  regulationAutoDetected?: boolean;
}
