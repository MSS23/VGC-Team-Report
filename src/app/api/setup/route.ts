import { ensureTable } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const secret = process.env.MIGRATE_SECRET ?? process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
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
