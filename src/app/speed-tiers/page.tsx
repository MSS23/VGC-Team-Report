import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbListJsonLd } from "@/components/seo/JsonLd";
import { PageFooter } from "@/components/layout/PageFooter";

const TITLE = "VGC Speed Tiers (2026) — Pokemon Scarlet & Violet Regulation I";
const DESCRIPTION =
  "Browse Pokemon VGC speed tiers for Regulation I — base, max, +1, +2 modifiers across the current Worlds 2026 format. Free, mobile-friendly, no login.";
const CANONICAL = "https://pokemonvgcteamreport.com/speed-tiers";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "VGC speed tiers",
    "VGC speed tiers 2026",
    "Pokemon speed tiers",
    "Regulation I speed tiers",
    "Scarlet Violet speed tiers",
    "Worlds 2026 speed tiers",
    "VGC speed control",
    "Tailwind Trick Room speed",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
};

export default function SpeedTiersPage() {
  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "Speed Tiers", url: CANONICAL },
        ]}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-text-secondary transition-colors">
            Home
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-text-secondary font-medium">Speed Tiers</span>
        </nav>

        {/* Page header */}
        <header className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mb-3">
            VGC Speed Tiers &mdash; Regulation I
          </h1>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-2xl">
            Speed tiers for the current Pok&eacute;mon Scarlet &amp; Violet Regulation I format,
            built for the 2026 Worlds season. Compare base Speed, max-investment Speed, and
            common modifiers (+1 from Choice Scarf, +2 from Tailwind) across the format&apos;s
            top threats.
          </p>
        </header>

        {/* Body */}
        <section className="space-y-5 text-sm sm:text-base text-text-secondary leading-relaxed max-w-2xl">
          <p>
            In VGC, moving first usually decides the turn. A &ldquo;speed tier&rdquo; is a
            Pok&eacute;mon&apos;s effective Speed stat once you account for nature, EV
            investment, ability boosts, and field effects like Tailwind (&times;2) or Trick
            Room (reversed order). Knowing where your team sits relative to the format&apos;s
            benchmarks &mdash; Flutter Mane at 187, Iron Bundle at 200, Choice Scarf Urshifu
            at 246 &mdash; is the difference between winning the speed roll and losing the
            game on turn one.
          </p>
          <p>
            For Regulation I, the most relevant benchmarks are the unboosted natural-speed
            cluster around 145&ndash;200, the Tailwind window (&times;2 of the same group),
            and the Choice Scarf tier where bulky attackers like Raging Bolt or Urshifu
            jump above the natural-speed leaders. Trick Room teams flip the script and want
            to sit at the bottom of every tier &mdash; usually base 50 or lower with a
            negative nature and 0 Speed IVs.
          </p>
          <p>
            VGC Team Report&apos;s built-in speed tier chart calculates this automatically
            for your imported team. Paste a Showdown export or PokePaste link on the home
            page, and the report renders each Pok&eacute;mon&apos;s base, max, +1, and +2
            Speed against the live meta threats &mdash; no spreadsheet required.
          </p>
        </section>

        {/* CTA */}
        <div className="mt-12 p-5 sm:p-6 rounded-2xl bg-surface border border-border">
          <p className="text-sm font-semibold text-text-primary mb-1">
            Build a team report to see your speed tiers
          </p>
          <p className="text-sm text-text-secondary mb-4">
            Paste your team from Pok&eacute;mon Showdown or PokePaste. The speed tier chart
            renders automatically alongside damage calcs and matchup notes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Build a Team Report
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-alt border border-border text-sm font-semibold text-text-primary hover:border-accent/40 transition-colors"
            >
              Browse Reports
            </Link>
          </div>
        </div>
      </main>

      <PageFooter hideFeedback />
    </div>
  );
}
