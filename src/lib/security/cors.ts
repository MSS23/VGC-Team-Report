/**
 * CORS configuration for API routes.
 */

const ALLOWED_ORIGINS = new Set([
  "https://pokemonvgcteamreport.com",
  "https://www.pokemonvgcteamreport.com",
]);

// Allow localhost in development
if (process.env.NODE_ENV !== "production") {
  ALLOWED_ORIGINS.add("http://localhost:3000");
  ALLOWED_ORIGINS.add("http://127.0.0.1:3000");
}

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";

  // Only allow known origins
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";

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
  // No origin header = same-origin request (OK)
  if (!origin) return true;
  return ALLOWED_ORIGINS.has(origin);
}
