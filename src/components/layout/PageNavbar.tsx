"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

interface PageNavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activePage?: "home" | "changelog" | "feedback" | "explore" | "dashboard" | "compare" | "privacy" | "terms" | "creator" | "champions";
}

const NAV_LINKS = [
  { href: "/", label: "Home", key: "home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { href: "/explore", label: "Explore", key: "explore", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { href: "/champions", label: "Champions", key: "champions", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { href: "/compare", label: "Compare", key: "compare", icon: "M18 20V10M12 20V4M6 20v-6" },
  { href: "/changelog", label: "Updates", key: "changelog", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/feedback", label: "Feedback", key: "feedback", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
] as const;

const linkClass = (active: boolean) =>
  `inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold transition-colors duration-(--dur-short) ${
    active ? "text-accent" : "text-text-secondary hover:text-text-primary"
  }`;

/**
 * Edge-aligned nav: the wordmark and the page's destinations sit together at
 * the left edge, the account and the two switches at the right edge, one
 * hairline under. Every destination, handler and the mobile tab bar are kept.
 */
export function PageNavbar({ darkMode, onToggleDarkMode, activePage }: PageNavbarProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Wait for Clerk to load before showing auth UI to prevent flash
  const showSignIn = isLoaded && !isSignedIn;
  const showUser = isLoaded && isSignedIn;
  const compactLinks = NAV_LINKS.filter((link) => link.key === "explore" || link.key === "champions");
  const overflowLinks = NAV_LINKS.filter((link) => link.key !== "home" && link.key !== "explore" && link.key !== "champions");
  const overflowActive = overflowLinks.some((link) => link.key === activePage);

  useEffect(() => {
    if (!moreOpen) return;
    const close = (event: MouseEvent) => {
      if (!moreMenuRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [moreOpen]);

  return (
    <>
      <header className="sticky top-0 z-(--z-sticky-nav) border-b border-border bg-background sticky-header-standalone">
        <div className="mx-auto flex h-16 max-w-(--container) items-center justify-between gap-4 px-(--gutter)">
          {/* Left edge: wordmark, then the destinations */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-6">
            <Link href="/" aria-label="VGC Team Report, home" className="inline-flex min-h-11 items-center text-base font-bold tracking-tight text-text-primary hover:text-accent transition-colors duration-(--dur-short)">
              VGC Team Report
            </Link>

            <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary navigation">
              <Link href="/" className={linkClass(activePage === "home")}>
                Create
              </Link>
              {compactLinks.map((link) => (
                <Link key={link.key} href={link.href} className={linkClass(activePage === link.key)}>
                  {link.label}
                </Link>
              ))}
              <div className="relative xl:hidden" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setMoreOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                  className={`${linkClass(overflowActive || moreOpen)} cursor-pointer`}
                >
                  More
                </button>
                {moreOpen && (
                  <div
                    role="menu"
                    aria-label="More navigation"
                    className="absolute left-0 top-full z-(--z-dropdown) mt-2 w-48 rounded-card border border-border bg-surface p-1.5"
                  >
                    {overflowLinks.map((link) => (
                      <Link
                        key={link.key}
                        href={link.href}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={`flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors duration-(--dur-short) ${
 activePage === link.key ? "text-accent" : "text-text-secondary hover:bg-surface-alt hover:text-text-primary"
                        }`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d={link.icon} />
                        </svg>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="hidden xl:contents">
                {overflowLinks.map((link) => (
                  <Link key={link.key} href={link.href} className={linkClass(activePage === link.key)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>

          {/* Right edge: account, language, dark mode */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {showUser && (
              <>
                <Link href="/dashboard" className={`hidden xl:inline-flex ${linkClass(activePage === "dashboard")}`}>
                  Dashboard
                </Link>
                <UserButton appearance={{ elements: { userButtonTrigger: "min-w-11 min-h-11", avatarBox: "w-8 h-8" } }} />
              </>
            )}

            <LanguageSelector />

            <button
              type="button"
              onClick={onToggleDarkMode}
              className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-text-secondary transition-colors duration-(--dur-short) hover:bg-surface-alt hover:text-text-primary"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
              )}
            </button>

            {showSignIn && (
              <SignInButton mode="modal">
                <button type="button" className="ml-1 inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-text-primary px-4 text-sm font-semibold text-text-primary transition-colors duration-(--dur-short) hover:bg-surface-alt">
                  Sign in
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar, always render all 5 tabs to prevent layout shift */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-(--z-sticky-nav) bg-surface border-t border-border safe-bottom safe-x" aria-label="Mobile navigation">
        <div className="flex items-center justify-around px-0.5 pt-1 pb-0.5">
          {[
            { href: "/", label: "Create", key: "home", icon: "M12 5v14M5 12h14" },
            ...NAV_LINKS.filter((l) => l.key === "explore" || l.key === "champions" || l.key === "compare"),
            { href: "/dashboard", label: "Dashboard", key: "dashboard" as const, icon: "M4 6h16M4 12h16M4 18h7" },
          ].map((link) => {
            const isActive = activePage === link.key;
            return (
              <Link
                key={link.key}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex min-h-12 min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 py-1 transition-colors duration-(--dur-short) ${
 isActive ? "text-accent" : "text-text-secondary"
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? "2.5" : "1.8"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={link.icon} />
                </svg>
                <span className="text-xs font-semibold leading-none">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
