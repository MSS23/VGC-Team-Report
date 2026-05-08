# FAQ Page Draft — VGC Team Report
**Status:** DRAFT — do not publish without explicit user approval
**Target page:** /faq
**Purpose:** AEO/GEO citation asset — answers categorical user queries that AI assistants receive; include FAQPage JSON-LD on publish
**Date drafted:** 2026-05-07

---

## Page Metadata (for implementation)

```
title: "VGC Team Report FAQ — Common Questions Answered"
description: "Answers to the most common questions about VGC Team Report: how to share a Pokémon VGC team, what a team report is, format support, and more."
canonicalUrl: /faq
schema: FAQPage (JSON-LD — see bottom of this file)
```

---

## Page Heading

# Frequently Asked Questions

Everything you need to know about building, sharing, and discovering competitive Pokémon VGC team reports.

---

## Q&A Content (10 Questions)

---

### Q1: What is VGC Team Report?

**VGC Team Report** is a free web tool for competitive Pokémon players. It lets you build a detailed team report — paste your team from Pokémon Showdown or PokéPaste, add matchup notes, key damage calculations, speed tier breakdowns, and tournament context, then share it with a single link.

Whether you're presenting a team after a Regional Championship, coaching a student, or just documenting a ladder build you're proud of, VGC Team Report gives your team the write-up it deserves.

---

### Q2: What is a VGC team report?

A **VGC team report** is a structured document that explains not just what a competitive team is, but *why* it was built that way. A good team report covers:

- The six Pokémon, their movesets, items, and EV spreads
- The core strategy and win conditions
- Matchup notes (how the team handles top threats in the meta)
- Key damage calculations that explain EV spread choices
- Speed tier comparisons — who outspeeds whom under what conditions
- Tournament context: the format, event, and placement

Team reports are a long-standing tradition in competitive Pokémon, originally popularized on Smogon and platforms like Victory Road, where top players share their teams and strategy after major events. VGC Team Report provides a dedicated tool to format and share them online.

---

### Q3: How do I share a VGC team using VGC Team Report?

Sharing a team takes under five minutes:

1. **Export your team** from Pokémon Showdown (team builder → Export) or copy a PokéPaste link
2. **Paste the export** into VGC Team Report — the tool automatically parses your six Pokémon, movesets, items, and abilities
3. **Add your report content** — matchup notes, damage calcs, speed tiers, and a team overview
4. **Publish** — click Share to generate a permanent public link
5. **Share anywhere** — paste the link in Discord, Twitter/X, Reddit, or at a tournament table

Anyone with the link can view your report without needing an account.

---

### Q4: Does VGC Team Report support Pokémon Champions and Mega Evolution?

Yes. VGC Team Report fully supports **Pokémon Champions** — the official competitive format for the 2026 Play! Pokémon Championship Series — including **Mega Evolution** detection and display.

When you import a Pokémon Champions team, Mega Evolutions are automatically recognized and displayed with their Mega form stats. The tool also supports the Regulation M-A format used for Indianapolis Regionals and the 2026 World Championships.

---

### Q5: How is VGC Team Report different from PokéPaste or VGC.tools?

Great question — these tools serve different purposes:

| Tool | Purpose |
|------|---------|
| **PokéPaste** | Share the raw team paste (six Pokémon, sets, items) — minimal, text-only |
| **VGC.tools** | Build a new team from scratch with a community library |
| **Pikalytics** | Analyze usage stats and meta data |
| **VGC Team Report** | Document a *completed* team with full strategy notes, matchup plans, and damage calcs — then share as a polished, readable report |

Think of PokéPaste as the Pastebin of Pokémon teams, and VGC Team Report as the write-up you publish *after* piloting the team.

---

### Q6: Is VGC Team Report free?

Yes — VGC Team Report is completely free to use. No account is required to create or view a team report. Creating a free account lets you save and manage your reports across sessions.

---

### Q7: What competitive formats does VGC Team Report support?

VGC Team Report supports:
- **Pokémon Champions** (2026 format, Regulation M-A with Mega Evolution)
- **Pokémon Scarlet & Violet** (all Regulation sets: H, I, and earlier)
- Standard Pokémon Showdown export format (importable from any format)

When new regulation sets launch for Pokémon Champions, the tool is updated to recognize the expanded Pokédex and new mechanics.

---

### Q8: What are damage calculations, and why do they belong in a team report?

**Damage calculations** (damage calcs or "calcs") show the exact range of damage one Pokémon's move deals to another under specific conditions. For example:

> *Urshifu-S Wicked Blow vs. 252 HP Incineroar: 89–105% (guaranteed OHKO after Stealth Rock)*

Damage calcs explain *why* a player chose a specific EV spread. They answer: "Does my Pokémon survive the key hit from the top meta threat? Does it OHKO the target I need to remove?"

Including calcs in a team report makes it far more useful to the community — readers can verify the strategy logic and adapt spreads for their own builds. VGC Team Report includes a built-in damage calc interface so you can add and display calcs without switching tools.

---

### Q9: What are speed tiers in VGC, and how does VGC Team Report handle them?

**Speed tiers** refer to the ordered ranking of how fast each Pokémon moves in battle, taking into account base Speed stats, EV/IV investment, nature, and speed-control modifiers like Tailwind or Trick Room.

