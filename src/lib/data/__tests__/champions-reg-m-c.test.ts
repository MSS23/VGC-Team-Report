import { describe, it, expect } from "vitest";
import { REGULATIONS, isChampionsFormat } from "../tags";
import { validateChampionsTeam } from "@/lib/validation/champions-legality";
import {
  convertToChampionsSp,
  CHAMPIONS_TOTAL_SP,
  CHAMPIONS_MAX_SP_PER_STAT,
} from "@/lib/analysis/stat-calculator";
import type { ParsedPokemon } from "@/lib/types/pokemon";

/**
 * Regression coverage for the Reg M-C launch (8 Sep 2026).
 *
 * THE BUG: `isChampionsFormat` only recognised "Reg M-A" and "Reg M-B", so a
 * Reg M-C team rendered as a classic EV team — EV spreads instead of SP, a
 * Tera section for a format with no Tera mechanic, and no legality checking.
 * `isChampionsFormat` is the single switch every Champions consumer reads
 * (PokemonCard, PokemonDetailSlide, SpeedTierChart, TeamStats, TournamentMode,
 * the home page Mega gate), so these tests pin the switch plus the two
 * behaviours that broke downstream of it.
 */

function makePokemon(overrides: Partial<ParsedPokemon> = {}): ParsedPokemon {
  return {
    species: "Incineroar",
    nickname: null,
    gender: null,
    item: "Sitrus Berry",
    ability: "Intimidate",
    level: 50,
    teraType: null,
    shiny: false,
    evs: { hp: 252, atk: 0, def: 0, spa: 0, spd: 252, spe: 4 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    nature: "Careful",
    moves: ["Fake Out", "Flare Blitz", "Knock Off", "Parting Shot"],
    ...overrides,
  };
}

function makeTeam(): ParsedPokemon[] {
  const species = ["Incineroar", "Whimsicott", "Garchomp", "Kingambit", "Arcanine", "Tsareena"];
  const items = ["Sitrus Berry", "Focus Sash", "Life Orb", "Assault Vest", "Clear Amulet", "Miracle Seed"];
  return species.map((s, i) => makePokemon({ species: s, item: items[i] }));
}

describe("Reg M-C is a Champions format", () => {
  it("is selectable as a regulation tag", () => {
    expect(REGULATIONS).toContain("Reg M-C");
  });

  it("isChampionsFormat('Reg M-C') is true (the day-one M-C bug)", () => {
    expect(isChampionsFormat("Reg M-C")).toBe(true);
  });

  it("treats every Champions reg the same and nothing else", () => {
    for (const reg of ["Reg M-A", "Reg M-B", "Reg M-C"]) {
      expect(isChampionsFormat(reg)).toBe(true);
    }
    for (const reg of ["Reg G", "Reg H", "Reg I", "Custom", "", "reg m-c"]) {
      expect(isChampionsFormat(reg)).toBe(false);
    }
    expect(isChampionsFormat(undefined)).toBe(false);
    expect(isChampionsFormat(null)).toBe(false);
  });
});

describe("Reg M-C gets SP treatment, not EVs", () => {
  // The report components all gate their SP conversion on isChampionsFormat
  // and then call convertToChampionsSp. If the gate is on, an M-C paste gets
  // the identical SP treatment an M-A/M-B paste gets.
  it("gates the SP conversion on for M-C", () => {
    expect(isChampionsFormat("Reg M-C")).toBe(true);
  });

  it("converts a classic EV spread on an M-C team to SP within budget", () => {
    const sp = convertToChampionsSp({ hp: 252, atk: 0, def: 0, spa: 252, spd: 0, spe: 4 });
    const total = Object.values(sp).reduce((a, b) => a + b, 0);
    expect(total).toBeLessThanOrEqual(CHAMPIONS_TOTAL_SP);
    expect(Math.max(...Object.values(sp))).toBeLessThanOrEqual(CHAMPIONS_MAX_SP_PER_STAT);
    expect(sp.hp).toBe(CHAMPIONS_MAX_SP_PER_STAT);
    expect(sp.spe).toBe(1);
  });

  it("passes an already-SP M-C paste through untouched", () => {
    const spForm = { hp: 22, atk: 0, def: 11, spa: 24, spd: 4, spe: 5 };
    expect(convertToChampionsSp(spForm)).toEqual(spForm);
  });
});

describe("Reg M-C suppresses Tera", () => {
  // Mirrors the gate in TeamStats / PokemonCard / PokemonDetailSlide /
  // TournamentMode: Champions has no Tera mechanic, so the Tera count and
  // the Tera section are hidden for every Champions reg.
  const teraCount = (regulation: string, team: ParsedPokemon[]) =>
    isChampionsFormat(regulation) ? 0 : team.filter((p) => p.teraType).length;

  const teraTeam: ParsedPokemon[] = makeTeam().map((p) => makePokemon({ ...p, teraType: "Water" }));

  it("hides Tera for M-C exactly as it does for M-A and M-B", () => {
    expect(teraCount("Reg M-C", teraTeam)).toBe(0);
    expect(teraCount("Reg M-B", teraTeam)).toBe(0);
    expect(teraCount("Reg M-A", teraTeam)).toBe(0);
  });

  it("still shows Tera for a non-Champions reg", () => {
    expect(teraCount("Reg I", teraTeam)).toBe(6);
  });
});

describe("Reg M-C legality degrades gracefully (no roster yet)", () => {
  // The official Reg M-C species/Mega list is not published, so the repo has
  // no M-C dex. An unknown species must be left unvalidated rather than
  // confidently reported ILLEGAL.
  const unknownSpecies = "Flutter Mane"; // not in the M-A or M-B Champions dex

  it("does not flag an off-dex species as illegal under M-C", () => {
    const team = makeTeam();
    team[0] = makePokemon({ species: unknownSpecies, item: "Booster Energy" });
    const result = validateChampionsTeam(team, "Reg M-C");
    expect(result.issues.some((i) => i.message.includes("not available in Champions format"))).toBe(false);
    expect(result.legal).toBe(true);
  });

  it("still flags that same species under M-B, where the roster IS known", () => {
    const team = makeTeam();
    team[0] = makePokemon({ species: unknownSpecies, item: "Booster Energy" });
    const result = validateChampionsTeam(team, "Reg M-B");
    expect(result.legal).toBe(false);
    expect(result.issues.some((i) => i.message.includes("not available in Champions format"))).toBe(true);
  });

  it("still enforces the reg-independent rules under M-C", () => {
    const dupeSpecies = makeTeam();
    dupeSpecies[5] = makePokemon({ species: "Incineroar", item: "Leftovers" });
    expect(validateChampionsTeam(dupeSpecies, "Reg M-C").issues.some((i) => i.message.includes("Species Clause"))).toBe(true);

    const dupeItem = makeTeam();
    dupeItem[1] = makePokemon({ species: "Whimsicott", item: "Sitrus Berry" });
    expect(validateChampionsTeam(dupeItem, "Reg M-C").issues.some((i) => i.message.includes("Item Clause"))).toBe(true);

    const zCrystal = makeTeam();
    zCrystal[0] = makePokemon({ species: "Incineroar", item: "Firium Z" });
    expect(validateChampionsTeam(zCrystal, "Reg M-C").issues.some((i) => i.message.includes("Z-Crystals"))).toBe(true);

    const tooManyRestricted = makeTeam();
    tooManyRestricted[0] = makePokemon({ species: "Kyogre", item: "Mystic Water" });
    tooManyRestricted[1] = makePokemon({ species: "Groudon", item: "Assault Vest" });
    tooManyRestricted[2] = makePokemon({ species: "Rayquaza", item: "Life Orb" });
    expect(validateChampionsTeam(tooManyRestricted, "Reg M-C").issues.some((i) => i.message.includes("Too many restricted"))).toBe(true);
  });

  it("labels M-C issues as M-C, not M-A", () => {
    const team = makeTeam();
    team[0] = makePokemon({ evs: { hp: 100, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } });
    const evHint = validateChampionsTeam(team, "Reg M-C").issues.find((i) => i.message.includes("more available ("));
    expect(evHint?.message).toContain("Reg M-C");
  });
});
