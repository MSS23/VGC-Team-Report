import { isCronAuthorized } from "@/lib/cron-auth";
import { getDb } from "@/lib/db";
import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CLEANUP_SECRET = process.env.CLEANUP_SECRET;
const DEFAULT_TTL_DAYS = 90;
const TRASH_TTL_DAYS = 30;
const MAX_DELETE_PER_RUN = 500;

/**
 * Shared cleanup logic: purges soft-deleted shares and stale shares.
 * Returns a NextResponse with the cleanup results.
 */
async function runCleanup(days: number): Promise<NextResponse> {
  if (isNaN(days) || days < 1) {
    return NextResponse.json({ error: "Invalid days parameter" }, { status: 400 });
  }

  try {
    const sql = getDb();

    // 1. Purge soft-deleted reports older than TRASH_TTL_DAYS
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
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}

/**
 * GET /api/cleanup
 *
 * Invoked automatically by Vercel Cron (daily at 3 AM UTC via vercel.json).
 * Vercel cron sends a Bearer <CRON_SECRET> Authorization header — validated
 * by isCronAuthorized() exactly as every other cron route does.
 *
 * Uses the default TTL of 90 days for stale shares.
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = parseInt(
    request.nextUrl.searchParams.get("days") ?? String(DEFAULT_TTL_DAYS),
    10
  );

  return runCleanup(days);
}

/**
 * DELETE /api/cleanup?days=90
 *
 * Manual invocation for one-off cleanup runs (e.g. from a script or curl).
 * Protected by a separate CLEANUP_SECRET bearer token so it can be called
 * independently of the Vercel cron secret.
 *
 *   Authorization: Bearer <CLEANUP_SECRET>
 */
export async function DELETE(request: NextRequest) {
  // Verify authorization (constant-time bearer compare)
  const authHeader = request.headers.get("authorization") ?? "";
  if (!CLEANUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expectedBuf = Buffer.from(`Bearer ${CLEANUP_SECRET}`);
  const actualBuf = Buffer.from(authHeader);
  if (
    expectedBuf.length !== actualBuf.length ||
    !timingSafeEqual(expectedBuf, actualBuf)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = parseInt(
    request.nextUrl.searchParams.get("days") ?? String(DEFAULT_TTL_DAYS),
    10
  );

  return runCleanup(days);
}
