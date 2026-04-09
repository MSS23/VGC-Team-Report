import { getDb } from "@/lib/db";
import { cacheDel, cacheInvalidatePrefix, CacheKeys } from "@/lib/cache";
import { captureServerEvent } from "@/lib/posthog-server";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const UpdateBody = z.object({
  isPublic: z.boolean().optional(),
  restore: z.boolean().optional(),
});

// PATCH: update report settings (visibility, restore from trash, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  const guard = await apiGuard(request, { rateLimit: { key: "report-update", max: 20 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { shareId } = await params;
    const raw = await request.json();
    const parsed = UpdateBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const sql = getDb();

    // Restore from trash
    if (parsed.data.restore) {
      const rows = await sql`
        UPDATE shares SET deleted_at = NULL
        WHERE id = ${shareId} AND owner_id = ${userId} AND deleted_at IS NOT NULL
        RETURNING id
      `;
      if (rows.length === 0) {
        return NextResponse.json({ error: "Not found or not in trash" }, { status: 404 });
      }
      captureServerEvent(userId, "report_restored", { report_id: shareId });
      return NextResponse.json({ id: shareId, restored: true });
    }

    if (parsed.data.isPublic !== undefined) {
      const rows = await sql`
        UPDATE shares SET is_public = ${parsed.data.isPublic}, updated_at = NOW()
        WHERE id = ${shareId} AND owner_id = ${userId} AND deleted_at IS NULL
        RETURNING id, is_public
      `;
      if (rows.length === 0) {
        return NextResponse.json({ error: "Not found or not owned" }, { status: 404 });
      }
      // Invalidate caches so the change is visible immediately
      await Promise.all([
        cacheDel(CacheKeys.share(shareId)),
        cacheInvalidatePrefix("explore:"),
      ]);
      captureServerEvent(userId, "report_visibility_changed", {
        report_id: shareId,
        is_public: !!rows[0].is_public,
      });
      return NextResponse.json({ id: shareId, isPublic: rows[0].is_public });
    }

    return NextResponse.json({ id: shareId });
  } catch (e) {
    console.error("Report update error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE: soft-delete a report you own (moves to trash, auto-purged after 30 days)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  const guard = await apiGuard(request, { rateLimit: { key: "report-delete", max: 10 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { shareId } = await params;
    const sql = getDb();

    const rows = await sql`
      UPDATE shares SET deleted_at = NOW(), is_public = FALSE
      WHERE id = ${shareId} AND owner_id = ${userId} AND deleted_at IS NULL
      RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found or not owned" }, { status: 404 });
    }

    await Promise.all([
      cacheDel(CacheKeys.share(shareId)),
      cacheInvalidatePrefix("explore:"),
    ]);
    captureServerEvent(userId, "report_deleted", { report_id: shareId });

    return NextResponse.json({ deleted: true });
  } catch (e) {
    console.error("Report delete error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
