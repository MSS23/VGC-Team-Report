"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";
import { hasAnalyticsConsent } from "@/lib/consent";

/**
 * Loads Microsoft Clarity (session recording + heatmaps).
 *
 * MUST stay wrapped in <ConsentGate> in app/layout.tsx. Clarity records sessions
 * and writes _clck/_clsk cookies, so under GDPR/ePrivacy it may not load before
 * the visitor has accepted the analytics category.
 *
 * The hasAnalyticsConsent() check below is defence in depth: this component was
 * mounted bare in layout.tsx for a period in 2026 (the ConsentGate wrapper was
 * removed as collateral when @vercel/analytics was stripped in 4061d5b), which
 * made Clarity fire before the banner was answered. Even if the gate is dropped
 * again, this refuses to init without consent.
 *
 * Consent granted later in the session: ConsentGate re-renders and mounts this
 * component; vanilla-cookieconsent writes cc_cookie *before* it fires its
 * onConsent/onChange callbacks, so the check below already sees the new value.
 *
 * Consent revoked: ConsentGate unmounts this component and the cleanup below
 * signals the withdrawal. The injected script tag cannot be un-injected, so
 * Clarity.consent(false) is the documented way to stop cookie use and tracking.
 */
export function ClarityProvider() {
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_CLARITY_ID;
    if (!id) return;
    if (!hasAnalyticsConsent()) return;

    Clarity.init(id);
    Clarity.consent(true);

    return () => {
      try {
        Clarity.consent(false);
      } catch {
        // Script may not have finished loading — nothing to withdraw.
      }
    };
  }, []);

  return null;
}
