import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * GET /api/changelog/{shareId}
 *
 * Returns the edit changelog for a shared report.
 * Only accessible to authenticated users who own the report or have the edit key.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const guard = await apiGuard(request, { rateLimit: { key: "changelog", max: 30 } });
    if (guard) return guard;

    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    const sql = getDb();

    // Verify access — must be owner or have edit key
    let hasAccess = false;

    if (key) {
      const rows = await sql`
        SELECT 1 FROM shares WHERE id = ${shareId} AND edit_token = ${key} AND deleted_at IS NULL
      `;
      hasAccess = rows.length > 0;
    }

    if (!hasAccess) {
      try {
        const { userId } = await auth();
        if (userId) {
          const rows = await sql`
            SELECT 1 FROM shares WHERE id = ${shareId} AND owner_id = ${userId} AND deleted_at IS NULL
          `;
          hasAccess = rows.length > 0;
        }
      } catch { /* not authenticated */ }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch changelog entries
    const entries = await sql`
      SELECT version, editor_id, editor_name, sections, created_at, COALESCE(is_published, FALSE) as is_published
      FROM edit_changelog
      WHERE share_id = ${shareId}
      ORDER BY version DESC
      LIMIT 50
    `;

    return NextResponse.json({
      entries: entries.map((e) => ({
        version: e.version,
        editorName: e.editor_name,
        sections: e.sections,
        isPublished: !!e.is_published,
        createdAt: (e.created_at as Date).toISOString(),
      })),
    });
  } catch (e) {
    console.error("Changelog fetch error:", e);
    return NextResponse.json({ error: "Failed to load changelog" }, { status: 500 });
  }
}
