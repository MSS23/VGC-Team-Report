/**
 * CSRF Protection via double-submit cookie pattern.
 *
 * For state-changing requests (POST/PUT/DELETE/PATCH), validates that
 * the X-CSRF-Token header matches the csrf_token cookie.
 *
 * This is lightweight and stateless — no server-side token storage needed.
 */

import { NextResponse } from "next/server";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";
const TOKEN_LENGTH = 32;

/** Generate a cryptographically random CSRF token */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Validate CSRF token from header matches cookie */
export function validateCsrf(request: Request): boolean {
  const method = request.method.toUpperCase();

  // Only validate state-changing methods
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return true;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key, rest.join("=")];
    })
  );

  const cookieToken = cookies[CSRF_COOKIE];
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length !== TOKEN_LENGTH * 2) return false;

  return cookieToken === headerToken;
}

/** Create a response that sets the CSRF cookie (for initial page load) */
export function setCsrfCookie(response: NextResponse): NextResponse {
  const token = generateCsrfToken();
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false, // Must be readable by JavaScript
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 86400, // 24 hours
  });
  return response;
}
