import { describe, expect, it } from "vitest";
import { getDefensiveProfile } from "../type-chart";

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
