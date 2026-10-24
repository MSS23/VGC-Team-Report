import { Suspense } from "react";
import { I18nProvider } from "@/lib/i18n";
import { FAQPageJsonLd, HowToSchema } from "@/components/seo/JsonLd";
import { resolveSlug } from "@/lib/utils/sprite-slug";
import HomePageClient from "./HomePageClient";

const POKEMON_SPRITES = ["kangaskhan-mega", "salamence-mega", "incineroar", "charizard-megay", "groudon-primal", "metagross-mega"];
const HOW_TO_STEPS = [
  {
    name: "Export your team",
    text: "Open Pokémon Showdown or PokéPaste and export your team as a text paste (Showdown format).",
  },
  {
    name: "Paste your team into VGC Team Report",
    text: "Go to pokemonvgcteamreport.com, paste your Showdown export or PokéPaste URL into the input field, and click Analyze.",
  },
  {
    name: "Add notes, damage calcs, and speed tiers",
    text: "Fill in your team overview, per-Pokémon role notes, key damage calculations, and speed tier comparisons using the built-in editor.",
  },
  {
    name: "Add matchup plans",
    text: "Document your matchup plans against common threats and tournament meta picks so viewers understand your game plan.",
  },
  {
    name: "Share your report",
    text: "Click the Share button to generate a permanent public link. Optionally publish it to the Explore page so the community can discover your report.",
  },
];


// These static sections travel as server-rendered slots. Locale-dependent copy,
// form controls, draft recovery and the report editor remain interactive.
export function HomePageServer() {
  return <I18nProvider>
    <FAQPageJsonLd />
    <HowToSchema steps={HOW_TO_STEPS} />
    <Suspense fallback={<p role="status" className="p-8 text-center text-text-secondary">Loading team builder...</p>}>
      <HomePageClient sprites={<LandingSprites />} steps={<LandingSteps />} feedback={<LandingFeedback />} />
    </Suspense>
  </I18nProvider>;
}

function LandingSprites() { return (
      <div className="flex justify-center gap-3 sm:gap-5 mb-4 sm:mb-8 overflow-hidden">
        {POKEMON_SPRITES.map((name) => (
          <picture key={name}>
            <source
              media="(max-width: 639px), (prefers-reduced-motion: reduce)"
              srcSet={`https://play.pokemonshowdown.com/sprites/home/${resolveSlug(name)}.png`}
            />
            <img
              src={`https://play.pokemonshowdown.com/sprites/ani/${resolveSlug(name)}.gif`}
              alt=""
              width={64}
              height={64}
              className="w-11 h-11 sm:w-16 sm:h-16 object-contain drop-shadow-lg"



              loading="eager"
            />
          </picture>
        ))}
      </div>

); }
function LandingSteps() { return <>
          {[
            { step: "1", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", title: "Paste your team", desc: "Import any PokéPaste URL, rental code, or Showdown export" },
            { step: "2", icon: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z", title: "Add your notes", desc: "Damage calcs, matchup plans, and strategy" },
            { step: "3", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75", title: "Share with anyone", desc: "Public link, presentation mode, or PDF export" },
          ].map((item) => (
            <div
              key={item.step}
              className="flex-1 flex items-start gap-3 p-3 rounded-xl bg-surface border border-border"
            >
              <div className="w-7 h-7 rounded-lg bg-accent-surface flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d={item.icon} />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-text-primary">{item.title}</p>
                <p className="text-[10px] text-text-tertiary leading-snug mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
</>; }
function LandingFeedback() { return <>
      {/* Feedback callout */}
      <div
        className="mt-6 sm:mt-8"



      >
        <a
          href="/feedback"
          className="group flex items-start gap-3 p-4 rounded-xl bg-surface border border-border hover:border-accent/30 transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/15 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">Got a feature idea or found a bug?</p>
            <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">
              Your feedback shapes this tool. Suggest features, report issues, or tell us what you&apos;d improve.
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </a>
      </div>

</>; }
