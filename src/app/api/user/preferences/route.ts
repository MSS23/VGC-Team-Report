import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { readNotificationPrefs } from "@/lib/notification-preferences";

const headers = { "Cache-Control": "private, no-store" };
const schema = z.object({ welcomeSeries: z.boolean(), weeklyDigest: z.boolean(), socialActivity: z.boolean(), productUpdates: z.boolean() }).strict();

export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "preferences-read", max: 30 } });
  if (guard) return guard;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to manage preferences." }, { status: 401, headers });
  try {
    const sql = getDb();
    const rows = await sql`SELECT preferences FROM user_preferences WHERE user_id = ${userId}`;
    return NextResponse.json({ preferences: readNotificationPrefs(rows[0]?.preferences), initialized: rows.length > 0 }, { headers });
  } catch {
    return NextResponse.json({ error: "Could not load preferences. Please try again." }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "preferences-write", max: 15 }, requireContentType: true, maxBodySize: 4096 });
  if (guard) return guard;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to manage preferences." }, { status: 401, headers });
  let input: unknown;
  try {
    const body = await request.text();
    if (body.length > 4096) return NextResponse.json({ error: "Request too large." }, { status: 413, headers });
    input = JSON.parse(body);
  } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400, headers }); }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Provide all four notification choices as booleans." }, { status: 400, headers });
  try {
    const sql = getDb();
    if (new URL(request.url).searchParams.get("initialize") === "true") {
      // Two devices can migrate concurrently; never overwrite choices already
      // saved by another device after this client read the empty account.
      await sql`INSERT INTO user_preferences (user_id, preferences, updated_at)
        VALUES (${userId}, ${JSON.stringify(parsed.data)}::jsonb, NOW())
        ON CONFLICT (user_id) DO NOTHING`;
      const rows = await sql`SELECT preferences FROM user_preferences WHERE user_id = ${userId}`;
      return NextResponse.json({ preferences: readNotificationPrefs(rows[0]?.preferences), initialized: true }, { headers });
    }
    await sql`INSERT INTO user_preferences (user_id, preferences, updated_at)
      VALUES (${userId}, ${JSON.stringify(parsed.data)}::jsonb, NOW())
      ON CONFLICT (user_id) DO UPDATE SET preferences = EXCLUDED.preferences, updated_at = NOW()`;
    return NextResponse.json({ preferences: parsed.data, initialized: true }, { headers });
  } catch {
    return NextResponse.json({ error: "Preferences were not saved. Please try again." }, { status: 503, headers });
  }
}
