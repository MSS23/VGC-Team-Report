import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await kv.get(`share:${id}`);
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to load share" },
      { status: 500 }
    );
  }
}
