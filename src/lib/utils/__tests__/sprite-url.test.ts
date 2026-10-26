import { describe, it, expect } from "vitest";
import {
  getGenThemedSpriteUrls,
  getProgressiveSpriteUrls,
  isGenThemePixelated,
} from "@/lib/utils/sprite-url";

/**
 * VGC-261 regression cover.
 *
 * `getGenThemedSpriteUrls` used to resolve an unknown gen theme with
 * `GEN_SPRITE_STYLES[genTheme] ?? GEN_SPRITE_STYLES.gen9` — a lookup whose
 * fallback was itself an unchecked index access, followed by 12 unguarded
 * `style.*` reads. If that lookup ever returned undefined the function threw
 * instead of degrading to the substitute sprite. These tests pin the
 * unknown-key behaviour so the fallback can't silently regress.
 */
describe("getGenThemedSpriteUrls — unknown gen theme", () => {
  const UNKNOWN_THEMES = ["gen99", "", "toString", "constructor", "__proto__", "GEN9", "not-a-gen"];

  it.each(UNKNOWN_THEMES)("does not throw and returns usable URLs for %o", (theme) => {
    expect(() => getGenThemedSpriteUrls("Garchomp", theme, false, false)).not.toThrow();

    const urls = getGenThemedSpriteUrls("Garchomp", theme, false, false);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(typeof url).toBe("string");
      // No `undefined` leaking into a folder segment from a missing style.
      expect(url).not.toContain("undefined");
      expect(url).toMatch(/^https:\/\/play\.pokemonshowdown\.com\/sprites\//);
    }
  });

  it("falls back to the modern (gen9) style for an unknown theme", () => {
    expect(getGenThemedSpriteUrls("Garchomp", "gen99", false, false)).toEqual(
      getGenThemedSpriteUrls("Garchomp", "gen9", false, false),
    );
    expect(getGenThemedSpriteUrls("Garchomp", "gen99", true, true)).toEqual(
      getGenThemedSpriteUrls("Garchomp", "gen9", true, true),
    );
  });

  it("always ends on the substitute sprite, known theme or not", () => {
    for (const theme of ["gen1", "gen5", "gen9", "gen99", ""]) {
      const urls = getGenThemedSpriteUrls("Garchomp", theme, false, false);
      expect(urls[urls.length - 1]).toBe(
        "https://play.pokemonshowdown.com/sprites/gen5/substitute.png",
      );
    }
  });

  it("still honours known retro themes", () => {
    const gen1 = getGenThemedSpriteUrls("Pikachu", "gen1", false, false);
    expect(gen1[0]).toBe("https://play.pokemonshowdown.com/sprites/gen1rb/pikachu.png");
  });
});

describe("isGenThemePixelated", () => {
  it("is true for retro themes", () => {
    expect(isGenThemePixelated("gen1")).toBe(true);
    expect(isGenThemePixelated("gen5")).toBe(true);
  });

  it("is false for modern themes", () => {
    expect(isGenThemePixelated("gen9")).toBe(false);
  });

  it("falls back to the modern style (not pixelated) for unknown themes", () => {
    expect(isGenThemePixelated("gen99")).toBe(false);
    expect(isGenThemePixelated("")).toBe(false);
    expect(isGenThemePixelated("toString")).toBe(false);
    expect(isGenThemePixelated("__proto__")).toBe(false);
  });
});

describe("getProgressiveSpriteUrls", () => {
  it("shows a lightweight static sprite before loading animation", () => {
    const urls = getProgressiveSpriteUrls("Incineroar", "gen9", false);

    expect(urls.preview[0]).toBe(
      "https://play.pokemonshowdown.com/sprites/home/incineroar.png",
    );
    expect(urls.animated[0]).toBe(
      "https://play.pokemonshowdown.com/sprites/ani/incineroar.gif",
    );
    expect(urls.animated.every((url) => url.endsWith(".gif"))).toBe(true);
  });

  it("does not schedule known static-only species for failed GIF requests", () => {
    const urls = getProgressiveSpriteUrls("Chien-Pao", "gen9", false);

    expect(urls.preview[0]).toContain("/home/chienpao.png");
    expect(urls.animated).toEqual([]);
  });

  it("keeps the real-sprite GIF as the preview's last resort before the substitute", () => {
    // The preview chain is static-FIRST, not static-only: after both PNG
    // folders 404 it falls through to the animated sprite rather than the
    // substitute doll. Pinned so the ordering stays a deliberate choice.
    const urls = getProgressiveSpriteUrls("Incineroar", "gen9", false);

    expect(urls.preview).toEqual([
      "https://play.pokemonshowdown.com/sprites/home/incineroar.png",
      "https://play.pokemonshowdown.com/sprites/gen5/incineroar.png",
      "https://play.pokemonshowdown.com/sprites/ani/incineroar.gif",
      "https://play.pokemonshowdown.com/sprites/gen5/substitute.png",
    ]);
  });

  it("keeps shiny and generation-specific preview folders", () => {
    const urls = getProgressiveSpriteUrls("Pikachu", "gen3", true);

    expect(urls.preview[0]).toContain("/gen3-shiny/pikachu.png");
    expect(urls.animated[0]).toContain("/gen5ani-shiny/pikachu.gif");
  });
});
