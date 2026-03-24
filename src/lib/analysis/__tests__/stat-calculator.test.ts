import { describe, it, expect } from "vitest";
import { calculateStat, calculateAllStats } from "@/lib/analysis/stat-calculator";

describe("calculateStat", () => {
  describe("HP calculation", () => {
    it("returns 1 for Shedinja (base 1 HP)", () => {
      expect(calculateStat("hp", 1, 31, 0, 50, "Adamant")).toBe(1);
    });

    it("calculates standard HP at level 50 (Garchomp base 108, 31 IV, 0 EV)", () => {
      // floor(((2*108 + 31 + 0) * 50) / 100) + 50 + 10
      // floor((247 * 50) / 100) + 60 = floor(123.5) + 60 = 123 + 60 = 183
      expect(calculateStat("hp", 108, 31, 0, 50, "Jolly")).toBe(183);
    });

    it("calculates HP with 252 EVs (Garchomp base 108, 31 IV, 252 EV)", () => {
      // floor(((2*108 + 31 + floor(252/4)) * 50) / 100) + 50 + 10
      // floor(((216 + 31 + 63) * 50) / 100) + 60 = floor((310 * 50)/100) + 60 = 155 + 60 = 215
      expect(calculateStat("hp", 108, 31, 252, 50, "Jolly")).toBe(215);
    });

    it("calculates HP at level 100", () => {
      // floor(((2*108 + 31 + 0) * 100) / 100) + 100 + 10 = 247 + 110 = 357
      expect(calculateStat("hp", 108, 31, 0, 100, "Jolly")).toBe(357);
    });

    it("handles 0 IV, 0 EV edge case", () => {
      // floor(((2*108 + 0 + 0) * 50) / 100) + 50 + 10
      // floor((216 * 50) / 100) + 60 = 108 + 60 = 168
      expect(calculateStat("hp", 108, 0, 0, 50, "Jolly")).toBe(168);
    });
  });

  describe("nature modifiers", () => {
    it("applies +10% for boosted stat (Adamant Atk)", () => {
      // Adamant: +Atk -SpA
      // floor((floor(((2*130 + 31 + floor(252/4)) * 50) / 100) + 5) * 1.1)
      // floor((floor(((260 + 31 + 63) * 50) / 100) + 5) * 1.1)
      // floor((floor(17700/100) + 5) * 1.1) = floor((177 + 5) * 1.1) = floor(200.2) = 200
      const adamantAtk = calculateStat("atk", 130, 31, 252, 50, "Adamant");
      expect(adamantAtk).toBe(200);
    });

    it("does not boost Atk with Jolly nature", () => {
      // Jolly: +Spe -SpA, Atk is neutral (1.0x)
      // floor((floor(((2*130 + 31 + floor(252/4)) * 50) / 100) + 5) * 1.0)
      // floor((177 + 5) * 1.0) = 182
      const jollyAtk = calculateStat("atk", 130, 31, 252, 50, "Jolly");
      expect(jollyAtk).toBe(182);
    });

    it("applies -10% for penalized stat (Adamant SpA)", () => {
      // Adamant: +Atk -SpA
      // floor((floor(((2*80 + 31 + 0) * 50) / 100) + 5) * 0.9)
      // floor((floor((191 * 50) / 100) + 5) * 0.9) = floor((95 + 5) * 0.9) = floor(90) = 90
      const adamantSpa = calculateStat("spa", 80, 31, 0, 50, "Adamant");
      expect(adamantSpa).toBe(90);
    });

    it("applies 1.0x for neutral nature", () => {
      // Serious: neutral
      const seriousSpa = calculateStat("spa", 80, 31, 0, 50, "Serious");
      // floor((floor((191*50)/100) + 5) * 1.0) = floor(100) = 100
      expect(seriousSpa).toBe(100);
    });
  });

  describe("level 100 calculations", () => {
    it("calculates non-HP stat at level 100", () => {
      // floor((floor(((2*130 + 31 + 63) * 100) / 100) + 5) * 1.1)
      // floor((354 + 5) * 1.1) = floor(394.9) = 394
      expect(calculateStat("atk", 130, 31, 252, 100, "Adamant")).toBe(394);
    });
  });

  describe("edge cases", () => {
    it("handles 0 IV, 0 EV for non-HP stat", () => {
      // floor((floor(((2*130 + 0 + 0) * 50) / 100) + 5) * 1.0)
      // floor((floor(13000/100) + 5) * 1.0) = floor(130 + 5) = 135
      expect(calculateStat("atk", 130, 0, 0, 50, "Serious")).toBe(135);
    });

    it("handles maxed EVs on stat", () => {
      // 252 EV = 63 stat points from EVs
      const withEvs = calculateStat("atk", 130, 31, 252, 50, "Serious");
      const withoutEvs = calculateStat("atk", 130, 31, 0, 50, "Serious");
      // Difference should reflect the EV investment
      expect(withEvs).toBeGreaterThan(withoutEvs);
      expect(withEvs - withoutEvs).toBe(32); // floor((2*130+31+63)*50/100) - floor((2*130+31+0)*50/100) = 177-145 = 32
    });
  });
});

describe("calculateAllStats", () => {
  it("calculates all 6 stats for a Pokemon", () => {
    // Garchomp base stats: HP 108, Atk 130, Def 95, SpA 80, SpD 85, Spe 102
    const baseStats = { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 };
    const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    const evs = { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 };

    const stats = calculateAllStats(baseStats, ivs, evs, 50, "Jolly");

    expect(stats.hp).toBe(183);
    expect(stats.atk).toBe(182);
    expect(stats.spe).toBe(169); // Jolly +Spe
    expect(stats.spa).toBe(90);  // Jolly -SpA
    // All 6 stat keys should be present
    expect(Object.keys(stats)).toHaveLength(6);
  });
});
