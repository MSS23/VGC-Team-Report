import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { extractSpecies } from "@/lib/utils/extract-species";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function orderSql(sql: any, sort: string) {
  if (sort === "updated") return sql`updated_at`;
  if (sort === "popular") return sql`COALESCE(view_count, 0)`;
  return sql`created_at`;
}

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

    const sql = getDb();
    const col = orderSql(sql, sort);

    // For popular sort, cursor is a number (view_count); for others, ISO timestamp
    let rows;
    if (q && cursor) {
      const searchPattern = `%${q}%`;
      rows = await sql`
        SELECT id, data, created_at, updated_at, COALESCE(view_count, 0) as view_count
        FROM shares
        WHERE is_public = TRUE
          AND ${col} < ${sort === "popular" ? parseInt(cursor, 10) : cursor}
          AND (data->>'paste' ILIKE ${searchPattern} OR data->>'tournamentName' ILIKE ${searchPattern} OR data->>'creatorName' ILIKE ${searchPattern})
        ORDER BY ${col} DESC
        LIMIT ${limit + 1}
      `;
    } else if (q) {
      const searchPattern = `%${q}%`;
      rows = await sql`
        SELECT id, data, created_at, updated_at, COALESCE(view_count, 0) as view_count
        FROM shares
        WHERE is_public = TRUE
          AND (data->>'paste' ILIKE ${searchPattern} OR data->>'tournamentName' ILIKE ${searchPattern} OR data->>'creatorName' ILIKE ${searchPattern})
        ORDER BY ${col} DESC
        LIMIT ${limit + 1}
      `;
    } else if (cursor) {
      rows = await sql`
        SELECT id, data, created_at, updated_at, COALESCE(view_count, 0) as view_count
        FROM shares
        WHERE is_public = TRUE
          AND ${col} < ${sort === "popular" ? parseInt(cursor, 10) : cursor}
        ORDER BY ${col} DESC
        LIMIT ${limit + 1}
      `;
    } else {
      rows = await sql`
        SELECT id, data, created_at, updated_at, COALESCE(view_count, 0) as view_count
        FROM shares
        WHERE is_public = TRUE
        ORDER BY ${col} DESC
        LIMIT ${limit + 1}
      `;
    }

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    // Batch-fetch social counts
    const shareIds = items.map((r) => r.id as string);
    let reactionMap: Record<string, Record<string, number>> = {};
    let commentMap: Record<string, number> = {};

    if (shareIds.length > 0) {
      const [reactionRows, commentRows] = await Promise.all([
        sql`SELECT share_id, reaction_type, COUNT(*)::int as count FROM reactions WHERE share_id = ANY(${shareIds}) GROUP BY share_id, reaction_type`,
        sql`SELECT share_id, COUNT(*)::int as count FROM comments WHERE share_id = ANY(${shareIds}) GROUP BY share_id`,
      ]);

      for (const r of reactionRows) {
        const sid = r.share_id as string;
        if (!reactionMap[sid]) reactionMap[sid] = {};
        reactionMap[sid][r.reaction_type as string] = r.count as number;
      }
      for (const r of commentRows) {
        commentMap[r.share_id as string] = r.count as number;
      }
    }

    const reports = items.map((row) => {
      const data = row.data as Record<string, unknown>;
      const paste = (data.paste as string) ?? "";
      const sid = row.id as string;
      return {
        id: sid,
        species: extractSpecies(paste),
        tournamentName: (data.tournamentName as string) || undefined,
        creatorName: (data.creatorName as string) || undefined,
        placement: (data.placement as string) || undefined,
        teamSummary: (data.teamSummary as string) || undefined,
        createdAt: (row.created_at as Date).toISOString(),
        updatedAt: (row.updated_at as Date).toISOString(),
        viewCount: row.view_count as number,
        reactionCounts: reactionMap[sid] || undefined,
        commentCount: commentMap[sid] || undefined,
      };
    });

    let nextCursor: string | null = null;
    if (hasMore) {
      const last = items[items.length - 1];
      if (sort === "popular") nextCursor = String(last.view_count);
      else if (sort === "updated") nextCursor = (last.updated_at as Date).toISOString();
      else nextCursor = (last.created_at as Date).toISOString();
    }

    return NextResponse.json({ reports, nextCursor });
  } catch (e) {
    console.error("Explore API error:", e);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
