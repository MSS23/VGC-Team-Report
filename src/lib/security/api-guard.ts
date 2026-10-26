/**
 * API route security guard — consolidates common security checks.
 *
 * Usage in API routes:
 *   const guard = await apiGuard(request, { rateLimit: { key: "share", max: 20 } });
 *   if (guard) return guard;  // Returns error response if check fails
 */

import { NextResponse } from "next/server";
import { isRateLimitedAsync } from "@/lib/rate-limit";
import { getClientIp, hasValidContentType } from "./input-validation";

interface ApiGuardOptions {
  rateLimit?: {
    key: string;
    max: number;
    windowMs?: number;
  };
  requireContentType?: boolean;
  maxBodySize?: number;
}

/**
 * Run common API security checks. Returns a NextResponse if the request
 * should be blocked, or null if it passes all checks.
 */
export async function apiGuard(request: Request, options: ApiGuardOptions): Promise<NextResponse | null> {
  const { rateLimit, requireContentType = false, maxBodySize } = options;

  // Rate limiting (now async for distributed Upstash support)
  if (rateLimit) {
    const ip = getClientIp(request);
    if (await isRateLimitedAsync(`${rateLimit.key}:${ip}`, rateLimit.max, rateLimit.windowMs ?? 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
  }

  // Content-Type validation for POST/PUT/PATCH
  if (requireContentType) {
    const method = request.method.toUpperCase();
    if (["POST", "PUT", "PATCH"].includes(method) && !hasValidContentType(request)) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 },
      );
    }
  }

  // Body size check.
  //
  // Content-Length is attacker-controlled: a chunked request (Transfer-Encoding:
  // chunked, no Content-Length) or a request that simply lies about its length
  // used to skip this check entirely, leaving the cap unenforced. So the header
  // is only a cheap fast reject, and the real cap is enforced on the bytes we
  // actually read off the wire.
  if (maxBodySize) {
    const contentLength = parseInt(request.headers.get("content-length") ?? "", 10);
    if (Number.isFinite(contentLength) && contentLength > maxBodySize) {
      return tooLarge();
    }

    // Measure the body for real. A Request body can only be read once, so the
    // bytes we consume here are buffered back onto the request: callers keep
    // using `request.text()` / `request.json()` exactly as before.
    if (request.body && !request.bodyUsed) {
      const body = await readBodyWithLimit(request.body, maxBodySize);
      if (body === OVER_LIMIT) return tooLarge();
      attachBufferedBody(request, body);
    }
  }

  return null;
}

function tooLarge(): NextResponse {
  return NextResponse.json({ error: "Request too large" }, { status: 413 });
}

/** Sentinel for "body exceeded the cap" — distinguishable from any decoded body. */
const OVER_LIMIT = Symbol("over-limit");

/**
 * Drain a request body stream, aborting as soon as the bytes read exceed
 * `maxBodySize`. Returns the decoded text, or OVER_LIMIT if the cap was blown.
 */
async function readBodyWithLimit(
  stream: ReadableStream<Uint8Array>,
  maxBodySize: number,
): Promise<string | typeof OVER_LIMIT> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBodySize) {
        // Stop pulling bytes we have already decided to reject.
        await reader.cancel().catch(() => {});
        return OVER_LIMIT;
      }
      chunks.push(value);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Already released (e.g. after cancel) — nothing to do.
    }
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

/**
 * Re-attach an already-consumed body so downstream handlers can still read it.
 * Overrides only the accessors routes use; the underlying stream stays spent.
 */
function attachBufferedBody(request: Request, text: string): void {
  const define = (name: string, value: () => Promise<unknown>) => {
    Object.defineProperty(request, name, { value, configurable: true, writable: true });
  };
  define("text", async () => text);
  define("json", async () => JSON.parse(text));
  define("arrayBuffer", async () => {
    const bytes = new TextEncoder().encode(text);
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  });
}
