import { describe, expect, it } from "vitest";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { buildThreatMatrix, defensiveWeaknesses, findCoverageGaps } from "../threat-matrix";
const mon = (paste: string) => parseShowdownPaste(paste).pokemon[0];
describe("six versus six threat analysis", () => {
  it("selects the strongest damaging move and skips status moves", () => {
    const matrix = buildThreatMatrix([mon("Incineroar\n- Protect\n- Tackle\n- Flare Blitz")], [mon("Rillaboom\n- Wood Hammer")]);
    expect(matrix[0][0].move).toBe("Flare Blitz");
    expect(matrix[0][0].errors).toEqual([]);
  });
  it("does not turn unknown damage into a coverage gap", () => {
    const target = [mon("Rillaboom")];
    const matrix = buildThreatMatrix([mon("Incineroar\n- Imaginary Move")], target);
    expect(matrix[0][0].errors.length).toBe(1);
    expect(findCoverageGaps(matrix, target)).toEqual([]);
  });
  it("identifies immune targets and suggests effective coverage", () => {
    const targets = [mon("Gengar\nAbility: Cursed Body")];
    const gaps = findCoverageGaps(buildThreatMatrix([mon("Snorlax\n- Tackle")], targets), targets);
    expect(gaps[0].species).toBe("Gengar");
    expect(gaps[0].types).toContain("Dark");
  });
  it("respects ability immunities when counting shared weaknesses", () => {
    expect(defensiveWeaknesses([mon("Rotom-Heat\nAbility: Levitate"), mon("Raichu")]).some((w) => w.type === "Ground")).toBe(false);
  });
});
