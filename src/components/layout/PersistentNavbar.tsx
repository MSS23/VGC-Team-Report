"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useDarkMode } from "@/hooks/useDarkMode";
import { PageNavbar } from "@/components/layout/PageNavbar";

type ActivePage = "home" | "changelog" | "feedback" | "explore" | "dashboard" | "compare" | "privacy" | "terms" | "creator" | "champions";

/** Routes where the persistent navbar should NOT render */
const HIDDEN_PREFIXES = ["/s/", "/embed/"];

/** Derive the activePage prop from the current pathname */
function getActivePage(pathname: string): ActivePage {
  if (pathname === "/") return "home";
  if (pathname === "/explore") return "explore";
  if (pathname.startsWith("/champions")) return "champions";
  if (pathname === "/compare") return "compare";
  if (pathname === "/changelog") return "changelog";
  if (pathname === "/feedback") return "feedback";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/creator/")) return "creator";
  if (pathname === "/privacy") return "privacy";
  if (pathname === "/terms") return "terms";
  return "home";
}

/**
 * Renders PageNavbar once in the root layout so it persists across
 * client-side navigations instead of remounting on every page.
 *
 * Hidden on share (/s/) and embed (/embed/) routes.
 */
export function PersistentNavbar() {
  const pathname = usePathname();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [hasHashShare, setHasHashShare] = useState(false);

  useEffect(() => {
    const updateHashContext = () => {
      setHasHashShare(
        window.location.hash.startsWith("#id=") ||
        window.location.hash.startsWith("#data="),
      );
    };
    updateHashContext();
    window.addEventListener("hashchange", updateHashContext);
    return () => window.removeEventListener("hashchange", updateHashContext);
  }, []);

  // Shared reports are initially routed through /?s={id}, then clean the
  // visible URL to /s/{id}. Hide the global navbar for both phases so the
  // report's purpose-built navigation is the only header on screen.
  const isShareContext =
    hasHashShare ||
    (typeof window !== "undefined" && window.location.pathname.startsWith("/s/"));

  if (isShareContext || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const navbar = (
    <PageNavbar
      darkMode={darkMode}
      onToggleDarkMode={toggleDarkMode}
      activePage={getActivePage(pathname)}
    />
  );

  // The remaining half of the share context — the `?s={id}` query — needs
  // useSearchParams, which bails its nearest Suspense boundary to the
  // fallback during static prerendering. Giving that read its own boundary
  // keeps the bailout off the navbar itself, so every route prerenders its
  // nav links into the static HTML instead of an empty root-layout fallback.
  //
  // `?s=` share links only ever land on "/", so only "/" has to prerender
  // the empty fallback. Prerendering the navbar there too would paint a
  // global header over every incoming share link until hydration removed it
  // again (SEO-NAVBAR-SSR) — the double header that this share-context check
  // exists to prevent.
  return (
    <Suspense fallback={pathname === "/" ? null : navbar}>
      <HideWhenShareParam>{navbar}</HideWhenShareParam>
    </Suspense>
  );
}

/** Renders `children` unless the current URL carries a `?s={id}` share id. */
function HideWhenShareParam({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  if (searchParams.get("s")) return null;
  return <>{children}</>;
}
