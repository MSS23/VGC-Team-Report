import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { getRegMBMegasWithSprites } from "@/lib/data/mega-pokemon";

const BASE = "https://pokemonvgcteamreport.com";

// New public reports and creator pages should become discoverable without
// waiting for the next production deployment.
export const revalidate = 3600;

// Content revision dates for the hand-authored routes.
//
// These are deliberately CONSTANTS, not `new Date()`. The sitemap revalidates
// hourly, so a render-clock timestamp would tell crawlers that all 83
// hand-authored URLs changed every hour — Google learns to ignore
// `lastModified` when it is obviously not a real change signal. They are also
// not read from Postgres: Neon is on the 512MB free tier and these pages have
// no per-page row to query, so a DB round-trip would buy nothing.
//
// Bump the relevant constant when you actually change that content.
const STATIC_PAGES_REVISED = new Date("2026-10-05");
// Covers the Mega landing pages as a cluster — bump it when
// MEGA_POKEMON_LIST or the landing-page template changes (e.g. a new
// regulation's Megas being added).
const MEGA_PAGES_REVISED = new Date("2026-10-05");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: STATIC_PAGES_REVISED, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/explore`, lastModified: STATIC_PAGES_REVISED, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/champions`, lastModified: STATIC_PAGES_REVISED, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/faq`, lastModified: STATIC_PAGES_REVISED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/tools/ev-to-sp`, lastModified: STATIC_PAGES_REVISED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/feedback`, lastModified: STATIC_PAGES_REVISED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/tournaments`, lastModified: STATIC_PAGES_REVISED, changeFrequency: "weekly", priority: 0.7 },
    // /compare is intentionally noindex (robots: { index: false }) — do not
    // re-add it here; sitemapping a noindex page sends crawlers
    // contradictory signals. (VGC-272)
    { url: `${BASE}/changelog`, lastModified: STATIC_PAGES_REVISED, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/support`, lastModified: STATIC_PAGES_REVISED, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy`, lastModified: STATIC_PAGES_REVISED, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/terms`, lastModified: STATIC_PAGES_REVISED, changeFrequency: "yearly", priority: 0.1 },
    // Reg M-B is the current Champions regulation and a superset of M-A, so
    // this covers every legal Mega with a usable sprite (72), not just the 58
    // that were M-A legal. Sprite-less Megas are deliberately excluded — they
    // have no landing page to point at.
    ...getRegMBMegasWithSprites().map((m) => ({
      url: `${BASE}/champions/${m.slug}`,
      lastModified: MEGA_PAGES_REVISED,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  try {
    const sql = getDb();
    const shares = await sql`
      SELECT id, updated_at FROM shares
      WHERE is_public = TRUE AND deleted_at IS NULL
      ORDER BY updated_at DESC
      LIMIT 5000
    `;
    const sharePages: MetadataRoute.Sitemap = shares.map((row) => ({
      url: `${BASE}/s/${row.id}`,
      lastModified: new Date(row.updated_at as string),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
    const creators = await sql`
      SELECT data->>'creatorName' as name, MAX(updated_at) as last_modified
      FROM shares
      WHERE is_public = TRUE AND deleted_at IS NULL AND data->>'creatorName' IS NOT NULL AND data->>'creatorName' != ''
      GROUP BY data->>'creatorName'
      ORDER BY MAX(updated_at) DESC
      LIMIT 5000
    `;
    const creatorPages: MetadataRoute.Sitemap = creators.map((row) => ({
      url: `${BASE}/creator/${encodeURIComponent(row.name as string)}`,
      lastModified: new Date(row.last_modified as string),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
    return [...staticPages, ...sharePages, ...creatorPages];
  } catch (e) {
    console.error("Sitemap generation error:", e);
    return staticPages;
  }
}
