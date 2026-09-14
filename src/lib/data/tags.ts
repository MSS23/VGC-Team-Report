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
 * Pokémon Champions regulations, oldest → newest. Each one is additive over
 * the previous: every M-A pick is M-B legal and every M-B pick is M-C legal,
 * but the reverse is not true.
 */
export const CHAMPIONS_REGULATIONS = ["Reg M-A", "Reg M-B", "Reg M-C"] as const;

export type ChampionsRegulation = (typeof CHAMPIONS_REGULATIONS)[number];

/**
 * Pokémon Champions formats. Reg M-A, Reg M-B and Reg M-C share the same
 * engine — Mega Evolution, Stat Points (32/66) instead of EVs, IVs locked to
 * 31, and no Tera. Each regulation is additive over the one before it: M-B is
 * a superset of M-A and M-C (live 8 Sept 2026) is a superset of M-B — extra
 * species and Megas only, no rules changes. Newer-reg-only picks are NOT legal
 * in the older regs.
 *
 * Use this everywhere instead of `regulation === "Reg M-A"` so every Champions
 * reg gets the same Mega/SP/IV treatment in the report. Missing a reg here
 * silently degrades its reports to classic EV mode (VGC-41).
 */
export function isChampionsFormat(regulation?: string | null): boolean {
  return (CHAMPIONS_REGULATIONS as readonly string[]).includes(regulation ?? "");
}

/**
 * Narrow an arbitrary regulation tag to the Champions regulation it should be
 * treated as. Non-Champions (or missing) tags fall back to "Reg M-A", matching
 * the historical default of the Champions-only code paths.
 */
export function toChampionsRegulation(
  regulation?: string | null,
): ChampionsRegulation {
  return isChampionsFormat(regulation)
    ? (regulation as ChampionsRegulation)
    : "Reg M-A";
}

/**
 * True when a Champions regulation should use the Reg M-B species/Mega pool.
 *
 * ponytail: Reg M-C's own dex has not been verified against Serebii yet, so
 * M-C inherits M-B's pool wholesale. That is deliberately over-inclusive — an
 * under-inclusive dex would flag genuinely legal M-C Pokémon as illegal, which
 * is a visible bug. Split this out into a CHAMPIONS_MC_DEX once the M-C
 * species/Mega additions (reportedly Mega Salamence, Golisopod, Baxcalibur and
 * the first Z-Megas — UNVERIFIED) can be confirmed.
 */
export function usesRegMbPool(regulation?: string | null): boolean {
  return regulation === "Reg M-B" || regulation === "Reg M-C";
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
