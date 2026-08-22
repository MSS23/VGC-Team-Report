"use client";

import { useEffect } from "react";
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
    let clarity: typeof import("@microsoft/clarity").default | null = null;

    // Lazy import keeps the Clarity SDK out of every route's initial bundle —
    // it only loads once analytics consent actually exists.
    const start = async () => {
      if (started) return;
      started = true;
      const { default: Clarity } = await import("@microsoft/clarity");
      clarity = Clarity;
      Clarity.init(id);
      Clarity.consent(true);
    };

    if (hasAnalyticsConsent()) void start();

    return onConsentChange((accepted) => {
      if (accepted) void start();
      else if (started) clarity?.consent(false);
    });
  }, []);

  return null;
}
