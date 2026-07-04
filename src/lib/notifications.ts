import { getDb } from "@/lib/db";

export type NotificationType = "comment" | "reaction" | "new_report" | "collab_invite";

/**
 * Create a notification for a single user.
 * Silently fails — notifications should never block the main operation.
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  sourceShareId: string | null,
  sourceUserName: string | null,
  message: string,
) {
  try {
    const sql = getDb();
    await sql`
      INSERT INTO notifications (user_id, type, source_share_id, source_user_name, message)
      VALUES (${userId}, ${type}, ${sourceShareId}, ${sourceUserName}, ${message})
    `;
  } catch (e: unknown) {
    console.warn("Failed to create notification:", e);
  }
}

/**
 * Notify all followers of a creator about a new report.
 */
export async function notifyFollowers(
  creatorName: string,
  shareId: string,
  excludeUserId?: string,
) {
  try {
    const sql = getDb();
    const message = `${creatorName} published a new team report`;
    // Single bulk insert: one notification row per follower, sourced directly
    // from the follows table (avoids N+1 round-trips). NULL excludeUserId is
    // handled by the IS DISTINCT FROM comparison so the current user is skipped.
    await sql`
      INSERT INTO notifications (user_id, type, source_share_id, source_user_name, message)
      SELECT user_id, 'new_report', ${shareId}, ${creatorName}, ${message}
      FROM follows
      WHERE creator_name = ${creatorName}
        AND user_id IS DISTINCT FROM ${excludeUserId ?? null}
    `;
  } catch (e: unknown) {
    console.warn("Failed to notify followers:", e);
  }
}
