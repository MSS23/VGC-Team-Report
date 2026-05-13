# SEO Content Drafts — VGC Team Report
**Generated:** 2026-05-13
**Source audit:** `.swarm/r6-seo-audit.md`

These are DRAFTS ONLY. Do not implement without explicit user approval.

---

## DRAFT 1: Homepage title + OG title fix
**File:** `/src/app/layout.tsx`
**Target keywords:** Pokemon Champions, 2026, VGC team report

```ts
// Current:
title: {
  default: "VGC Team Report — Build, Share & Analyse Your Pokémon VGC Team",
  template: "%s | VGC Team Report",
},
openGraph: {
  title: "VGC Team Report — Build, Share & Discover Pokemon Teams",
  ...
},

// PROPOSED:
title: {
  default: "VGC Team Report — Pokemon Champions Team Reports 2026",
  template: "%s | VGC Team Report",
},
openGraph: {
  title: "VGC Team Report — Build, Share & Discover Pokemon Champions Teams",
  ...
},
```

---

## DRAFT 2: Champions pokemon pages — fix "EV spreads" → "SP spreads"
**File:** `/src/app/champions/[pokemon]/page.tsx`
**Target keywords:** SP spread, stat points, Pokemon Champions Regulation M-A

```ts
// Current title:
const title = `${mega.displayName} VGC Guide — EV Spreads, Movesets & Teams`;

// PROPOSED title:
const title = `${mega.displayName} VGC Guide — SP Spreads, Movesets & Teams`;

// Current description:
const description = `Complete ${mega.displayName} VGC guide for Pokemon Champions Regulation M-A: best EV spreads, movesets, damage calcs, and top competitive teams. ${mega.ability} with ${mega.megaStone}.`;

// PROPOSED description:
const description = `Complete ${mega.displayName} VGC guide for Pokemon Champions Regulation M-A: best SP spreads, movesets, damage calcs, and top competitive teams. ${mega.ability} with ${mega.megaStone}.`;

// Current keywords include:
`${mega.displayName} EV spread`,
`${mega.baseName} EV spread`,

// PROPOSED — replace both with:
`${mega.displayName} SP spread`,
`${mega.displayName} stat points`,
`${mega.baseName} SP spread`,
`${mega.baseName} stat points`,

// Current FAQ answer referencing EV spreads:
a: `VGC Team Report hosts ${teams.length} public competitive team${teams.length === 1 ? "" : "s"} featuring ${mega.displayName}, with full EV spreads, movesets, and matchup notes.`

// PROPOSED:
a: `VGC Team Report hosts ${teams.length} public competitive team${teams.length === 1 ? "" : "s"} featuring ${mega.displayName}, with full SP spreads, movesets, and matchup notes.`
```

---

## DRAFT 3: `/explore` page metadata update
**File:** `/src/app/explore/page.tsx`
**Target keywords:** Pokemon Champions VGC team reports 2026, Regulation M-A

```ts
// Current:
title: "Browse VGC Team Reports | Top Pokémon VGC Teams",
description: "Browse the best VGC team reports from top competitive players. Find Pokemon Champions team builds, open team sheets (OTS), matchup notes, and EV spreads for VGC 2026 Regulation M-A. Search by Pokémon, tournament, or creator.",

// PROPOSED:
title: "Browse Pokemon Champions VGC Team Reports 2026 | Regulation M-A",
description: "Browse the best Pokemon Champions VGC 2026 team reports from top competitive players. Find Regulation M-A team builds, open team sheets (OTS), matchup notes, and SP spreads. Search by Pokémon, tournament, or creator.",
```

---

## DRAFT 4: `/dashboard` — add noindex
**File:** `/src/app/dashboard/page.tsx`

```ts
// Current:
export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your VGC team reports, saved teams, and account.",
};

// PROPOSED:
export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your VGC team reports, saved teams, and account.",
  robots: {
    index: false,
    follow: false,
  },
};
```

---

## DRAFT 5: `/embed/[id]` — add noindex
**File:** `/src/app/embed/[id]/page.tsx`

```ts
// Add to EmbedPage (as exported metadata, or inline in the <head>):
// Since this page renders its own <html>, add a meta tag directly:

<head>
  ...
  <meta name="robots" content="noindex, nofollow" />
  ...
</head>
```

---

## DRAFT 6: Add `ItemList` JSON-LD to `/champions` page
**File:** `/src/app/champions/page.tsx`
**Target:** "best Mega Pokemon VGC 2026", "all Mega Pokemon Regulation M-A"

```ts
// Import at top:
import { MEGA_POKEMON_LIST } from "@/lib/data/mega-pokemon";
import { JsonLd } from "@/components/seo/JsonLd";

// Inside ChampionsPage():
<JsonLd
  data={{
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Legal Mega Pokémon — VGC 2026 Regulation M-A",
    "description": "All 59 Mega Pokémon legal in Pokemon Champions Regulation M-A, the VGC format for the 2026 Play! Pokémon Championship Series.",
    "url": "https://pokemonvgcteamreport.com/champions",
    "itemListElement": MEGA_POKEMON_LIST.map((m, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": m.displayName,
      "url": `https://pokemonvgcteamreport.com/champions/${m.slug}`,
    })),
  }}
