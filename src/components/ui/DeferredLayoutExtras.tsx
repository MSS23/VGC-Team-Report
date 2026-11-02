"use client";

import dynamic from "next/dynamic";

// None of these render anything above the fold — loading them after hydration
// keeps their code out of every route's initial bundle.
//
// CookieBanner is here too: it renders nothing synchronously (all of
// vanilla-cookieconsent runs in a useEffect) and consent is read from the
// cc_cookie cookie by @/lib/consent, never from this component, so the
// analytics gates (PostHogProvider, ClarityProvider) stay correct no matter
// when the banner mounts. Listed first so the notice is requested first.
const CookieBanner = dynamic(
  () => import("@/components/providers/CookieBanner").then((m) => m.CookieBanner),
  { ssr: false },
);
const ServiceWorkerRegistration = dynamic(
  () => import("@/components/ui/ServiceWorkerRegistration").then((m) => m.ServiceWorkerRegistration),
  { ssr: false },
);
const ChunkErrorReloader = dynamic(
  () => import("@/components/ui/ChunkErrorReloader").then((m) => m.ChunkErrorReloader),
  { ssr: false },
);
const InstallPrompt = dynamic(
  () => import("@/components/ui/InstallPrompt").then((m) => m.InstallPrompt),
  { ssr: false },
);
const ConnectivityStatus = dynamic(
  () => import("@/components/ui/ConnectivityStatus").then((m) => m.ConnectivityStatus),
  { ssr: false },
);

export function DeferredLayoutExtras() {
  return (
    <>
      <CookieBanner />
      <InstallPrompt />
      <ConnectivityStatus />
      <ServiceWorkerRegistration />
      <ChunkErrorReloader />
    </>
  );
}
