import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PageFooter } from "@/components/layout/PageFooter";
import { BreadcrumbListJsonLd, JsonLd } from "@/components/seo/JsonLd";
import {
  getSpeciesSpreads,
  isKnownSpeciesSlug,
  MIN_INDEXABLE_REPORTS,
  speciesDisplayName,
  type CommonSpread,
  type SpeciesSpreadAggregate,
} from "@/lib/spreads/species-spreads";

const BASE = "https://pokemonvgcteamreport.com";

/**
 * Per-species spread landing pages (VGC-217). Targets the largest keyword gap
 * vs Pikalytics: "<species> EV spread" queries.
 *
 * ── Rendering model: on-demand ISR, nothing prerendered at build ────────────
 * `generateStaticParams` deliberately returns an empty array. The whole value
 * of this page is the aggregate, and the production build runs WITHOUT
 * `DATABASE_URL` — so anything prerendered at build time would be the empty
 * state, frozen into the static HTML and served to the first crawler that
 * arrives. Returning `[]` keeps the build database-free (it cannot fail, and
 * it cannot bake in an empty page) while `dynamicParams` (the default) still
 * generates and then caches each species page on its first request, where the
 * database IS reachable. `revalidate` below refreshes it hourly, matching
 * `/champions/[pokemon]`.
 */
export function generateStaticParams(): { species: string }[] {
  return [];
}

export const revalidate = 3600;

/**
 * One aggregate per request, shared by `generateMetadata` and the page body.
 * Without this the robots decision and the rendered data would be two separate
 * database round-trips per generation.
 */
const loadSpreads = cache(getSpeciesSpreads);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ species: string }>;
}): Promise<Metadata> {
  const { species: slug } = await params;
  const name = speciesDisplayName(slug);
  if (!name) return {};

  const data = await loadSpreads(slug);
  const canonical = `${BASE}/explore/spreads/${slug}`;

  const title = `${name} EV Spreads — Most Common VGC Builds`;
  const description =
    data.totalReports > 0
      ? `The ${data.spreads.length} most common ${name} EV spreads in VGC, aggregated from ${data.totalReports} public team reports. See exactly what percentage of teams run each spread, with the natures, items and full reports behind them.`
      : `Common ${name} EV spreads in VGC, aggregated from public team reports on VGC Team Report. Paste your Showdown team to add your own ${name} spread to the data.`;

  return {
    title,
    description,
    alternates: { canonical },
    // A species with barely any reports is a thin page. Publish it (people
    // following a link should still see real numbers) but keep it out of the
    // index until there is something worth ranking.
    robots:
      data.totalReports >= MIN_INDEXABLE_REPORTS
        ? undefined
        : { index: false, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "VGC Team Report",
      url: canonical,
    },
    twitter: { card: "summary_large_image", title, description },
    keywords: [
      `${name} EV spread`,
      `${name} EV spreads`,
      `${name} spread`,
      `${name} VGC`,
      `${name} competitive set`,
      `${name} nature`,
      `best ${name} EV spread`,
      "VGC EV spreads",
      "VGC 2026",
      "Pokemon VGC",
    ],
  };
}

/** Human-readable unit for a spread group. */
function unitLabel(unit: CommonSpread["unit"]): string {
  return unit === "sp" ? "SP" : "EVs";
}

