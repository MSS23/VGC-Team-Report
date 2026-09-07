import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { BreadcrumbListJsonLd, FAQPageJsonLd, JsonLd } from "@/components/seo/JsonLd";
import { PageFooter } from "@/components/layout/PageFooter";
import {
  evToChampionsSp,
  championsSpToEv,
  CHAMPIONS_TOTAL_SP,
  CHAMPIONS_MAX_SP_PER_STAT,
  MAX_EV_PER_STAT,
} from "@/lib/analysis/stat-calculator";
import { EvToSpConverter } from "./EvToSpConverter";

const PAGE_URL = "https://pokemonvgcteamreport.com/tools/ev-to-sp";
// Kept short so the root layout's "%s | VGC Team Report" template still fits
// inside Google's ~60-character SERP title budget.
const TITLE = "EV to SP Converter for Pokémon Champions";
const DESCRIPTION =
  "Free EV to SP converter for Pokémon Champions — Regulation M-A, M-B and M-C. Convert EV spreads to Stat Points (and back) against the 66 SP budget and 32 SP per-stat cap, with a full conversion table.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "EV to SP converter",
    "Pokemon Champions SP",
    "Stat Points Pokemon Champions",
    "convert EVs to SP",
    "SP to EV",
    "Champions SP calculator",
    "66 SP budget",
    "32 SP per stat",
    "Regulation M-A SP spread",
    "Regulation M-C SP spread",
    "Pokemon Champions EV spread",
    "VGC 2026",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    type: "website",
    siteName: "VGC Team Report",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
};

// Static page — nothing here reads the request or the database.
export const dynamic = "force-static";

// EV values players actually type into Showdown, converted with the same
// function the app uses so this table can never drift from the calculator.
const COMMON_EV_VALUES = [0, 4, 12, 20, 36, 52, 76, 100, 124, 156, 180, 204, 236, 244, 248, 252];

const EV_TO_SP_ROWS = COMMON_EV_VALUES.map((ev) => ({
  ev,
  sp: evToChampionsSp(ev),
}));

const SP_TO_EV_ROWS = Array.from({ length: CHAMPIONS_MAX_SP_PER_STAT }, (_, i) => {
  const sp = i + 1;
  const ev = championsSpToEv(sp);
  return { sp, ev, step: ev - championsSpToEv(sp - 1) };
});

const FAQ_ITEMS = [
  {
    question: "How do you convert EVs to SP in Pokémon Champions?",
    answer:
      `Any investment at all costs at least 1 Stat Point, and after that every further 8 EVs buys 1 more SP — so the conversion is SP = ceil(EVs / 8), with a minimum of 1 SP for a non-zero EV value. In practice the first Stat Point costs 4 EVs and each Stat Point after it costs 8 EVs: 4 EVs = 1 SP, 12 EVs = 2 SP, 20 EVs = 3 SP, and so on. Anything from 248 EVs upward hits the ${CHAMPIONS_MAX_SP_PER_STAT} SP per-stat cap, which is why a maxed 252 EV stat becomes ${CHAMPIONS_MAX_SP_PER_STAT} SP.`,
  },
  {
    question: "Why does the EV to SP math not add up?",
    answer:
      "Because the first Stat Point is cheaper than the rest. The smallest EV chip players use is 4 EVs, and that already rounds up to a full Stat Point — but the second Stat Point needs 12 EVs, not 8. That single rounding-up step at the bottom of the curve is what makes the numbers look inconsistent: 4 EVs and 8 EVs both cost exactly 1 SP, then every 8 EVs after that costs 1 SP each.",
  },
  {
    question: "How many Stat Points does a Pokémon get in Champions?",
    answer:
      `Each Pokémon has ${CHAMPIONS_TOTAL_SP} Stat Points to spend in total, with a maximum of ${CHAMPIONS_MAX_SP_PER_STAT} SP in any single stat. Two maxed stats cost ${CHAMPIONS_MAX_SP_PER_STAT * 2} SP and leave ${CHAMPIONS_TOTAL_SP - CHAMPIONS_MAX_SP_PER_STAT * 2} SP for a third stat, which is the direct equivalent of the classic 252 / 252 / 4 EV spread.`,
  },
  {
    question: "What is 252 EVs in SP?",
    answer:
      `252 EVs is ${CHAMPIONS_MAX_SP_PER_STAT} SP — the per-stat cap. So is 248 EVs, which means the classic "248 HP" bulk-optimising trick converts to exactly the same Stat Point cost as a full 252 investment.`,
  },
  {
    question: "What is 4 EVs in SP?",
    answer:
      "4 EVs is 1 SP. It is the cheapest possible investment in a stat: 1 SP is the minimum a stat can receive once it receives anything at all.",
  },
  {
    question: "Does a 252 / 252 / 4 EV spread fit inside the 66 SP budget?",
    answer:
      `Yes. 252 EVs converts to ${CHAMPIONS_MAX_SP_PER_STAT} SP, a second 252 converts to another ${CHAMPIONS_MAX_SP_PER_STAT} SP, and the 4 EV chip converts to 1 SP — ${CHAMPIONS_MAX_SP_PER_STAT * 2 + 1} SP of the ${CHAMPIONS_TOTAL_SP} available, leaving 1 SP spare. Champions spreads are slightly more flexible than EV spreads because that spare point can go anywhere.`,
  },
  {
    question: "Can a stat go over 32 SP in Pokémon Champions?",
    answer:
      `No. ${CHAMPIONS_MAX_SP_PER_STAT} SP is a hard per-stat cap in every Champions regulation (M-A, M-B and M-C), in the same way 252 is a hard per-stat EV cap in the classic games. A spread that puts more than ${CHAMPIONS_MAX_SP_PER_STAT} SP into a single stat, or more than ${CHAMPIONS_TOTAL_SP} SP in total, is illegal and will be rejected.`,
  },
];

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mb-3">
      {children}
    </h2>
  );
}

