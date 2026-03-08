import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sql = getDb();
    const rows = await sql`
      SELECT data FROM shares WHERE id = ${id}
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0].data);
  } catch (e) {
    console.error("Share fetch error:", e);
    return NextResponse.json(
      { error: "Failed to load share" },
      { status: 500 }
    );
  }
}
