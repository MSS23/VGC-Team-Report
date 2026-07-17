"use client";

import Link from "next/link";

interface PageFooterProps {
  hideFeedback?: boolean;
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/faq", label: "FAQ" },
  { href: "/changelog", label: "Changelog" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function PageFooter({ hideFeedback = false }: PageFooterProps) {
  return (
    <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 sm:pb-8 border-t border-border/50 mt-12">
      {/* Feedback callout */}
      {!hideFeedback && (
        <Link
          href="/feedback"
          className="flex items-center gap-3 px-4 py-3.5 mb-6 bg-surface border-2 border-border rounded-xl hover:border-accent/40 hover:bg-surface-alt/50 transition-all group active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-text-primary">Send Feedback</span>
            <p className="text-xs text-text-secondary mt-0.5">Bug reports, feature requests, ideas</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary group-hover:text-accent flex-shrink-0 transition-colors">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      )}

      <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 min-w-0">
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          <span>Built by</span>
          <a
            href="https://x.com/Manny64Official"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center font-bold text-text-primary hover:text-accent active:text-accent transition-colors"
          >
            Manraj Sidhu
          </a>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 max-w-full">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-alt active:bg-surface-alt rounded-lg transition-all whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-settings"))}
            className="min-h-11 px-3 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-alt active:bg-surface-alt rounded-lg transition-all cursor-pointer whitespace-nowrap"
          >
            Cookie Settings
          </button>
        </nav>
      </div>
    </footer>
  );
}
