import { describe, it, expect } from "vitest";
import { getItemStatBoost } from "@/lib/analysis/item-boosts";
import type { StatSpread } from "@/lib/types/pokemon";

const SAMPLE_STATS: StatSpread = { hp: 183, atk: 182, def: 115, spa: 90, spd: 106, spe: 169 };

describe("getItemStatBoost", () => {
  it("returns null for no item", () => {
    expect(getItemStatBoost(null, "Rough Skin", SAMPLE_STATS)).toBeNull();
  });

  it("returns null for non-boosting items", () => {
    expect(getItemStatBoost("Leftovers", "Rough Skin", SAMPLE_STATS)).toBeNull();
    expect(getItemStatBoost("Focus Sash", "Rough Skin", SAMPLE_STATS)).toBeNull();
  });

  it("boosts Speed x1.5 for Choice Scarf", () => {
    const boost = getItemStatBoost("Choice Scarf", "Rough Skin", SAMPLE_STATS);
    expect(boost).not.toBeNull();
    expect(boost!.stat).toBe("spe");
    expect(boost!.multiplier).toBe(1.5);
    expect(boost!.boostedValue).toBe(Math.floor(169 * 1.5));
  });

  it("handles Choice Scarf case-insensitively", () => {
    const boost = getItemStatBoost("choice scarf", "Rough Skin", SAMPLE_STATS);
    expect(boost).not.toBeNull();
    expect(boost!.stat).toBe("spe");
  });

  it("boosts highest non-HP stat with Booster Energy + Protosynthesis", () => {
    const boost = getItemStatBoost("Booster Energy", "Protosynthesis", SAMPLE_STATS);
    expect(boost).not.toBeNull();
    // Highest non-HP stat is atk=182
    expect(boost!.stat).toBe("atk");
    expect(boost!.multiplier).toBe(1.3); // non-Speed gets 1.3x
    expect(boost!.boostedValue).toBe(Math.floor(182 * 1.3));
  });

  it("applies 1.5x when Speed is highest with Booster Energy", () => {
    const speedyStats: StatSpread = { hp: 150, atk: 100, def: 80, spa: 100, spd: 80, spe: 200 };
    const boost = getItemStatBoost("Booster Energy", "Quark Drive", speedyStats);
    expect(boost).not.toBeNull();
    expect(boost!.stat).toBe("spe");
    expect(boost!.multiplier).toBe(1.5);
  });

  it("returns null for Booster Energy without qualifying ability", () => {
    const boost = getItemStatBoost("Booster Energy", "Intimidate", SAMPLE_STATS);
    expect(boost).toBeNull();
  });
});
