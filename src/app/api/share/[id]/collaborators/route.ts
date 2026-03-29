import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { cacheDel, CacheKeys } from "@/lib/cache";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * GET  /api/share/{id}/collaborators — list collaborators
 * POST /api/share/{id}/collaborators — add collaborator (owner only)
 * DELETE /api/share/{id}/collaborators — remove collaborator (owner only)
 */

async function getOwnerId(shareId: string): Promise<string | null> {
  const sql = getDb();
  const rows = await sql`SELECT owner_id FROM shares WHERE id = ${shareId} AND deleted_at IS NULL`;
  return (rows[0]?.owner_id as string) ?? null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shareId } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const sql = getDb();

    // Verify caller is owner or collaborator
    const accessRows = await sql`
      SELECT 1 FROM shares WHERE id = ${shareId} AND owner_id = ${userId} AND deleted_at IS NULL
      UNION
      SELECT 1 FROM collaborators WHERE share_id = ${shareId} AND user_id = ${userId}
    `;
    if (accessRows.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const ownerId = await getOwnerId(shareId);
    const rows = await sql`
      SELECT user_id, user_name, created_at FROM collaborators WHERE share_id = ${shareId} ORDER BY created_at ASC
    `;

    return NextResponse.json({
      ownerId,
      collaborators: rows.map((r) => ({
        userId: r.user_id,
        name: r.user_name,
        addedAt: (r.created_at as Date).toISOString(),
      })),
    });
  } catch (e) {
    console.error("List collaborators error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shareId } = await params;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`collab-add:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    // Only owner can add collaborators
    const ownerId = await getOwnerId(shareId);
    if (ownerId !== userId) {
      return NextResponse.json({ error: "Only the owner can add collaborators" }, { status: 403 });
    }

    const body = await request.json();
    const targetUserId = body.userId as string;
    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Prevent self-add
    if (targetUserId === userId) {
      return NextResponse.json({ error: "You are already the owner" }, { status: 400 });
    }

    // Look up target user's display name via Clerk
    let targetName = "Unknown";
    try {
      const client = await clerkClient();
      const targetUser = await client.users.getUser(targetUserId);
      targetName = targetUser.firstName
        ? `${targetUser.firstName}${targetUser.lastName ? ` ${targetUser.lastName}` : ""}`
        : targetUser.username ?? "Unknown";
    } catch {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sql = getDb();
    await sql`
      INSERT INTO collaborators (share_id, user_id, user_name, added_by)
      VALUES (${shareId}, ${targetUserId}, ${targetName}, ${userId})
      ON CONFLICT (share_id, user_id) DO NOTHING
    `;

    // Invalidate share cache
    await cacheDel(CacheKeys.share(shareId)).catch(() => {});

    // Send notification (fire-and-forget)
    const owner = await currentUser();
    const ownerName = owner?.firstName
      ? `${owner.firstName}${owner.lastName ? ` ${owner.lastName}` : ""}`
      : owner?.username ?? "Someone";

    const reportRows = await sql`SELECT data FROM shares WHERE id = ${shareId}`;
    const reportName = (reportRows[0]?.data as Record<string, unknown>)?.tournamentName as string || "a team report";

    createNotification(
      targetUserId,
      "collab_invite",
      shareId,
      ownerName,
      `${ownerName} invited you to collaborate on "${reportName}"`,
    ).catch(() => {});

    return NextResponse.json({ success: true, collaborator: { userId: targetUserId, name: targetName } });
  } catch (e) {
    console.error("Add collaborator error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * PATCH /api/share/{id}/collaborators — revoke collab link (regenerate edit token)
 * Only the original owner can do this. Invalidates all existing ?key= links.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shareId } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const ownerId = await getOwnerId(shareId);
    if (ownerId !== userId) {
      return NextResponse.json({ error: "Only the owner can revoke the link" }, { status: 403 });
    }

    // Generate new edit token
    const crypto = await import("crypto");
    const newToken = crypto.randomBytes(32).toString("hex");

    const sql = getDb();
    await sql`UPDATE shares SET edit_token = ${newToken} WHERE id = ${shareId}`;

    return NextResponse.json({ success: true, message: "Collab link revoked. Old links no longer work." });
  } catch (e) {
    console.error("Revoke link error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shareId } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const ownerId = await getOwnerId(shareId);
    if (ownerId !== userId) {
      return NextResponse.json({ error: "Only the owner can remove collaborators" }, { status: 403 });
    }

    const body = await request.json();
    const targetUserId = body.userId as string;
    if (!targetUserId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM collaborators WHERE share_id = ${shareId} AND user_id = ${targetUserId}`;

    // Invalidate share cache
    await cacheDel(CacheKeys.share(shareId)).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Remove collaborator error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
