import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { extractSpecies } from "@/lib/utils/extract-species";
import { cacheGet, cacheSet } from "@/lib/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CACHE_KEY = "champions:meta:snapshot";
const CACHE_TTL = 300; // 5 minutes
const MIN_REPORTS = 5;
const TOP_N = 20;

export interface MetaEntry {
  name: string;
  count: number;
  percentage: number;
}

export interface ChampionsMetaResult {
  entries: MetaEntry[];
  totalReports: number;
  hasEnoughData: boolean;
}

export async function GET(request: Request) {
  try {
    const guard = await apiGuard(request, { rateLimit: { key: "champions-meta", max: 60 } });
    if (guard) return guard;

    // Check cache first
    const cached = await cacheGet<ChampionsMetaResult>(CACHE_KEY);
    if (cached) {
      const res = NextResponse.json(cached);
      res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      return res;
    }

    const sql = getDb();

    const QUERY_LIMIT = 500;

    // Query public Champions-format reports — capped to avoid unbounded memory usage
    const rows = await sql`
      SELECT data->>'paste' AS paste
      FROM shares
      WHERE is_public = TRUE
        AND deleted_at IS NULL
        AND (
          data->>'regulation' ILIKE '%champion%'
          OR data->>'regulation' ILIKE '%reg-m%'
          OR data->'tags'->>'regulation' ILIKE '%champion%'
          OR data->'tags'->>'regulation' ILIKE '%reg-m%'
        )
      ORDER BY created_at DESC
      LIMIT ${QUERY_LIMIT}
    `;

    if (rows.length === 0) {
      const empty: ChampionsMetaResult = { entries: [], totalReports: 0, hasEnoughData: false };
      await cacheSet(CACHE_KEY, empty, CACHE_TTL);
      const res = NextResponse.json(empty);
      res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      return res;
    }

    if (rows.length >= QUERY_LIMIT) {
      console.warn(
        `[champions/meta] Query hit the ${QUERY_LIMIT}-report limit — dataset may have grown; consider raising QUERY_LIMIT or pushing aggregation into SQL.`
      );
    }

    const totalReports = rows.length;
    const hasEnoughData = totalReports >= MIN_REPORTS;

    let entries: MetaEntry[] = [];

    if (hasEnoughData) {
      // Count species usage across all reports
      const usageMap = new Map<string, number>();
      for (const row of rows) {
        const paste = (row.paste as string) ?? "";
        if (!paste.trim()) continue;
        const species = extractSpecies(paste);
        // Use a Set to count each species only once per team
        const seen = new Set<string>();
        for (const sp of species) {
          const key = sp.trim();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          usageMap.set(key, (usageMap.get(key) ?? 0) + 1);
        }
      }

      // Sort by count descending, take top N
      const sorted = [...usageMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_N);

      entries = sorted.map(([name, count]) => ({
        name,
        count,
        percentage: totalReports > 0 ? Math.round((count / totalReports) * 100) : 0,
      }));
    }

    const result: ChampionsMetaResult = { entries, totalReports, hasEnoughData };

    await cacheSet(CACHE_KEY, result, CACHE_TTL);

    const res = NextResponse.json(result);
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res;
  } catch (e) {
    console.error("Champions meta API error:", e);
    return NextResponse.json({ error: "Failed to load Champions meta data" }, { status: 500 });
  }
}
