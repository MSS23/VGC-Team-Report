"use client";

import Link from "next/link";

import { applyRandomAccent } from "@/lib/utils/random-accent";

import { PageFooter } from "@/components/layout/PageFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { useEffect, useState } from "react";
import { usePostHog } from "@/components/providers/PostHogProvider";
import { CHAMPIONS_SAMPLE_TEAMS } from "@/data/champions-sample-teams";
import { INDY_TOP_CUT } from "@/data/indy-top-cut";

import {
  CHAMPIONS_REG_MB_ONLY_MEGAS,
  CHAMPIONS_REG_MC_ONLY_MEGAS,
  getRegMAMegas,
  getRegMCMegas,
  getMegaRegulation,
  hasMegaSprite,
  type ChampionsReg,
  type MegaPokemonEntry,
} from "@/lib/data/mega-pokemon";
import { MetaSnapshot } from "@/components/champions/MetaSnapshot";
import { getSpriteUrls, resolveSlug } from "@/lib/utils/sprite-slug";

function HeroSprite({ dataKey, name }: { dataKey: string; name: string }) {
  const urls = getSpriteUrls(dataKey);
  const [idx, setIdx] = useState(0);
  return (
    <img
      src={urls[Math.min(idx, urls.length - 1)]}
      alt={name}
      width={96}
      height={96}
      className="h-24 w-24 object-contain sm:h-28 sm:w-28"
      loading="eager"
      onError={() => setIdx((i) => Math.min(i + 1, urls.length - 1))}
    />
  );
}

const HERO_MEGAS = getRegMCMegas().filter((m) => hasMegaSprite(m.dataKey)).slice(0, 9);

interface MegaCard {
  name: string;
  ability: string;
  types: string[];
  slug: string;
  hasSprite: boolean;
  /** Rotation the Mega was added in; legal from that reg onward. */
  reg: ChampionsReg;
}

function toCard(m: MegaPokemonEntry): MegaCard {
  return {
    name: m.displayName,
    ability: m.ability,
    types: m.types as string[],
    slug: m.slug,
    hasSprite: hasMegaSprite(m.dataKey),
    reg: getMegaRegulation(m.dataKey),
  };
}

// Grouped by regulation rather than filtered by a client-side control ON
// PURPOSE: every card has to be present in the server-rendered HTML so crawlers
// see all 75 internal links. This grid is the ONLY place on the site that links
// to a Mega detail page, and building it from getRegMAMegas() alone is what left
// the 16 Reg M-B Megas with zero inbound links (VGC-258).
//
// Newest rotation leads.
const MEGA_GROUPS: {
  id: string;
  heading: string;
  blurb: string;
  megas: MegaCard[];
}[] = [
  {
    id: "megas-reg-m-c",
    heading: "New in Regulation M-C",
    blurb:
      "Added in the current rotation (Sep 9, Dec 2, 2026), including the three Z Megas. Not legal in Regulation M-A or M-B.",
    megas: getRegMCMegas()
      .filter((m) => CHAMPIONS_REG_MC_ONLY_MEGAS.has(m.dataKey))
      .map(toCard),
  },
  {
    id: "megas-reg-m-b",
    heading: "Added in Regulation M-B",
    blurb:
      "Added when Champions rotated to Regulation M-B. Legal in M-B and M-C, not in M-A.",
    megas: getRegMCMegas()
      .filter((m) => CHAMPIONS_REG_MB_ONLY_MEGAS.has(m.dataKey))
      .map(toCard),
  },
  {
    id: "megas-reg-m-a",
    heading: "Legal in every Champions regulation",
    blurb:
      "The launch-format Mega pool. Each regulation is a superset of the last, so every one of these is legal in M-A, M-B and M-C.",
    megas: getRegMAMegas().map(toCard),
  },
];

const TOTAL_MEGAS = MEGA_GROUPS.reduce((n, g) => n + g.megas.length, 0);

