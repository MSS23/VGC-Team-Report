import { describe, it, expect } from "vitest";
import { getGenThemedSpriteUrls, isGenThemePixelated } from "@/lib/utils/sprite-url";

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
