import { describe, it, expect } from "vitest";
import { ShareableStateSchema } from "@/lib/sharing/url-codec.schemas";

/**
 * VGC-343 — a malformed `#data=` share link white-screened the report.
 *
 * `CalcEntrySchema` was `z.unknown()`, so `calcs: { Garchomp: [null] }` passed
 * validation untouched, was cast to `CalcEntry[]`, and then blew up in
 * `CalcsPanel` on `calcs.filter((c) => c.category === "offensive")`.
 *
 * The schema is now the URL path's normaliser (the counterpart of
 * `migrateCalcs` on the stored-report path), so every entry that survives
 * validation is renderable: a string `text` and one of the three valid
 * categories. Unusable entries are dropped rather than rendered as the literal
 * text "null".
 */

const CATEGORIES = ["offensive", "defensive", "speed"];

/** Minimally valid ShareableState — `paste`, `notes`, `matchupPlans`. */
function stateWithCalcs(calcs: unknown) {
  return {
    paste: "Garchomp @ Life Orb\nAbility: Rough Skin\n- Earthquake",
    notes: {},
    matchupPlans: [],
    calcs,
  };
}

function parseCalcs(calcs: unknown) {
  const result = ShareableStateSchema.safeParse(stateWithCalcs(calcs));
  expect(result.success).toBe(true);
  return result.success ? result.data.calcs : undefined;
}

/** What every downstream consumer (CalcsPanel, SpeedTierChart) assumes. */
function expectRenderable(entries: unknown) {
  expect(Array.isArray(entries)).toBe(true);
  for (const entry of entries as unknown[]) {
    expect(entry).not.toBeNull();
    expect(typeof entry).toBe("object");
    const e = entry as Record<string, unknown>;
    expect(typeof e.text).toBe("string");
    expect(CATEGORIES).toContain(e.category);
  }
}

describe("VGC-343: malformed #data= calcs must not white-screen the report", () => {
  it("does not let a null entry reach the renderer", () => {
    const calcs = parseCalcs({ Garchomp: [null] });
    expectRenderable(calcs?.Garchomp);
    // The null is dropped, not rendered as the literal text "null".
    expect(calcs?.Garchomp).toEqual([]);
  });

  it("does not let an empty object reach the renderer", () => {
    const calcs = parseCalcs({ Garchomp: [{}] });
    expectRenderable(calcs?.Garchomp);
    expect(calcs?.Garchomp).toEqual([]);
  });

  it("drops other unrenderable primitives without failing the parse", () => {
    const calcs = parseCalcs({
      Garchomp: [null, undefined, 42, true, "", "   ", { text: "" }, []],
    });
    expectRenderable(calcs?.Garchomp);
    expect(calcs?.Garchomp).toEqual([]);
  });

  it("treats a non-array calcs value for a species as no calcs", () => {
    expect(() => ShareableStateSchema.parse(stateWithCalcs({ Garchomp: "not-an-array" }))).not.toThrow();
    const calcs = parseCalcs({ Garchomp: "not-an-array" });
    expect(calcs?.Garchomp).toEqual([]);
  });

  it("keeps the good entries when a list mixes valid and garbage", () => {
    const calcs = parseCalcs({
      Garchomp: [null, "Earthquake vs Miraidon: 78.1%", { text: "Outspeeds base 100", category: "speed" }],
    });
    expectRenderable(calcs?.Garchomp);
    expect(calcs?.Garchomp).toEqual([
      { text: "Earthquake vs Miraidon: 78.1%", category: "offensive" },
      { text: "Outspeeds base 100", category: "speed" },
    ]);
  });

  it("migrates a plain-string entry to an offensive CalcEntry", () => {
    const calcs = parseCalcs({ Garchomp: ["Earthquake vs Miraidon: 78.1%"] });
    expect(calcs?.Garchomp).toEqual([
      { text: "Earthquake vs Miraidon: 78.1%", category: "offensive" },
    ]);
  });

  it("passes a valid entry through unchanged", () => {
    const entry = { text: "Flutter Mane Moonblast vs Garchomp: 52%", category: "defensive" };
    const calcs = parseCalcs({ Garchomp: [entry] });
    expect(calcs?.Garchomp).toEqual([entry]);
  });

  it("coerces an invalid category to offensive", () => {
    const calcs = parseCalcs({ Garchomp: [{ text: "Earthquake vs Rillaboom", category: "bogus" }] });
    expect(calcs?.Garchomp).toEqual([
      { text: "Earthquake vs Rillaboom", category: "offensive" },
    ]);
  });

  it("coerces a non-string text that carries a value", () => {
    const calcs = parseCalcs({ Garchomp: [{ text: 42, category: "speed" }] });
    expect(calcs?.Garchomp).toEqual([{ text: "42", category: "speed" }]);
  });

  it("leaves an absent calcs field absent", () => {
    const result = ShareableStateSchema.safeParse({
      paste: "Garchomp @ Life Orb",
      notes: {},
      matchupPlans: [],
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.calcs).toBeUndefined();
  });

  it("still fails closed when calcs itself is structurally wrong", () => {
    expect(ShareableStateSchema.safeParse(stateWithCalcs("nope")).success).toBe(false);
  });
});
