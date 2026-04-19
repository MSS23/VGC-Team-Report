"use client";

import { useCallback, useSyncExternalStore } from "react";
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

// ─── External store: lets pages hide the persistent navbar ────
// Used by the home page report view which has its own Navbar component.
const listeners = new Set<() => void>();
let hidden = false;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot() { return hidden; }
function getServerSnapshot() { return false; }

/** Call from pages that render their own navbar (e.g. report view). */
export function hidePageNavbar() {
  if (hidden) return;
  hidden = true;
  listeners.forEach((fn) => fn());
}

/** Call when the page no longer needs to hide the navbar. */
export function showPageNavbar() {
  if (!hidden) return;
  hidden = false;
  listeners.forEach((fn) => fn());
}

/**
 * Renders PageNavbar once in the root layout so it persists across
 * client-side navigations instead of remounting on every page.
 *
 * Hidden on share (/s/) and embed (/embed/) routes, and when a page
 * explicitly hides it via hidePageNavbar().
 */
export function PersistentNavbar() {
  const pathname = usePathname();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const isHidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Hide on excluded routes
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  // Hide when a page explicitly requests it (e.g. report view)
  if (isHidden) return null;

  return (
    <PageNavbar
      darkMode={darkMode}
      onToggleDarkMode={toggleDarkMode}
      activePage={getActivePage(pathname)}
    />
  );
}
