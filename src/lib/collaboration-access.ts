import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { STRICT_SHARE_ID_RE } from "@/lib/api/ids";

type Sql = ReturnType<typeof getDb>;

/**
 * True when `userId` owns the live (not soft-deleted) share or is an accepted
 * collaborator on it. Pending invites do not count; a NULL status is treated as
 * accepted for rows created before the status column existed.
 */
export async function hasEditorAccess(sql: Sql, shareId: string, userId: string): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM shares s WHERE s.id = ${shareId} AND s.deleted_at IS NULL
    AND (s.owner_id = ${userId} OR EXISTS (SELECT 1 FROM collaborators c WHERE c.share_id = s.id
      AND c.user_id = ${userId} AND COALESCE(c.status, 'accepted') = 'accepted'))`;
  return rows.length > 0;
}

/**
 * Collaborator half of the editor check, for routes that already loaded the
 * share row (with `deleted_at IS NULL`) and compared `owner_id` themselves.
 * Does not look at the share's deleted state.
 */
export async function isAcceptedCollaborator(sql: Sql, shareId: string, userId: string): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM collaborators WHERE share_id = ${shareId} AND user_id = ${userId}
    AND COALESCE(status, 'accepted') = 'accepted'`;
  return rows.length > 0;
}

export async function collaborationAccess(id: string) {
  if (!STRICT_SHARE_ID_RE.test(id)) return { error: NextResponse.json({ error: "Invalid report." }, { status: 400 }) };
  const { userId } = await auth();
  if (!userId) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  const sql = getDb();
  if (!(await hasEditorAccess(sql, id, userId))) return { error: NextResponse.json({ error: "Only report editors can collaborate." }, { status: 403 }) };
  return { sql, userId };
}
