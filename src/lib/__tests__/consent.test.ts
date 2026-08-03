// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasAnalyticsConsent, onConsentChange, notifyConsentChange } from "@/lib/consent";

const COOKIE_NAME = "cc_cookie";

/** Write cc_cookie exactly the way vanilla-cookieconsent does (URI-encoded JSON). */
function setConsentCookie(value: unknown) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(value))}; path=/`;
}

function clearCookies() {
  for (const entry of document.cookie.split("; ")) {
    const name = entry.split("=")[0];
    if (!name) continue;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
  }
}

describe("hasAnalyticsConsent", () => {
  beforeEach(() => {
    clearCookies();
  });

  it("returns false when no consent cookie exists (first-time visitor)", () => {
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("returns true when the analytics category was accepted", () => {
    setConsentCookie({ categories: ["necessary", "analytics"], revision: 0 });
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it("returns false when only necessary cookies were accepted (Reject all)", () => {
    setConsentCookie({ categories: ["necessary"], revision: 0 });
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("returns false when categories is missing or not an array", () => {
    setConsentCookie({ revision: 0 });
    expect(hasAnalyticsConsent()).toBe(false);

    clearCookies();
    setConsentCookie({ categories: "analytics" });
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("returns false instead of throwing on a malformed cookie value", () => {
    document.cookie = `${COOKIE_NAME}=not-json; path=/`;
    expect(() => hasAnalyticsConsent()).not.toThrow();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("is not confused by other cookies sharing a name prefix", () => {
    document.cookie = `${COOKIE_NAME}_other=${encodeURIComponent(
      JSON.stringify({ categories: ["analytics"] }),
    )}; path=/`;
    expect(hasAnalyticsConsent()).toBe(false);

    setConsentCookie({ categories: ["necessary", "analytics"] });
    expect(hasAnalyticsConsent()).toBe(true);
  });
});

describe("onConsentChange / notifyConsentChange", () => {
  beforeEach(() => {
    clearCookies();
  });

  it("notifies subscribers when consent is granted", () => {
    const listener = vi.fn();
    const unsubscribe = onConsentChange(listener);

    notifyConsentChange(true);

    expect(listener).toHaveBeenCalledWith(true);
    unsubscribe();
  });

  it("notifies subscribers when consent is revoked", () => {
    const listener = vi.fn();
    const unsubscribe = onConsentChange(listener);

    notifyConsentChange(false);

    expect(listener).toHaveBeenCalledWith(false);
    unsubscribe();
  });

  it("notifies every subscriber — ConsentGate and PostHogProvider both listen", () => {
    const gate = vi.fn();
    const posthog = vi.fn();
    const unsubGate = onConsentChange(gate);
    const unsubPosthog = onConsentChange(posthog);

    notifyConsentChange(true);

    expect(gate).toHaveBeenCalledWith(true);
    expect(posthog).toHaveBeenCalledWith(true);
    unsubGate();
    unsubPosthog();
  });

  it("stops notifying after unsubscribe, and unsubscribe returns void", () => {
    const listener = vi.fn();
    const unsubscribe = onConsentChange(listener);

    expect(unsubscribe()).toBeUndefined();
    notifyConsentChange(true);

    expect(listener).not.toHaveBeenCalled();
  });

  it("unsubscribing twice is safe", () => {
    const unsubscribe = onConsentChange(vi.fn());
    unsubscribe();
    expect(() => unsubscribe()).not.toThrow();
  });
});

/**
 * Regression: ConsentGate was unwired from app/layout.tsx as collateral when
 * @vercel/analytics was stripped (4061d5b), leaving ClarityProvider mounted bare
 * and calling Clarity.init() before the cookie banner was answered.
 *
 * These assert the contract ConsentGate and ClarityProvider rely on: consent
 * defaults to denied, and a mid-session grant/revoke is observable without a reload.
 */
describe("regression: analytics must not run before consent is granted", () => {
  beforeEach(() => {
    clearCookies();
  });

  it("defaults to denied so a gated SDK never initialises for a fresh visitor", () => {
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("reflects a mid-session grant without a reload", () => {
    const gate = vi.fn();
    const unsubscribe = onConsentChange(gate);

    expect(hasAnalyticsConsent()).toBe(false);

    // vanilla-cookieconsent writes cc_cookie before firing its callbacks, so the
    // cookie is already readable by the time subscribers run.
    setConsentCookie({ categories: ["necessary", "analytics"] });
    notifyConsentChange(true);

    expect(gate).toHaveBeenCalledWith(true);
    expect(hasAnalyticsConsent()).toBe(true);
    unsubscribe();
  });

  it("reflects a mid-session revocation without a reload", () => {
    setConsentCookie({ categories: ["necessary", "analytics"] });
    expect(hasAnalyticsConsent()).toBe(true);

    const gate = vi.fn();
    const unsubscribe = onConsentChange(gate);

    clearCookies();
    setConsentCookie({ categories: ["necessary"] });
    notifyConsentChange(false);

    expect(gate).toHaveBeenCalledWith(false);
    expect(hasAnalyticsConsent()).toBe(false);
    unsubscribe();
  });

  it("is safe to call server-side (no document)", () => {
    const doc = globalThis.document;
    // @ts-expect-error - simulating the server environment
    delete globalThis.document;
    try {
      expect(hasAnalyticsConsent()).toBe(false);
    } finally {
      globalThis.document = doc;
    }
  });
});
