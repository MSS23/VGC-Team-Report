import { describe, expect, it } from "vitest";
import { lookupPokemon } from "@/lib/data/pokemon";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { resolveSpeedTierForm } from "../speed-tier-form";

function pokemon(species: string, item: string): Pick<AnalyzedPokemon, "parsed" | "data"> {
  return {
    parsed: { species, item } as AnalyzedPokemon["parsed"],
    data: lookupPokemon(species),
  };
}

describe("resolveSpeedTierForm", () => {
  it("uses Mega base stats when the report-wide Mega form is selected", () => {
    const base = resolveSpeedTierForm(pokemon("Floette", "Floettite"), "floette", false);
    const mega = resolveSpeedTierForm(pokemon("Floette", "Floettite"), "floette", true);

    expect(base.speciesKey).toBe("floette");
    expect(base.isMega).toBe(false);
    expect(mega.speciesKey).toBe("floette-mega");
    expect(mega.isMega).toBe(true);
    expect(mega.data?.baseStats.spe).not.toBe(base.data?.baseStats.spe);
  });

  it("can display the base form for an already-Mega import", () => {
    const base = resolveSpeedTierForm(
      pokemon("Garchomp-Mega", "Garchompite"),
      "garchomp-mega",
      false,
    );

    expect(base.species).toBe("Garchomp");
    expect(base.speciesKey).toBe("garchomp");
    expect(base.isMega).toBe(false);
  });
});
