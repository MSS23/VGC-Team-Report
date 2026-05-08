import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { containsBlockedWords } from "@/lib/utils/word-filter";
import { escapeHtml } from "@/lib/utils/sanitize";
import { createNotification } from "@/lib/notifications";
import { sendCommentNotificationEmail } from "@/lib/email";
import { captureServerEvent } from "@/lib/posthog-server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const SHARE_ID_RE = /^[a-zA-Z0-9_-]{6,16}$/;

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
    if (!SHARE_ID_RE.test(shareId)) {
      return NextResponse.json({ error: "Invalid share ID" }, { status: 400 });
    }
    const guard = await apiGuard(request, { rateLimit: { key: "comments-read", max: 60 } });
    if (guard) return guard;
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
    if (!SHARE_ID_RE.test(shareId)) {
      return NextResponse.json({ error: "Invalid share ID" }, { status: 400 });
    }
    const guard = await apiGuard(request, { rateLimit: { key: "comments", max: 5 } });
    if (guard) return guard;

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
      // Get the commenter's Clerk user ID (if logged in) to avoid self-notification
      const { userId: commenterId } = await auth();
      const isSelfComment = commenterId && commenterId === ownerId;

      if (!isSelfComment) {
        // In-app notification
        createNotification(ownerId, "comment", shareId, name, `${name} commented on your report`);

        // Email notification (fire-and-forget, never blocks response)
        const reportTitle = (shareData.tournamentName as string) || (shareData.creatorName as string) || "your report";
        (async () => {
          try {
            const client = await clerkClient();
            const ownerUser = await client.users.getUser(ownerId);
            const ownerEmail = ownerUser.emailAddresses?.[0]?.emailAddress;
            if (ownerEmail) {
              await sendCommentNotificationEmail({
                ownerEmail,
                commenterName: name,
                commentBody: sanitizedBody,
                reportTitle,
                shareId,
              });
            }
          } catch (e) {
            console.warn("Comment email notification failed:", e);
          }
        })();
      }
    }

    captureServerEvent(sessionId, "comment_posted", {
      report_id: shareId,
      comment_length: sanitizedBody.length,
    });

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
