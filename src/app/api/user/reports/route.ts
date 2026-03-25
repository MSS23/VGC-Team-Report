import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const showTrash = request.nextUrl.searchParams.get("trash") === "1";
    const sql = getDb();

    const rows = showTrash
      ? await sql`
          SELECT id, edit_token, data, created_at, updated_at, COALESCE(view_count, 0) as view_count, is_public, deleted_at
          FROM shares
          WHERE owner_id = ${userId} AND deleted_at IS NOT NULL
          ORDER BY deleted_at DESC
        `
      : await sql`
          SELECT id, edit_token, data, created_at, updated_at, COALESCE(view_count, 0) as view_count, is_public
          FROM shares
          WHERE owner_id = ${userId} AND deleted_at IS NULL
          ORDER BY updated_at DESC
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
        isPublic: row.is_public as boolean,
        editToken: row.edit_token as string,
        ...(row.deleted_at ? { deletedAt: (row.deleted_at as Date).toISOString() } : {}),
      };
    });

    return NextResponse.json({ reports });
  } catch (e) {
    console.error("User reports error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
