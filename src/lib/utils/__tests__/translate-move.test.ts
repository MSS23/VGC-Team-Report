import { beforeAll, describe, expect, it, vi } from "vitest";
import { getLoadedMoveNames, loadMoveNames } from "@/lib/data/move-names";
import { translateMove } from "@/lib/utils/translate-move";

const LOCALES = ["fr", "it", "es", "ja", "ko", "zh"] as const;

describe("translateMove", () => {
  beforeAll(async () => {
    await Promise.all(LOCALES.map((lang) => loadMoveNames(lang)));
  });

  it("ships a generated catalogue rather than a small hand-maintained subset", () => {
    for (const lang of LOCALES) {
      expect(getLoadedMoveNames(lang)?.size ?? 0).toBeGreaterThan(900);
    }
  });

  it("returns official localized labels for supported languages", () => {
    expect(translateMove("Protect", "fr")).toBe("Abri");
    expect(translateMove("Protect", "it")).toBe("Protezione");
    expect(translateMove("Protect", "es")).toBe("Protección");
    expect(translateMove("Protect", "ja")).toBe("まもる");
    expect(translateMove("Protect", "ko")).toBe("방어");
    expect(translateMove("Protect", "zh")).toBe("守住");
  });

  it("matches imported move names regardless of casing and punctuation variants", () => {
    expect(translateMove("  u turn ", "fr")).toBe("Demi-Tour");
    expect(translateMove("KING’S SHIELD", "es")).toBe("Escudo Real");
  });

  it("keeps the English source name when a translation is unavailable", () => {
    expect(translateMove("A Future Move", "ja")).toBe("A Future Move");
    // Shadow moves exist in the catalogue but have no ja/ko/zh names.
    expect(translateMove("shadow rush", "ja")).toBe("Shadow Rush");
    expect(translateMove("Shadow Rush", "fr")).toBe("Charge Noire");
  });

  it("short-circuits English without touching a locale table", () => {
    expect(translateMove("  Protect  ", "en")).toBe("Protect");
    expect(getLoadedMoveNames("en")).toBeUndefined();
  });
});

describe("move-name locale loading", () => {
  it("falls back to the English name until the locale table has loaded", async () => {
    // Fresh module registry so the tables loaded above are not visible.
    vi.resetModules();
    const registry = await import("@/lib/data/move-names");
    const { translateMove: freshTranslateMove } = await import("@/lib/utils/translate-move");

    expect(registry.getLoadedMoveNames("it")).toBeUndefined();
    expect(freshTranslateMove("Protect", "it")).toBe("Protect");

    await registry.loadMoveNames("it");
    expect(freshTranslateMove("Protect", "it")).toBe("Protezione");
  });

  it("is idempotent and ignores unknown languages", async () => {
    await expect(loadMoveNames("en")).resolves.toBeUndefined();
    await expect(loadMoveNames("de")).resolves.toBeUndefined();
    expect(getLoadedMoveNames("de")).toBeUndefined();
    const first = getLoadedMoveNames("fr");
    await loadMoveNames("fr");
    expect(getLoadedMoveNames("fr")).toBe(first);
  });
});
