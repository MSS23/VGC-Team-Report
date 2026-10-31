import { describe, it, expect } from "vitest";
import { detectRegulation } from "../detect-regulation";
import type { AnalyzedPokemon } from "@/lib/types/analysis";

// detectRegulation only reads parsed.species / parsed.item.
const team = (...mons: [string, string?][]) =>
  mons.map(([species, item]) => ({ parsed: { species, item: item ?? null } })) as unknown as AnalyzedPokemon[];

describe("detectRegulation — Champions regs", () => {
  it("tags an M-A-only Mega team as Reg M-A", () => {
    expect(detectRegulation(team(["Kangaskhan", "Kangaskhanite"], ["Incineroar"]))).toBe("Reg M-A");
  });

  it("tags an M-B-only Mega as Reg M-B", () => {
    expect(detectRegulation(team(["Metagross", "Metagrossite"], ["Incineroar"]))).toBe("Reg M-B");
  });

  it("tags a Z Mega (stone or form) as Reg M-C", () => {
    expect(detectRegulation(team(["Garchomp", "Garchompite Z"]))).toBe("Reg M-C");
    expect(detectRegulation(team(["Lucario-Mega-Z"]))).toBe("Reg M-C");
    expect(detectRegulation(team(["Salamence", "Salamencite"]))).toBe("Reg M-C");
  });

  it("tags an M-A Mega with a new M-C species as Reg M-C, not an illegal M-A team", () => {
    expect(detectRegulation(team(["Kangaskhan", "Kangaskhanite"], ["Rillaboom"], ["Indeedee-F"]))).toBe("Reg M-C");
  });

  it("still tags non-Champions teams by their own signals", () => {
    expect(detectRegulation(team(["Calyrex-Shadow"], ["Rillaboom"]))).toBe("Reg G");
  });
});
