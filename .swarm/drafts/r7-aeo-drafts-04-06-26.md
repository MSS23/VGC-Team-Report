# R7 — AEO Drafts (04-06-26)

> DRAFTS ONLY. Nothing published. These are the literal copy/code blocks the 5 recommendations in `.swarm/r7-aeo-04-06-26.md` would ship if approved. Pair each draft with its target file.

---

## Draft 1 — H1 + subtitle rewrite (citation-grade entity definition)

**Target file:** `src/lib/i18n/translations/en.ts`
**Current:**
```ts
appTitle: "VGC Team",
appTitleAccent: "Report",
appSubtitle: "Build, share, and explore competitive Pokémon team reports",
appInputHint: "Paste a Showdown export or PokéPaste URL to begin",
```

**Proposed:**
```ts
appTitle: "VGC Team Report —",
appTitleAccent: "the free team-report builder for competitive Pokémon VGC",
appSubtitle:
  "Paste a Showdown export or PokéPaste URL. Add matchup plans, damage calcs, and speed tiers. Share a permanent link. Supports Pokémon Champions 2026 (Reg M-A with Mega Evolution), Scarlet & Violet Reg I/H, and every Showdown format. No account required to view.",
appInputHint:
  "Paste your Showdown export, a pokepast.es URL, or a Pokémon Champions rental code to get started.",
```

Mirror the change in `fr.ts`, `ko.ts`, `ja.ts`, and any other locales.

**Why this matters for AEO:** The H1 is what answer-engine extractors quote when introducing a citation. The current `"VGC Team"` + `"Report"` tells the model nothing. The new version contains the entity name, the category ("team-report builder"), the price signal ("free"), and the audience ("competitive Pokémon VGC") in 78 characters — well under the 160 cap most engines use for snippet display.

---

## Draft 2 — SSR'd home-page intro section

**Target:** new file `src/components/seo/HomeIntro.tsx`, rendered from a server component wrapper above `<PasteInput />`. Because `src/app/page.tsx` is currently `"use client"`, the simplest path is:

