import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { detectArchetypes } from "@/lib/analysis/detect-archetype";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { StatSpread } from "@/lib/types/pokemon";

function spread(partial: Partial<StatSpread> = {}): StatSpread {
  return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...partial };
}

function mon(opts: {
  species?: string;
  evs?: Partial<StatSpread>;
  moves?: string[];
  ability?: string;
  item?: string | null;
  baseSpe?: number;
}): AnalyzedPokemon {
  const stats = spread({ hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: opts.baseSpe ?? 100 });
  return {
    parsed: {
      species: opts.species ?? "Garchomp",
      nickname: null,
      gender: null,
      item: opts.item ?? null,
      ability: opts.ability ?? "Rough Skin",
      level: 50,
      teraType: null,
      shiny: false,
      evs: spread(opts.evs),
      ivs: spread({ hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }),
      nature: "Jolly",
      moves: opts.moves ?? ["Earthquake", "Dragon Claw", "Rock Slide", "Swords Dance"],
    },
    data: null,
    calculatedStats: stats,
    itemBoost: null,
  };
}

/** Six identical offensive mons, spread supplied per scale. */
function offensiveTeam(evs: Partial<StatSpread>): AnalyzedPokemon[] {
  return Array.from({ length: 6 }, (_, i) => mon({ species: `Mon${i}`, evs }));
}

describe("detectArchetypes — Champions SP scale", () => {
  it("detects Hyper Offense from an SP-scale spread (32 Atk / 32 Spe)", () => {
    // On the EV scale 32/32 is nothing; the thresholds (200 Atk / 200 Spe)
    // must be rescaled by 32/252 for Champions teams or every Champions team
    // falls through to Goodstuffs.
    const detected = detectArchetypes(offensiveTeam({ atk: 32, spe: 32 }));
    expect(detected).toContain("Hyper Offense");
  });

  it("detects Hyper Offense from the equivalent EV-scale spread", () => {
    const detected = detectArchetypes(offensiveTeam({ atk: 252, spe: 252 }));
    expect(detected).toContain("Hyper Offense");
  });

  it("does not fire Hyper Offense on an uninvested SP team", () => {
    const detected = detectArchetypes(offensiveTeam({ spe: 4 }));
    expect(detected).not.toContain("Hyper Offense");
  });

  it("detects Bulky Offense on the SP scale (16 HP / 16 Atk)", () => {
    // 100 * (32/252) = 12.7, so 16/16 clears the bulky-offense threshold.
    const team = Array.from({ length: 6 }, (_, i) =>
      mon({ species: `Mon${i}`, evs: { hp: 16, atk: 16 }, moves: ["Protect", "Body Press", "Wide Guard", "Detect"] }),
    );
    expect(detectArchetypes(team)).toContain("Bulky Offense");
  });

  it("a Pokémon with no EVs line does not drag a Champions team back to the EV scale", () => {
    // Regression: an all-zero spread carries no signal. If it disqualified the
    // SP scale, one blank paste would silently rescale the whole team.
    const team = [...offensiveTeam({ atk: 32, spe: 32 }).slice(0, 5), mon({ species: "Blank" })];
    expect(detectArchetypes(team)).toContain("Hyper Offense");
  });

  it("a spread over the 32 per-stat cap is scored on the EV scale", () => {
    // Regression (the bug this shares a root cause with): detect-archetype
    // used a total-only test, so 36 Atk / 30 Spe (total 66, but 36 > 32) was
    // scored as SP here while convertToChampionsSp converted it as EVs.
    // On the EV scale these values clear no threshold, so nothing fires.
    const detected = detectArchetypes(offensiveTeam({ atk: 36, spe: 30 }));
    expect(detected).not.toContain("Hyper Offense");
  });

  it("still detects EV-scale archetypes unchanged (Tailwind, Trick Room)", () => {
    const tr = Array.from({ length: 4 }, (_, i) =>
      mon({ species: `Slow${i}`, baseSpe: 30, evs: { hp: 252, atk: 252 }, moves: ["Trick Room", "Protect"] }),
    );
    const detected = detectArchetypes(tr);
    expect(detected).toContain("Trick Room");
  });
});

describe("SP-detection heuristic is not duplicated", () => {
  // Three divergent copies of "is this spread SP or EVs?" existed
  // (PokemonCard, detect-archetype, champions-legality) and they disagreed:
  // only two applied the per-stat ≤ 32 cap. They must all call the one
  // predicate that convertToChampionsSp itself uses.
  const sources = [
    "src/lib/analysis/detect-archetype.ts",
    "src/lib/validation/champions-legality.ts",
    "src/components/report/PokemonCard.tsx",
  ];

  for (const rel of sources) {
    it(`${rel} derives the SP scale from isChampionsSpSpread`, () => {
      const src = readFileSync(join(process.cwd(), rel), "utf8");
      expect(src).toContain("isChampionsSpSpread");
    });
  }
});