/>
```

---

## DRAFT 7: Add `SportsEvent` JSON-LD to `/tournaments` page
**File:** `/src/app/tournaments/page.tsx`
**Target:** "Indianapolis Regionals 2026", "Pokemon Worlds 2026 teams", "VGC 2026 tournament results"

```ts
const UPCOMING_EVENTS = [
  {
    name: "2026 Indianapolis Pokémon VGC Regional Championships",
    startDate: "2026-05-29",
    endDate: "2026-05-31",
    location: "Indianapolis, IN, USA",
    format: "Regulation M-A",
    url: "https://pokemonvgcteamreport.com/tournaments",
  },
  {
    name: "2026 Pokémon World Championships",
    startDate: "2026-08-28",
    endDate: "2026-08-30",
    location: "San Francisco, CA, USA",
    format: "Regulation M-A",
    url: "https://pokemonvgcteamreport.com/tournaments",
  },
];

<JsonLd
  data={{
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": UPCOMING_EVENTS.map((event, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "SportsEvent",
        "name": event.name,
        "startDate": event.startDate,
        "endDate": event.endDate,
        "sport": "Pokemon VGC",
        "location": {
          "@type": "Place",
          "name": event.location,
        },
        "organizer": {
          "@type": "Organization",
          "name": "Play! Pokémon",
          "url": "https://www.pokemon.com/us/play-pokemon",
        },
        "url": event.url,
        "description": `Top team reports from the ${event.name}. Format: ${event.format}.`,
      },
    })),
  }}
/>
```

---

## DRAFT 8: New FAQ items for SP/stat points (for `/faq` page)
**File:** `/src/app/faq/page.tsx` and `/src/components/seo/JsonLd.tsx`
**Target:** "what are SP spreads Pokemon Champions", "EV spreads vs stat points"

```ts
// Add to FAQ_ITEMS array in /src/app/faq/page.tsx:
{
  question: "What are SP spreads in Pokémon Champions?",
  answer:
    "In Pokémon Champions, EV (Effort Value) training is replaced by Stat Points (SP). Each Pokémon has 66 SP to distribute freely across six stats (HP, Attack, Defense, Special Attack, Special Defense, Speed), with a maximum of 32 SP per stat. 'SP spread' is the Champions equivalent of an EV spread — it defines how a competitive Pokémon's stat points are allocated to hit specific benchmarks. VGC Team Report lets you document and share SP spread choices in your team report alongside matchup reasoning.",
},
{
  question: "How do I use VGC Team Report for Pokémon Champions teams?",
  answer:
    "VGC Team Report fully supports Pokémon Champions. Export your Regulation M-A team from Pokémon Showdown (which supports the Champions format) or paste your team directly into VGC Team Report's import field. Mega Evolution is automatically detected and displayed. You can document your SP spreads, matchup plans, damage calcs, and speed tier comparisons for the Pokémon Champions format, then share your report with a single link.",
},
{
  question: "Does VGC Team Report support the Pokémon Champions SP and VP economy?",
  answer:
    "VGC Team Report is a team reporting and sharing tool, not a game client — so it doesn't manage your in-game SP (Stat Points) or VP (Victory Points) directly. However, you can document your SP allocations in your team report's notes and EV/SP spread section when sharing your competitive build.",
},
```

---

## DRAFT 9: New page content outline — `/guides/how-to-write-a-vgc-team-report`
**Type:** Static SSG guide page
**Target keywords:** "how to write a VGC team report", "VGC team report template", "competitive Pokemon team report guide"
**Structured data:** HowTo + Article + FAQPage

### Page content outline:

```
Title: How to Write a VGC Team Report — Complete Guide for Pokemon Champions 2026

H1: How to Write a VGC Team Report

Intro paragraph (~150 words):
A VGC team report is more than a paste — it's the document that explains *why* your team works. 
Top players use them to share knowledge, document tournament performances, and help others 
learn competitive strategy. This guide walks through every section of a strong VGC team report.

H2: What Goes in a VGC Team Report?
(8 sections with explanations)

1. Team Overview / Summary
   - 2-4 sentences explaining the team's strategy and win condition
   - The "elevator pitch" for your team

2. Pokémon Roles
   - Each of the 6 Pokémon with: SP spread, moveset, item, ability
   - Role on the team (e.g. "sun setter", "speed control", "late-game cleaner")
   - Brief notes on why each choice was made

3. Core Combinations
   - 2-3 key synergies (e.g. "Torkoal + Mega Charizard Y in sun")
   - Why these Pokémon work together

4. Matchup Plans
   - Top 5-8 meta threats
   - Your lead choice and game plan vs each
   - What to watch out for (e.g. "if they have Intimidate + Fake Out, lead differently")