function UsageBar({ percentage }: { percentage: number }) {
  // Decorative: the exact figure is printed next to the bar and spelled out in
  // the sentence below it, so announcing the bar too would just repeat itself.
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-surface-alt"
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full bg-accent"
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

function ExampleLink({ example }: { example: CommonSpread["examples"][number] }) {
  const label =
    example.tournamentName ||
    example.creatorName ||
    `Report ${example.id.slice(0, 8)}`;
  const detail = [example.creatorName && example.tournamentName ? example.creatorName : null, example.placement]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/s/${example.id}`}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-primary transition-colors duration-200 hover:border-accent hover:text-accent"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4 shrink-0"
      >
        <path d="M5 4.5h7l3 3v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1Z" />
        <path d="M11.5 4.5v3.5H15" />
      </svg>
      <span className="truncate">{label}</span>
      {detail && <span className="truncate text-xs font-medium text-text-tertiary">{detail}</span>}
    </Link>
  );
}

function SpreadRow({
  spread,
  rank,
  totalReports,
}: {
  spread: CommonSpread;
  rank: number;
  totalReports: number;
}) {
  return (
    <li className="rounded-xl border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
          #{rank}
        </span>
        <h3 className="font-mono text-base font-bold text-text-primary sm:text-lg">
          {spread.label}
        </h3>
        <span className="rounded-md bg-surface-alt px-2 py-0.5 text-xs font-bold text-text-secondary">
          {unitLabel(spread.unit)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <UsageBar percentage={spread.percentage} />
        <span className="shrink-0 text-sm font-bold text-text-primary">
          {spread.percentage}%
        </span>
      </div>
      <p className="mt-2 text-sm text-text-secondary">
        {spread.count} of {totalReports} report{totalReports === 1 ? "" : "s"}
        {spread.nature ? ` · ${spread.nature} Nature` : ""}
        {spread.item ? ` · ${spread.item}` : ""}
      </p>

      {spread.examples.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
            Example {spread.examples.length === 1 ? "report" : "reports"}
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {spread.examples.map((example) => (
              <ExampleLink key={example.id} example={example} />
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

function EmptyState({ data }: { data: SpeciesSpreadAggregate }) {
  // Two genuinely different situations, told apart honestly. Neither invents a
  // spread to fill the space.
  return (
    <div className="rounded-xl border border-border bg-surface p-6 text-sm leading-relaxed text-text-secondary">
      {data.unavailable ? (
        <p>
          Spread stats for {data.species} are temporarily unavailable. The
          aggregate is rebuilt from public reports every hour — please check
          back shortly.
        </p>
      ) : (
        <p>
          No public team reports on VGC Team Report field {data.species} yet, so
          there is no spread data to aggregate. These pages are built only from
          real published reports — nothing here is estimated.
        </p>
      )}
      <Link
        href="/"
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition-opacity duration-200 hover:opacity-90"
      >
        Paste your team to add the first {data.species} spread
      </Link>
    </div>
  );
}

export default async function SpeciesSpreadsPage({
  params,
}: {
  params: Promise<{ species: string }>;
}) {
  const { species: slug } = await params;
  // The segment is untrusted input. Validate against the species catalogue
  // before anything else — `getSpeciesSpreads` refuses to query otherwise too.
  if (!isKnownSpeciesSlug(slug)) notFound();

  const data = await loadSpreads(slug);
  const canonical = `${BASE}/explore/spreads/${slug}`;
  const hasData = data.spreads.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: BASE },
          { name: "Explore", url: `${BASE}/explore` },
          { name: `${data.species} EV spreads`, url: canonical },
        ]}
      />
      {/* Dataset markup is emitted only when there is a real dataset behind
          it. An empty Dataset with invented distribution values would be
          structured-data spam. */}
      {hasData && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: `${data.species} EV spread usage in VGC`,
            description: `The ${data.spreads.length} most common ${data.species} stat spreads across ${data.totalReports} public VGC team reports published on VGC Team Report, with the share of reports running each spread.`,
            url: canonical,
            license: "https://pokemonvgcteamreport.com/terms",
            isAccessibleForFree: true,
            keywords: [
              `${data.species} EV spread`,
              "Pokemon VGC",
              "EV spreads",
              "competitive Pokemon",
            ],
            creator: {
              "@type": "Organization",
              name: "VGC Team Report",
              url: BASE,
            },
            variableMeasured: [
              {
                "@type": "PropertyValue",
                name: "Reports fielding this species",
                value: data.totalReports,
              },
              ...data.spreads.map((spread) => ({
                "@type": "PropertyValue",
                name: `${spread.label} (${unitLabel(spread.unit)})`,
                value: spread.percentage,
                unitText: "PERCENT",
                description: `${spread.count} of ${data.totalReports} public ${data.species} reports${spread.nature ? `, most commonly ${spread.nature} Nature` : ""}${spread.item ? ` holding ${spread.item}` : ""}.`,
              })),
            ],
          }}
        />
      )}

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 sm:pb-12 sm:pt-12">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-tertiary">
          <Link href="/explore" className="rounded font-semibold hover:text-accent">
            Explore
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span>{data.species} spreads</span>
        </nav>

        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
          {data.species} EV Spreads
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
          The most common {data.species} stat spreads across public VGC team
          reports on VGC Team Report. Every number below is counted from real
          published reports — open any of them to see the full build and the
          reasoning behind it.
        </p>

        {hasData && (
          <p className="mt-4 text-sm font-semibold text-text-tertiary">
            Aggregated from {data.totalReports} public report
            {data.totalReports === 1 ? "" : "s"} fielding {data.species}.
          </p>
        )}

        <section className="mt-8" aria-labelledby="common-spreads">
          <h2
            id="common-spreads"
            className="text-lg font-bold text-text-primary sm:text-xl"
          >
            Most common spreads
          </h2>
          {hasData ? (
            <ol className="mt-4 space-y-4">
              {data.spreads.map((spread, i) => (
                <SpreadRow
                  key={`${spread.unit}-${spread.label}`}
                  spread={spread}
                  rank={i + 1}
                  totalReports={data.totalReports}
                />
              ))}
            </ol>
          ) : (
            <div className="mt-4">
              <EmptyState data={data} />
            </div>
          )}
        </section>

        <section className="mt-12" aria-labelledby="how-read">
          <h2 id="how-read" className="text-lg font-bold text-text-primary sm:text-xl">
            How to read these spreads
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-secondary">
            <p>
              Percentages are the share of public reports fielding{" "}
              {data.species} that use exactly that spread, so they add up to at
              most 100% across the whole dataset — the five shown here are the
              most used, not all of them.
            </p>
            <p>
              Spreads marked <strong className="text-text-primary">EVs</strong>{" "}
              come from classic VGC reports and are the paste&apos;s own EV
              numbers. Spreads marked{" "}
              <strong className="text-text-primary">SP</strong> come from
              Pokémon Champions reports, which spend 66 Stat Points (max 32 per
              stat) instead of EVs. The two are never pooled together, because a
              32 SP investment and a 252 EV investment are not the same number.
            </p>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
