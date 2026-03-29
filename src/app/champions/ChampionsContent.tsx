"use client";

import Link from "next/link";
import { useDarkMode } from "@/hooks/useDarkMode";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { PageNavbar } from "@/components/layout/PageNavbar";
import { PageFooter } from "@/components/layout/PageFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { useEffect } from "react";
import { track } from "@vercel/analytics";

const MEGA_POKEMON = [
  { name: "Kangaskhan-Mega", ability: "Parental Bond", types: ["Normal"], slug: "mega-kangaskhan" },
  { name: "Salamence-Mega", ability: "Aerilate", types: ["Dragon", "Flying"], slug: "mega-salamence" },
  { name: "Metagross-Mega", ability: "Tough Claws", types: ["Steel", "Psychic"], slug: "mega-metagross" },
  { name: "Charizard-Mega-Y", ability: "Drought", types: ["Fire", "Flying"], slug: "mega-charizard-y" },
  { name: "Gengar-Mega", ability: "Shadow Tag", types: ["Ghost", "Poison"], slug: "mega-gengar" },
  { name: "Mawile-Mega", ability: "Huge Power", types: ["Steel", "Fairy"], slug: "mega-mawile" },
  { name: "Gardevoir-Mega", ability: "Pixilate", types: ["Psychic", "Fairy"], slug: "mega-gardevoir" },
  { name: "Lucario-Mega", ability: "Adaptability", types: ["Fighting", "Steel"], slug: "mega-lucario" },
];

const TYPE_COLORS: Record<string, string> = {
  Normal: "#A8A878", Fire: "#F08030", Water: "#6890F0", Electric: "#F8D030",
  Grass: "#78C850", Ice: "#98D8D8", Fighting: "#C03028", Poison: "#A040A0",
  Ground: "#E0C068", Flying: "#A890F0", Psychic: "#F85888", Bug: "#A8B820",
  Rock: "#B8A038", Ghost: "#705898", Dragon: "#7038F8", Dark: "#705848",
  Steel: "#B8B8D0", Fairy: "#EE99AC",
};

export function ChampionsContent() {
  const { darkMode, setDarkMode } = useDarkMode();

  useEffect(() => {
    applyRandomAccent();
    track("champions_page_visited");
  }, []);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Pokemon Champions VGC Team Reports",
          description: "Build, share, and discover competitive Pokemon Champions team reports with Mega Evolution support.",
          url: "https://pokemonvgcteamreport.com/champions",
          isPartOf: {
            "@type": "WebApplication",
            name: "VGC Team Report",
            url: "https://pokemonvgcteamreport.com",
          },
        }}
      />
      <PageNavbar darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} activePage="champions" />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-surface rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-extrabold text-accent uppercase tracking-widest">
                Champions Ready
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
              Pokemon Champions<br />
              <span className="text-accent">VGC Team Reports</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Build detailed team reports for the official Pokemon Champions competitive format.
              Mega Evolution support, matchup plans, damage calcs, speed tiers, and one-click sharing.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 shadow-lg shadow-accent/30 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Build a Team Report
              </Link>
              <Link
                href="/explore?regulation=Reg+M-A"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-text-secondary hover:text-text-primary bg-surface border-2 border-border hover:border-accent/30 rounded-xl transition-all"
              >
                Explore Champions Teams
              </Link>
            </div>
          </div>
        </section>

        {/* What is Pokemon Champions */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-extrabold text-text-primary mb-4">
            What is Pokemon Champions?
          </h2>
          <div className="space-y-4 text-text-secondary text-sm leading-relaxed">
            <p>
              Pokemon Champions is the new competitive Pokemon battle game and the official platform
              for the 2026 Play! Pokemon Championship Series. It replaces Pokemon Scarlet &amp; Violet
              as the VGC format, featuring the return of <strong className="text-text-primary">Mega Evolution</strong> and{" "}
              <strong className="text-text-primary">Primal Reversion</strong> in ranked battles.
            </p>
            <p>
              The first official format is <strong className="text-text-primary">Regulation M-A</strong>,
              which will be used for the Global Challenge (May 1-4), Indianapolis Regionals (May 29-31),
              and the 2026 World Championships in San Francisco (August 28-30).
            </p>
          </div>
        </section>

        {/* Featured Mega Pokemon */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-extrabold text-text-primary mb-6">
            Featured Mega Evolutions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {MEGA_POKEMON.map((mon) => (
              <Link
                key={mon.name}
                href={`/champions/${mon.slug}`}
                className="rounded-xl border border-border bg-surface p-4 hover:border-accent/30 transition-colors group"
              >
                <h3 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">{mon.name}</h3>
                <p className="text-xs text-text-tertiary mt-0.5">{mon.ability}</p>
                <div className="flex gap-1.5 mt-2">
                  {mon.types.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
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

        {/* How it works */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-extrabold text-text-primary mb-6">
            How to Create a Champions Team Report
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Paste Your Team", desc: "Export your team from Pokemon Showdown or PokePaste and paste it into the editor. Mega Evolutions are automatically detected." },
              { step: "2", title: "Add Notes & Calcs", desc: "Add strategy notes, damage calculations, EV spread rationale, and matchup plans for each Pokemon. Tag with Reg M-A." },
              { step: "3", title: "Share & Discover", desc: "Share your report with a link, embed it on Discord, or make it public for the community to explore and learn from." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-accent-surface text-accent font-extrabold text-lg flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-1">{item.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Key Events */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-extrabold text-text-primary mb-6">
            2026 Champions Tournament Calendar
          </h2>
          <div className="space-y-3">
            {[
              { date: "April 8", event: "Pokemon Champions Launch", tag: "Release" },
              { date: "May 1-4", event: "Global Challenge 2026 I", tag: "Online" },
              { date: "May 29-31", event: "Indianapolis Regionals", tag: "Regional" },
              { date: "June 12-14", event: "NA International Championships", tag: "International" },
              { date: "August 28-30", event: "2026 World Championships", tag: "Worlds" },
            ].map((e) => (
              <div
                key={e.event}
                className="flex items-center gap-4 p-3 rounded-xl border border-border bg-surface"
              >
                <span className="text-xs font-bold text-accent whitespace-nowrap w-24 text-right">
                  {e.date}
                </span>
                <span className="text-sm font-bold text-text-primary flex-1">{e.event}</span>
                <span className="text-[10px] font-bold text-text-tertiary bg-surface-alt px-2 py-0.5 rounded-full">
                  {e.tag}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-extrabold text-text-primary mb-3">
            Ready for Champions?
          </h2>
          <p className="text-sm text-text-secondary mb-6 max-w-lg mx-auto">
            Create your first Pokemon Champions team report in under a minute.
            Free, no account required.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 shadow-lg shadow-accent/30 transition-all"
          >
            Start Building
          </Link>
        </section>
      </main>

      <PageFooter />
    </>
  );
}
