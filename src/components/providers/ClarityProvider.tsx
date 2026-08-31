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
 *
 * The SDK is lazy-imported, so consent can flip while that import is still in
 * flight. `wanted` holds the user's latest intent and is re-read AFTER the
 * await, so a stale in-flight start can never init or re-enable recording for
 * someone who has since opted out.
 */
export function ClarityProvider() {
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_CLARITY_ID;
    if (!id) return;

    let cancelled = false; // effect torn down
    let wanted = false; // latest consent intent — the single source of truth
    let initialised = false; // Clarity.init has run; never run it twice
    let loading = false; // an import is in flight
    let clarity: typeof import("@microsoft/clarity").default | null = null;

    // Brings Clarity in line with `wanted`. Only ever called with the SDK
    // resolved, and never inits for a user who has not (or no longer) consented.
    const apply = () => {
      if (cancelled || !clarity) return;
      if (!initialised) {
        if (!wanted) return; // never started — nothing to stop
        clarity.init(id);
        initialised = true;
      }
      clarity.consent(wanted);
    };

    // Lazy import keeps the Clarity SDK out of every route's initial bundle —
    // it only loads once analytics consent actually exists.
    const start = async () => {
      if (clarity) {
        apply();
        return;
      }
      if (loading) return; // the in-flight import re-checks `wanted` on resolve
      loading = true;
      try {
        const { default: Clarity } = await import("@microsoft/clarity");
        clarity = Clarity; // capture it so a later withdrawal can stop tracking
      } catch {
        return; // SDK failed to load — nothing to start or stop
      } finally {
        loading = false;
      }
      apply();
    };

    if (hasAnalyticsConsent()) {
      wanted = true;
      void start();
    }

    const unsubscribe = onConsentChange((accepted) => {
      wanted = accepted;
      if (accepted) void start();
      else apply(); // consent(false) only if the SDK is already loaded and init'd
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return null;
}
