import { describe, it, expect } from "vitest";
import { megaSlugForSpecies } from "@/lib/data/mega-pokemon";

describe("megaSlugForSpecies (/champions/[species] -> /champions/mega-[species])", () => {
  it("maps a bare species to its Mega guide", () => {
    expect(megaSlugForSpecies("garchomp")).toBe("mega-garchomp");
    expect(megaSlugForSpecies("Kangaskhan")).toBe("mega-kangaskhan");
  });
  it("leaves real Mega slugs alone", () => {
    expect(megaSlugForSpecies("mega-garchomp")).toBeNull();
  });
  it("stays a 404 when there is no single matching Mega", () => {
    expect(megaSlugForSpecies("charizard")).toBeNull(); // X and Y
    expect(megaSlugForSpecies("not-a-pokemon")).toBeNull();
  });
});
