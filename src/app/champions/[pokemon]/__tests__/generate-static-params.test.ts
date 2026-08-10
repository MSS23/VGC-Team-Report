import { describe, it, expect } from "vitest";

import {
  CHAMPIONS_REG_MA_MEGAS,
  CHAMPIONS_REG_MB_ONLY_MEGAS,
  MEGA_BY_SLUG,
  MEGAS_WITH_SPRITES,
  getMegaRegulation,
  getRegMAMegasWithSprites,
  getRegMBMegasWithSprites,
} from "@/lib/data/mega-pokemon";

import { generateStaticParams } from "../page";

/**
 * VGC-258 regression guard.
 *
 * The /champions cluster (index grid, generateStaticParams, sitemap) was built
 * from getRegMAMegas* only. When Champions rotated to Regulation M-B, the 14
 * sprited M-B-only Megas were never prerendered, never sitemapped and never
 * linked — 14 SEO landing pages invisible to crawlers, resolvable only by
 * typing the URL.
 *
 * These tests fail if the static params ever narrow back to a single
 * regulation, so the next rotation (M-C) can't silently repeat it.
 */
describe("VGC-258 — /champions/[pokemon] static params cover every Champions regulation", () => {
  const slugs = new Set(generateStaticParams().map((p) => p.pokemon));

  it("prerenders every sprited Reg M-A Mega", () => {
    const missing = getRegMAMegasWithSprites()
      .map((m) => m.slug)
      .filter((slug) => !slugs.has(slug));
    expect(missing, `Reg M-A Megas missing from generateStaticParams: ${missing.join(", ")}`).toEqual([]);
  });

  it("prerenders every sprited Reg M-B Mega (superset of M-A)", () => {
    const missing = getRegMBMegasWithSprites()
      .map((m) => m.slug)
      .filter((slug) => !slugs.has(slug));
    expect(missing, `Reg M-B Megas missing from generateStaticParams: ${missing.join(", ")}`).toEqual([]);
  });

  it("prerenders the 14 sprited M-B-only Megas that VGC-258 was filed for", () => {
    const mbOnlySprited = [...CHAMPIONS_REG_MB_ONLY_MEGAS].filter((k) => MEGAS_WITH_SPRITES.has(k));
    // 16 M-B-only Megas, minus sprite-less Raichu X and Raichu Y.
    expect(mbOnlySprited).toHaveLength(14);

    for (const dataKey of mbOnlySprited) {
      const entry = [...MEGA_BY_SLUG.values()].find((m) => m.dataKey === dataKey);
      expect(entry, `no MEGA_POKEMON_LIST entry for ${dataKey}`).toBeDefined();
      expect(slugs.has(entry!.slug), `${entry!.slug} is not statically generated`).toBe(true);
    }
  });

  it("covers both regulations, not just one", () => {
    const regs = new Set(
      [...slugs].map((slug) => getMegaRegulation(MEGA_BY_SLUG.get(slug)!.dataKey)),
    );
    expect([...regs].sort()).toEqual(["M-A", "M-B"]);
  });

  it("never generates a page for a sprite-less Mega (it would render broken)", () => {
    const spriteless = [...slugs].filter(
      (slug) => !MEGAS_WITH_SPRITES.has(MEGA_BY_SLUG.get(slug)!.dataKey),
    );
    expect(spriteless).toEqual([]);
  });

  it("generates exactly the sprited Reg M-B set — currently 72 pages", () => {
    expect(slugs.size).toBe(getRegMBMegasWithSprites().length);
    expect(slugs.size).toBe(72);
  });
});

describe("getMegaRegulation — legality copy must never over-claim", () => {
  it("labels every Reg M-A Mega as M-A (legal in M-A and, by superset, M-B)", () => {
    for (const dataKey of CHAMPIONS_REG_MA_MEGAS) {
      expect(getMegaRegulation(dataKey)).toBe("M-A");
    }
  });

  it("labels every M-B-only Mega as M-B so it can never claim M-A legality", () => {
    for (const dataKey of CHAMPIONS_REG_MB_ONLY_MEGAS) {
      expect(getMegaRegulation(dataKey)).toBe("M-B");
      expect(CHAMPIONS_REG_MA_MEGAS.has(dataKey)).toBe(false);
    }
  });
});
