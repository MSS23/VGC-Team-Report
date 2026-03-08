import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

function generateId(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function generateEditToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { state, existingId, editToken } = body;

    const sql = getDb();

    // Update existing share
    if (existingId && editToken) {
      const rows = await sql`
        UPDATE shares
        SET data = ${JSON.stringify(state)}::jsonb, updated_at = NOW()
        WHERE id = ${existingId} AND edit_token = ${editToken}
        RETURNING id
      `;
      if (rows.length > 0) {
        return NextResponse.json({ id: existingId, editToken, updated: true });
      }
      // Token mismatch or not found — fall through to create new
    }

    // Create new share
    const id = generateId();
    const newEditToken = generateEditToken();
    await sql`
      INSERT INTO shares (id, edit_token, data)
      VALUES (${id}, ${newEditToken}, ${JSON.stringify(state)}::jsonb)
    `;
    return NextResponse.json({ id, editToken: newEditToken, updated: false });
  } catch (e) {
    console.error("Share create/update error:", e);
    return NextResponse.json(
      { error: "Failed to save share" },
      { status: 500 }
    );
  }
}
