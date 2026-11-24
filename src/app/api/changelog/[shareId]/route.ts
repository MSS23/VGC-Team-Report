import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { hasEditorAccess } from "@/lib/collaboration-access";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * GET /api/changelog/{shareId}
 *
 * Returns the edit changelog for a shared report.
 * Only accessible to authenticated owners and accepted collaborators.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const guard = await apiGuard(request, { rateLimit: { key: "changelog", max: 30 } });
    if (guard) return guard;

    const sql = getDb();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await hasEditorAccess(sql, shareId, userId))) {
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
