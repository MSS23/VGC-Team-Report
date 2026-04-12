"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDarkMode } from "@/hooks/useDarkMode";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { PageNavbar } from "@/components/layout/PageNavbar";
import { PageFooter } from "@/components/layout/PageFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { useEffect, useCallback } from "react";
import { track } from "@vercel/analytics";
import posthog from "posthog-js";

// ── Sample team archetypes for the "Try a Sample Team" section ────────────
// Each paste is a valid Showdown export that passes Champions legality.
const SAMPLE_TEAMS = [
  {
    name: "Mega Kangaskhan Offense",
    description: "Fake Out pressure + Xerneas Geomancy. Classic power play.",
    lead: ["Kangaskhan-Mega", "Xerneas"],
    pokemon: ["Kangaskhan", "Xerneas", "Groudon", "Incineroar", "Whimsicott", "Tsareena"],
    paste: `Kangaskhan @ Kangaskhanite
Ability: Scrappy
Level: 50
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Fake Out
- Return
- Sucker Punch
- Power-Up Punch

Xerneas @ Power Herb
Ability: Fairy Aura
Level: 50
EVs: 28 HP / 228 SpA / 252 Spe
Timid Nature
IVs: 0 Atk
- Geomancy
- Dazzling Gleam
- Moonblast
- Protect

Groudon @ Assault Vest
Ability: Drought
Level: 50
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Precipice Blades
- Fire Punch
- Rock Slide
- Shadow Claw

Incineroar @ Sitrus Berry
Ability: Intimidate
Level: 50
EVs: 252 HP / 4 Atk / 252 SpD
Careful Nature
- Fake Out
- Flare Blitz
- Knock Off
- Parting Shot

Whimsicott @ Focus Sash
Ability: Prankster
Level: 50
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
IVs: 0 Atk
- Tailwind
- Moonblast
- Encore
- Protect

Tsareena @ Miracle Seed
Ability: Queenly Majesty
Level: 50
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Power Whip
- High Jump Kick
- U-turn
- Protect`,
  },
  {
    name: "Primal Groudon Sun",
    description: "Sun-powered offense with Mega Charizard Y. Double weather control.",
    lead: ["Charizard-Mega-Y", "Groudon"],
    pokemon: ["Charizard", "Groudon", "Venusaur", "Incineroar", "Hatterene", "Tsareena"],
    paste: `Charizard @ Charizardite Y
Ability: Blaze
Level: 50
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
IVs: 0 Atk
- Heat Wave
- Solar Beam
- Air Slash
- Protect

Groudon @ Red Orb
Ability: Drought
Level: 50
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Precipice Blades
- Fire Punch
- Swords Dance
- Protect

Venusaur @ Life Orb
Ability: Chlorophyll
Level: 50
EVs: 4 HP / 252 SpA / 252 Spe
Modest Nature
IVs: 0 Atk
- Solar Beam
- Sludge Bomb
- Earth Power
- Protect

Incineroar @ Sitrus Berry
Ability: Intimidate
Level: 50
EVs: 252 HP / 4 Atk / 252 SpD
Careful Nature
- Fake Out
- Flare Blitz
- Knock Off
- Parting Shot

Hatterene @ Leftovers
Ability: Magic Bounce
Level: 50
EVs: 252 HP / 4 Def / 252 SpA
Quiet Nature
IVs: 0 Atk / 0 Spe
- Trick Room
- Dazzling Gleam
- Psychic
- Mystical Fire

Tsareena @ Assault Vest
Ability: Queenly Majesty
Level: 50
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Power Whip
- High Jump Kick
- U-turn
- Rapid Spin`,
  },
  {
    name: "Mega Salamence Tailwind",
    description: "Aerilate sweeper backed by speed control and rain.",
    lead: ["Salamence-Mega", "Whimsicott"],
    pokemon: ["Salamence", "Kyogre", "Whimsicott", "Incineroar", "Kingambit", "Tsareena"],
    paste: `Salamence @ Salamencite
Ability: Intimidate
Level: 50
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Double-Edge
- Dragon Claw
- Earthquake
- Protect

Kyogre @ Choice Scarf
Ability: Drizzle
Level: 50
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
IVs: 0 Atk
- Water Spout
- Origin Pulse
- Ice Beam
- Thunder

Whimsicott @ Focus Sash
Ability: Prankster
Level: 50
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
IVs: 0 Atk
- Tailwind
- Moonblast
- Encore
- Protect

Incineroar @ Sitrus Berry
Ability: Intimidate
Level: 50
EVs: 252 HP / 4 Atk / 252 SpD
Careful Nature
- Fake Out
- Flare Blitz
- Knock Off
- Parting Shot

Kingambit @ Assault Vest
Ability: Defiant
Level: 50
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Iron Head
- Sucker Punch
- Kowtow Cleave
- Low Kick

Tsareena @ Miracle Seed
Ability: Queenly Majesty
Level: 50
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Power Whip
- High Jump Kick
- U-turn
- Protect`,
  },
  {
    name: "Trick Room (Mega Mawile)",
    description: "Slow and devastating. Mawile hits hardest under Trick Room.",
    lead: ["Mawile-Mega", "Cresselia"],
    pokemon: ["Mawile", "Calyrex-Ice", "Farigiraf", "Incineroar", "Oranguru", "Torkoal"],
    paste: `Mawile @ Mawilite
Ability: Intimidate
Level: 50
EVs: 252 HP / 252 Atk / 4 SpD
Brave Nature
IVs: 0 Spe
- Iron Head
- Play Rough
- Sucker Punch
- Protect

Calyrex-Ice @ Clear Amulet
Ability: As One (Glastrier)
Level: 50
EVs: 252 HP / 252 Atk / 4 SpD
Brave Nature
IVs: 0 Spe
- Glacial Lance
- High Horsepower
- Trick Room
- Protect

Farigiraf @ Sitrus Berry
Ability: Armor Tail
Level: 50
EVs: 252 HP / 116 Def / 140 SpD
Relaxed Nature
IVs: 0 Atk / 0 Spe
- Trick Room
- Psychic
- Helping Hand
- Protect

Incineroar @ Assault Vest
Ability: Intimidate
Level: 50
EVs: 252 HP / 4 Atk / 252 SpD
Sassy Nature
IVs: 0 Spe
- Fake Out
- Flare Blitz
- Knock Off
- Parting Shot

Oranguru @ Mental Herb
Ability: Inner Focus
Level: 50
EVs: 252 HP / 4 Def / 252 SpD
Sassy Nature
IVs: 0 Atk / 0 Spe
- Trick Room
- Instruct
- Psychic
- Ally Switch

Torkoal @ Charcoal
Ability: Drought
Level: 50
EVs: 252 HP / 252 SpA / 4 SpD
Quiet Nature
IVs: 0 Atk / 0 Spe
- Eruption
- Heat Wave
- Earth Power
- Protect`,
  },
];

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
  const router = useRouter();

  useEffect(() => {
    applyRandomAccent();
    track("champions_page_visited");
    posthog.capture("champions_page_visited");
  }, []);

  const loadSampleTeam = useCallback((paste: string, name: string) => {
    try {
      // Write to the same localStorage key the home page restore reads
      localStorage.setItem("vgc-team-paste-v2", paste);
      localStorage.setItem("vgc-team-paste-source-v2", "user");
    } catch {
      // localStorage unavailable — navigation will still work, just no auto-restore
    }
    track("sample_team_loaded", { team: name });
    posthog.capture("sample_team_loaded", { team: name });
    router.push("/");
  }, [router]);

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

      <main className="min-h-screen bg-background pb-24 sm:pb-0">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-surface rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-extrabold text-accent uppercase tracking-widest">
                Champions Ready
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
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mb-5">
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
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mb-5">
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

        {/* Try a Sample Team */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mb-2">
            Try a Sample Team
          </h2>
          <p className="text-sm text-text-secondary mb-5">
            Load a pre-built archetype to see what a Champions team report looks like.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SAMPLE_TEAMS.map((team) => (
              <button
                key={team.name}
                type="button"
                onClick={() => loadSampleTeam(team.paste, team.name)}
                className="text-left rounded-xl border border-border bg-surface p-4 hover:border-accent/30 transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                    {team.name}
                  </h3>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary group-hover:text-accent transition-colors">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
                <p className="text-xs text-text-secondary mb-2">{team.description}</p>
                <div className="flex flex-wrap gap-1">
                  {team.pokemon.map((name) => (
                    <span
                      key={name}
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-alt text-text-tertiary"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </button>
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
