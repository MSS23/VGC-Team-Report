import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const guard = await apiGuard(request, { rateLimit: { key: "user-reports", max: 30 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const showTrash = request.nextUrl.searchParams.get("trash") === "1";
    const sql = getDb();

    const rows = showTrash
      ? await sql`
          SELECT id, data, created_at, updated_at, COALESCE(view_count, 0) as view_count, is_public, COALESCE(is_unlisted, FALSE) as is_unlisted, deleted_at
          FROM shares
          WHERE owner_id = ${userId} AND deleted_at IS NOT NULL
          ORDER BY deleted_at DESC
        `
      : await sql`
          SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count, s.is_public, COALESCE(s.is_unlisted, FALSE) as is_unlisted,
                 CASE WHEN s.owner_id = ${userId} THEN 0 ELSE 1 END as collab_order
          FROM shares s
          WHERE s.owner_id = ${userId} AND s.deleted_at IS NULL AND (s.is_draft IS NULL OR s.is_draft = FALSE)
          UNION ALL
          SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count, s.is_public, COALESCE(s.is_unlisted, FALSE) as is_unlisted,
                 1 as collab_order
          FROM shares s
          INNER JOIN collaborators c ON c.share_id = s.id AND c.user_id = ${userId}
            AND COALESCE(c.status, 'accepted') = 'accepted'
          WHERE s.deleted_at IS NULL AND s.owner_id != ${userId}
          ORDER BY collab_order ASC, updated_at DESC
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
        isUnlisted: row.is_unlisted as boolean,
        ...(row.collab_order !== undefined && { isCollab: (row.collab_order as number) === 1 }),
        ...(row.deleted_at ? { deletedAt: (row.deleted_at as Date).toISOString() } : {}),
      };
    });

    return NextResponse.json({ reports });
  } catch (e) {
    console.error("User reports error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
