import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { getClientIp } from "@/lib/security/input-validation";
import { captureServerEvent } from "@/lib/posthog-server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const FLAG_THRESHOLD = 3; // Auto-hide after this many unique flags

const FlagBody = z.object({
  commentId: z.number(),
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const guard = await apiGuard(request, { rateLimit: { key: "flag", max: 10 } });
    if (guard) return guard;

    const raw = await request.json();
    const parsed = FlagBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const { commentId, sessionId } = parsed.data;

    const sql = getDb();

    // Derive the flag identity from an authenticated source, NOT the
    // client-supplied sessionId (which could be fabricated to auto-delete a
    // comment with a few fake IDs). Prefer the Clerk user id; fall back to the
    // request IP. This value is stored in the comment_flags.session_id column,
    // which the UNIQUE(comment_id, session_id) constraint dedupes on.
    const { userId } = await auth();
    const flagKey = userId ? `user:${userId}` : `ip:${getClientIp(request)}`;

    // Validate the comment exists and belongs to a live public share before
    // accepting the flag — prevents flagging arbitrary / non-existent ids.
    const commentCheck = await sql`
      SELECT c.id
      FROM comments c
      JOIN shares s ON s.id = c.share_id
      WHERE c.id = ${commentId} AND s.is_public = TRUE AND s.deleted_at IS NULL
    `;
    if (commentCheck.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Insert flag (unique per comment + authenticated identity)
    await sql`
      INSERT INTO comment_flags (comment_id, session_id)
      VALUES (${commentId}, ${flagKey})
      ON CONFLICT (comment_id, session_id) DO NOTHING
    `;

    // Check flag count — auto-delete comment if threshold reached
    const flagCount = await sql`
      SELECT COUNT(*)::int as count FROM comment_flags WHERE comment_id = ${commentId}
    `;

    const count = flagCount[0]?.count as number;

    if (count >= FLAG_THRESHOLD) {
      // Auto-delete the comment and its flags
      await sql`DELETE FROM comments WHERE id = ${commentId}`;
      await sql`DELETE FROM comment_flags WHERE comment_id = ${commentId}`;

      captureServerEvent(sessionId, "comment_auto_removed", {
        comment_id: commentId,
        flag_count: count,
      });

      return NextResponse.json({ flagged: true, autoRemoved: true });
    }

    captureServerEvent(sessionId, "comment_flagged", {
      comment_id: commentId,
      flag_count: count,
    });

    return NextResponse.json({ flagged: true, autoRemoved: false });
  } catch (e) {
    console.error("Flag error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
