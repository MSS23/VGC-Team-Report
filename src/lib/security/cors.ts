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
 * Vercel generates preview hostnames in two shapes, both ending in this
 * team's scope segment:
 *   vgc-team-report-<deployment-hash>-<scope>.vercel.app
 *   vgc-team-report-git-<branch>-<scope>.vercel.app
 *
 * The old pattern was `vgc-team-report[a-z0-9-]*\.vercel\.app`, which matched
 * ANY host starting with the project name. `*.vercel.app` subdomains are
 * first-come-first-served across all Vercel accounts, so anyone could register
 * `vgc-team-report-x` and have that origin reflected into
 * Access-Control-Allow-Origin next to Allow-Credentials: true.
 *
 * Requiring the scope suffix narrows it a lot, but a regex alone can never
 * fully close this — project names are free-form, so a determined attacker
 * could still register a name shaped like a scoped preview URL. The real
 * control is the VERCEL_ENV gate in isDynamicAllowedOrigin(): the production
 * deployment never honours a preview origin at all. Preview deployments keep
 * working both through this pattern and through the same-origin check below,
 * so a scope rename can't break them.
 */
const VERCEL_TEAM_SCOPE = "mss23s-projects";
const PREVIEW_ORIGIN_PATTERN = new RegExp(
  `^https://vgc-team-report-(?:git-)?[a-z0-9][a-z0-9-]{0,60}-${VERCEL_TEAM_SCOPE}\\.vercel\\.app$`,
);

/** Also allow this project's own Vercel preview deployments. */
export function isDynamicAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  // Preview origins are only ever honoured by non-production deployments.
  // Read at call time (not module scope) so tests can stub it.
  if (process.env.VERCEL_ENV === "production") return false;
  return PREVIEW_ORIGIN_PATTERN.test(origin);
}

/**
 * True when the request's Origin is the deployment's own host — i.e. the page
 * that issued it is served by this very deployment. Browsers set Host from the
 * request URL and Origin from the calling document, so a cross-site page can
 * never make these agree; this is safe to allow and it keeps every legitimate
 * preview deployment working regardless of its generated hostname.
 */
function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

function isOriginAllowedForRequest(request: Request, origin: string): boolean {
  if (!origin) return false;
  return isDynamicAllowedOrigin(origin) || isSameOriginRequest(request);
}

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigin = isOriginAllowedForRequest(request, origin) ? origin : "";

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
  return isOriginAllowedForRequest(request, origin);
}
