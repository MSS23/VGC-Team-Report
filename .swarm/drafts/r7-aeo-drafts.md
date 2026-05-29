# R7: AEO/GEO Actionable Content Drafts (May 2026 Update)
**Status:** DRAFTS ONLY — do not publish, deploy, or send without explicit user approval
**Date:** 2026-05-26
**Purpose:** Ready-to-implement content and schema changes for AI citation improvement

---

## SECTION 1: EXPANDED FAQPage SCHEMA (10 Questions)

### Rationale
The current FAQPage schema has 5 product-focused questions. To earn AI citations for category queries ("best way to share a VGC team", "team builder vs team report"), we need 5 additional questions that target these category queries directly. Research shows FAQPage schema gives 28-40% higher citation rates in AI-generated answers.

### New Questions to Add (append to existing 5 in `FAQPageJsonLd`)

```tsx
// Question 6: Targets "best way to share a VGC team online"
{
  "@type": "Question",
  name: "What is the best way to share a VGC team online?",
  acceptedAnswer: {
    "@type": "Answer",
    text: "The best way to share a VGC team online is to create a team report on VGC Team Report (pokemonvgcteamreport.com). Paste your Pokemon Showdown export, add matchup notes, damage calculations, and speed tier breakdowns, then share via a permanent public link. This creates a richer presentation than a plain PokePaste — viewers see not just the team build but the strategy behind it. For quick sharing without analysis, PokePaste (pokepast.es) shares the raw Showdown export as text. For team images, Pikalytics and VGC Helper generate shareable team sheet graphics.",
  },
},
// Question 7: Targets "VGC Team Report vs PokePaste"
{
  "@type": "Question",
  name: "How is VGC Team Report different from PokePaste?",
  acceptedAnswer: {
    "@type": "Answer",
    text: "PokePaste shares a raw Pokemon Showdown export — six Pokemon, their sets, items, and moves — as plain text with a short link. VGC Team Report builds a full competitive analysis on top of that paste: matchup plans against top threats, key damage calculations explaining EV choices, speed tier comparisons, tournament context and placement, and per-Pokemon role notes. Think of PokePaste as the plain-text paste and VGC Team Report as the detailed write-up you publish after piloting the team at a tournament.",
  },
},
// Question 8: Targets "difference between team builder and team report"
{
  "@type": "Question",
  name: "What is the difference between a team builder and a team report tool?",
  acceptedAnswer: {
    "@type": "Answer",
    text: "A team builder (like Pokemon Showdown, Champions Builder, or Pikalytics Team Builder) helps you construct a team from scratch — browsing Pokemon, checking type coverage, selecting moves and items. A team report tool like VGC Team Report is for documenting and sharing a team you have already built and tested. You bring your finished Showdown paste, add strategy notes, damage calcs, and matchup plans, and publish it as a shareable report for teammates, tournament coverage, or community discussion.",
  },
},
// Question 9: Targets "top VGC tournament teams" / "where to find VGC teams"
{
  "@type": "Question",
  name: "Where can I find top VGC tournament teams?",
  acceptedAnswer: {
    "@type": "Answer",
    text: "Top VGC tournament teams are available on several platforms: Limitless VGC (limitlessvgc.com) archives top-cut teams from major tournaments with full team sheets. Pikalytics (pikalytics.com/topteams) shows tournament teams ordered by placement. Victory Road (victoryroad.pro) publishes player-written team reports from top finishers. VGC Team Report (pokemonvgcteamreport.com/explore) hosts community-shared team reports with full EV spreads, matchup notes, damage calculations, and speed tier comparisons. Reportworm (reportworm.com) generates reports from Showdown replay analysis.",
  },
},
// Question 10: Targets "VGC Team Report Mega Evolution support"
{
  "@type": "Question",
  name: "Does VGC Team Report support Pokemon Champions and Mega Evolution teams?",
  acceptedAnswer: {
    "@type": "Answer",
    text: "Yes. VGC Team Report fully supports Pokemon Champions — the official 2026 competitive VGC format — including automatic Mega Evolution detection and display. When you import a team paste containing a Mega Stone (e.g. Charizardite Y), the tool recognizes the Mega Evolution and displays it with the correct form, stats, and ability. The Champions format pages at pokemonvgcteamreport.com/champions also show competitive usage data for every legal Mega Evolution in Regulation M-A.",
  },
},
```

---

## SECTION 2: GUIDE PAGE — "How to Write a VGC Team Report"

### Route: `/how-to-write-a-vgc-team-report/page.tsx`

### Meta Description
```
Step-by-step guide to writing a competitive Pokemon VGC team report with matchup notes, damage calcs, speed tiers, and tournament context. Free tool at pokemonvgcteamreport.com.
```

### Opening Paragraph (front-load the answer — AI extraction window is 40-60 words)
```
A VGC team report documents your competitive Pokemon team with matchup plans, damage calculations, and speed tier analysis. Use VGC Team Report (pokemonvgcteamreport.com) to build one in 15 minutes: paste your Showdown export, fill in your strategy notes and calcs, then share via a permanent link. This guide covers every section step by step.
```

