import { isRateLimited } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`replay:${ip}`, 15, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(request.url).searchParams.get("url");
  if (!url || !url.startsWith("https://replay.pokemonshowdown.com/")) {
    return NextResponse.json({ error: "Invalid replay URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch replay" }, { status: 502 });
    }
    const text = await res.text();
    return new NextResponse(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch replay" }, { status: 502 });
  }
}
