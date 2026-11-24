import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasEditorAccess } from "@/lib/collaboration-access";
import { readJsonBody } from "@/lib/api/json-body";

const DeleteBody = z.object({
  sessionId: z.string().optional(),
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shareId: string; commentId: string }> },
) {
  const guard = await apiGuard(request, { rateLimit: { key: "comment-delete", max: 10 } });
  if (guard) return guard;

  try {
    const { shareId, commentId } = await params;
    const json = await readJsonBody(request);
    if ("error" in json) return json.error;
    const raw = json.body;
    const parsed = DeleteBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const { sessionId } = parsed.data;
    const commentIdNum = parseInt(commentId, 10);
    if (isNaN(commentIdNum)) {
      return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
    }

    const sql = getDb();
    let deleted;

    let userId: string | null = null;
    try {
      ({ userId } = await auth());
    } catch { /* signed out */ }

    const canModerate = userId ? await hasEditorAccess(sql, shareId, userId) : false;

    if (canModerate) {
      // Owners and accepted collaborators can moderate report comments.
      deleted = await sql`
        DELETE FROM comments
        WHERE id = ${commentIdNum} AND share_id = ${shareId}
        RETURNING id
      `;
    } else if (sessionId) {
      // Comment author can delete their own
      deleted = await sql`
        DELETE FROM comments
        WHERE id = ${commentIdNum} AND share_id = ${shareId} AND session_id = ${sessionId}
        RETURNING id
      `;
    } else {
      return NextResponse.json({ error: "No authorized account or comment session provided" }, { status: 403 });
    }

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
    }

    // The flags rows reference the comment by id and nothing else cleans them.
    await sql`DELETE FROM comment_flags WHERE comment_id = ${commentIdNum}`;

    return NextResponse.json({ deleted: true });
  } catch (e) {
    console.error("Comment DELETE error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
