"use client";

import { useEffect, useState } from "react";
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
  const searchParams = useSearchParams();
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
    !!searchParams.get("s") ||
    hasHashShare ||
    (typeof window !== "undefined" && window.location.pathname.startsWith("/s/"));

  if (isShareContext || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <PageNavbar
      darkMode={darkMode}
      onToggleDarkMode={toggleDarkMode}
      activePage={getActivePage(pathname)}
    />
  );
}
