import webpush from "web-push";
import { getDb } from "@/lib/db";
import { isAllowedPushEndpoint } from "./push-subscription";

export function pushConfiguration() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  return publicKey && privateKey && subject ? { publicKey, privateKey, subject } : null;
}

/** Opt-in devices only. Generic lock-screen copy avoids exposing private report details. */
export async function sendSocialPush(userIds: string[]) {
  const vapidDetails = pushConfiguration();
  if (!vapidDetails || !userIds.length) return;
  try {
    const sql = getDb();
    const rows = await sql`SELECT endpoint, p256dh, auth FROM push_subscriptions
      WHERE user_id = ANY(${userIds}::text[])`;
    for (let i = 0; i < rows.length; i += 20) {
      await Promise.all(rows.slice(i, i + 20).map(async (row) => {
        const endpoint = row.endpoint as string;
        if (!isAllowedPushEndpoint(endpoint)) return;
        try {
          await webpush.sendNotification({ endpoint, keys: { p256dh: row.p256dh as string, auth: row.auth as string } }, JSON.stringify({
            title: "VGC Team Report", body: "You have new activity. Open your dashboard to see it.", url: "/dashboard", tag: "vgc-social",
          }), { vapidDetails, TTL: 3600, timeout: 5000, urgency: "normal" });
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
          // Transient failures retain the device for the next event. Never log endpoint tokens.
        }
      }));
    }
  } catch { console.warn("Browser push delivery unavailable"); }
}
