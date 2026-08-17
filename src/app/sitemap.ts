import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { getRegMBMegasWithSprites } from "@/lib/data/mega-pokemon";

const BASE = "https://pokemonvgcteamreport.com";

// New public reports and creator pages should become discoverable without
// waiting for the next production deployment.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // These static entries deliberately carry NO `lastModified` — do not "restore" it.
  // 83d195a stamped every entry with a build-time `new Date()`; fe70914 removed it
  // in the same change that made this route revalidate hourly (above). Together
  // those meant every static URL would advertise a brand-new modification date
  // every hour, telling crawlers the whole site had changed when nothing had —
  // which devalues the signal for the pages that genuinely did change. Omitting
  // the field lets Google fall back to its own change detection, which is the
  // correct behaviour for content that only moves on deploy.
  //
  // Only entries whose timestamp comes from real data carry `lastModified` — see
  // the share/creator pages below, which use `shares.updated_at` from the DB.
  // If static pages ever need it, derive it from file/content mtime, never `new Date()`.
  // (Reviewed under VGC-273: the fe70914 revert was correct and is intentional.)
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/explore`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/champions`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/faq`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/tools/ev-to-sp`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/feedback`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/tournaments`, changeFrequency: "weekly", priority: 0.7 },
    // /compare is intentionally noindex (robots: { index: false }) — do not
    // re-add it here; sitemapping a noindex page sends crawlers
    // contradictory signals. (VGC-272)
    { url: `${BASE}/changelog`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/support`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.1 },
    // Reg M-B is the current Champions regulation and a superset of M-A, so
    // this covers every legal Mega with a usable sprite (72), not just the 58
    // that were M-A legal. Sprite-less Megas are deliberately excluded — they
    // have no landing page to point at.
    ...getRegMBMegasWithSprites().map((m) => ({
      url: `${BASE}/champions/${m.slug}`,
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
