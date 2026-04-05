import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: one export per 24 hours
    const rateKey = `export:${userId}`;
    const lastExport = await cacheGet<string>(rateKey);
    if (lastExport) {
      return NextResponse.json(
        { error: "Rate limit: one export per 24 hours", lastExportAt: lastExport },
        { status: 429 }
      );
    }

    const sql = getDb();
    const LIMIT = 1000;

    // Query all 12 user-linked tables in parallel
    const [
      sharesRows,
      savedReportsRows,
      followsRows,
      notificationsRows,
      collectionsRows,
      collectionItemsRows,
      collaboratorsRows,
      editChangelogRows,
      shareVersionsRows,
      feedbackRows,
      commentsRows,
      reactionsRows,
    ] = await Promise.all([
      sql`SELECT id, data, is_public, view_count, created_at, updated_at
          FROM shares WHERE owner_id = ${userId} AND deleted_at IS NULL
          ORDER BY created_at DESC LIMIT ${LIMIT + 1}`,

      sql`SELECT share_id, created_at FROM saved_reports
          WHERE user_id = ${userId}
          ORDER BY created_at DESC LIMIT ${LIMIT + 1}`,

      sql`SELECT creator_name, created_at FROM follows
          WHERE user_id = ${userId}
          ORDER BY created_at DESC LIMIT ${LIMIT + 1}`,

      sql`SELECT id, type, message, read, created_at FROM notifications
          WHERE user_id = ${userId}
          ORDER BY created_at DESC LIMIT ${LIMIT + 1}`,

      sql`SELECT id, name, description, regulation, created_at FROM collections
          WHERE user_id = ${userId}
          ORDER BY created_at DESC LIMIT ${LIMIT + 1}`,

      sql`SELECT ci.collection_id, ci.share_id, ci.added_at
          FROM collection_items ci
          INNER JOIN collections c ON c.id = ci.collection_id
          WHERE c.user_id = ${userId}
          ORDER BY ci.added_at DESC LIMIT ${LIMIT + 1}`,

      sql`SELECT share_id, user_name, status, created_at FROM collaborators
          WHERE user_id = ${userId}
          ORDER BY created_at DESC LIMIT ${LIMIT + 1}`,

      sql`SELECT id, share_id, version, editor_name, sections, created_at FROM edit_changelog
          WHERE editor_id = ${userId}
          ORDER BY created_at DESC LIMIT ${LIMIT + 1}`,

      sql`SELECT id, share_id, version, data, editor_name, created_at FROM share_versions
          WHERE editor_id = ${userId}
          ORDER BY created_at DESC LIMIT ${LIMIT + 1}`,

      sql`SELECT id, type, title, description, status, created_at FROM feedback
          WHERE submitter_id = ${userId}
          ORDER BY created_at DESC LIMIT ${LIMIT + 1}`,

      sql`SELECT c.id, c.share_id, c.display_name, c.body, c.created_at
          FROM comments c
          INNER JOIN shares s ON s.id = c.share_id
          WHERE s.owner_id = ${userId} AND s.deleted_at IS NULL
          ORDER BY c.created_at DESC LIMIT ${LIMIT + 1}`,

      sql`SELECT r.id, r.share_id, r.reaction_type, r.created_at
          FROM reactions r
          INNER JOIN shares s ON s.id = r.share_id
          WHERE s.owner_id = ${userId} AND s.deleted_at IS NULL
          ORDER BY r.created_at DESC LIMIT ${LIMIT + 1}`,
    ]);

    // Helper: detect truncation at LIMIT and slice
    function paginate<T>(rows: T[]): { data: T[]; truncated: boolean } {
      const truncated = rows.length > LIMIT;
      return { data: truncated ? rows.slice(0, LIMIT) : rows, truncated };
    }

    // Record rate limit AFTER queries succeed (don't burn quota on failure)
    await cacheSet(rateKey, new Date().toISOString(), 86400);

    const payload = {
      exportedAt: new Date().toISOString(),
      userId,
      tables: {
        shares: paginate(sharesRows),
        savedReports: paginate(savedReportsRows),
        follows: paginate(followsRows),
        notifications: paginate(notificationsRows),
        collections: paginate(collectionsRows),
        collectionItems: paginate(collectionItemsRows),
        collaborators: paginate(collaboratorsRows),
        editChangelog: paginate(editChangelogRows),
        shareVersions: paginate(shareVersionsRows),
        feedback: paginate(feedbackRows),
        comments: paginate(commentsRows),
        reactions: paginate(reactionsRows),
      },
    };

    const filename = `vgc-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    const body = JSON.stringify(payload, null, 2);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
