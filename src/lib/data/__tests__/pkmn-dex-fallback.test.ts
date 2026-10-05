/**
 * Regression test for H3: `entry.types as PokemonType[]` followed by
 * `[types[0]]` produced `[undefined]` *typed* as `[PokemonType]` whenever the
 * dex subset decoded a species with no types — `splitList` returns `[]` for an
 * empty pipe-joined string by contract — and that `undefined` then flowed into
 * the type badges and type-effectiveness code as if it were a real type.
 *
 * The shipped subset has no such row today, so the empty-types state is forced
 * here by mocking the subset accessors.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DexSubsetSpecies } from "@/lib/data/dex-subset";

const species = new Map<string, DexSubsetSpecies>();

vi.mock("@/lib/data/dex-subset", () => ({
  getSpecies: (name: string) => species.get(name.toLowerCase().replace(/[^a-z0-9]/g, "")) ?? null,
  getMegaStone: () => null,
  allMegaStones: () => [],
}));

import { lookupPokemonFromDex, getMegaEntryFromDex } from "@/lib/data/pkmn-dex-fallback";

function makeSpecies(over: Partial<DexSubsetSpecies> & { name: string }): DexSubsetSpecies {
  return {
    name: over.name,
    types: over.types ?? ["Dragon"],
    baseStats: over.baseStats ?? { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
    abilities: over.abilities ?? ["Levitate"],
    forme: over.forme ?? null,
    baseSpecies: over.baseSpecies ?? over.name,
    isNonstandard: over.isNonstandard ?? null,
  };
}

function register(entry: DexSubsetSpecies) {
  species.set(entry.name.toLowerCase().replace(/[^a-z0-9]/g, ""), entry);
}

beforeEach(() => {
  species.clear();
});

describe("pkmn-dex-fallback — a species with no decodable types", () => {
  it("returns null instead of a [undefined] types tuple", () => {
    register(makeSpecies({ name: "Typelessmon", types: [] }));

    const data = lookupPokemonFromDex("Typelessmon");
    expect(data).toBeNull();
  });

  it("returns null for a Mega forme with no decodable types", () => {
    register(makeSpecies({ name: "Typelessmega-Mega", types: [], forme: "Mega", baseSpecies: "Typelessmega" }));

    const entry = getMegaEntryFromDex("Typelessmega-Mega");
    expect(entry).toBeNull();
  });

  it("still resolves single- and dual-typed species into a real tuple", () => {
    register(makeSpecies({ name: "Monotypemon", types: ["Water"] }));
    register(makeSpecies({ name: "Dualtypemon", types: ["Water", "Flying"] }));

    expect(lookupPokemonFromDex("Monotypemon")?.types).toEqual(["Water"]);
    expect(lookupPokemonFromDex("Dualtypemon")?.types).toEqual(["Water", "Flying"]);
    // No slot is ever undefined.
    for (const name of ["Monotypemon", "Dualtypemon"]) {
      const types = lookupPokemonFromDex(name)?.types ?? [];
      expect(types.length).toBeGreaterThan(0);
      expect(types.every((t) => typeof t === "string" && t.length > 0)).toBe(true);
    }
  });

  it("builds a Mega entry with a real types tuple when the subset has types", () => {
    register(makeSpecies({
      name: "Dualmega-Mega",
      types: ["Fairy", "Flying"],
      forme: "Mega",
      baseSpecies: "Dualmega",
    }));

    const entry = getMegaEntryFromDex("Dualmega-Mega");
    expect(entry?.types).toEqual(["Fairy", "Flying"]);
  });
});
