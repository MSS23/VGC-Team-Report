"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";
import { hasAnalyticsConsent, onConsentChange } from "@/lib/consent";

/**
 * Initialises Microsoft Clarity (session replay) ONLY after analytics consent.
 *
 * Clarity has no "unload" API, so init is deferred until consent exists and is
 * run at most once. If consent is withdrawn later in the session we call
 * Clarity.consent(false) to stop cookie-based tracking; recording fully stops
 * on the next page load.
 */
export function ClarityProvider() {
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_CLARITY_ID;
    if (!id) return;

    let started = false;

    const start = () => {
      if (started) return;
      started = true;
      Clarity.init(id);
      Clarity.consent(true);
    };

    if (hasAnalyticsConsent()) start();

    return onConsentChange((accepted) => {
      if (accepted) start();
      else if (started) Clarity.consent(false);
    });
  }, []);

  return null;
}
