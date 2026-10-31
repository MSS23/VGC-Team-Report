import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { NextResponse } from "next/server";

const SHARE_ID_RE = /^[a-zA-Z0-9_-]{6,16}$/;
const MAX_IDS = 60;

/**
 * Batched "which of these reports has this session liked?" lookup.
 * GET /api/reactions?ids=a,b,c&sessionId=x → { liked: string[] }
 *
 * Powers the Explore grid: one request per page of cards instead of one
 * GET /api/reactions/{id} per card (the old client-side N+1).
 */
export async function GET(request: Request) {
  try {
    const guard = await apiGuard(request, { rateLimit: { key: "reactions-read", max: 60 } });
    if (guard) return guard;

    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId") ?? "";
    const ids = (url.searchParams.get("ids") ?? "")
      .split(",")
      .filter((id) => SHARE_ID_RE.test(id))
      .slice(0, MAX_IDS);

    if (!sessionId || ids.length === 0) {
      return NextResponse.json({ liked: [] });
    }

    const sql = getDb();
    const rows = await sql`
      SELECT DISTINCT share_id FROM reactions
      WHERE session_id = ${sessionId} AND share_id = ANY(${ids})
    `;

    return NextResponse.json({ liked: rows.map((r) => r.share_id as string) });
  } catch (e) {
    console.error("Reactions batch GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
