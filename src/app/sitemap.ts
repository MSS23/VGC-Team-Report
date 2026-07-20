import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { getRegMAMegasWithSprites } from "@/lib/data/mega-pokemon";

const BASE = "https://pokemonvgcteamreport.com";

// New public reports and creator pages should become discoverable without
// waiting for the next production deployment.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Sitemap file is regenerated hourly (see `revalidate` above), so stamping
  // every static entry with `now` at generation time gives search engines a
  // fresh crawl hint on each pass. Previously these entries had no
  // lastModified at all, which dropped the signal engines use to prioritise
  // recrawls.
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/champions`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/feedback`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/tournaments`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/compare`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/changelog`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/support`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
    ...getRegMAMegasWithSprites().map((m) => ({
      url: `${BASE}/champions/${m.slug}`,
      lastModified: now,
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
