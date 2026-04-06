import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { extractSpecies } from "@/lib/utils/extract-species";
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from "@/lib/cache";
import { captureServerEvent } from "@/lib/posthog-server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const guard = await apiGuard(request, { rateLimit: { key: "explore", max: 30 } });
    if (guard) return guard;

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "12", 10) || 12, 1), 50);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const sortParam = url.searchParams.get("sort") ?? "popular";
    const sort = ["newest", "updated", "views"].includes(sortParam) ? sortParam : "popular";
    const searchType = url.searchParams.get("searchType") ?? "all";
    const filterRegulation = url.searchParams.get("regulation") ?? "";
    const filterEventType = url.searchParams.get("eventType") ?? "";
    const filterArchetype = url.searchParams.get("archetype") ?? ""; // comma-separated
    const filterSpecies = url.searchParams.get("species") ?? ""; // comma-separated Pokemon names for multi-species filter
    const filterExcludeSpecies = url.searchParams.get("excludeSpecies") ?? ""; // comma-separated Pokemon names to exclude
    const filterPlacement = url.searchParams.get("placement") ?? ""; // e.g. "1st", "Top 4", "Top 8"
    const filterFollowing = url.searchParams.get("following") === "1";

    // ── Cache check (skip for user-specific following queries) ───────
    let cacheKey: string | null = null;
    if (!filterFollowing) {
      cacheKey = CacheKeys.explore(
        `${sort}:${q}:${searchType}:${cursor ?? ""}:${limit}:${filterRegulation}:${filterEventType}:${filterArchetype}:${filterSpecies}:${filterExcludeSpecies}:${filterPlacement}`
      );
      const cached = await cacheGet<{ reports: unknown[]; nextCursor: string | null }>(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const sql = getDb();

    // ── Following filter: fetch followed creators ────────────────────
    let followingCreators: string[] = [];
    if (filterFollowing) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const followRows = await sql`SELECT creator_name FROM follows WHERE user_id = ${userId}`;
      followingCreators = followRows.map((r) => r.creator_name as string);
      if (followingCreators.length === 0) {
        return NextResponse.json({ reports: [], nextCursor: null });
      }
    }

    const followingCondition = filterFollowing
      ? sql`AND LOWER(s.data->>'creatorName') = ANY(${followingCreators.map(n => n.toLowerCase())})`
      : sql``;

    // Build search condition based on searchType
    // Use full-text search for queries 3+ chars, fall back to ILIKE for short queries
    const searchPattern = q ? `%${q}%` : null;
    const useFts = q.length >= 3;
    // Convert query to tsquery: split words, add :* prefix matching to each
    const tsQuery = q ? q.trim().split(/\s+/).map(w => w.replace(/[^\w]/g, "")).filter(Boolean).map(w => `${w}:*`).join(" & ") : null;

    // For popular sort, we need a subquery to count likes
    // For other sorts, use the column directly
    let rows;

    // Search condition builder — uses FTS when possible, ILIKE fallback for short queries
    // When a specific searchType is selected, narrow both FTS and ILIKE to that field
    const ftsCondition = (useFts && tsQuery)
      ? (searchType === "pokemon"
          ? sql`AND to_tsvector('english', COALESCE(s.data->>'paste', '')) @@ to_tsquery('english', ${tsQuery})`
        : searchType === "tournament"
          ? sql`AND to_tsvector('english', COALESCE(s.data->>'tournamentName', '')) @@ to_tsquery('english', ${tsQuery})`
        : searchType === "creator"
          ? sql`AND to_tsvector('english', COALESCE(s.data->>'creatorName', '')) @@ to_tsquery('english', ${tsQuery})`
        : sql`AND s.search_vector @@ to_tsquery('english', ${tsQuery})`)
      : sql``;
    const ilikeFallback = (!useFts && searchPattern)
      ? (searchType === "pokemon" ? sql`AND s.data->>'paste' ILIKE ${searchPattern}`
        : searchType === "tournament" ? sql`AND s.data->>'tournamentName' ILIKE ${searchPattern}`
        : searchType === "creator" ? sql`AND s.data->>'creatorName' ILIKE ${searchPattern}`
        : sql`AND (s.data->>'paste' ILIKE ${searchPattern} OR s.data->>'tournamentName' ILIKE ${searchPattern} OR s.data->>'creatorName' ILIKE ${searchPattern})`)
      : sql``;
    const searchCondition = (useFts && tsQuery) ? ftsCondition : ilikeFallback;

    // Shared filter fragments for species and placement
    // Species filter: match each requested species in the paste text (case-insensitive)
    const speciesList = filterSpecies.split(",").map((s) => s.trim()).filter(Boolean);
    const speciesCondition = speciesList.length > 0
      ? speciesList.reduce((acc, sp) => sql`${acc} AND s.data->>'paste' ILIKE ${"%" + sp + "%"}`, sql``)
      : sql``;
    const excludeSpeciesList = filterExcludeSpecies.split(",").map((s) => s.trim()).filter(Boolean);
    const excludeSpeciesCondition = excludeSpeciesList.length > 0
      ? excludeSpeciesList.reduce((acc, sp) => sql`${acc} AND s.data->>'paste' NOT ILIKE ${"%" + sp + "%"}`, sql``)
      : sql``;
    const placementCondition = filterPlacement
      ? sql`AND s.data->>'placement' ILIKE ${"%" + filterPlacement + "%"}`
      : sql``;
    const tagFilters = sql`
      ${filterRegulation ? sql`AND s.data->'tags'->>'regulation' = ${filterRegulation}` : sql``}
      ${filterEventType ? sql`AND s.data->'tags'->>'eventType' = ${filterEventType}` : sql``}
      ${filterArchetype ? sql`AND s.data->'tags'->'archetype' ?| ${filterArchetype.split(",").filter(Boolean)}` : sql``}
      ${speciesCondition}
      ${excludeSpeciesCondition}
      ${placementCondition}
    `;

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
          ${searchCondition}
          ${tagFilters}
          ${followingCondition}
          ${cursor ? sql`AND COALESCE(rc.like_count, 0) < ${parseInt(cursor, 10)}` : sql``}
        ORDER BY COALESCE(rc.like_count, 0) DESC, s.created_at DESC
        LIMIT ${limit + 1}
      `;
    } else if (sort === "views") {
      // Sort by view count
      rows = await sql`
        SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count
        FROM shares s
        WHERE s.is_public = TRUE AND s.deleted_at IS NULL
          ${searchCondition}
          ${tagFilters}
          ${followingCondition}
          ${cursor ? sql`AND COALESCE(s.view_count, 0) < ${parseInt(cursor, 10)}` : sql``}
        ORDER BY COALESCE(s.view_count, 0) DESC, s.created_at DESC
        LIMIT ${limit + 1}
      `;
    } else {
      const col = sort === "updated" ? sql`s.updated_at` : sql`s.created_at`;

      rows = await sql`
        SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count
        FROM shares s
        WHERE s.is_public = TRUE AND s.deleted_at IS NULL
          ${searchCondition}
          ${tagFilters}
          ${followingCondition}
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

    const collabMap: Record<string, string[]> = {};
    if (shareIds.length > 0) {
      const queries: Promise<unknown>[] = [
        sql`SELECT share_id, COUNT(*)::int as count FROM reactions WHERE share_id = ANY(${shareIds}) GROUP BY share_id`,
        sql`SELECT share_id, COUNT(*)::int as count FROM comments WHERE share_id = ANY(${shareIds}) GROUP BY share_id`,
        sql`SELECT share_id, user_name FROM collaborators WHERE share_id = ANY(${shareIds}) AND COALESCE(status, 'accepted') = 'accepted'`,
      ];
      if (creatorNames.length > 0) {
        queries.push(sql`SELECT name FROM verified_creators WHERE LOWER(name) = ANY(${creatorNames.map((n) => n.toLowerCase())})`);
      }

      const [likeRows, commentRows, collabRows, verifiedRows] = await Promise.all(queries) as [
        Array<Record<string, unknown>>,
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
      for (const c of collabRows) {
        const sid = c.share_id as string;
        if (!collabMap[sid]) collabMap[sid] = [];
        collabMap[sid].push(c.user_name as string);
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
        collaborators: collabMap[sid] ?? [],
      };
    });

    let nextCursor: string | null = null;
    if (hasMore) {
      const last = items[items.length - 1];
      if (sort === "popular") nextCursor = String(last.like_count ?? 0);
      else if (sort === "views") nextCursor = String(last.view_count ?? 0);
      else if (sort === "updated") nextCursor = (last.updated_at as Date).toISOString();
      else nextCursor = (last.created_at as Date).toISOString();
    }

    const result = { reports, nextCursor };
    // Cache for 60s — short TTL keeps data fresh while reducing DB load
    // Skip cache for user-specific following queries
    if (cacheKey) {
      await cacheSet(cacheKey, result, CacheTTL.EXPLORE_LIST);
    }

    // Track searches (only when user actively searched or filtered, not browse)
    if (q || filterRegulation || filterArchetype || filterSpecies) {
      captureServerEvent(ip, "explore_searched", {
        query: q || null,
        sort,
        search_type: searchType,
        filter_regulation: filterRegulation || null,
        filter_archetype: filterArchetype || null,
        filter_species: filterSpecies || null,
        filter_placement: filterPlacement || null,
        result_count: reports.length,
        has_results: reports.length > 0,
      });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("Explore API error:", e);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
