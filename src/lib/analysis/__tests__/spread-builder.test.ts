import { describe, expect, it } from "vitest";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { evaluateSpread, initialSpread, suggestSpread, wastedInvestment } from "../spread-builder";
import { replacePokemonSpread } from "@/lib/utils/paste-edit";
const mon = (s: string) => parseShowdownPaste(s).pokemon[0];
const own = mon("Incineroar\nAbility: Blaze\nCareful Nature\n- Flare Blitz");
const opponent = mon("Arcanine\nAbility: Intimidate\n- Extreme Speed");
describe("spread benchmarks", () => {
  it("finds a spread meeting survival and speed targets", () => {
    const benchmark = { opponent, move: "Extreme Speed", survive: true, outspeed: true, speedBoost: 1 };
    const spread = suggestSpread(own, own.evs, benchmark)!;
    expect(spread).not.toBeNull();
    const result = evaluateSpread(own, spread, benchmark);
    expect(result.survives).toBe(true);
    expect(result.outspeeds).toBe(true);
  });
  it("returns no suggestion when the speed benchmark is impossible", () => {
    expect(suggestSpread(own, own.evs, { opponent: mon("Regieleki\nEVs: 252 Spe\nTimid Nature"), move: "", survive: false, outspeed: true, speedBoost: 0 })).toBeNull();
  });
  it("detects EVs that do not improve level 50 stats", () => {
    expect(wastedInvestment(own, { ...own.evs, hp: 8 }).hp).toBe(4);
  });
  it("uses Champions SP directly", () => {
    expect(initialSpread({ ...own, evs: { ...own.evs, hp: 32, atk: 32, spe: 2 } }, "Reg M-B").hp).toBe(32);
  });
  it("saves one spread without losing the header, notes, nickname or other slots", () => {
    const paste = "=== Team ===\n\nCat (Incineroar) @ Sitrus Berry\nEVs: 252 HP\nCareful Nature\n- Flare Blitz\n\nArcanine\n- Protect";
    const updated = replacePokemonSpread(paste, 0, { ...own.evs, hp: 4 });
    expect(updated).toContain("=== Team ===");
    expect(updated).toContain("Cat (Incineroar) @ Sitrus Berry\nEVs: 4 HP");
    expect(updated).toContain("Arcanine\n- Protect");
  });
});
