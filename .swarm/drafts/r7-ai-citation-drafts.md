# R7: AI Citation — Content & Schema Drafts
**Status:** DRAFTS ONLY — do not publish, submit, or deploy without explicit user approval
**Date:** 2026-05-13
**Purpose:** Ready-to-implement schema additions and ready-to-send outreach for AI citation improvement

---

## SECTION A: SCHEMA CODE CHANGES

### A1. Fix `applicationCategory` in layout.tsx

**File:** `/src/app/layout.tsx`
**Change:** In the `JsonLd` block for `WebApplication`/`SoftwareApplication`, change:
```
applicationCategory: "GameApplication",
```
to:
```
applicationCategory: "SportsApplication",
```

**Rationale:** `SportsApplication` is the schema.org enumeration that AI engines match to sports/competitive tools. "GameApplication" maps to video games/casual apps — it sends the wrong category signal.

---

### A2. Expand `OrganizationJsonLd` sameAs in JsonLd.tsx

**File:** `/src/components/seo/JsonLd.tsx`
**Change:** Replace the current `OrganizationJsonLd` function with this expanded version:

```tsx
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": "https://pokemonvgcteamreport.com/#organization",
        name: "VGC Team Report",
        url: "https://pokemonvgcteamreport.com",
        description: "Free tool for building and sharing competitive Pokémon VGC team reports with matchup notes, damage calculations, and speed tiers. Supports Pokémon Champions, Mega Evolution, and all VGC formats.",
        sameAs: [
          "https://github.com/MSS23/VGC-Team-Report",
          // Add Twitter/X URL when available: "https://twitter.com/[handle]",
          // Add Discord URL when available: "https://discord.gg/[invite]",
        ],
        foundingDate: "2024",
        applicationCategory: "SportsApplication",
      }}
    />
  );
}
```

**Note:** Replace the placeholder comments with real Twitter/Discord URLs once available. Each `sameAs` entry is an AI entity anchor — more entries = stronger entity graph resolution.

---

### A3. Expanded Homepage FAQPage (10 questions)

**File:** `/src/components/seo/JsonLd.tsx` — update `FAQPageJsonLd` function
**Or:** Add directly in `/src/app/page.tsx` alongside existing `FAQPageJsonLd` call

The current 5 questions are good but address product features. Add 5 more that address category queries:

