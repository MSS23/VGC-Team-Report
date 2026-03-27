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
  } catch (e) {
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
    const followers = await sql`
      SELECT user_id FROM follows WHERE creator_name = ${creatorName}
    `;
    const message = `${creatorName} published a new team report`;
    for (const row of followers) {
      const uid = row.user_id as string;
      if (uid === excludeUserId) continue;
      await createNotification(uid, "new_report", shareId, creatorName, message);
    }
  } catch (e) {
    console.warn("Failed to notify followers:", e);
  }
}
