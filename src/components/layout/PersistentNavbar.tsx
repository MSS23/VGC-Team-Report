"use client";

import { usePathname } from "next/navigation";
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

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <PageNavbar
      darkMode={darkMode}
      onToggleDarkMode={toggleDarkMode}
      activePage={getActivePage(pathname)}
    />
  );
}
