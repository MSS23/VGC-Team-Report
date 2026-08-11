import { describe, it, expect } from "vitest";
import {
  calculateStat,
  calculateAllStats,
  calculateChampionsStat,
  convertToChampionsSp,
  evToChampionsSp,
  championsSpToEv,
  CHAMPIONS_TOTAL_SP,
  CHAMPIONS_MAX_SP_PER_STAT,
  MAX_EV_PER_STAT,
} from "@/lib/analysis/stat-calculator";
import type { StatSpread } from "@/lib/types/pokemon";

function spread(partial: Partial<StatSpread> = {}): StatSpread {
  return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...partial };
}

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

const STAT_KEYS: (keyof StatSpread)[] = ["hp", "atk", "def", "spa", "spd", "spe"];

function totalOf(sp: StatSpread): number {
  return STAT_KEYS.reduce((sum, k) => sum + sp[k], 0);
}

describe("convertToChampionsSp", () => {
  it("returns all zeros for a zero-EV spread (regression: was fabricating 32 HP / 32 Atk / 2 Def)", () => {
    expect(convertToChampionsSp(spread())).toEqual(spread());
  });

  it("does not pad uninvested stats when invested stats are already maxed", () => {
    // 252 HP only → 32 HP, nothing invented in Atk
    expect(convertToChampionsSp(spread({ hp: 252 }))).toEqual(spread({ hp: 32 }));
  });

  it("passes through spreads already in SP form (total ≤ 66, per-stat ≤ 32)", () => {
    const sp = spread({ hp: 22, def: 11, spa: 24, spd: 4, spe: 5 });
    expect(convertToChampionsSp(sp)).toEqual(sp);
  });

  it("converts a standard 252/4/252 EV spread within budget", () => {
    // 32 + 1 + 32 = 65 SP, one point short of the 66 budget — exactly what the
    // documented curve says. The 4-EV chip is worth 1 SP, not 2 and not 32.
    expect(convertToChampionsSp(spread({ atk: 252, spd: 4, spe: 252 }))).toEqual(
      spread({ atk: 32, spd: 1, spe: 32 })
    );
    expect(totalOf(convertToChampionsSp(spread({ atk: 252, spd: 4, spe: 252 })))).toBe(65);
  });

  describe("regression: convertToChampionsSp inflated minimum-investment stats to 32 SP", () => {
    it("keeps a 4-EV filler chip at 1 SP instead of padding it to 32 (252 HP / 4 Def)", () => {
      // Shipped behaviour before the fix: { hp: 32, def: 32 } — a 4-EV chip was
      // inflated into a fully-maxed defensive investment the player never bought.
      expect(convertToChampionsSp(spread({ hp: 252, def: 4 }))).toEqual(
        spread({ hp: 32, def: 1 })
      );
    });

    it("leaves budget unspent rather than inventing investment (100 HP / 156 Spe)", () => {
      // Shipped behaviour before the fix: { hp: 32, spe: 32 } — a deliberately
      // non-maxed spread collapsed to max/max.
      expect(convertToChampionsSp(spread({ hp: 100, spe: 156 }))).toEqual(
        spread({ hp: 13, spe: 20 })
      );
    });

    it("never returns more SP for a stat than that stat's own EV conversion", () => {
      const cases: Partial<StatSpread>[] = [
        { hp: 252, def: 4 },
        { hp: 252, atk: 252, def: 252 },
        { hp: 100, spe: 156 },
        { atk: 252, spd: 4, spe: 252 },
        { hp: 4, atk: 252, def: 252, spa: 252 },
        { hp: 252, atk: 252, def: 252, spa: 252, spd: 252, spe: 252 },
      ];
      for (const partial of cases) {
        const evs = spread(partial);
        const sp = convertToChampionsSp(evs);
        for (const k of STAT_KEYS) {
          expect(sp[k]).toBeLessThanOrEqual(evToChampionsSp(evs[k]));
        }
      }
    });
  });

  describe("regression: over-budget trim was biased by stat array order and gutted HP", () => {
    it("trims 252/252/252 proportionally instead of zeroing HP", () => {
      // Shipped behaviour before the fix: { hp: 2, atk: 32, def: 32 } — HP was
      // sacrificed first purely because "hp" is index 0 of the stat array.
      expect(convertToChampionsSp(spread({ hp: 252, atk: 252, def: 252 }))).toEqual(
        spread({ hp: 22, atk: 22, def: 22 })
      );
    });

    it("trims 252/252/252/252 proportionally instead of zeroing HP", () => {
      // Shipped behaviour before the fix: { hp: 0, atk: 2, def: 32, spe: 32 }.
      // 66/128 of 32 SP is 16.5 per stat; the four-way remainder tie cannot be
      // split without favouring a stat, so 2 SP stay unspent.
      expect(
        convertToChampionsSp(spread({ hp: 252, atk: 252, def: 252, spe: 252 }))
      ).toEqual(spread({ hp: 16, atk: 16, def: 16, spe: 16 }));
    });

    it("awards the rounding remainder by size, not by position (252 HP / 156 Atk / 252 Spe)", () => {
      // 32 / 20 / 32 = 84 SP scaled by 66/84 → 25.14 / 15.71 / 25.14.
      // Atk has the largest fractional remainder, so it takes the spare point.
      expect(convertToChampionsSp(spread({ hp: 252, atk: 156, spe: 252 }))).toEqual(
        spread({ hp: 25, atk: 16, spe: 25 })
      );
    });

    it("is independent of which stat slot the investment occupies", () => {
      // Same EV values, relabelled onto the back three stats: the SP result must
      // be the same values on the same relabelled stats.
      expect(convertToChampionsSp(spread({ spa: 252, spd: 252, spe: 252 }))).toEqual(
        spread({ spa: 22, spd: 22, spe: 22 })
      );

      // Asymmetric case mirrored across the spread.
      const front = convertToChampionsSp(spread({ hp: 252, atk: 156, def: 60 }));
      const back = convertToChampionsSp(spread({ spa: 252, spd: 156, spe: 60 }));
      expect([front.hp, front.atk, front.def]).toEqual([back.spa, back.spd, back.spe]);
      expect([front.spa, front.spd, front.spe]).toEqual([0, 0, 0]);
      expect([back.hp, back.atk, back.def]).toEqual([0, 0, 0]);
    });

    it("is independent of the key insertion order of the input object", () => {
      const ascending: StatSpread = { hp: 252, atk: 252, def: 252, spa: 0, spd: 0, spe: 0 };
      const descending: StatSpread = { spe: 0, spd: 0, spa: 0, def: 252, atk: 252, hp: 252 };
      expect(convertToChampionsSp(ascending)).toEqual(convertToChampionsSp(descending));
    });
  });

  it("leaves a spread that converts to exactly 66 SP untouched", () => {
    // 252 / 252 / 12 EVs → 32 + 32 + 2 = 66 SP exactly: no trim, nothing padded.
    const sp = convertToChampionsSp(spread({ hp: 252, atk: 252, def: 12 }));
    expect(sp).toEqual(spread({ hp: 32, atk: 32, def: 2 }));
    expect(totalOf(sp)).toBe(CHAMPIONS_TOTAL_SP);
  });

  it("trims a spread that converts to just over 66 SP back onto budget", () => {
    // 252 / 244 / 28 EVs → 32 + 31 + 4 = 67 SP, one over. Scaling by 66/67 costs
    // HP and Atk a point each and hands one back to Def (largest remainder).
    const sp = convertToChampionsSp(spread({ hp: 252, atk: 244, def: 28 }));
    expect(sp).toEqual(spread({ hp: 31, atk: 31, def: 4 }));
    expect(totalOf(sp)).toBe(CHAMPIONS_TOTAL_SP);
  });

  it("caps a single stat at 32 SP however many EVs it is given", () => {
    expect(convertToChampionsSp(spread({ spe: 508 }))).toEqual(spread({ spe: 32 }));
    expect(convertToChampionsSp(spread({ hp: 252, spe: 252 }))).toEqual(
      spread({ hp: 32, spe: 32 })
    );
  });

  it("never exceeds the 66 SP budget or 32 per stat", () => {
    const sp = convertToChampionsSp(spread({ hp: 252, atk: 252, def: 252, spe: 252 }));
    expect(sp).toEqual(spread({ hp: 16, atk: 16, def: 16, spe: 16 }));
    expect(totalOf(sp)).toBe(64);
    expect(totalOf(sp)).toBeLessThanOrEqual(CHAMPIONS_TOTAL_SP);
    for (const v of Object.values(sp)) expect(v).toBeLessThanOrEqual(CHAMPIONS_MAX_SP_PER_STAT);
  });

  it("holds the budget, per-stat cap and no-inflation invariants across the EV space", () => {
    // Deterministic sweep rather than random sampling, so a failure is reproducible.
    const steps = [0, 4, 12, 28, 60, 100, 156, 244, 252];
    for (const a of steps) {
      for (const b of steps) {
        for (const c of steps) {
          const evs = spread({ hp: a, atk: b, spe: c });
          const sp = convertToChampionsSp(evs);
          const total = totalOf(sp);
          const inputTotal = totalOf(evs);
          // Spreads that are already in SP form take the passthrough path.
          const isSpForm =
            inputTotal > 0 &&
            inputTotal <= CHAMPIONS_TOTAL_SP &&
            STAT_KEYS.every((k) => evs[k] <= CHAMPIONS_MAX_SP_PER_STAT);
          expect(total).toBeLessThanOrEqual(CHAMPIONS_TOTAL_SP);
          for (const k of STAT_KEYS) {
            expect(sp[k]).toBeGreaterThanOrEqual(0);
            expect(sp[k]).toBeLessThanOrEqual(CHAMPIONS_MAX_SP_PER_STAT);
            if (evs[k] === 0) expect(sp[k]).toBe(0);
            if (!isSpForm) expect(sp[k]).toBeLessThanOrEqual(evToChampionsSp(evs[k]));
          }
        }
      }
    }
  });
});

