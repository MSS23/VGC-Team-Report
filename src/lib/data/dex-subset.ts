/**
 * dex-subset.ts — client-safe accessor over the pre-extracted @pkmn/dex slice
 * in `dex-subset.json`.
 *
 * This replaces direct `@pkmn/dex` usage on any code path that's reachable
 * from a "use client" component. The full @pkmn/dex package ships ~1.8MB raw
 * / ~350KB gzipped of move/learnset/tier metadata the client never reads;
 * the JSON subset here is the same species + mega-stone fields, ~324KB raw
 * / ~47KB gzipped.
 *
 * Regenerate `dex-subset.json` after bumping @pkmn/dex:
 *
 *     node scripts/build-dex-subset.mjs
 *
 * Server-only code (API routes, server components, instrumentation, build-time
 * scripts) can still `import { Dex } from "@pkmn/dex"` directly — only the
 * client-reachable graph needs to go through this file.
 */

import type { PokemonType } from "@/lib/types/pokemon";
import rawSubset from "./dex-subset.json";

// ── Types ───────────────────────────────────────────────────────────────────

export interface DexSubsetSpecies {
  name: string;
  /** Types as strings — narrowed to PokemonType at the consumer boundary. */
  types: string[];
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  /** Full ability list. Index 0 is the primary ability (matches pkmn-dex). */
  abilities: string[];
  /** "Mega", "Alola", etc. Null for base forms. */
  forme: string | null;
  /** For alt forms, the base species name. Null for base forms. */
  baseSpecies: string | null;
  /** "Past", "CAP", "Future", etc. Null for standard species. */
  isNonstandard: string | null;
}

export interface DexSubsetMegaStone {
  name: string;
  /** { [baseSpeciesName]: megaSpeciesName } — same shape as @pkmn/dex. */
  megaStone: Record<string, string>;
}

interface DexSubset {
  schemaVersion: number;
  generatedAt: string;
  species: DexSubsetSpecies[];
  megaStones: DexSubsetMegaStone[];
}

// JSON import is structurally compatible. Cast once here so downstream
// consumers get a fully-typed surface without a JSON assertion at every use.
const subset = rawSubset as unknown as DexSubset;

// ── Indexes (built lazily on first access) ─────────────────────────────────

let SPECIES_BY_ID: Map<string, DexSubsetSpecies> | null = null;
let MEGA_STONES_BY_ID: Map<string, DexSubsetMegaStone> | null = null;

/**
 * Normalise a species/item string to the lookup key used by @pkmn/dex: lower
 * case, strip non-alphanumerics. Mirrors `toID` from @pkmn/dex.
 */
function toId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function ensureSpeciesIndex(): Map<string, DexSubsetSpecies> {
  if (SPECIES_BY_ID) return SPECIES_BY_ID;
  const map = new Map<string, DexSubsetSpecies>();
  for (const s of subset.species) {
    map.set(toId(s.name), s);
  }
  SPECIES_BY_ID = map;
  return map;
}

function ensureMegaStoneIndex(): Map<string, DexSubsetMegaStone> {
  if (MEGA_STONES_BY_ID) return MEGA_STONES_BY_ID;
  const map = new Map<string, DexSubsetMegaStone>();
  for (const m of subset.megaStones) {
    map.set(toId(m.name), m);
  }
  MEGA_STONES_BY_ID = map;
  return map;
}

// ── Public API ──────────────────────────────────────────────────────────────

/** All species in the subset (same set @pkmn/dex returns minus zero-stat / non-existent entries). */
export function allSpecies(): DexSubsetSpecies[] {
  return subset.species;
}

/** All mega stones in the subset (every item whose `.megaStone` is truthy). */
export function allMegaStones(): DexSubsetMegaStone[] {
  return subset.megaStones;
}

/**
 * Look up a species by any name @pkmn/dex would accept: "Mega Kangaskhan",
 * "kangaskhan-mega", "Kangaskhan-Mega", etc. Returns null on miss.
 */
export function getSpecies(name: string): DexSubsetSpecies | null {
  return ensureSpeciesIndex().get(toId(name)) ?? null;
}

/** Look up a mega stone by name. Returns null on miss. */
export function getMegaStone(name: string): DexSubsetMegaStone | null {
  return ensureMegaStoneIndex().get(toId(name)) ?? null;
}
