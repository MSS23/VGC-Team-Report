import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function collaborationAccess(id: string) {
  if (!/^[A-Za-z0-9]{8}$/.test(id)) return { error: NextResponse.json({ error: "Invalid report." }, { status: 400 }) };
  const { userId } = await auth();
  if (!userId) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  const sql = getDb();
  const rows = await sql`SELECT s.id FROM shares s WHERE s.id = ${id} AND s.deleted_at IS NULL
    AND (s.owner_id = ${userId} OR EXISTS (SELECT 1 FROM collaborators c WHERE c.share_id = s.id
      AND c.user_id = ${userId} AND COALESCE(c.status, 'accepted') = 'accepted'))`;
  if (!rows.length) return { error: NextResponse.json({ error: "Only report editors can collaborate." }, { status: 403 }) };
  return { sql, userId };
}
