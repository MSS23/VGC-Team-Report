import { describe, it, expect } from "vitest";
import { normalizePrivateFields, redactPasteFields } from "../redact-paste";

// Minimal single-Pokémon paste block for use across tests.
const GARCHOMP_BLOCK = [
  "Garchomp @ Life Orb",
  "Ability: Rough Skin",
  "Level: 50",
  "Tera Type: Dragon",
  "EVs: 252 Atk / 4 SpD / 252 Spe",
  "Adamant Nature",
  "- Scale Shot",
  "- Earthquake",
  "- Protect",
  "- Stone Edge",
].join("\n");

const NINETALES_BLOCK = [
  "Ninetales-Alola @ Icy Rock",
  "Ability: Snow Warning",
  "Level: 50",
  "Tera Type: Ice",
  "EVs: 252 SpA / 4 SpD / 252 Spe",
  "IVs: 0 Atk",
  "Timid Nature",
  "- Blizzard",
  "- Aurora Veil",
  "- Moonblast",
  "- Encore",
].join("\n");

function sixMonPaste(): string {
  const mons = [
    GARCHOMP_BLOCK,
    NINETALES_BLOCK,
    [
      "Incineroar @ Sitrus Berry",
      "Ability: Intimidate",
      "Level: 50",
      "EVs: 252 HP / 4 Atk / 252 SpD",
      "Careful Nature",
      "- Fake Out",
      "- Flare Blitz",
      "- Knock Off",
      "- Parting Shot",
    ].join("\n"),
    [
      "Whimsicott @ Focus Sash",
      "Ability: Prankster",
      "Level: 50",
      "EVs: 252 SpA / 4 SpD / 252 Spe",
      "Timid Nature",
      "- Tailwind",
      "- Moonblast",
      "- Encore",
      "- Light Screen",
    ].join("\n"),
    [
      "Torkoal @ Charcoal",
      "Ability: Drought",
      "Level: 50",
      "EVs: 252 HP / 252 SpA / 4 SpD",
      "Modest Nature",
      "- Heat Wave",
      "- Earth Power",
      "- Yawn",
      "- Protect",
    ].join("\n"),
    [
      "Kingambit @ Assault Vest",
      "Ability: Defiant",
      "Level: 50",
      "EVs: 252 HP / 252 Atk / 4 SpD",
      "Adamant Nature",
      "- Kowtow Cleave",
      "- Iron Head",
      "- Low Kick",
      "- Sucker Punch",
    ].join("\n"),
  ];
  return mons.join("\n\n");
}

describe("normalizePrivateFields", () => {
  it("returns empty array for undefined input", () => {
    expect(normalizePrivateFields(undefined)).toEqual([]);
  });

  it("returns empty array for empty array input", () => {
    expect(normalizePrivateFields([])).toEqual([]);
  });

  it("filters out unknown fields", () => {
    expect(normalizePrivateFields(["evs", "moves", "ability"])).toEqual(["evs"]);
  });

  it("deduplicates repeated fields", () => {
    const result = normalizePrivateFields(["evs", "evs", "ivs"]);
    expect(result).toHaveLength(2);
    expect(result).toContain("evs");
    expect(result).toContain("ivs");
  });

  it("accepts all valid field names", () => {
    const result = normalizePrivateFields(["evs", "ivs", "nature", "item"]);
    expect(result).toHaveLength(4);
  });
});

describe("redactPasteFields — no-op cases", () => {
  it("returns paste unchanged when fields array is empty", () => {
    expect(redactPasteFields(GARCHOMP_BLOCK, [])).toBe(GARCHOMP_BLOCK);
  });

  it("returns empty string unchanged", () => {
    expect(redactPasteFields("", ["evs"])).toBe("");
  });

  it("preserves non-private lines (moves, ability, level, tera type)", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["evs", "ivs", "nature", "item"]);
    expect(result).toContain("Ability: Rough Skin");
    expect(result).toContain("Level: 50");
    expect(result).toContain("Tera Type: Dragon");
    expect(result).toContain("- Scale Shot");
    expect(result).toContain("- Earthquake");
  });
});

describe("redactPasteFields — EVs", () => {
  it("removes the EVs line when evs is private", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["evs"]);
    expect(result).not.toContain("EVs:");
  });

  it("keeps the EVs line when evs is not private", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["ivs"]);
    expect(result).toContain("EVs: 252 Atk / 4 SpD / 252 Spe");
  });
});

describe("redactPasteFields — IVs", () => {
  it("removes the IVs line when ivs is private", () => {
    const result = redactPasteFields(NINETALES_BLOCK, ["ivs"]);
    expect(result).not.toContain("IVs:");
  });

  it("keeps the IVs line when ivs is not private", () => {
    const result = redactPasteFields(NINETALES_BLOCK, ["evs"]);
    expect(result).toContain("IVs: 0 Atk");
  });
});

