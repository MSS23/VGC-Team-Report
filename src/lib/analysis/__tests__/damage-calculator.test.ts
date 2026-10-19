import { describe, expect, it } from "vitest";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { calculateReportDamage, createCalcPokemon } from "../damage-calculator";
import { calculateAllChampionsStats, convertToChampionsSp } from "../stat-calculator";
import { lookupPokemon } from "@/lib/data/pokemon";

const attacker = parseShowdownPaste("Incineroar @ Safety Goggles\nAbility: Intimidate\nEVs: 252 HP / 252 Atk / 4 SpD\nAdamant Nature\n- Flare Blitz").pokemon[0];
const defender = parseShowdownPaste("Rillaboom @ Assault Vest\nAbility: Grassy Surge\nEVs: 252 HP / 252 Atk / 4 SpD\nAdamant Nature\nTera Type: Fire\n- Wood Hammer").pokemon[0];

describe("report damage calculator", () => {
  it("uses the pasted spread at level 50 and does not mutate the report", () => {
    const before = JSON.stringify([attacker, defender]);
    const result = calculateReportDamage(attacker, defender, "Flare Blitz");
    expect(result.hp).toBe(207);
    expect(result.min).toBeGreaterThan(0);
    expect(result.max).toBeGreaterThanOrEqual(result.min);
    expect(result.description).toContain("Flare Blitz");
    expect(JSON.stringify([attacker, defender])).toBe(before);
  });
  it("uses the defender's activated Tera type", () => {
    const normal = calculateReportDamage(attacker, defender, "Flare Blitz");
    const tera = calculateReportDamage(attacker, defender, "Flare Blitz", { defenderTera: true });
    expect(tera.max).toBeLessThan(normal.min);
  });
  it("preserves Champions SP stats in the calculator's native Champions engine", () => {
    const parsed = { ...attacker, item: null, evs: { hp: 32, atk: 32, def: 0, spa: 0, spd: 2, spe: 0 } };
    const calc = createCalcPokemon(parsed, "Reg M-B", true);
    expect(calc.rawStats).toEqual(calculateAllChampionsStats(lookupPokemon(parsed.species)!.baseStats, convertToChampionsSp(parsed.evs), parsed.nature));
    expect(calc.teraType).toBeUndefined();
    expect(calc.level).toBe(50);
  });
  // VGC-294: Stellar is a legal Tera type. It changes offence only — a Stellar
  // Terastallized defender keeps its original typing, unlike the Fire Tera above.
  it("treats a Stellar Tera type as offence-only", () => {
    const stellar = { ...defender, teraType: "Stellar" as const };
    expect(createCalcPokemon(stellar, undefined, true).teraType).toBe("Stellar");
    const normal = calculateReportDamage(attacker, stellar, "Flare Blitz");
    const tera = calculateReportDamage(attacker, stellar, "Flare Blitz", { defenderTera: true });
    expect(tera.min).toBe(normal.min);
    expect(tera.max).toBe(normal.max);
  });
  it("reports ability immunities as zero damage", () => {
    const ghost = parseShowdownPaste("Gengar\nAbility: Cursed Body\n- Shadow Ball").pokemon[0];
    expect(calculateReportDamage(attacker, ghost, "Fake Out").max).toBe(0);
  });
  it("rejects unsupported species and status moves instead of displaying invented damage", () => {
    expect(() => calculateReportDamage({ ...attacker, species: "MissingNo" }, defender, "Flare Blitz")).toThrow("not supported");
    expect(() => calculateReportDamage(attacker, defender, "Protect")).toThrow("does not deal direct damage");
  });
});