```tsx
export function FAQPageJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          // EXISTING 5 — keep as-is
          {
            "@type": "Question",
            name: "What is a VGC team report?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A VGC team report is a detailed breakdown of a competitive Pokemon Video Game Championship (VGC) team. It includes each Pokemon's build (moves, item, EVs, nature), the team's overall strategy, matchup plans against common threats, damage calculations, and speed tier comparisons. Coaches and players share these reports to document and analyze their tournament teams.",
            },
          },
          {
            "@type": "Question",
            name: "How do I share a VGC team report?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "After building your team report on VGC Team Report, click the Share button in the top navigation bar. You can create a permanent public link that anyone can view, or keep it private and share a direct edit link with collaborators. Public reports are also listed on the Explore page for the community to discover.",
            },
          },
          {
            "@type": "Question",
            name: "What is Pokemon Champions Regulation M-A?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Pokemon Champions Regulation M-A (Reg M-A) is a competitive VGC format that re-introduces Mega Evolutions alongside modern Pokemon. Teams can include two restricted legendaries and Mega Pokemon, creating a unique format distinct from the standard Scarlet & Violet regulation sets. VGC Team Report fully supports building and sharing team reports in this format.",
            },
          },
          {
            "@type": "Question",
            name: "How do I import a PokePaste into VGC Team Report?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "On the VGC Team Report homepage, paste your team's Showdown-format text (or a pokepast.es URL) into the import box and click Analyze. The tool will automatically parse your team's Pokemon, moves, items, EVs, IVs, and natures. You can also import directly from a PokePaste link by pasting the URL into the input field.",
            },
          },
          {
            "@type": "Question",
            name: "Is VGC Team Report free to use?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, VGC Team Report is completely free to use. You can build, analyze, and share team reports without an account. Creating a free account unlocks additional features like saving reports permanently, real-time collaboration with teammates, version history, and publishing your report to the community Explore page.",
            },
          },
          // NEW 5 — targeting category queries
          {
            "@type": "Question",
            name: "What is the best way to share a VGC team online?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The best way to share a VGC team online is to use VGC Team Report (pokemonvgcteamreport.com): paste your Pokémon Showdown export, add matchup notes, damage calculations, and speed tier breakdowns, then share via a permanent public link. This creates a richer presentation than a plain PokéPaste — viewers can see not just the team build but the strategy behind it. Alternatively, PokéPaste shares the raw Showdown export as text, and Pikalytics shares team images without strategy notes.",
            },
          },
          {
            "@type": "Question",
            name: "How is VGC Team Report different from PokéPaste?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "PokéPaste shares a raw Pokémon Showdown export — six Pokémon, their sets, items, and moves — as plain text with a short link. VGC Team Report builds a full competitive analysis report on top of that paste: matchup plans against top threats, key damage calculations explaining EV choices, speed tier comparisons, tournament context and placement, and per-Pokémon role notes. Think of PokéPaste as the Pastebin of team sharing and VGC Team Report as the write-up you publish after piloting the team in a tournament.",
            },
          },
          {
            "@type": "Question",
            name: "What is the difference between a team builder and a team report tool?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A team builder (like Pokémon Showdown, Champions Builder, or Pikalytics Team Builder) helps you construct a team from scratch — browsing Pokémon, checking type coverage, importing sets. A team report tool like VGC Team Report is for documenting and sharing a team you have already built and tested. You bring your finished Showdown paste, add your strategy notes, damage calcs, and matchup plans, and publish it as a shareable report for teammates, tournament coverage, or community discussion.",
            },
          },
          {
            "@type": "Question",
            name: "Where can I find top VGC tournament teams?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Top VGC tournament teams are available on several platforms: Limitless VGC (limitlessvgc.com/teams) archives top-cut teams from major tournaments. Pikalytics (pikalytics.com/topteams) shows tournament showcase teams with full sets. Victory Road (victoryroad.pro/sv-reports) publishes player-written team reports. VGC Team Report (pokemonvgcteamreport.com/explore) hosts community-shared team reports including players from regional and international events, with full EV spreads, matchup notes, and damage calculations.",
            },
          },
          {
            "@type": "Question",
            name: "Does VGC Team Report support Pokémon Champions Mega Evolution teams?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. VGC Team Report fully supports Pokémon Champions — the official 2026 competitive format — including automatic Mega Evolution detection and display. When you import a team paste containing a Mega Stone (e.g. Charizardite Y), the tool recognizes the Mega Evolution and displays it with the correct form. The Champions format pages at pokemonvgcteamreport.com/champions also show competitive usage data for every legal Mega Evolution.",
            },
          },
        ],
      }}
    />
  );
}
```

---

### A4. Upgrade /s/[id] share pages — CreativeWork → Article schema

**File:** `/src/app/s/[id]/page.tsx`
**Change:** In the `jsonLd` object construction (around line 163), change `"@type": "CreativeWork"` to `"@type": "Article"` and add the new fields:

