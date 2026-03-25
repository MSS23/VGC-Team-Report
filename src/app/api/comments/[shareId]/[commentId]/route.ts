import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const DeleteBody = z.object({
  sessionId: z.string().optional(),
  editToken: z.string().optional(),
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shareId: string; commentId: string }> },
) {
  try {
    const { shareId, commentId } = await params;
    const raw = await request.json();
    const parsed = DeleteBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const { sessionId, editToken } = parsed.data;
    const commentIdNum = parseInt(commentId, 10);
    if (isNaN(commentIdNum)) {
      return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
    }

    const sql = getDb();
    let deleted;

    if (editToken) {
      // Report owner can delete any comment
      deleted = await sql`
        DELETE FROM comments
        WHERE id = ${commentIdNum} AND share_id = ${shareId}
          AND EXISTS (SELECT 1 FROM shares WHERE id = ${shareId} AND edit_token = ${editToken})
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
      return NextResponse.json({ error: "No credentials provided" }, { status: 403 });
    }

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (e) {
    console.error("Comment DELETE error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
