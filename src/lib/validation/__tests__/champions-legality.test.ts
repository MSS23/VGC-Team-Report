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

  it("flags multiple Mega Stones", () => {
    const team = makeTeam();
    team[0] = makePokemon({ species: "Kangaskhan", item: "Kangaskhanite" });
    team[1] = makePokemon({ species: "Salamence", item: "Salamencite" });
    const result = validateChampionsTeam(team);
    expect(result.legal).toBe(false);
    expect(result.issues.some((i) => i.message.includes("Only 1 Mega Evolution"))).toBe(true);
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

  it("treats Mega forms as same species for Species Clause", () => {
    const team = makeTeam();
    team[0] = makePokemon({ species: "Kangaskhan", item: "Kangaskhanite" });
    team[5] = makePokemon({ species: "Kangaskhan-Mega", item: "Leftovers" });
    const result = validateChampionsTeam(team);
    expect(result.issues.some((i) => i.message.includes("Species Clause"))).toBe(true);
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
