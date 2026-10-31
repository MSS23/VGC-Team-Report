import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { getClientIp } from "@/lib/security/input-validation";
import { isRateLimitedAsync } from "@/lib/rate-limit";
import { QUICK_OWNER_COOKIE, QUICK_SHARE_TTL_SECONDS, hashQuickToken, newQuickToken, quickOwnerToken, validateQuickPaste } from "@/lib/sharing/quick-share";

export async function POST(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "quick-share", max: 5 }, requireContentType: true, maxBodySize: 20_000 });
  if (guard) return guard;
  if (await isRateLimitedAsync(`quick-share-daily:${getClientIp(request)}`, 20, 86_400_000)) return NextResponse.json({ error: "Daily guest share limit reached. Try again tomorrow." }, { status: 429 });
  let paste: string;
  try {
    const body = await request.text();
    if (body.length > 20_000) return NextResponse.json({ error: "Paste is too large." }, { status: 413 });
    paste = validateQuickPaste(JSON.parse(body).paste);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid team paste." }, { status: 400 }); }
  try {
    const token = quickOwnerToken(request) ?? newQuickToken();
    const id = randomBytes(16).toString("hex");
    const sql = getDb();
    const rows = await sql`INSERT INTO quick_shares (id, owner_hash, paste, expires_at)
      VALUES (${id}, ${hashQuickToken(token)}, ${paste}, NOW() + INTERVAL '30 days') RETURNING expires_at`;
    const response = NextResponse.json({ url: `/q/${id}`, expiresAt: rows[0].expires_at }, { status: 201, headers: { "Cache-Control": "no-store" } });
    response.cookies.set(QUICK_OWNER_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: QUICK_SHARE_TTL_SECONDS });
    return response;
  } catch {
    return NextResponse.json({ error: "Could not create a guest link. Please try again." }, { status: 503 });
  }
}
