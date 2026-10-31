import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { getPostHogServer } from "@/lib/posthog-server";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "analytics", max: 10 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDb();

    // All nine aggregates are independent per-user queries — issue them
    // concurrently instead of nine sequential round-trips to Neon.
    const [
      totalsRows,
      topByViews,
      recentReports,
      reactionTotalsRows,
      commentTotalsRows,
      saveTotalsRows,
      followerCountRows,
      monthlyActivity,
      topReactions,
    ] = await Promise.all([
      // Total stats across all user's reports
      sql`
        SELECT
          COUNT(*) as total_reports,
          COALESCE(SUM(view_count), 0) as total_views,
          COUNT(*) FILTER (WHERE is_public = TRUE) as public_reports,
          COUNT(*) FILTER (WHERE is_public = FALSE) as private_reports
        FROM shares
        WHERE owner_id = ${userId} AND deleted_at IS NULL
      `,
      // Top reports by views
      sql`
        SELECT id, data, COALESCE(view_count, 0) as view_count, is_public, created_at, updated_at
        FROM shares
        WHERE owner_id = ${userId} AND deleted_at IS NULL
        ORDER BY view_count DESC NULLS LAST
        LIMIT 5
      `,
      // Recent reports (last 5 created)
      sql`
        SELECT id, data, COALESCE(view_count, 0) as view_count, is_public, created_at
        FROM shares
        WHERE owner_id = ${userId} AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 5
      `,
      // Engagement: reactions across all reports
      sql`
        SELECT
          COUNT(*) as total_reactions,
          COUNT(DISTINCT share_id) as reports_with_reactions
        FROM reactions r
        INNER JOIN shares s ON s.id = r.share_id
        WHERE s.owner_id = ${userId} AND s.deleted_at IS NULL
      `,
      // Engagement: comments across all reports
      sql`
        SELECT
          COUNT(*) as total_comments,
          COUNT(DISTINCT share_id) as reports_with_comments
        FROM comments c
        INNER JOIN shares s ON s.id = c.share_id
        WHERE s.owner_id = ${userId} AND s.deleted_at IS NULL
      `,
      // Saves: how many times user's reports were saved by others
      sql`
        SELECT
          COUNT(*) as total_saves,
          COUNT(DISTINCT share_id) as reports_saved
        FROM saved_reports sr
        INNER JOIN shares s ON s.id = sr.share_id
        WHERE s.owner_id = ${userId} AND sr.user_id != ${userId}
      `,
      // Followers count — get creator name from user's reports, then count follows
      sql`
        SELECT COUNT(*) as followers FROM follows
        WHERE LOWER(creator_name) = LOWER(
          COALESCE(
            (SELECT name FROM creator_profiles WHERE LOWER(name) = LOWER(
              (SELECT data->>'creatorName' FROM shares WHERE owner_id = ${userId} AND deleted_at IS NULL LIMIT 1)
            )),
            (SELECT data->>'creatorName' FROM shares WHERE owner_id = ${userId} AND deleted_at IS NULL LIMIT 1)
          )
        )
      `,
      // Reports created per month (last 6 months)
      sql`
        SELECT
          to_char(created_at, 'YYYY-MM') as month,
          COUNT(*) as reports_created
        FROM shares
        WHERE owner_id = ${userId} AND deleted_at IS NULL
          AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY to_char(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `,
      // Top reaction types
      sql`
        SELECT r.reaction_type, COUNT(*) as count
        FROM reactions r
        INNER JOIN shares s ON s.id = r.share_id
        WHERE s.owner_id = ${userId} AND s.deleted_at IS NULL
        GROUP BY r.reaction_type
        ORDER BY count DESC
        LIMIT 5
      `,
    ]);

    const [totals] = totalsRows;
    const [reactionTotals] = reactionTotalsRows;
    const [commentTotals] = commentTotalsRows;
    const [saveTotals] = saveTotalsRows;
    const [followerCount] = followerCountRows;

    const formatReport = (row: Record<string, unknown>) => {
      const data = row.data as Record<string, unknown>;
      const paste = (data.paste as string) ?? "";
      return {
        id: row.id as string,
        species: extractSpecies(paste),
        tournamentName: (data.tournamentName as string) || undefined,
        creatorName: (data.creatorName as string) || undefined,
        placement: (data.placement as string) || undefined,
        viewCount: row.view_count as number,
        isPublic: row.is_public as boolean,
        createdAt: (row.created_at as Date).toISOString(),
      };
    };

    // Enrich PostHog user profile with latest stats (fire-and-forget)
    const ph = getPostHogServer();
    if (ph) {
      ph.identify({
        distinctId: userId,
        properties: {
          total_reports: Number(totals.total_reports),
          public_reports: Number(totals.public_reports),
          total_views: Number(totals.total_views),
          total_reactions: Number(reactionTotals.total_reactions),
          total_comments: Number(commentTotals.total_comments),
          total_saves: Number(saveTotals.total_saves),
          followers: Number(followerCount?.followers ?? 0),
        },
      });
    }

    return NextResponse.json({
      overview: {
        totalReports: Number(totals.total_reports),
        totalViews: Number(totals.total_views),
        publicReports: Number(totals.public_reports),
        privateReports: Number(totals.private_reports),
        totalReactions: Number(reactionTotals.total_reactions),
        totalComments: Number(commentTotals.total_comments),
        totalSaves: Number(saveTotals.total_saves),
        followers: Number(followerCount?.followers ?? 0),
      },
      topByViews: topByViews.map(formatReport),
      recentReports: recentReports.map(formatReport),
      monthlyActivity: monthlyActivity.map((r) => ({
        month: r.month as string,
        count: Number(r.reports_created),
      })),
      topReactions: topReactions.map((r) => ({
        type: r.reaction_type as string,
        count: Number(r.count),
      })),
      engagement: {
        reportsWithReactions: Number(reactionTotals.reports_with_reactions),
        reportsWithComments: Number(commentTotals.reports_with_comments),
        reportsSaved: Number(saveTotals.reports_saved),
      },
    });
  } catch (e) {
    console.error("Analytics error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
