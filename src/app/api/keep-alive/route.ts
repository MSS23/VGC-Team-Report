import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Lightweight ping to keep the Neon database warm.
 * Called by Vercel cron every 5 minutes.
 * Only allows requests from Vercel cron (user-agent check).
 */
export async function GET(request: Request) {
  // Only allow Vercel cron or requests with the correct secret
  const userAgent = request.headers.get("user-agent") ?? "";
  const authHeader = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET;

  const isVercelCron = userAgent.includes("vercel-cron");
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !hasValidSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getDb();
    await sql`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Keep-alive ping failed:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
