import { describe, it, expect } from "vitest";
import { resolveEffectiveForm } from "@/lib/utils/effective-form";
import { getDefensiveProfile } from "@/lib/data/type-chart";
import type { PokemonType } from "@/lib/types/pokemon";

describe("resolveEffectiveForm", () => {
  it("leaves a non-Mega Pokemon's species, types and ability untouched", () => {
    const form = resolveEffectiveForm({
      species: "Incineroar",
      item: "Sitrus Berry",
      ability: "Intimidate",
    });
    expect(form.displaySpecies).toBe("Incineroar");
    expect(form.spriteSpecies).toBe("Incineroar");
    expect(form.displayTypes).toEqual(["Fire", "Dark"]);
    expect(form.displayAbility).toBe("Intimidate");
  });

  it("keeps a real ability that happens to grant an immunity on a non-Mega", () => {
    const form = resolveEffectiveForm({
      species: "Flutter Mane",
      item: "Booster Energy",
      ability: "Protosynthesis",
    });
    expect(form.displayAbility).toBe("Protosynthesis");
  });

  it("resolves a base form holding its matching Mega Stone to the Mega's data", () => {
    const form = resolveEffectiveForm({
      species: "Kangaskhan",
      item: "Kangaskhanite",
      ability: "Scrappy",
    });
    expect(form.displaySpecies).toBe("Mega Kangaskhan");
    expect(form.spriteSpecies).toBe("kangaskhan-mega");
    expect(form.displayTypes).toEqual(["Normal"]);
    expect(form.displayAbility).toBe("Parental Bond");
  });

  it("picks the Mega ability matching the stone for dual-Mega Charizard", () => {
    expect(
      resolveEffectiveForm({ species: "Charizard", item: "Charizardite X", ability: "Blaze" }),
    ).toMatchObject({ displayTypes: ["Fire", "Dragon"], displayAbility: "Tough Claws" });
    expect(
      resolveEffectiveForm({ species: "Charizard", item: "Charizardite Y", ability: "Blaze" }),
    ).toMatchObject({ displayTypes: ["Fire", "Flying"], displayAbility: "Drought" });
  });

  it("prefers the Mega's own ability when the paste is already a Mega form", () => {
    const form = resolveEffectiveForm({
      species: "Gengar-Mega",
      item: "Gengarite",
      ability: "Levitate",
    });
    expect(form.displayTypes).toEqual(["Ghost", "Poison"]);
    expect(form.displayAbility).toBe("Shadow Tag");
  });

  it("does not Mega-resolve a base form holding a non-Mega item", () => {
    const form = resolveEffectiveForm({
      species: "Kangaskhan",
      item: "Sitrus Berry",
      ability: "Scrappy",
    });
    expect(form.displaySpecies).toBe("Kangaskhan");
    expect(form.displayAbility).toBe("Scrappy");
  });

  it("falls back to the pasted ability for an unknown species", () => {
    const form = resolveEffectiveForm({
      species: "Not-A-Pokemon-9000",
      item: null,
      ability: "Intimidate",
    });
    expect(form.data).toBeNull();
    expect(form.displayTypes).toEqual([]);
    expect(form.displayAbility).toBe("Intimidate");
  });

  // VGC-293 regression: the Compare page swapped in the Mega's typing but kept
  // passing the pasted base-form ability into getDefensiveProfile, so Gengar @
  // Gengarite was treated as Ground-immune via Levitate. Mega Gengar has Shadow
  // Tag, so Ground must hit it for neutral damage.
  describe("VGC-293: Gengar @ Gengarite is Shadow Tag, not Levitate", () => {
    it("resolves Mega Gengar's ability to Shadow Tag", () => {
      const form = resolveEffectiveForm({
        species: "Gengar",
        item: "Gengarite",
        ability: "Levitate",
      });
      expect(form.displaySpecies).toBe("Mega Gengar");
      expect(form.displayTypes).toEqual(["Ghost", "Poison"]);
      expect(form.displayAbility).toBe("Shadow Tag");
    });

    it("is Ground-weak, not Ground-immune, in its defensive profile", () => {
      const form = resolveEffectiveForm({
        species: "Gengar",
        item: "Gengarite",
        ability: "Levitate",
      });
      const profile = getDefensiveProfile(
        form.displayTypes as PokemonType[],
        form.displayAbility,
      );
      // Ground is 2x into Poison, and Shadow Tag grants no immunity.
      expect(profile.Ground).toBe(2);
      // Sanity: the pasted base-form ability WOULD have zeroed Ground out,
      // flipping this from a team weakness to a non-entry.
      const buggy = getDefensiveProfile(form.displayTypes as PokemonType[], "Levitate");
      expect(buggy.Ground).toBe(0);
    });
  });
});
