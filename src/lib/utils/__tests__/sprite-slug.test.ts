import { describe, it, expect } from "vitest";
import { resolveSlug, getSpriteUrls } from "@/lib/utils/sprite-slug";

describe("resolveSlug", () => {
  it("converts simple species to slug", () => {
    expect(resolveSlug("Garchomp")).toBe("garchomp");
  });

  it("handles Flutter Mane (mapped species)", () => {
    expect(resolveSlug("Flutter Mane")).toBe("fluttermane");
  });

  it("handles Ho-Oh (mapped species)", () => {
    expect(resolveSlug("Ho-Oh")).toBe("hooh");
  });

  it("handles Urshifu-Rapid-Strike", () => {
    expect(resolveSlug("Urshifu-Rapid-Strike")).toBe("urshifu-rapidstrike");
  });

  it("handles Mr. Mime", () => {
    expect(resolveSlug("Mr. Mime")).toBe("mrmime");
  });

  it("handles Chi-Yu", () => {
    expect(resolveSlug("Chi-Yu")).toBe("chiyu");
  });

  it("handles Tapu Koko", () => {
    expect(resolveSlug("Tapu Koko")).toBe("tapukoko");
  });

  it("handles species with accents (Flabébé)", () => {
    expect(resolveSlug("Flabébé")).toBe("flabebe");
  });

  it("handles simple hyphenated forms", () => {
    expect(resolveSlug("Rotom-Wash")).toBe("rotom-wash");
  });
});

describe("getSpriteUrls", () => {
  it("returns 4 URL variants", () => {
    const urls = getSpriteUrls("Garchomp");
    expect(urls).toHaveLength(4);
  });

  it("returns animated GIF first", () => {
    const urls = getSpriteUrls("Garchomp");
    expect(urls[0]).toContain("/ani/garchomp.gif");
  });

  it("uses resolved slug for mapped species", () => {
    const urls = getSpriteUrls("Flutter Mane");
    expect(urls[0]).toContain("/ani/fluttermane.gif");
  });
});
