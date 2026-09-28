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

  // Regression: the header check used to `continue` past the whole block, so a
  // backup export whose header is NOT followed by a blank line lost the first
  // Pokemon — 5 species for a 6-mon team, silently. This feeds Explore's
  // species filter, sprites, embeds and the OG image, so the loss is visible.
  it("keeps the first Pokemon when a backup header has no blank line after it", () => {
    const blocks = Array.from({ length: 6 }, (_, i) =>
      `Mon${i + 1} @ Leftovers\nAbility: Test\n- Tackle`
    );
    // Header glued onto the first block: only ONE newline after the header.
    const paste = `=== [gen9vgc2026] My Team ===\n${blocks.join("\n\n")}`;
    const species = extractSpecies(paste);
    expect(species).toEqual(["Mon1", "Mon2", "Mon3", "Mon4", "Mon5", "Mon6"]);
  });

  it("keeps a nicknamed first Pokemon glued to a backup header", () => {
    const paste = "=== [gen9vgc2026] T ===\nBig Boy (Garchomp) @ Life Orb\nAbility: Rough Skin";
    expect(extractSpecies(paste)).toEqual(["Garchomp"]);
  });

  it("never emits a header line as a species", () => {
    const paste = "=== [gen9vgc2026] My Team ===\nGarchomp @ Life Orb";
    expect(extractSpecies(paste)).not.toContain("=== [gen9vgc2026] My Team ===");
    expect(extractSpecies(paste)).toEqual(["Garchomp"]);
  });

  it("handles several teams in one backup export, headers glued or not", () => {
    const paste = [
      "=== [gen9vgc2026] Team A ===",
      "Garchomp @ Life Orb",
      "",
      "=== [gen9vgc2026] Team B ===",
      "",
      "Flutter Mane @ Choice Specs",
    ].join("\n");
    expect(extractSpecies(paste)).toEqual(["Garchomp", "Flutter Mane"]);
  });

  it("skips a block that is nothing but a header", () => {
    const paste = "=== [gen9vgc2026] Empty ===\n\nGarchomp @ Life Orb";
    expect(extractSpecies(paste)).toEqual(["Garchomp"]);
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
