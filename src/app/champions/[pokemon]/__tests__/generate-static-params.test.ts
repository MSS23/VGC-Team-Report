import { describe, it, expect } from "vitest";

import {
  CHAMPIONS_REG_MA_MEGAS,
  CHAMPIONS_REG_MB_ONLY_MEGAS,
  CHAMPIONS_REG_MC_ONLY_MEGAS,
  MEGA_BY_SLUG,
  MEGAS_WITH_SPRITES,
  getMegaRegulation,
  getMegaLegalInLabel,
  getRegMAMegasWithSprites,
  getRegMCMegasWithSprites,
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

  it("prerenders every sprited Reg M-C Mega (superset of M-B and M-A)", () => {
    const missing = getRegMCMegasWithSprites()
      .map((m) => m.slug)
      .filter((slug) => !slugs.has(slug));
    expect(missing, `Reg M-C Megas missing from generateStaticParams: ${missing.join(", ")}`).toEqual([]);
  });

  it("prerenders every M-B-only and M-C-only Mega (the VGC-258 failure mode)", () => {
    const laterSprited = [...CHAMPIONS_REG_MB_ONLY_MEGAS, ...CHAMPIONS_REG_MC_ONLY_MEGAS]
      .filter((k) => MEGAS_WITH_SPRITES.has(k));
    // 16 M-B + 6 M-C; Raichu X/Y gained sprites once the slug joined "megax".
    expect(laterSprited).toHaveLength(22);

    for (const dataKey of laterSprited) {
      const entry = [...MEGA_BY_SLUG.values()].find((m) => m.dataKey === dataKey);
      expect(entry, `no MEGA_POKEMON_LIST entry for ${dataKey}`).toBeDefined();
      expect(slugs.has(entry!.slug), `${entry!.slug} is not statically generated`).toBe(true);
    }
  });

  it("covers every regulation, not just one", () => {
    const regs = new Set(
      [...slugs].map((slug) => getMegaRegulation(MEGA_BY_SLUG.get(slug)!.dataKey)),
    );
    expect([...regs].sort()).toEqual(["M-A", "M-B", "M-C"]);
  });

  it("never generates a page for a sprite-less Mega (it would render broken)", () => {
    const spriteless = [...slugs].filter(
      (slug) => !MEGAS_WITH_SPRITES.has(MEGA_BY_SLUG.get(slug)!.dataKey),
    );
    expect(spriteless).toEqual([]);
  });

  it("generates exactly the sprited Reg M-C set — currently 81 pages", () => {
    expect(slugs.size).toBe(getRegMCMegasWithSprites().length);
    expect(slugs.size).toBe(81);
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

  it("labels every M-C-only Mega as M-C and never claims earlier regs", () => {
    for (const dataKey of CHAMPIONS_REG_MC_ONLY_MEGAS) {
      expect(getMegaRegulation(dataKey)).toBe("M-C");
      expect(getMegaLegalInLabel(dataKey)).toBe("Regulation M-C");
    }
    expect(getMegaLegalInLabel("kangaskhan-mega")).toBe("Regulation M-A, M-B and M-C");
    expect(getMegaLegalInLabel("metagross-mega")).toBe("Regulation M-B and M-C");
  });
});
