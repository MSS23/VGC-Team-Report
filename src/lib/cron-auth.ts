import { verifyBearer } from "@/lib/auth/verify-bearer";

/**
 * Shared authentication check for Vercel cron routes.
 * Requires a valid CRON_SECRET bearer token (set automatically by Vercel cron).
 * Fails closed when CRON_SECRET is unset; the comparison is constant-time.
 */
export function isCronAuthorized(request: Request): boolean {
  return verifyBearer(request, "CRON_SECRET");
}