const LIGHT_INK_TYPES = new Set(["Dark", "Ghost", "Dragon", "Fighting", "Poison"]);
const TYPE_COLORS: Record<string, string> = {
  Normal: "#A8A878", Fire: "#F08030", Water: "#6890F0", Electric: "#F8D030",
  Grass: "#78C850", Ice: "#98D8D8", Fighting: "#C03028", Poison: "#A040A0",
  Ground: "#E0C068", Flying: "#A890F0", Psychic: "#F85888", Bug: "#A8B820",
  Rock: "#B8A038", Ghost: "#705898", Dragon: "#7038F8", Dark: "#705848",
  Steel: "#B8B8D0", Fairy: "#EE99AC",
};

export function ChampionsContent() {
  const posthog = usePostHog();
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
        <section className="mx-auto max-w-(--container) px-(--gutter) pt-12 pb-16 sm:pt-16 lg:flex lg:min-h-[calc(100dvh-4rem)] lg:items-center lg:py-0">
          <div className="grid w-full items-center gap-12 lg:grid-cols-12 lg:gap-(--gap-columns)">
          <div className="lg:col-span-5">
            <h1 className="font-display text-display-s font-bold tracking-display text-text-primary">
              Pokemon Champions<br />
              VGC Team Reports
            </h1>
            <p className="lead mt-5 text-text-secondary">
              Build detailed team reports for the official Pokemon Champions competitive format.
              Mega Evolution support, matchup plans, damage calcs, speed tiers, and one-click sharing.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-card bg-accent px-6 whitespace-nowrap text-base font-semibold text-accent-ink transition-[background-color,transform] duration-(--dur-short) hover:brightness-110 active:translate-y-px"
              >
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Build a Team Report
              </Link>
              <Link
                href="/explore?regulation=Reg+M-A"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-card border border-text-primary px-6 whitespace-nowrap text-base font-semibold text-text-primary transition-colors duration-(--dur-short) hover:bg-surface-alt"
              >
                Explore Champions Teams
              </Link>
            </div>
          </div>
          <ul className="grid grid-cols-3 gap-4 lg:col-span-7 lg:gap-6" aria-label="Mega Evolutions legal in the current regulation">
            {HERO_MEGAS.map((m) => (
              <li key={m.dataKey} className="flex aspect-square items-center justify-center rounded-card bg-surface">
                <HeroSprite dataKey={m.dataKey} name={m.displayName} />
              </li>
            ))}
          </ul>
          </div>
        </section>

        {/* What is Pokemon Champions */}
        <section className="mx-auto max-w-(--container) px-(--gutter) py-(--section-gap-s)">
          <h2 className="font-display text-section font-bold tracking-display text-text-primary mb-10">
            What is Pokemon Champions?
          </h2>
          <div className="max-w-[65ch] space-y-4 text-text-secondary leading-relaxed">
            <p>
              Pokemon Champions is the new competitive Pokemon battle game and the official platform
              for the 2026 Play! Pokemon Championship Series. It replaces Pokemon Scarlet &amp; Violet
              as the VGC format, with <strong className="text-text-primary">Mega Evolution</strong> returning
              as the headline mechanic.
            </p>
            <p>
              The season opened on <strong className="text-text-primary">Regulation M-A</strong>, the
              format played at the Global Challenge (May 1-4), Indianapolis Regionals (May 29-31), and
              the NA International Championships (June 12-14). Reg M-A banned all Legendary and
              Restricted Pokemon, no Groudon, Kyogre, Calyrex, Miraidon, Koraidon, or other restricted
              picks, and allowed one Mega Evolution per battle from a pool of 59 legal Mega forms.
            </p>
            <p>
              <strong className="text-text-primary">Regulation M-B</strong> added 16 Megas including Mega
              Metagross, Mawile and Blaziken. The current format,{" "}
              <strong className="text-text-primary">Regulation M-C</strong> (Sep 9, Dec 2, 2026), keeps
              everything from M-B and adds the Galar starters, Indeedee, Baxcalibur and more, plus six
              Megas, the new Z Megas (Garchomp Z, Lucario Z, Absol Z) and Mega Salamence, Baxcalibur
              and Golisopod, for {TOTAL_MEGAS} legal Mega forms. Restricted Pokemon stay banned, item
              clause applies, and you can still only Mega Evolve once per battle.
            </p>
          </div>
        </section>

        {/* Mega Pokemon index, grouped by regulation */}
        <section className="mx-auto max-w-(--container) px-(--gutter) py-(--section-gap-s)">
          <h2 className="font-display text-section font-bold tracking-display text-text-primary mb-5">
            Every Legal Mega Evolution
          </h2>
          <p className="mb-12 max-w-[65ch] text-text-secondary leading-relaxed">
            All {TOTAL_MEGAS} Mega Evolutions legal in Pokemon Champions, grouped by the regulation
            they can be played in. Pick one for its stats, ability, Mega Stone, SP spreads, and
            community team reports.
          </p>
          {MEGA_GROUPS.map((group) => (
            <div key={group.id} className="mb-10 last:mb-0">
              <h3 id={group.id} className="font-display text-title font-bold tracking-tight text-text-primary"
              >
                {group.heading}{" "}
                <span className="text-xs font-bold text-text-tertiary align-middle">
                  ({group.megas.length})
                </span>
              </h3>
              <p className="text-xs text-text-secondary mt-1 mb-4 max-w-2xl leading-relaxed">
                {group.blurb}
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 list-none p-0 m-0">
                {group.megas.map((mon) => (
                  <li key={mon.slug}>
                    {mon.hasSprite ? (
                      <Link
                        href={`/champions/${mon.slug}`}
                        className="block h-full rounded-xl border border-border bg-surface p-4 hover:border-accent/30 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                            {mon.name}
                          </h4>
                          {mon.reg !== "M-A" && (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-accent-surface text-accent border border-accent/20 whitespace-nowrap">
                              Reg {mon.reg}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-tertiary mt-0.5">{mon.ability}</p>
                        <div className="flex gap-1.5 mt-2">
                          {mon.types.map((t) => (
                            <span
                              key={t}
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${LIGHT_INK_TYPES.has(t) ? "text-white" : "text-(--night)"}`}
                              style={{ backgroundColor: TYPE_COLORS[t] ?? "var(--sprite-fallback)" }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </Link>
                    ) : (
                      // Sprite-less Megas (Meowstic, Raichu X/Y) have no landing
                      // page, Showdown ships no usable sprite, so the page would
                      // render broken. Surfaced as a non-clickable "Coming Soon"
                      // card instead.
                      <div
                        className="h-full rounded-xl border border-border bg-surface/60 p-4 opacity-60 cursor-not-allowed"
                        aria-disabled="true"
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-text-tertiary">{mon.name}</h4>
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                            Coming Soon
                          </span>
                        </div>
                        <p className="text-xs text-text-tertiary/70 mt-0.5">{mon.ability}</p>
                        <div className="flex gap-1.5 mt-2">
                          {mon.types.map((t) => (
                            <span
                              key={t}
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${LIGHT_INK_TYPES.has(t) ? "text-white" : "text-(--night)"}${" opacity-70"}`}
                              style={{ backgroundColor: TYPE_COLORS[t] ?? "var(--sprite-fallback)" }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-text-tertiary/60 mt-2 italic">Sprite unavailable</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Sample Teams */}
        <section className="mx-auto max-w-(--container) px-(--gutter) py-(--section-gap-s)">
          <h2 className="font-display text-section font-bold tracking-display text-text-primary mb-5">
            Sample Teams to Get You Started
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            New to Champions format? Try one of these classic archetypes and build your first report in seconds.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CHAMPIONS_SAMPLE_TEAMS.map((team) => (
              <div
                key={team.id}
                className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-3"
              >
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{team.name}</h3>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">{team.description}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {team.pokemon.map((species) => (
                    <span
                      key={species}
                      className="text-xs font-bold text-text-secondary bg-surface-alt border border-border px-2 py-0.5 rounded-full capitalize"
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
                  Try this team
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Champions Meta Snapshot */}
        <MetaSnapshot />

        {/* Indy Regionals Top Cut */}
        <section className="mx-auto max-w-(--container) px-(--gutter) py-(--section-gap-s)">
          <div className="flex flex-col sm:flex-row sm:items-end gap-2 mb-2">
            <h2 className="font-display text-section font-bold tracking-display text-text-primary">
              Indianapolis Regionals Top Cut
            </h2>
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full self-start sm:self-auto mb-0.5">
              Sample, May 29-31, 2026
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
            <table className="w-full text-sm border-collapse" aria-label="Indianapolis Regionals top cut teams">
              <caption className="sr-only">
                Indianapolis Regionals Top Cut, Sample representatives from the Regulation M-A meta. Columns: placement, player, team Pokémon, and Limitless link.
              </caption>
              <thead>
                <tr className="bg-surface-alt border-b border-border">
                  <th scope="col" className="text-left text-xs font-bold text-text-tertiary px-4 py-3 w-16">
                    Place
                  </th>
                  <th scope="col" className="text-left text-xs font-bold text-text-tertiary px-4 py-3">
                    Player
                  </th>
                  <th scope="col" className="text-left text-xs font-bold text-text-tertiary px-4 py-3">
                    Team
                  </th>
                  <th scope="col" className="text-xs font-bold text-text-tertiary px-4 py-3 w-20">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {INDY_TOP_CUT.map((entry, idx) => (
                  <tr
                    key={`${entry.placement}-${idx}`}
                    className="border-b border-border last:border-0 bg-surface hover:bg-surface-alt transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-accent whitespace-nowrap">
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
                              className="inline-flex items-center gap-1 text-xs font-bold text-text-secondary bg-surface-alt border border-border px-2 py-0.5 rounded-full"
                            >
                              <img
                                src={`https://play.pokemonshowdown.com/sprites/home/${resolveSlug(slug)}.png`}
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
                           className="inline-flex min-h-11 items-center gap-1 px-2 text-xs font-bold text-accent hover:underline active:opacity-70"
                          aria-label={`View ${entry.player} team on Limitless`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-text-tertiary">, </span>
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
              className="inline-flex min-h-11 items-center text-accent underline underline-offset-2 hover:opacity-80 active:opacity-70 transition-opacity"
            >
              play.limitlesstcg.com/tournaments
            </a>
          </p>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-(--container) px-(--gutter) py-(--section-gap-s)">
          <h2 className="font-display text-section font-bold tracking-display text-text-primary mb-10">
            How to Create a Champions Team Report
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Paste Your Team", desc: "Export your team from Pokemon Showdown or PokePaste and paste it into the editor. Mega Evolutions are automatically detected." },
              { step: "2", title: "Add Notes & Calcs", desc: "Add strategy notes, damage calculations, spread notes, and matchup plans for each Pokemon. Tag with Reg M-A, M-B or M-C." },
              { step: "3", title: "Share & Discover", desc: "Share your report with a link, embed it on Discord, or make it public for the community to explore and learn from." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-accent-surface text-accent font-bold text-lg flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-1">{item.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* EV → SP converter */}
        <section className="mx-auto max-w-(--container) px-(--gutter) py-(--section-gap-s)">
          <h2 className="font-display text-section font-bold tracking-display text-text-primary mb-5">
            Still Thinking in EVs?
          </h2>
          <p className="text-sm text-text-secondary mb-5 max-w-2xl leading-relaxed">
            Champions swaps EVs for Stat Points, 66 in total, 32 max per stat.
            The first SP costs 4 EVs and every one after it costs 8, which is why
            the conversion trips people up. Our free converter does the math both ways.
          </p>
          <Link
            href="/tools/ev-to-sp"
            className="inline-flex min-h-11 items-center gap-2 px-4 py-2 bg-surface border border-border text-sm font-bold text-text-primary rounded-xl hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/40 active:scale-[0.97] transition"
          >
            Open the EV to SP Converter
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </section>

        {/* Key Events */}
        <section className="mx-auto max-w-(--container) px-(--gutter) py-(--section-gap-s)">
          <h2 className="font-display text-section font-bold tracking-display text-text-primary mb-10">
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
                <span className="text-xs font-bold text-text-tertiary bg-surface-alt px-2 py-0.5 rounded-full">
                  {e.tag}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-(--container) border-t border-border px-(--gutter) py-(--section-gap-s)">
          <h2 className="font-display text-section font-bold tracking-display text-text-primary mb-10">
            Ready for Champions?
          </h2>
          <p className="text-sm text-text-secondary mb-6 max-w-lg mx-auto">
            Create your first Pokemon Champions team report in under a minute.
            Free, no account required.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 shadow-lg shadow-accent/30 transition"
          >
            Start Building
          </Link>
        </section>
      </main>

      <PageFooter />
    </>
  );
}
