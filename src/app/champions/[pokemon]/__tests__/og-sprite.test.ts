import { describe, expect, it } from "vitest";
import { getRegMCMegasWithSprites } from "@/lib/data/mega-pokemon";
import { INDY_TOP_CUT } from "@/data/indy-top-cut";
import { homeSpriteUrl, resolveSlug } from "@/lib/utils/sprite-slug";
import { megaGuideSpriteUrl } from "../og-sprite";

const HOME = "https://play.pokemonshowdown.com/sprites/home";

describe("Mega guide og:image sprite (regression: route slug used as sprite name)", () => {
  it("asks for the data-key sprite, not home/mega-<name>.png", () => {
    expect(megaGuideSpriteUrl("mega-garchomp")).toBe(`${HOME}/garchomp-mega.png`);
    expect(megaGuideSpriteUrl("mega-kangaskhan")).toBe(`${HOME}/kangaskhan-mega.png`);
  });

  it("joins lettered Megas the way Showdown does", () => {
    expect(megaGuideSpriteUrl("mega-charizard-y")).toBe(`${HOME}/charizard-megay.png`);
    expect(megaGuideSpriteUrl("mega-charizard-x")).toBe(`${HOME}/charizard-megax.png`);
  });

  it("never emits a mega-prefixed sprite name for any published Mega guide", () => {
    const megas = getRegMCMegasWithSprites();
    expect(megas.length).toBeGreaterThan(0);
    for (const mega of megas) {
      const url = megaGuideSpriteUrl(mega.slug);
      expect(url, mega.slug).toBe(`${HOME}/${resolveSlug(mega.dataKey)}.png`);
      expect(url, mega.slug).not.toContain("/home/mega-");
    }
  });

  it("falls back to slugging the param for an unknown route slug", () => {
    expect(megaGuideSpriteUrl("not-a-mega")).toBe(`${HOME}/not-a-mega.png`);
  });
});

describe("Indy top-cut sprites (regression: tapu-fini.png 404)", () => {
  it("uses Showdown's joined names for the Tapus", () => {
    expect(homeSpriteUrl("Tapu Fini")).toBe(`${HOME}/tapufini.png`);
    expect(homeSpriteUrl("Tapu Koko")).toBe(`${HOME}/tapukoko.png`);
    expect(homeSpriteUrl("Tapu Lele")).toBe(`${HOME}/tapulele.png`);
  });

  it("gives every listed species a sprite name with no space or tapu- hyphen", () => {
    for (const species of new Set(INDY_TOP_CUT.flatMap((entry) => entry.species))) {
      const url = homeSpriteUrl(species);
      expect(url, species).toMatch(/\/home\/[a-z0-9-]+\.png$/);
      expect(url, species).not.toContain("tapu-");
    }
  });
});
