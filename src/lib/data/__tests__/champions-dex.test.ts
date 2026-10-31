import { describe, it, expect } from "vitest";
import { CHAMPIONS_DEX } from "../champions-dex";
import { MEGA_BY_KEY, CHAMPIONS_REG_MA_MEGAS } from "../mega-pokemon";
import { validateMegaCoverage } from "../__validate-mega-coverage";

describe("CHAMPIONS_DEX drift guard", () => {
  it("all mega species in CHAMPIONS_DEX have a MEGA_BY_KEY entry", () => {
    const missingMegas: string[] = [];
    for (const species of CHAMPIONS_DEX) {
      if (species.includes("-mega") && !MEGA_BY_KEY.has(species)) {
        missingMegas.push(species);
      }
    }
    expect(missingMegas).toEqual([]);
  });

  it("has no duplicate species (Set semantics integrity)", () => {
    // A Set cannot hold duplicates; this test documents the intent and
    // ensures CHAMPIONS_DEX is actually constructed as a Set.
    expect(CHAMPIONS_DEX).toBeInstanceOf(Set);
    const asArray = [...CHAMPIONS_DEX];
    const asSet = new Set(asArray);
    expect(asArray.length).toBe(asSet.size);
  });

  it("size is within expected range (guard against bulk add/delete)", () => {
    expect(CHAMPIONS_DEX.size).toBeGreaterThan(200);
    expect(CHAMPIONS_DEX.size).toBeLessThan(500);
  });

  it("validateMegaCoverage() resolves every Mega used by the UI", () => {
    // Covers both catalogue drift and the production lookup path, including
    // generated @pkmn/dex fallback data for newer Champions Mega forms.
    const result = validateMegaCoverage();
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("known required base species are present", () => {
    expect(CHAMPIONS_DEX.has("kangaskhan")).toBe(true);
  });

  it("known required mega species are present", () => {
    expect(CHAMPIONS_DEX.has("kangaskhan-mega")).toBe(true);
  });

  it("at least one Charizard Mega form is present", () => {
    const hasX = CHAMPIONS_DEX.has("charizard-mega-x");
    const hasY = CHAMPIONS_DEX.has("charizard-mega-y");
    expect(hasX || hasY).toBe(true);
  });

  it("both Charizard Mega-X and Mega-Y are present (both are Reg M-A legal)", () => {
    expect(CHAMPIONS_DEX.has("charizard-mega-x")).toBe(true);
    expect(CHAMPIONS_DEX.has("charizard-mega-y")).toBe(true);
  });

  it("salamence is NOT in CHAMPIONS_DEX (not Reg M-A legal)", () => {
    expect(CHAMPIONS_DEX.has("salamence")).toBe(false);
  });

  it("CHAMPIONS_REG_MA_MEGAS is a subset of CHAMPIONS_DEX", () => {
    const outsideDex: string[] = [];
    for (const mega of CHAMPIONS_REG_MA_MEGAS) {
      if (!CHAMPIONS_DEX.has(mega)) {
        outsideDex.push(mega);
      }
    }
    expect(outsideDex).toEqual([]);
  });
});
