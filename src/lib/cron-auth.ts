/**
 * Shared authentication check for Vercel cron routes.
 * Allows Vercel cron (user-agent) or a valid CRON_SECRET bearer token.
 */
export function isCronAuthorized(request: Request): boolean {
  const userAgent = request.headers.get("user-agent") ?? "";
  const authHeader = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET;

  const isVercelCron = userAgent.includes("vercel-cron");
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

  return isVercelCron || !!hasValidSecret;
}
