import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { captureServerEvent } from "@/lib/posthog-server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const FLAG_THRESHOLD = 3; // Auto-hide after this many unique flags

const FlagBody = z.object({
  commentId: z.number(),
});

export async function POST(request: Request) {
  try {
    // Require Clerk auth — anonymous flagging let attackers rotate sessionIds
    // to clear the per-(comment, session) dedup threshold and auto-delete
    // legitimate comments. Keying dedup on userId makes that materially harder.
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required to flag comments" },
        { status: 401 },
      );
    }

    // Rate limit per-user (in addition to the IP key inside apiGuard) so a
    // single account can't burn through the flag budget across IPs.
    const guard = await apiGuard(request, { rateLimit: { key: `flag:${userId}`, max: 10 } });
    if (guard) return guard;

    const raw = await request.json();
    const parsed = FlagBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const { commentId } = parsed.data;

    const sql = getDb();

    // Dedup key is userId (stored in the existing session_id column to avoid
    // a schema migration; the UNIQUE(comment_id, session_id) constraint still
    // enforces one flag per user per comment).
    await sql`
      INSERT INTO comment_flags (comment_id, session_id)
      VALUES (${commentId}, ${userId})
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
