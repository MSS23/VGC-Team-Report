import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCorsHeaders, isAllowedOrigin } from '@/lib/security/cors'
import { setCsrfCookie, validateCsrf } from '@/lib/security/csrf'

export default clerkMiddleware(async (_auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api');

  // ── CORS: Handle preflight OPTIONS requests ────────────────────
  if (isApiRoute && request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(request),
    });
  }

  // ── CORS: Block cross-origin API requests from unknown origins ─
  if (isApiRoute && !isAllowedOrigin(request)) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403 },
    );
  }

  // ── CSRF: Validate state-changing API requests ─────────────────
  // Skip CSRF for:
  //  - GET/HEAD/OPTIONS (safe methods)
  //  - SSE sync endpoint (long-lived connection, already auth'd via edit key)
  //  - Webhook endpoints
  if (isApiRoute && !pathname.startsWith('/api/sync') && !pathname.startsWith('/api/keep-alive')) {
    if (!validateCsrf(request)) {
      const method = request.method.toUpperCase();
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return NextResponse.json(
          { error: 'Invalid or missing CSRF token' },
          { status: 403 },
        );
      }
    }
  }

  // ── Set CORS headers on API responses ──────────────────────────
  const response = NextResponse.next();

  if (isApiRoute) {
    const corsHeaders = getCorsHeaders(request);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }
  }

  // ── Set CSRF cookie on page loads (non-API) ────────────────────
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
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