describe("redactPasteFields — Nature", () => {
  it("removes the Nature line when nature is private", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["nature"]);
    expect(result).not.toContain("Nature");
  });

  it("keeps the Nature line when nature is not private", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["evs"]);
    expect(result).toContain("Adamant Nature");
  });
});

describe("redactPasteFields — Item", () => {
  it("strips @ Item from header when item is private", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["item"]);
    expect(result).not.toContain("@ Life Orb");
    expect(result).toContain("Garchomp");
  });

  it("keeps @ Item when item is not private", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["evs"]);
    expect(result).toContain("Garchomp @ Life Orb");
  });

  it("handles header with no item gracefully", () => {
    const paste = "Garchomp\nAbility: Rough Skin\nEVs: 252 Atk\nAdamant Nature\n- Earthquake";
    const result = redactPasteFields(paste, ["item"]);
    expect(result).toContain("Garchomp");
    expect(result).toContain("Ability: Rough Skin");
  });
});

describe("redactPasteFields — Pokémon with nickname", () => {
  it("strips @ Item from nicknamed header", () => {
    const paste = [
      "Chompy (Garchomp) @ Life Orb",
      "Ability: Rough Skin",
      "EVs: 252 Atk / 252 Spe / 4 SpD",
      "Adamant Nature",
      "- Earthquake",
    ].join("\n");
    const result = redactPasteFields(paste, ["item"]);
    expect(result).not.toContain("@ Life Orb");
    expect(result).toContain("Chompy (Garchomp)");
  });
});

describe("redactPasteFields — Mega form entries", () => {
  it("treats Mega form header line correctly", () => {
    const paste = [
      "Kangaskhan-Mega @ Kangaskhanite",
      "Ability: Parental Bond",
      "EVs: 252 Atk / 4 SpD / 252 Spe",
      "Adamant Nature",
      "- Double-Edge",
    ].join("\n");
    const result = redactPasteFields(paste, ["item", "evs"]);
    expect(result).not.toContain("@ Kangaskhanite");
    expect(result).toContain("Kangaskhan-Mega");
    expect(result).not.toContain("EVs:");
    expect(result).toContain("- Double-Edge");
  });
});

describe("redactPasteFields — multi-Pokémon paste", () => {
  it("redacts EVs only from all 6 blocks, leaving other lines intact", () => {
    const paste = sixMonPaste();
    const result = redactPasteFields(paste, ["evs"]);
    expect(result).not.toContain("EVs:");
    // Moves, abilities, and items should still be present
    expect(result).toContain("Ability: Rough Skin");
    expect(result).toContain("Ability: Intimidate");
    expect(result).toContain("@ Life Orb");
    expect(result).toContain("@ Sitrus Berry");
    expect(result).toContain("- Scale Shot");
    expect(result).toContain("- Fake Out");
  });

  it("redacts only target fields, preserves rest across all blocks", () => {
    const paste = sixMonPaste();
    const result = redactPasteFields(paste, ["evs", "item"]);
    // Items stripped from all headers
    expect(result).not.toContain("@ Life Orb");
    expect(result).not.toContain("@ Sitrus Berry");
    expect(result).not.toContain("EVs:");
    // Non-private info preserved
    expect(result).toContain("IVs: 0 Atk"); // Ninetales block IVs untouched
    expect(result).toContain("Timid Nature");
    expect(result).toContain("Adamant Nature");
  });

  it("preserves IVs line in blocks that have it while redacting EVs", () => {
    const paste = sixMonPaste();
    const result = redactPasteFields(paste, ["evs"]);
    expect(result).toContain("IVs: 0 Atk");
  });

  it("blank separator lines between blocks are preserved", () => {
    const paste = sixMonPaste();
    const result = redactPasteFields(paste, ["evs"]);
    // Two consecutive newlines = blank separator still present
    expect(result).toContain("\n\n");
  });
});

describe("redactPasteFields — all fields redacted simultaneously", () => {
  it("removes evs, ivs, nature and strips item from header in one pass", () => {
    const result = redactPasteFields(NINETALES_BLOCK, ["evs", "ivs", "nature", "item"]);
    expect(result).not.toContain("@ Icy Rock");
    expect(result).not.toContain("EVs:");
    expect(result).not.toContain("IVs:");
    expect(result).not.toContain("Nature");
    expect(result).toContain("Ninetales-Alola");
    expect(result).toContain("Ability: Snow Warning");
    expect(result).toContain("- Blizzard");
  });
});
