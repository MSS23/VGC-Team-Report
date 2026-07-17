import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbListJsonLd, FAQPageJsonLd, HowToSchema } from "@/components/seo/JsonLd";
import { PageFooter } from "@/components/layout/PageFooter";

export const metadata: Metadata = {
  title: "FAQ — Common Questions Answered",
  description:
    "Answers to the most common questions about VGC Team Report: how to share a Pokémon VGC team, what a team report is, format support, and more.",
  keywords: ["VGC team report FAQ", "how to share VGC team", "Pokemon team report", "VGC team builder help", "Showdown export", "PokePaste alternative", "VGC damage calcs", "speed tiers VGC", "Pokemon Champions format"],
  alternates: { canonical: "https://pokemonvgcteamreport.com/faq" },
  openGraph: {
    title: "VGC Team Report FAQ — Common Questions Answered",
    description:
      "Answers to the most common questions about VGC Team Report: how to share a Pokémon VGC team, what a team report is, format support, and more.",
    url: "https://pokemonvgcteamreport.com/faq",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VGC Team Report FAQ — Common Questions Answered",
    description:
      "Answers to the most common questions about VGC Team Report: how to share a Pokémon VGC team, what a team report is, format support, and more.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

const FAQ_ITEMS = [
  {
    question: "What is VGC Team Report?",
    answer:
      "VGC Team Report is a free web tool for competitive Pokémon players. It lets you build a detailed team report — paste your team from Pokémon Showdown or PokéPaste, add matchup notes, key damage calculations, speed tier breakdowns, and tournament context, then share it with a single link. Whether you're presenting a team after a Regional Championship, coaching a student, or documenting a ladder build, VGC Team Report gives your team the write-up it deserves.",
  },
  {
    question: "What is a VGC team report?",
    answer:
      "A VGC team report is a structured document that explains not just what a competitive team is, but why it was built that way. A good team report covers the six Pokémon and their movesets, items, and EV spreads; the core strategy and win conditions; matchup notes against top meta threats; key damage calculations explaining EV spread choices; speed tier comparisons showing who outspeeds whom; and tournament context including the format, event, and placement. Team reports are a long-standing tradition in competitive Pokémon, originally popularized on Smogon and platforms like Victory Road.",
  },
  {
    question: "How do I share a VGC team using VGC Team Report?",
    answer:
      "Sharing a team takes under five minutes. Export your team from Pokémon Showdown (team builder → Export) or copy a PokéPaste link. Paste the export into VGC Team Report — the tool automatically parses your six Pokémon, movesets, items, and abilities. Add your report content: matchup notes, damage calcs, speed tiers, and a team overview. Click Share to generate a permanent public link. Anyone with the link can view your report without needing an account.",
  },
  {
    question: "Does VGC Team Report support Pokémon Champions and Mega Evolution?",
    answer:
      "Yes. VGC Team Report fully supports Pokémon Champions — the official competitive format for the 2026 Play! Pokémon Championship Series — including Mega Evolution detection and display. When you import a Pokémon Champions team, Mega Evolutions are automatically recognized and displayed with their Mega form stats. VGC Team Report also supports the Regulation M-A format used for Indianapolis Regionals and the 2026 World Championships.",
  },
  {
    question: "How is VGC Team Report different from PokéPaste or VGC.tools?",
    answer:
      "These tools serve different purposes. PokéPaste shares the raw team paste (six Pokémon, sets, items) — minimal and text-only. VGC.tools is for building a new team from scratch with a community library. Pikalytics analyzes usage stats and meta data. VGC Team Report is for documenting a completed team with full strategy notes, matchup plans, and damage calcs — then sharing it as a polished, readable report. Think of PokéPaste as the Pastebin of Pokémon teams, and VGC Team Report as the write-up you publish after piloting the team.",
  },
  {
    question: "Is VGC Team Report free?",
    answer:
      "Yes — VGC Team Report is completely free to use. No account is required to create or view a team report. Creating a free account lets you save and manage your reports across sessions.",
  },
  {
    question: "What competitive Pokémon formats does VGC Team Report support?",
    answer:
      "VGC Team Report supports Pokémon Champions 2026 (Regulation M-A with Mega Evolution), Pokémon Scarlet and Violet (all Regulation sets including H, I, and earlier), and standard Pokémon Showdown export format for any generation. When new regulation sets launch for Pokémon Champions, the tool is updated to recognize the expanded Pokédex and new mechanics.",
  },
  {
    question: "What are damage calculations, and why do they belong in a team report?",
    answer:
      "Damage calculations (damage calcs or \"calcs\") show the exact range of damage one Pokémon's move deals to another under specific conditions — for example, whether a Pokémon survives a key hit from a top meta threat or OHKOs a target it needs to remove. Including calcs in a team report explains why specific EV spreads were chosen, making the report far more useful to players who want to verify the strategy logic and adapt spreads for their own builds. VGC Team Report includes a built-in damage calc interface so you can add and display calcs without switching tools.",
  },
  {
    question: "What are speed tiers in VGC, and how does VGC Team Report handle them?",
    answer:
      "Speed tiers rank how fast each Pokémon moves in battle, accounting for base Speed stats, EV and IV investment, nature, and speed-control modifiers like Tailwind or Trick Room. In VGC, moving first can decide a game. Team reports typically include a speed tier section showing your team's Speed stats relative to key threats, whether each Pokémon outspeeds relevant benchmarks, and how speed changes under Tailwind (2× Speed) or Trick Room (reversed Speed order). VGC Team Report lets you build a speed tier comparison table and display it inline in the published report.",
  },
  {
    question: "What is an Open Team Sheet (OTS) in VGC, and how does VGC Team Report support it?",
    answer:
      "An Open Team Sheet (OTS) is a document that reveals your six Pokémon, their items, abilities, moves, and Tera types before a match — but omits EV and IV spreads. OTS rules are used at many major VGC tournaments so opponents know the general team composition without seeing exact EV benchmarks. VGC Team Report includes a built-in OTS generator: open any team report and use the 'Visual OTS Sheet' option in the menu to generate a clean, shareable OTS image with all six Pokémon sprites and a QR code linking to your report. You can download the image or copy an OTS-formatted text paste compatible with Pokémon Showdown.",
  },
  {
    question: "What are SP spreads in Pokémon Champions?",
    answer:
      "In the Pokémon Champions format, Stat Points (SP) replace the traditional EV (Effort Value) system. Each Pokémon has 600 total SP to distribute across the six stats (HP, Attack, Defense, Sp. Atk, Sp. Def, Speed), with a maximum of 200 SP per individual stat. SP function similarly to EVs but with different numerical values — 200 SP in a stat is roughly equivalent to 252 EVs in traditional VGC. VGC Team Report automatically detects Champion format teams and displays SP values correctly when you import a team paste.",
  },
  {
    question: "What is Regulation M-A in Pokémon Champions?",
    answer:
      "Regulation M-A is the current competitive ruleset for Pokémon Champions, the official format for the 2026 Play! Pokémon Championship Series. It features a Mega Evolution mechanic — each player can have one Mega Evolution per team, activated by giving a Pokémon a Mega Stone held item. Regulation M-A is used for the 2026 Regional Championships (including Indianapolis Regionals) and the 2026 World Championships. VGC Team Report fully supports Regulation M-A, including auto-detection of Mega Evolutions from team pastes and SP spread display.",
  },
  {
    question: "How do I get my VGC team report discovered by other players?",
    answer:
      "VGC Team Report has a public Explore page where published reports can be browsed and searched by Pokémon, format, or tournament. To get your report discovered: make it public when publishing (vs. link-only), fill in tournament context (event name, placement, and format), share the link on Reddit (r/VGC, r/stunfisk, r/pokemon), Discord community servers, and Twitter/X with relevant hashtags (#VGC2026, #PokémonChampions), and tag the Pokémon in your report so it appears in search results. High-quality public reports featuring top-cut Pokémon are also surfaced on the Champions format page.",
  },
] as const;

// "How to share a VGC team" — wired from .swarm/drafts/r7-content-brief-share-vgc-team-howto.md.
// HowTo schema is the highest-yield AEO win per R7 audit; steps must match the FAQ answer.
const SHARE_VGC_TEAM_HOW_TO_STEPS = [
  {
    name: "Export your team from Pokémon Showdown",
    text: "Open Pokémon Showdown's team builder, select the team you want to share, and click Export. Copy the resulting Showdown-format text, or copy a pokepast.es URL if your team is already uploaded there.",
  },
  {
    name: "Paste your team into VGC Team Report",
    text: "Go to pokemonvgcteamreport.com and paste your Showdown export or pokepast.es link into the input box. The tool automatically parses your six Pokémon, including moves, items, abilities, EVs, IVs, natures, and Tera types.",
  },
  {
    name: "Add matchup notes, damage calcs, and speed tiers",
    text: "Fill in the team overview, per-Pokémon role notes, key damage calculations, and speed tier comparisons. These sections turn a raw paste into a full team report that explains why each build choice was made.",
  },
  {
    name: "Click Share to generate a permanent link",
    text: "Click the Share button in the top navigation. Choose Publish to list the report on the Explore page, or Copy Link for a direct share. Every published report gets a permanent URL at pokemonvgcteamreport.com/s/[id].",
  },
  {
    name: "Embed in Discord or any website",
    text: "Paste the /s/[id] link into Discord to get an automatic rich Open Graph preview, or use the Embed option to copy an iframe snippet for embedding the report in any website, tournament page, or CMS.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "FAQ", url: "https://pokemonvgcteamreport.com/faq" },
        ]}
      />
      <FAQPageJsonLd items={[...FAQ_ITEMS]} />
      <HowToSchema steps={SHARE_VGC_TEAM_HOW_TO_STEPS} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-text-tertiary mb-8" aria-label="Breadcrumb">
          <Link href="/" className="inline-flex min-h-11 items-center hover:text-text-secondary transition-colors">
            Home
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-text-secondary font-medium">FAQ</span>
        </nav>

        {/* Page header */}
        <header className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-2xl">
            Everything you need to know about building, sharing, and discovering competitive
            Pok&eacute;mon VGC team reports.
          </p>
        </header>

        {/* FAQ list */}
        <div className="space-y-0 divide-y divide-border/50">
          {FAQ_ITEMS.map((item, index) => (
            <div key={index} className="py-6 first:pt-0">
              <h2 id={slugify(item.question)} className="text-base sm:text-lg font-semibold text-text-primary mb-3 leading-snug">
                {item.question}
              </h2>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                {item.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 p-5 sm:p-6 rounded-2xl bg-surface border border-border">
          <p className="text-sm font-semibold text-text-primary mb-1">
            Ready to build your team report?
          </p>
          <p className="text-sm text-text-secondary mb-4">
            Paste your team from Pok&eacute;mon Showdown and create a shareable team report in minutes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-bold hover:opacity-90 active:scale-[0.97] transition-all"
            >
              Build a Report
            </Link>
            <Link
              href="/explore"
              className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-xl bg-surface-alt border border-border text-sm font-semibold text-text-primary hover:border-accent/40 active:scale-[0.97] transition-all"
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
