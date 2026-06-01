"use client";

import { useEffect } from "react";
import { hasAnalyticsConsent, onConsentChange } from "@/lib/consent";

export function ClarityProvider() {
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_CLARITY_ID;
    if (!id) return;

    let initialised = false;

    const tryInit = async () => {
      if (initialised) return;
      if (!hasAnalyticsConsent()) return;
      initialised = true;
      try {
        const Clarity = (await import("@microsoft/clarity")).default;
        Clarity.init(id);
      } catch {
        // Allow a retry if the dynamic import fails (e.g. network/chunk error).
        initialised = false;
      }
    };

    // Attempt immediately in case consent was already granted on prior visit.
    void tryInit();

    // Re-attempt when consent is granted later in the session.
    const unsubscribe = onConsentChange((accepted) => {
      if (accepted) void tryInit();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return null;
}
