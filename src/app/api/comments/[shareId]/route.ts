import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { containsBlockedWords } from "@/lib/utils/word-filter";
import { escapeHtml } from "@/lib/utils/sanitize";
import { createNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";
import { z } from "zod";

const CommentBody = z.object({
  displayName: z.string().max(50).optional(),
  body: z.string().min(1).max(500),
  sessionId: z.string().min(1),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  try {
    const { shareId } = await params;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`comments-read:${ip}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 50);

    const sql = getDb();
    let rows;
    if (cursor) {
      rows = await sql`
        SELECT id, display_name, body, session_id, created_at
        FROM comments
        WHERE share_id = ${shareId} AND id < ${parseInt(cursor, 10)}
        ORDER BY id DESC
        LIMIT ${limit + 1}
      `;
    } else {
      rows = await sql`
        SELECT id, display_name, body, session_id, created_at
        FROM comments
        WHERE share_id = ${shareId}
        ORDER BY id DESC
        LIMIT ${limit + 1}
      `;
    }

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const comments = items.map((row) => ({
      id: row.id as number,
      displayName: row.display_name as string,
      body: row.body as string,
      sessionId: row.session_id as string,
      createdAt: (row.created_at as Date).toISOString(),
    }));

    const nextCursor = hasMore ? String(items[items.length - 1].id) : null;

    return NextResponse.json({ comments, nextCursor });
  } catch (e) {
    console.error("Comments GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  try {
    const { shareId } = await params;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`comments:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many comments. Please wait." }, { status: 429 });
    }

    const raw = await request.json();
    const parsed = CommentBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid comment", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { displayName, body, sessionId } = parsed.data;
    const name = escapeHtml(displayName?.trim() || "Anonymous");
    const sanitizedBody = escapeHtml(body.trim());

    // Word filter
    if (containsBlockedWords(sanitizedBody) || (displayName && containsBlockedWords(displayName))) {
      return NextResponse.json({ error: "Comment contains inappropriate language." }, { status: 400 });
    }

    const sql = getDb();

    // Verify share exists, is public, and has comments enabled
    const shareCheck = await sql`SELECT id, data FROM shares WHERE id = ${shareId} AND is_public = TRUE AND deleted_at IS NULL`;
    if (shareCheck.length === 0) {
      return NextResponse.json({ error: "Report not found or not public" }, { status: 404 });
    }
    const shareData = shareCheck[0].data as Record<string, unknown>;
    if (!shareData.allowComments) {
      return NextResponse.json({ error: "Comments are disabled on this report" }, { status: 403 });
    }

    const rows = await sql`
      INSERT INTO comments (share_id, display_name, body, session_id)
      VALUES (${shareId}, ${name}, ${sanitizedBody}, ${sessionId})
      RETURNING id, display_name, body, session_id, created_at
    `;

    // Notify report owner about the new comment (fire-and-forget)
    const ownerRows = await sql`SELECT owner_id FROM shares WHERE id = ${shareId}`;
    const ownerId = ownerRows[0]?.owner_id as string | undefined;
    if (ownerId) {
      createNotification(ownerId, "comment", shareId, name, `${name} commented on your report`);
    }

    const row = rows[0];
    return NextResponse.json({
      comment: {
        id: row.id,
        displayName: row.display_name,
        body: row.body,
        sessionId: row.session_id,
        createdAt: (row.created_at as Date).toISOString(),
      },
    });
  } catch (e) {
    console.error("Comments POST error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
