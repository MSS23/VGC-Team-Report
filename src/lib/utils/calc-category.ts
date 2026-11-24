/**
 * Single source of truth for notable-calc categories.
 *
 * There used to be two copies of the calc-entry migration with two different
 * ideas of what a `category` is: the client hook (`useDamageCalcs`) validated
 * it against this list, while the server-side report normalizer
 * (`normalize-report.ts`) let any non-empty string through and declared it as
 * `string`, which the `ShareableState` casts then laundered into
 * `CalcCategory`. A category the report's three category filters don't
 * recognise matches none of them, so such a calc renders in no group at all.
 * Both paths now share this validator so they cannot drift apart again.
 */

export const CALC_CATEGORIES = ["offensive", "defensive", "speed"] as const;

export type CalcCategory = (typeof CALC_CATEGORIES)[number];

/** Category assigned to stored entries that don't declare a recognised one. */
export const DEFAULT_CALC_CATEGORY: CalcCategory = "offensive";

export function isCalcCategory(raw: unknown): raw is CalcCategory {
  return typeof raw === "string" && (CALC_CATEGORIES as readonly string[]).includes(raw);
}

/**
 * Coerce a stored `category` value to a valid `CalcCategory`.
 * Unrecognised values fall back to "offensive" so the user's calc still shows
 * up in the report instead of silently vanishing from every category group.
 */
export function toCalcCategory(raw: unknown): CalcCategory {
  return isCalcCategory(raw) ? raw : DEFAULT_CALC_CATEGORY;
}
