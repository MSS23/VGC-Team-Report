import { describe, it, expect } from "vitest";

import { generateStaticParams } from "../page";
import sitemap from "@/app/sitemap";
import {
  CHAMPIONS_REG_MA_MEGAS,
  CHAMPIONS_REG_MB_ONLY_MEGAS,
  MEGA_BY_SLUG,
  hasMegaSprite,
} from "@/lib/data/mega-pokemon";

/**
 * Regression: the Reg M-B Mega landing pages 404'd.
 *
 * generateStaticParams and the sitemap both built from
 * getRegMAMegasWithSprites(), so every Mega that is legal only in Regulation
 * M-B — Metagross, Blaziken, Swampert, Mawile and the rest — had no page at
 * all, even though M-B is the live format and the 2026 Worlds format.
 */
describe("champions/[pokemon] static params — Reg M-B coverage", () => {
  const params = generateStaticParams();
  const slugs = new Set(params.map((p) => p.pokemon));

  /** M-B-only Megas that have a Showdown sprite, i.e. the ones that must build. */
  const spritedMbOnly = [...CHAMPIONS_REG_MB_ONLY_MEGAS].filter(hasMegaSprite);

  it("builds a page for every sprited Reg M-B-only Mega", () => {
    expect(spritedMbOnly.length).toBeGreaterThan(0);

    const missing = spritedMbOnly.filter((dataKey) => {
      const entry = [...MEGA_BY_SLUG.values()].find((m) => m.dataKey === dataKey);
      return !entry || !slugs.has(entry.slug);
    });

    expect(missing).toEqual([]);
  });

  it("still builds every sprited Reg M-A Mega (M-B is a superset, not a swap)", () => {
    const missing = [...CHAMPIONS_REG_MA_MEGAS].filter(hasMegaSprite).filter((dataKey) => {
      const entry = [...MEGA_BY_SLUG.values()].find((m) => m.dataKey === dataKey);
      return !entry || !slugs.has(entry.slug);
    });

    expect(missing).toEqual([]);
  });

  it("never builds a page for a Mega without a sprite", () => {
    for (const { pokemon } of params) {
      const entry = MEGA_BY_SLUG.get(pokemon);
      expect(entry, `unknown slug ${pokemon}`).toBeDefined();
      expect(hasMegaSprite(entry!.dataKey), `${pokemon} has no sprite`).toBe(true);
    }
  });

  it("keeps the sitemap in lockstep with the routes that are actually built", async () => {
    // No DATABASE_URL in tests, so sitemap() falls through to its static-page
    // branch — which is exactly the branch carrying the mega URLs.
    const entries = await sitemap();
    const sitemapSlugs = new Set(
      entries
        .map((e) => e.url)
        .filter((u) => u.includes("/champions/"))
        .map((u) => u.split("/champions/")[1]),
    );

    expect([...slugs].filter((s) => !sitemapSlugs.has(s))).toEqual([]);
    expect([...sitemapSlugs].filter((s) => !slugs.has(s))).toEqual([]);
  });
});
