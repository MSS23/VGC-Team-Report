import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { captureServerEvent } from "@/lib/posthog-server";
import { auth } from "@clerk/nextjs/server";
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const FLAG_THRESHOLD = 3; // Auto-hide after this many unique flags

const FlagBody = z.object({
  commentId: z.number(),
});

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export async function POST(request: Request) {
  try {
    const guard = await apiGuard(request, { rateLimit: { key: "flag", max: 10 } });
    if (guard) return guard;

    const raw = await request.json();
    const parsed = FlagBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const { commentId } = parsed.data;

    // Derive a server-trusted voter identity:
    //   - Clerk userId when signed in
    //   - Hashed IP fallback for anonymous flaggers
    // This prevents a single attacker from spoofing many client-supplied
    // sessionIds to drive a comment over FLAG_THRESHOLD and auto-delete it.
    const { userId } = await auth();
    let voterId: string;
    if (userId) {
      voterId = `user:${userId}`;
    } else {
      const forwardedFor = request.headers.get("x-forwarded-for");
      const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
      voterId = `ip:${hashIp(ip)}`;
    }

    const sql = getDb();

    // Insert flag (unique per comment+voter). We reuse the existing
    // session_id column to avoid a schema migration in this commit.
    await sql`
      INSERT INTO comment_flags (comment_id, session_id)
      VALUES (${commentId}, ${voterId})
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

      captureServerEvent(voterId, "comment_auto_removed", {
        comment_id: commentId,
        flag_count: count,
      });

      return NextResponse.json({ flagged: true, autoRemoved: true });
    }

    captureServerEvent(voterId, "comment_flagged", {
      comment_id: commentId,
      flag_count: count,
    });

    return NextResponse.json({ flagged: true, autoRemoved: false });
  } catch (e) {
    console.error("Flag error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
