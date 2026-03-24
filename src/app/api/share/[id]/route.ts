import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const IdSchema = z.string().regex(/^[A-Za-z0-9]{8}$/, "Invalid share ID");
const KeySchema = z.string().regex(/^[0-9a-f]{64}$/, "Invalid edit key");

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

    const { id: rawId } = await params;
    const idResult = IdSchema.safeParse(rawId);
    if (!idResult.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const id = idResult.data;

    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (key) {
      const keyResult = KeySchema.safeParse(key);
      if (!keyResult.success) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const sql = getDb();

    // Support version-check polling: ?since=N returns 304 if not changed
    const sinceVersion = url.searchParams.get("since");

    if (key) {
      // Validate edit key — return data + editable flag + version
      const rows = await sql`
        SELECT data, (edit_token = ${key}) AS editable, COALESCE(version, 1) AS version FROM shares WHERE id = ${id}
      `;
      if (rows.length === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      // If polling with ?since=N, return 304 if version hasn't changed
      if (sinceVersion && Number(sinceVersion) >= Number(rows[0].version)) {
        return new Response(null, { status: 304 });
      }

      return NextResponse.json({
        ...rows[0].data,
        _editable: !!rows[0].editable,
        _version: Number(rows[0].version),
      });
    }

    // Public access — read-only, no edit info leaked
    const rows = await sql`
      SELECT data, COALESCE(version, 1) AS version FROM shares WHERE id = ${id}
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // If polling with ?since=N, return 304 if version hasn't changed
    if (sinceVersion && Number(sinceVersion) >= Number(rows[0].version)) {
      return new Response(null, { status: 304 });
    }

    return NextResponse.json({
      ...rows[0].data,
      _version: Number(rows[0].version),
    });
  } catch (e) {
    console.error("Share fetch error:", e);
    return NextResponse.json(
      { error: "Failed to load share" },
      { status: 500 }
    );
  }
}
