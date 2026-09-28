import { describe, it, expect } from "vitest";
import { TYPE_COLORS } from "@/lib/utils/type-colors";

/** sRGB channel -> linear, per WCAG 2.1 relative-luminance definition. */
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const AA_NORMAL_TEXT = 4.5;

describe("contrastRatio helper", () => {
  it("matches the known reference ratios", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 2);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#7AC74C", "#FFFFFF")).toBeCloseTo(
      contrastRatio("#FFFFFF", "#7AC74C"),
      10,
    );
  });
});

describe("TYPE_COLORS — WCAG 1.4.3 AA (regression: 9 of 18 type badges shipped white text below 4.5:1, Grass worst at 2.08)", () => {
  const entries = Object.entries(TYPE_COLORS);

  it("covers all 18 Pokemon types", () => {
    expect(entries).toHaveLength(18);
  });

  it.each(entries)("%s badge text clears AA against its background", (_type, colors) => {
    expect(contrastRatio(colors.bg, colors.text)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it("pins the previously failing nine as fixed", () => {
    const wasFailing = [
      "Normal", "Fire", "Water", "Grass", "Flying", "Psychic", "Bug", "Rock", "Fairy",
    ] as const;
    for (const type of wasFailing) {
      const c = TYPE_COLORS[type];
      expect(
        contrastRatio(c.bg, c.text),
        `${type} must clear AA`,
      ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      expect(c.text, `${type} should no longer use white text`).not.toBe("#FFFFFF");
    }
  });

  it("uses only the two approved text colours", () => {
    for (const [type, c] of entries) {
      expect(["#FFFFFF", "#1A1A2E"], `${type}`).toContain(c.text);
    }
  });

  it("leaves the canonical background colours untouched", () => {
    // The bg values are the well-known Pokemon type colours; only `text` moved.
    expect(TYPE_COLORS.Grass.bg).toBe("#7AC74C");
    expect(TYPE_COLORS.Fire.bg).toBe("#EE8130");
    expect(TYPE_COLORS.Water.bg).toBe("#6390F0");
    expect(TYPE_COLORS.Fighting.bg).toBe("#C22E28");
  });

  it("keeps white text where it already passed", () => {
    for (const type of ["Fighting", "Poison", "Ghost", "Dragon", "Dark"] as const) {
      expect(TYPE_COLORS[type].text).toBe("#FFFFFF");
    }
  });
});
