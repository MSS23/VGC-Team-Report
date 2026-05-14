import { timingSafeEqual } from "crypto";

/**
 * Shared authentication check for Vercel cron routes.
 * Requires a valid CRON_SECRET bearer token (set automatically by Vercel cron).
 * Uses timingSafeEqual to prevent timing side-channel attacks.
 */
export function isCronAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return false;

  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const actual = Buffer.from(authHeader);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
