import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { captureServerEvent } from "@/lib/posthog-server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const FLAG_THRESHOLD = 3; // Auto-hide after this many unique flags from distinct authed users

const FlagBody = z.object({
  commentId: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    // Anonymous flagging was abused: client supplied its own sessionId, so an attacker
    // rotating sessionIds could wipe any comment after 3 requests. Require Clerk auth and
    // key the dedup by Clerk userId instead.
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in to flag comments" }, { status: 401 });
    }

    const guard = await apiGuard(request, { rateLimit: { key: "flag", max: 10 } });
    if (guard) return guard;

    const raw = await request.json();
    const parsed = FlagBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const { commentId } = parsed.data;

    const sql = getDb();

    // Insert flag (unique per comment+user). The legacy column is named session_id
    // but now stores the authed Clerk userId.
    await sql`
      INSERT INTO comment_flags (comment_id, session_id)
      VALUES (${commentId}, ${userId})
      ON CONFLICT (comment_id, session_id) DO NOTHING
    `;

    // Check distinct-user flag count — auto-delete comment if threshold reached
    const flagCount = await sql`
      SELECT COUNT(*)::int as count FROM comment_flags WHERE comment_id = ${commentId}
    `;

    const count = flagCount[0]?.count as number;

    if (count >= FLAG_THRESHOLD) {
      // Auto-delete the comment and its flags
      await sql`DELETE FROM comments WHERE id = ${commentId}`;
      await sql`DELETE FROM comment_flags WHERE comment_id = ${commentId}`;

      captureServerEvent(userId, "comment_auto_removed", {
        comment_id: commentId,
        flag_count: count,
      });

      return NextResponse.json({ flagged: true, autoRemoved: true });
    }

    captureServerEvent(userId, "comment_flagged", {
      comment_id: commentId,
      flag_count: count,
    });

    return NextResponse.json({ flagged: true, autoRemoved: false });
  } catch (e) {
    console.error("Flag error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
