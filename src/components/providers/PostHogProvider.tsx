"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { hasAnalyticsConsent, onConsentChange } from "@/lib/consent";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + "?" + searchParams.toString();
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}

/** Identifies user only after consent is granted */
function PostHogIdentify() {
  const { userId } = useAuth();
  const { user } = useUser();
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog || !hasAnalyticsConsent()) return;

    if (userId) {
      posthog.identify(userId, {
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName ?? user?.username,
      });
    } else {
      posthog.reset();
    }
  }, [userId, user, posthog]);

  return null;
}

/** Always init in cookieless mode — safe without consent */
function initPostHogAnonymous() {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return;
  if (posthog.__loaded) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    capture_exceptions: true,
    // Cookieless: memory-only, no data stored on device
    persistence: "memory",
    // No session replay until consent
    disable_session_recording: true,
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") ph.debug();
    },
  });
}

/** Upgrade to full tracking after consent */
function upgradeToFullTracking() {
  if (!posthog.__loaded) return;

  posthog.set_config({
    persistence: "localStorage+cookie",
    disable_session_recording: false,
  });
  posthog.set_config({
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: { password: true },
    },
  });
  posthog.startSessionRecording();
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Always init in anonymous/cookieless mode
    initPostHogAnonymous();

    // If user already consented, upgrade immediately
    if (hasAnalyticsConsent()) upgradeToFullTracking();

    // Listen for future consent
    const unsub = onConsentChange((accepted) => {
      if (accepted) upgradeToFullTracking();
    });
    return unsub;
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
        <PostHogIdentify />
      </Suspense>
      {children}
    </PHProvider>
  );
}
