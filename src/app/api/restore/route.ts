import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

// ONE-TIME restore script — delete this file after use
export async function POST(request: Request) {
  try {
    const { id, data, secret } = await request.json();
    // Simple guard so only you can call this
    if (secret !== "restore-dragonite-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDb();
    await sql`
      UPDATE shares SET data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Restore error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
