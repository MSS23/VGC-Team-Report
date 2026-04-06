import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const IdSchema = z.string().regex(/^[A-Za-z0-9]{8}$/, "Invalid share ID");

/**
 * GET /api/share/{id}/versions
 * Returns version history for a shared report.
 * Only accessible by the owner or collaborators.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await apiGuard(request, { rateLimit: { key: "versions-read", max: 30 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const sql = getDb();

    // Verify ownership or collaborator status
    const shareRows = await sql`
      SELECT owner_id, COALESCE(version, 1) AS current_version FROM shares WHERE id = ${id} AND deleted_at IS NULL
    `;
    if (shareRows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = shareRows[0].owner_id === userId;
    if (!isOwner) {
      const collabRows = await sql`SELECT 1 FROM collaborators WHERE share_id = ${id} AND user_id = ${userId}`;
      if (collabRows.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Fetch version history (metadata only — no full data blobs)
    const versions = await sql`
      SELECT sv.version, sv.editor_name, sv.created_at,
             COALESCE(ec.sections, '[]'::jsonb) AS sections
      FROM share_versions sv
      LEFT JOIN edit_changelog ec ON ec.share_id = sv.share_id AND ec.version = sv.version
      WHERE sv.share_id = ${id}
      ORDER BY sv.version DESC
      LIMIT 50
    `;

    return NextResponse.json({
      currentVersion: Number(shareRows[0].current_version),
      versions: versions.map((v) => ({
        version: Number(v.version),
        editorName: v.editor_name ?? null,
        sections: v.sections ?? [],
        createdAt: (v.created_at as Date).toISOString(),
      })),
    });
  } catch (e) {
    console.error("Version history error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * POST /api/share/{id}/versions
 * Revert to a specific version. Creates a new version with the old data.
 * Body: { version: number }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await apiGuard(request, { rateLimit: { key: "versions-write", max: 10 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const targetVersion = Number(body.version);
    if (!Number.isInteger(targetVersion) || targetVersion < 1) {
      return NextResponse.json({ error: "Invalid version" }, { status: 400 });
    }

    const sql = getDb();

    // Verify ownership or collaborator status
    const shareRows = await sql`
      SELECT owner_id, edit_token, data, COALESCE(version, 1) AS current_version
      FROM shares WHERE id = ${id} AND deleted_at IS NULL
    `;
    if (shareRows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = shareRows[0].owner_id === userId;
    if (!isOwner) {
      const collabRows = await sql`SELECT 1 FROM collaborators WHERE share_id = ${id} AND user_id = ${userId}`;
      if (collabRows.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Fetch the target version snapshot
    const versionRows = await sql`
      SELECT data FROM share_versions WHERE share_id = ${id} AND version = ${targetVersion}
    `;
    if (versionRows.length === 0) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const currentVersion = Number(shareRows[0].current_version);
    const currentData = shareRows[0].data;

    // Snapshot current state before reverting
    const user = await currentUser();
    const editorName = user?.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : user?.username ?? "Unknown";

    sql`
      INSERT INTO share_versions (share_id, version, data, editor_id, editor_name)
      VALUES (${id}, ${currentVersion}, ${JSON.stringify(currentData)}::jsonb, ${userId}, ${editorName})
      ON CONFLICT (share_id, version) DO NOTHING
    `.catch(() => {});

    // Revert: overwrite current data with the old version's data
    const revertedData = versionRows[0].data;
    const rows = await sql`
      UPDATE shares
      SET data = ${JSON.stringify(revertedData)}::jsonb, updated_at = NOW(), version = COALESCE(version, 1) + 1
      WHERE id = ${id}
      RETURNING COALESCE(version, 1) AS version
    `;

    // Record revert in changelog
    sql`
      INSERT INTO edit_changelog (share_id, version, editor_id, editor_name, sections)
      VALUES (${id}, ${rows[0].version}, ${userId}, ${editorName}, ${JSON.stringify([`Reverted to version ${targetVersion}`])}::jsonb)
    `.catch(() => {});

    return NextResponse.json({
      success: true,
      newVersion: Number(rows[0].version),
      revertedTo: targetVersion,
    });
  } catch (e) {
    console.error("Version revert error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
