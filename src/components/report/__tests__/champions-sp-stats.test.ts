import { describe, it, expect } from "vitest";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { analyzeTeam } from "@/lib/analysis/analyze-team";
import {
  calculateAllChampionsStats,
  calculateChampionsStat,
  convertToChampionsSp,
} from "@/lib/analysis/stat-calculator";
import { teamSpeedRange } from "../TeamStats";
import { tournamentDisplayStats } from "../TournamentMode";
import { matchupDisplayStats } from "../MatchupPlanSlide";

/**
 * VGC-292 — TeamStats, TournamentMode and MatchupPlanSlide computed Champions
 * stats with the classic EV formula, so one report showed two different numbers
 * for the same Pokemon: this Dragapult read 182 Speed in those three places and
 * 213 everywhere the SP-aware path is used (PokemonCard, PokemonDetailSlide,
 * SpeedTierChart).
 *
 * Speed decides turn order, so the panels must all agree.
 */
const CHAMPIONS_REG = "Reg M-C";
const CLASSIC_REG = "Reg I";

// Spread is in Stat Points: 2 + 32 + 32 = the full 66 SP budget.
const PASTE = `Dragapult @ Choice Specs
Ability: Infiltrator
Level: 50
Timid Nature
EVs: 2 HP / 32 SpA / 32 Spe
- Shadow Ball
- Draco Meteor
- Flamethrower
- U-turn

Kangaskhan @ Kangaskhanite
Ability: Scrappy
Level: 50
Adamant Nature
- Fake Out
- Double-Edge
- Sucker Punch
- Protect
`;

function championsTeam() {
  return analyzeTeam(parseShowdownPaste(PASTE, { regulation: CHAMPIONS_REG })).pokemon;
}

/** The SP-aware path the correct components use, recomputed independently. */
function spAwareStats(mon: ReturnType<typeof championsTeam>[number]) {
  return calculateAllChampionsStats(
    mon.data!.baseStats,
    convertToChampionsSp(mon.parsed.evs),
    mon.parsed.nature,
  );
}

describe("VGC-292: Champions stats must not use the EV formula", () => {
  it("pins the Dragapult numbers from the bug report", () => {
    const [dragapult] = championsTeam();
    expect(dragapult.data!.baseStats.spe).toBe(142);
    // The SP formula (what the report shows elsewhere)…
    expect(calculateChampionsStat("spe", 142, 32, "Timid")).toBe(213);
    // …versus the EV formula these three components were using.
    expect(dragapult.calculatedStats.spe).toBe(182);
  });

  it("TeamStats reports the SP-derived speed range", () => {
    const team = championsTeam();
    const range = teamSpeedRange(team, CHAMPIONS_REG);
    expect(range.maxSpeed).toBe(213);
    expect(range.maxSpeed).toBe(spAwareStats(team[0]).spe);
    expect(range.minSpeed).toBe(spAwareStats(team[1]).spe);
  });

  it("TournamentMode cards and speed tiers use the SP-derived stats", () => {
    const team = championsTeam();
    expect(tournamentDisplayStats(team[0], CHAMPIONS_REG).spe).toBe(213);
    for (const mon of team) {
      expect(tournamentDisplayStats(mon, CHAMPIONS_REG)).toEqual(spAwareStats(mon));
    }
  });

  it("MatchupPlanSlide speed tiers and opponent spreads use the SP-derived stats", () => {
    const team = championsTeam();
    const dragapult = team[0];
    expect(matchupDisplayStats(dragapult.parsed, dragapult.data, CHAMPIONS_REG)!.spe).toBe(213);
    for (const mon of team) {
      expect(matchupDisplayStats(mon.parsed, mon.data, CHAMPIONS_REG)).toEqual(spAwareStats(mon));
    }
  });

  it("all three agree with each other on every stat", () => {
    const team = championsTeam();
    for (const mon of team) {
      const tournament = tournamentDisplayStats(mon, CHAMPIONS_REG);
      const matchup = matchupDisplayStats(mon.parsed, mon.data, CHAMPIONS_REG);
      expect(matchup).toEqual(tournament);
      expect(teamSpeedRange([mon], CHAMPIONS_REG).maxSpeed).toBe(tournament.spe);
    }
  });

  it("classic regulations keep the EV formula", () => {
    const team = analyzeTeam(
      parseShowdownPaste(PASTE, { regulation: CLASSIC_REG }),
    ).pokemon;
    for (const mon of team) {
      expect(tournamentDisplayStats(mon, CLASSIC_REG)).toEqual(mon.calculatedStats);
      expect(matchupDisplayStats(mon.parsed, mon.data, CLASSIC_REG)).toEqual(mon.calculatedStats);
      expect(teamSpeedRange([mon], CLASSIC_REG).maxSpeed).toBe(mon.calculatedStats.spe);
    }
  });

  it("missing dex data falls back instead of throwing", () => {
    const team = analyzeTeam(
      parseShowdownPaste("Notapokemon @ Leftovers\nTimid Nature\nEVs: 32 Spe\n- Tackle\n", {
        regulation: CHAMPIONS_REG,
      }),
    ).pokemon;
    expect(team[0].data).toBeNull();
    expect(tournamentDisplayStats(team[0], CHAMPIONS_REG)).toEqual(team[0].calculatedStats);
    expect(matchupDisplayStats(team[0].parsed, team[0].data, CHAMPIONS_REG)).toBeNull();
    expect(teamSpeedRange(team, CHAMPIONS_REG)).toEqual({ minSpeed: 0, maxSpeed: 0 });
  });
});
