import { describe, it, expect } from "vitest";
import { extractSpecies } from "@/lib/utils/extract-species";

describe("extractSpecies", () => {
  it("extracts species from simple paste", () => {
    const paste = "Garchomp @ Life Orb\nAbility: Rough Skin\n- Earthquake";
    expect(extractSpecies(paste)).toEqual(["Garchomp"]);
  });

  it("extracts species from nicknamed Pokemon", () => {
    const paste = "Big Boy (Garchomp) @ Life Orb\nAbility: Rough Skin\n- Earthquake";
    expect(extractSpecies(paste)).toEqual(["Garchomp"]);
  });

  it("strips gender markers", () => {
    const paste = "Garchomp (F) @ Life Orb\nAbility: Rough Skin\n- Earthquake";
    expect(extractSpecies(paste)).toEqual(["Garchomp"]);
  });

  it("extracts multiple species", () => {
    const paste = [
      "Garchomp @ Life Orb\nAbility: Rough Skin\n- Earthquake",
      "Flutter Mane @ Choice Specs\nAbility: Protosynthesis\n- Moonblast",
    ].join("\n\n");
    expect(extractSpecies(paste)).toEqual(["Garchomp", "Flutter Mane"]);
  });

  it("truncates to 6 Pokemon", () => {
    const blocks = Array.from({ length: 8 }, (_, i) =>
      `Mon${i + 1} @ Leftovers\nAbility: Test\n- Tackle`
    ).join("\n\n");
    expect(extractSpecies(blocks)).toHaveLength(6);
  });

  it("handles empty paste", () => {
    expect(extractSpecies("")).toEqual([]);
  });

  it("handles species without item", () => {
    const paste = "Garchomp\nAbility: Rough Skin\n- Earthquake";
    expect(extractSpecies(paste)).toEqual(["Garchomp"]);
  });
});
