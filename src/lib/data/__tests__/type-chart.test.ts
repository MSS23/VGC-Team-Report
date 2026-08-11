import { describe, expect, it } from "vitest";
import { getDefensiveProfile } from "../type-chart";

describe("getDefensiveProfile ability immunities", () => {
  it("Levitate grants Ground immunity", () => {
    // Gengar (Ghost/Poison) with Levitate: Ground would be 2x by typing alone
    expect(getDefensiveProfile(["Ghost", "Poison"]).Ground).toBe(2);
    expect(getDefensiveProfile(["Ghost", "Poison"], "Levitate").Ground).toBe(0);
  });

  it("other abilities leave the profile unchanged", () => {
    expect(getDefensiveProfile(["Ghost", "Poison"], "Cursed Body").Ground).toBe(2);
    expect(getDefensiveProfile(["Ghost", "Poison"], null).Ground).toBe(2);
  });
});
