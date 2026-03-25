import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

const BASE = "https://pokemonvgcteamreport.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/explore`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/changelog`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.1 },
  ];

  try {
    const sql = getDb();

    // Fetch all public shares (id + updated_at)
    const shares = await sql`
      SELECT id, updated_at FROM shares
      WHERE is_public = TRUE AND deleted_at IS NULL
      ORDER BY updated_at DESC
      LIMIT 5000
    `;

    const sharePages: MetadataRoute.Sitemap = shares.map((row) => ({
      url: `${BASE}/s/${row.id}`,
      lastModified: new Date(row.updated_at as string),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // Fetch distinct creator names from public shares
    const creators = await sql`
      SELECT DISTINCT data->>'creatorName' as name
      FROM shares
      WHERE is_public = TRUE AND deleted_at IS NULL AND data->>'creatorName' IS NOT NULL AND data->>'creatorName' != ''
    `;

    const creatorPages: MetadataRoute.Sitemap = creators.map((row) => ({
      url: `${BASE}/creator/${encodeURIComponent(row.name as string)}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...sharePages, ...creatorPages];
  } catch (e) {
    console.error("Sitemap generation error:", e);
    // Return static pages even if DB fails
    return staticPages;
  }
}
