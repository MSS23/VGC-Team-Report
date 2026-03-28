import { describe, it, expect } from "vitest";
import { pokemonToShowdown, teamToShowdown } from "@/lib/utils/export-paste";
import type { ParsedPokemon } from "@/lib/types/pokemon";

const GARCHOMP: ParsedPokemon = {
  species: "Garchomp",
  nickname: null,
  gender: null,
  item: "Life Orb",
  ability: "Rough Skin",
  level: 50,
  shiny: false,
  teraType: "Fire",
  nature: "Jolly",
  evs: { hp: 4, atk: 252, def: 0, spa: 0, spd: 0, spe: 252 },
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  moves: ["Earthquake", "Dragon Claw", "Protect", "Swords Dance"],
};

describe("pokemonToShowdown", () => {
  it("exports basic Pokemon correctly", () => {
    const output = pokemonToShowdown(GARCHOMP);
    expect(output).toContain("Garchomp @ Life Orb");
    expect(output).toContain("Ability: Rough Skin");
    expect(output).toContain("Tera Type: Fire");
    expect(output).toContain("EVs: 4 HP / 252 Atk / 252 Spe");
    expect(output).toContain("Jolly Nature");
    expect(output).toContain("- Earthquake");
    expect(output).toContain("- Swords Dance");
  });

  it("does not include Level line for level 50", () => {
    const output = pokemonToShowdown(GARCHOMP);
    expect(output).not.toContain("Level:");
  });

  it("includes Level line for non-50", () => {
    const output = pokemonToShowdown({ ...GARCHOMP, level: 100 });
    expect(output).toContain("Level: 100");
  });

  it("includes nickname in parentheses", () => {
    const output = pokemonToShowdown({ ...GARCHOMP, nickname: "Chompy" });
    expect(output).toContain("Chompy (Garchomp)");
  });

  it("includes gender marker", () => {
    const output = pokemonToShowdown({ ...GARCHOMP, gender: "F" });
    expect(output).toContain("(F)");
  });

  it("includes Shiny: Yes when shiny", () => {
    const output = pokemonToShowdown({ ...GARCHOMP, shiny: true });
    expect(output).toContain("Shiny: Yes");
  });

  it("omits IVs line when all are 31", () => {
    const output = pokemonToShowdown(GARCHOMP);
    expect(output).not.toContain("IVs:");
  });

  it("includes IVs line when non-default", () => {
    const output = pokemonToShowdown({
      ...GARCHOMP,
      ivs: { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 },
    });
    expect(output).toContain("IVs: 0 Atk");
  });
});

describe("teamToShowdown", () => {
  it("joins multiple Pokemon with double newlines", () => {
    const output = teamToShowdown([GARCHOMP, { ...GARCHOMP, species: "Incineroar" }]);
    expect(output).toContain("Garchomp @ Life Orb");
    expect(output).toContain("Incineroar @ Life Orb");
    expect(output.split("\n\n").length).toBe(2);
  });
});
