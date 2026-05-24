import { ensureTable } from "@/lib/db";
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const secret = process.env.MIGRATE_SECRET ?? process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expectedBuf = Buffer.from(`Bearer ${secret}`);
  const actualBuf = Buffer.from(authHeader);
  if (
    expectedBuf.length !== actualBuf.length ||
    !timingSafeEqual(expectedBuf, actualBuf)
  ) {
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
