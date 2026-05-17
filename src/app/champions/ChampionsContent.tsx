"use client";

import Link from "next/link";

import { applyRandomAccent } from "@/lib/utils/random-accent";

import { PageFooter } from "@/components/layout/PageFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { useEffect } from "react";
import { usePostHog } from "@/components/providers/PostHogProvider";
import { CHAMPIONS_SAMPLE_TEAMS } from "@/data/champions-sample-teams";
import { INDY_TOP_CUT } from "@/data/indy-top-cut";

import { getRegMAMegas, hasMegaSprite } from "@/lib/data/mega-pokemon";
import { MetaSnapshot } from "@/components/champions/MetaSnapshot";
import { I18nProvider, useTranslation } from "@/lib/i18n";
const MEGA_POKEMON = getRegMAMegas().map((m) => ({
  name: m.displayName.replace(/^Mega /, "") + "-Mega",
  ability: m.ability,
  types: m.types,
  slug: m.slug,
  hasSprite: hasMegaSprite(m.dataKey),
}));

const TYPE_COLORS: Record<string, string> = {
  Normal: "#A8A878", Fire: "#F08030", Water: "#6890F0", Electric: "#F8D030",
  Grass: "#78C850", Ice: "#98D8D8", Fighting: "#C03028", Poison: "#A040A0",
  Ground: "#E0C068", Flying: "#A890F0", Psychic: "#F85888", Bug: "#A8B820",
  Rock: "#B8A038", Ghost: "#705898", Dragon: "#7038F8", Dark: "#705848",
  Steel: "#B8B8D0", Fairy: "#EE99AC",
};

export function ChampionsContent() {
  return (
    <I18nProvider>
      <ChampionsContentInner />
    </I18nProvider>
  );
}

