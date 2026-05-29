import { verifyBearer } from "@/lib/auth/verify-bearer";
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
  // Accept either MIGRATE_SECRET (preferred) or CRON_SECRET as a fallback,
  // matching prior behaviour. Both env-var names are preserved.
  if (
    !verifyBearer(request, "MIGRATE_SECRET") &&
    !verifyBearer(request, "CRON_SECRET")
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
