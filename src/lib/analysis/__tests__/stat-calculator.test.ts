import { describe, it, expect } from "vitest";
import {
  calculateStat,
  calculateAllStats,
  calculateChampionsStat,
  convertToChampionsSp,
  looksLikeChampionsSp,
  CHAMPIONS_TOTAL_SP,
} from "@/lib/analysis/stat-calculator";
import type { StatSpread } from "@/lib/types/pokemon";
// VGC-251 end-to-end coverage: real pastes through the parser, not hand-built spreads.
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { CHAMPIONS_SAMPLE_TEAMS } from "@/data/champions-sample-teams";

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

describe("convertToChampionsSp", () => {
  it("returns all zeros for a fully uninvested spread (regression: was fabricating 32 HP / 32 Atk / 2 Def)", () => {
    expect(convertToChampionsSp(spread())).toEqual(spread());
  });

  it("does not pad uninvested stats when invested stats are already maxed", () => {
    // 252 HP only → 32 HP, nothing invented in Atk
    expect(convertToChampionsSp(spread({ hp: 252 }))).toEqual(spread({ hp: 32 }));
  });

  it("regression: 252 HP / 4 Def does not turn the 4-EV filler into a maxed 32 SP Def", () => {
    // Was 32 HP / 32 Def — the leftover budget was dumped into the only
    // stat with headroom, inventing investment the user never made.
    expect(convertToChampionsSp(spread({ hp: 252, def: 4 }))).toEqual(
      spread({ hp: 32, def: 1 }),
    );
  });

  it("regression: a 4-EV filler converts identically regardless of the rest of the spread", () => {
    // The old greedy top-up gave the filler 31 SP with one maxed stat and
    // 2 SP with two, so the same 4 EVs meant different things per spread.
    const oneMaxed = convertToChampionsSp(spread({ hp: 252, spd: 4 }));
    const twoMaxed = convertToChampionsSp(spread({ hp: 252, atk: 252, spd: 4 }));
    expect(oneMaxed.spd).toBe(1);
    expect(twoMaxed.spd).toBe(1);
  });

  it("passes through spreads already in SP form (total ≤ 66, per-stat ≤ 32)", () => {
    const sp = spread({ hp: 22, def: 11, spa: 24, spd: 4, spe: 5 });
    expect(convertToChampionsSp(sp)).toEqual(sp);
  });

  it("converts a standard 252/4/252 EV spread to exact SP values", () => {
    // 252 → 32, 4 → 1, leftover budget stays unspent (65/66).
    expect(convertToChampionsSp(spread({ atk: 252, spd: 4, spe: 252 }))).toEqual(
      spread({ atk: 32, spd: 1, spe: 32 }),
    );
  });

  it("scales partial investment proportionally (ceil of EV/8)", () => {
    expect(convertToChampionsSp(spread({ hp: 156, atk: 100, spe: 252 }))).toEqual(
      spread({ hp: 20, atk: 13, spe: 32 }),
    );
  });

  it("never exceeds the 66 SP budget or 32 per stat", () => {
    for (const evs of [
      spread({ hp: 252, atk: 252, def: 252, spe: 252 }),
      spread({ hp: 252, atk: 252, spd: 4 }),
      spread({ hp: 156, atk: 100, spe: 252 }),
      spread({ hp: 252, def: 4 }),
      spread(),
    ]) {
      const sp = convertToChampionsSp(evs);
      const total = Object.values(sp).reduce((a, b) => a + b, 0);
      expect(total).toBeLessThanOrEqual(CHAMPIONS_TOTAL_SP);
      for (const v of Object.values(sp)) expect(v).toBeLessThanOrEqual(32);
    }
  });
});