5. Key Damage Calculations
   - 5-10 calcs explaining EV/SP benchmarks
   - Format: "252+ SpA Mega Charizard Y Fire Blast vs 4 HP / 0 SpD Sneasler in sun: X-Y damage"

6. Speed Tiers
   - Table of your team's Speed stats
   - Key speed benchmarks in the meta you're targeting

7. Tournament Context
   - Event name, format, placement, record
   - Any specific decisions made for that tournament's meta

8. What Would You Change?
   - Honest assessment of weaknesses
   - Alternative options you considered

H2: VGC Team Report Template (link to VGC Team Report builder)

H2: Examples of Strong VGC Team Reports
(Link to 3-4 featured public reports on Explore)

H2: Frequently Asked Questions
(FAQPage JSON-LD: "how long should a team report be", "do I need tournament results to publish a report", "what is an OTS vs a team report")

CTA: Build your team report in 5 minutes →
```

---

## DRAFT 10: New page content outline — `/regulation-m-a`
**Type:** Static SSG format guide
**Target keywords:** "Regulation M-A VGC guide", "Pokemon Champions Regulation M-A", "Regulation M-A format explained"
**Structured data:** Article + FAQPage + BreadcrumbList

### Page content outline:

```
Title: Pokemon Champions Regulation M-A — VGC 2026 Format Guide

H1: Regulation M-A — The Pokemon Champions VGC Format for 2026

H2: What is Regulation M-A?
- Pokemon Champions launched April 8, 2026
- Reg M-A is the first official format — used for Global Challenge, Indianapolis Regionals, Worlds 2026
- All Legendary and Restricted Pokemon banned
- Mega Evolution returns: 59 legal Mega forms via Omni Ring
- SP system replaces EVs; IVs removed entirely
- Doubles format: bring 6, pick 4

H2: Key Rules
- Banned: Legendary, Paradox, Restricted Pokemon
- Mega Evolution: one per team per battle via Omni Ring
- SP: 66 total, max 32 per stat
- Team size: 6 Pokemon, pick 4

H2: Legal Mega Pokemon (full list with links to /champions/[pokemon])
(ItemList JSON-LD here too)

H2: Top Meta Pokemon
(Brief summary, link to /explore for team reports)

H2: Tournament Schedule
- Global Challenge: May 1-4, 2026
- Indianapolis Regionals: May 29-31, 2026
- VGC World Championships: Aug 28-30, 2026, San Francisco

H2: Building a Regulation M-A Team
(Link to /guides/how-to-write-a-vgc-team-report)

H2: Frequently Asked Questions
(FAQPage JSON-LD: "is Regulation M-A the same as VGC 2026?", "can you use Mewtwo in Reg M-A?", "how many Mega Pokemon can you have on a team?")
```

---

## DRAFT 11: `/speed-tiers` page — highest ROI new content
**Type:** Static SSG data page (can be generated from `MEGA_POKEMON_LIST` + `pokemon.ts`)
**Target keywords:** "VGC speed tiers 2026", "Pokemon Champions speed tiers", "Regulation M-A speed tier calculator", "Mega Pokemon speed stats"

### Page content outline:

```
Title: Pokemon Champions VGC Speed Tiers — Regulation M-A 2026

H1: Regulation M-A Speed Tiers — Pokemon Champions VGC 2026

Intro: Speed determines move order in VGC doubles battles. This page lists the base Speed 
stats of every legal Mega Pokémon in Regulation M-A, plus key benchmarks at 0, +4, 
+8, +16, +32 SP investment, and Tailwind/Trick Room conditions.

H2: Key Speed Benchmarks in Regulation M-A
(Table: benchmark Speed values by common meta Pokemon with notes)

H2: All Mega Pokemon Speed Stats (sorted descending)
(Table: Display Name | Base Speed | Speed at 0 SP | Speed at 32 SP | Notes)
(Link each row to /champions/[slug])

H2: Tailwind Speed Tiers
(Same table but values doubled)

H2: Trick Room Speed Tiers  
(Table of slowest-to-fastest inversion)

H2: FAQ
- "What is a speed tier in VGC?" 
- "What is the fastest Mega Pokemon in Reg M-A?"
- "How does Tailwind affect speed tiers?"
```

Note: Speed data can be sourced from `src/lib/data/pokemon.ts` (baseStats.spe) combined with `MEGA_POKEMON_LIST`. This page would be ~90% data-driven with minimal editorial content.

---

## DRAFT 12: `/compare` page — add sitemap entry + improve metadata
**File:** `/src/app/compare/page.tsx` and `/src/app/sitemap.ts`

```ts
// Current description mentions "EV spreads" — update to SP context:
description: "Compare two VGC team reports side by side — see differences in Pokémon, movesets, items, and SP spreads for Pokemon Champions 2026.",

// Also add to sitemap.ts staticPages:
{ url: `${BASE}/compare`, changeFrequency: "monthly", priority: 0.4, lastModified: now },
```

---

*End of drafts. All changes require explicit user approval before implementation.*
