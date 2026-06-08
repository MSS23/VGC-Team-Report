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

/**
 * Shared body-size cap for share + draft saves (500 KB). Centralized so the
 * share and drafts routes can't drift apart on a future bump.
 */
export const MAX_SHARE_BODY_SIZE = 512_000;

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

  // Body size check
  if (maxBodySize) {
    const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
    if (contentLength > maxBodySize) {
      return NextResponse.json(
        { error: "Request too large" },
        { status: 413 },
      );
    }
  }

  return null;
}
