import { isCronAuthorized } from "@/lib/cron-auth";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Lightweight ping to keep the Neon database warm.
 * Not a Vercel cron (absent from vercel.json): its only caller is the
 * daily-ops cron health check, once a day.
 * Requires a valid CRON_SECRET bearer token.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
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
