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

describe("regression: an attached '=== header ===' line ate the first Pokemon", () => {
  // extractSpecies skipped the whole *block* whose first line began with
  // "===", so a header exported with no blank line after it took the first
  // team member down with it: ['Rillaboom'] for a team led by Incineroar.
  // Headers are now stripped before the paste is split, exactly as
  // showdown-parser.ts does it.
  const incineroar = "Incineroar @ Safety Goggles\nAbility: Intimidate\n- Fake Out";
  const rillaboom = "Rillaboom @ Assault Vest\nAbility: Grassy Surge\n- Grassy Glide";

  it("keeps the first Pokemon when the header is attached to it (no blank line)", () => {
    const paste = `=== [gen9vgc2026] Folder/Name ===\n${incineroar}\n\n${rillaboom}`;
    expect(extractSpecies(paste)).toEqual(["Incineroar", "Rillaboom"]);
  });

  it("still keeps both when a blank line follows the header", () => {
    const paste = `=== [gen9vgc2026] Folder/Name ===\n\n${incineroar}\n\n${rillaboom}`;
    expect(extractSpecies(paste)).toEqual(["Incineroar", "Rillaboom"]);
  });

  it("handles a CRLF export with an attached header", () => {
    // Windows line endings would otherwise leave a \r on the header line, so
    // the `=== … ===$` strip would miss it and the first mon would vanish.
    const paste = `=== [gen9vgc2026] Folder/Name ===\n${incineroar}\n\n${rillaboom}`.replace(
      /\n/g,
      "\r\n",
    );
    expect(extractSpecies(paste)).toEqual(["Incineroar", "Rillaboom"]);
  });

  it("handles a header with no [format] tag and trailing whitespace", () => {
    const paste = `=== My Team ===   \n${incineroar}\n\n${rillaboom}`;
    expect(extractSpecies(paste)).toEqual(["Incineroar", "Rillaboom"]);
  });

  it("handles several teams in one backup file without losing a leader", () => {
    const paste = [
      "=== [gen9vgc2026] Team A ===",
      incineroar,
      "",
      rillaboom,
      "",
      "=== [gen9vgc2026] Team B ===",
      "Garchomp @ Life Orb\nAbility: Rough Skin\n- Earthquake",
    ].join("\n");
    expect(extractSpecies(paste)).toEqual(["Incineroar", "Rillaboom", "Garchomp"]);
  });

  it("isDifferentTeam no longer calls an edit of the same team a new team", () => {
    // The draft-loss path: prev species came from a header-less paste, the new
    // paste is the same team re-exported with an attached header.
    const paste = `=== [gen9vgc2026] Folder/Name ===\n${incineroar}\n\n${rillaboom}`;
    expect(isDifferentTeam(["Incineroar"], paste)).toBe(false);
  });
});
