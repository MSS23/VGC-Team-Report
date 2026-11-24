import { NextRequest, NextResponse } from "next/server";
import { apiGuard } from "@/lib/security/api-guard";

export const runtime = "edge";

const ALLOWED_HOSTS = new Set(["play.pokemonshowdown.com"]);
const MAX_REDIRECTS = 3;
// Largest animated sprites are a few hundred KB; 5 MB is far above any real one.
const MAX_SPRITE_BYTES = 5 * 1024 * 1024;

/** Why a URL may not be proxied, or null when it may. Applied to every hop. */
function rejectTarget(target: URL): string | null {
  if (target.protocol !== "https:") return "Protocol not allowed";
  if (!ALLOWED_HOSTS.has(target.hostname)) return "Host not allowed";
  if (!target.pathname.startsWith("/sprites/")) return "Path not allowed";
  return null;
}

/** Read a body, giving up (null) as soon as it exceeds the cap. */
async function readCapped(res: Response, max: number): Promise<ArrayBuffer | null> {
  if (Number(res.headers.get("content-length")) > max) return null;
  if (!res.body) return new ArrayBuffer(0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out.buffer;
}

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
  // The proxy skips this route, so it needs its own limit. Generous: a team
  // export fetches a dozen sprites at once, and the CDN absorbs repeats.
  const guard = await apiGuard(req, { rateLimit: { key: "sprite", max: 120 } });
  if (guard) return guard;

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
  const rejected = rejectTarget(target);
  if (rejected) {
    return new NextResponse(rejected, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    // Redirects are followed by hand so each hop is re-checked: a redirect
    // followed automatically would leave the allowlist after the first URL.
    let upstream: Response;
    for (let hop = 0; ; hop++) {
      upstream = await fetch(target.href, {
        headers: { "User-Agent": "VGC-Team-Report/1.0" },
        // Hint Vercel's edge cache — sprites are effectively immutable so
        // a day of freshness at the origin is fine; we add a long
        // Cache-Control below for the client + CDN.
        next: { revalidate: 86400 },
        redirect: "manual",
        signal: controller.signal,
      });
      const location = upstream.status >= 300 && upstream.status < 400 ? upstream.headers.get("location") : null;
      if (!location) break;
      if (hop >= MAX_REDIRECTS) {
        return new NextResponse("Too many redirects", { status: 502 });
      }
      target = new URL(location, target);
      if (rejectTarget(target)) {
        return new NextResponse("Redirect not allowed", { status: 502 });
      }
    }

    if (!upstream.ok) {
      return new NextResponse("Upstream error", { status: upstream.status });
    }

    // Served from our origin, so only ever pass an image through.
    const contentType = upstream.headers.get("content-type") ?? "image/png";
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Upstream is not an image", { status: 502 });
    }

    const buf = await readCapped(upstream, MAX_SPRITE_BYTES);
    if (!buf) {
      return new NextResponse("Sprite too large", { status: 502 });
    }

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
