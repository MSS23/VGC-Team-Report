import { verifyBearer } from "@/lib/auth/verify-bearer";
import { isCronAuthorized } from "@/lib/cron-auth";
import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

    // Delete every satellite row tied to a set of share ids that are about to
    // be hard-deleted. share_versions + edit_changelog were previously leaked
    // here (only reactions/comments/saved_reports were cleaned), which is a big
    // part of why share_versions accumulated orphans (§1-B / Finding 5.8).
    const purgeSatellites = async (ids: string[]) => {
      // comment_flags reference comments by id — purge them before the
      // comments they point at are gone.
      await sql`
        DELETE FROM comment_flags
        WHERE comment_id IN (SELECT id FROM comments WHERE share_id = ANY(${ids}))
      `;
      await sql`DELETE FROM reactions WHERE share_id = ANY(${ids})`;
      await sql`DELETE FROM comments WHERE share_id = ANY(${ids})`;
      await sql`DELETE FROM saved_reports WHERE share_id = ANY(${ids})`;
      await sql`DELETE FROM share_versions WHERE share_id = ANY(${ids})`;
      await sql`DELETE FROM edit_changelog WHERE share_id = ANY(${ids})`;
      await sql`DELETE FROM collection_items WHERE share_id = ANY(${ids})`;
      await sql`DELETE FROM collaborators WHERE share_id = ANY(${ids})`;
      await sql`DELETE FROM notifications WHERE source_share_id = ANY(${ids})`;
      // match_logs are the USER'S match history — keep the rows, drop the
      // reference to the now-deleted report.
      await sql`UPDATE match_logs SET share_id = NULL WHERE share_id = ANY(${ids})`;
    };

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
      await purgeSatellites(ids);
      const purged = await sql`DELETE FROM shares WHERE id = ANY(${ids}) RETURNING id`;
      trashPurged = purged.length;
    }

    // 2. Clean up stale shares (non-deleted) that haven't been updated.
    // EXEMPT owned content (owner_id IS NOT NULL): signed-in users' reports and
    // drafts must never be auto-deleted just for being idle (Finding 4.13).
    // Only anonymous/orphaned shares are eligible for the stale purge. Collect
    // ids first so the satellite rows (versions/changelog/reactions/…) go too.
    const staleIds = await sql`
      SELECT id FROM shares
      WHERE deleted_at IS NULL
        AND owner_id IS NULL
        AND updated_at < NOW() - INTERVAL '1 day' * ${days}
      LIMIT ${MAX_DELETE_PER_RUN}
    `;
    let deleted = 0;
    if (staleIds.length > 0) {
      const ids = staleIds.map((r) => r.id as string);
      await purgeSatellites(ids);
      const purged = await sql`DELETE FROM shares WHERE id = ANY(${ids}) RETURNING id`;
      deleted = purged.length;
    }

    // 3. Orphan sweep — delete share_versions / edit_changelog rows whose
    // share_id no longer exists in shares at all (leaked before this route
    // cleaned them, or from any other path). Batched to MAX_DELETE_PER_RUN.
    const versionsOrphaned = (await sql`
      DELETE FROM share_versions
      WHERE id IN (
        SELECT sv.id FROM share_versions sv
        LEFT JOIN shares s ON s.id = sv.share_id
        WHERE s.id IS NULL
        LIMIT ${MAX_DELETE_PER_RUN}
      )
      RETURNING id
    `).length;
    const changelogOrphaned = (await sql`
      DELETE FROM edit_changelog
      WHERE id IN (
        SELECT ec.id FROM edit_changelog ec
        LEFT JOIN shares s ON s.id = ec.share_id
        WHERE s.id IS NULL
        LIMIT ${MAX_DELETE_PER_RUN}
      )
      RETURNING id
    `).length;

    // 4. Global retention backstop — trim share_versions / edit_changelog to
    // the newest 50 per share. The share route trims inline on write, but this
    // catches anything that predates that fix. Batched to MAX_DELETE_PER_RUN.
    const versionsTrimmed = (await sql`
      DELETE FROM share_versions
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY share_id ORDER BY version DESC) AS rn
          FROM share_versions
        ) ranked
        WHERE rn > 50
        LIMIT ${MAX_DELETE_PER_RUN}
      )
      RETURNING id
    `).length;
    const changelogTrimmed = (await sql`
      DELETE FROM edit_changelog
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY share_id ORDER BY version DESC, id DESC) AS rn
          FROM edit_changelog
        ) ranked
        WHERE rn > 50
        LIMIT ${MAX_DELETE_PER_RUN}
      )
      RETURNING id
    `).length;

    return NextResponse.json({
      deleted,
      trashPurged,
      versionsOrphaned,
      changelogOrphaned,
      versionsTrimmed,
      changelogTrimmed,
      ttlDays: days,
      trashTtlDays: TRASH_TTL_DAYS,
      hasMore:
        deleted === MAX_DELETE_PER_RUN ||
        trashIds.length === MAX_DELETE_PER_RUN ||
        versionsOrphaned === MAX_DELETE_PER_RUN ||
        changelogOrphaned === MAX_DELETE_PER_RUN ||
        versionsTrimmed === MAX_DELETE_PER_RUN ||
        changelogTrimmed === MAX_DELETE_PER_RUN,
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
 * independently of the Vercel cron secret. The comparison is timing-safe
 * (see verifyBearer).
 *
 *   Authorization: Bearer <CLEANUP_SECRET>
 */
export async function DELETE(request: NextRequest) {
  // Verify authorization (constant-time bearer compare)
  if (!verifyBearer(request, "CLEANUP_SECRET")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = parseInt(
    request.nextUrl.searchParams.get("days") ?? String(DEFAULT_TTL_DAYS),
    10
  );

  return runCleanup(days);
}
