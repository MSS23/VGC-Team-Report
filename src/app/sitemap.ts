import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { getRegMBMegas, hasMegaSprite } from "@/lib/data/mega-pokemon";

const BASE = "https://pokemonvgcteamreport.com";

// New public reports and creator pages should become discoverable without
// waiting for the next production deployment.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/explore`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/champions`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/faq`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/feedback`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/tournaments`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/compare`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/changelog`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/support`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.1 },
    // Must stay in lockstep with generateStaticParams in
    // src/app/champions/[pokemon]/page.tsx: Reg M-B legal (a superset of Reg
    // M-A) AND sprited. Listing anything outside that set would put 404s in
    // the sitemap; listing less would hide the Reg M-B Mega pages from Google.
    ...getRegMBMegas()
      .filter((m) => hasMegaSprite(m.dataKey))
      .map((m) => ({
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
