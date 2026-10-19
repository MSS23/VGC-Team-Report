import { beforeAll, describe, expect, it } from "vitest";
import { MOVE_NAMES } from "@/lib/data/move-names";
import { loadMoveNames, areMoveNamesLoaded, translateMove } from "@/lib/utils/translate-move";

describe("translateMove", () => {
  it("ships a generated catalogue rather than a small hand-maintained subset", () => {
    expect(Object.keys(MOVE_NAMES).length).toBeGreaterThan(900);
  });

  it("does not need the localised catalogue for the English path", () => {
    // Runs before any loadMoveNames() call, so the lazy chunk is still cold.
    expect(areMoveNamesLoaded()).toBe(false);
    expect(translateMove("  Protect  ", "en")).toBe("Protect");
    expect(areMoveNamesLoaded()).toBe(false);
  });

  it("falls back to the English name while the catalogue is still loading", () => {
    expect(areMoveNamesLoaded()).toBe(false);
    expect(translateMove("  Protect  ", "fr")).toBe("Protect");
  });

  describe("once the lazy catalogue has loaded", () => {
    beforeAll(async () => {
      await loadMoveNames();
      expect(areMoveNamesLoaded()).toBe(true);
    });

    it("resolves repeat loads from cache", async () => {
      await expect(loadMoveNames()).resolves.toBeUndefined();
      expect(areMoveNamesLoaded()).toBe(true);
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
      expect(translateMove("  Protect  ", "en")).toBe("Protect");
    });
  });
});
