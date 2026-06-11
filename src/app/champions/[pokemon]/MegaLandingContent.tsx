"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "motion/react";

import { applyRandomAccent } from "@/lib/utils/random-accent";

import { PageFooter } from "@/components/layout/PageFooter";
import { BreadcrumbListJsonLd } from "@/components/seo/JsonLd";
import { ReportCard, type ExploreReport } from "@/components/explore/ReportCard";
import { getSpriteUrls } from "@/lib/utils/sprite-slug";
import type { MegaPokemonEntry } from "@/lib/data/mega-pokemon";
import type { StatSpread } from "@/lib/types/pokemon";

const TYPE_COLORS: Record<string, string> = {
  Normal: "#A8A878", Fire: "#F08030", Water: "#6890F0", Electric: "#F8D030",
  Grass: "#78C850", Ice: "#98D8D8", Fighting: "#C03028", Poison: "#A040A0",
  Ground: "#E0C068", Flying: "#A890F0", Psychic: "#F85888", Bug: "#A8B820",
  Rock: "#B8A038", Ghost: "#705898", Dragon: "#7038F8", Dark: "#705848",
  Steel: "#B8B8D0", Fairy: "#EE99AC",
};

const STAT_LABELS: { key: keyof StatSpread; label: string; color: string }[] = [
  { key: "hp", label: "HP", color: "#FF5959" },
  { key: "atk", label: "Atk", color: "#F5AC78" },
  { key: "def", label: "Def", color: "#FAE078" },
  { key: "spa", label: "SpA", color: "#9DB7F5" },
  { key: "spd", label: "SpD", color: "#A7DB8D" },
  { key: "spe", label: "Spe", color: "#FA92B2" },
];

function StatBar({ label, value, color, max = 230 }: { label: string; value: number; color: string; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-xs font-bold text-text-secondary text-right">{label}</span>
      <div className="flex-1 h-3 bg-surface-alt rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="w-8 text-xs font-bold text-text-primary text-right">{value}</span>
    </div>
  );
}

function MegaSprite({ species }: { species: string }) {
  const urls = getSpriteUrls(species);
  const [idx, setIdx] = useState(0);
  return (
    <img
      src={urls[Math.min(idx, urls.length - 1)]}
      alt={species}
      width={120}
      height={120}
      className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-lg"
      onError={() => setIdx((i) => Math.min(i + 1, urls.length - 1))}
    />
  );
}

interface MegaLandingContentProps {
  mega: MegaPokemonEntry;
  baseStats: StatSpread;
  teams: ExploreReport[];
  relatedMegas: { slug: string; displayName: string; types: string[] }[];
  // faqs removed from the visible UI — JSON-LD still generated server-side.
}

export function MegaLandingContent({ mega, baseStats, teams, relatedMegas }: MegaLandingContentProps) {
  const bst = Object.values(baseStats).reduce((a, b) => a + b, 0);

  useEffect(() => {
    applyRandomAccent();
  }, []);

  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "Pokemon Champions", url: "https://pokemonvgcteamreport.com/champions" },
          { name: mega.displayName, url: `https://pokemonvgcteamreport.com/champions/${mega.slug}` },
        ]}
      />
      <main className="min-h-screen bg-background pb-24 sm:pb-0">
        {/* Hero */}
        <section className="relative overflow-hidden py-12 sm:py-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-tertiary mb-6">
              <Link href="/champions" className="hover:text-accent transition-colors">Champions</Link>
              <span>/</span>
              <span className="text-text-secondary font-medium">{mega.displayName}</span>
            </nav>

            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              {/* Sprite */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/10 rounded-full blur-2xl" />
                  <MegaSprite species={mega.dataKey} />
                </div>
              </div>

              {/* Info */}
              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                  {mega.types.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-bold text-white px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: TYPE_COLORS[t] ?? "#888" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                  {mega.displayName}
                </h1>
                <p className="mt-1 text-sm text-accent font-bold">{mega.ability}</p>
                <p className="mt-2 text-sm text-text-secondary max-w-lg leading-relaxed">
                  {mega.description}
                </p>
                <p className="mt-2 text-xs text-text-tertiary">
                  Mega Stone: <span className="font-medium text-text-secondary">{mega.megaStone}</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Base Stats */}
        <section className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-text-primary">Base Stats</h2>
            <span className="text-xs font-bold text-text-tertiary">BST: {bst}</span>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 sm:p-6 space-y-2.5">
            {STAT_LABELS.map(({ key, label, color }) => (
              <StatBar key={key} label={label} value={baseStats[key]} color={color} />
            ))}
          </div>
        </section>

        {/* Teams Using This Pokemon */}
        <section className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold text-text-primary">
              {mega.displayName} SP Spreads & Competitive Teams
            </h2>
            <Link
              href={`/explore?species=${encodeURIComponent(mega.baseName)}&regulation=Reg+M-A`}
              className="text-xs font-bold text-accent hover:brightness-110 transition-all"
            >
              View all &rarr;
            </Link>
          </div>

          {teams.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            >
              {teams.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 bg-surface rounded-xl border border-border">
              <p className="text-sm text-text-secondary mb-3">
                No public team reports featuring {mega.displayName} yet.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 shadow-lg shadow-accent/30 transition-all"
              >
                Be the first to build one
              </Link>
            </div>
          )}
        </section>

        {/* "Using X in VGC" and visible FAQ sections were removed — generic
            filler that duplicated hero info (types, ability, stone, BST)
            and pushed the actually useful Featured Teams section down.
            Google deprecated FAQ rich snippets for non-authoritative sites
            in Aug 2023, so the SEO justification is gone. The FAQPage
            JSON-LD in <head> is still emitted for AI scrapers and other
            structured-data consumers — it just isn't rendered visibly. */}

        {/* Related Megas */}
        {relatedMegas.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-8">
            <h2 className="text-xl font-extrabold text-text-primary mb-4">
              Other Mega Evolutions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {relatedMegas.map((m) => (
                <Link
                  key={m.slug}
                  href={`/champions/${m.slug}`}
                  className="rounded-xl border border-border bg-surface p-3 hover:border-accent/30 transition-colors group"
                >
                  <h3 className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors">
                    {m.displayName}
                  </h3>
                  <div className="flex gap-1 mt-1.5">
                    {m.types.map((t) => (
                      <span
                        key={t}
                        className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: TYPE_COLORS[t] ?? "#888" }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 py-12 text-center">
          <h2 className="text-xl font-extrabold text-text-primary mb-3">
            Build a {mega.displayName} Team Report
          </h2>
          <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
            Create a detailed team report featuring {mega.displayName} with matchup plans,
            damage calcs, and one-click sharing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 shadow-lg shadow-accent/30 transition-all"
            >
              Start Building
            </Link>
            <Link
              href="/champions"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-text-secondary hover:text-text-primary bg-surface border-2 border-border hover:border-accent/30 rounded-xl transition-all"
            >
              All Mega Evolutions
            </Link>
          </div>
        </section>
      </main>

      <PageFooter />
    </>
  );
}
