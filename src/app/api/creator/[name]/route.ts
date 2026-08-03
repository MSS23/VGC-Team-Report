import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { extractSpecies } from "@/lib/utils/extract-species";
import { cacheGet, cacheSet } from "@/lib/cache";
import { NextResponse } from "next/server";

// Public creator pages are hit repeatedly. Short-TTL Redis cache + a matching
// CDN window keeps the DB (creator UNION + reaction/collaborator batches) cold
// between refreshes. Inline key/TTL so we don't have to touch shared cache.ts.
const CREATOR_CACHE_TTL = 60; // seconds
const CREATOR_CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=300";

// Hard ceiling on how many reports one creator page loads. The UNION below
// used to be unbounded, so a single request could pull the entire public
// corpus into memory (and into the Redis cache entry). No real creator is
// anywhere near this; the page is newest-first, so the tail is the part that
// gets dropped.
const MAX_CREATOR_REPORTS = 200;

// Creator names are display strings typed into the "By" box. Anything longer
// than this is not a name — reject it before it becomes a cache key.
const MAX_CREATOR_NAME_LENGTH = 100;

function creatorResponse(payload: unknown) {
  const res = NextResponse.json(payload);
  res.headers.set("Cache-Control", CREATOR_CACHE_CONTROL);
  // Explicit CDN headers so Vercel's edge actually caches this (some setups
  // ignore s-maxage from Cache-Control alone). Mirrors share/explore routes.
  res.headers.set("CDN-Cache-Control", CREATOR_CACHE_CONTROL);
  res.headers.set("Vercel-CDN-Cache-Control", CREATOR_CACHE_CONTROL);
  return res;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;
    const creatorName = decodeURIComponent(name);
    const guard = await apiGuard(request, { rateLimit: { key: "creator", max: 30 } });
    if (guard) return guard;

    if (!creatorName.trim() || creatorName.length > MAX_CREATOR_NAME_LENGTH) {
      return NextResponse.json({ error: "Invalid creator name" }, { status: 400 });
    }
    const creatorNameLower = creatorName.toLowerCase();

    // Serve from cache when warm.
    const cacheKey = `creator:${creatorName}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      return creatorResponse(cached);
    }

    const sql = getDb();

    // Fetch public reports where this person is the creator OR a collaborator.
    // Matched as a case-insensitive LITERAL, not an ILIKE pattern: the name
    // comes straight off the URL path, and as a pattern `%` matched every
    // public report in the table. `=` on LOWER() is what the verified/profile/
    // follower lookups below already do, and for a name with no wildcards in
    // it the two are equivalent — so legitimate creator pages are unchanged.
    const rows = await sql`
      SELECT id, data, created_at, updated_at, COALESCE(view_count, 0) as view_count, 'creator' as role
      FROM shares
      WHERE is_public = TRUE AND deleted_at IS NULL AND LOWER(data->>'creatorName') = ${creatorNameLower}

      UNION

      SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count, 'collaborator' as role
      FROM shares s
      JOIN collaborators c ON c.share_id = s.id
      WHERE s.is_public = TRUE AND s.deleted_at IS NULL AND LOWER(c.user_name) = ${creatorNameLower}
        AND COALESCE(c.status, 'accepted') = 'accepted'

      ORDER BY created_at DESC
      LIMIT ${MAX_CREATOR_REPORTS}
    `;

    // Check verified status, profile, and follower count
    const [verifiedCheck, profileCheck, followerCheck] = await Promise.all([
      sql`SELECT name FROM verified_creators WHERE LOWER(name) = ${creatorNameLower} LIMIT 1`,
      sql`SELECT bio, twitter, discord, youtube, is_public, avatar_url FROM creator_profiles WHERE LOWER(name) = ${creatorNameLower} LIMIT 1`,
      sql`SELECT COUNT(*)::int as count FROM follows WHERE LOWER(creator_name) = ${creatorNameLower}`,
    ]);
    const isVerified = verifiedCheck.length > 0;

    // If creator has set their profile to private, return early
    if (profileCheck.length > 0 && profileCheck[0].is_public === false) {
      const privatePayload = { creator: creatorName, isPrivate: true, reports: [] };
      await cacheSet(cacheKey, privatePayload, CREATOR_CACHE_TTL);
      return creatorResponse(privatePayload);
    }

    const profile = profileCheck.length > 0 ? {
      bio: (profileCheck[0].bio as string) || undefined,
      twitter: (profileCheck[0].twitter as string) || undefined,
      discord: (profileCheck[0].discord as string) || undefined,
      youtube: (profileCheck[0].youtube as string) || undefined,
      avatarUrl: (profileCheck[0].avatar_url as string) || undefined,
    } : undefined;
    const followerCount = Number(followerCheck[0]?.count ?? 0);

    // Total views across all reports
    const totalViews = rows.reduce((sum, r) => sum + (Number(r.view_count) || 0), 0);

    if (rows.length === 0) {
      const emptyPayload = { creator: creatorName, isVerified, profile, followerCount, totalReports: 0, totalReactions: 0, totalViews: 0, reports: [] };
      await cacheSet(cacheKey, emptyPayload, CREATOR_CACHE_TTL);
      return creatorResponse(emptyPayload);
    }

    const shareIds = rows.map((r) => r.id as string);

    // Batch reaction counts + collaborator names. Both are bounded by the
    // capped shareIds list above; the explicit LIMITs keep the collaborator
    // fan-out (many rows per share) bounded too.
    const [reactionRows, collabRows] = await Promise.all([
      sql`
        SELECT share_id, COUNT(*)::int as count
        FROM reactions
        WHERE share_id = ANY(${shareIds})
        GROUP BY share_id
        LIMIT ${MAX_CREATOR_REPORTS}
      `,
      sql`
        SELECT share_id, user_name FROM collaborators
        WHERE share_id = ANY(${shareIds}) AND COALESCE(status, 'accepted') = 'accepted'
        LIMIT ${MAX_CREATOR_REPORTS * 10}
      `,
    ]);

    const reactionMap: Record<string, number> = {};
    for (const r of reactionRows) {
      reactionMap[r.share_id as string] = r.count as number;
    }

    const collabMap: Record<string, string[]> = {};
    for (const c of collabRows) {
      const sid = c.share_id as string;
      if (!collabMap[sid]) collabMap[sid] = [];
      collabMap[sid].push(c.user_name as string);
    }

    const totalReactions = Object.values(reactionMap).reduce((a, b) => a + b, 0);

    const reports = rows.map((row) => {
      const data = row.data as Record<string, unknown>;
      const paste = (data.paste as string) ?? "";
      return {
        id: row.id as string,
        species: extractSpecies(paste),
        tournamentName: (data.tournamentName as string) || undefined,
        creatorName: (data.creatorName as string) || undefined,
        placement: (data.placement as string) || undefined,
        teamSummary: (data.teamSummary as string) || undefined,
        createdAt: (row.created_at as Date).toISOString(),
        updatedAt: (row.updated_at as Date).toISOString(),
        viewCount: row.view_count as number,
        likeCount: reactionMap[row.id as string] ?? 0,
        collaborators: collabMap[row.id as string] ?? [],
        role: row.role as string,
      };
    });

    const payload = {
      creator: creatorName,
      isVerified,
      profile,
      followerCount,
      totalReports: reports.length,
      totalReactions,
      totalViews,
      reports,
    };
    await cacheSet(cacheKey, payload, CREATOR_CACHE_TTL);
    return creatorResponse(payload);
  } catch (e) {
    console.error("Creator API error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
