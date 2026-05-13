import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const ALLOWED_HOSTS = new Set(["play.pokemonshowdown.com"]);

/**
 * Same-origin proxy for Pokemon Showdown sprite images.
 *
 * Showdown's sprite CDN responds to GET with an Allow-Methods header but
 * no `Access-Control-Allow-Origin`. That's fine for normal <img> rendering
 * (where no crossorigin attribute is set) but it breaks html2canvas PNG
 * capture — html2canvas uses `useCORS: true`, which forces
 * `crossorigin="anonymous"` on every image, and without the Allow-Origin
 * response header the image fails to decode. Exports end up with blank
 * sprite slots.
 *
 * This route re-serves the upstream bytes from our own origin (so the
 * image is same-origin to our pages and CORS doesn't apply) with an
 * immutable cache header so Vercel's edge cache absorbs the cost after
 * the first request per sprite.
 *
 * GET /api/sprite?u=https://play.pokemonshowdown.com/sprites/home/incineroar.png
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("u");
  if (!url) {
    return new NextResponse("Missing u", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  // Host + path allowlist — never fetch arbitrary URLs on behalf of a
  // client, that's an SSRF on a silver platter. Only Showdown sprites.
  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return new NextResponse("Host not allowed", { status: 400 });
  }
  if (!target.pathname.startsWith("/sprites/")) {
    return new NextResponse("Path not allowed", { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const upstream = await fetch(target.href, {
      headers: { "User-Agent": "VGC-Team-Report/1.0" },
      // Hint Vercel's edge cache — sprites are effectively immutable so
      // a day of freshness at the origin is fine; we add a long
      // Cache-Control below for the client + CDN.
      next: { revalidate: 86400 },
      signal: controller.signal,
    });

    if (!upstream.ok) {
      return new NextResponse("Upstream error", { status: upstream.status });
    }

    const buf = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") ?? "image/png";

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return new NextResponse("Sprite fetch timed out", { status: 504 });
    }
    return new NextResponse("Proxy fetch failed", { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}
