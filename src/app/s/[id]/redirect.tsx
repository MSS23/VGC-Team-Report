"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ShareRedirectClient({
  to,
  heading,
  silent = false,
}: {
  to: string;
  heading?: string;
  /**
   * True when the page already server-rendered a content hero (see `hero.tsx`).
   * The redirect still fires on hydration; we just render nothing, so the
   * recipient keeps looking at their team instead of having it replaced by a
   * spinner, and the page keeps exactly one <h1>.
   */
  silent?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [to, router]);

  if (silent) return null;

  return (
    <main className="min-h-screen flex items-center justify-center">
      {/* Visually-hidden H1 so screen readers and SEO crawlers always have a
          top-level heading on the shared-report page, even before the client
          redirect hands control to the renderer at /?s=<id>. */}
      <h1 className="sr-only">{heading ?? "VGC Team Report"}</h1>
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm">Loading shared team...</p>
      </div>
    </main>
  );
}
