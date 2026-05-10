import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCorsHeaders, isAllowedOrigin } from '@/lib/security/cors'
import { setCsrfCookie, validateCsrf } from '@/lib/security/csrf'
import { isBlockedBot, isSuspiciousRequest } from '@/lib/security/bot-detection'

const CANONICAL_HOST = 'pokemonvgcteamreport.com';

// Routes that are always public — no authentication required to view.
// /s/:path* covers all public shared team report URLs (VGC-150).
const isPublicRoute = createRouteMatcher([
  '/',
  '/s/:path*',
  '/embed/:path*',
  '/explore',
  '/champions(.*)',
  '/creator/:path*',
  '/compare',
  '/changelog',
  '/feedback',
  '/privacy',
  '/terms',
  '/api/share/:path*',
  '/api/explore',
  '/api/spotlight',
  '/api/views/:path*',
  '/api/reactions/:path*',
  '/api/comments/:path*',
  '/api/oembed',
  '/api/sprite',
  '/api/bot',
  '/api/webhooks/:path*',
  '/api/cron/:path*',
  '/api/creator/:path*',
  '/api/pokepaste',
  '/api/feedback',
  '/api/keep-alive',
  '/api/setup',
]);

export default clerkMiddleware(async (_auth, request: NextRequest) => {
  const { pathname, search } = request.nextUrl;

  // Discord interaction endpoint — bypass all middleware, respond directly
  if (pathname === '/api/discord') {
    return NextResponse.next();
  }

  // Sprite proxy — skip all middleware. This endpoint is hit dozens of
  // times per page view on /champions and /s, and running Clerk + bot
  // detection + CORS + CSRF on every sprite was the biggest single
  // driver of edge function invocations. The route itself has a strict
  // host+path allowlist so SSRF is already closed, and responses are
  // edge-cached for a year (immutable) — Vercel's CDN absorbs the cost
  // after the first hit per sprite. (Body-level early-return only — the
  // matcher cannot exclude /api/sprite under Next.js 16's URL Pattern
  // API, which forbids capturing groups and lookaheads.)
  if (pathname === '/api/sprite') {
    return NextResponse.next();
  }

  // ── Bot detection: block known scrapers and suspicious requests ──
  // Skip for cron/webhook routes (authenticated by secrets, not browsers)
  const isCronOrWebhook = pathname.startsWith('/api/cron') || pathname.startsWith('/api/webhooks') || pathname === '/api/keep-alive' || pathname === '/api/setup';
  if (!isCronOrWebhook) {
    const userAgent = request.headers.get('user-agent') ?? '';
    if (isBlockedBot(userAgent)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 },
      );
    }
    // Additional heuristics for API routes
    if (pathname.startsWith('/api') && isSuspiciousRequest(request)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 },
      );
    }
  }

  const host = request.headers.get('host') ?? '';
  const isApiRoute = pathname.startsWith('/api');

  // ── Canonical redirect: vercel.app → custom domain ─────────────────
  // Redirects all non-custom-domain traffic to the canonical URL.
  // Preserves path and query string. Skips in development.
  // Allows Vercel preview deploys (unique hash URLs) to work without redirect.
  const isPreviewDeploy = host.includes('vercel.app') && host !== 'vgc-team-report.vercel.app';
  if (
    process.env.NODE_ENV === 'production' &&
    host !== CANONICAL_HOST &&
    host !== `www.${CANONICAL_HOST}` &&
    !host.includes('localhost') &&
    !isPreviewDeploy
  ) {
    return NextResponse.redirect(
      `https://${CANONICAL_HOST}${pathname}${search}`,
      301,
    );
  }

  // ── CORS: Handle preflight OPTIONS requests ────────────────────
  if (isApiRoute && request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(request),
    });
  }

  // ── CORS: Block cross-origin API requests from unknown origins ────
  // Exempt Discord and Linear webhook endpoints (sent from their servers, not browsers)
  // Exempt builder proxy endpoints — authenticated via secret key, called from cloud sandbox
  if (isApiRoute && !pathname.startsWith('/api/discord') && !pathname.startsWith('/api/webhooks/') && !pathname.startsWith('/api/builder/') && pathname !== '/api/setup' && !isAllowedOrigin(request)) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403 },
    );
  }

  // ── CSRF: Defense-in-depth for state-changing API requests ──────
  // Primary protection is CORS (unknown origins blocked above).
  // CSRF double-submit cookie adds extra protection when a cross-origin
  // request comes from an allowed origin. Same-origin requests (no Origin
  // header) are inherently safe and don't require the CSRF header, which
  // keeps existing fetch() calls working without modification.
  if (isApiRoute && !pathname.startsWith('/api/sync') && !pathname.startsWith('/api/keep-alive')) {
    const method = request.method.toUpperCase();
    const origin = request.headers.get('origin');
    // Only enforce CSRF for truly cross-origin requests (origin present but NOT in our allowed list)
    const isTrueCrossOrigin = !!origin && !isAllowedOrigin(request);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && isTrueCrossOrigin) {
      if (!validateCsrf(request)) {
        return NextResponse.json(
          { error: 'Invalid or missing CSRF token' },
          { status: 403 },
        );
      }
    }
  }

  // ── Set CORS headers on API responses ──────────────────────
  const response = NextResponse.next();

  if (isApiRoute) {
    const corsHeaders = getCorsHeaders(request);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }
  }

  // ── Set CSRF cookie on page loads (non-API) ─────────────────
  if (!isApiRoute && request.method === 'GET') {
    // Check if csrf cookie already exists
    const existingCsrf = request.cookies.get('csrf_token');
    if (!existingCsrf) {
      return setCsrfCookie(response);
    }
  }

  return response;
})

export const config = {
  matcher: [
    // Single matcher excluding static assets, /api/discord, and
    // /api/sprite. Next.js 16's URL pattern parser rejects nested
    // capturing groups, so we can't add sprite via the old second
    // `(api(?!/discord)|trpc)(.*)` matcher. Putting the exclusion on
    // the first (primary) matcher achieves the same thing: the
    // negative lookahead covers every API route we need to block
    // middleware on, without needing a second matcher. The `trpc`
    // route (unused in this project) is dropped in the process.
    '/((?!_next|api/discord|api/sprite|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
