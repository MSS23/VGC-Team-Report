/**
 * Shared authentication check for Vercel cron routes.
 * Requires a valid CRON_SECRET bearer token (set automatically by Vercel cron).
 */
export function isCronAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}
