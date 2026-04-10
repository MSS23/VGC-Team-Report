import { MEGA_POKEMON_LIST, MEGA_BY_KEY } from "@/lib/data/mega-pokemon";
import type { MegaPokemonEntry } from "@/lib/data/mega-pokemon";

/**
 * Lookup mega stone name → MegaPokemonEntry.
 * Handles Charizard dual-mega by matching both baseName and megaStone.
 */
const MEGA_STONE_MAP = new Map<string, MegaPokemonEntry>(
  MEGA_POKEMON_LIST.map((m) => [m.megaStone.toLowerCase(), m]),
);

/**
 * Given a Pokemon's item string, return the matching MegaPokemonEntry if the item
 * is a mega stone. Returns null for non-mega-stone items.
 */
export function detectMegaFromItem(
  item: string | null,
  species: string,
): MegaPokemonEntry | null {
  if (!item) return null;
  const entry = MEGA_STONE_MAP.get(item.toLowerCase());
  if (!entry) return null;

  // For dual-mega Pokemon (Charizard X/Y), verify the stone matches the base form
  const baseSpecies = species
    .replace(/-Mega(-[XY])?$/i, "")
    .replace(/-mega(-[xy])?$/i, "");
  if (entry.baseName.toLowerCase() !== baseSpecies.toLowerCase()) return null;

  return entry;
}

/**
 * Check if a species string is already a mega form.
 */
export function isMegaForm(species: string): boolean {
  const key = species.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return MEGA_BY_KEY.has(key);
}

/**
 * Get the base form species name from a mega form key.
 * e.g. "kangaskhan-mega" → "Kangaskhan"
 */
export function getBaseFormName(megaDataKey: string): string | null {
  const entry = MEGA_BY_KEY.get(megaDataKey);
  return entry?.baseName ?? null;
}

/**
 * Get the mega form data key from a base species + mega stone.
 * e.g. ("Kangaskhan", "Kangaskhanite") → "kangaskhan-mega"
 */
export function getMegaDataKey(species: string, item: string | null): string | null {
  const entry = detectMegaFromItem(item, species);
  return entry?.dataKey ?? null;
}

/**
 * Given a species string that IS already a mega form (e.g. "Kangaskhan-Mega",
 * "Charizard-Mega-Y"), return the matching MegaPokemonEntry.
 *
 * Used by the per-card Mega/Base toggle to resolve the mega entry for
 * already-Mega imports, so the user can flip back to the base form to
 * compare stats/types/ability. Returns null for non-mega species.
 */
export function getMegaEntryFromSpecies(species: string): MegaPokemonEntry | null {
  const key = species.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return MEGA_BY_KEY.get(key) ?? null;
}
