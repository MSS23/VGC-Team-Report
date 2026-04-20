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

    // Internal user kill switch (logged-in path): if this Clerk user ID is in
    // NEXT_PUBLIC_INTERNAL_USER_IDS, opt out of all capture and persist the
    // localStorage flag so future logged-out sessions on this device stay
    // filtered too.
    if (userId && INTERNAL_USER_IDS.has(userId)) {
      try { window.localStorage.setItem(INTERNAL_FLAG_KEY, "1"); } catch {}
      posthog.opt_out_capturing();
      return;
    }

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

// Benign-error patterns we never want flooding Linear via the PostHog → Linear sync.
// These come from rapid navigation, stale tabs after deploy, browser quirks,
// third-party SDK loading races, or extension noise — they recover automatically
// and don't represent real bugs in our code.
const IGNORED_EXCEPTION_PATTERNS = [
  // VGC-117: View Transition API aborts on rapid navigation. The four
  // observed variants all match /transition/i — keep the patterns tight
  // enough to not swallow real transition bugs.
  /AbortError.*[Tt]ransition/,
  /transition was skipped/i,
  /transition was aborted/i,
  /Old view transition aborted/i,
  /Skipped ViewTransition/i,
  /InvalidStateError.*[Tt]ransition/,
  /InvalidStateError.*startViewTransition/,
  // VGC-118: Service worker state churn — install/update races during deploy
  // when Vercel is mid-flight and the new SW script isn't fetchable yet.
  /InvalidStateError.*Worker/,
  /redundant/i,
  /Failed to update a ServiceWorker/i,
  /ServiceWorker script.*encountered an error during installation/i,
  /An unknown error occurred when fetching the script/i,
  // VGC-119: Stale chunks after deploy (auto-reloaded by ChunkErrorReloader)
  /Loading chunk \d+ failed/i,
  /Loading CSS chunk/i,
  /ChunkLoadError/i,
  /Failed to fetch dynamically imported module/i,
  // Clerk SDK loading failures — Clerk's CDN occasionally fails to serve
  // the JS/UI bundles; the SDK retries and recovers, and these are not
  // bugs in our code. Filtering by message + source URL below.
  /Failed to load Clerk/i,
  /ClerkJS: Network error/i,
  /failed_to_load_clerk/i,
  // Browser/extension noise
  /ResizeObserver loop/i,
  /Non-Error promise rejection captured/i,
  /Script error\.?$/i,
];

// Source URLs we treat as "not our code" — exceptions originating in these
// domains/chunks are dropped because we can't fix third-party SDK errors and
// they crowd out signal from our own bugs.
const IGNORED_EXCEPTION_SOURCES = [
  /clerk\.pokemonvgcteamreport\.com/i,
  /clerk\.com\//i,
  /\/dist\/clerk\./i,
  /\/dist\.clerk/i,
  /\/dist\/ui\.browser\./i,
];

function shouldIgnoreException(message: string): boolean {
  return IGNORED_EXCEPTION_PATTERNS.some((re) => re.test(message));
}

function shouldIgnoreSource(source: string): boolean {
  return IGNORED_EXCEPTION_SOURCES.some((re) => re.test(source));
}

// Internal-user kill switch. Set via either:
//   1. Visit /?internal=1 once per device → flag stored in localStorage
//   2. Be signed in as a known internal Clerk user ID (see PostHogIdentify)
// Either path opts the user out of capturing entirely so testing your own app
// doesn't pollute funnels, replays, or error tickets.
const INTERNAL_FLAG_KEY = "vgc-internal-user";

function isFlaggedInternal(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(INTERNAL_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

function maybeSetInternalFlagFromQuery() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("internal");
    if (flag === "1") {
      window.localStorage.setItem(INTERNAL_FLAG_KEY, "1");
    } else if (flag === "0") {
      // Escape hatch: ?internal=0 clears the flag (re-enable capture for this device)
      window.localStorage.removeItem(INTERNAL_FLAG_KEY);
    }
  } catch {
    // localStorage blocked / private mode — capture stays enabled, no harm
  }
}

/**
 * Comma-separated list of Clerk user IDs to always treat as internal.
 * Set NEXT_PUBLIC_INTERNAL_USER_IDS in Vercel env vars (e.g.
 * "user_2abc...,user_2xyz..."). Combined with the localStorage flag so
 * you're filtered whether logged in or out.
 */
const INTERNAL_USER_IDS = new Set(
  (process.env.NEXT_PUBLIC_INTERNAL_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

/** Always init in cookieless mode — safe without consent */
function initPostHogAnonymous() {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return;
  if (posthog.__loaded) return;

  // Honour the kill switch BEFORE init — once flagged, never capture on this device.
  maybeSetInternalFlagFromQuery();
  if (isFlaggedInternal()) return;

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
    // Drop benign exceptions before they reach PostHog (and the Linear sync).
    // Two layers: (1) message/type pattern match, (2) source-URL match for
    // exceptions originating in third-party SDKs (Clerk).
    before_send: (event) => {
      if (event?.event === "$exception") {
        const props = (event.properties ?? {}) as Record<string, unknown>;
        const list = (props.$exception_list as Array<Record<string, unknown>> | undefined) ?? [];

        // Layer 1 — message / type patterns
        const messageCandidates = [
          props.$exception_message,
          props.$exception_type,
          ...list.map((e) => e?.value),
          ...list.map((e) => e?.type),
        ].filter((v): v is string => typeof v === "string");
        if (messageCandidates.some(shouldIgnoreException)) return null;

        // Layer 2 — source URL (filters Clerk SDK errors regardless of message)
        const sourceCandidates: string[] = [];
        if (typeof props.$exception_source === "string") sourceCandidates.push(props.$exception_source);
        for (const e of list) {
          if (typeof e?.stacktrace === "object" && e.stacktrace) {
            const frames = (e.stacktrace as { frames?: Array<{ filename?: string }> }).frames ?? [];
            for (const f of frames) if (typeof f.filename === "string") sourceCandidates.push(f.filename);
          }
        }
        if (sourceCandidates.some(shouldIgnoreSource)) return null;
      }
      return event;
    },
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
