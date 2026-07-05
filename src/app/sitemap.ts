import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { getRegMAMegasWithSprites } from "@/lib/data/mega-pokemon";

const BASE = "https://pokemonvgcteamreport.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1.0, lastModified: now },
    { url: `${BASE}/explore`, changeFrequency: "daily", priority: 0.9, lastModified: now },
    { url: `${BASE}/champions`, changeFrequency: "weekly", priority: 0.9, lastModified: now },
    { url: `${BASE}/faq`, changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: `${BASE}/feedback`, changeFrequency: "monthly", priority: 0.6, lastModified: now },
    { url: `${BASE}/tournaments`, changeFrequency: "weekly", priority: 0.7, lastModified: now },
    { url: `${BASE}/compare`, changeFrequency: "monthly", priority: 0.6, lastModified: now },
    { url: `${BASE}/changelog`, changeFrequency: "monthly", priority: 0.3, lastModified: now },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.1, lastModified: now },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.1, lastModified: now },
    ...getRegMAMegasWithSprites().map((m) => ({
      url: `${BASE}/champions/${m.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      lastModified: now,
    })),
  ];

  try {
    const sql = getDb();
    const shares = await sql`
      SELECT id, updated_at FROM shares
      WHERE is_public = TRUE AND deleted_at IS NULL
      ORDER BY created_at DESC
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
