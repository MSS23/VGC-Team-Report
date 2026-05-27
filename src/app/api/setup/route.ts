import { timingSafeEqual } from "crypto";
import { ensureTable } from "@/lib/db";
import { NextResponse } from "next/server";

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const secret = process.env.MIGRATE_SECRET ?? process.env.CRON_SECRET;
  if (!secret || !safeCompare(authHeader, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureTable();
    return NextResponse.json({ success: true, message: "Table created" });
  } catch (e) {
    console.error("Setup error:", e);
    return NextResponse.json(
      { error: "Setup failed", details: String(e) },
      { status: 500 }
    );
  }
}
