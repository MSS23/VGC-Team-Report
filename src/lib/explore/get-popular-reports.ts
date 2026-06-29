import { getDb } from "@/lib/db";

/**
 * Server-side shape of a popular public report used for SEO/AEO JSON-LD.
 * Kept minimal — just the fields needed for the ItemList schema on /explore.
 */
export interface PopularReport {
  id: string;
  title: string;
  creatorName: string | null;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
}

/**
 * Fetch the top N popular public reports for the explore page's ItemList
 * JSON-LD block. Mirrors the "popular" sort in /api/explore: orders by
 * total reaction count (likes) DESC with created_at as deterministic
 * tiebreaker. Public + non-deleted only — no auth, safe to call from a
 * Server Component during ISR.
 *
 * Wrapped in a try so a transient DB blip doesn't 500 the whole /explore
 * page; an empty list just means no ItemList schema is emitted that build.
 */
export async function getPopularReports(limit = 20): Promise<PopularReport[]> {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT s.id, s.data, s.created_at, s.updated_at,
             COALESCE(s.view_count, 0) as view_count,
             COALESCE(rc.like_count, 0) as like_count
      FROM shares s
      LEFT JOIN (
        SELECT share_id, COUNT(*)::int as like_count
        FROM reactions
        GROUP BY share_id
      ) rc ON rc.share_id = s.id
      WHERE s.is_public = TRUE AND s.deleted_at IS NULL
      ORDER BY COALESCE(rc.like_count, 0) DESC, s.created_at DESC
      LIMIT ${limit}
    `;

    return rows.map((row) => {
      const data = (row.data ?? {}) as Record<string, unknown>;
      const tournamentName = (data.tournamentName as string) || "";
      const creatorName = (data.creatorName as string) || "";
      const teamSummary = (data.teamSummary as string) || "";
      // Prefer tournament name, fall back to creator's team, then a generic label.
      // Schema consumers (LLMs, Google) need a human-readable name for each item.
      const title =
        tournamentName ||
        (creatorName ? `${creatorName}'s VGC Team` : "") ||
        (teamSummary ? teamSummary.slice(0, 80) : "") ||
        "VGC Team Report";
      return {
        id: row.id as string,
        title,
        creatorName: creatorName || null,
        createdAt: (row.created_at as Date).toISOString(),
        updatedAt: (row.updated_at as Date).toISOString(),
        viewCount: (row.view_count as number) ?? 0,
        likeCount: (row.like_count as number) ?? 0,
      };
    });
  } catch (e) {
    console.error("getPopularReports failed:", e);
    return [];
  }
}
