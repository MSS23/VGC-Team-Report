import { randomInt } from "node:crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/security/api-guard";
import { getDb } from "@/lib/db";
import { newQuickToken, ownsQuickShare, quickOwnerToken, validQuickId } from "@/lib/sharing/quick-share";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiGuard(request, { rateLimit: { key: "quick-share-claim", max: 10 } });
  if (guard) return guard;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to save this report." }, { status: 401 });
  const { id } = await params;
  if (!validQuickId(id)) return NextResponse.json({ error: "Invalid link." }, { status: 400 });
  const token = quickOwnerToken(request);
  if (!token) return NextResponse.json({ error: "Save this report from the browser that created the guest link." }, { status: 403 });
  try {
    const sql = getDb();
    const rows = await sql`SELECT paste, owner_hash, expires_at, claimed_by, claimed_share_id FROM quick_shares WHERE id = ${id}`;
    const row = rows[0];
    if (!row || !ownsQuickShare(token, row.owner_hash as string)) return NextResponse.json({ error: "This browser cannot claim that report." }, { status: 403 });
    if (row.claimed_share_id) {
      if (row.claimed_by !== userId) return NextResponse.json({ error: "Already saved by another account." }, { status: 409 });
      return NextResponse.json({ url: `/s/${row.claimed_share_id}` });
    }
    if (!row.expires_at || new Date(row.expires_at as string).getTime() <= Date.now()) return NextResponse.json({ error: "This guest link has expired." }, { status: 410 });
    const user = await currentUser();
    const creatorName = user?.fullName || user?.username || "Trainer";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const shareId = Array.from({ length: 8 }, () => chars[randomInt(chars.length)]).join("");
    const state = { paste: row.paste, notes: {}, matchupPlans: [], creatorName };
    // Claim and report insertion are a single atomic statement. Only one
    // caller can win; failed inserts roll the claim back automatically.
    const claimed = await sql`WITH claimed AS (
      UPDATE quick_shares SET claimed_by = ${userId}, claimed_share_id = ${shareId}, paste = '', expires_at = NULL
      WHERE id = ${id} AND claimed_share_id IS NULL AND expires_at > NOW() AND owner_hash = ${row.owner_hash}
      RETURNING id
    ) INSERT INTO shares (id, edit_token, data, version, is_public, is_unlisted, owner_id, search_vector)
      SELECT ${shareId}, ${newQuickToken()}, ${JSON.stringify(state)}::jsonb, 1, FALSE, TRUE, ${userId},
        to_tsvector('english', ${creatorName + " " + row.paste}) FROM claimed RETURNING id`;
    if (!claimed.length) return NextResponse.json({ error: "The report was claimed or expired. Reload the link." }, { status: 409 });
    return NextResponse.json({ url: `/s/${shareId}` }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Could not save this report. Please try again." }, { status: 503 }); }
}
