import { getDb } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { cacheDel, CacheKeys } from "@/lib/cache";
import { extractSpecies } from "@/lib/utils/extract-species";
import { apiGuard } from "@/lib/security/api-guard";
import { NextResponse } from "next/server";
import { z } from "zod";

const collaborationActionSchema = z.object({
  shareId: z.string().min(1).max(50),
  action: z.enum(["accept", "decline"]),
});

/**
 * GET /api/user/collaborations
 * Returns reports where the current user is a collaborator (not owner).
 * Includes both pending and accepted invites with status field.
 */
export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "collaborations-read", max: 30 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const sql = getDb();
    const rows = await sql`
      SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count,
             s.is_public, c.created_at as invited_at, COALESCE(c.status, 'accepted') as status
      FROM collaborators c
      JOIN shares s ON s.id = c.share_id
      WHERE c.user_id = ${userId} AND s.deleted_at IS NULL
      ORDER BY s.updated_at DESC
      LIMIT 50
    `;

    const reports = rows.map((row) => {
      const data = row.data as Record<string, unknown>;
      const paste = (data.paste as string) ?? "";
      return {
        id: row.id as string,
        species: extractSpecies(paste),
        tournamentName: (data.tournamentName as string) || undefined,
        creatorName: (data.creatorName as string) || undefined,
        placement: (data.placement as string) || undefined,
        teamSummary: (data.teamSummary as string) || undefined,
        createdAt: (row.created_at as Date).toISOString(),
        updatedAt: (row.updated_at as Date).toISOString(),
        viewCount: row.view_count as number,
        invitedAt: (row.invited_at as Date).toISOString(),
        tags: (data.tags as Record<string, unknown>) || undefined,
        collabStatus: row.status as string,
      };
    });

    return NextResponse.json({ reports });
  } catch (e) {
    console.error("Collaborations fetch error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * POST /api/user/collaborations
 * Accept or decline a collab invite.
 * Body: { shareId: string, action: 'accept' | 'decline' }
 */
export async function POST(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "collaborations-write", max: 20 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const rawBody = await request.json().catch(() => null);
    const parsed = collaborationActionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "shareId and action (accept/decline) required", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { shareId, action } = parsed.data;

    const sql = getDb();

    // Verify this user has a pending invite for this share
    const existing = await sql`
      SELECT 1 FROM collaborators
      WHERE share_id = ${shareId} AND user_id = ${userId} AND COALESCE(status, 'accepted') = 'pending'
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: "No pending invite found" }, { status: 404 });
    }

    if (action === "accept") {
      await sql`
        UPDATE collaborators SET status = 'accepted'
        WHERE share_id = ${shareId} AND user_id = ${userId}
      `;
      // Bust cache so the report now shows this collaborator publicly
      await cacheDel(CacheKeys.share(shareId)).catch(() => {});
      return NextResponse.json({ success: true, status: "accepted" });
    } else {
      // Decline — remove the collaborator row entirely
      await sql`
        DELETE FROM collaborators
        WHERE share_id = ${shareId} AND user_id = ${userId}
      `;
      return NextResponse.json({ success: true, status: "declined" });
    }
  } catch (e) {
    console.error("Collab action error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
