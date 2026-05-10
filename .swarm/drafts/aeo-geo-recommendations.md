# AEO/GEO Recommendations — VGC Team Report
**Status:** DRAFT — do not post or submit. Internal use only.
**Date:** 2026-05-10
**Purpose:** Actionable recommendations for getting VGC Team Report cited by AI assistants (ChatGPT, Claude, Perplexity) when users ask about VGC team building and sharing tools.

---

## The Problem in One Sentence

VGC Team Report owns its branded query ("VGC team report") but has zero presence in the AI citation ecosystem for category queries ("best VGC team builder", "how to share a VGC team") because it is absent from every authority directory, forum, and roundup that AI models use as training and retrieval sources.

---

## Citation Gap Summary

| Signal type | Competitor status | VGC Team Report status |
|-------------|------------------|----------------------|
| VGCpedia directory listing | Pikalytics, Victory Road, Nimbasa City Post, TrainerTower each have dedicated encyclopedia pages | Absent |
| Victory Road /resources listing | Pikalytics, Showdown, and ~8 other tools listed | Absent |
| Smogon VGC forum thread | PokeSuite has a dedicated [Tool] thread; sample teams threads link tools | Absent |
| Reddit r/VGC co-mentions | Pikalytics, Showdown, Limitless VGC regularly mentioned | No mentions found |
| blog.poketeambuilder.app roundup | Pikalytics, Showdown, Marriland listed | Absent |
| Schema: Organization + sameAs | Not verified for competitors; standard practice | Missing |
| Schema: FAQPage on homepage | Not verified for competitors | Missing on homepage |
| Schema: HowTo | Not verified for competitors | Missing entirely |
| Schema: Article on share pages | Not verified for competitors | Missing |
| Domain age / authority | Pikalytics 8+ yrs, Victory Road 6+ yrs | ~1-2 years |

---

## Recommendation 1: Get Listed on Victory Road /resources
**Priority: HIGHEST**
**Effort: ~30 minutes**

Victory Road (victoryroad.pro/resources) is the most-linked, most-indexed VGC resource hub in the English-speaking community. It appears at position 1 for every "VGC resources" query and is cited by VGCpedia, DevonCorp, Nimbasa City Post, and Twitter. A listing here:

- Creates a high-DA backlink from a domain with 6+ years of VGC authority
- Places VGC Team Report in a co-mention cluster with Pikalytics and Showdown — the exact tools AI citations draw from
- Adds VGC Team Report to the training data corpus AI retrieval engines scrape from this hub

**Action:** Contact Victory Road via Discord or Twitter @VictoryRoadVGC with a tool submission request.

**Pitch framing:** VGC Team Report is a free team sharing and reporting tool — it sits between PokéPaste (paste only) and a full team analysis post. Position it as the "team presentation layer" that complements Pikalytics stats and Showdown building.

**Draft message available:** `.swarm/drafts/r7-aeo-outreach-drafts.md` → Draft 1.

---

## Recommendation 2: Get a VGCpedia Dedicated Page
**Priority: VERY HIGH**
**Effort: ~20 minutes**

VGCpedia (vgcpedia.com) is the VGC encyclopedia. It gives dedicated pages to every established VGC tool and website (Pikalytics at `/website/pikalytics/`, Victory Road at `/website/victoryroad/`, etc.). These pages:

- Are indexed as encyclopedic/authoritative content — exactly the source AI models treat as ground truth
- Appear in searches like "Pikalytics VGC" and "[tool] VGC" — establishing a tool's identity in the AI entity graph
- Create a permanent, crawlable citation that signals "this tool is recognized by the VGC community"

Without a VGCpedia page, AI models have no encyclopedic source to resolve "VGC Team Report" to a tool rather than a genre of Smogon forum posts.

**Action:** Contact VGCpedia via Twitter @VGCpedia or check for a submission form.

**Key info to provide:**
- URL: https://pokemonvgcteamreport.com
- Category: Website / Tool / Team Reports
- Description: Free tool for building and sharing competitive VGC team reports with matchup notes, damage calcs, and speed tiers. Supports Pokémon Champions / Mega Evolution format.

**Draft message available:** `.swarm/drafts/r7-aeo-outreach-drafts.md` → Draft 2.

---

## Recommendation 3: Add Organization + FAQPage Schema to Homepage
**Priority: HIGH**
**Effort: ~2 hours (code change)**

This is the only purely technical action on the list — no outreach required — and it directly signals to AI retrieval engines.

