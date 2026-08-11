/**
 * CORS configuration for API routes.
 */

const ALLOWED_ORIGINS = new Set([
  "https://pokemonvgcteamreport.com",
  "https://www.pokemonvgcteamreport.com",
  "https://vgc-team-report.vercel.app",
]);

// Allow localhost in development
if (process.env.NODE_ENV !== "production") {
  ALLOWED_ORIGINS.add("http://localhost:3000");
  ALLOWED_ORIGINS.add("http://127.0.0.1:3000");
}

/**
 * Vercel preview deployments **for this project only**.
 *
 * Vercel generates two preview hostname shapes, and both carry the team
 * (scope) slug `mss23s-projects` as the final segment before `.vercel.app`:
 *   https://vgc-team-report-<deployment-hash>-mss23s-projects.vercel.app
 *   https://vgc-team-report-git-<branch>-mss23s-projects.vercel.app
 *
 * SECURITY — do not loosen this back to `vgc-team-report[a-z0-9-]*`.
 * `*.vercel.app` names are claimed first-come by ANY Vercel user, so a
 * project-prefix wildcard matched attacker-registrable origins such as
 * `https://vgc-team-report-evil.vercel.app`. Combined with
 * `Access-Control-Allow-Credentials: true` below — and with proxy.ts treating
 * any allowed origin as first-party (it skips both the origin block and the
 * CSRF check) — that reflected credentialed cross-origin reads of every API
 * response to an origin we don't control. Anchoring on the scope suffix is
 * what keeps the match limited to deployments of this project.
 */
const VERCEL_PREVIEW_ORIGIN =
  /^https:\/\/vgc-team-report-(?:[a-z0-9]+|git-[a-z0-9-]+)-mss23s-projects\.vercel\.app$/;

/** Static allowlist + this project's own Vercel preview deployments. */
export function isDynamicAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (VERCEL_PREVIEW_ORIGIN.test(origin)) return true;
  return false;
}

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigin = isDynamicAllowedOrigin(origin) ? origin : "";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return isDynamicAllowedOrigin(origin);
}
