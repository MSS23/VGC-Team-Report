import type { Metadata } from "next";
import Link from "next/link";
import { PageFooter } from "@/components/layout/PageFooter";

export const metadata: Metadata = {
  title: "Support VGC Team Report",
  description: "Help cover the hosting, database, monitoring, and maintenance costs behind VGC Team Report.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/support" },
  openGraph: {
    title: "Support VGC Team Report",
    description: "Help keep this independent competitive Pokémon resource reliable and available.",
    url: "https://pokemonvgcteamreport.com/support",
    type: "website",
    siteName: "VGC Team Report",
  },
};

const donationUrl = process.env.NEXT_PUBLIC_DONATION_URL;
const hasDonationLink = Boolean(
  donationUrl?.startsWith("https://") && !donationUrl.includes("your-payment-link"),
);

const COSTS = [
  {
    title: "Reliable infrastructure",
    description: "Hosting, database storage, caching, monitoring, and the services that keep reports available.",
    icon: "M4 6h16M4 12h16M4 18h16",
  },
  {
    title: "Ongoing development",
    description: "Maintenance, new formats, accessibility work, translations, and fixes as competitive Pokémon evolves.",
    icon: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  },
  {
    title: "A free community tool",
    description: "Donations help keep the core report builder and public reports accessible without a required payment.",
    icon: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z",
  },
] as const;

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-8" aria-label="Breadcrumb">
          <Link href="/" className="inline-flex min-h-11 items-center hover:text-text-secondary transition-colors">
            Home
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-text-secondary font-medium">Support</span>
        </nav>

        <section className="relative overflow-hidden rounded-3xl border border-border bg-surface px-5 py-8 sm:px-10 sm:py-12">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-accent">Community supported</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
              Help keep VGC Team Report running
            </h1>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-text-secondary">
              VGC Team Report is independently built and operated by Manraj Sidhu. An optional donation goes to the project owner to help cover the infrastructure and maintenance costs behind the service.
            </p>

            <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              {hasDonationLink ? (
                <a
                  href={donationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white shadow-sm shadow-accent/20 transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  Donate securely
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </a>
              ) : (
                <span className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-surface-alt px-5 py-3 text-sm font-bold text-text-tertiary" aria-disabled="true">
                  Donations opening soon
                </span>
              )}
              <p className="text-xs leading-relaxed text-text-tertiary">
                Secure checkout is hosted by Stripe. Choose only an amount that is comfortable for you.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-12" aria-labelledby="support-funds-heading">
          <div className="max-w-2xl">
            <h2 id="support-funds-heading" className="text-xl sm:text-2xl font-bold text-text-primary">What your support funds</h2>
            <p className="mt-2 text-sm text-text-secondary">Every contribution supports the application itself, not an individual team-report creator.</p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {COSTS.map((cost) => (
              <article key={cost.title} className="rounded-2xl border border-border bg-surface p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={cost.icon} />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-text-primary">{cost.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{cost.description}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="rounded-2xl border border-border bg-surface-alt/50 p-5 sm:p-6" aria-labelledby="donation-note-heading">
          <h2 id="donation-note-heading" className="text-sm font-bold text-text-primary">A clear separation from paid reports</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            A donation supports VGC Team Report&apos;s operating costs. It does not buy a report, unlock product access, create a subscription, or pay a report creator. Future paid reports will use a separate checkout and creator-payout system with the price and recipient shown before purchase.
          </p>
        </aside>
      </main>

      <PageFooter />
    </div>
  );
}
