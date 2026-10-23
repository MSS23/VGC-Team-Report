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
      <main className="mx-auto max-w-(--container) px-(--gutter) py-8 sm:py-12">
        <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-8" aria-label="Breadcrumb">
          <Link href="/" className="inline-flex min-h-11 items-center hover:text-text-secondary transition-colors">
            Home
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-text-secondary ">Support</span>
        </nav>

        <section className="pt-4 pb-8 sm:pt-8">
          <div className="max-w-3xl">
                                    <h1 className="font-display text-display-s font-bold tracking-display text-text-primary">
              Help keep VGC Team Report running
            </h1>
            <p className="lead mt-5 text-text-secondary">
              VGC Team Report is independently built and operated by Manraj Sidhu. An optional donation goes to the project owner to help cover the infrastructure and maintenance costs behind the service.
            </p>

            <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              {hasDonationLink ? (
                <a
                  href={donationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-card bg-accent px-6 text-base font-semibold text-accent-ink transition-[background-color,transform] duration-(--dur-short) hover:brightness-110 active:translate-y-px"
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

        <section className="pt-(--section-gap-s)" aria-labelledby="support-funds-heading">
          <div className="max-w-2xl">
            <h2 id="support-funds-heading" className="font-display text-section font-bold tracking-display text-text-primary">What your support funds</h2>
            <p className="lead mt-5 text-text-secondary">Every contribution supports the application itself, not an individual team-report creator.</p>
          </div>
          <div className="mt-12 divide-y divide-border border-y border-border">
            {COSTS.map((cost) => (
              <article key={cost.title} className="grid gap-3 py-6 lg:grid-cols-12 lg:gap-(--gap-columns)">
                <h3 className="font-display text-title font-bold tracking-tight text-text-primary lg:col-span-5">{cost.title}</h3>
                <p className="text-text-secondary leading-relaxed lg:col-span-7">{cost.description}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="mt-(--section-gap-s) max-w-[65ch]" aria-labelledby="donation-note-heading">
          <h2 id="donation-note-heading" className="font-display text-title font-bold tracking-tight text-text-primary">A clear separation from paid reports</h2>
          <p className="mt-3 leading-relaxed text-text-secondary">
            A donation supports VGC Team Report&apos;s operating costs. It does not buy a report, unlock product access, create a subscription, or pay a report creator. Future paid reports will use a separate checkout and creator-payout system with the price and recipient shown before purchase.
          </p>
        </aside>
      </main>

      <PageFooter />
    </div>
  );
}
