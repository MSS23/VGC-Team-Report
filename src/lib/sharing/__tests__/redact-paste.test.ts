import { describe, it, expect } from "vitest";
import { normalizePrivateFields, redactPasteFields } from "@/lib/sharing/redact-paste";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const GARCHOMP_BLOCK = `Garchomp @ Life Orb
Ability: Rough Skin
Level: 50
Tera Type: Steel
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
IVs: 31 Spe
- Scale Shot
- Earthquake
- Iron Head
- Protect`;

const INCINEROAR_BLOCK = `Incineroar @ Safety Goggles
Ability: Intimidate
Level: 50
Tera Type: Fire
EVs: 252 HP / 4 Atk / 252 SpD
Careful Nature
- Fake Out
- Knock Off
- Flare Blitz
- Parting Shot`;

/** A realistic two-Pokemon paste with a blank line separator. */
const TWO_POKEMON_PASTE = `${GARCHOMP_BLOCK}\n\n${INCINEROAR_BLOCK}`;

// ---------------------------------------------------------------------------
// normalizePrivateFields
// ---------------------------------------------------------------------------

describe("normalizePrivateFields", () => {
  it("returns [] for undefined input", () => {
    expect(normalizePrivateFields(undefined)).toEqual([]);
  });

  it("returns [] for empty array", () => {
    expect(normalizePrivateFields([])).toEqual([]);
  });

  it("passes through all four known fields", () => {
    const result = normalizePrivateFields(["evs", "ivs", "nature", "item"]);
    expect(result).toHaveLength(4);
    expect(result).toContain("evs");
    expect(result).toContain("ivs");
    expect(result).toContain("nature");
    expect(result).toContain("item");
  });

  it("filters out unknown/garbage strings", () => {
    expect(normalizePrivateFields(["evs", "hax", "moveset", ""])).toEqual(["evs"]);
  });

  it("filters out all unknown strings leaving an empty array", () => {
    expect(normalizePrivateFields(["speed", "attack", "injected"])).toEqual([]);
  });

  it("deduplicates repeated known fields", () => {
    const result = normalizePrivateFields(["evs", "evs", "evs", "nature"]);
    expect(result).toHaveLength(2);
    expect(result).toContain("evs");
    expect(result).toContain("nature");
  });

  it("is case-sensitive — uppercase variants are filtered out", () => {
    expect(normalizePrivateFields(["EVs", "IVs", "Nature", "Item"])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// redactPasteFields — empty / no-op cases
// ---------------------------------------------------------------------------

describe("redactPasteFields — no-op cases", () => {
  it("returns paste unchanged when fields array is empty", () => {
    expect(redactPasteFields(GARCHOMP_BLOCK, [])).toBe(GARCHOMP_BLOCK);
  });

  it("returns empty string unchanged", () => {
    expect(redactPasteFields("", ["evs"])).toBe("");
  });

  it("returns empty string unchanged when fields is also empty", () => {
    expect(redactPasteFields("", [])).toBe("");
  });
});

// ---------------------------------------------------------------------------
// redactPasteFields — EVs
// ---------------------------------------------------------------------------

describe("redactPasteFields — evs", () => {
  it("removes the EVs line", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["evs"]);
    expect(result).not.toMatch(/^\s*EVs\s*:/im);
  });

  it("preserves all other lines", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["evs"]);
    expect(result).toContain("Garchomp @ Life Orb");
    expect(result).toContain("Ability: Rough Skin");
    expect(result).toContain("Level: 50");
    expect(result).toContain("Tera Type: Steel");
    expect(result).toContain("Jolly Nature");
    expect(result).toContain("IVs: 31 Spe");
    expect(result).toContain("- Scale Shot");
    expect(result).toContain("- Earthquake");
  });
});

// ---------------------------------------------------------------------------
// redactPasteFields — IVs
// ---------------------------------------------------------------------------

describe("redactPasteFields — ivs", () => {
  it("removes the IVs line", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["ivs"]);
    expect(result).not.toMatch(/^\s*IVs\s*:/im);
  });

  it("preserves all other lines", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["ivs"]);
    expect(result).toContain("Garchomp @ Life Orb");
    expect(result).toContain("Ability: Rough Skin");
    expect(result).toContain("EVs: 252 Atk / 4 SpD / 252 Spe");
    expect(result).toContain("Jolly Nature");
    expect(result).toContain("- Protect");
  });
});

// ---------------------------------------------------------------------------
// redactPasteFields — Nature
// ---------------------------------------------------------------------------

