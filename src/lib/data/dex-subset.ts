/**
 * dex-subset.ts — client-safe accessor over the pre-extracted @pkmn/dex slice
 * in `dex-subset.json`.
 *
 * This replaces direct `@pkmn/dex` usage on any code path that's reachable
 * from a "use client" component. The full @pkmn/dex package ships ~1.8MB raw
 * / ~350KB gzipped of move/learnset/tier metadata the client never reads;
 * the JSON subset here is the same species + mega-stone fields, ~127KB raw
 * / ~32KB gzipped.
 *
 * ── Wire format (VGC-257) ──────────────────────────────────────────────────
 * `dex-subset.json` stores POSITIONAL ARRAYS, not objects: at 1,515 species an
 * array-of-objects repeated all seven field names 1,515 times and cost ~324KB
 * raw of client JS, on the homepage's critical path, to service a fallback that
 * a typical team never reaches. This file decodes the packed rows back into the
 * `DexSubsetSpecies` / `DexSubsetMegaStone` shape, so the public API below is
 * byte-for-byte the same as before the re-encode. See
 * `scripts/build-dex-subset.mjs` for the emitted layout.
 *
 * Decoding is lazy: nothing is materialised until the first `getSpecies()` /
 * `allSpecies()` / `getMegaStone()` call, which on most sessions is never.
 *
 * ⚠️  The size win comes from the ENCODING only. Never shrink the artifact by
 * filtering `isNonstandard` — 43 of the 92 Mega formes carry `Future` (those
 * are the Champions-original Megas) and dropping them would delete half the
 * Mega roster from detection. `__tests__/dex-subset.test.ts` pins the exact
 * species set against a hash so any such prune fails the suite.
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
  /** The base species name. Equals `name` for base forms (matches pkmn-dex). */
  baseSpecies: string | null;
  /** "Past", "CAP", "Future", etc. Null for standard species. */
  isNonstandard: string | null;
}

export interface DexSubsetMegaStone {
  name: string;
  /** { [baseSpeciesName]: megaSpeciesName } — same shape as @pkmn/dex. */
  megaStone: Record<string, string>;
}

// ── Packed wire format ──────────────────────────────────────────────────────

/** [name, types, baseStats, abilities, forme, baseSpecies, nonstandardIndex] */
type PackedSpecies = [
  name: string,
  /** Pipe-joined, e.g. "Grass|Poison". */
  types: string,
  baseStats: [hp: number, atk: number, def: number, spa: number, spd: number, spe: number],
  /** Pipe-joined, "" when the species has no abilities. */
  abilities: string,
  /** `0` ⇒ null (base forme). */
  forme: string | 0,
  /** `0` ⇒ same as `name`. */
  baseSpecies: string | 0 | null,
  /** Index into `nonstandardValues`; 0 ⇒ null (standard). */
  nonstandard: number,
];

/** [name, [[baseSpeciesName, megaSpeciesName], …]] */
type PackedMegaStone = [name: string, megaStone: [string, string][]];

interface PackedDexSubset {
  schemaVersion: number;
  generatedAt: string;
  nonstandardValues: (string | null)[];
  species: PackedSpecies[];
  megaStones: PackedMegaStone[];
}

/** Bumped in lockstep with `scripts/build-dex-subset.mjs`. */
const SCHEMA_VERSION = 2;

// JSON import is structurally compatible with the packed shape. Cast once here
// so the decoder below is the only place that touches raw tuples.
const subset = rawSubset as unknown as PackedDexSubset;

function splitList(joined: string): string[] {
  // "" must decode to [] — "".split("|") yields [""], which would surface a
  // phantom empty ability/type.
  return joined === "" ? [] : joined.split("|");
}

function decodeSpecies(row: PackedSpecies): DexSubsetSpecies {
  const [name, types, stats, abilities, forme, baseSpecies, nonstandard] = row;
  return {
    name,
    types: splitList(types),
    baseStats: {
      hp: stats[0],
      atk: stats[1],
      def: stats[2],
      spa: stats[3],
      spd: stats[4],
      spe: stats[5],
    },
    abilities: splitList(abilities),
    forme: forme === 0 ? null : forme,
    baseSpecies: baseSpecies === 0 ? name : baseSpecies,
    isNonstandard: subset.nonstandardValues[nonstandard] ?? null,
  };
}

function decodeMegaStone(row: PackedMegaStone): DexSubsetMegaStone {
  return { name: row[0], megaStone: Object.fromEntries(row[1]) };
}

// ── Decoded data + indexes (built lazily on first access) ──────────────────

let SPECIES: DexSubsetSpecies[] | null = null;
let MEGA_STONES: DexSubsetMegaStone[] | null = null;
let SPECIES_BY_ID: Map<string, DexSubsetSpecies> | null = null;
let MEGA_STONES_BY_ID: Map<string, DexSubsetMegaStone> | null = null;

function ensureSchema(): void {
  if (subset.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(
      `dex-subset.json is schemaVersion ${subset.schemaVersion}, expected ${SCHEMA_VERSION}. ` +
        `Regenerate it with \`node scripts/build-dex-subset.mjs\`.`,
    );
  }
}

function ensureSpecies(): DexSubsetSpecies[] {
  if (SPECIES) return SPECIES;
  ensureSchema();
  SPECIES = subset.species.map(decodeSpecies);
  return SPECIES;
}

function ensureMegaStones(): DexSubsetMegaStone[] {
  if (MEGA_STONES) return MEGA_STONES;
  ensureSchema();
  MEGA_STONES = subset.megaStones.map(decodeMegaStone);
  return MEGA_STONES;
}

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
  for (const s of ensureSpecies()) {
    map.set(toId(s.name), s);
  }
  SPECIES_BY_ID = map;
  return map;
}

function ensureMegaStoneIndex(): Map<string, DexSubsetMegaStone> {
  if (MEGA_STONES_BY_ID) return MEGA_STONES_BY_ID;
  const map = new Map<string, DexSubsetMegaStone>();
  for (const m of ensureMegaStones()) {
    map.set(toId(m.name), m);
  }
  MEGA_STONES_BY_ID = map;
  return map;
}

// ── Public API ──────────────────────────────────────────────────────────────

/** All species in the subset (same set @pkmn/dex returns minus zero-stat / non-existent entries). */
export function allSpecies(): DexSubsetSpecies[] {
  return ensureSpecies();
}

/** All mega stones in the subset (every item whose `.megaStone` is truthy). */
export function allMegaStones(): DexSubsetMegaStone[] {
  return ensureMegaStones();
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

/** Narrow a string[] of types to the typed PokemonType union. */
export function asPokemonTypes(types: string[]): PokemonType[] {
  return types as PokemonType[];
}
