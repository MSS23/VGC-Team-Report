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

  // Wait for Clerk to load before showing auth UI to prevent flash
  const showSignIn = isLoaded && !isSignedIn;
  const showUser = isLoaded && isSignedIn;

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-2xl backdrop-saturate-150 bg-surface/80 border-b border-border/60 shadow-[0_1px_12px_rgba(0,0,0,0.04)]">
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 h-14 flex items-center justify-between`}>
          {/* Left: logo */}
          <a href="/" className="flex items-center gap-1.5 font-bold text-sm hover:opacity-80 transition-opacity">
            <span className="text-text-primary">VGC Team</span>
            <span className="text-accent">Report</span>
          </a>

          {/* Center: nav links (desktop) */}
          <nav className="hidden sm:flex items-center gap-1">
            {/* Create Report CTA — always visible */}
            <a
              href="/"
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activePage === "home"
                  ? "text-accent bg-accent-surface/50"
                  : "text-accent hover:bg-accent-surface/30"
              }`}
            >
              + Create
            </a>
            <span className="w-px h-4 bg-border mx-0.5" />
            {NAV_LINKS.filter((l) => l.key !== "home" && l.key !== "feedback").map((link) => (
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
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-2xl border-t border-border/60 safe-bottom safe-x" aria-label="Mobile navigation">
        <div className="flex items-center justify-around px-1 pt-1.5 pb-1">
          {[
            { href: "/", label: "Create", key: "home", icon: "M12 5v14M5 12h14" },
            ...NAV_LINKS.filter((l) => l.key === "explore" || l.key === "champions" || l.key === "compare"),
            ...(isSignedIn ? [{ href: "/dashboard", label: "Dashboard", key: "dashboard" as const, icon: "M4 6h16M4 12h16M4 18h7" }] : []),
          ].map((link) => {
            const isActive = activePage === link.key;
            return (
              <a
                key={link.key}
                href={link.href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px] active:scale-[0.90] active:opacity-70 ${
                  isActive
                    ? "text-accent"
                    : "text-text-tertiary"
                }`}
              >
                {/* Active pill indicator */}
                {isActive && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-accent animate-pop-in" />
                )}
                <span className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors duration-200 ${
                  isActive ? "bg-accent/10" : ""
                }`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? "2.5" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
                    <path d={link.icon} />
                  </svg>
                </span>
                <span className={`text-[10px] leading-none font-semibold transition-colors duration-200 ${isActive ? "text-accent" : ""}`}>{link.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
