import { describe, it, expect } from "vitest";
import { detectArchetypes } from "@/lib/analysis/detect-archetype";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { StatForm, StatSpread } from "@/lib/types/pokemon";

function spread(partial: Partial<StatSpread> = {}): StatSpread {
  return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...partial };
}

/**
 * Minimal AnalyzedPokemon fixture.
 *
 * `baseSpe: null` models an unrecognised or misspelled species — no dex entry,
 * so `data` is null and `calculatedStats` comes out all zeros, exactly as the
 * real analyzer produces it.
 */
function mon(opts: {
  species: string;
  ability?: string | null;
  item?: string | null;
  moves?: string[];
  evs?: Partial<StatSpread>;
  statForm?: StatForm;
  baseSpe?: number | null;
}): AnalyzedPokemon {
  const baseSpe = opts.baseSpe === undefined ? 100 : opts.baseSpe;
  const recognised = baseSpe !== null;
  return {
    parsed: {
      species: opts.species,
      nickname: null,
      gender: null,
      item: opts.item ?? null,
      ability: opts.ability ?? null,
      level: 50,
      teraType: null,
      shiny: false,
      evs: spread(opts.evs),
      statForm: opts.statForm,
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      nature: "Serious",
      moves: opts.moves ?? ["Tackle"],
    },
    data: recognised
      ? {
          name: opts.species,
          types: ["Normal"],
          baseStats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: baseSpe },
          abilities: opts.ability ? [opts.ability] : [],
        }
      : null,
    calculatedStats: spread(
      recognised ? { hp: 175, atk: 136, def: 136, spa: 136, spd: 136, spe: baseSpe } : {},
    ),
    itemBoost: null,
  };
}

const NEUTRAL_SPECIES = ["Garchomp", "Dragonite", "Metagross", "Snorlax", "Gengar", "Lucario"];

/** Six fully-offensive Pokemon in the given unit. */
function offensiveTeam(statForm: StatForm, evs: Partial<StatSpread>): AnalyzedPokemon[] {
  return NEUTRAL_SPECIES.map((species) =>
    mon({ species, moves: ["Tackle", "Earthquake", "Ice Beam", "Dragon Claw"], evs, statForm }),
  );
}

describe("detectArchetypes", () => {
  it("tags a classic maxed-EV team as Hyper Offense", () => {
    const detected = detectArchetypes(offensiveTeam("ev", { atk: 252, spe: 252, hp: 4 }));
    expect(detected).toContain("Hyper Offense");
  });

  // VGC-291: investment thresholds are scaled by the unit the spread is
  // written in, taken from the explicit `statForm` rather than guessed from
  // per-stat magnitude.
  it("tags a Champions SP team as Hyper Offense instead of Goodstuffs", () => {
    const detected = detectArchetypes(offensiveTeam("sp", { atk: 32, spe: 32 }));
    expect(detected).toContain("Hyper Offense");
    expect(detected).not.toContain("Goodstuffs");
  });

  it("regression (VGC-299): one classic-EV member no longer hides five SP members' investment", () => {
    // The old rule was a team-wide `pokemon.every(total <= 66)`, so the single
    // 508-EV bulky member below flipped the entire team onto the EV scale and
    // the four SP attackers stopped clearing the 200-EV threshold — the team
    // fell through to "Goodstuffs".
    const team = [
      ...NEUTRAL_SPECIES.slice(0, 4).map((species) =>
        mon({
          species,
          moves: ["Tackle", "Earthquake", "Ice Beam", "Dragon Claw"],
          evs: { atk: 32, spe: 32 },
          statForm: "sp",
        }),
      ),
      mon({
        species: "Blissey",
        moves: ["Tackle", "Soft-Boiled", "Seismic Toss", "Heal Bell"],
        evs: { hp: 252, def: 252, spd: 4 },
        statForm: "sp",
      }),
      mon({
        species: "Skarmory",
        moves: ["Tackle", "Roost", "Iron Head", "Spikes"],
        evs: { hp: 252, def: 252, spd: 4 },
        statForm: "sp",
      }),
    ];
    const detected = detectArchetypes(team);
    expect(detected).toContain("Hyper Offense");
    expect(detected).not.toContain("Goodstuffs");
  });

  it("still reads a legacy roster with no statForm (shared reports keep their tags)", () => {
    const legacy = NEUTRAL_SPECIES.map((species) =>
      mon({
        species,
        moves: ["Tackle", "Earthquake", "Ice Beam", "Dragon Claw"],
        evs: { atk: 252, spe: 252, hp: 4 },
        // statForm deliberately absent — pre-VGC-291 payload.
      }),
    );
    expect(detectArchetypes(legacy)).toContain("Hyper Offense");
  });

  describe("Trick Room", () => {
    it("tags a genuinely slow team", () => {
      const team = [
        mon({ species: "Dusclops", moves: ["Trick Room", "Night Shade"], baseSpe: 25 }),
        mon({ species: "Amoonguss", moves: ["Spore", "Pollen Puff"], baseSpe: 30 }),
        mon({ species: "Ursaluna", moves: ["Facade", "Headlong Rush"], baseSpe: 50 }),
        mon({ species: "Garchomp", moves: ["Earthquake"], baseSpe: 102 }),
      ];
      expect(detectArchetypes(team)).toContain("Trick Room");
    });

    it("regression: misspelled species no longer count as slow (0 Speed is 'unknown', not 'slow')", () => {
      // Three unrecognised species used to score 0 Speed from calculatedStats
      // and push a one-mon Trick Room team over the 3-slow threshold.
      const team = [
        mon({ species: "Dusclops", moves: ["Trick Room", "Night Shade"], baseSpe: 25 }),
        mon({ species: "Incineroarr", moves: ["Fake Out"], baseSpe: null }),
        mon({ species: "Rillabom", moves: ["Grassy Glide"], baseSpe: null }),
        mon({ species: "Urshifuu", moves: ["Close Combat"], baseSpe: null }),
      ];
      const detected = detectArchetypes(team);
      expect(detected).not.toContain("Trick Room");
      expect(detected).toContain("Semi-TR");
    });
  });

  it("tags a support-plus-offense team as Balance", () => {
    const team = [
      mon({ species: "Incineroar", moves: ["Fake Out", "Flare Blitz"], baseSpe: 60 }),
      mon({
        species: "Flutter Mane",
        moves: ["Moonblast", "Shadow Ball"],
        evs: { spa: 252, spe: 252, hp: 4 },
        statForm: "ev",
        baseSpe: 135,
      }),
      mon({ species: "Amoonguss", moves: ["Spore", "Rage Powder"], baseSpe: 30 }),
    ];
    expect(detectArchetypes(team)).toContain("Balance");
  });

  it("falls back to Goodstuffs when nothing is detected", () => {
    expect(detectArchetypes([mon({ species: "Garchomp", moves: ["Earthquake"] })])).toEqual([
      "Goodstuffs",
    ]);
  });

  it("returns Goodstuffs for an empty team", () => {
    expect(detectArchetypes([])).toEqual(["Goodstuffs"]);
  });
});
