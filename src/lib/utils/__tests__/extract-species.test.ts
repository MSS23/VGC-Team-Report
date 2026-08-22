import { describe, it, expect } from "vitest";
import { extractSpecies, isDifferentTeam } from "@/lib/utils/extract-species";

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

  it("skips '=== Team ===' backup-format headers and keeps the 6th Pokemon", () => {
    const blocks = Array.from({ length: 6 }, (_, i) =>
      `Mon${i + 1} @ Leftovers\nAbility: Test\n- Tackle`
    );
    const paste = `=== [gen9vgc2026] My Team ===\n\n${blocks.join("\n\n")}`;
    const species = extractSpecies(paste);
    expect(species).toHaveLength(6);
    expect(species[0]).toBe("Mon1");
    expect(species[5]).toBe("Mon6");
  });

  it("handles empty paste", () => {
    expect(extractSpecies("")).toEqual([]);
  });

  it("handles species without item", () => {
    const paste = "Garchomp\nAbility: Rough Skin\n- Earthquake";
    expect(extractSpecies(paste)).toEqual(["Garchomp"]);
  });
});

describe("isDifferentTeam", () => {
  const garchomp = "Garchomp @ Life Orb\nAbility: Rough Skin\n- Earthquake";
  const pikachu = "Pikachu @ Light Ball\nAbility: Static\n- Thunderbolt";

  it("no shared species → different team", () => {
    expect(isDifferentTeam(["Garchomp", "Flutter Mane"], pikachu)).toBe(true);
  });

  it("any shared species → same team (iterating on it)", () => {
    expect(isDifferentTeam(["Garchomp", "Flutter Mane"], `${garchomp}\n\n${pikachu}`)).toBe(false);
  });

  it("empty previous team or unparseable paste → not different", () => {
    expect(isDifferentTeam([], pikachu)).toBe(false);
    expect(isDifferentTeam(["Garchomp"], "")).toBe(false);
  });
});
