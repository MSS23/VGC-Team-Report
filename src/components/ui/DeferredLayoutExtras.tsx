"use client";

import dynamic from "next/dynamic";

// None of these render anything above the fold — loading them after hydration
// keeps their code out of every route's initial bundle.
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
      <InstallPrompt />
      <ConnectivityStatus />
      <ServiceWorkerRegistration />
      <ChunkErrorReloader />
    </>
  );
}
