import { describe, it, expect } from "vitest";
import { detectArchetypes } from "@/lib/analysis/detect-archetype";
import {
  CHAMPIONS_TOTAL_SP,
  CHAMPIONS_MAX_SP_PER_STAT,
  MAX_EV_PER_STAT,
} from "@/lib/analysis/stat-calculator";
import { ARCHETYPES } from "@/lib/data/tags";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { PokemonData, StatSpread } from "@/lib/types/pokemon";

function spread(partial: Partial<StatSpread> = {}): StatSpread {
  return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...partial };
}

/**
 * A neutral species: it matches none of the weather/Primal/Mega species
 * substrings, so a fixture only trips the rule it is actually testing.
 */
const NEUTRAL = "Tatsugiri";

interface MonOpts {
  species?: string;
  ability?: string | null;
  item?: string | null;
  moves?: string[];
  /** EVs for a classic team, Stat Points for a Champions team — same field. */
  evs?: Partial<StatSpread>;
  /** Base Speed drives the Trick Room check, not the calculated stat. */
  baseSpe?: number;
}

function mon(opts: MonOpts = {}): AnalyzedPokemon {
  const species = opts.species ?? NEUTRAL;
  const baseSpe = opts.baseSpe ?? 100;
  const data: PokemonData = {
    name: species,
    types: ["Normal"],
    baseStats: spread({ hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: baseSpe }),
    abilities: opts.ability ? [opts.ability] : [],
  };
  return {
    parsed: {
      species,
      nickname: null,
      gender: null,
      item: opts.item ?? null,
      ability: opts.ability ?? null,
      // VGC is always level 50 — pasted Level lines are ignored upstream.
      level: 50,
      teraType: null,
      shiny: false,
      evs: spread(opts.evs),
      ivs: spread({ hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }),
      nature: "Serious",
      moves: opts.moves ?? [],
    },
    data,
    calculatedStats: spread({ spe: baseSpe }),
    itemBoost: null,
  };
}

/** `count` copies of the same fixture. */
function team(count: number, opts: MonOpts = {}): AnalyzedPokemon[] {
  return Array.from({ length: count }, () => mon(opts));
}

// 200 and 100 are the EV-scale investment thresholds inside the detector;
// on the SP scale they are multiplied by CHAMPIONS_MAX_SP_PER_STAT / 252.
const SP_SCALE = CHAMPIONS_MAX_SP_PER_STAT / MAX_EV_PER_STAT;
const SP_OFFENSIVE_THRESHOLD = 200 * SP_SCALE; // ≈ 25.4 → 26 SP invests
const SP_BULKY_THRESHOLD = 100 * SP_SCALE; // ≈ 12.7 → 13 SP invests

