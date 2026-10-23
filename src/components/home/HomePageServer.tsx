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
      <div className="mb-8 flex flex-nowrap gap-2 sm:flex-wrap sm:gap-4">
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
              className="h-11 w-11 object-contain sm:h-16 sm:w-16"
              loading="eager"
            />
          </picture>
        ))}
      </div>
); }
function LandingSteps() { return (
          <ol className="grid gap-8 sm:grid-cols-3 sm:gap-(--gap-columns)">
            {[
              { title: "Paste your team", desc: "Import any PokéPaste URL, rental code, or Showdown export" },
              { title: "Add your notes", desc: "Damage calcs, matchup plans, and strategy" },
              { title: "Share with anyone", desc: "Public link, presentation mode, or PDF export" },
            ].map((item, i) => (
              <li key={item.title} className="border-t border-border pt-5">
                <span className="font-display text-3xl font-bold tabular-nums text-text-tertiary" aria-hidden="true">{i + 1}</span>
                <h3 className="font-display mt-4 text-title font-bold tracking-tight text-text-primary">{item.title}</h3>
                <p className="mt-2 text-text-secondary">{item.desc}</p>
              </li>
            ))}
          </ol>
); }
function LandingFeedback() { return (
      <section className="mx-auto max-w-(--container) px-(--gutter) pt-(--section-gap)" aria-label="Feedback">
        <div className="flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-title font-bold tracking-tight text-text-primary">Got a feature idea or found a bug?</p>
            <p className="mt-1 text-text-secondary">
              Your feedback shapes this tool. Suggest features, report issues, or tell us what you&apos;d improve.
            </p>
          </div>
          <a
            href="/feedback"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-card border border-text-primary px-6 text-base font-semibold text-text-primary transition-colors duration-(--dur-short) hover:bg-surface-alt"
          >
            Send feedback
          </a>
        </div>
      </section>
); }
