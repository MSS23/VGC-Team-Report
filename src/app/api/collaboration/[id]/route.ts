import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { collaborationAccess } from "@/lib/collaboration-access";
import { apiGuard } from "@/lib/security/api-guard";

const sectionSchema = z.string().trim().min(1).max(160);
const bodySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("presence"), section: sectionSchema, field: z.string().max(100), caret: z.number().int().min(0).max(500000).nullable() }),
  z.object({ kind: z.literal("comment"), section: sectionSchema, body: z.string().trim().min(1).max(2000), parentId: z.number().int().positive().nullable().optional() }),
]);
const headers = { "Cache-Control": "private, no-store" };
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  const guard = await apiGuard(request, { rateLimit: { key: "collab-read", max: 90 } });
  if (guard) return guard;
  try {
    const { id } = await params;
    const access = await collaborationAccess(id);
    if (access.error) return access.error;
    const { sql, userId } = access;
    const section = sectionSchema.safeParse(new URL(request.url).searchParams.get("section"));
    if (!section.success) return NextResponse.json({ error: "Choose a section." }, { status: 400 });
    const after = Math.max(0, Number.parseInt(new URL(request.url).searchParams.get("after") ?? "0", 10) || 0);
    const comments = await sql`SELECT id, section, body, display_name AS name, parent_id AS "parentId", created_at AS "createdAt"
      FROM collaboration_comments WHERE share_id = ${id} AND section = ${section.data} AND id > ${after} ORDER BY id ASC LIMIT 500`;
    const presence = await sql`SELECT user_id AS "userId", display_name AS name, section, field, caret
      FROM collaboration_presence WHERE share_id = ${id} AND user_id != ${userId} AND seen_at > NOW() - INTERVAL '45 seconds' ORDER BY display_name LIMIT 64`;
    return NextResponse.json({ comments, presence }, { headers });
  } catch { return NextResponse.json({ error: "Collaboration is unavailable. Try again." }, { status: 503, headers }); }
}
export async function POST(request: Request, { params }: Context) {
  const guard = await apiGuard(request, { rateLimit: { key: "collab-write", max: 40 }, requireContentType: true, maxBodySize: 12000 });
  if (guard) return guard;
  try {
    const { id } = await params;
    const access = await collaborationAccess(id);
    if (access.error) return access.error;
    const { sql, userId } = access;
    const raw = await request.text();
    if (raw.length > 12000) return NextResponse.json({ error: "Message too large." }, { status: 413 });
    let parsed;
    try { parsed = bodySchema.safeParse(JSON.parse(raw)); } catch { return NextResponse.json({ error: "Invalid message." }, { status: 400 }); }
    if (!parsed.success) return NextResponse.json({ error: "Invalid message." }, { status: 400 });
    const user = await currentUser();
    const name = (user?.firstName || user?.username || "Teammate").slice(0, 80);
    const input = parsed.data;
    if (input.kind === "presence") {
      // One row per account/report, not per keystroke or session. Cleanup + caps
      // bound storage; old cursors never survive a disconnected browser.
      await sql`DELETE FROM collaboration_presence WHERE seen_at < NOW() - INTERVAL '2 minutes'`;
      const rows = await sql`INSERT INTO collaboration_presence (share_id, user_id, display_name, section, field, caret, seen_at)
        SELECT ${id}, ${userId}, ${name}, ${input.section}, ${input.field}, ${input.caret}, NOW()
        WHERE EXISTS (SELECT 1 FROM collaboration_presence WHERE share_id = ${id} AND user_id = ${userId})
          OR ((SELECT COUNT(*) FROM collaboration_presence WHERE share_id = ${id}) < 64 AND (SELECT COUNT(*) FROM collaboration_presence) < 5000)
        ON CONFLICT (share_id, user_id) DO UPDATE SET display_name = EXCLUDED.display_name, section = EXCLUDED.section,
          field = EXCLUDED.field, caret = EXCLUDED.caret, seen_at = NOW() RETURNING user_id`;
      if (!rows.length) return NextResponse.json({ error: "Presence is at capacity. Editing and comments remain available." }, { status: 429, headers });
    } else {
      if (input.parentId) {
        const parent = await sql`SELECT id FROM collaboration_comments WHERE id = ${input.parentId} AND share_id = ${id} AND section = ${input.section} AND parent_id IS NULL`;
        if (!parent.length) return NextResponse.json({ error: "Thread not found in this section." }, { status: 400 });
      }
      const rows = await sql`INSERT INTO collaboration_comments (share_id, section, body, user_id, display_name, parent_id)
        SELECT ${id}, ${input.section}, ${input.body}, ${userId}, ${name}, ${input.parentId ?? null}
        WHERE (SELECT COUNT(*) FROM collaboration_comments WHERE share_id = ${id} AND section = ${input.section}) < 500 RETURNING id`;
      if (!rows.length) return NextResponse.json({ error: "This section has reached its 500-message limit." }, { status: 409 });
    }
    return NextResponse.json({ success: true }, { headers });
  } catch { return NextResponse.json({ error: "Could not update collaboration. Try again." }, { status: 503, headers }); }
}
