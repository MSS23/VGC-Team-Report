import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const MAX_BODY_SIZE = 512_000; // 500 KB

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
    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`share:${ip}`, 20, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Check content length
    const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: "Request too large" },
        { status: 413 }
      );
    }

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
