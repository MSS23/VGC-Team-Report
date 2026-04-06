import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { extractSpecies } from "@/lib/utils/extract-species";
import { NextResponse } from "next/server";

// Spotlight report ID — set by admin
const SPOTLIGHT_ID = "TRjVuD8B";

export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "spotlight", max: 60 } });
  if (guard) return guard;

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, data, created_at, updated_at, COALESCE(view_count, 0) as view_count
      FROM shares
      WHERE id = ${SPOTLIGHT_ID} AND deleted_at IS NULL
    `;

    if (rows.length === 0) {
      return NextResponse.json({ spotlight: null });
    }

    const row = rows[0];
    const data = row.data as Record<string, unknown>;
    const paste = (data.paste as string) ?? "";

    // Check verified status
    const creatorName = (data.creatorName as string) || undefined;
    let isVerified = false;
    if (creatorName) {
      const verified = await sql`SELECT name FROM verified_creators WHERE LOWER(name) = ${creatorName.toLowerCase()}`;
      isVerified = verified.length > 0;
    }

    // Like count (total reactions)
    const likeRows = await sql`
      SELECT COUNT(*)::int as count
      FROM reactions WHERE share_id = ${SPOTLIGHT_ID}
    `;
    const likeCount = (likeRows[0]?.count as number) || 0;

    // Comment count
    const commentRows = await sql`SELECT COUNT(*)::int as count FROM comments WHERE share_id = ${SPOTLIGHT_ID}`;

    return NextResponse.json({
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
    });
  } catch (e) {
    console.error("Spotlight API error:", e);
    return NextResponse.json({ spotlight: null });
  }
}
