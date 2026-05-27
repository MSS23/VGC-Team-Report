# R7: AEO Optimization Drafts (2026-05-27)
**Status:** DRAFTS ONLY — do not publish, deploy, or submit without explicit user approval

---

## Draft 1: FAQPage JSON-LD for Homepage

Add to `/src/app/page.tsx` or the homepage layout:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is VGC Team Report?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "VGC Team Report is a free tool for building, sharing, and discovering competitive Pokemon VGC team reports. Create detailed breakdowns with matchup plans, damage calcs, speed tiers, and one-click sharing — used by tournament players worldwide."
      }
    },
    {
      "@type": "Question",
      "name": "Is VGC Team Report a PokePaste alternative?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. VGC Team Report goes beyond PokePaste by adding matchup notes, damage calculations, speed tier comparisons, and tournament context to your team paste. Import any Showdown export and enhance it into a full team report you can share via link or embed."
      }
    },
    {
      "@type": "Question",
      "name": "How do I share my VGC team online?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Paste your Pokemon Showdown team export into VGC Team Report, add your matchup notes and calcs, then click Share. You get a permanent link, a Discord-friendly embed, and a downloadable team sheet image — all free, no account required."
      }
    },
    {
      "@type": "Question",
      "name": "Does VGC Team Report support Pokemon Champions 2026?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. VGC Team Report fully supports Pokemon Champions with Mega Evolution, the Regulation M-A format, and all VGC 2026 mechanics. Build and share teams for the current competitive season."
      }
    },
    {
      "@type": "Question",
      "name": "What is the best VGC team builder?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Popular VGC team builders include Pikalytics for usage stats, Pokemon Showdown for battling, and VGC Team Report for creating shareable team reports with matchup analysis. VGC Team Report is the best option when you want to document and share your team strategy, not just the paste."
      }
    }
  ]
}
```

---

## Draft 2: HowTo Schema for Future Guide Page

Target page: `/guides/how-to-share-vgc-team` (to be created)

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Share a VGC Team Online",
  "description": "Step-by-step guide to creating and sharing a competitive Pokemon VGC team report with matchup notes, damage calcs, and speed tiers.",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Build your team in Pokemon Showdown",
      "text": "Use the Teambuilder in Pokemon Showdown to create your VGC team with moves, items, abilities, EVs, and natures."
    },
    {
      "@type": "HowToStep",
      "name": "Export your team paste",
      "text": "Click Export on your team in Showdown to copy the team paste to your clipboard."
    },
    {
      "@type": "HowToStep",
      "name": "Import into VGC Team Report",
      "text": "Go to pokemonvgcteamreport.com and paste your Showdown export. The tool auto-parses all six Pokemon with their sets."
    },
    {
      "@type": "HowToStep",
      "name": "Add matchup notes and calcs",
      "text": "Document your game plan: add matchup notes for common threats, key damage calculations, and speed tier benchmarks."
    },
    {
      "@type": "HowToStep",
      "name": "Share your report",
      "text": "Click Share to get a permanent link, Discord embed, or downloadable team sheet image. Share on Reddit, Twitter, or your team's Discord."
    }
  ]
}
```

---

## Draft 3: Content Page Targets for Category Query Capture

### Page 1: "PokePaste Alternative: Why VGC Team Report Goes Further"
- **Target query:** "pokepaste alternative"
- **URL:** `/guides/pokepaste-alternative`
- **Structure:** Comparison table (PokePaste vs VGC Team Report vs crob.at), feature callouts, embedded FAQPage schema
- **Word count:** 800-1200 words
- **Key differentiator:** VGC Team Report adds matchup analysis layer that pure paste tools lack

### Page 2: "How to Share Your VGC Team: Complete Guide"
- **Target query:** "how to share a VGC team"
- **URL:** `/guides/how-to-share-vgc-team`
- **Structure:** HowTo guide with step screenshots, tool comparison section, FAQ section at bottom
- **Word count:** 1000-1500 words

### Page 3: "Best VGC Team Builders 2026: Tools Compared"
- **Target query:** "best VGC team builder"
- **URL:** `/guides/best-vgc-team-builders`
- **Structure:** Listicle with tool cards, use-case matrix, VGC Team Report positioned for "team documentation & sharing" category
- **Word count:** 1200-1800 words
- **Honest angle:** Don't claim to be #1 at everything — own the "team report/sharing" niche explicitly

### Page 4: "Pokemon Champions VGC 2026: Regulation M-A Guide"
- **Target query:** "VGC 2026 regulation guide"
- **URL:** `/guides/regulation-m-a`
- **Structure:** Format rules, banned/allowed Pokemon, Mega Evolution primer, link to team reports using this format
- **Word count:** 800-1200 words

---

## Draft 4: Backlink Outreach Targets (Priority Order)

| Target | Action | Impact |
|--------|--------|--------|
| Victory Road /resources | Submit tool listing via Discord/Twitter | HIGH — most-cited VGC resource hub |
| DevonCorp tools/resources | Email or Discord DM | HIGH — appears in AI results for how-to queries |
| r/VGC wiki | Request addition to community tools list | MEDIUM — Reddit co-mentions boost AI citation |
| Smogon forums | Post in VGC resources thread | MEDIUM — highest domain authority in niche |
| Bulbapedia external links | Submit to competitive tools section | LOW — slow editorial process, high DA payoff |

---

## Draft 5: applicationCategory Fix

**File:** `/src/app/layout.tsx`

Change:
```
applicationCategory: "GameApplication"
```
To:
```
applicationCategory: "SportsApplication"
```

**Rationale:** schema.org's SportsApplication maps to competitive/esports tools. GameApplication signals casual games to AI crawlers.
