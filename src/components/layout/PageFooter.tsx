"use client";

interface PageFooterProps {
  maxWidth?: string;
  hideFeedback?: boolean;
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/changelog", label: "Changelog" },
  { href: "/privacy", label: "Privacy" },
] as const;

export function PageFooter({ maxWidth = "max-w-3xl", hideFeedback = false }: PageFooterProps) {
  return (
    <footer className={`${maxWidth} mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8 border-t border-border/50 mt-12`}>
      {/* Feedback callout */}
      {!hideFeedback && (
        <a
          href="/feedback"
          className="flex items-center gap-3 px-4 py-3 mb-6 bg-accent-surface/50 border border-accent/20 rounded-xl hover:bg-accent-surface hover:border-accent/40 transition-all group active:scale-[0.98]"
        >
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/15 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-accent">Send Feedback</span>
            <span className="text-xs text-text-secondary ml-2 hidden sm:inline">Bug reports, feature requests, ideas</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent/50 group-hover:text-accent flex-shrink-0 transition-colors">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
          <span>Built by</span>
          <a
            href="https://x.com/Manny64Official"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-text-secondary hover:text-accent transition-colors"
          >
            Manraj Sidhu
          </a>
        </div>
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-2.5 py-1.5 text-xs font-medium text-text-tertiary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
