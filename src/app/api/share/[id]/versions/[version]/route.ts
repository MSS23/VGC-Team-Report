import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const IdSchema = z.string().regex(/^[A-Za-z0-9]{8}$/, "Invalid share ID");

/**
 * GET /api/share/{id}/versions/{version}
 * Returns the full data snapshot for a specific version (for diff comparison).
 * Only accessible by the owner or collaborators.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const guard = await apiGuard(request, { rateLimit: { key: "version-detail", max: 30 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, version: versionStr } = await params;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const targetVersion = Number(versionStr);
    if (!Number.isInteger(targetVersion) || targetVersion < 1) {
      return NextResponse.json({ error: "Invalid version" }, { status: 400 });
    }

    const sql = getDb();

    // Verify ownership or collaborator status
    const shareRows = await sql`
      SELECT owner_id FROM shares WHERE id = ${id} AND deleted_at IS NULL
    `;
    if (shareRows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = shareRows[0].owner_id === userId;
    if (!isOwner) {
      const collabRows = await sql`
        SELECT 1 FROM collaborators
        WHERE share_id = ${id} AND user_id = ${userId}
          AND COALESCE(status, 'accepted') = 'accepted'
      `;
      if (collabRows.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Fetch the version snapshot with editor info
    const versionRows = await sql`
      SELECT data, editor_name FROM share_versions WHERE share_id = ${id} AND version = ${targetVersion}
    `;
    if (versionRows.length === 0) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: versionRows[0].data,
      editorName: versionRows[0].editor_name ?? null,
    });
  } catch (e) {
    console.error("Version fetch error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
