import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getDb();

    // Get reports from followed creators (last 30 days, max 20)
    const rows = await sql`
      SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count
      FROM shares s
      JOIN follows f ON LOWER(s.data->>'creatorName') = LOWER(f.creator_name)
      WHERE f.user_id = ${userId}
        AND s.is_public = TRUE
        AND s.created_at > NOW() - INTERVAL '30 days'
      ORDER BY s.created_at DESC
      LIMIT 20
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
        createdAt: (row.created_at as Date).toISOString(),
        viewCount: row.view_count as number,
      };
    });

    return NextResponse.json({ reports });
  } catch (e) {
    console.error("Feed error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
