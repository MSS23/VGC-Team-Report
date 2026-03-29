import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { extractSpecies } from "@/lib/utils/extract-species";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;
    const creatorName = decodeURIComponent(name);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`creator:${ip}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const sql = getDb();

    // Fetch public reports where this person is the creator OR a collaborator
    const rows = await sql`
      SELECT id, data, created_at, updated_at, COALESCE(view_count, 0) as view_count, 'creator' as role
      FROM shares
      WHERE is_public = TRUE AND deleted_at IS NULL AND data->>'creatorName' ILIKE ${creatorName}

      UNION

      SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count, 'collaborator' as role
      FROM shares s
      JOIN collaborators c ON c.share_id = s.id
      WHERE s.is_public = TRUE AND s.deleted_at IS NULL AND c.user_name ILIKE ${creatorName}
        AND COALESCE(c.status, 'accepted') = 'accepted'

      ORDER BY created_at DESC
    `;

    // Check verified status, profile, and follower count
    const [verifiedCheck, profileCheck, followerCheck] = await Promise.all([
      sql`SELECT name FROM verified_creators WHERE LOWER(name) = ${creatorName.toLowerCase()}`,
      sql`SELECT bio, twitter, discord, youtube, is_public FROM creator_profiles WHERE LOWER(name) = ${creatorName.toLowerCase()}`,
      sql`SELECT COUNT(*)::int as count FROM follows WHERE LOWER(creator_name) = ${creatorName.toLowerCase()}`,
    ]);
    const isVerified = verifiedCheck.length > 0;

    // If creator has set their profile to private, return early
    if (profileCheck.length > 0 && profileCheck[0].is_public === false) {
      return NextResponse.json({ creator: creatorName, isPrivate: true, reports: [] });
    }

    const profile = profileCheck.length > 0 ? {
      bio: (profileCheck[0].bio as string) || undefined,
      twitter: (profileCheck[0].twitter as string) || undefined,
      discord: (profileCheck[0].discord as string) || undefined,
      youtube: (profileCheck[0].youtube as string) || undefined,
    } : undefined;
    const followerCount = Number(followerCheck[0]?.count ?? 0);

    // Total views across all reports
    const totalViews = rows.reduce((sum, r) => sum + (Number(r.view_count) || 0), 0);

    if (rows.length === 0) {
      return NextResponse.json({ creator: creatorName, isVerified, profile, followerCount, totalReports: 0, totalReactions: 0, totalViews: 0, reports: [] });
    }

    const shareIds = rows.map((r) => r.id as string);

    // Batch reaction counts + collaborator names
    const [reactionRows, collabRows] = await Promise.all([
      sql`
        SELECT share_id, COUNT(*)::int as count
        FROM reactions
        WHERE share_id = ANY(${shareIds})
        GROUP BY share_id
      `,
      sql`
        SELECT share_id, user_name FROM collaborators
        WHERE share_id = ANY(${shareIds}) AND COALESCE(status, 'accepted') = 'accepted'
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
        reactionCount: reactionMap[row.id as string] ?? 0,
        collaborators: collabMap[row.id as string] ?? [],
        role: row.role as string,
      };
    });

    return NextResponse.json({
      creator: creatorName,
      isVerified,
      profile,
      followerCount,
      totalReports: reports.length,
      totalReactions,
      totalViews,
      reports,
    });
  } catch (e) {
    console.error("Creator API error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
