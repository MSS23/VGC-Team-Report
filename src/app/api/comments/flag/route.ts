import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { captureServerEvent } from "@/lib/posthog-server";
import { NextResponse } from "next/server";
import { z } from "zod";

const FLAG_THRESHOLD = 3; // Auto-hide after this many unique flags

const FlagBody = z.object({
  commentId: z.number(),
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`flag:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const raw = await request.json();
    const parsed = FlagBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const { commentId, sessionId } = parsed.data;

    const sql = getDb();

    // Insert flag (unique per comment+session)
    await sql`
      INSERT INTO comment_flags (comment_id, session_id)
      VALUES (${commentId}, ${sessionId})
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
