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

/** Also allow Vercel preview deployments (*.vercel.app) */
export function isDynamicAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  // Allow all Vercel preview deployments for this project
  if (/^https:\/\/vgc-team-report[a-z0-9-]*\.vercel\.app$/.test(origin)) return true;
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