describe("evToChampionsSp", () => {
  it("charges nothing for an uninvested stat", () => {
    expect(evToChampionsSp(0)).toBe(0);
  });

  it("charges 1 SP for the standard 4-EV chip", () => {
    expect(evToChampionsSp(4)).toBe(1);
  });

  it("the first SP costs 4 EVs and every SP after it costs 8", () => {
    // This is the exact community sticking point the converter page explains.
    expect(evToChampionsSp(4)).toBe(1);
    expect(evToChampionsSp(12)).toBe(2);
    expect(evToChampionsSp(20)).toBe(3);
    expect(evToChampionsSp(28)).toBe(4);
    for (let sp = 2; sp <= 31; sp++) {
      expect(evToChampionsSp(8 * sp - 4)).toBe(sp);
    }
  });

  it("caps at 32 SP from 248 EVs upward", () => {
    expect(evToChampionsSp(244)).toBe(31);
    expect(evToChampionsSp(248)).toBe(CHAMPIONS_MAX_SP_PER_STAT);
    expect(evToChampionsSp(MAX_EV_PER_STAT)).toBe(CHAMPIONS_MAX_SP_PER_STAT);
  });

  it("never returns more than the per-stat cap", () => {
    for (let ev = 0; ev <= 508; ev += 4) {
      expect(evToChampionsSp(ev)).toBeLessThanOrEqual(CHAMPIONS_MAX_SP_PER_STAT);
    }
  });

  it("is monotonic — more EVs never buy fewer SP", () => {
    for (let ev = 1; ev <= MAX_EV_PER_STAT; ev++) {
      expect(evToChampionsSp(ev)).toBeGreaterThanOrEqual(evToChampionsSp(ev - 1));
    }
  });
});

