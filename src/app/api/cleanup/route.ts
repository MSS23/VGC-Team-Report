import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const CLEANUP_SECRET = process.env.CLEANUP_SECRET;
const DEFAULT_TTL_DAYS = 90;
const TRASH_TTL_DAYS = 30;
const MAX_DELETE_PER_RUN = 500;

/**
 * DELETE /api/cleanup?days=90
 *
 * 1. Permanently deletes soft-deleted shares older than 30 days (trash purge).
 * 2. Deletes shares that haven't been updated in the given number of days.
 * Protected by a secret token in the Authorization header.
 *
 * Can be called by a Vercel Cron Job or external scheduler:
 *   Authorization: Bearer <CLEANUP_SECRET>
 */
export async function DELETE(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  if (!CLEANUP_SECRET || authHeader !== `Bearer ${CLEANUP_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = parseInt(
    request.nextUrl.searchParams.get("days") ?? String(DEFAULT_TTL_DAYS),
    10
  );

  if (isNaN(days) || days < 1) {
    return NextResponse.json({ error: "Invalid days parameter" }, { status: 400 });
  }

  try {
    const sql = getDb();

    // 1. Purge soft-deleted reports older than 30 days
    const trashIds = await sql`
      SELECT id FROM shares
      WHERE deleted_at IS NOT NULL
        AND deleted_at < NOW() - INTERVAL '1 day' * ${TRASH_TTL_DAYS}
      LIMIT ${MAX_DELETE_PER_RUN}
    `;
    let trashPurged = 0;
    if (trashIds.length > 0) {
      const ids = trashIds.map((r) => r.id as string);
      await sql`DELETE FROM reactions WHERE share_id = ANY(${ids})`;
      await sql`DELETE FROM comments WHERE share_id = ANY(${ids})`;
      await sql`DELETE FROM saved_reports WHERE share_id = ANY(${ids})`;
      const purged = await sql`DELETE FROM shares WHERE id = ANY(${ids}) RETURNING id`;
      trashPurged = purged.length;
    }

    // 2. Clean up stale shares (non-deleted) that haven't been updated
    const rows = await sql`
      DELETE FROM shares
      WHERE deleted_at IS NULL
        AND updated_at < NOW() - INTERVAL '1 day' * ${days}
        AND id IN (
          SELECT id FROM shares
          WHERE deleted_at IS NULL
            AND updated_at < NOW() - INTERVAL '1 day' * ${days}
          LIMIT ${MAX_DELETE_PER_RUN}
        )
      RETURNING id
    `;

    return NextResponse.json({
      deleted: rows.length,
      trashPurged,
      ttlDays: days,
      trashTtlDays: TRASH_TTL_DAYS,
      hasMore: rows.length === MAX_DELETE_PER_RUN || trashIds.length === MAX_DELETE_PER_RUN,
    });
  } catch (e) {
    console.error("Cleanup error:", e);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}
