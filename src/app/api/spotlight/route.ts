import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { NextResponse } from "next/server";

// Spotlight report ID — set by admin
const SPOTLIGHT_ID = "TRjVuD8B";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, data, created_at, updated_at, COALESCE(view_count, 0) as view_count
      FROM shares
      WHERE id = ${SPOTLIGHT_ID}
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

    // Reaction counts
    const reactionRows = await sql`
      SELECT reaction_type, COUNT(*)::int as count
      FROM reactions WHERE share_id = ${SPOTLIGHT_ID}
      GROUP BY reaction_type
    `;
    const reactionCounts: Record<string, number> = {};
    for (const r of reactionRows) {
      reactionCounts[r.reaction_type as string] = r.count as number;
    }

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
        reactionCounts: Object.keys(reactionCounts).length > 0 ? reactionCounts : undefined,
        commentCount: (commentRows[0]?.count as number) || undefined,
        isVerified,
      },
    });
  } catch (e) {
    console.error("Spotlight API error:", e);
    return NextResponse.json({ spotlight: null });
  }
}
