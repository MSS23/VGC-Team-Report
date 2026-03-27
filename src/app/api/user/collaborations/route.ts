import { getDb } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { extractSpecies } from "@/lib/utils/extract-species";
import { NextResponse } from "next/server";

/**
 * GET /api/user/collaborations
 * Returns reports where the current user is a collaborator (not owner).
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const sql = getDb();
    const rows = await sql`
      SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count,
             s.is_public, c.created_at as invited_at
      FROM collaborators c
      JOIN shares s ON s.id = c.share_id
      WHERE c.user_id = ${userId} AND s.deleted_at IS NULL
      ORDER BY s.updated_at DESC
      LIMIT 50
    `;

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
        invitedAt: (row.invited_at as Date).toISOString(),
        tags: (data.tags as Record<string, unknown>) || undefined,
      };
    });

    return NextResponse.json({ reports });
  } catch (e) {
    console.error("Collaborations fetch error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
