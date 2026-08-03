import { describe, it, expect } from "vitest";
import { lookupPokemonFromDex } from "../pkmn-dex-fallback";
import { allSpecies } from "../dex-subset";
import { TYPE_COLORS } from "@/lib/utils/type-colors";

describe("lookupPokemonFromDex type validation", () => {
  it("excludes MissingNo. — its 'Bird' type is not a real PokemonType", () => {
    // Regression: MissingNo. cleared the zero-stat guard (hp 33 / atk 136) and
    // its "Bird" type reached TYPE_COLORS, where the undefined lookup threw and
    // white-screened the entire report.
    expect(lookupPokemonFromDex("MissingNo.")).toBeNull();
    expect(lookupPokemonFromDex("missingno")).toBeNull();
  });

  it("still resolves real species from the dex subset", () => {
    const golurk = lookupPokemonFromDex("Golurk");
    expect(golurk).not.toBeNull();
    expect(golurk?.types).toEqual(["Ground", "Ghost"]);
  });

  it("never returns a type without a TYPE_COLORS entry", () => {
    const offenders: string[] = [];
    for (const species of allSpecies()) {
      const data = lookupPokemonFromDex(species.name);
      if (!data) continue;
      for (const type of data.types) {
        if (!TYPE_COLORS[type]) offenders.push(`${data.name}: ${type}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
