import { describe, expect, it } from "vitest";
import { getDefensiveProfile, getEffectiveness, TYPE_CHART } from "../type-chart";
import type { PokemonType } from "@/lib/types/pokemon";

describe("getDefensiveProfile type chart", () => {
  it("Poison resists Bug (regression: Amoonguss showed a phantom Bug weakness)", () => {
    // Grass/Poison: Bug is 2x vs Grass, 0.5x vs Poison → 1x net
    expect(getDefensiveProfile(["Grass", "Poison"]).Bug).toBe(1);
    expect(getDefensiveProfile(["Poison"]).Bug).toBe(0.5);
  });
});

describe("getDefensiveProfile ability immunities", () => {
  it("Levitate grants Ground immunity", () => {
    // Gengar (Ghost/Poison) with Levitate: Ground would be 2x by typing alone
    expect(getDefensiveProfile(["Ghost", "Poison"]).Ground).toBe(2);
    expect(getDefensiveProfile(["Ghost", "Poison"], "Levitate").Ground).toBe(0);
  });

  it("absorb abilities grant immunity to their type", () => {
    // Heatran (Fire/Steel) with Flash Fire: Fire would be 0.5x by typing alone
    expect(getDefensiveProfile(["Fire", "Steel"], "Flash Fire").Fire).toBe(0);
    // Raging Bolt (Electric/Dragon) — Volt Absorb makes Electric 0x instead of 0.5x
    expect(getDefensiveProfile(["Electric", "Dragon"], "Volt Absorb").Electric).toBe(0);
    // Gastrodon — Storm Drain, with spacing/casing variants
    expect(getDefensiveProfile(["Water", "Ground"], "Storm Drain").Water).toBe(0);
    expect(getDefensiveProfile(["Water", "Ground"], "Stormdrain").Water).toBe(0);
    expect(getDefensiveProfile(["Normal"], "Sap Sipper").Grass).toBe(0);
  });

  it("other abilities leave the profile unchanged", () => {
    expect(getDefensiveProfile(["Ghost", "Poison"], "Cursed Body").Ground).toBe(2);
    expect(getDefensiveProfile(["Ghost", "Poison"], null).Ground).toBe(2);
  });
});

// VGC-294: Stellar is a legal Tera type, but it is not a battle type — a
// Stellar-Terastallized Pokemon keeps its original defensive typing. Stellar
// must therefore never appear in the chart or in a defensive profile.
describe("Stellar is not a defensive type", () => {
  it("has no row or column in the type chart", () => {
    expect(Object.keys(TYPE_CHART)).toHaveLength(18);
    expect(TYPE_CHART).not.toHaveProperty("Stellar");
    for (const row of Object.values(TYPE_CHART)) {
      expect(row).not.toHaveProperty("Stellar");
    }
  });

  it("does not alter a Pokemon's defensive profile", () => {
    // Dragonite Tera Stellar is still Dragon/Flying on defence: Ice stays 4x
    // and Stellar is not an attacking type the chart knows about.
    const profile = getDefensiveProfile(["Dragon", "Flying"]);
    expect(profile.Ice).toBe(4);
    expect(Object.keys(profile)).toHaveLength(18);
    expect(profile).not.toHaveProperty("Stellar");
  });

  it("is neutral even if a Stellar value leaks into getEffectiveness", () => {
    // Belt and braces: no copied row means no accidental effectiveness.
    expect(getEffectiveness("Stellar" as PokemonType, ["Dragon", "Flying"])).toBe(1);
  });
});
