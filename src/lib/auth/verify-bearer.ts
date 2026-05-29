import { timingSafeEqual } from "crypto";

/**
 * Verifies an incoming request carries a valid `Authorization: Bearer <secret>`
 * header where `<secret>` matches `process.env[envVar]`.
 *
 * Behaviour:
 * - Returns false if the `Authorization` header is missing.
 * - Returns false if the header does not start with `Bearer `.
 * - Returns false (fail closed) if the named env var is unset.
 * - Uses `crypto.timingSafeEqual` after an equal-length buffer check to
 *   prevent timing side-channel attacks (mirrors the pattern used by the
 *   PostHog/Linear webhook handlers and cron-auth).
 */
export function verifyBearer(request: Request, envVar: string): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  if (!authHeader.startsWith("Bearer ")) return false;

  const expectedSecret = process.env[envVar];
  if (!expectedSecret) return false;

  const expected = Buffer.from(`Bearer ${expectedSecret}`);
  const actual = Buffer.from(authHeader);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