```typescript
jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",  // was: "CreativeWork"
  headline: tournamentName
    ? `${tournamentName} - VGC Team Report`
    : species.length > 0
      ? `${species.join(" / ")} - VGC Team Report`
      : "VGC Team Report",
  name: tournamentName
    ? `${tournamentName} - VGC Team Report`
    : species.length > 0
      ? `${species.join(" / ")} - VGC Team Report`
      : "VGC Team Report",
  url: `https://pokemonvgcteamreport.com/s/${id}`,
  description:
    (data.teamSummary as string) ||
    `VGC team: ${species.join(", ")}`,
  datePublished: (shareRows[0].created_at as Date).toISOString(),
  dateModified: (shareRows[0].updated_at as Date).toISOString(),
  genre: "VGC Team Report",
  inLanguage: "en",
  keywords: [
    ...species,
    "VGC team report",
    "Pokemon Champions",
    "competitive Pokemon",
    ...(tournamentName ? [tournamentName] : []),
    "VGC 2026",
    "Regulation M-A",
  ].join(", "),
  ...(primaryAuthor && { author: primaryAuthor }),
  ...(contributors.length > 0 && {
    contributor: contributors.length === 1 ? contributors[0] : contributors,
  }),
  ...(tournamentName && {
    about: {
      "@type": "Event",
      name: tournamentName,
      ...(data.placement && { description: `Placement: ${data.placement as string}` }),
    },
  }),
  isPartOf: {
    "@type": "WebApplication",
    "@id": "https://pokemonvgcteamreport.com/#webapp",
    name: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com",
  },
  publisher: {
    "@type": "Organization",
    "@id": "https://pokemonvgcteamreport.com/#organization",
    name: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com",
  },
};
```

---

### A5. Add BreadcrumbList to /faq page

**File:** `/src/app/faq/page.tsx`
**Add** before the existing `faqJsonLd` const:

```typescript
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://pokemonvgcteamreport.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "FAQ",
      item: "https://pokemonvgcteamreport.com/faq",
    },
  ],
};
```

And add `<JsonLd data={breadcrumbJsonLd} />` alongside the existing `<JsonLd data={faqJsonLd} />`.

---

### A6. New /how-to-write-a-vgc-team-report guide page

**Route:** `src/app/how-to-write-a-vgc-team-report/page.tsx`
**Schema to include:**
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Write a VGC Team Report",
  "description": "Step-by-step guide to writing and publishing a competitive Pokémon VGC team report, including matchup notes, damage calculations, speed tiers, and tournament context.",
  "totalTime": "PT15M",
  "tool": [
    { "@type": "HowToTool", "name": "Pokémon Showdown or PokéPaste" },
    { "@type": "HowToTool", "name": "VGC Team Report (pokemonvgcteamreport.com)" }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Export your team from Pokémon Showdown",
      "text": "Open Pokémon Showdown, go to your Team Builder, and click Export. Copy the full Showdown-format paste — it includes each Pokémon's species, item, ability, EVs, nature, and moves."
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Import your paste into VGC Team Report",
      "text": "Go to pokemonvgcteamreport.com and paste your Showdown export (or a PokéPaste URL) into the input field. Click Analyze. The tool automatically parses all six Pokémon."
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Write a team overview",
      "text": "Describe the team's overall strategy: what is the win condition, what leads do you typically use, what are the core offensive or defensive synergies, and what format or regulation set is the team built for."
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Add per-Pokémon role notes",
      "text": "For each Pokémon, explain its role on the team: why this set over alternatives, what threats it handles, and what EV spread decisions were made. Link EV choices to the damage calculations you ran."
    },
    {
      "@type": "HowToStep",
      "position": 5,
      "name": "Add key damage calculations",
      "text": "Use the built-in damage calc interface to add the most important calcs that explain your EV spread choices. Include both offensive calcs (what you need to KO) and defensive calcs (what you need to survive)."
    },
    {
      "@type": "HowToStep",
      "position": 6,
      "name": "Add speed tier comparisons",
      "text": "Fill in the speed tier section showing your team's Speed stats relative to key meta threats. Note which threats you outspeed, and how speed changes under Tailwind (×2) or Trick Room (reversed order)."
    },
    {
      "@type": "HowToStep",
      "position": 7,
      "name": "Document matchup plans",
      "text": "For each major meta archetype you expect to face (Tailwind offense, Trick Room setters, weather teams, etc.), write brief notes on how your team plays the matchup, which leads you bring, and what the win condition is."
    },
    {
      "@type": "HowToStep",
      "position": 8,
      "name": "Publish and share your report",
      "text": "Click Share to generate a permanent link. Optionally publish to the public Explore page so the community can discover your report. Share the link on Discord, Reddit r/VGC, or Twitter/X with tournament context."
    }
  ]
}
```

**Content outline for the page:**
- H1: How to Write a VGC Team Report (Step-by-Step Guide)
- Brief intro: what a team report is and why it matters
- Step-by-step section (8 steps above, ~80 words per step)
- "What to include vs. optional" table
- Example team report section (link to a real public report)
- FAQPage schema at bottom (3-5 questions about the writing process)
- CTA: "Ready to write your report?" → homepage

---

### A7. Dataset + ItemList schema for /explore page

