/**
 * pkmn-dex-fallback regression suite.
 *
 * Bug: `[undefined]` leaked into the type chart as a `PokemonType`.
 *
 * `lookupPokemonFromDex` / `getMegaEntryFromDex` used to build their types
 * tuple as `types.length >= 2 ? [types[0], types[1]] : [types[0]]` over a
 * `string[]` that had been cast — not narrowed — to `PokemonType[]`. The
 * subset stores types pipe-joined and `splitList("")` decodes to `[]`, so an
 * entry with no types produced the literal array `[undefined]` while the type
 * system believed every element was a valid `PokemonType`. No currently
 * enabled strict flag catches it (`noUncheckedIndexedAccess` is off), so it
 * type-checked clean all the way into `getDefensiveProfile` (silently
 * all-neutral matchups) and into `TYPE_COLORS[type].bg` (render crash).
 *
 * The same cast let non-union strings through: `MissingNo.` is genuinely
 * typed `Bird|Normal` in the subset, and `Bird` is not a `PokemonType`.
 */
import { describe, it, expect, vi } from "vitest";

import type { PokemonType } from "@/lib/types/pokemon";
import { getDefensiveProfile } from "@/lib/data/type-chart";
import { TYPE_COLORS } from "@/lib/utils/type-colors";

// Injected species rows, consulted before the real subset. Declared through
// vi.hoisted so the vi.mock factory below can close over it.
const overrides = vi.hoisted(() => new Map<string, unknown>());

vi.mock("@/lib/data/dex-subset", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data/dex-subset")>();
  return {
    ...actual,
    getSpecies: (name: string) => {
      const id = name.toLowerCase().replace(/[^a-z0-9]/g, "");
      return (overrides.get(id) as ReturnType<typeof actual.getSpecies>)
        ?? actual.getSpecies(name);
    },
  };
});

const { lookupPokemonFromDex, getMegaEntryFromDex } = await import(
  "@/lib/data/pkmn-dex-fallback"
);

const VALID_TYPES = new Set<string>(Object.keys(TYPE_COLORS));

function fakeSpecies(name: string, types: string[], forme: string | null = null) {
  return {
    name,
    types,
    baseStats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
    abilities: ["Pressure"],
    forme,
    baseSpecies: forme ? name.replace(/-Mega$/, "") : name,
    isNonstandard: null,
  };
}

describe("pkmn-dex-fallback type narrowing", () => {
  it("never puts undefined in the types tuple when a species decodes to zero types", () => {
    overrides.set("typelessmon", fakeSpecies("Typelessmon", []));

    const data = lookupPokemonFromDex("Typelessmon");

    // Either a clean miss, or a real tuple — but never `[undefined]`.
    if (data) {
      expect(data.types.length).toBeGreaterThan(0);
      for (const type of data.types) {
        expect(type).toBeDefined();
        expect(VALID_TYPES.has(type)).toBe(true);
      }
    } else {
      expect(data).toBeNull();
    }
  });

  it("does not feed undefined to the type chart for a typeless species", () => {
    overrides.set("typelesstwo", fakeSpecies("Typelesstwo", []));

    const data = lookupPokemonFromDex("Typelesstwo");
    const types: PokemonType[] = data?.types ?? [];

    expect(types).not.toContain(undefined);
    // Guard against the silent-wrong-answer half of the bug: `[undefined]`
    // type-checks and produces an all-1x profile that reads as a legitimate
    // "no weaknesses, no resistances" result.
    expect(() => getDefensiveProfile(types)).not.toThrow();
  });

  it("drops types that are not in the PokemonType union instead of casting them", () => {
    overrides.set("birdmon", fakeSpecies("Birdmon", ["Bird", "Normal"]));

    const data = lookupPokemonFromDex("Birdmon");

    expect(data?.types).toEqual(["Normal"]);
  });

  it("returns a miss for a mega forme whose types are all unrecognised", () => {
    overrides.set("birdmonmega", fakeSpecies("Birdmon-Mega", ["Bird"], "Mega"));

    expect(getMegaEntryFromDex("Birdmon-Mega")).toBeNull();
  });

  it("keeps real dex entries intact and only emits renderable types", () => {
    // No override — this exercises the real dex-subset.json, including
    // MissingNo. ("Bird|Normal"), which is reachable from a user paste.
    for (const species of ["Landorus-Therian", "Flutter Mane", "MissingNo."]) {
      const data = lookupPokemonFromDex(species);
      if (!data) continue;
      for (const type of data.types) {
        expect(VALID_TYPES.has(type)).toBe(true);
        // TypeBadge does `TYPE_COLORS[type].bg` with no optional chaining.
        expect(TYPE_COLORS[type]?.bg).toBeTruthy();
      }
    }
  });

  it("still resolves a normal two-type species through the fallback", () => {
    const data = lookupPokemonFromDex("Clefable-Mega");
    expect(data).not.toBeNull();
    expect(data!.types.length).toBeGreaterThanOrEqual(1);
  });
});
