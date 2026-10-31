import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { extractSpecies } from "@/lib/utils/extract-species";
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from "@/lib/cache";
import { NextResponse } from "next/server";

// Spotlight report ID — set by admin
const SPOTLIGHT_ID = "TRjVuD8B";

const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "spotlight", max: 60 } });
  if (guard) return guard;

  try {
    // Serve from cache when warm — spotlight rarely changes.
    const cacheKey = CacheKeys.spotlight();
    const cached = await cacheGet<{ spotlight: unknown }>(cacheKey);
    if (cached) {
      const res = NextResponse.json(cached);
      res.headers.set("Cache-Control", CACHE_CONTROL);
      return res;
    }

    const sql = getDb();
    const rows = await sql`
      SELECT id, data, created_at, updated_at, COALESCE(view_count, 0) as view_count
      FROM shares
      WHERE id = ${SPOTLIGHT_ID} AND is_public = TRUE AND deleted_at IS NULL
    `;

    if (rows.length === 0) {
      const empty = { spotlight: null };
      await cacheSet(cacheKey, empty, CacheTTL.SPOTLIGHT);
      const res = NextResponse.json(empty);
      res.headers.set("Cache-Control", CACHE_CONTROL);
      return res;
    }

    const row = rows[0];
    const data = row.data as Record<string, unknown>;
    const paste = (data.paste as string) ?? "";
    const creatorName = (data.creatorName as string) || undefined;

    // These three lookups are independent — run them concurrently instead of
    // three sequential round-trips. The verified check is skipped when there's
    // no creator name.
    const [verified, likeRows, commentRows] = await Promise.all([
      creatorName
        ? sql`SELECT name FROM verified_creators WHERE LOWER(name) = ${creatorName.toLowerCase()}`
        : Promise.resolve([] as Array<Record<string, unknown>>),
      sql`SELECT COUNT(*)::int as count FROM reactions WHERE share_id = ${SPOTLIGHT_ID}`,
      sql`SELECT COUNT(*)::int as count FROM comments WHERE share_id = ${SPOTLIGHT_ID}`,
    ]);

    const isVerified = verified.length > 0;
    const likeCount = (likeRows[0]?.count as number) || 0;

    const result = {
      spotlight: {
        id: row.id as string,
        species: extractSpecies(paste),
        tournamentName: (data.tournamentName as string) || undefined,
        creatorName,
        placement: (data.placement as string) || undefined,
        teamSummary: (data.teamSummary as string) || undefined,
        createdAt: (row.created_at as Date).toISOString(),
        updatedAt: (row.updated_at as Date).toISOString(),
        viewCount: row.view_count as number,
        likeCount,
        commentCount: (commentRows[0]?.count as number) || undefined,
        isVerified,
      },
    };

    await cacheSet(cacheKey, result, CacheTTL.SPOTLIGHT);

    const res = NextResponse.json(result);
    res.headers.set("Cache-Control", CACHE_CONTROL);
    return res;
  } catch (e) {
    console.error("Spotlight API error:", e);
    return NextResponse.json({ spotlight: null });
  }
}
