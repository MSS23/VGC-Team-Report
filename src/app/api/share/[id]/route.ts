import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`share-get:${ip}`, 60, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { id } = await params;
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    const sql = getDb();

    if (key) {
      // Validate edit key — return data + editable flag
      const rows = await sql`
        SELECT data, (edit_token = ${key}) AS editable FROM shares WHERE id = ${id}
      `;
      if (rows.length === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({
        ...rows[0].data,
        _editable: !!rows[0].editable,
      });
    }

    // Public access — read-only, no edit info leaked
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
