import { describe, expect, it } from "vitest";
import { MOVE_NAMES } from "@/lib/data/move-names";
import { translateMove } from "@/lib/utils/translate-move";

describe("translateMove", () => {
  it("ships a generated catalogue rather than a small hand-maintained subset", () => {
    expect(Object.keys(MOVE_NAMES).length).toBeGreaterThan(900);
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