### Organization schema (add to layout.tsx)
Establishes entity identity. AI models use `Organization` + `sameAs` to resolve named entities to their knowledge graph. Without this, "VGC Team Report" is a floating text string with no graph anchor.

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "VGC Team Report",
  "url": "https://pokemonvgcteamreport.com",
  "description": "Free tool for building and sharing competitive Pokémon VGC team reports with matchup notes, damage calcs, and speed tiers.",
  "sameAs": [
    "https://twitter.com/[handle]",
    "https://discord.gg/[invite]"
  ]
}
```

### FAQPage schema (add to homepage)
FAQPage is the #1 schema type for AI answer generation. Questions should match the exact prompts users ask AI assistants:

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
        "text": "VGC Team Report is a free web tool for competitive Pokémon VGC players to build and share detailed team reports. Import your team from Pokémon Showdown or PokéPaste, add matchup notes, damage calculations, and speed tier breakdowns, then share via a public link."
      }
    },
    {
      "@type": "Question",
      "name": "How do I share a VGC team online?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can share a VGC team using VGC Team Report: paste your Pokémon Showdown export, add matchup notes and analysis, then get a shareable link to send in Discord, Twitter, or tournament forums. It creates a richer presentation than a plain PokéPaste."
      }
    },
    {
      "@type": "Question",
      "name": "How is VGC Team Report different from PokéPaste?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "PokéPaste shares a raw Showdown export as text. VGC Team Report builds a full team report with matchup notes, damage calcs, speed tiers, and tournament context — it's the presentation layer on top of your paste, designed for sharing analysis, not just the team list."
      }
    },
    {
      "@type": "Question",
      "name": "Does VGC Team Report support Pokémon Champions and Mega Evolution?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. VGC Team Report supports the current Pokémon Champions format including Mega Evolution Pokémon."
      }
    },
    {
      "@type": "Question",
      "name": "Is VGC Team Report free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. VGC Team Report is completely free to use. No account is required to view shared team reports."
      }
    }
  ]
}
```

---

## Secondary Actions (implement after top 3)

### 4. Post a [Tool] thread on Smogon VGC forum
Model: The PokeSuite thread (`[Tool] PokeSuite: A Team Generator with Smogon Tiers & VGC Filters`) got indexed and appears in VGC tool searches from Smogon. A similar thread establishes Smogon presence — the highest-authority VGC domain.

Draft: `.swarm/drafts/r7-aeo-outreach-drafts.md` → Draft 3.

### 5. Get included in blog.poketeambuilder.app "Best Team Builders" roundup
This article appears at position 2 for "best VGC team builder" queries and is a roundup that AI models cite. Email the author requesting inclusion as a "team reporting / sharing" category entry.

Draft: `.swarm/drafts/r7-aeo-outreach-drafts.md` → Draft 6.

### 6. Add HowTo schema + publish /how-to-write-a-vgc-team-report
A guide page with HowTo schema gets cited in instructional AI answers. Steps: import paste → add matchup notes → add damage calcs → add speed tiers → publish → share link. This page would also rank for long-tail queries AI answers directly.

### 7. Add Article schema to /s/[id] share pages
Currently, public team reports are app state pages — they look like JavaScript app routes to crawlers. Adding `Article` schema with `author`, `datePublished`, and `about` (the team/tournament) makes each shared report an indexable document, not a blank app shell.

### 8. Submit to DevonCorp and Nimbasa City Post resources
Both are actively maintained and appear in "VGC resources" searches. Low-effort outreach.

### 9. Encourage seed usage on Reddit r/VGC
The first genuine community post sharing a real team report via VGC Team Report creates an organic co-mention. Organic Reddit mentions are AI training data. Draft Reddit post in `.swarm/drafts/r7-aeo-outreach-drafts.md` → Draft 5.

### 10. Product Hunt listing
Generates backlinks from a high-DA tech platform, enables `aggregateRating` schema once reviews accumulate. Requires more planning — see `.swarm/drafts/r7-aeo-outreach-drafts.md` → Draft 7.

---

## Effort/Impact Matrix

```
HIGH IMPACT
     |
     |  [1] Victory Road    [2] VGCpedia
     |  [4] Smogon thread   [3] Schema (Org + FAQ)
     |  [5] Builder roundup
     |
     |  [6] HowTo guide     [8] DevonCorp/NCP
     |  [7] Article schema  [9] Reddit seeding
     |
     |                      [10] Product Hunt
LOW  |
     +------------------------------------------
        LOW EFFORT               HIGH EFFORT
```

Actions 1, 2, 4, and 5 are all low-effort, high-impact outreach tasks that can be batched in a single session.
Action 3 is a medium-effort code change with no outreach dependency.

---

## Notes

- Do NOT post or submit anything from this document without explicit user approval.
- The drafts for outreach messages are in `.swarm/drafts/r7-aeo-outreach-drafts.md`.
- Schema code changes should go through tsc + build gate before committing.
- All outreach should come from a genuine community member voice, not a marketing pitch.