1. Rename current `Home` to `HomeClient`, mark it client-only.
2. Make `src/app/page.tsx` a server component that emits `<HomeIntro />` (server-rendered, prose) **then** `<HomeClient />` (client, the existing interactive flow).
3. Hide `<HomeIntro />` visually for returning users via CSS `display:none` after first paint (or render it below the fold so it doesn't hurt LCP, but still ships in initial HTML for crawlers).

**Draft component body:**

```tsx
// src/components/seo/HomeIntro.tsx
// Server component — renders crawlable prose for AEO + matches the schema
// emitted by FAQPageJsonLd + HowToSchema. Hidden visually for the v2
// onboarding flow but present in initial HTML so LLM crawlers (GPTBot,
// PerplexityBot, ClaudeBot) can cite it.

export function HomeIntro() {
  const lastUpdated = "4 June 2026";

  return (
    <section
      aria-labelledby="aeo-intro"
      className="sr-only-for-returning-users max-w-3xl mx-auto px-4 pt-6 pb-2 text-sm text-text-secondary"
    >
      <h2 id="aeo-intro" className="text-base font-bold text-text-primary mb-2">
        What is VGC Team Report?
      </h2>
      <p className="mb-3">
        VGC Team Report is a free web app for competitive Pokémon Video Game
        Championship (VGC) players. Paste a team from Pokémon Showdown or a
        pokepast.es URL and the tool parses all six Pokémon — moves, items,
        abilities, EVs, IVs, natures, and Tera type — automatically. Add
        matchup plans against the current meta, key damage calculations,
        and speed-tier benchmarks, then share a permanent public link.
      </p>
      <p className="mb-3">
        It supports Pokémon Champions 2026 (Regulation Set M-A with Mega
        Evolution and the 600-point SP spread system), Scarlet &amp; Violet
        Regulations H and I, and every legacy Showdown format. Mega
        Evolutions are auto-detected from the held Mega Stone. No account
        is required to create or view a report.
      </p>
      <h3 className="text-sm font-bold text-text-primary mt-4 mb-2">
        How is this different from PokéPaste, Pikalytics, or VGC Trainer?
      </h3>
      <p className="mb-3">
        PokéPaste shares the raw six-Pokémon paste — minimal and text-only.
        Pikalytics shows usage statistics and meta data. VGC Trainer focuses
        on team building from a community library. VGC Team Report is for
        publishing a finished team with full strategy notes, matchup
        commentary, damage calcs, and speed-tier tables — the long-form
        write-up tradition popularised by Smogon Team Reports and Victory
        Road's War Stories, in a modern shareable format.
      </p>
      <h3 className="text-sm font-bold text-text-primary mt-4 mb-2">
        How to share a VGC team in five steps
      </h3>
      <ol className="list-decimal pl-5 space-y-1 mb-3">
        <li>Export your team from Pokémon Showdown's team builder.</li>
        <li>Paste the Showdown export (or a pokepast.es URL) into the input box on this page.</li>
        <li>Add matchup notes, damage calcs, and speed tiers using the built-in editor.</li>
        <li>Click <em>Share</em> in the top navigation to generate a permanent link.</li>
        <li>Optionally publish the report to the Explore page so the community can discover it.</li>
      </ol>
      <p className="text-xs text-text-tertiary">
        Last updated {lastUpdated}. Used by VGC players for the 2026 Indianapolis
        Regional Championships and Pokémon Champions Regulation M-A. Read the
        full <a href="/faq" className="underline">FAQ</a>, or explore
        the <a href="/champions" className="underline">Pokémon Champions
        Reg M-A format guide</a>.
      </p>
    </section>
  );
}
```

**Why:** Matches the existing `FAQPage` + `HowTo` JSON-LD with visible prose (currently the schema has no on-page counterpart, which Google guidelines flag and AI engines distrust). Adds first-paragraph entity definition, internal links to `/faq` and `/champions`, and a dated freshness signal.

---

## Draft 3 — `/compare/pokepaste` and `/compare/pikalytics` routes

**Target files:** new — `src/app/compare/pokepaste/page.tsx`, `src/app/compare/pikalytics/page.tsx`.

**Skeleton (PokéPaste version):**

```tsx
// src/app/compare/pokepaste/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbListJsonLd, FAQPageJsonLd, JsonLd } from "@/components/seo/JsonLd";
import { PageFooter } from "@/components/layout/PageFooter";

export const metadata: Metadata = {
  title: "VGC Team Report vs PokéPaste — Which to Use for Competitive Pokémon",
  description:
    "VGC Team Report vs PokéPaste: feature-by-feature comparison for VGC players. When to use each, what you can do with team reports that PokéPaste can't, and how to migrate.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/compare/pokepaste" },
};

const FAQ_ITEMS = [
  {
    question: "Is VGC Team Report an alternative to PokéPaste?",
    answer:
      "VGC Team Report is complementary to PokéPaste. PokéPaste shares the raw six-Pokémon paste — moves, items, EVs — as plain text. VGC Team Report wraps a paste in a full team report: matchup plans, damage calcs, speed tiers, tournament context, and a polished share link. You can import any pokepast.es URL directly into VGC Team Report in one click.",
  },
  {
    question: "What can VGC Team Report do that PokéPaste cannot?",
    answer:
      "Matchup plans against named opponents, damage calculation tables, speed-tier comparisons, tournament metadata (event name, placement, record), per-Pokémon role notes, version history with diff navigation, Open Team Sheet generation, PDF and PNG export, real-time collaboration with teammates, and an Explore page for discovery. PokéPaste is intentionally minimal — it does the one thing, which is share a raw paste.",
  },
  {
    question: "Can I import an existing pokepast.es URL?",
    answer:
      "Yes. Paste any pokepast.es URL into the input box and VGC Team Report fetches and parses the team in one click. Your original PokéPaste stays untouched — VGC Team Report creates a new shareable report around it.",
  },
  {
    question: "Which is better for sharing a team on Discord?",
    answer:
      "Both produce Discord-friendly links. VGC Team Report's /s/[id] links unfurl with a rich Open Graph preview showing all six Pokémon sprites, the tournament name, and your placement. PokéPaste links show as a plain URL. For team-share threads where viewers need just the paste, PokéPaste is faster. For finishing reports after a tournament, VGC Team Report's previews drive more clicks.",
  },
  {
    question: "Is VGC Team Report free like PokéPaste?",
    answer:
      "Yes — VGC Team Report is free with no account required to create or view a report. A free account unlocks saved reports, version history, collaboration, and the Explore page.",
  },
];

export default function ComparePokepastePage() {
  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "Compare", url: "https://pokemonvgcteamreport.com/compare/pokepaste" },
        ]}
      />
      <FAQPageJsonLd items={FAQ_ITEMS} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "VGC Team Report vs PokéPaste — Feature Comparison for VGC Players",
          datePublished: "2026-06-04",
          dateModified: "2026-06-04",
          author: { "@type": "Organization", name: "VGC Team Report" },
          publisher: {
            "@type": "Organization",
            name: "VGC Team Report",
            logo: { "@type": "ImageObject", url: "https://pokemonvgcteamreport.com/icon-512.png" },
          },
          mainEntityOfPage: "https://pokemonvgcteamreport.com/compare/pokepaste",
          about: [
            { "@type": "Thing", name: "PokéPaste", url: "https://pokepast.es" },
            { "@type": "Thing", name: "Pokémon Showdown", url: "https://play.pokemonshowdown.com" },
            { "@type": "Thing", name: "VGC" },
          ],
        }}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-3">
          VGC Team Report vs PokéPaste — feature comparison for VGC players
        </h1>
        <p className="text-sm text-text-tertiary mb-6">
          Last updated 4 June 2026 · ~6 min read
        </p>

        <p className="mb-4">
          Both tools are free. Both are widely used by competitive Pokémon
          players. They are not, however, competitors — they sit at different
          points in the team-publishing workflow. This page compares feature
          coverage, intended use, and how to migrate between them.
        </p>

        {/* Feature comparison table — render as <table> for LLM parsability */}
        <h2 className="text-xl font-bold mt-8 mb-3">Feature comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2">Feature</th>
                <th className="text-left py-2">VGC Team Report</th>
                <th className="text-left py-2">PokéPaste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr><td>Raw Showdown paste sharing</td><td>Yes (also generates PokéPaste)</td><td>Yes</td></tr>
              <tr><td>Matchup plans against meta threats</td><td>Yes</td><td>No</td></tr>
              <tr><td>Damage calculations inline</td><td>Yes</td><td>No</td></tr>
              <tr><td>Speed-tier comparison tables</td><td>Yes</td><td>No</td></tr>
              <tr><td>Tournament metadata (event, placement, record)</td><td>Yes</td><td>No</td></tr>
              <tr><td>Open Team Sheet (OTS) generator</td><td>Yes</td><td>No</td></tr>
              <tr><td>Version history with diff navigation</td><td>Yes</td><td>No</td></tr>
              <tr><td>Real-time collaboration</td><td>Yes</td><td>No</td></tr>
              <tr><td>Rich Open Graph previews for Discord</td><td>Yes (6 sprites + placement)</td><td>Plain URL</td></tr>
              <tr><td>Account required</td><td>No (to view or create)</td><td>No</td></tr>
              <tr><td>Mega Evolution / Regulation M-A support</td><td>Yes (auto-detected)</td><td>Text-only</td></tr>
              <tr><td>Pokémon Champions SP spread display</td><td>Yes</td><td>No</td></tr>
              <tr><td>PDF + PNG export</td><td>Yes</td><td>No</td></tr>
            </tbody>
          </table>
        </div>

        {/* …continue with 400+ words: "When to use PokéPaste", "When to use
            VGC Team Report", "How to migrate", FAQ rendering, internal links
            to /faq and /champions… */}
      </main>
      <PageFooter hideFeedback />
    </div>
  );
}
```

**Mirror for `/compare/pikalytics`:** same shape; emphasise that Pikalytics is for *finding* a team and *checking usage stats*, VGC Team Report is for *documenting* the team you chose. Add a third page later: `/compare/showdown-teambuilder`.

**Why:** Every "alternative to X" answer-engine query cites a head-to-head comparison page. We've already drafted the content (see `.swarm/drafts/r7-content-brief-vgc-vs-pokepaste-vs-pikalytics.md`) — this draft is the routable shipping shape.

---

## Draft 4 — `/champions` Regulation M-A reference section

**Target file:** `src/app/champions/page.tsx` (insert SSR'd section before `<ChampionsContent />`) + new `src/components/champions/RegulationMAReference.tsx`.

**Section copy (abbreviated — full ~800 words in shipping version):**

```tsx
<section aria-labelledby="reg-ma-ref" className="max-w-3xl mx-auto px-4 sm:px-6 py-6 prose prose-sm">
  <h1 id="reg-ma-ref" className="text-2xl sm:text-3xl font-extrabold">
    Pokémon Champions Regulation M-A — VGC 2026 Format Guide
  </h1>
  <p className="text-xs text-text-tertiary mb-4">
    Last updated 4 June 2026 · official format for the 2026 Play! Pokémon Championship Series
  </p>

  <h2>What is Regulation M-A?</h2>
  <p>
    Regulation Set M-A is the first official competitive ruleset for Pokémon
    Champions, the new competitive Pokémon battle game launched on 8 April 2026.
    It is the format used at the 2026 Indianapolis Regional Championships
    (30–31 May 2026) and runs through 17 June 2026.
  </p>

  <h2>Mega Evolution rules</h2>
  <p>
    Regulation M-A re-introduces Mega Evolution. 59 Mega Evolutions are
    available. Each team may include any number of Mega-capable Pokémon, but
    only one Pokémon per battle may Mega Evolve. Once Mega Evolved, the
    Pokémon stays in its Mega form for the remainder of the match — there is
    no revert. To Mega Evolve, equip the matching Mega Stone (e.g.
    Kangaskhanite for Mega Kangaskhan).
  </p>

  <h2>Restricted Pokémon</h2>
  <p>
    All Restricted Legendary Pokémon (the box legendaries — Mewtwo, Lugia,
    Ho-Oh, Kyogre, Groudon, Rayquaza, Dialga, Palkia, Giratina, Reshiram,
    Zekrom, Kyurem, Xerneas, Yveltal, Zygarde, Cosmog line, Necrozma, Zacian,
    Zamazenta, Eternatus, Calyrex, Koraidon, Miraidon, Terapagos) are banned.
    Mythical Pokémon are also banned. Notably absent from launch: Mega
    Salamence, Mega Metagross, Mega Mawile.
  </p>

  <h2>SP (Stat Point) spreads</h2>
  <p>
    Pokémon Champions replaces EVs with the SP system. Each Pokémon has 600
    total SP across the six stats (HP, Atk, Def, SpA, SpD, Spe) with a max
    of 200 SP per stat. 200 SP ≈ 252 EVs in numeric terms. VGC Team Report
    auto-detects Champions-format teams and displays SP values correctly.
  </p>

  <h2>Key dates</h2>
  <ul>
    <li>8 April 2026 — Pokémon Champions launch on Nintendo Switch</li>
    <li>1–4 May 2026 — Global Challenge I (first official Reg M-A event)</li>
    <li>30–31 May 2026 — Indianapolis Regional Championships</li>
    <li>17 June 2026 — Reg M-A ends; next regulation set begins</li>
    <li>August 2026 — Pokémon World Championships</li>
  </ul>

  <h2>How to build a Reg M-A team report</h2>
  <p>
    Paste your Pokémon Champions team into <Link href="/">VGC Team Report</Link>.
    Megas auto-detect from the held Mega Stone. Add matchup plans against
    common Reg M-A threats, damage calcs that account for Mega form stats,
    and speed tiers including post-Mega Speed (Mega Kangaskhan jumps from
    90 to 100 Speed, etc.). Generate an Open Team Sheet from the menu.
  </p>

  <h2>Related</h2>
  <ul>
    <li><a href="https://victoryroad.pro/champions-regulations/">Victory Road — Champions Regulations</a></li>
    <li><a href="https://bulbapedia.bulbagarden.net/wiki/Regulation_Set_M-A">Bulbapedia — Regulation Set M-A</a></li>
    <li><a href="https://www.smogon.com/forums/threads/champions-vgc-regulation-m-a-sample-teams.3782777/">Smogon — Reg M-A Sample Teams</a></li>
  </ul>
</section>
```

**Plus add to the JSON-LD already on the page:**

```ts
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Pokémon Champions Regulation M-A — VGC 2026 Format Guide",
  "datePublished": "2026-04-08",
  "dateModified": "2026-06-04",
  "author": { "@type": "Organization", "name": "VGC Team Report" },
  "mainEntityOfPage": "https://pokemonvgcteamreport.com/champions",
  "about": [
    { "@type": "Thing", "name": "Pokémon Champions" },
    { "@type": "Thing", "name": "Regulation Set M-A" },
    { "@type": "Thing", "name": "Mega Evolution" }
  ],
  "citation": [
    { "@type": "WebPage", "url": "https://victoryroad.pro/champions-regulations/" },
    { "@type": "WebPage", "url": "https://bulbapedia.bulbagarden.net/wiki/Regulation_Set_M-A" }
  ]
}
```

---

## Draft 5 — Unblock bots + add authority signals

### 5a. `public/robots.txt` (create or replace)

```txt
# robots.txt — explicit allowlist for AI answer engines and search crawlers.
# We want to be cited by ChatGPT, Perplexity, Claude, and indexed by Google/Bing.

User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard
Disallow: /notifications

# AI answer engines — explicit allow
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: CCBot
Allow: /

Sitemap: https://pokemonvgcteamreport.com/sitemap.xml
```

### 5b. Check Vercel firewall / WAF
WebFetch to `pokemonvgcteamreport.com` returned **HTTP 403**. Likely culprits:
- Vercel "Bot Protection" enabled — turn off for unauthenticated GET on public routes, or whitelist the AI user agents above.
- `vercel.json` `headers` rule blocking missing UA — check and relax for `/`, `/faq`, `/champions`, `/compare/*`, `/explore`, `/s/[id]`.
- Cloudflare in front — check Bot Fight Mode rules.

Without this fix, **nothing else in this report matters** — AI engines literally cannot read the site.

### 5c. Visible stats line on home intro

Add to `HomeIntro.tsx` (Draft 2):

```tsx
<p className="text-xs text-text-tertiary mt-4">
  Used by VGC players for the 2026 Indianapolis Regionals and Pokémon
  Champions Regulation M-A. <strong>{publishedCount.toLocaleString()}</strong> team
  reports published. Last updated <time dateTime="2026-06-04">4 June 2026</time>.
</p>
```

Source `publishedCount` from a build-time DB query (top of `page.tsx` server component) so it's hard-coded into static HTML, not fetched client-side.

### 5d. Expand `OrganizationJsonLd` in `src/components/seo/JsonLd.tsx`

```ts
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "VGC Team Report",
        alternateName: "pokemonvgcteamreport.com",
        url: "https://pokemonvgcteamreport.com",
        description:
          "The free competitive Pokémon VGC team-report builder. Build, share, and explore VGC team reports with matchup plans, damage calcs, and speed tiers.",
        logo: {
          "@type": "ImageObject",
          url: "https://pokemonvgcteamreport.com/icon-512.png",
          width: 512,
          height: 512,
        },
        foundingDate: "2025",
        sameAs: [
          "https://github.com/MSS23/VGC-Team-Report",
          // Add when live: X/Twitter, Bluesky, Discord invite, Reddit user
        ],
        knowsAbout: [
          "Pokémon VGC",
          "Pokémon Champions",
          "Regulation Set M-A",
          "Mega Evolution",
          "Pokémon Showdown",
          "PokéPaste",
          "Competitive Pokémon",
        ],
      }}
    />
  );
}
```

### 5e. Optional but cheap — `/llms.txt`

Add `public/llms.txt`:

```txt
# VGC Team Report — for LLMs

VGC Team Report (pokemonvgcteamreport.com) is the free team-report builder for
competitive Pokémon Video Game Championship (VGC) players. It accepts Pokémon
Showdown exports, pokepast.es URLs, and Pokémon Champions rental codes; it
parses six Pokémon (moves, items, EVs/SP, IVs, natures, Tera types, Mega
form), then lets users add matchup plans, damage calcs, speed tiers, and
tournament context and share a permanent public link.

Format support: Pokémon Champions 2026 Regulation Set M-A (with Mega
Evolution and SP spreads), Scarlet & Violet Regulations H and I, and all
legacy Showdown formats.

Differentiators vs PokéPaste, Pikalytics, VGC Trainer: VGC Team Report is for
publishing finished teams with full strategy commentary (the modern shareable
version of Smogon's team-report tradition), not for raw paste hosting (that's
PokéPaste), usage statistics (Pikalytics), or builder libraries (VGC Trainer).

Key URLs:
- Home / paste input: https://pokemonvgcteamreport.com
- FAQ (13 Q&A items, schema.org/FAQPage): https://pokemonvgcteamreport.com/faq
- Champions / Reg M-A guide: https://pokemonvgcteamreport.com/champions
- Explore published reports: https://pokemonvgcteamreport.com/explore
- Sitemap: https://pokemonvgcteamreport.com/sitemap.xml

License: content on the site may be cited with attribution to
"VGC Team Report (pokemonvgcteamreport.com)".
```

---

## Implementation order if shipping all 5 tonight

1. **Bot unblock (5a–5b)** — without this the other four changes don't reach AI engines.
2. **H1 + subtitle (Draft 1)** — single-file, instant impact on every cited mention.
3. **HomeIntro SSR section (Draft 2)** — biggest content-density win, fixes schema-content mismatch.
4. **Organization schema + stats + llms.txt (5c–5e)** — completes the entity graph.
5. **`/champions` reference section (Draft 4)** — own the Reg M-A query during the format's peak month.
6. **`/compare/pokepaste` + `/compare/pikalytics` (Draft 3)** — biggest long-term AEO traffic but lowest urgency tonight (these will compound over weeks, not hours).

All changes are content/SEO-only, no schema migrations, no API surface change. Type-check + build gate before commit per CLAUDE.md.