describe("redactPasteFields — nature", () => {
  it("removes the Nature line", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["nature"]);
    expect(result).not.toMatch(/\bNature\b/i);
  });

  it("preserves all other lines", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["nature"]);
    expect(result).toContain("Garchomp @ Life Orb");
    expect(result).toContain("EVs: 252 Atk / 4 SpD / 252 Spe");
    expect(result).toContain("IVs: 31 Spe");
    expect(result).toContain("- Iron Head");
  });
});

// ---------------------------------------------------------------------------
// redactPasteFields — Item
// ---------------------------------------------------------------------------

describe("redactPasteFields — item", () => {
  it("strips the @ Item suffix from the header line", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["item"]);
    const firstLine = result.split("\n")[0];
    expect(firstLine).toBe("Garchomp");
  });

  it("preserves everything else when only item is redacted", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["item"]);
    expect(result).toContain("Ability: Rough Skin");
    expect(result).toContain("EVs: 252 Atk / 4 SpD / 252 Spe");
    expect(result).toContain("Jolly Nature");
    expect(result).toContain("IVs: 31 Spe");
    expect(result).toContain("- Scale Shot");
  });

  it("leaves header unchanged when there is no @ on the header line", () => {
    const pasteNoItem = `Garchomp
Ability: Rough Skin
Level: 50
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Earthquake`;
    const result = redactPasteFields(pasteNoItem, ["item"]);
    expect(result.split("\n")[0]).toBe("Garchomp");
  });
});

// ---------------------------------------------------------------------------
// redactPasteFields — multiple fields at once
// ---------------------------------------------------------------------------

describe("redactPasteFields — multiple fields", () => {
  it("removes EVs and IVs when both requested", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["evs", "ivs"]);
    expect(result).not.toMatch(/^\s*EVs\s*:/im);
    expect(result).not.toMatch(/^\s*IVs\s*:/im);
    expect(result).toContain("Jolly Nature");
    expect(result).toContain("Garchomp @ Life Orb");
  });

  it("removes EVs, IVs, and Nature when all three requested", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["evs", "ivs", "nature"]);
    expect(result).not.toMatch(/^\s*EVs\s*:/im);
    expect(result).not.toMatch(/^\s*IVs\s*:/im);
    expect(result).not.toMatch(/\bNature\b/i);
    expect(result).toContain("Garchomp @ Life Orb");
    expect(result).toContain("Ability: Rough Skin");
  });

  it("redacts all four fields leaving only species, ability, level, tera, and moves", () => {
    const result = redactPasteFields(GARCHOMP_BLOCK, ["evs", "ivs", "nature", "item"]);
    expect(result).not.toMatch(/^\s*EVs\s*:/im);
    expect(result).not.toMatch(/^\s*IVs\s*:/im);
    expect(result).not.toMatch(/\bNature\b/i);
    expect(result).not.toContain("Life Orb");
    // Public shell still present
    expect(result.split("\n")[0]).toBe("Garchomp");
    expect(result).toContain("Ability: Rough Skin");
    expect(result).toContain("Level: 50");
    expect(result).toContain("Tera Type: Steel");
    expect(result).toContain("- Scale Shot");
    expect(result).toContain("- Earthquake");
    expect(result).toContain("- Iron Head");
    expect(result).toContain("- Protect");
  });
});

// ---------------------------------------------------------------------------
// redactPasteFields — edge cases
// ---------------------------------------------------------------------------