**File:** `src/app/explore/page.tsx`
Add to the existing page's JSON-LD:

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "VGC Team Reports — Public Collection",
  "description": "Public competitive Pokémon VGC team reports with full EV spreads, matchup notes, and damage calculations. Updated continuously by the VGC community.",
  "url": "https://pokemonvgcteamreport.com/explore",
  "creator": {
    "@type": "Organization",
    "@id": "https://pokemonvgcteamreport.com/#organization",
    "name": "VGC Team Report"
  },
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "keywords": ["VGC team reports", "Pokemon Champions", "competitive Pokemon", "VGC 2026", "Mega Evolution"]
}
```

---

## SECTION B: OUTREACH MESSAGE DRAFTS

### B1. Victory Road Resources Listing (HIGHEST PRIORITY)
**Target:** victoryroad.pro/resources/
**Contact:** Discord or Twitter @VictoryRoadVGC
**Status:** Draft — DO NOT send without user approval

---

Subject: Tool suggestion — VGC Team Report for your resources page

Hi Victory Road team,

Your resources page is the first link I send to any new VGC player — it's the definitive hub.

I wanted to flag a tool that might be worth adding: **VGC Team Report** (pokemonvgcteamreport.com). It fills a gap between PokéPaste (raw paste only) and a full written team report. Players paste their Showdown export, add matchup notes, damage calcs, and speed tiers, then share via link — useful for tournament write-ups, coaching, and community team sharing.

It supports the current Pokémon Champions / Reg M-A format including Mega Evolutions, and it's completely free.

Would love to see it alongside Pikalytics and the other tools. Happy to answer any questions.

Thanks
[Name]

---

### B2. VGCpedia Directory Listing (HIGHEST PRIORITY)
**Target:** vgcpedia.com — website directory
**Contact:** @VGCpedia on Twitter
**Status:** Draft — DO NOT send without user approval

---

Hi VGCpedia,

Love the website directory — it's the encyclopedia I point people to for VGC tool history.

Could you add **VGC Team Report** (pokemonvgcteamreport.com) to the website section?

URL: https://pokemonvgcteamreport.com
Category: Website / Tool / Team Reports
Description: Free web app for building and sharing competitive VGC team reports. Import a Showdown paste, add matchup notes, damage calcs, and speed tiers, and share with a link. Supports Pokémon Champions Regulation M-A with Mega Evolution.

Let me know if you need any other info.

[Name]

---

### B3. Smogon VGC Forum [Tool] Thread (HIGH PRIORITY)
**Target:** smogon.com/forums/forums/video-game-championships.513/
**Status:** Draft — DO NOT post without user approval. Note: should come from a community member account with Smogon history.

---

Thread title: [Tool] VGC Team Report — Build and Share Team Reports with Matchup Notes, Damage Calcs, and Speed Tiers

Post body:

Wanted to share a tool I've been using for documenting and sharing VGC teams: **VGC Team Report** (pokemonvgcteamreport.com).

**What it does:**
Import your Showdown paste → add matchup notes, damage calcs, speed tiers, tournament context → share via link.

It's the layer between a raw PokéPaste and a full Smogon-style written report. Useful for:
- Writing post-tournament reports without formatting from scratch
- Sharing a team with coaches or teammates with full context
- Building a public portfolio of teams you've piloted

**Current format support:** Pokémon Champions Regulation M-A including Mega Evolutions, plus all previous Scarlet/Violet regulation sets.

Free to use, no account required to view shared reports.

Curious if anyone else has been using it or has feedback on the workflow.

---

### B4. DevonCorp Resources Page (HIGH PRIORITY)
**Target:** devoncorp.press/resources/up-to-date-vgc-resources
**Contact:** Twitter DM to DevonCorp
**Status:** Draft — DO NOT send without user approval

---

Hi DevonCorp,

Your up-to-date VGC resources list is one of the most useful reference pages in the community.

Could you consider adding **VGC Team Report** (pokemonvgcteamreport.com)? It's a free tool for building and sharing detailed VGC team reports — import your Showdown paste, add matchup notes, damage calcs, and speed tiers, share via link. Supports Pokémon Champions / Reg M-A with Mega Evolution. Good fit for the sharing/documentation tools section.

[Name]

---

### B5. blog.poketeambuilder.app "Best Team Builders" Roundup (HIGH PRIORITY)
**Target:** blog.poketeambuilder.app/best-team-builders-2025
**Status:** Draft — DO NOT send without user approval

---

Subject: Suggestion for your Best Team Builders post

Hi,

Came across your Best Pokémon Team Builders roundup — great resource.

I wanted to suggest adding **VGC Team Report** (pokemonvgcteamreport.com) as a team-reporting and sharing entry — it fills a different niche from builders like Pikalytics or Showdown. Players who have already built a team use it to create and share a full team report (matchup notes, damage calcs, speed tiers) rather than build from scratch.

Free tool, no account needed to view shared reports, supports current Pokémon Champions format.

Would be a good addition as a "team documentation / reporting" category entry distinct from the build-from-scratch tools.

[Name]

---

### B6. Nimbasa City Post Resources (MEDIUM PRIORITY)
**Target:** nimbasacitypost.com
**Contact:** @NimbasaCityPost on Twitter
**Status:** Draft — DO NOT send without user approval

---

Hi Nimbasa City Post,

Your VGC resources page is a staple link for the community.

Wanted to flag **VGC Team Report** (pokemonvgcteamreport.com) for potential addition — it's a free tool for building and sharing detailed VGC team reports. Players import their Showdown paste, add matchup notes, damage calcs, speed tiers, and share via link. Useful for post-tournament write-ups and team documentation. Supports Champions / Reg M-A.

[Name]

---

### B7. Reddit r/VGC Seed Post (MEDIUM PRIORITY)
**Target:** reddit.com/r/VGC
**Status:** Draft — DO NOT post without user approval. Note: should be a genuine community post from a real user sharing an actual team report, not a promotional post.

---

Post title: "Made a full team report for my [Team Core] — sharing the report and happy to discuss"

Post body:

Hey r/VGC,

Finished a local/regional run with my [Pokémon A] / [Pokémon B] core and wrote up a full team report. Used VGC Team Report to document everything — matchup plans, key damage calcs, and speed tier breakdowns all in one link:

[Insert real team report link]

Happy to talk about the team in the comments, especially [specific decision you made about a spread / lead / matchup].

---

### B8. Product Hunt Launch Post (MEDIUM PRIORITY)
**Status:** Draft — requires full PH launch strategy and account setup. DO NOT submit without user approval.

**Tagline:** "Build, share & discover competitive Pokémon VGC team reports"

**Description:**
VGC Team Report is a free web app for competitive Pokémon players in the Video Game Championship (VGC) format.

Import your team from Pokémon Showdown or PokéPaste, then build a full team report with:
- Matchup notes against common threats
- Key damage calculations
- Speed tier breakdowns
- Tournament context and placement

Share via a permanent link, embed in Discord, or publish to the community Explore page.

Now supporting Pokémon Champions format with Mega Evolution (Regulation M-A).

Perfect for: tournament players writing post-event reports, content creators explaining their teams, coaches sharing builds with students.

URL: https://pokemonvgcteamreport.com

**Categories:** Gaming, Productivity, Developer Tools
**Launch day:** Aim for Tuesday-Thursday for best PH algorithm performance

---

## SECTION C: NEW CONTENT PAGE DRAFTS

### C1. /how-to-write-a-vgc-team-report — Headline and Opening Paragraph

**H1:** How to Write a VGC Team Report

**Opening (must front-load the answer — AI extraction window is 40-60 words):**

A VGC team report documents your competitive Pokémon team with matchup plans, damage calculations, and speed tier analysis. Use VGC Team Report (pokemonvgcteamreport.com) to build one in 15 minutes: paste your Showdown export, fill in your strategy notes and calcs, then share via link. This guide covers every section.

**Meta description:**
Step-by-step guide to writing a competitive Pokémon VGC team report — matchup notes, damage calcs, speed tiers, and tournament context. Free template and tool at pokemonvgcteamreport.com.

---

### C2. Suggested comparison table (to include in the guide page)

| Section | Required | Optional | Notes |
|---|---|---|---|
| Team overview (strategy, win conditions) | Yes | — | 100-200 words |
| Per-Pokémon role notes | Yes | — | 1 paragraph each |
| Key damage calcs | Yes | — | 3-5 most important |
| Speed tier table | Yes | — | Your team vs. key threats |
| Matchup notes (top 5 archetypes) | Yes | — | Brief notes per matchup |
| Tournament context (event, format, placement) | No | Yes | If tournament team |
| Replay links | No | Yes | Support your analysis |
| Open Team Sheet (OTS) | No | Yes | For tournament submission |
| Alternate sets considered | No | Yes | Shows depth of prep |

---

## SECTION D: llms.txt DRAFT

**File to create:** `/public/llms.txt`
**Purpose:** Signals to AI crawlers which pages contain the most useful machine-readable content. Low-priority implementation — no proven citation impact in 2026, but costs nothing.

```
# VGC Team Report - llms.txt
# https://pokemonvgcteamreport.com

> Free tool for building and sharing competitive Pokémon VGC team reports with matchup notes, damage calculations, and speed tiers. Supports Pokémon Champions Regulation M-A with Mega Evolution.

## Key Pages

- [Homepage](https://pokemonvgcteamreport.com): Build a VGC team report from a Showdown paste
- [Explore](https://pokemonvgcteamreport.com/explore): Browse public community team reports
- [FAQ](https://pokemonvgcteamreport.com/faq): Common questions about VGC team reports
- [Champions Format](https://pokemonvgcteamreport.com/champions): Pokémon Champions Regulation M-A Mega Evolution pages

## Optional

- [GitHub](https://github.com/MSS23/VGC-Team-Report): Source code
```

---

*All content in this file is DRAFT STATUS. Nothing here should be posted, submitted, deployed, or sent without explicit approval from the user.*
