"use client";

import Link from "next/link";

interface PageFooterProps {
  hideFeedback?: boolean;
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  // /champions is the root of the SEO-critical Mega landing-page cluster (75
  // pages). It was reachable only from the top nav, so the cluster had no
  // sitewide footer link at all.
  { href: "/champions", label: "Champions" },
  { href: "/faq", label: "FAQ" },
  { href: "/tools/ev-to-sp", label: "EV to SP" },
  { href: "/changelog", label: "Changelog" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

const footerLink =
  "inline-flex min-h-11 items-center text-sm text-text-secondary transition-colors duration-(--dur-short) hover:text-text-primary";

/** A mast: the wordmark large over one row of the page's real links. */
export function PageFooter({ hideFeedback = false }: PageFooterProps) {
  return (
    <footer className="mt-(--section-gap) border-t border-border pb-28 sm:pb-16">
      <div className="mx-auto max-w-(--container) px-(--gutter) pt-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-(--gap-columns)">
          <div className="lg:col-span-5">
            <p className="font-display text-3xl font-bold tracking-tight text-text-primary">VGC Team Report</p>
            <p className="mt-3 text-sm text-text-secondary">
              Built by{" "}
              <a
                href="https://x.com/Manny64Official"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center font-semibold text-text-primary underline decoration-border underline-offset-4 transition-colors duration-(--dur-short) hover:decoration-accent"
              >
                Manraj Sidhu
              </a>
            </p>
            {!hideFeedback && (
              <Link href="/feedback" className={`${footerLink} mt-2 underline decoration-border underline-offset-4 hover:decoration-accent`}>
                Send feedback, a bug or an idea
              </Link>
            )}
          </div>
          <nav className="lg:col-span-7" aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={footerLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-settings"))}
                  className={`${footerLink} cursor-pointer`}
                >
                  Cookie settings
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
