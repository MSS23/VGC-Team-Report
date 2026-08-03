"use client";

import { useSyncExternalStore } from "react";
import { hasAnalyticsConsent, onConsentChange } from "@/lib/consent";

interface ConsentGateProps {
  children: React.ReactNode;
}

/** Server render (and hydration) always assumes consent has NOT been granted. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Renders children ONLY when analytics consent has been granted.
 * Currently gates <ClarityProvider /> in app/layout.tsx.
 *
 * Consent is modelled as an external store: cc_cookie is the source of truth
 * (hasAnalyticsConsent) and CookieBanner's notifyConsentChange is the change
 * notification. vanilla-cookieconsent writes cc_cookie *before* it fires its
 * onConsent/onChange callbacks, so the snapshot read on notification is current.
 *
 * That means accepting the banner mounts analytics without a page reload, and
 * revoking in the preferences modal unmounts them the same way.
 *
 * When consent is false or unknown: renders nothing (zero network requests).
 *
 * DO NOT DELETE when this looks orphaned. It was previously wrapped around
 * <Analytics /> only, so stripping @vercel/analytics (4061d5b) left it with no
 * call sites and Microsoft Clarity loading before the banner was answered — a
 * GDPR regression that repeat "dead code" passes then tried to make permanent.
 * If it has no children, the correct fix is to gate something with it.
 */
export function ConsentGate({ children }: ConsentGateProps) {
  const consented = useSyncExternalStore(
    onConsentChange,
    hasAnalyticsConsent,
    getServerSnapshot,
  );

  if (!consented) return null;

  return <>{children}</>;
}
