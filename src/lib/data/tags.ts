export const ARCHETYPES = [
  "Rain", "Sun", "Sand", "Snow", "Trick Room", "Semi-TR",
  "Hyper Offense", "Balance", "Bulky Offense", "Tailwind", "Goodstuffs",
  "Mega Offense", "Primal Weather",
] as const;

export const REGULATIONS = [
  "Reg A", "Reg B", "Reg C", "Reg D", "Reg E",
  "Reg F", "Reg G", "Reg H", "Reg I", "Reg M-A", "Reg M-B", "Reg M-C",
  "Custom",
] as const;

/**
 * Pokémon Champions formats. Reg M-A, M-B and M-C share the same engine —
 * Mega Evolution, Stat Points (32/66) instead of EVs, IVs locked to 31, and
 * no Tera. The species pools nest: M-A ⊂ M-B ⊂ M-C. Every M-A Pokémon is
 * M-B legal and every M-B Pokémon is M-C legal, each newer reg adding extra
 * species and Megas on top; picks introduced in a later reg are NOT legal in
 * an earlier one.
 *
 * Reg M-C (live 8 Sep 2026) has no roster data in the repo yet — the official
 * species/Mega list is not published, so its dex checks fall back to the
 * widest known pool and unknown species are left unvalidated rather than
 * flagged illegal (see champions-legality.ts).
 *
 * Use this everywhere instead of `regulation === "Reg M-A"` so every Champions
 * reg gets the same Mega/SP/IV treatment in the report.
 */
export function isChampionsFormat(regulation?: string | null): boolean {
  return (
    regulation === "Reg M-A" ||
    regulation === "Reg M-B" ||
    regulation === "Reg M-C"
  );
}

export const EVENT_TYPES = [
  "Local", "Regional", "National", "International",
  "Online", "Worlds", "Other",
] as const;

export type Archetype = (typeof ARCHETYPES)[number];
export type Regulation = (typeof REGULATIONS)[number];
type EventType = (typeof EVENT_TYPES)[number];

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
