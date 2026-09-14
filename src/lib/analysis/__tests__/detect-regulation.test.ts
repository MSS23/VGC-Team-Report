import { describe, it, expect } from "vitest";
import {
  detectRegulation,
  detectChampionsRegulationTag,
} from "../detect-regulation";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { ParsedPokemon } from "@/lib/types/pokemon";

function makeParsed(overrides: Partial<ParsedPokemon> = {}): ParsedPokemon {
  return {
    species: "Incineroar",
    nickname: null,
    gender: null,
    item: "Sitrus Berry",
    ability: "Intimidate",
    level: 50,
    teraType: null,
    shiny: false,
    evs: { hp: 12, atk: 0, def: 12, spa: 0, spd: 12, spe: 0 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    nature: "Careful",
    moves: ["Fake Out", "Flare Blitz", "Knock Off", "Parting Shot"],
    ...overrides,
  };
}

function makeTeam(...overrides: Partial<ParsedPokemon>[]): AnalyzedPokemon[] {
  const mons = overrides.length > 0 ? overrides : [{}];
  return mons.map((o) => ({
    parsed: makeParsed(o),
    data: null,
    calculatedStats: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    itemBoost: null,
  }));
}

// VGC-41: Reg M-C is additive over M-B, so no species on an M-C team can
// positively identify the format — the paste header's explicit format tag is
// the only signal. Without this the detector could never return "Reg M-C" and
// M-C teams were mis-tagged as M-A/M-B (or Custom).
describe("detectChampionsRegulationTag (VGC-41)", () => {
  it("reads Reg M-C out of a Showdown format header", () => {
    expect(
      detectChampionsRegulationTag("=== [gen9vgc2026regmc] Ladder Team ===\n\nIncineroar @ Sitrus Berry"),
    ).toBe("Reg M-C");
  });

  it("reads the older Champions regs too", () => {
    expect(detectChampionsRegulationTag("=== [gen9vgc2026regma] T ===")).toBe("Reg M-A");
    expect(detectChampionsRegulationTag("=== [gen9vgc2026regmb] T ===")).toBe("Reg M-B");
  });

  it("accepts spaced / hyphenated spellings of the tag", () => {
    expect(detectChampionsRegulationTag("=== [Regulation M-C] T ===")).toBe("Reg M-C");
    expect(detectChampionsRegulationTag("=== [Reg M C] T ===")).toBe("Reg M-C");
  });

  it("returns null for non-Champions, header-less, and empty pastes", () => {
    expect(detectChampionsRegulationTag("=== [gen9vgc2025regg] T ===")).toBeNull();
    expect(detectChampionsRegulationTag("=== [gen9vgc2024regh] T ===")).toBeNull();
    expect(detectChampionsRegulationTag("=== My Team ===")).toBeNull();
    expect(detectChampionsRegulationTag("Incineroar @ Sitrus Berry")).toBeNull();
    expect(detectChampionsRegulationTag(undefined)).toBeNull();
    expect(detectChampionsRegulationTag(null)).toBeNull();
  });

  it("ignores 'Reg M-C' outside the format bracket (no false positives)", () => {
    expect(detectChampionsRegulationTag("=== My Reg M-C Team ===")).toBeNull();
    expect(
      detectChampionsRegulationTag("Reg M-C sweeper (Incineroar) @ Sitrus Berry"),
    ).toBeNull();
  });
});

describe("detectRegulation with an explicit paste header", () => {
  it("tags an M-C paste as Reg M-C even though every species is M-B legal", () => {
    const team = makeTeam({ species: "Incineroar" }, { species: "Gholdengo" });
    expect(detectRegulation(team, "=== [gen9vgc2026regmc] Team ===")).toBe("Reg M-C");
  });

  it("lets the explicit tag outrank the inferred Mega signal", () => {
    const team = makeTeam({ species: "Charizard-Mega-Y", item: "Charizardite Y" });
    expect(detectRegulation(team)).toBe("Reg M-A");
    expect(detectRegulation(team, "=== [gen9vgc2026regmc] Team ===")).toBe("Reg M-C");
  });

  it("falls back to species signals when the header is not a Champions format", () => {
    const team = makeTeam({ species: "Charizard-Mega-Y", item: "Charizardite Y" });
    expect(detectRegulation(team, "=== [gen9vgc2025regg] Team ===")).toBe("Reg M-A");
  });

  it("leaves paste-less detection untouched", () => {
    const restricted = makeTeam({ species: "Calyrex-Shadow", item: "Focus Sash" });
    expect(detectRegulation(restricted)).toBe("Reg G");
    expect(detectRegulation([])).toBeNull();
    expect(detectRegulation([], "=== [gen9vgc2026regmc] Team ===")).toBeNull();
  });
});
