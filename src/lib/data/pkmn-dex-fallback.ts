/**
 * Dynamic dex fallback — coverage for every Pokemon, every form, every Mega
 * via @pkmn/dex (the canonical Pokemon Showdown dataset). This layer fires
 * only when our hand-maintained static maps in pokemon.ts / mega-pokemon.ts
 * miss, so:
 *
 *   - Common meta Pokemon stay on the fast static path (zero extra work).
 *   - Anything we haven't catalogued yet — Champions-exclusive forms,
 *     Pokemon added in future game patches, obscure regional variants —
 *     resolves automatically against @pkmn/dex instead of vanishing from
 *     the UI (the Golurk-Mega class of bug).
 *
 * Updates to the underlying dataset come for free via `npm update @pkmn/dex`.
 *
 * Cached: each species/item is looked up at most once per session, so the
 * fallback adds essentially no runtime cost after warmup.
 */

import { Dex } from "@pkmn/dex";
import type { PokemonData, PokemonType, StatSpread } from "@/lib/types/pokemon";
import type { MegaPokemonEntry } from "@/lib/data/mega-pokemon";

// ── Caches ──────────────────────────────────────────────────────────────────
// `null` is a cached miss — distinct from "not yet looked up" (undefined).
const pokemonCache = new Map<string, PokemonData | null>();
const megaEntryCache = new Map<string, MegaPokemonEntry | null>();
const itemMegaCache = new Map<string, MegaPokemonEntry | null>();

// ── Pokemon lookup fallback ─────────────────────────────────────────────────

function normaliseKey(species: string): string {
  return species
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Resolve a species name against @pkmn/dex. Returns our PokemonData shape
 * or null if @pkmn/dex doesn't recognise it either (which means the user
 * really did type a fictional species).
 */
export function lookupPokemonFromDex(species: string): PokemonData | null {
  const key = normaliseKey(species);
  if (pokemonCache.has(key)) return pokemonCache.get(key) ?? null;

  // @pkmn/dex's lookup is forgiving — it accepts hyphenated forms, spaces,
  // capitalisation variants. Pass the original string to give it the best
  // chance, then fall back to the normalised key if needed.
  let entry = Dex.species.get(species);
  if (!entry.exists) entry = Dex.species.get(key);
  if (!entry.exists) {
    pokemonCache.set(key, null);
    return null;
  }

  const baseStats = entry.baseStats as StatSpread;
  if (!baseStats || (baseStats.hp === 0 && baseStats.atk === 0)) {
    // Defensive: @pkmn/dex returns existing entries for some near-matches but
    // with zeroed stats — treat as miss to avoid rendering meaningless 0-bars.
    pokemonCache.set(key, null);
    return null;
  }

  // Narrow to the [T] | [T, T] tuple our PokemonData type expects.
  const types = entry.types as PokemonType[];
  const typesTuple: PokemonData["types"] = types.length >= 2
    ? [types[0], types[1]]
    : [types[0]];

  const data: PokemonData = {
    name: entry.name,
    types: typesTuple,
    baseStats,
    abilities: Object.values(entry.abilities) as string[],
  };
  pokemonCache.set(key, data);
  return data;
}

// ── Mega lookups ────────────────────────────────────────────────────────────

function megaSlugFromDataKey(dataKey: string): string {
  // "kangaskhan-mega" → "mega-kangaskhan"; "charizard-mega-y" → "mega-charizard-y"
  if (dataKey.includes("-mega-")) {
    const [base, , variant] = dataKey.split("-");
    return `mega-${base}-${variant}`;
  }
  return `mega-${dataKey.replace(/-mega$/, "")}`;
}

/**
 * Given a species string that IS a mega form (e.g. "Golurk-Mega"), build a
 * MegaPokemonEntry from @pkmn/dex. Returns null if the species isn't a mega
 * or doesn't exist in @pkmn/dex either.
 */
export function getMegaEntryFromDex(species: string): MegaPokemonEntry | null {
  const key = normaliseKey(species);
  if (megaEntryCache.has(key)) return megaEntryCache.get(key) ?? null;

  const entry = Dex.species.get(species);
  if (!entry.exists || entry.forme !== "Mega" && !entry.forme?.startsWith("Mega")) {
    megaEntryCache.set(key, null);
    return null;
  }

  // Find the mega stone item that triggers this form by reverse-lookup.
  // @pkmn/dex item.megaStone returns { [baseSpeciesName]: megaSpeciesName }.
  let megaStone = "";
  for (const item of Dex.items.all()) {
    const ms = item.megaStone as Record<string, string> | undefined;
    if (!ms) continue;
    if (Object.values(ms).includes(entry.name)) {
      megaStone = item.name;
      break;
    }
  }

  const megaTypes = entry.types as PokemonType[];
  const megaTypesTuple: MegaPokemonEntry["types"] = megaTypes.length >= 2
    ? [megaTypes[0], megaTypes[1]]
    : [megaTypes[0]];

  const built: MegaPokemonEntry = {
    slug: megaSlugFromDataKey(key),
    dataKey: key,
    displayName: entry.name.startsWith("Mega ") ? entry.name : `Mega ${entry.baseSpecies ?? entry.name}`,
    baseName: entry.baseSpecies ?? entry.name.replace(/-Mega(-[XY])?$/, ""),
    types: megaTypesTuple,
    ability: Object.values(entry.abilities)[0] as string,
    megaStone: megaStone || `${entry.baseSpecies ?? entry.name}ite`,
    description: `${entry.name} — Mega Evolution data resolved dynamically from @pkmn/dex.`,
  };
  megaEntryCache.set(key, built);
  return built;
}

/**
 * Given a base species + held item, build a MegaPokemonEntry by asking
 * @pkmn/dex whether the item is a mega stone for that species.
 */
export function detectMegaFromItemDex(
  item: string | null,
  species: string,
): MegaPokemonEntry | null {
  if (!item) return null;
  const cacheKey = `${species.toLowerCase()}::${item.toLowerCase()}`;
  if (itemMegaCache.has(cacheKey)) return itemMegaCache.get(cacheKey) ?? null;

  const itemEntry = Dex.items.get(item);
  if (!itemEntry.exists || !itemEntry.megaStone) {
    itemMegaCache.set(cacheKey, null);
    return null;
  }

  // megaStone shape: { "Manectric": "Manectric-Mega" }
  const megaName = (itemEntry.megaStone as Record<string, string>)[species]
    ?? Object.values(itemEntry.megaStone as Record<string, string>)[0];
  if (!megaName) {
    itemMegaCache.set(cacheKey, null);
    return null;
  }

  const result = getMegaEntryFromDex(megaName);
  itemMegaCache.set(cacheKey, result);
  return result;
}