describe("championsSpToEv", () => {
  it("returns 0 EVs for 0 SP", () => {
    expect(championsSpToEv(0)).toBe(0);
  });

  it("round-trips through evToChampionsSp for every legal SP value", () => {
    for (let sp = 1; sp <= CHAMPIONS_MAX_SP_PER_STAT; sp++) {
      expect(evToChampionsSp(championsSpToEv(sp))).toBe(sp);
    }
  });

  it("returns the minimum EV investment for each SP value", () => {
    expect(championsSpToEv(1)).toBe(4);
    expect(championsSpToEv(2)).toBe(12);
    expect(championsSpToEv(3)).toBe(20);
    expect(championsSpToEv(31)).toBe(244);
    expect(championsSpToEv(CHAMPIONS_MAX_SP_PER_STAT)).toBe(248);
  });

  it("clamps SP above the per-stat cap to the 32 SP EV cost", () => {
    expect(championsSpToEv(99)).toBe(championsSpToEv(CHAMPIONS_MAX_SP_PER_STAT));
  });

  it("a full 252/252/4 EV team spread fits inside the 66 SP budget", () => {
    const total = evToChampionsSp(252) + evToChampionsSp(252) + evToChampionsSp(4);
    expect(total).toBe(65);
    expect(total).toBeLessThanOrEqual(CHAMPIONS_TOTAL_SP);
  });
});

describe("calculateChampionsStat", () => {
  it("calculates HP: floor((2*base+31)*50/100) + 60 + SP", () => {
    // Garchomp base 108 HP, 32 SP: floor(247*50/100) + 60 + 32 = 123 + 92 = 215
    expect(calculateChampionsStat("hp", 108, 32, "Jolly")).toBe(215);
  });

  it("calculates a nature-boosted stat", () => {
    // Garchomp base 130 Atk, 32 SP, Adamant: floor((floor(291*50/100) + 5 + 32) * 1.1)
    // = floor((145 + 37) * 1.1) = floor(200.2) = 200
    expect(calculateChampionsStat("atk", 130, 32, "Adamant")).toBe(200);
  });

  it("uninvested stat gets no SP bonus", () => {
    // base 130 Atk, 0 SP, neutral: 145 + 5 = 150
    expect(calculateChampionsStat("atk", 130, 0, "Serious")).toBe(150);
  });
});
