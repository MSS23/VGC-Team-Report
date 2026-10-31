/**
 * Regression tests for the dex-fallback type boundary.
 *
 * THE BUG (render crash, reported as "paste `MissingNo. @ Leftovers`"):
 * `dex-subset.json` is generated from @pkmn/dex and ships MissingNo. with type
 * `"Bird"`, which is not one of the 18 `PokemonType` members. MissingNo. has
 * non-zero base stats (hp 33 / atk 136) so it sailed through the zero-stat
 * guard, and `entry.types as PokemonType[]` was an unchecked cast, so "Bird"
 * reached `TypeBadge`, where `TYPE_COLORS["Bird"]` is `undefined` and reading
 * `.bg` off it threw — a hard crash of the report render.
 *
 * Secondary: `[types[0]]` on a possibly-empty array produced `[undefined]`
 * while the declared type is the non-empty tuple `[PokemonType]` — the same
 * class of crash one step later.
 */

import { describe, it, expect, vi } from "vitest";
import type { DexSubsetSpecies } from "@/lib/data/dex-subset";
import { TYPE_COLORS } from "@/lib/utils/type-colors";
import { TYPE_CHART } from "@/lib/data/type-chart";

const stats = { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50 };

/** Synthetic rows for cases the real generated subset doesn't contain. */
const FAKES: Record<string, DexSubsetSpecies> = {
  // Every type is bogus → nothing survives the filter.
  "Fakemon-AllBogus": {
    name: "Fakemon-AllBogus",
    types: ["Bird", "Glitch"],
    baseStats: stats,
    abilities: [],
    forme: null,
    baseSpecies: null,
    isNonstandard: null,
  },
  // Empty types array → `types[0]` would be `undefined`.
  "Fakemon-NoTypes": {
    name: "Fakemon-NoTypes",
    types: [],
    baseStats: stats,
    abilities: [],
    forme: null,
    baseSpecies: null,
    isNonstandard: null,
  },
  // A mega forme whose only type is bogus (covers the second cast site).
  "Fakemon-Mega": {
    name: "Fakemon-Mega",
    types: ["Bird"],
    baseStats: stats,
    abilities: ["Levitate"],
    forme: "Mega",
    baseSpecies: "Fakemon",
    isNonstandard: null,
  },
};

vi.mock("@/lib/data/dex-subset", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data/dex-subset")>();
  return {
    ...actual,
    getSpecies: (name: string) => FAKES[name] ?? actual.getSpecies(name),
  };
});

// Imported after vi.mock so the mocked dex-subset is in place.
const { lookupPokemonFromDex, getMegaEntryFromDex } = await import(
  "@/lib/data/pkmn-dex-fallback"
);

const CANONICAL_TYPES = Object.keys(TYPE_CHART);

describe("lookupPokemonFromDex — type validation at the data boundary", () => {
  it("has exactly 18 canonical types to validate against", () => {
    expect(CANONICAL_TYPES).toHaveLength(18);
    expect(CANONICAL_TYPES).not.toContain("Bird");
  });

  it('MissingNo. repro: drops the bogus "Bird" type instead of crashing the badge', () => {
    const data = lookupPokemonFromDex("MissingNo.");

    // The entry still resolves (its Normal typing is real and renderable)...
    expect(data).not.toBeNull();
    // ...but "Bird" must never escape this boundary.
    expect(data!.types).not.toContain("Bird");
    expect(data!.types).toEqual(["Normal"]);
  });

  it("MissingNo. repro: every returned type has a TYPE_COLORS entry, so TypeBadge cannot throw", () => {
    const data = lookupPokemonFromDex("MissingNo.");

    for (const type of data!.types) {
      const colors = TYPE_COLORS[type];
      // This is the exact access that threw at TypeBadge.tsx:
      expect(colors).toBeDefined();
      expect(() => colors.bg).not.toThrow();
      expect(colors.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("rejects an entry whose every type is bogus rather than returning [undefined]", () => {
    expect(lookupPokemonFromDex("Fakemon-AllBogus")).toBeNull();
  });

  it("rejects an entry with an empty types array rather than returning [undefined]", () => {
    expect(lookupPokemonFromDex("Fakemon-NoTypes")).toBeNull();
  });

  it("never returns a types tuple containing undefined, for any species in the subset", () => {
    for (const name of ["MissingNo.", "Fakemon-AllBogus", "Fakemon-NoTypes"]) {
      const data = lookupPokemonFromDex(name);
      if (data === null) continue;
      expect(data.types.length).toBeGreaterThan(0);
      for (const t of data.types) {
        expect(t).toBeDefined();
        expect(CANONICAL_TYPES).toContain(t);
      }
    }
  });

  it("still resolves ordinary species unchanged", () => {
    const pika = lookupPokemonFromDex("Pikachu");
    expect(pika?.types).toEqual(["Electric"]);

    const gastrodon = lookupPokemonFromDex("Gastrodon");
    expect(gastrodon?.types).toEqual(["Water", "Ground"]);
  });
});

describe("getMegaEntryFromDex — same boundary on the mega path", () => {
  it("rejects a mega forme whose only type is bogus", () => {
    expect(getMegaEntryFromDex("Fakemon-Mega")).toBeNull();
  });

  it("still resolves a real mega with valid typing", () => {
    const entry = getMegaEntryFromDex("Charizard-Mega-Y");
    expect(entry).not.toBeNull();
    for (const t of entry!.types) {
      expect(CANONICAL_TYPES).toContain(t);
    }
  });
});
