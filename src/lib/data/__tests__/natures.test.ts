import { describe, it, expect } from "vitest";
import { NATURES, getNature, getNatureModifier } from "@/lib/data/natures";
import { calculateStat } from "@/lib/analysis/stat-calculator";

describe("getNatureModifier", () => {
  it("applies +10% / -10% to the right stats", () => {
    expect(getNatureModifier("Adamant", "atk")).toBe(1.1);
    expect(getNatureModifier("Adamant", "spa")).toBe(0.9);
    expect(getNatureModifier("Adamant", "spe")).toBe(1);
  });

  it("returns exactly 1 for a neutral nature (no spurious floor loss)", () => {
    for (const name of ["Hardy", "Docile", "Serious", "Bashful", "Quirky"]) {
      expect(getNatureModifier(name, "atk")).toBe(1);
      expect(getNatureModifier(name, "spa")).toBe(1);
    }
  });

  it("returns 1 for a nature that genuinely does not exist", () => {
    expect(getNatureModifier("Spicy", "atk")).toBe(1);
    expect(getNatureModifier("", "atk")).toBe(1);
  });

  describe("regression: a non-canonical nature string silently dropped the ±10%", () => {
    // Showdown sometimes exports a lowercase nature line, and the parser keeps
    // the nature verbatim while NATURES is keyed "Careful". The raw
    // NATURES[nature] lookup therefore missed and getNatureModifier returned
    // 1.0, so a Careful Pokemon showed 142 SpD where the truth is 156 — with
    // no ▲/▼ marker to hint that anything had been dropped.
    it("looks a nature up regardless of case or surrounding whitespace", () => {
      expect(getNatureModifier("careful", "spd")).toBe(1.1);
      expect(getNatureModifier("careful", "spa")).toBe(0.9);
      expect(getNatureModifier("CAREFUL", "spd")).toBe(1.1);
      expect(getNatureModifier("  Careful  ", "spd")).toBe(1.1);
      expect(getNatureModifier("aDaMaNt", "atk")).toBe(1.1);
    });

    it("gives a lowercase 'careful nature' paste 156 SpD, not 142", () => {
      // Incineroar base 90 SpD, 31 IV, 252 EVs, level 50:
      // floor((2*90 + 31 + 63) * 50 / 100) = floor(137) = 137
      // floor((137 + 5) * 1.1) = floor(156.2) = 156
      expect(calculateStat("spd", 90, 31, 252, 50, "careful")).toBe(156);
      expect(calculateStat("spd", 90, 31, 252, 50, "Careful")).toBe(156);
      // 142 is the neutral-nature value the bug produced.
      expect(calculateStat("spd", 90, 31, 252, 50, "Serious")).toBe(142);
    });

    it("exposes getNature so the ▲/▼ markers can resolve the same strings", () => {
      expect(getNature("careful")).toBe(NATURES.Careful);
      expect(getNature("Careful")).toBe(NATURES.Careful);
      expect(getNature(null)).toBeUndefined();
      expect(getNature("not-a-nature")).toBeUndefined();
    });

    it("covers every one of the 25 natures case-insensitively", () => {
      const names = Object.keys(NATURES);
      expect(names).toHaveLength(25);
      for (const name of names) {
        expect(getNature(name.toLowerCase())).toBe(NATURES[name]);
        expect(getNature(name.toUpperCase())).toBe(NATURES[name]);
      }
    });
  });
});
