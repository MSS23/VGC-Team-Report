import { ensureTable } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
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
