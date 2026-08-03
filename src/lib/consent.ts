/**
 * Cookie consent utilities.
 * Cookie name: "cc_cookie" (written by vanilla-cookieconsent)
 * Analytics consent category name: "analytics"
 */

const COOKIE_NAME = "cc_cookie";
const ANALYTICS_CATEGORY = "analytics";

/**
 * Read the current cc_cookie value from document.cookie.
 * Returns true if the analytics category is in the accepted list.
 * Safe to call server-side (returns false if window is undefined).
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof document === "undefined") return false;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(COOKIE_NAME + "="));
  if (!match) return false;
  try {
    const value = JSON.parse(decodeURIComponent(match.split("=").slice(1).join("=")));
    return Array.isArray(value?.categories) && value.categories.includes(ANALYTICS_CATEGORY);
  } catch {
    return false;
  }
}

type ConsentListener = (accepted: boolean) => void;
const listeners = new Set<ConsentListener>();

/**
 * Subscribe to consent changes fired by CookieBanner.
 * Returns an unsubscribe function.
 *
 * Multiple subscribers are expected (ConsentGate and PostHogProvider both listen),
 * and every subscriber must be notified on both grant and withdrawal — that is what
 * lets analytics start/stop without a page reload.
 */
export function onConsentChange(fn: ConsentListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Called by CookieBanner when consent is accepted or rejected. */
export function notifyConsentChange(accepted: boolean): void {
  listeners.forEach((fn) => fn(accepted));
}
