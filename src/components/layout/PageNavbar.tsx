"use client";

import { useState, useEffect } from "react";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

interface PageNavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  maxWidth?: string;
  activePage?: "home" | "changelog" | "feedback" | "explore" | "dashboard" | "compare" | "privacy" | "creator" | "champions";
}

const NAV_LINKS = [
  { href: "/", label: "Home", key: "home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { href: "/explore", label: "Explore", key: "explore", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { href: "/champions", label: "Champions", key: "champions", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { href: "/compare", label: "Compare", key: "compare", icon: "M18 20V10M12 20V4M6 20v-6" },
  { href: "/changelog", label: "Updates", key: "changelog", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/feedback", label: "Feedback", key: "feedback", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
] as const;

export function PageNavbar({ darkMode, onToggleDarkMode, maxWidth = "max-w-5xl", activePage }: PageNavbarProps) {
  const { isLoaded, isSignedIn } = useAuth();

  // Show sign-in button by default until Clerk confirms user is signed in
  const showSignIn = !isSignedIn;
  const showUser = isLoaded && isSignedIn;

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface/90 border-b border-border shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 h-14 flex items-center justify-between`}>
          {/* Left: logo */}
          <a href="/" className="flex items-center gap-1.5 font-bold text-sm hover:opacity-80 transition-opacity">
            <span className="text-text-primary">VGC Team</span>
            <span className="text-accent">Report</span>
          </a>

          {/* Center: nav links (desktop) */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.filter((l) => l.key !== "home").map((link) => (
              <a
                key={link.key}
                href={link.href}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activePage === link.key
                    ? "text-accent bg-accent-surface/50"
                    : "text-text-tertiary hover:text-text-primary hover:bg-surface-alt"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right: auth + language + dark mode */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {showSignIn && (
              <SignInButton mode="modal">
                <button className="px-3 py-1.5 text-xs font-bold text-white bg-accent rounded-lg hover:brightness-110 transition-all cursor-pointer shadow-sm shadow-accent/20">
                  Sign In
                </button>
              </SignInButton>
            )}
            {showUser && (
              <>
                <a href="/dashboard" className="hidden sm:inline px-2.5 py-1.5 text-xs font-bold text-text-secondary hover:text-accent hover:bg-surface-alt rounded-lg transition-all">
                  Dashboard
                </a>
                <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
              </>
            )}

            <LanguageSelector />

            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-border safe-bottom" aria-label="Mobile navigation">
        <div className="flex items-center justify-around px-2 py-1.5">
          {NAV_LINKS.filter((l) => l.key !== "feedback" && l.key !== "changelog").map((link) => {
            const isActive = activePage === link.key;
            return (
              <a
                key={link.key}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all min-w-[56px] active:scale-[0.93] ${
                  isActive
                    ? "text-accent"
                    : "text-text-tertiary active:text-text-primary"
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
                  <path d={link.icon} />
                </svg>
                <span className={`text-[10px] font-bold ${isActive ? "text-accent" : ""}`}>{link.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