describe("looksLikeChampionsSp", () => {
  it("reads a 66-total spread with per-stat ≤ 32 as SP", () => {
    expect(looksLikeChampionsSp(spread({ hp: 22, def: 11, spa: 24, spd: 4, spe: 5 }))).toBe(true);
  });

  it("reads an all-zero spread as SP (0/66 allocated, not an EV spread)", () => {
    expect(looksLikeChampionsSp(spread())).toBe(true);
  });

  it("rejects traditional EV spreads", () => {
    expect(looksLikeChampionsSp(spread({ hp: 252, def: 4, spd: 252 }))).toBe(false);
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

// ── VGC-251: "Champions Paste Not Working" ──────────────────────────────────
// Reported symptom (Poke Peak, 01 Aug 2026): "The SP allocations are not
// showing up right for champions, everyone is getting 32hp 32atk".
//
// b5712a6 fixed only the all-zero spread. The greedy leftover top-up survived,
// and it handed the entire unspent budget to whichever invested stat still had
// headroom — so the extremely common two-stat spread "4 HP / 252 Atk" rendered
// as a maxed 32 HP / 32 Atk on every Pokemon carrying it. These assertions are
// exact values on purpose: the bounds-style assertions shipped with b5712a6
// passed against the buggy output.
describe("convertToChampionsSp — VGC-251 regressions", () => {
  it("does not turn '4 HP / 252 Atk' into the reported 32 HP / 32 Atk", () => {
    expect(convertToChampionsSp(spread({ hp: 4, atk: 252 }))).toEqual(
      spread({ hp: 1, atk: 32 }),
    );
  });

  it("does not fabricate 32 SP for any single-filler two-stat spread", () => {
    expect(convertToChampionsSp(spread({ hp: 4, spa: 252 }))).toEqual(
      spread({ hp: 1, spa: 32 }),
    );
    expect(convertToChampionsSp(spread({ atk: 252, spe: 4 }))).toEqual(
      spread({ atk: 32, spe: 1 }),
    );
    expect(convertToChampionsSp(spread({ hp: 252, spd: 4 }))).toEqual(
      spread({ hp: 32, spd: 1 }),
    );
  });

  it("converts the classic 252 HP / 252 Atk / 4 Def bulky attacker exactly", () => {
    // 32 + 32 + 1 = 65/66. The old code topped Def up to 2 to hit 66 exactly,
    // inventing a stat point the user never allocated.
    expect(convertToChampionsSp(spread({ hp: 252, atk: 252, def: 4 }))).toEqual(
      spread({ hp: 32, atk: 32, def: 1 }),
    );
  });

  it("converts 244/12-style tuned spreads proportionally", () => {
    expect(convertToChampionsSp(spread({ hp: 244, def: 12 }))).toEqual(
      spread({ hp: 31, def: 2 }),
    );
    expect(convertToChampionsSp(spread({ hp: 252, def: 156, spd: 100 }))).toEqual(
      spread({ hp: 32, def: 20, spd: 13 }),
    );
  });

  it("converts a real five-stat competitive spread to exactly 66/66", () => {
    // Incineroar 252 HP / 4 Atk / 76 Def / 108 SpD / 68 Spe.
    const sp = convertToChampionsSp(
      spread({ hp: 252, atk: 4, def: 76, spd: 108, spe: 68 }),
    );
    expect(sp).toEqual(spread({ hp: 32, atk: 1, def: 10, spd: 14, spe: 9 }));
    expect(Object.values(sp).reduce((a, b) => a + b, 0)).toBe(CHAMPIONS_TOTAL_SP);
  });

  it("leaves budget unspent when the EV spread itself is partial", () => {
    // 256 of 508 EVs invested → 33 of 66 SP. Spending all 66 would invent
    // investment; the under-budget state belongs to the badge/validator.
    const sp = convertToChampionsSp(spread({ hp: 4, atk: 252 }));
    expect(Object.values(sp).reduce((a, b) => a + b, 0)).toBe(33);
  });

  it("passes Champions-native SP pastes through the fast path untouched", () => {
    for (const sp of [
      spread({ hp: 22, def: 11, spa: 24, spd: 4, spe: 5 }), // 66 exactly
      spread({ hp: 32, atk: 32, spe: 2 }),                  // maxed, 66 exactly
      spread({ hp: 12, atk: 32, def: 6, spe: 16 }),         // 66 exactly
      spread({ hp: 20, def: 10, spa: 20 }),                 // under budget
      spread({ atk: 32 }),                                  // single maxed stat
    ]) {
      expect(convertToChampionsSp(sp)).toEqual(sp);
    }
  });

  it("keeps the b5712a6 fix: an uninvested spread stays all zeros", () => {
    expect(convertToChampionsSp(spread())).toEqual(spread());
  });

  it("holds the budget invariants across every spread shape", () => {
    for (const evs of [
      spread(),
      spread({ hp: 4, atk: 252 }),
      spread({ hp: 252, def: 4 }),
      spread({ hp: 244, def: 12 }),
      spread({ hp: 252, atk: 252, def: 4 }),
      spread({ atk: 252, spd: 4, spe: 252 }),
      spread({ hp: 252, atk: 4, def: 76, spd: 108, spe: 68 }),
      spread({ hp: 252, atk: 252, def: 252, spa: 252, spd: 252, spe: 252 }),
    ]) {
      const sp = convertToChampionsSp(evs);
      const total = Object.values(sp).reduce((a, b) => a + b, 0);
      expect(total).toBeLessThanOrEqual(CHAMPIONS_TOTAL_SP);
      for (const v of Object.values(sp)) {
        expect(v).toBeLessThanOrEqual(32);
        expect(v).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("never invents investment in a stat the paste left at 0 EVs", () => {
    const evs = spread({ hp: 4, atk: 252 });
    const sp = convertToChampionsSp(evs);
    for (const stat of ["hp", "atk", "def", "spa", "spd", "spe"] as const) {
      if (evs[stat] === 0) expect(sp[stat]).toBe(0);
    }
  });
});

describe("convertToChampionsSp — VGC-251 end-to-end from pastes", () => {
  it("no Pokemon in the shipped Champions sample teams renders as 32 HP / 32 Atk", () => {
    for (const team of CHAMPIONS_SAMPLE_TEAMS) {
      for (const p of parseShowdownPaste(team.paste).pokemon) {
        const sp = convertToChampionsSp(p.evs);
        expect(
          sp.hp === 32 && sp.atk === 32,
          `${team.name} / ${p.species} rendered as 32 HP / 32 Atk`,
        ).toBe(false);
        expect(Object.values(sp).reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(
          CHAMPIONS_TOTAL_SP,
        );
      }
    }
  });

  it("a two-stat Champions paste keeps its 4-EV filler at 1 SP", () => {
    const paste = `Incineroar @ Assault Vest
Ability: Intimidate
EVs: 4 HP / 252 Atk
Adamant Nature
- Fake Out
- Knock Off`;
    const [mon] = parseShowdownPaste(paste).pokemon;
    expect(convertToChampionsSp(mon.evs)).toEqual(spread({ hp: 1, atk: 32 }));
  });

  it("a paste with no EVs line renders 0 SP, not a fabricated spread", () => {
    const paste = `Groudon-Primal @ Red Orb
Ability: Desolate Land
Adamant Nature
- Precipice Blades
- Protect`;
    const [mon] = parseShowdownPaste(paste).pokemon;
    expect(mon.evs).toEqual(spread());
    expect(convertToChampionsSp(mon.evs)).toEqual(spread());
  });

  it("a Champions-native SP paste survives the parser and the conversion intact", () => {
    const paste = `Kangaskhan-Mega @ Kangaskhanite
Ability: Parental Bond
EVs: 12 HP / 32 Atk / 6 Def / 16 Spe
Jolly Nature
- Fake Out
- Return`;
    const [mon] = parseShowdownPaste(paste).pokemon;
    expect(convertToChampionsSp(mon.evs)).toEqual(
      spread({ hp: 12, atk: 32, def: 6, spe: 16 }),
    );
  });
});
