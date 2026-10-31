import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { isAllowedPushEndpoint } from "@/lib/push-subscription";
import { pushConfiguration } from "@/lib/web-push";

const endpointSchema = z.string().max(2048).refine(isAllowedPushEndpoint);
const subscriptionSchema = z.object({ endpoint: endpointSchema, keys: z.object({
  p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}=?$/), auth: z.string().regex(/^[A-Za-z0-9_-]{22}={0,2}$/),
}) });
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "push-read", max: 30 } });
  if (guard) return guard;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers });
  try {
    const sql = getDb();
    const rows = await sql`SELECT endpoint FROM push_subscriptions WHERE user_id = ${userId}`;
    return NextResponse.json({ publicKey: pushConfiguration()?.publicKey ?? null, endpoints: rows.map((row) => row.endpoint) }, { headers });
  } catch { return NextResponse.json({ error: "Browser notifications are unavailable. Please try again later." }, { status: 503, headers }); }
}

async function write(request: Request, remove: boolean) {
  const guard = await apiGuard(request, { rateLimit: { key: "push-write", max: 10 }, requireContentType: true, maxBodySize: 4096 });
  if (guard) return guard;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers });
  let input: unknown;
  try {
    const body = await request.text();
    if (body.length > 4096) return NextResponse.json({ error: "Subscription too large." }, { status: 413, headers });
    input = JSON.parse(body);
  } catch { return NextResponse.json({ error: "Invalid subscription." }, { status: 400, headers }); }
  try {
    const sql = getDb();
    if (remove) {
      const parsed = z.object({ endpoint: endpointSchema }).safeParse(input);
      if (!parsed.success) return NextResponse.json({ error: "Invalid subscription." }, { status: 400, headers });
      await sql`DELETE FROM push_subscriptions WHERE endpoint = ${parsed.data.endpoint} AND user_id = ${userId}`;
    } else {
      if (!pushConfiguration()) return NextResponse.json({ error: "Browser notifications are not available yet." }, { status: 503, headers });
      const parsed = subscriptionSchema.safeParse(input);
      if (!parsed.success) return NextResponse.json({ error: "Invalid browser subscription." }, { status: 400, headers });
      const { endpoint, keys } = parsed.data;
      const rows = await sql`INSERT INTO push_subscriptions (endpoint, user_id, p256dh, auth)
        SELECT ${endpoint}, ${userId}, ${keys.p256dh}, ${keys.auth}
        WHERE (SELECT COUNT(*) FROM push_subscriptions WHERE user_id = ${userId}) < 8
          OR EXISTS (SELECT 1 FROM push_subscriptions WHERE endpoint = ${endpoint} AND user_id = ${userId})
        ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
        RETURNING endpoint`;
      if (!rows.length) return NextResponse.json({ error: "Eight browsers are already enabled for this account. Disable one first." }, { status: 409, headers });
    }
    return NextResponse.json({ success: true }, { headers });
  } catch { return NextResponse.json({ error: "Could not update browser notifications. Try again." }, { status: 503, headers }); }
}
export const POST = (request: Request) => write(request, false);
export const DELETE = (request: Request) => write(request, true);
