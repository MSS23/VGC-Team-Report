import { describe, it, expect } from "vitest";
import { validateChampionsTeam } from "../champions-legality";
import type { ParsedPokemon } from "@/lib/types/pokemon";

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

function makeTeam(count = 6): ParsedPokemon[] {
  const species = ["Incineroar", "Whimsicott", "Garchomp", "Kingambit", "Metagross", "Tsareena"];
  const items = ["Sitrus Berry", "Focus Sash", "Life Orb", "Assault Vest", "Clear Amulet", "Miracle Seed"];
  return species.slice(0, count).map((s, i) => makePokemon({ species: s, item: items[i] }));
}

describe("validateChampionsTeam", () => {
  it("returns legal for a valid 6-mon Champions team", () => {
    const result = validateChampionsTeam(makeTeam());
    expect(result.legal).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("warns when team has fewer than 6 Pokemon", () => {
    const result = validateChampionsTeam(makeTeam(4));
    expect(result.issues.some((i) => i.severity === "warning" && i.message.includes("4 Pokemon"))).toBe(true);
  });

  it("flags Species Clause violations", () => {
    const team = makeTeam();
    team[5] = makePokemon({ species: "Incineroar", item: "Leftovers" });
    const result = validateChampionsTeam(team);
    expect(result.legal).toBe(false);
    expect(result.issues.some((i) => i.message.includes("Species Clause"))).toBe(true);
  });

  it("flags Item Clause violations", () => {
    const team = makeTeam();
    team[1] = makePokemon({ species: "Whimsicott", item: "Sitrus Berry" }); // duplicate of team[0]
    const result = validateChampionsTeam(team);
    expect(result.legal).toBe(false);
    expect(result.issues.some((i) => i.message.includes("Item Clause"))).toBe(true);
  });

  it("flags too many restricted Pokemon", () => {
    const team = makeTeam();
    team[0] = makePokemon({ species: "Kyogre", item: "Mystic Water" });
    team[1] = makePokemon({ species: "Groudon", item: "Assault Vest" });
    team[2] = makePokemon({ species: "Rayquaza", item: "Life Orb" });
    const result = validateChampionsTeam(team);
    expect(result.legal).toBe(false);
    expect(result.issues.some((i) => i.message.includes("restricted Pokemon") && i.message.includes("3/2"))).toBe(true);
  });

  it("allows exactly 2 restricted Pokemon", () => {
    const team = makeTeam();
    team[0] = makePokemon({ species: "Kyogre", item: "Mystic Water" });
    team[1] = makePokemon({ species: "Groudon", item: "White Herb" });
    const result = validateChampionsTeam(team);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    expect(result.issues.some((i) => i.severity === "info" && i.message.includes("Restricted Pokemon (2/2)"))).toBe(true);
  });

  it("allows multiple Mega Stones on one team (only one can Mega Evolve per battle)", () => {
    const team = makeTeam();
    team[0] = makePokemon({ species: "Kangaskhan", item: "Kangaskhanite" });
    // team[2] is Garchomp by default; swap its item to Garchompite
    team[2] = makePokemon({ species: "Garchomp", item: "Garchompite" });
    const result = validateChampionsTeam(team);
    expect(result.issues.some((i) => i.message.includes("Only 1 Mega Evolution"))).toBe(false);
    expect(
      result.issues.some(
        (i) =>
          i.severity === "info" &&
          i.message.includes("Kangaskhan") &&
          i.message.includes("Garchomp") &&
          i.message.includes("only one"),
      ),
    ).toBe(true);
  });

  it("allows exactly 1 Mega Stone", () => {
    const team = makeTeam();
    team[0] = makePokemon({ species: "Kangaskhan", item: "Kangaskhanite" });
    const result = validateChampionsTeam(team);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    expect(result.issues.some((i) => i.severity === "info" && i.message.includes("Mega Evolution: Kangaskhan"))).toBe(true);
  });

  it("flags Z-Crystals", () => {
    const team = makeTeam();
    team[0] = makePokemon({ species: "Incineroar", item: "Firium Z" });
    const result = validateChampionsTeam(team);
    expect(result.legal).toBe(false);
    expect(result.issues.some((i) => i.message.includes("Z-Crystals are not allowed"))).toBe(true);
  });

  it("flags Pokemon not in Champions dex", () => {
    const team = makeTeam();
    team[0] = makePokemon({ species: "Pikachu-Starter", item: "Light Ball" });
    const result = validateChampionsTeam(team);
    expect(result.legal).toBe(false);
    expect(result.issues.some((i) => i.message.includes("not available in Champions"))).toBe(true);
  });

  it("flags EV totals over 510", () => {
    const team = makeTeam();
    team[0] = makePokemon({ evs: { hp: 252, atk: 252, def: 252, spa: 0, spd: 0, spe: 0 } });
    const result = validateChampionsTeam(team);
    expect(result.legal).toBe(false);
    expect(result.issues.some((i) => i.message.includes("EV total") && i.message.includes("exceeds"))).toBe(true);
  });

  it("reads SP-style spreads (total ≤ 66, stats ≤ 32) as SP and does not emit the /512 warning", () => {
    const team = makeTeam();
    // SP values pasted into the EVs line — 22+11+24+4+5 = 66 SP
    team[0] = makePokemon({ evs: { hp: 22, atk: 0, def: 11, spa: 24, spd: 4, spe: 5 } });
    const result = validateChampionsTeam(team);
    expect(result.legal).toBe(true);
    expect(result.issues.some((i) => i.message.includes("446 more available"))).toBe(false);
    expect(result.issues.some((i) => i.message.includes("66 EVs allocated"))).toBe(false);
  });

  it("flags SP under-allocation with SP terminology", () => {
    const team = makeTeam();
    team[0] = makePokemon({ evs: { hp: 20, atk: 0, def: 10, spa: 20, spd: 0, spe: 0 } }); // 50 SP
    const result = validateChampionsTeam(team);
    expect(
      result.issues.some(
        (i) =>
          i.severity === "info" &&
          i.message.includes("50/66 SP allocated") &&
          i.message.includes("16 more available"),
      ),
    ).toBe(true);
  });

  it("keeps traditional EV spreads on the EV path (any stat over 32 disambiguates)", () => {
    const team = makeTeam();
    // Classic 252/252/4 spread — unambiguously EVs because 252 > 32.
    team[0] = makePokemon({ evs: { hp: 252, atk: 0, def: 4, spa: 0, spd: 252, spe: 0 } });
    const result = validateChampionsTeam(team);
    expect(result.legal).toBe(true);
    expect(
      result.issues.some((i) => i.severity === "info" && i.message.includes("508 EVs allocated")),
    ).toBe(true);
  });

  it("treats Mega forms as same species for Species Clause", () => {
    const team = makeTeam();
    team[0] = makePokemon({ species: "Kangaskhan", item: "Kangaskhanite" });
    team[5] = makePokemon({ species: "Kangaskhan-Mega", item: "Leftovers" });
    const result = validateChampionsTeam(team);
    expect(result.issues.some((i) => i.message.includes("Species Clause"))).toBe(true);
  });

  it("accepts Rotom appliance forms (Wash/Heat/Mow/Fan/Frost)", () => {
    for (const form of ["Rotom-Wash", "Rotom-Heat", "Rotom-Mow", "Rotom-Fan", "Rotom-Frost"]) {
      const team = makeTeam();
      team[0] = makePokemon({ species: form, item: "Sitrus Berry" });
      const result = validateChampionsTeam(team);
      const dexErrors = result.issues.filter(
        (i) => i.severity === "error" && i.message.includes("not available in Champions"),
      );
      expect(dexErrors, `${form} should be legal`).toHaveLength(0);
    }
  });

  it("treats restricted forms as the same restricted slot", () => {
    const team = makeTeam();
    team[0] = makePokemon({ species: "Calyrex-Ice", item: "Choice Band" });
    team[1] = makePokemon({ species: "Kyogre", item: "Mystic Water" });
    const result = validateChampionsTeam(team);
    // 2 restricted is legal
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    expect(result.issues.some((i) => i.message.includes("Restricted Pokemon (2/2)"))).toBe(true);
  });
});
