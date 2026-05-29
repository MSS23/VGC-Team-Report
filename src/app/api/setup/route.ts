import { verifyBearer } from "@/lib/auth/verify-bearer";
import { ensureTable } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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
