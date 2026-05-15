"use client";

import { useEffect, Suspense, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { hasAnalyticsConsent, onConsentChange } from "@/lib/consent";

import type { PostHog } from "posthog-js";
import type {
  PostHogProvider as PHProviderType,
  usePostHog as usePostHogType,
} from "posthog-js/react";

let _usePostHog: () => ReturnType<typeof usePostHogType> | undefined = () => undefined;
export function usePostHog(): ReturnType<typeof usePostHogType> | undefined {
  return _usePostHog();
}

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

function PostHogIdentify() {
  const { userId } = useAuth();
  const { user } = useUser();
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog || !hasAnalyticsConsent()) return;
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

const IGNORED_EXCEPTION_PATTERNS = [
  /AbortError.*[Tt]ransition/, /transition was skipped/i, /transition was aborted/i,
  /Old view transition aborted/i, /Skipped ViewTransition/i, /InvalidStateError.*[Tt]ransition/,
  /InvalidStateError.*startViewTransition/, /InvalidStateError.*Worker/, /redundant/i,
  /Failed to update a ServiceWorker/i, /ServiceWorker script.*encountered an error during installation/i,
  /An unknown error occurred when fetching the script/i, /Loading chunk \d+ failed/i,
  /Loading CSS chunk/i, /ChunkLoadError/i, /Failed to fetch dynamically imported module/i,
  /Failed to load Clerk/i, /ClerkJS: Network error/i, /failed_to_load_clerk/i,
  /ResizeObserver loop/i, /Non-Error promise rejection captured/i, /Script error\.?$/i,
];

const IGNORED_EXCEPTION_SOURCES = [
  /clerk\.pokemonvgcteamreport\.com/i, /clerk\.com\//i,
  /\/dist\/clerk\./i, /\/dist\.clerk/i, /\/dist\/ui\.browser\./i,
];

function shouldIgnoreException(message: string): boolean {
  return IGNORED_EXCEPTION_PATTERNS.some((re) => re.test(message));
}

function shouldIgnoreSource(source: string): boolean {
  return IGNORED_EXCEPTION_SOURCES.some((re) => re.test(source));
}

const INTERNAL_FLAG_KEY = "vgc-internal-user";

function isFlaggedInternal(): boolean {
  if (typeof window === "undefined") return false;
  try { return window.localStorage.getItem(INTERNAL_FLAG_KEY) === "1"; } catch { return false; }
}

function maybeSetInternalFlagFromQuery() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("internal");
    if (flag === "1") { window.localStorage.setItem(INTERNAL_FLAG_KEY, "1"); }
    else if (flag === "0") { window.localStorage.removeItem(INTERNAL_FLAG_KEY); }
  } catch {}
}

const INTERNAL_USER_IDS = new Set(
  (process.env.NEXT_PUBLIC_INTERNAL_USER_IDS ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean),
);

async function initPostHogAnonymous(posthog: PostHog) {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return;
  if (posthog.__loaded) return;
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
    persistence: "memory",
    disable_session_recording: true,
    before_send: (event) => {
      if (event?.event === "$exception") {
        const props = (event.properties ?? {}) as Record<string, unknown>;
        const list = (props.$exception_list as Array<Record<string, unknown>> | undefined) ?? [];
        const messageCandidates = [
          props.$exception_message, props.$exception_type,
          ...list.map((e) => e?.value), ...list.map((e) => e?.type),
        ].filter((v): v is string => typeof v === "string");
        if (messageCandidates.some(shouldIgnoreException)) return null;
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
    loaded: (ph) => { if (process.env.NODE_ENV === "development") ph.debug(); },
  });
}

function upgradeToFullTracking(posthog: PostHog) {
  if (!posthog.__loaded) return;
  posthog.set_config({ persistence: "localStorage+cookie", disable_session_recording: false });
  posthog.set_config({ session_recording: { maskAllInputs: false, maskInputOptions: { password: true } } });
  posthog.startSessionRecording();
}

let _posthogSingleton: PostHog | null = null;
let _PHProvider: typeof PHProviderType | null = null;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return;
    let unsubConsent: (() => void) | undefined;
    const load = () => {
      Promise.all([import("posthog-js"), import("posthog-js/react")]).then(
        ([{ default: posthog }, { PostHogProvider: PHProvider, usePostHog }]) => {
          _posthogSingleton = posthog;
          _PHProvider = PHProvider;
          _usePostHog = usePostHog;
          initPostHogAnonymous(posthog);
          if (hasAnalyticsConsent()) upgradeToFullTracking(posthog);
          unsubConsent = onConsentChange((accepted) => { if (accepted) upgradeToFullTracking(posthog); });
          setReady(true);
        }
      );
    };
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(load, { timeout: 3000 });
    } else {
      setTimeout(load, 0);
    }
    return () => { unsubConsent?.(); };
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return <>{children}</>;
  if (!ready || !_PHProvider || !_posthogSingleton) return <>{children}</>;

  const PHProvider = _PHProvider;
  const posthogClient = _posthogSingleton;

  return (
    <PHProvider client={posthogClient}>
      <Suspense fallback={null}>
        <PostHogPageView />
        <PostHogIdentify />
      </Suspense>
      {children}
    </PHProvider>
  );
}