In VGC, the Speed stat is critical — a Pokémon moving first can change the outcome of a game. Team reports typically include a speed tier section showing:
- Your team's Speed stats relative to key threats
- Whether each Pokémon outspeeds relevant benchmarks under normal conditions
- How speed changes under Tailwind (2x Speed) or Trick Room (reversed Speed order)

VGC Team Report lets you build a speed tier comparison table for your team and display it inline in the published report.

---

### Q10: How do I get my team report discovered by other players?

VGC Team Report has a public **Explore** page where published reports can be browsed and searched by Pokémon, format, or tournament. To get your report discovered:

1. **Make it public** when publishing (vs. link-only)
2. **Fill in tournament context** — event name, placement, and format
3. **Share the link** on Reddit (r/VGC, r/stunfisk, r/pokemon), Discord community servers, and Twitter/X with relevant hashtags (#VGC2026, #PokémonChampions)
4. **Tag the Pokémon** in your report so it appears in search results when players look for teams featuring those mons

High-quality public reports featuring top-cut Pokémon also get surfaced in the Champions format page for other players to explore.

---

## JSON-LD Schema (include on page, do not render visibly)

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
        "text": "VGC Team Report is a free web tool for competitive Pokémon players. It lets you build a detailed team report — paste your team from Pokémon Showdown or PokéPaste, add matchup notes, key damage calculations, speed tier breakdowns, and tournament context, then share it with a single link."
      }
    },
    {
      "@type": "Question",
      "name": "What is a VGC team report?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A VGC team report is a structured document that explains not just what a competitive Pokémon team is, but why it was built that way. It covers the six Pokémon and their sets, the core strategy and win conditions, matchup notes against top meta threats, key damage calculations explaining EV spread choices, and speed tier comparisons."
      }
    },
    {
      "@type": "Question",
      "name": "How do I share a VGC team using VGC Team Report?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Export your team from Pokémon Showdown or PokéPaste, paste it into VGC Team Report, add your matchup notes and damage calcs, then click Share to get a permanent public link. Anyone with the link can view the report without an account."
      }
    },
    {
      "@type": "Question",
      "name": "Does VGC Team Report support Pokémon Champions and Mega Evolution?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. VGC Team Report fully supports Pokémon Champions — the official 2026 competitive format — including Mega Evolution detection and display. It supports Regulation M-A used for Indianapolis Regionals and the 2026 World Championships."
      }
    },
    {
      "@type": "Question",
      "name": "How is VGC Team Report different from PokéPaste?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "PokéPaste shares the raw team text (movesets, items, EVs) — minimal and text-only. VGC Team Report is for documenting a completed team with full strategy notes, matchup plans, damage calculations, and speed tiers, then sharing it as a polished, readable report."
      }
    },
    {
      "@type": "Question",
      "name": "Is VGC Team Report free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. VGC Team Report is completely free to use. No account is required to create or view a team report. A free account lets you save and manage reports across sessions."
      }
    },
    {
      "@type": "Question",
      "name": "What competitive Pokémon formats does VGC Team Report support?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "VGC Team Report supports Pokémon Champions 2026 (Regulation M-A with Mega Evolution), Pokémon Scarlet and Violet (all Regulation sets including H and I), and standard Pokémon Showdown export format for any generation."
      }
    },
    {
      "@type": "Question",
      "name": "What are damage calculations and why do they belong in a VGC team report?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Damage calculations show the exact range of damage a move deals under specific conditions — for example, whether a Pokémon survives a key hit from a top meta threat. Including calcs in a team report explains why specific EV spreads were chosen, making the report useful for players who want to adapt spreads for their own builds."
      }
    },
    {
      "@type": "Question",
      "name": "What are speed tiers in VGC?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Speed tiers rank how fast each Pokémon moves in battle, accounting for base Speed, EVs, nature, and modifiers like Tailwind or Trick Room. In VGC, moving first can decide a game — team reports include speed tier tables showing how your team's Speed compares to key threats under normal conditions and under Tailwind or Trick Room."
      }
    },
    {
      "@type": "Question",
      "name": "How do I get my VGC team report discovered by other players?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Make your report public when publishing, fill in tournament context (event, placement, format), and share the link on Reddit (r/VGC, r/stunfisk), Discord VGC community servers, and Twitter/X. Public reports are also browsable on VGC Team Report's Explore page, searchable by Pokémon, format, and tournament."
      }
    }
  ]
}
```

---

## Implementation Notes (for developer)

1. Create `/src/app/faq/page.tsx` as a static page
2. Use `generateMetadata` to set title, description, and canonical URL
3. Inject the JSON-LD schema via `<Script type="application/ld+json">` in the page component or via a shared `JsonLd` component
4. Style with existing Tailwind classes — accordion/expand pattern is good for UX but ensure full question text is in the HTML (not just rendered on expand) for crawler access
5. Add `/faq` to the site navigation (footer at minimum; consider header)
6. Add `FAQPage` reference to the sitemap.xml

## SEO/AEO Notes

- Each Q&A answer should be self-contained (AI models often lift individual answers out of context)
- Answers should begin with a direct response in the first sentence — AI citation pulls from the first 40–60 words
- Avoid answer text that only makes sense within the page context (e.g., "as mentioned above")
- Do not use pronouns where the noun is clearer — write "VGC Team Report" not "it" in answers
- Target answer length: 40–120 words per answer (enough for context, short enough for AI to quote cleanly)
