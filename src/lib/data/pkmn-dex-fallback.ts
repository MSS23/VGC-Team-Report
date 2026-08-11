/**
 * Dynamic dex fallback — coverage for every Pokemon, every form, every Mega.
 * This layer fires only when our hand-maintained static maps in pokemon.ts /
 * mega-pokemon.ts miss, so:
 *
 *   - Common meta Pokemon stay on the fast static path (zero extra work).
 *   - Anything we haven't catalogued yet — Champions-exclusive forms,
 *     Pokemon added in future game patches, obscure regional variants —
 *     resolves automatically without vanishing from the UI (the Golurk-Mega
 *     class of bug).
 *
 * Data source is the pre-extracted `dex-subset.json` (built from @pkmn/dex
 * by `scripts/build-dex-subset.mjs`). The full @pkmn/dex package is ~1.8MB
 * raw / ~350KB gzipped and includes moves/learnsets/tiers the client never
 * reads; the subset is ~127KB raw / ~32KB gzipped and holds only species
 * stats, types, abilities, and mega-stone metadata. Regenerate after every
 * `npm update @pkmn/dex` and commit the new JSON.
 *
 * The subset is stored as positional arrays and decoded in `dex-subset.ts`
 * (VGC-257) — the same 1,515 species, 197KB less client JS. Never shrink it
 * further by filtering `isNonstandard`: the Champions-original Megas are the
 * `Future`-flagged rows.
 *
 * Cached: each species/item is looked up at most once per session, so the
 * fallback adds essentially no runtime cost after warmup.
 */

import type { PokemonData, PokemonType, StatSpread } from "@/lib/types/pokemon";
import type { MegaPokemonEntry } from "@/lib/data/mega-pokemon";
import {
  allMegaStones,
  getMegaStone,
  getSpecies,
  type DexSubsetSpecies,
} from "@/lib/data/dex-subset";

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
 * Resolve a species name against the dex subset. Returns our PokemonData
 * shape or null if the subset doesn't recognise it either (which means the
 * user really did type a fictional species, OR a new form was added to
 * @pkmn/dex since we last regenerated the subset).
 */
export function lookupPokemonFromDex(species: string): PokemonData | null {
  const key = normaliseKey(species);
  if (pokemonCache.has(key)) return pokemonCache.get(key) ?? null;

  // The subset's getSpecies uses the same toID normalisation @pkmn/dex does
  // (lowercase + strip non-alphanumerics), so it accepts spaces, hyphens,
  // capitalisation variants. Try the original first, then the hyphenated
  // normalised key as a fallback.
  let entry = getSpecies(species);
  if (!entry) entry = getSpecies(key);
  if (!entry) {
    pokemonCache.set(key, null);
    return null;
  }

  const baseStats = entry.baseStats as StatSpread;
  if (!baseStats || (baseStats.hp === 0 && baseStats.atk === 0)) {
    // Defensive: same near-match guard the @pkmn/dex version used. The subset
    // generator already filters these out, so this is belt-and-braces.
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
    abilities: entry.abilities,
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

function isMegaForme(entry: DexSubsetSpecies): boolean {
  return entry.forme === "Mega" || (entry.forme?.startsWith("Mega") ?? false);
}

/**
 * Given a species string that IS a mega form (e.g. "Golurk-Mega"), build a
 * MegaPokemonEntry from the dex subset. Returns null if the species isn't a
 * mega or doesn't exist in the subset either.
 */
export function getMegaEntryFromDex(species: string): MegaPokemonEntry | null {
  const key = normaliseKey(species);
  if (megaEntryCache.has(key)) return megaEntryCache.get(key) ?? null;

  const entry = getSpecies(species);
  if (!entry || !isMegaForme(entry)) {
    megaEntryCache.set(key, null);
    return null;
  }

  // Find the mega stone item that triggers this form by reverse-lookup.
  // Item.megaStone is { [baseSpeciesName]: megaSpeciesName } in @pkmn/dex —
  // we preserved the same shape in the subset.
  let megaStone = "";
  for (const item of allMegaStones()) {
    if (Object.values(item.megaStone).includes(entry.name)) {
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
    ability: entry.abilities[0] ?? "",
    megaStone: megaStone || `${entry.baseSpecies ?? entry.name}ite`,
    description: `${entry.name} — Mega Evolution data resolved dynamically from the pre-built dex subset.`,
  };
  megaEntryCache.set(key, built);
  return built;
}

/**
 * Given a base species + held item, build a MegaPokemonEntry by asking the
 * dex subset whether the item is a mega stone for that species.
 */
export function detectMegaFromItemDex(
  item: string | null,
  species: string,
): MegaPokemonEntry | null {
  if (!item) return null;
  const cacheKey = `${species.toLowerCase()}::${item.toLowerCase()}`;
  if (itemMegaCache.has(cacheKey)) return itemMegaCache.get(cacheKey) ?? null;

  const itemEntry = getMegaStone(item);
  if (!itemEntry) {
    itemMegaCache.set(cacheKey, null);
    return null;
  }

  // megaStone shape: { "Manectric": "Manectric-Mega" }
  const megaName = itemEntry.megaStone[species]
    ?? Object.values(itemEntry.megaStone)[0];
  if (!megaName) {
    itemMegaCache.set(cacheKey, null);
    return null;
  }

  const result = getMegaEntryFromDex(megaName);
  itemMegaCache.set(cacheKey, result);
  return result;
}