function ChampionsContentInner() {
  const posthog = usePostHog();
  const { t } = useTranslation();
  useEffect(() => {
    applyRandomAccent();
    posthog?.capture("champions_page_visited");
  }, [posthog]);

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
      <main className="min-h-screen bg-background pb-24 sm:pb-0">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-surface rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-extrabold text-accent uppercase tracking-widest">
                {t.championsReady}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight leading-tight">
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
                {t.buildTeamReport}
              </Link>
              <Link
                href="/explore?regulation=Reg+M-A"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-text-secondary hover:text-text-primary bg-surface border-2 border-border hover:border-accent/30 rounded-xl transition-all"
              >
                {t.exploreChampionsTeams}
              </Link>
            </div>
          </div>
        </section>

        {/* What is Pokemon Champions */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mb-5">
            What is Pokemon Champions?
          </h2>
          <div className="space-y-4 text-text-secondary text-sm leading-relaxed">
            <p>
              Pokemon Champions is the new competitive Pokemon battle game and the official platform
              for the 2026 Play! Pokemon Championship Series. It replaces Pokemon Scarlet &amp; Violet
              as the VGC format, with <strong className="text-text-primary">Mega Evolution</strong> returning
              as the headline mechanic.
            </p>
            <p>
              The first official format is <strong className="text-text-primary">Regulation M-A</strong>,
              which will be used for the Global Challenge (May 1-4), Indianapolis Regionals (May 29-31),
              and the 2026 World Championships in San Francisco (August 28-30). Reg M-A bans all
              Legendary and Restricted Pokemon — no Groudon, Kyogre, Calyrex, Miraidon, Koraidon, or
              other restricted picks. Players may Mega Evolve once per battle from a pool of 59 legal
              Mega forms (Mega Salamence, Mega Metagross, and Mega Mawile are explicitly NOT in the
              format).
            </p>
          </div>
        </section>

        {/* Featured Mega Pokemon */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mb-5">
            {t.featuredMegaEvolutions}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {MEGA_POKEMON.map((mon) => {
              if (!mon.hasSprite) {
                return (
                  <div
                    key={mon.name}
                    className="rounded-xl border border-border bg-surface/60 p-4 opacity-60 cursor-not-allowed"
                    aria-disabled="true"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-text-tertiary">{mon.name}</h3>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                        {t.comingSoon}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary/70 mt-0.5">{mon.ability}</p>
                    <div className="flex gap-1.5 mt-2">
                      {mon.types.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-bold text-white/70 px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: TYPE_COLORS[t] ?? "#888" }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-text-tertiary/60 mt-2 italic">{t.spriteUnavailable}</p>
                  </div>
                );
              }
              return (
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
              );
            })}
          </div>
        </section>

        {/* Sample Teams */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mb-2">
            {t.sampleTeamsHeading}
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            {t.sampleTeamsDesc}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CHAMPIONS_SAMPLE_TEAMS.map((team) => (
              <div
                key={team.id}
                className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-3"
              >
                <div>
                  <h3 className="text-sm font-extrabold text-text-primary">{team.name}</h3>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">{team.description}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {team.pokemon.map((species) => (
                    <span
                      key={species}
                      className="text-[10px] font-bold text-text-secondary bg-surface-alt border border-border px-2 py-0.5 rounded-full capitalize"
                    >
                      {species.replace(/-/g, " ")}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/?sample=${team.id}`}
                  className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-accent-surface text-accent text-xs font-bold rounded-lg hover:bg-accent hover:text-white transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  {t.tryThisTeam}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Champions Meta Snapshot */}
        <MetaSnapshot />

        {/* Indy Regionals Top Cut */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-2 mb-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
              Indianapolis Regionals Top Cut
            </h2>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full self-start sm:self-auto mb-0.5">
              Sample — May 29-31, 2026
            </span>
          </div>
          <p className="text-sm text-text-secondary mb-1">
            The inaugural Champions format Regional Championship. These are representative archetypes from the Regulation M-A meta.
          </p>
          <p className="text-xs text-text-tertiary mb-6">
            Real results will be published on{" "}
            <a
              href="https://play.limitlesstcg.com/tournaments"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Limitless TCG
            </a>{" "}
            once the tournament concludes.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface-alt border-b border-border">
                  <th className="text-left text-xs font-extrabold text-text-tertiary uppercase tracking-wider px-4 py-3 w-16">
                    {t.tablePlace}
                  </th>
                  <th className="text-left text-xs font-extrabold text-text-tertiary uppercase tracking-wider px-4 py-3">
                    {t.tablePlayer}
                  </th>
                  <th className="text-left text-xs font-extrabold text-text-tertiary uppercase tracking-wider px-4 py-3">
                    {t.tableTeam}
                  </th>
                  <th className="text-xs font-extrabold text-text-tertiary uppercase tracking-wider px-4 py-3 w-20">
                    {t.tableDetails}
                  </th>
                </tr>
              </thead>
              <tbody>
                {INDY_TOP_CUT.map((entry, idx) => (
                  <tr
                    key={`${entry.placement}-${idx}`}
                    className="border-b border-border last:border-0 bg-surface hover:bg-surface-alt transition-colors"
                  >
                    <td className="px-4 py-3 font-extrabold text-accent whitespace-nowrap">
                      {entry.placement}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-bold text-text-primary">
                        {entry.country} {entry.player}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {entry.species.map((name) => {
                          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
                          return (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-text-secondary bg-surface-alt border border-border px-2 py-0.5 rounded-full"
                            >
                              <img
                                src={`https://play.pokemonshowdown.com/sprites/home/${slug}.png`}
                                alt={name}
                                width={20}
                                height={20}
                                loading="lazy"
                                className="object-contain"
                                style={{ maxWidth: 20, maxHeight: 20 }}
                              />
                              {name}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.limitlessUrl ? (
                        <a
                          href={entry.limitlessUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                          aria-label={`View ${entry.player} team on Limitless`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          {t.viewLink}
                        </a>
                      ) : (
                        <span className="text-xs text-text-tertiary">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-tertiary mt-3 text-center">
            Full bracket and team lists:{" "}
            <a
              href="https://play.limitlesstcg.com/tournaments"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              play.limitlesstcg.com/tournaments
            </a>
          </p>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mb-5">
            How to Create a Champions Team Report
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Paste Your Team", desc: "Export your team from Pokemon Showdown or PokePaste and paste it into the editor. Mega Evolutions are automatically detected." },
              { step: "2", title: "Add Notes & Calcs", desc: "Add strategy notes, damage calculations, spread notes, and matchup plans for each Pokemon. Tag with Reg M-A." },
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
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mb-5">
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
        <section className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mb-5">
            {t.readyForChampions}
          </h2>
          <p className="text-sm text-text-secondary mb-6 max-w-lg mx-auto">
            Create your first Pokemon Champions team report in under a minute.
            Free, no account required.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 shadow-lg shadow-accent/30 transition-all"
          >
            {t.startBuilding}
          </Link>
        </section>
      </main>

      <PageFooter />
    </>
  );
}
