"use client";

interface PageFooterProps {
  maxWidth?: string;
}

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/changelog", label: "Changelog" },
  { href: "/feedback", label: "Feedback" },
  { href: "/privacy", label: "Privacy" },
] as const;

export function PageFooter({ maxWidth = "max-w-3xl" }: PageFooterProps) {
  return (
    <footer className={`${maxWidth} mx-auto px-4 sm:px-6 py-8 border-t border-border/50 mt-12`}>
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
        <nav className="flex items-center gap-3">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
