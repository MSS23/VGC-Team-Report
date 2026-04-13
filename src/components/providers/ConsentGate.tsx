"use client";

import { useState, useEffect } from "react";
import { hasAnalyticsConsent, onConsentChange } from "@/lib/consent";

interface ConsentGateProps {
  children: React.ReactNode;
}

/**
 * Renders children ONLY when analytics consent has been granted.
 * Used to gate <Analytics /> and other consent-dependent components.
 *
 * On initial mount: reads the cc_cookie to determine prior consent.
 * On consent change: subscribes via onConsentChange and re-renders.
 *
 * When consent is false or unknown: renders nothing (zero network requests).
 */
export function ConsentGate({ children }: ConsentGateProps) {
  const [consented, setConsented] = useState<boolean>(false);

  useEffect(() => {
    // Check consent state from cookie on mount (handles returning visitors)
    setConsented(hasAnalyticsConsent());

    // Subscribe to live changes (handles accept/reject during same session)
    const unsubscribe = onConsentChange((accepted) => {
      setConsented(accepted);
    });

    return unsubscribe;
  }, []);

  if (!consented) return null;

  return <>{children}</>;
}
