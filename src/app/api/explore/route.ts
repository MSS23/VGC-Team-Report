import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { extractSpecies } from "@/lib/utils/extract-species";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`explore:${ip}`, 30, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor"); // ISO timestamp
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "12", 10) || 12, 1), 50);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const sort = url.searchParams.get("sort") === "updated" ? "updated" : "newest";

    const sql = getDb();

    // Build query dynamically but safely with tagged template
    let rows;
    if (q && cursor) {
      const searchPattern = `%${q}%`;
      rows = await sql`
        SELECT id, data, created_at, updated_at
        FROM shares
        WHERE is_public = TRUE
          AND ${sort === "updated" ? sql`updated_at` : sql`created_at`} < ${cursor}
          AND (data->>'paste' ILIKE ${searchPattern} OR data->>'tournamentName' ILIKE ${searchPattern} OR data->>'creatorName' ILIKE ${searchPattern})
        ORDER BY ${sort === "updated" ? sql`updated_at` : sql`created_at`} DESC
        LIMIT ${limit + 1}
      `;
    } else if (q) {
      const searchPattern = `%${q}%`;
      rows = await sql`
        SELECT id, data, created_at, updated_at
        FROM shares
        WHERE is_public = TRUE
          AND (data->>'paste' ILIKE ${searchPattern} OR data->>'tournamentName' ILIKE ${searchPattern} OR data->>'creatorName' ILIKE ${searchPattern})
        ORDER BY ${sort === "updated" ? sql`updated_at` : sql`created_at`} DESC
        LIMIT ${limit + 1}
      `;
    } else if (cursor) {
      rows = await sql`
        SELECT id, data, created_at, updated_at
        FROM shares
        WHERE is_public = TRUE
          AND ${sort === "updated" ? sql`updated_at` : sql`created_at`} < ${cursor}
        ORDER BY ${sort === "updated" ? sql`updated_at` : sql`created_at`} DESC
        LIMIT ${limit + 1}
      `;
    } else {
      rows = await sql`
        SELECT id, data, created_at, updated_at
        FROM shares
        WHERE is_public = TRUE
        ORDER BY ${sort === "updated" ? sql`updated_at` : sql`created_at`} DESC
        LIMIT ${limit + 1}
      `;
    }

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const reports = items.map((row) => {
      const data = row.data as Record<string, unknown>;
      const paste = (data.paste as string) ?? "";
      return {
        id: row.id as string,
        species: extractSpecies(paste),
        tournamentName: (data.tournamentName as string) || undefined,
        creatorName: (data.creatorName as string) || undefined,
        placement: (data.placement as string) || undefined,
        teamSummary: (data.teamSummary as string) || undefined,
        createdAt: (row.created_at as Date).toISOString(),
        updatedAt: (row.updated_at as Date).toISOString(),
      };
    });

    const nextCursor = hasMore
      ? (sort === "updated"
          ? (items[items.length - 1].updated_at as Date).toISOString()
          : (items[items.length - 1].created_at as Date).toISOString())
      : null;

    return NextResponse.json({ reports, nextCursor });
  } catch (e) {
    console.error("Explore API error:", e);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
