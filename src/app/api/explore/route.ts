import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { extractSpecies } from "@/lib/utils/extract-species";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`explore:${ip}`, 30, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "12", 10) || 12, 1), 50);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const sortParam = url.searchParams.get("sort") ?? "newest";
    const sort = ["updated", "popular"].includes(sortParam) ? sortParam : "newest";
    const searchType = url.searchParams.get("searchType") ?? "all";
    const filterRegulation = url.searchParams.get("regulation") ?? "";
    const filterEventType = url.searchParams.get("eventType") ?? "";
    const filterArchetype = url.searchParams.get("archetype") ?? ""; // comma-separated

    const sql = getDb();

    // Build search condition based on searchType
    const searchPattern = q ? `%${q}%` : null;

    // For popular sort, we need a subquery to count likes
    // For other sorts, use the column directly
    let rows;

    if (sort === "popular") {
      // Sort by total reaction (like) count
      rows = await sql`
        SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count,
               COALESCE(rc.like_count, 0) as like_count
        FROM shares s
        LEFT JOIN (
          SELECT share_id, COUNT(*)::int as like_count
          FROM reactions
          GROUP BY share_id
        ) rc ON rc.share_id = s.id
        WHERE s.is_public = TRUE AND s.deleted_at IS NULL
          ${searchPattern && searchType === "pokemon" ? sql`AND s.data->>'paste' ILIKE ${searchPattern}` : sql``}
          ${searchPattern && searchType === "tournament" ? sql`AND s.data->>'tournamentName' ILIKE ${searchPattern}` : sql``}
          ${searchPattern && searchType === "creator" ? sql`AND s.data->>'creatorName' ILIKE ${searchPattern}` : sql``}
          ${searchPattern && searchType === "all" ? sql`AND (s.data->>'paste' ILIKE ${searchPattern} OR s.data->>'tournamentName' ILIKE ${searchPattern} OR s.data->>'creatorName' ILIKE ${searchPattern})` : sql``}
          ${filterRegulation ? sql`AND s.data->'tags'->>'regulation' = ${filterRegulation}` : sql``}
          ${filterEventType ? sql`AND s.data->'tags'->>'eventType' = ${filterEventType}` : sql``}
          ${filterArchetype ? sql`AND s.data->'tags'->'archetype' ?| ${filterArchetype.split(",").filter(Boolean)}` : sql``}
          ${cursor ? sql`AND COALESCE(rc.like_count, 0) < ${parseInt(cursor, 10)}` : sql``}
        ORDER BY COALESCE(rc.like_count, 0) DESC, s.created_at DESC
        LIMIT ${limit + 1}
      `;
    } else {
      const col = sort === "updated" ? sql`s.updated_at` : sql`s.created_at`;

      rows = await sql`
        SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count
        FROM shares s
        WHERE s.is_public = TRUE AND s.deleted_at IS NULL
          ${searchPattern && searchType === "pokemon" ? sql`AND s.data->>'paste' ILIKE ${searchPattern}` : sql``}
          ${searchPattern && searchType === "tournament" ? sql`AND s.data->>'tournamentName' ILIKE ${searchPattern}` : sql``}
          ${searchPattern && searchType === "creator" ? sql`AND s.data->>'creatorName' ILIKE ${searchPattern}` : sql``}
          ${searchPattern && searchType === "all" ? sql`AND (s.data->>'paste' ILIKE ${searchPattern} OR s.data->>'tournamentName' ILIKE ${searchPattern} OR s.data->>'creatorName' ILIKE ${searchPattern})` : sql``}
          ${filterRegulation ? sql`AND s.data->'tags'->>'regulation' = ${filterRegulation}` : sql``}
          ${filterEventType ? sql`AND s.data->'tags'->>'eventType' = ${filterEventType}` : sql``}
          ${filterArchetype ? sql`AND s.data->'tags'->'archetype' ?| ${filterArchetype.split(",").filter(Boolean)}` : sql``}
          ${cursor ? sql`AND ${col} < ${cursor}` : sql``}
        ORDER BY ${col} DESC
        LIMIT ${limit + 1}
      `;
    }

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    // Batch-fetch social counts
    const shareIds = items.map((r) => r.id as string);
    let likeMap: Record<string, number> = {};
    let commentMap: Record<string, number> = {};

    // Collect unique creator names for verification check
    const creatorNames = [...new Set(items.map((r) => ((r.data as Record<string, unknown>).creatorName as string)).filter(Boolean))];
    let verifiedSet = new Set<string>();

    if (shareIds.length > 0) {
      const queries: Promise<unknown>[] = [
        sql`SELECT share_id, COUNT(*)::int as count FROM reactions WHERE share_id = ANY(${shareIds}) GROUP BY share_id`,
        sql`SELECT share_id, COUNT(*)::int as count FROM comments WHERE share_id = ANY(${shareIds}) GROUP BY share_id`,
      ];
      if (creatorNames.length > 0) {
        queries.push(sql`SELECT name FROM verified_creators WHERE LOWER(name) = ANY(${creatorNames.map((n) => n.toLowerCase())})`);
      }

      const [likeRows, commentRows, verifiedRows] = await Promise.all(queries) as [
        Array<Record<string, unknown>>,
        Array<Record<string, unknown>>,
        Array<Record<string, unknown>>?,
      ];

      for (const r of likeRows) {
        const sid = r.share_id as string;
        likeMap[sid] = (likeMap[sid] ?? 0) + (r.count as number);
      }
      for (const r of commentRows) {
        commentMap[r.share_id as string] = r.count as number;
      }
      if (verifiedRows) {
        verifiedSet = new Set(verifiedRows.map((r) => (r.name as string).toLowerCase()));
      }
    }

    const reports = items.map((row) => {
      const data = row.data as Record<string, unknown>;
      const paste = (data.paste as string) ?? "";
      const sid = row.id as string;
      const creatorNameStr = (data.creatorName as string) || undefined;
      return {
        id: sid,
        species: extractSpecies(paste),
        tournamentName: (data.tournamentName as string) || undefined,
        creatorName: creatorNameStr,
        placement: (data.placement as string) || undefined,
        teamSummary: (data.teamSummary as string) || undefined,
        createdAt: (row.created_at as Date).toISOString(),
        updatedAt: (row.updated_at as Date).toISOString(),
        viewCount: row.view_count as number,
        likeCount: likeMap[sid] ?? 0,
        commentCount: commentMap[sid] || undefined,
        isVerified: creatorNameStr ? verifiedSet.has(creatorNameStr.toLowerCase()) : false,
        tags: (data.tags as Record<string, unknown>) || undefined,
      };
    });

    let nextCursor: string | null = null;
    if (hasMore) {
      const last = items[items.length - 1];
      if (sort === "popular") nextCursor = String(last.like_count ?? 0);
      else if (sort === "updated") nextCursor = (last.updated_at as Date).toISOString();
      else nextCursor = (last.created_at as Date).toISOString();
    }

    return NextResponse.json({ reports, nextCursor });
  } catch (e) {
    console.error("Explore API error:", e);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
