import { describe, it, expect } from "vitest";
import { normalizePrivateFields, redactPasteFields } from "@/lib/sharing/redact-paste";

// ---------------------------------------------------------------------------
// Boundary / integration coverage for VGC-142 tiered publishing.
//
// The privacy-critical redaction lives in redact-paste.ts (unit-tested in
// redact-paste.test.ts). What this file guards is the *composition* the share
// route (src/app/api/share/[id]/route.ts) applies for non-owner viewers:
//
//   const fields = normalizePrivateFields(data.privateFields);
//   if (fields.length === 0) return { data, redactedFields: [] };
//   const paste = (data.paste as string) ?? "";
//   const redacted = redactPasteFields(paste, fields);
//   return { data: { ...data, paste: redacted }, redactedFields: fields };
//
// The route's `applyPrivateFieldRedaction` is not exported, so we reproduce it
// here EXACTLY and assert the observable contract: private EVs/IVs/items/natures
// are stripped from the paste a bare-link viewer receives, everything else is
// preserved, and non-paste fields on the data object survive untouched.
// ---------------------------------------------------------------------------

/** Faithful copy of the route's non-exported applyPrivateFieldRedaction. */
function applyPrivateFieldRedaction(data: Record<string, unknown>): {
  data: Record<string, unknown>;
  redactedFields: string[];
} {
  const fields = normalizePrivateFields(data.privateFields as string[] | undefined);
  if (fields.length === 0) return { data, redactedFields: [] };
  const paste = (data.paste as string) ?? "";
  const redacted = redactPasteFields(paste, fields);
  return {
    data: { ...data, paste: redacted },
    redactedFields: fields,
  };
}

const TEAM_PASTE = `Garchomp @ Life Orb
Ability: Rough Skin
Level: 50
Tera Type: Steel
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
IVs: 31 Spe
- Scale Shot
- Earthquake
- Iron Head
- Protect

Incineroar @ Safety Goggles
Ability: Intimidate
Level: 50
Tera Type: Fire
EVs: 252 HP / 4 Atk / 252 SpD
Careful Nature
- Fake Out
- Knock Off
- Flare Blitz
- Parting Shot`;

describe("share route redaction composition (applyPrivateFieldRedaction)", () => {
  it("returns data unchanged and no redactedFields when privateFields is absent", () => {
    const data = { paste: TEAM_PASTE, title: "My Team" };
    const result = applyPrivateFieldRedaction(data);
    expect(result.redactedFields).toEqual([]);
    expect(result.data).toBe(data); // same reference — no copy made
    expect(result.data.paste).toBe(TEAM_PASTE);
  });

  it("returns data unchanged when privateFields is an empty array", () => {
    const data = { paste: TEAM_PASTE, privateFields: [] };
    const result = applyPrivateFieldRedaction(data);
    expect(result.redactedFields).toEqual([]);
    expect(result.data.paste).toBe(TEAM_PASTE);
  });

  it("strips private EVs from the viewer-facing paste", () => {
    const data = { paste: TEAM_PASTE, privateFields: ["evs"] };
    const { data: viewable, redactedFields } = applyPrivateFieldRedaction(data);
    const paste = viewable.paste as string;

    expect(redactedFields).toEqual(["evs"]);
    expect(paste).not.toContain("EVs:");
    expect(paste).not.toContain("252 Atk");
    expect(paste).not.toContain("252 HP");
    // Public shell survives.
    expect(paste).toContain("Garchomp @ Life Orb");
    expect(paste).toContain("Ability: Rough Skin");
    expect(paste).toContain("Jolly Nature");
    expect(paste).toContain("- Scale Shot");
  });

  it("strips private IVs but leaves EVs and moves intact", () => {
    const data = { paste: TEAM_PASTE, privateFields: ["ivs"] };
    const paste = applyPrivateFieldRedaction(data).data.paste as string;
    expect(paste).not.toContain("IVs:");
    expect(paste).not.toContain("31 Spe");
    expect(paste).toContain("EVs: 252 Atk / 4 SpD / 252 Spe");
    expect(paste).toContain("- Protect");
  });

  it("strips the item from every Pokemon header when item is private", () => {
    const data = { paste: TEAM_PASTE, privateFields: ["item"] };
    const paste = applyPrivateFieldRedaction(data).data.paste as string;
    expect(paste).not.toContain("Life Orb");
    expect(paste).not.toContain("Safety Goggles");
    expect(paste).not.toContain("@");
    // Species headers remain.
    expect(paste).toContain("Garchomp");
    expect(paste).toContain("Incineroar");
  });

  it("strips the nature line when nature is private", () => {
    const data = { paste: TEAM_PASTE, privateFields: ["nature"] };
    const paste = applyPrivateFieldRedaction(data).data.paste as string;
    expect(paste).not.toContain("Jolly Nature");
    expect(paste).not.toContain("Careful Nature");
    expect(paste).toContain("EVs: 252 Atk / 4 SpD / 252 Spe");
  });

  it("strips all four private fields at once, leaving only the public shell", () => {
    const data = {
      paste: TEAM_PASTE,
      privateFields: ["evs", "ivs", "nature", "item"],
    };
    const { data: viewable, redactedFields } = applyPrivateFieldRedaction(data);
    const paste = viewable.paste as string;

    expect(new Set(redactedFields)).toEqual(new Set(["evs", "ivs", "nature", "item"]));
    // Nothing private leaks.
    expect(paste).not.toContain("EVs:");
    expect(paste).not.toContain("IVs:");
    expect(paste).not.toContain("Nature");
    expect(paste).not.toContain("Life Orb");
    expect(paste).not.toContain("Safety Goggles");
    expect(paste).not.toContain("@");
    // Public shell intact.
    expect(paste).toContain("Garchomp");
    expect(paste).toContain("Ability: Rough Skin");
    expect(paste).toContain("Tera Type: Steel");
    expect(paste).toContain("- Fake Out");
  });

  it("ignores URL-injected garbage field names via normalizePrivateFields", () => {
    const data = {
      paste: TEAM_PASTE,
      // Only "evs" is a valid field; the rest must be dropped.
      privateFields: ["evs", "moves", "ability", "__proto__", "tera"],
    };
    const { data: viewable, redactedFields } = applyPrivateFieldRedaction(data);
    const paste = viewable.paste as string;

    expect(redactedFields).toEqual(["evs"]);
    // Only EVs redacted; ability/moves/tera (garbage-requested) stay visible.
    expect(paste).not.toContain("EVs:");
    expect(paste).toContain("Ability: Rough Skin");
    expect(paste).toContain("Tera Type: Steel");
    expect(paste).toContain("- Scale Shot");
  });

  it("preserves non-paste fields on the data object and does not mutate the input", () => {
    const data = {
      paste: TEAM_PASTE,
      privateFields: ["evs"],
      title: "Regional Winner",
      _isOwner: false,
    };
    const { data: viewable } = applyPrivateFieldRedaction(data);

    expect(viewable.title).toBe("Regional Winner");
    expect(viewable._isOwner).toBe(false);
    // Original input paste is untouched (route builds a new object via spread).
    expect(data.paste).toBe(TEAM_PASTE);
    expect(data.paste).toContain("EVs:");
  });

  it("handles a missing paste field without throwing (empty-string fallback)", () => {
    const data = { privateFields: ["evs"] };
    const { data: viewable, redactedFields } = applyPrivateFieldRedaction(data);
    expect(redactedFields).toEqual(["evs"]);
    expect(viewable.paste).toBe("");
  });
});
