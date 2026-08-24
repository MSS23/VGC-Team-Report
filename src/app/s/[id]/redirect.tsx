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
   * True when the server already rendered the report body (VGC-275). The
   * hand-off to the interactive app still happens, but we render nothing:
   * covering real content with a spinner would be a downgrade, and the
   * server-rendered view already supplies the page's <h1>.
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