describe("redactPasteFields — edge cases", () => {
  it("does not crash when Pokemon has no EVs line", () => {
    const noEvs = `Garchomp @ Life Orb
Ability: Rough Skin
Level: 50
Jolly Nature
- Earthquake`;
    expect(() => redactPasteFields(noEvs, ["evs"])).not.toThrow();
    const result = redactPasteFields(noEvs, ["evs"]);
    expect(result).toContain("Garchomp @ Life Orb");
    expect(result).toContain("Jolly Nature");
  });

  it("does not crash when Pokemon has no IVs line", () => {
    const noIvs = `Garchomp @ Life Orb
Ability: Rough Skin
Level: 50
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Earthquake`;
    expect(() => redactPasteFields(noIvs, ["ivs"])).not.toThrow();
    const result = redactPasteFields(noIvs, ["ivs"]);
    expect(result).toContain("EVs: 252 Atk / 4 SpD / 252 Spe");
    expect(result).toContain("Jolly Nature");
  });

  it("does not crash when Pokemon has no Nature line", () => {
    const noNature = `Garchomp @ Life Orb
Ability: Rough Skin
Level: 50
EVs: 252 Atk / 4 SpD / 252 Spe
- Earthquake`;
    expect(() => redactPasteFields(noNature, ["nature"])).not.toThrow();
    const result = redactPasteFields(noNature, ["nature"]);
    expect(result).toContain("EVs: 252 Atk / 4 SpD / 252 Spe");
  });

  it("does not crash when Pokemon has no item (no @ in header)", () => {
    const noItem = `Garchomp
Ability: Rough Skin
Level: 50
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Earthquake`;
    expect(() => redactPasteFields(noItem, ["item"])).not.toThrow();
    const result = redactPasteFields(noItem, ["item"]);
    expect(result.split("\n")[0]).toBe("Garchomp");
  });

  it("handles CRLF line endings without crashing and still redacts EVs", () => {
    const crlf = GARCHOMP_BLOCK.replace(/\n/g, "\r\n");
    const result = redactPasteFields(crlf, ["evs"]);
    // After split-on-\n, each line retains \r — EVs line should still be gone
    expect(result).not.toMatch(/EVs\s*:/i);
    expect(result).toContain("Garchomp");
  });

  it("handles CRLF line endings without crashing and still redacts item", () => {
    const crlf = GARCHOMP_BLOCK.replace(/\n/g, "\r\n");
    const result = redactPasteFields(crlf, ["item"]);
    // Header line may have trailing \r — item portion should be stripped
    expect(result).not.toContain("Life Orb");
    // Species name still present on first line
    expect(result.split("\n")[0]).toMatch(/^Garchomp/);
  });

  it("in a multi-Pokemon paste only the matching lines are removed", () => {
    const result = redactPasteFields(TWO_POKEMON_PASTE, ["evs"]);
    // Both EVs lines gone
    expect(result).not.toMatch(/^\s*EVs\s*:/im);
    // Abilities for both still present
    expect(result).toContain("Ability: Rough Skin");
    expect(result).toContain("Ability: Intimidate");
    // Natures for both still present
    expect(result).toContain("Jolly Nature");
    expect(result).toContain("Careful Nature");
    // Items for both still present
    expect(result).toContain("Garchomp @ Life Orb");
    expect(result).toContain("Incineroar @ Safety Goggles");
    // Moves for both still present
    expect(result).toContain("- Scale Shot");
    expect(result).toContain("- Fake Out");
  });

  it("in a multi-Pokemon paste item redaction strips @ from every block header", () => {
    const result = redactPasteFields(TWO_POKEMON_PASTE, ["item"]);
    const lines = result.split("\n");
    // First header should be "Garchomp" (no item)
    expect(lines[0]).toBe("Garchomp");
    // Find the line that starts with "Incineroar" — should have no @
    const incineroarHeader = lines.find((l) => l.startsWith("Incineroar"));
    expect(incineroarHeader).toBeDefined();
    expect(incineroarHeader).not.toContain("@");
    expect(incineroarHeader).toBe("Incineroar");
  });

  it("empty lines between blocks are preserved", () => {
    const result = redactPasteFields(TWO_POKEMON_PASTE, ["evs"]);
    // The blank line separating blocks should still be there
    expect(result).toContain("\n\n");
  });

  it("Pokemon nickname containing @ symbol does not have nickname stripped", () => {
    // A nickname with @ is unusual but should not cause the species to be
    // truncated on the header line when item is NOT private.
    const nicknameAtPaste = `Chomp@Speed (Garchomp) @ Life Orb
Ability: Rough Skin
Level: 50
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Earthquake`;
    // When "item" is NOT in fields, header must be untouched
    const noItemRedact = redactPasteFields(nicknameAtPaste, ["evs"]);
    expect(noItemRedact.split("\n")[0]).toBe("Chomp@Speed (Garchomp) @ Life Orb");
  });

  it("when item IS private and header has a nickname with @, strips from first @ onward", () => {
    // The implementation strips everything from the first @ — this documents
    // the current (known) behaviour so future changes are visible.
    const nicknameAtPaste = `Chomp@Speed (Garchomp) @ Life Orb
Ability: Rough Skin
Level: 50
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Earthquake`;
    const result = redactPasteFields(nicknameAtPaste, ["item"]);
    // Current behaviour: strips from the first @, leaving just "Chomp"
    expect(result.split("\n")[0]).toBe("Chomp");
  });
});
