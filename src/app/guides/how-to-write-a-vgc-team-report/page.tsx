import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbListJsonLd, HowToSchema } from "@/components/seo/JsonLd";
import { PageFooter } from "@/components/layout/PageFooter";

const CANONICAL = "https://pokemonvgcteamreport.com/guides/how-to-write-a-vgc-team-report";

export const metadata: Metadata = {
  title: "How to Write a VGC Team Report — Step-by-Step Guide (2026)",
  description:
    "Learn how to write a VGC team report: team paste, lead matrix, win conditions, EV justifications, tough matchups, and replay links. Free template included.",
  keywords: [
    "how to write a VGC team report",
    "VGC team report template",
    "VGC team report guide",
    "VGC lead matrix",
    "VGC win conditions",
    "EV spread justification",
    "VGC matchup notes",
    "Pokemon team report example",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "How to Write a VGC Team Report — Step-by-Step Guide (2026)",
    description:
      "Learn how to write a VGC team report: team paste, lead matrix, win conditions, EV justifications, tough matchups, and replay links. Free template included.",
    url: CANONICAL,
    type: "article",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Write a VGC Team Report — Step-by-Step Guide (2026)",
    description:
      "Learn how to write a VGC team report: team paste, lead matrix, win conditions, EV justifications, tough matchups, and replay links. Free template included.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
};

const HOW_TO_WRITE_STEPS = [
  {
    name: "Start with your team paste",
    text:
      "Export your six Pokémon from Pokémon Showdown or pokepast.es and paste the Showdown-format text into VGC Team Report. The paste is the foundation: moves, items, abilities, EVs/SP, IVs, natures, and Tera types are parsed automatically so you can focus on the write-up.",
  },
  {
    name: "Build the Lead Matrix",
    text:
      "Add a lead matrix that shows which two-Pokémon leads you bring into the most common opposing archetypes. This is the single most useful section of any modern VGC report — it tells the reader how the team is actually piloted turn one.",
  },
  {
    name: "Identify Win Conditions",
    text:
      "For each common matchup, write one to three clear win conditions. A win condition is a concrete game state, not a feeling — for example, 'Tera Steel Rillaboom in front of Incineroar' or 'Trick Room with Indeedee + Ursaluna up'.",
  },
  {
    name: "Document EV Justifications",
    text:
      "Justify the EV (or SP) spread for each Pokémon in one or two sentences: the benchmark it hits, the calc it survives, and the speed tier it sits at. A reader should never have to guess why a spread is 244 HP / 252 SpA / 12 Spe.",
  },
  {
    name: "List Tough Matchups",
    text:
      "Be honest about the team's bad matchups. Name the archetypes, explain the structural reason they are hard, and describe what you switch to or how you lose gracefully. This builds trust and helps the reader prep for the same problems.",
  },
  {
    name: "Attach replay links",
    text:
      "Add Pokémon Showdown or in-game replay links for the key matchups in the report. A replay is worth a thousand words of theory and is what separates a strong report from a paste with notes.",
  },
  {
    name: "Share the report",
    text:
      "Click Share to generate a permanent public link, post it on the Explore page, or copy an embed for Discord and tournament writeups. Anyone can view the report — no account required.",
  },
];

export default function HowToWriteAVgcTeamReportPage() {
  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "Guides", url: "https://pokemonvgcteamreport.com/guides" },
          {
            name: "How to Write a VGC Team Report",
            url: CANONICAL,
          },
        ]}
      />
      <HowToSchema steps={HOW_TO_WRITE_STEPS} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-xs text-text-tertiary mb-8"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-text-secondary transition-colors">
            Home
          </Link>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-text-tertiary">Guides</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-text-secondary font-medium">
            How to Write a VGC Team Report
          </span>
        </nav>

        {/* Page header */}
        <header className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mb-3">
            How to Write a VGC Team Report
          </h1>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-2xl">
            A step-by-step guide for documenting a competitive Pok&eacute;mon VGC team —
            paste, lead matrix, win conditions, EV justifications, tough matchups, and
            replays. Works for any current Regulation (M-A, H, I) and any format the
            Play! Pok&eacute;mon series throws at you.
          </p>
        </header>

        {/* Intro */}
        <section className="prose-block mb-10">
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-4">
            A VGC team report is the write-up you publish after piloting a team —
            usually after a Regional, an online qualifier, or a long ladder run. It
            explains not just <em>what</em> the team is, but <em>why</em> it was built
            that way and <em>how</em> it actually wins games. A good report is the
            difference between &ldquo;cool paste&rdquo; and &ldquo;I&apos;m taking this
            to my next event.&rdquo;
          </p>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-4">
            The format below is the one most top players converge on. It works for
            beginners writing their first report and for veterans publishing a
            tournament-winning team. Follow the seven steps in order, fill out each
            section honestly, and you&apos;ll have a report readers actually trust.
          </p>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Every step below maps to a section in the VGC Team Report builder, so you
            can write as you go — no copy-pasting between tools.
          </p>
        </section>

        {/* Step 1 */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-3">
            1. Start with your team paste
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-3">
            The paste is the skeleton of the entire report. Export your team from
            Pok&eacute;mon Showdown (Team Builder &rarr; Export), or copy a
            pokepast.es URL, and drop it into the{" "}
            <Link href="/" className="text-accent underline underline-offset-2 hover:no-underline">
              paste input on the home page
            </Link>
            . The tool parses all six Pok&eacute;mon, their moves, items, abilities,
            EV (or SP) spreads, IVs, natures, and Tera types automatically.
          </p>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Before moving on, double-check the parsed team matches what you actually
            played. A wrong item or missing Tera type makes every later section
            misleading.
          </p>
        </section>

        {/* Step 2 */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-3">
            2. Build the Lead Matrix
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-3">
            The lead matrix is the most-skimmed section of any modern VGC report. It
            answers the only question a reader has when they first open your write-up:
            <em> what do you actually lead?</em>
          </p>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-3">
            List the common opposing archetypes in the format (restricted pairs,
            weather cores, Trick Room, etc.) down one column, and your two-Pok&eacute;mon
            lead and back line down the other. Keep it tight — five to eight rows is
            plenty. If a matchup has a coin-flip lead, say so.
          </p>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            A good lead matrix is what separates a report someone bookmarks from one
            they close after the paste.
          </p>
        </section>

        {/* Step 3 */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-3">
            3. Identify Win Conditions
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-3">
            A win condition is a concrete game state that, once reached, wins the
            game. Not &ldquo;play well&rdquo; — something you can point at on a replay.
            For each common matchup, write one to three win conditions.
          </p>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-3">
            Examples of strong win conditions:
          </p>
          <ol className="list-decimal list-inside text-sm sm:text-base text-text-secondary leading-relaxed space-y-2 mb-3 pl-2">
            <li>
              Tera Water Urshifu in front of opposing Incineroar, then click Surging
              Strikes through Wide Guard.
            </li>
            <li>
              Get Trick Room up turn one with Indeedee + Ursaluna, sweep with
              Headlong Rush + Facade.
            </li>
            <li>
              Pivot to Amoonguss + Rillaboom, stall out Tailwind with Rage Powder and
              Grassy Glide chip.
            </li>
          </ol>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            If you can&apos;t state a win condition in one sentence, the matchup
            probably belongs in &ldquo;tough matchups&rdquo; instead.
          </p>
        </section>

        {/* Step 4 */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-3">
            4. Document EV Justifications
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-3">
            For each of the six Pok&eacute;mon, write one to two sentences justifying
            the EV (or SP, for Pok&eacute;mon Champions) spread. A reader should never
            have to reverse-engineer your spread from a calc.
          </p>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-3">
            A good EV justification covers three things:
          </p>
          <ol className="list-decimal list-inside text-sm sm:text-base text-text-secondary leading-relaxed space-y-2 mb-3 pl-2">
            <li>
              <strong>The benchmark.</strong> What stat number you&apos;re hitting and
              why (e.g. 191 Speed to creep neutral-natured base 100s).
            </li>
            <li>
              <strong>The calc.</strong> One key damage roll the spread is designed
              around — surviving a specific hit, or guaranteeing a specific OHKO.
            </li>
            <li>
              <strong>The trade-off.</strong> What you gave up to get there.
            </li>
          </ol>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Use the built-in damage calc panel to drop the exact rolls inline — it
            saves the reader from opening a calculator in another tab.
          </p>
        </section>

        {/* Step 5 */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-3">
            5. List Tough Matchups
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-3">
            Every team has bad matchups. Pretending you don&apos;t is the fastest way
            to lose reader trust. List the archetypes that give the team trouble,
            explain the <em>structural</em> reason (it&apos;s never just &ldquo;they
            beat me&rdquo;), and write what you do about it.
          </p>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-3">
            For each tough matchup, cover:
          </p>
          <ol className="list-decimal list-inside text-sm sm:text-base text-text-secondary leading-relaxed space-y-2 mb-3 pl-2">
            <li>What you switch to when the bad matchup reveals itself.</li>
            <li>Which Pok&eacute;mon you&apos;re willing to sack to stabilize.</li>
            <li>The line that turns a 30/70 into a 45/55 — the &ldquo;lose
            gracefully&rdquo; plan.</li>
          </ol>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Honest tough-matchup sections are the single biggest signal that a report
            was written by someone who actually piloted the team at an event.
          </p>
        </section>

        {/* Step 6 */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-3">
            6. Attach replay links
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-3">
            Replays are the receipt. They prove the team works against real opponents,
            and they let the reader see your lines play out — not just read your
            description of them.
          </p>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Add at least one Pok&eacute;mon Showdown or in-game replay per major
            matchup in the report. Label each replay with the matchup (e.g.
            &ldquo;vs Calyrex-Shadow + Incineroar&rdquo;) and a one-line takeaway.
            Generic &ldquo;here&apos;s a win&rdquo; replays add noise; targeted ones
            add evidence.
          </p>
        </section>

        {/* Step 7 */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-3">
            7. Share the report
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-3">
            Once the report is written, click the Share button in the top nav. You
            can publish it to the public{" "}
            <Link href="/explore" className="text-accent underline underline-offset-2 hover:no-underline">
              Explore page
            </Link>
            {" "}so the community can discover it, or copy a direct link from the
            share modal to drop in Discord, Reddit, or a tournament writeup.
          </p>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-3">
            Every published report lives at a permanent{" "}
            <code className="px-1.5 py-0.5 rounded bg-surface-alt text-text-primary text-xs">
              /s/&#91;id&#93;
            </code>{" "}
            URL with Open Graph previews wired up for Discord and Twitter/X, so the
            first-impression card looks polished anywhere you paste it.
          </p>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            If your event uses Open Team Sheets, use the Visual OTS Sheet option from
            the report menu to generate a tournament-ready image with a QR code back
            to the full report.
          </p>
        </section>

        {/* Closing CTA */}
        <div className="mt-12 p-5 sm:p-6 rounded-2xl bg-surface border border-border">
          <p className="text-sm font-semibold text-text-primary mb-1">
            Ready to write your team report?
          </p>
          <p className="text-sm text-text-secondary mb-4">
            Paste your team into the builder and work through the seven steps — most
            reports take 30 to 60 minutes to write and last the whole season.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Start a Team Report
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-alt border border-border text-sm font-semibold text-text-primary hover:border-accent/40 transition-colors"
            >
              Browse Example Reports
            </Link>
          </div>
        </div>
      </main>

      <PageFooter hideFeedback />
    </div>
  );
}