describe("detectArchetypes", () => {
  it("only ever returns tags that exist in ARCHETYPES", () => {
    const samples = [
      detectArchetypes(team(6)),
      detectArchetypes(team(6, { evs: { atk: 32, spe: 32 } })),
      detectArchetypes(team(6, { evs: { atk: 252, spe: 252, hp: 4 } })),
      detectArchetypes(team(6, { species: "Kyogre-Primal", moves: ["Trick Room"], baseSpe: 30 })),
      detectArchetypes(team(6, { moves: ["Tailwind", "Fake Out"], evs: { atk: 32 } })),
    ];
    for (const tags of samples) {
      expect(tags.length).toBeGreaterThan(0);
      for (const tag of tags) {
        expect(ARCHETYPES as readonly string[]).toContain(tag);
      }
    }
  });

  describe("Champions SP scale vs classic EV scale", () => {
    it("reads a maxed Champions SP offensive team as Hyper Offense, not Goodstuffs", () => {
      // 32 Atk / 32 Spe = 64 SP: a legal, maximally offensive Champions spread
      // (66 total budget, 32 per stat). Before the SP scaling landed, the
      // EV-scale 200 threshold could never be met and every Champions team
      // fell through to "Goodstuffs".
      const tags = detectArchetypes(team(6, { evs: { atk: 32, spe: 32 } }));

      expect(tags).toContain("Hyper Offense");
      expect(tags).not.toContain("Goodstuffs");
    });

    it("treats the same 32/32 spread as near-zero investment once the team is on the EV scale", () => {
      // One classic 252/252/4 member puts a team member over the SP budget, so
      // the whole team is scored on the EV scale — where 32 EVs is nothing.
      const tags = detectArchetypes([
        ...team(5, { evs: { atk: 32, spe: 32 } }),
        mon({ evs: { atk: 252, spe: 252, hp: 4 } }),
      ]);

      expect(tags).not.toContain("Hyper Offense");
      expect(tags).toEqual(["Goodstuffs"]);
    });

    it("switches scales exactly at the SP budget: 66 total is SP, 67 is EV", () => {
      const atSp = detectArchetypes(team(6, { evs: { atk: 32, spe: 32, hp: 2 } }));
      const overSp = detectArchetypes(team(6, { evs: { atk: 32, spe: 32, hp: 3 } }));

      expect(32 + 32 + 2).toBe(CHAMPIONS_TOTAL_SP);
      expect(atSp).toContain("Hyper Offense");
      expect(overSp).not.toContain("Hyper Offense");
    });

    it("scales the Hyper Offense threshold to ~26 SP (the EV-scale 200)", () => {
      expect(SP_OFFENSIVE_THRESHOLD).toBeGreaterThan(25);
      expect(SP_OFFENSIVE_THRESHOLD).toBeLessThan(26);

      const invests = detectArchetypes(team(6, { evs: { atk: 26, spe: 26 } }));
      const doesNot = detectArchetypes(team(6, { evs: { atk: 25, spe: 25 } }));

      expect(invests).toContain("Hyper Offense");
      expect(doesNot).not.toContain("Hyper Offense");
      expect(doesNot).toEqual(["Goodstuffs"]);
    });

    it("scales the Bulky Offense threshold to ~13 SP (the EV-scale 100)", () => {
      expect(SP_BULKY_THRESHOLD).toBeGreaterThan(12);
      expect(SP_BULKY_THRESHOLD).toBeLessThan(13);

      // Three bulky-offensive members is the trigger; the rest are blank.
      const invests = detectArchetypes([
        ...team(3, { evs: { hp: 13, atk: 13 } }),
        ...team(3),
      ]);
      const doesNot = detectArchetypes([
        ...team(3, { evs: { hp: 12, atk: 12 } }),
        ...team(3),
      ]);

      expect(invests).toEqual(["Bulky Offense"]);
      expect(doesNot).toEqual(["Goodstuffs"]);
    });

    it("still detects Hyper Offense on a classic EV team", () => {
      const tags = detectArchetypes(team(6, { evs: { atk: 252, spe: 252, hp: 4 } }));

      expect(tags).toContain("Hyper Offense");
    });

    it("detects Bulky Offense on a classic EV team without calling it Hyper Offense", () => {
      // 252 HP / 252 Atk clears the EV-scale 100/100 bulky bar but invests
      // nothing in Speed, so the Hyper Offense Speed requirement fails.
      const tags = detectArchetypes(team(6, { evs: { hp: 252, atk: 252, def: 4 } }));

      expect(tags).toEqual(["Bulky Offense"]);
    });

    it("an all-zero spread (a paste with no EVs line) fires no investment archetype", () => {
      // Zero-EV teams satisfy the `<= 66 total` SP test, so they take the SP
      // branch — which must stay harmless rather than inventing an archetype.
      const tags = detectArchetypes(team(6));

      expect(tags).toEqual(["Goodstuffs"]);
    });

    it("withholds Hyper Offense from an offensive team that leans on Protect", () => {
      const tags = detectArchetypes([
        ...team(3, { evs: { atk: 252, spe: 252, hp: 4 }, moves: ["Protect"] }),
        ...team(3, { evs: { atk: 252, spe: 252, hp: 4 } }),
      ]);

      expect(tags).not.toContain("Hyper Offense");
    });
  });

  describe("weather", () => {
    it("detects Rain from the Drizzle ability alone", () => {
      const tags = detectArchetypes([mon({ ability: "Drizzle" }), ...team(5)]);
      expect(tags).toContain("Rain");
    });

    it("detects Rain from a Kyogre on the team", () => {
      const tags = detectArchetypes([mon({ species: "Kyogre" }), ...team(5)]);
      expect(tags).toContain("Rain");
    });

    it("detects Sun from Orichalcum Pulse", () => {
      const tags = detectArchetypes([mon({ ability: "Orichalcum Pulse" }), ...team(5)]);
      expect(tags).toContain("Sun");
    });

    it("detects Sand from Sand Stream", () => {
      const tags = detectArchetypes([mon({ ability: "Sand Stream" }), ...team(5)]);
      expect(tags).toContain("Sand");
    });

    it("detects Snow from Alolan Ninetales", () => {
      const tags = detectArchetypes([mon({ species: "Ninetales-Alola" }), ...team(5)]);
      expect(tags).toContain("Snow");
    });

    it("tags Primal Kyogre as both Primal Weather and Rain", () => {
      const tags = detectArchetypes([mon({ species: "Kyogre-Primal" }), ...team(5)]);
      expect(tags).toContain("Primal Weather");
      expect(tags).toContain("Rain");
    });

    it("does not call a rain-less team Rain", () => {
      const tags = detectArchetypes([mon({ ability: "Intimidate" }), ...team(5)]);
      expect(tags).not.toContain("Rain");
    });
  });

  describe("Mega Offense", () => {
    it("detects an already-Mega import", () => {
      const tags = detectArchetypes([mon({ species: "Garchomp-Mega" }), ...team(5)]);
      expect(tags).toContain("Mega Offense");
    });

    it("detects a held Mega Stone on its matching base form", () => {
      const tags = detectArchetypes([
        mon({ species: "Garchomp", item: "Garchompite" }),
        ...team(5),
      ]);
      expect(tags).toContain("Mega Offense");
    });

    it("does not tag an Eviolite holder as Mega Offense", () => {
      // Regression: the old "-ite" suffix match tagged every Eviolite (and
      // Leftovers-era item) holder as Mega Offense.
      const tags = detectArchetypes([
        mon({ species: "Porygon2", item: "Eviolite" }),
        ...team(5),
      ]);
      expect(tags).not.toContain("Mega Offense");
    });
  });

  describe("Trick Room", () => {
    it("tags full Trick Room when three or more members are base 50 Speed or slower", () => {
      const tags = detectArchetypes([
        ...team(3, { baseSpe: 30, moves: ["Trick Room"] }),
        ...team(3, { baseSpe: 120 }),
      ]);
      expect(tags).toEqual(["Trick Room"]);
    });

    it("tags Semi-TR when only one member is slow", () => {
      const tags = detectArchetypes([
        mon({ baseSpe: 30, moves: ["Trick Room"] }),
        ...team(5, { baseSpe: 120 }),
      ]);
      expect(tags).toContain("Semi-TR");
      expect(tags).not.toContain("Trick Room");
    });

    it("ignores slow members when nobody carries Trick Room", () => {
      const tags = detectArchetypes(team(6, { baseSpe: 30 }));
      expect(tags).not.toContain("Trick Room");
      expect(tags).not.toContain("Semi-TR");
    });

    it("treats base 50 Speed as slow and base 51 as fast", () => {
      const slow = detectArchetypes([
        ...team(3, { baseSpe: 50, moves: ["Trick Room"] }),
        ...team(3, { baseSpe: 120 }),
      ]);
      const fast = detectArchetypes([
        ...team(3, { baseSpe: 51, moves: ["Trick Room"] }),
        ...team(3, { baseSpe: 120 }),
      ]);
      expect(slow).toContain("Trick Room");
      expect(fast).not.toContain("Trick Room");
    });
  });

  describe("Tailwind and Balance", () => {
    it("tags Tailwind from the move", () => {
      const tags = detectArchetypes([mon({ moves: ["Tailwind"] }), ...team(5)]);
      expect(tags).toContain("Tailwind");
    });

    it("adds Balance to a Tailwind team that pairs support with SP-scale offense", () => {
      const tags = detectArchetypes([
        mon({ moves: ["Tailwind"] }),
        mon({ moves: ["Fake Out"] }),
        mon({ evs: { atk: CHAMPIONS_MAX_SP_PER_STAT } }),
        ...team(3),
      ]);

      expect(tags).toContain("Tailwind");
      expect(tags).toContain("Balance");
    });

    it("withholds Balance from a support team with no real offensive investment", () => {
      const tags = detectArchetypes([
        mon({ moves: ["Tailwind"] }),
        mon({ moves: ["Fake Out"] }),
        ...team(4),
      ]);

      expect(tags).toEqual(["Tailwind"]);
    });

    it("does not add Balance once a weather archetype has been found", () => {
      const tags = detectArchetypes([
        mon({ ability: "Drizzle", moves: ["Fake Out"] }),
        mon({ evs: { atk: CHAMPIONS_MAX_SP_PER_STAT } }),
        ...team(4),
      ]);

      expect(tags).toContain("Rain");
      expect(tags).not.toContain("Balance");
    });
  });

  describe("Goodstuffs fallback", () => {
    it("falls back to Goodstuffs when nothing else is detected", () => {
      expect(detectArchetypes(team(6))).toEqual(["Goodstuffs"]);
    });

    it("does not add Goodstuffs alongside a real archetype", () => {
      const tags = detectArchetypes([mon({ species: "Kyogre" }), ...team(5)]);
      expect(tags).not.toContain("Goodstuffs");
    });
  });
});