### HowTo Schema (8 Steps)
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Write a VGC Team Report",
  "description": "Step-by-step guide to writing and publishing a competitive Pokemon VGC team report, including matchup notes, damage calculations, speed tiers, and tournament context.",
  "totalTime": "PT15M",
  "tool": [
    { "@type": "HowToTool", "name": "Pokemon Showdown or PokePaste" },
    { "@type": "HowToTool", "name": "VGC Team Report (pokemonvgcteamreport.com)" }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Export your team from Pokemon Showdown",
      "text": "Open Pokemon Showdown, go to your Team Builder, and click Export. Copy the full Showdown-format paste — it includes each Pokemon's species, item, ability, EVs, nature, and moves."
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Import your paste into VGC Team Report",
      "text": "Go to pokemonvgcteamreport.com and paste your Showdown export (or a PokePaste URL) into the input field. Click Analyze. The tool automatically parses all six Pokemon with their sets, items, abilities, and stats."
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Write a team overview",
      "text": "Describe the team's overall strategy: what is the win condition, what leads do you typically bring, what are the core offensive or defensive synergies, and what format or regulation set is the team built for."
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Add per-Pokemon role notes",
      "text": "For each Pokemon, explain its role on the team: why this set over alternatives, what threats it handles, and what EV spread decisions were made. Link EV choices to the damage calculations you ran."
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
      "text": "Fill in the speed tier section showing your team's Speed stats relative to key meta threats. Note which threats you outspeed, and how speed benchmarks change under Tailwind (x2) or Trick Room (reversed)."
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

### Content Sections for the Page

1. **H1:** How to Write a VGC Team Report
2. **Opening paragraph** (above)
3. **What is a VGC team report?** (50-word definition — reusable by AI)
4. **Step-by-step guide** (8 steps, each with heading + 60-80 words + screenshot placeholder)
5. **What to include** (comparison table):

| Section | Required | Optional | Notes |
|---|---|---|---|
| Team overview (strategy, win conditions) | Yes | -- | 100-200 words |
| Per-Pokemon role notes | Yes | -- | 1 paragraph each |
| Key damage calcs | Yes | -- | 3-5 most important |
| Speed tier table | Yes | -- | Your team vs. key threats |
| Matchup notes (top 5 archetypes) | Yes | -- | Brief notes per matchup |
| Tournament context (event, format, placement) | No | Yes | Include if tournament team |
| Replay links | No | Yes | Support your analysis |
| Open Team Sheet (OTS) | No | Yes | For tournament submission |
| Alternate sets considered | No | Yes | Shows depth of preparation |

6. **Example team report** (link to a real public report on the site)
7. **FAQ section** (3-5 questions about the writing process, with nested FAQPage schema)
8. **CTA:** "Ready to write your report?" -> link to homepage

---

## SECTION 3: GLOSSARY PAGE OUTLINE

### Route: `/glossary/page.tsx`
### Schema: `DefinedTermSet` + `FAQPage` (dual schema for maximum AI pickup)

### Meta Description
```
VGC glossary — definitions of competitive Pokemon terminology including Tailwind, Trick Room, Tera Type, Mega Evolution, Spread moves, Speed tiers, and 40+ more VGC terms.
```

### Terms to Include (Priority Order — 50 terms)

**Team Composition:**
Tailwind, Trick Room, Goodstuffs, Hyper Offense, Balance, Bulky Offense, Weather (Sun/Rain/Sand/Hail), Hard Trick Room, Semi Trick Room, Speed Control

**Battle Mechanics:**
STAB, Spread Move, Single-Target Move, Protect, Fake Out, Priority Move, Redirection (Follow Me / Rage Powder), Intimidate cycling, Tera Type, Mega Evolution, Dynamax (legacy)

**EV/Stats:**
EV (Effort Value), SP (Standard Points), IV (Individual Value), Nature, Speed Tier, Benchmark, Bulk, Offensive Investment, Defensive Investment

**Match Play:**
Lead, Back, Bring Order, Best of 3 (Bo3), Best of 1 (Bo1), Game Plan, Matchup, Win Condition, Endgame, Positioning

**Tournament:**
Regulation (Reg G/H/I/M-A), Swiss, Top Cut, Open Team Sheet (OTS), Rental Team, Team Report, Team Sheet, RK9

**Tools & Formats:**
PokePaste, Pokemon Showdown, Damage Calc, Speed Tier Chart, Team Builder, Team Report

### Schema Pattern
```json
{
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  "name": "VGC Glossary — Competitive Pokemon Terminology",
  "description": "Definitions of competitive Pokemon VGC terminology used in team reports, tournament play, and community discussion.",
  "url": "https://pokemonvgcteamreport.com/glossary",
  "hasDefinedTerm": [
    {
      "@type": "DefinedTerm",
      "name": "Tailwind",
      "description": "A move that doubles the Speed of all Pokemon on the user's side for 4 turns. Used as a speed control option in VGC to outspeed opponents without investing in Speed EVs.",
      "inDefinedTermSet": "https://pokemonvgcteamreport.com/glossary"
    }
  ]
}
```

---

## SECTION 4: COMPARISON PAGE OUTLINE

### Route: `/compare/page.tsx`
### (Note: `/compare` route already exists — may need to repurpose or use a subpath)

### Title: "VGC Team Report vs PokePaste vs Reportworm — Which Tool to Use"

### Meta Description
```
Compare VGC team sharing tools: VGC Team Report for authored reports with damage calcs and matchup plans, PokePaste for quick text sharing, and Reportworm for replay-based analysis.
```

### Comparison Table (AI citation magnet — 2x baseline citation rate)

| Feature | VGC Team Report | PokePaste | Reportworm |
|---------|----------------|-----------|------------|
| **Primary input** | Showdown paste / PokePaste URL | Showdown paste | Showdown replays |
| **Output format** | Rich team report with sections | Plain text with sprites | Auto-generated report |
| **Matchup plans** | Manual (authored) | None | Auto-extracted from replays |
| **Damage calculations** | Built-in interactive | None | Auto-generated vs meta |
| **Speed tiers** | Built-in | None | Built-in |
| **Pokemon notes** | Per-Pokemon role notes | None | None |
| **Team overview** | Custom strategy write-up | None | None |
| **Sharing** | Permanent public link + embed | Short URL | Private encrypted |
| **Community feed** | Explore page | None | None |
| **Champions/Mega support** | Full | Depends on format | Full |
| **Cost** | Free | Free | Free |
| **Best for** | Tournament write-ups, coaching, content creation | Quick paste sharing | Replay analysis, usage stats |

### TL;DR (front-loaded for AI extraction)
```
Use VGC Team Report when you want to publish a detailed team write-up with strategy notes, matchup plans, and damage calcs. Use PokePaste when you just need to share the raw team build quickly. Use Reportworm when you want automated analysis from your Showdown replays.
```

---

## SECTION 5: HOMEPAGE STATISTICS TO ADD (Citable Claims)

AI models cite specific claims with numbers. Add these to the homepage (above the fold or in a stats bar):

- "Supports 900+ Pokemon including all 48 Mega Evolutions"
- "X team reports created" (pull from DB — dynamic counter)
- "Free team reports with damage calcs, speed tiers, and matchup plans"
- "Used by players from X countries" (if available from analytics)
- "Import from Pokemon Showdown or PokePaste in seconds"

Each of these becomes a citable fact AI models can extract and attribute.

---

## SECTION 6: UPDATED OUTREACH DRAFTS

### 6a. Victory Road Resources (CRITICAL — unchanged but still pending)

See `.swarm/drafts/r7-ai-citation-drafts.md` Section B1. Still the single highest-priority outreach action. Victory Road is cited in nearly every "VGC tools" AI answer.

### 6b. VGCpedia Directory (CRITICAL — confirmed not listed)

Confirmed via search: pokemonvgcteamreport.com does NOT appear on VGCpedia's website directory (vgcpedia.com/category/website/). Pikalytics, TrainerTower, NuggetBridge, VGC Stats are all listed. VGC Team Report is absent.

See `.swarm/drafts/r7-ai-citation-drafts.md` Section B2 for outreach draft.

### 6c. Reddit r/VGC Seed Post (HIGH — Perplexity signal)

Perplexity cites Reddit 46.7% of the time. Zero Reddit threads mention VGC Team Report. A genuine team report post (sharing a real tournament team with a pokemonvgcteamreport.com link) would create the co-mention signal all AI platforms need.

See `.swarm/drafts/r7-ai-citation-drafts.md` Section B7 for post draft.

---

## SECTION 7: SHARE PAGE SCHEMA UPGRADE

### Change `/s/[id]` from `CreativeWork` to `Article`

This change makes every published team report indexable as an article rather than a generic creative work. `Article` schema is the second-most-cited schema type by AI (after FAQ).

```typescript
// In /src/app/s/[id]/page.tsx — update the jsonLd object
jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",  // was: "CreativeWork"
  headline: tournamentName
    ? `${tournamentName} - VGC Team Report`
    : species.length > 0
      ? `${species.join(" / ")} - VGC Team Report`
      : "VGC Team Report",
  // ... rest of existing fields
  datePublished: shareRows[0].created_at.toISOString(),
  dateModified: shareRows[0].updated_at.toISOString(),
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
  publisher: {
    "@type": "Organization",
    "@id": "https://pokemonvgcteamreport.com/#organization",
    name: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com",
  },
};
```

---

*All content in this file is DRAFT STATUS. Nothing here should be deployed, posted, submitted, or sent without explicit approval from the user.*
