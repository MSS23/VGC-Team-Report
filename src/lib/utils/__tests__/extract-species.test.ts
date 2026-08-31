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

  // Regression: a "=== [format] Team ===" header with no blank line after it
  // became the first block's first line, so it was counted as the species and
  // the real first Pokemon was dropped (parser hit the same bug in 1b14f3b).
  it("keeps the first Pokemon when a header is glued to it (no blank line)", () => {
    const paste = "=== [gen9vgc2026regh] My Team ===\nGarchomp @ Life Orb\nAbility: Rough Skin\n- Earthquake";
    expect(extractSpecies(paste)).toEqual(["Garchomp"]);
  });

  it("returns all 6 Pokemon when a leading header is glued to the first one", () => {
    const blocks = Array.from({ length: 6 }, (_, i) =>
      `Mon${i + 1} @ Leftovers\nAbility: Test\n- Tackle`
    );
    const paste = `=== [gen9vgc2026] My Team ===\n${blocks.join("\n\n")}`;
    expect(extractSpecies(paste)).toEqual(["Mon1", "Mon2", "Mon3", "Mon4", "Mon5", "Mon6"]);
  });

  it("handles a header with trailing whitespace and CRLF line endings", () => {
    const paste = "=== [gen9vgc2026] My Team ===  \r\nGarchomp @ Life Orb\r\nAbility: Rough Skin\r\n\r\nFlutter Mane @ Choice Specs\r\nAbility: Protosynthesis";
    expect(extractSpecies(paste)).toEqual(["Garchomp", "Flutter Mane"]);
  });

  it("drops headers that appear between teams in a multi-team backup paste", () => {
    const paste = [
      "=== [gen9vgc2026] Team A ===",
      "Garchomp @ Life Orb",
      "",
      "=== [gen9vgc2026] Team B ===",
      "Pikachu @ Light Ball",
    ].join("\n");
    expect(extractSpecies(paste)).toEqual(["Garchomp", "Pikachu"]);
  });

  it("keeps a nicknamed first Pokemon glued to a header", () => {
    const paste = "=== Champions Reg M-A ===\nBig Boy (Garchomp) @ Life Orb\nAbility: Rough Skin";
    expect(extractSpecies(paste)).toEqual(["Garchomp"]);
  });

  it("returns nothing for a header-only paste", () => {
    expect(extractSpecies("=== [gen9vgc2026] My Team ===")).toEqual([]);
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
