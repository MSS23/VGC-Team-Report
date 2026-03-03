import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

function generateId(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export async function POST(request: Request) {
  try {
    const state = await request.json();
    const id = generateId();
    // Store for 90 days
    await kv.set(`share:${id}`, state, { ex: 90 * 24 * 60 * 60 });
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json(
      { error: "Failed to create share" },
      { status: 500 }
    );
  }
}
