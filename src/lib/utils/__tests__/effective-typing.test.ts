import { describe, expect, it } from "vitest";
import { lookupPokemon } from "@/lib/data/pokemon";
import { getDefensiveProfile } from "@/lib/data/type-chart";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { resolveEffectiveTyping } from "../effective-typing";

function pokemon(
  species: string,
  item: string,
  ability: string | null,
): Pick<AnalyzedPokemon, "parsed" | "data"> {
  return {
    parsed: { species, item, ability } as AnalyzedPokemon["parsed"],
    data: lookupPokemon(species),
  };
}

const gengar = () => pokemon("Gengar", "Gengarite", "Levitate");
const charizard = (stone: string) => pokemon("Charizard", stone, "Blaze");

describe("resolveEffectiveTyping", () => {
  it("regression: Mega Gengar is 2x weak to Ground, not immune — the paste's Levitate must not survive the Mega toggle", () => {
    const { types, ability, isMega } = resolveEffectiveTyping(gengar(), "gengar", true);

    expect(isMega).toBe(true);
    expect(ability).toBe("Shadow Tag");
    expect(getDefensiveProfile(types, ability).Ground).toBe(2);
  });

  it("keeps Levitate's Ground immunity while the Mega toggle is off", () => {
    const { types, ability, isMega } = resolveEffectiveTyping(gengar(), "gengar", false);

    expect(isMega).toBe(false);
    expect(ability).toBe("Levitate");
    expect(getDefensiveProfile(types, ability).Ground).toBe(0);
  });

  it("regression: Mega Charizard X is Fire/Dragon, so Rock is 2x — not the base form's phantom 4x", () => {
    const base = resolveEffectiveTyping(charizard("Charizardite X"), "charizard", false);
    const mega = resolveEffectiveTyping(charizard("Charizardite X"), "charizard", true);

    expect(base.types).toEqual(["Fire", "Flying"]);
    expect(getDefensiveProfile(base.types, base.ability).Rock).toBe(4);

    expect(mega.isMega).toBe(true);
    expect(mega.types).toEqual(["Fire", "Dragon"]);
    expect(mega.ability).toBe("Tough Claws");
    expect(getDefensiveProfile(mega.types, mega.ability).Rock).toBe(2);
  });

  it("leaves Mega Charizard Y's typing alone — it stays Fire/Flying and 4x weak to Rock", () => {
    const mega = resolveEffectiveTyping(charizard("Charizardite Y"), "charizard", true);

    expect(mega.isMega).toBe(true);
    expect(mega.types).toEqual(["Fire", "Flying"]);
    expect(mega.ability).toBe("Drought");
    expect(getDefensiveProfile(mega.types, mega.ability).Rock).toBe(4);
  });

  it("is a no-op for a Pokemon holding no Mega stone, Mega toggle on or off", () => {
    const mon = pokemon("Incineroar", "Safety Goggles", "Intimidate");
    const off = resolveEffectiveTyping(mon, "incineroar", false);
    const on = resolveEffectiveTyping(mon, "incineroar", true);

    expect(on).toEqual(off);
    expect(on.isMega).toBe(false);
    expect(on.types).toEqual(["Fire", "Dark"]);
    expect(on.ability).toBe("Intimidate");
  });

  it("gives Mega Pinsir the Aerilate it only has post-Mega", () => {
    const mon = pokemon("Pinsir", "Pinsirite", "Moxie");

    expect(resolveEffectiveTyping(mon, "pinsir", false).ability).toBe("Moxie");
    expect(resolveEffectiveTyping(mon, "pinsir", true).ability).toBe("Aerilate");
  });
});
