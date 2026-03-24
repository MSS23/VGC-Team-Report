import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const CLEANUP_SECRET = process.env.CLEANUP_SECRET;
const DEFAULT_TTL_DAYS = 90;
const MAX_DELETE_PER_RUN = 500;

/**
 * DELETE /api/cleanup?days=90
 *
 * Deletes shares that haven't been updated in the given number of days.
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

    const rows = await sql`
      DELETE FROM shares
      WHERE updated_at < NOW() - INTERVAL '1 day' * ${days}
      AND id IN (
        SELECT id FROM shares
        WHERE updated_at < NOW() - INTERVAL '1 day' * ${days}
        LIMIT ${MAX_DELETE_PER_RUN}
      )
      RETURNING id
    `;

    return NextResponse.json({
      deleted: rows.length,
      ttlDays: days,
      hasMore: rows.length === MAX_DELETE_PER_RUN,
    });
  } catch (e) {
    console.error("Cleanup error:", e);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}