export default function EvToSpPage() {
  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "EV to SP Converter", url: PAGE_URL },
        ]}
      />
      <FAQPageJsonLd items={FAQ_ITEMS} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "EV to SP Converter",
          url: PAGE_URL,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          description: DESCRIPTION,
          isPartOf: {
            "@type": "WebSite",
            name: "VGC Team Report",
            url: "https://pokemonvgcteamreport.com",
          },
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        }}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-8" aria-label="Breadcrumb">
          <Link href="/" className="inline-flex min-h-11 items-center hover:text-text-secondary transition-colors">
            Home
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-text-secondary font-medium">EV to SP Converter</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mb-3">
            EV to SP Converter for Pok&eacute;mon Champions
          </h1>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-2xl">
            Pok&eacute;mon Champions replaces EVs with <strong className="text-text-primary font-semibold">Stat Points (SP)</strong>:{" "}
            {CHAMPIONS_TOTAL_SP} to spend across the six stats, and no more than{" "}
            {CHAMPIONS_MAX_SP_PER_STAT} in any one of them. Convert an EV spread
            you already know into Stat Points below &mdash; or go the other way and
            work out what an SP spread would have cost in EVs.
          </p>
        </header>

        {/* Calculator */}
        <div className="mb-12">
          <EvToSpConverter />
        </div>

        {/* Explanation */}
        <section className="mb-12" aria-labelledby="how-it-works">
          <SectionHeading id="how-it-works">How the EV to SP conversion works</SectionHeading>
          <div className="space-y-4 text-sm sm:text-base text-text-secondary leading-relaxed max-w-3xl">
            <p>
              The rule is short: <strong className="text-text-primary font-semibold">any
              investment at all costs at least 1 SP, and every further 8 EVs buys 1
              more SP.</strong> Written as a formula, SP = ceil(EVs &divide; 8), with a
              floor of 1 SP whenever the EV value is not zero, and a ceiling of{" "}
              {CHAMPIONS_MAX_SP_PER_STAT} SP once the EV value reaches 248.
            </p>
            <p>
              That floor is the whole reason people say the math does not add up.
              The smallest EV chip anyone actually uses is 4 EVs, and 4 EVs rounds
              up to a full Stat Point &mdash; but the <em>second</em> Stat Point needs
              12 EVs, not 8. So the curve reads as{" "}
              <strong className="text-text-primary font-semibold">the first SP costs 4
              EVs and every SP after it costs 8</strong>: 4 &rarr; 1 SP, 12 &rarr; 2 SP,
              20 &rarr; 3 SP, 28 &rarr; 4 SP, and onward in steps of eight. Anything
              from 248 EVs up is already at the {CHAMPIONS_MAX_SP_PER_STAT} SP cap,
              which is why the familiar 248 HP bulk trick and a full 252 investment
              cost exactly the same in Champions.
            </p>
            <p>
              The budget works out slightly kinder than the classic 508 EV limit.
              Two maxed stats cost {CHAMPIONS_MAX_SP_PER_STAT * 2} SP, a 4 EV chip
              costs 1 SP, and that leaves{" "}
              {CHAMPIONS_TOTAL_SP - (CHAMPIONS_MAX_SP_PER_STAT * 2 + 1)} SP spare out
              of {CHAMPIONS_TOTAL_SP} &mdash; so a 252 / 252 / 4 spread converts cleanly
              with a point to put wherever you like. Spending more than{" "}
              {CHAMPIONS_TOTAL_SP} SP in total, or more than{" "}
              {CHAMPIONS_MAX_SP_PER_STAT} SP in a single stat, is illegal in
              every Champions regulation (M-A, M-B and M-C).
            </p>
          </div>
        </section>

        {/* Quick facts */}
        <section className="mb-12" aria-labelledby="quick-facts">
          <SectionHeading id="quick-facts">The rules at a glance</SectionHeading>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { term: `${CHAMPIONS_TOTAL_SP} SP`, def: "Total Stat Points available to each Pokémon." },
              { term: `${CHAMPIONS_MAX_SP_PER_STAT} SP`, def: "Hard cap on any single stat — the equivalent of 252 EVs." },
              { term: "4 EVs = 1 SP", def: "The cheapest investment; every SP after the first costs 8 EVs." },
            ].map((item) => (
              <div key={item.term} className="p-4 rounded-2xl border border-border bg-surface">
                <dt className="text-lg font-extrabold text-accent tracking-tight">{item.term}</dt>
                <dd className="text-sm text-text-secondary leading-relaxed mt-1">{item.def}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* EV → SP table */}
        <section className="mb-12" aria-labelledby="ev-to-sp-table">
          <SectionHeading id="ev-to-sp-table">EV to SP conversion table</SectionHeading>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-3xl mb-5">
            Common EV values and what each one costs in Stat Points.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm border-collapse">
              <caption className="sr-only">
                EV values converted to Pok&eacute;mon Champions Stat Points
              </caption>
              <thead className="bg-surface-alt">
                <tr>
                  <th scope="col" className="text-left font-bold text-text-primary px-4 py-3">EVs in a stat</th>
                  <th scope="col" className="text-left font-bold text-text-primary px-4 py-3">Stat Points (SP)</th>
                  <th scope="col" className="text-left font-bold text-text-primary px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-surface">
                {EV_TO_SP_ROWS.map((row) => (
                  <tr key={row.ev} className="border-t border-border">
                    <th scope="row" className="text-left font-semibold text-text-primary px-4 py-2.5 tabular-nums whitespace-nowrap">
                      {row.ev} EVs
                    </th>
                    <td className="px-4 py-2.5 tabular-nums font-semibold text-text-primary whitespace-nowrap">
                      {row.sp} SP
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      {row.ev === 0
                        ? "Uninvested"
                        : row.ev === 4
                          ? "Minimum investment — the first SP costs only 4 EVs"
                          : row.sp === CHAMPIONS_MAX_SP_PER_STAT
                            ? `Per-stat cap (${CHAMPIONS_MAX_SP_PER_STAT} SP) — 248 EVs and ${MAX_EV_PER_STAT} EVs cost the same`
                            : `Leaves ${CHAMPIONS_TOTAL_SP - row.sp} SP for the other five stats`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SP → EV table */}
        <section className="mb-12" aria-labelledby="sp-to-ev-table">
          <SectionHeading id="sp-to-ev-table">SP to EV: what each Stat Point costs</SectionHeading>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-3xl mb-5">
            The full ladder from 1 to {CHAMPIONS_MAX_SP_PER_STAT} SP, showing the
            smallest EV investment that reaches each Stat Point and the EV cost of
            that step. Notice the first step is 4 EVs and every step after it is 8.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm border-collapse">
              <caption className="sr-only">
                Pok&eacute;mon Champions Stat Points converted to the minimum EV investment
              </caption>
              <thead className="bg-surface-alt">
                <tr>
                  <th scope="col" className="text-left font-bold text-text-primary px-4 py-3">Stat Points (SP)</th>
                  <th scope="col" className="text-left font-bold text-text-primary px-4 py-3">Minimum EVs</th>
                  <th scope="col" className="text-left font-bold text-text-primary px-4 py-3">EV cost of this point</th>
                </tr>
              </thead>
              <tbody className="bg-surface">
                {SP_TO_EV_ROWS.map((row) => (
                  <tr key={row.sp} className="border-t border-border">
                    <th scope="row" className="text-left font-semibold text-text-primary px-4 py-2 tabular-nums whitespace-nowrap">
                      {row.sp} SP
                    </th>
                    <td className="px-4 py-2 tabular-nums font-semibold text-text-primary whitespace-nowrap">
                      {row.ev} EVs
                    </td>
                    <td className="px-4 py-2 tabular-nums text-text-secondary whitespace-nowrap">
                      +{row.step} EVs
                      {row.sp === 1 ? " (the cheap first point)" : ""}
                      {row.sp === CHAMPIONS_MAX_SP_PER_STAT ? " (per-stat cap)" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12" aria-labelledby="faq">
          <SectionHeading id="faq">EV to SP questions</SectionHeading>
          <div className="divide-y divide-border/50">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question} className="py-5 first:pt-0">
                <h3 className="text-base font-semibold text-text-primary mb-2 leading-snug">
                  {item.question}
                </h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border">
          <p className="text-sm font-semibold text-text-primary mb-1">
            Converting a whole team, not one stat?
          </p>
          <p className="text-sm text-text-secondary mb-4">
            Paste your Showdown export and VGC Team Report converts every spread to
            Champions Stat Points automatically, then checks the whole team against
            Champions legality rules.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-bold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent/40 active:scale-[0.97] transition-all"
            >
              Build a Report
            </Link>
            <Link
              href="/champions"
              className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-xl bg-surface-alt border border-border text-sm font-semibold text-text-primary hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/40 active:scale-[0.97] transition-all"
            >
              Champions Format Guide
            </Link>
          </div>
        </div>
      </main>

      <PageFooter hideFeedback />
    </div>
  );
}
