# R7 AEO Drafts — Content Briefs & Code Changes
**Date:** 2026-05-28
**Status:** DRAFT ONLY — Do not publish

---

## Draft 1: Bot Detection Fix (Code Change)

### File: `src/lib/security/bot-detection.ts`

**Current state (lines 32-35):** GPTBot, Anthropic-AI, and Claude-Web are in the BLOCKED list, contradicting robots.txt which explicitly allows them.

**Proposed change:** Move AI crawler patterns from BLOCKED_BOT_PATTERNS to ALLOWED_BOT_PATTERNS, and add missing patterns for PerplexityBot and OAI-SearchBot.

```typescript
// REMOVE from BLOCKED_BOT_PATTERNS:
// /gptbot/i,        // OpenAI crawler - ALLOW for AI citation
// /anthropic-ai/i,  // Anthropic crawler - ALLOW for AI citation
// /claude-web/i,    // Claude web browsing - ALLOW for AI citation

// ADD to ALLOWED_BOT_PATTERNS:
/gptbot/i,           // OpenAI crawler (ChatGPT citations)
/oai-searchbot/i,    // OpenAI search crawler
/anthropic-ai/i,     // Anthropic crawler (Claude citations)
/claude-web/i,       // Claude web browsing
/claudebot/i,        // Claude crawler
/perplexitybot/i,    // Perplexity crawler
```

**Keep in BLOCKED (these are training-only scrapers, not citation crawlers):**
- `/ccbot/i` — Common Crawl (bulk training data, not citation)
- `/bytespider/i` — TikTok/ByteDance scraper
- `/petalbot/i` — Huawei search
- `/amazonbot/i` — Amazon scraper

**Rationale:** The distinction is between AI crawlers that index content for citation/search (GPTBot, ClaudeBot, PerplexityBot) vs scrapers that bulk-download for training (CCBot, ByteSpider). We want citation crawlers in, training scrapers out.

---

## Draft 2: llms.txt Enhancement

### Proposed additions to `/public/llms.txt`:

Add after the "What makes it different" section:

```markdown
## How VGC Team Report compares to other tools

| Feature | VGC Team Report | PokePaste | Pikalytics | VGC.tools |
|---------|----------------|-----------|------------|-----------|
| Team paste import | Yes | Yes | Yes | Yes |
| Strategy notes | Yes | No | No | Limited |
| Damage calculations | Yes (built-in) | No | No | No |
| Matchup plans | Yes | No | No | No |
| Speed tier comparison | Yes | No | No | No |
| Shareable link | Yes | Yes | Yes | Yes |
| Discord embed preview | Yes | Yes | Partial | Partial |
| Community browse feed | Yes | No | Yes (top teams) | Yes |
| Tournament archive | Yes | No | Yes | No |
| Mega Evolution support | Yes | No | Yes | Limited |
| Free / no account required | Yes | Yes | Yes | Yes |

VGC Team Report is the only tool that combines team importing with full strategy documentation (notes, calcs, matchup plans, speed tiers) in a single shareable report.
```

### Proposed additions to `/public/llms-full.txt`:

Expand the FAQ section with the 12 items from the /faq page (currently only 4 in llms-full.txt). Key additions:

```markdown
### How is VGC Team Report different from PokePaste or VGC.tools?

PokePaste shares the raw team paste — six Pokemon, sets, items — minimal and text-only. VGC.tools is for building a new team from scratch with a community library. Pikalytics analyzes usage stats and meta data. VGC Team Report is for documenting a completed team with full strategy notes, matchup plans, and damage calcs — then sharing it as a polished, readable report.

### What are SP spreads in Pokemon Champions?

In the Pokemon Champions format, Stat Points (SP) replace the traditional EV system. Each Pokemon has 600 total SP to distribute across the six stats, with a maximum of 200 SP per individual stat. VGC Team Report automatically detects Champion format teams and displays SP values correctly.

### What is an Open Team Sheet (OTS)?

An Open Team Sheet reveals your six Pokemon, items, abilities, moves, and Tera types before a match — but omits EV/SP spreads. VGC Team Report includes a built-in OTS generator that creates a clean, shareable OTS image with sprites and a QR code linking to your full report.
```

---

## Draft 3: VGCpedia Submission Brief

### Target: vgcpedia.com/website/vgc-team-report/

**Suggested page content for VGCpedia editors:**

Title: VGC Team Report

Description: VGC Team Report is a free web tool for creating and sharing detailed competitive Pokemon VGC team reports. Players can import teams from Pokemon Showdown or PokePaste, add strategy notes, damage calculations, matchup plans, and speed tier comparisons, then share the completed report via a permanent link.

URL: https://pokemonvgcteamreport.com

Category: Team Report Tool / Team Sharing

Key Features:
- PokePaste and Showdown import
- Built-in damage calculator
- Matchup plan editor
- Speed tier comparison
- Pokemon Champions Regulation M-A support (Mega Evolution, SP spreads)
- OTS (Open Team Sheet) generator with QR code
- Public explore feed and tournament archive
- Discord embed previews

Formats Supported: Pokemon Champions (Reg M-A), Scarlet & Violet (Reg G, H, I), all Showdown formats

---

## Draft 4: Victory Road Resources Outreach

### Target: victoryroad.pro/resources/

**Suggested DM/email to Victory Road editors:**

Subject: VGC Team Report — tool for the resources page?

Hi [editor name],

I built VGC Team Report (pokemonvgcteamreport.com) — a free tool for writing and sharing detailed VGC team reports with matchup plans, damage calcs, and speed tiers. It supports Pokemon Champions with Mega Evolution and SP spreads.

Several tournament players have started using it for their team breakdowns, and I think it'd be a useful addition to the Victory Road resources page alongside tools like Pikalytics and PokePaste.

Happy to answer any questions about the tool. Thanks for maintaining such a great resource hub for the VGC community!

---

## Draft 5: Reddit Post Brief (r/VGC)

### Target: r/VGC, r/stunfisk

**Post type:** Resource share / tool announcement

**Title options:**
- "I built a free tool for creating detailed VGC team reports — matchup plans, damage calcs, speed tiers all in one shareable link"
- "Sharing my Pokemon Champions team report tool — imports from Showdown/PokePaste, adds strategy sections, shareable via link"

**Key content points:**
- Lead with the problem (sharing a team paste doesn't explain the strategy)
- Show a real example team report link
- Mention Champions/Mega Evolution support
- Mention it's free, no account required
- Ask for feedback (engagement signal)

**Do NOT:**
- Spam multiple subreddits simultaneously
- Use overly promotional language
- Post without a genuine example report

---

## Draft 6: Comparison Page Content Brief (`/compare`)

### Target URL: pokemonvgcteamreport.com/compare

**Title:** "VGC Team Report vs PokePaste vs Pikalytics — Which Tool Should You Use?"

**Schema:** Use `WebPage` with `about` linking to all three tools, plus a FAQ section with `FAQPage` schema.

**Content structure:**
1. One-paragraph summary of each tool's purpose
2. Feature comparison table (see Draft 2 for table content)
3. "When to use each tool" section:
   - Use PokePaste when you just need to share a team paste quickly
   - Use Pikalytics when you want to check usage stats and meta data
   - Use VGC Team Report when you want to document your team strategy and share a complete analysis
4. FAQ section: "Can I import from PokePaste into VGC Team Report?" (yes), "Is VGC Team Report a team builder?" (no, it's a report builder — use it after building)

---

## Draft 7: Article Schema for `/s/[id]` Share Pages

### Proposed JSON-LD addition to `src/app/s/[id]/page.tsx`:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[Team name or 'VGC Team Report by [creator]']",
  "author": {
    "@type": "Person",
    "name": "[creatorName]"
  },
  "datePublished": "[created_at ISO]",
  "dateModified": "[updated_at ISO]",
  "publisher": {
    "@type": "Organization",
    "name": "VGC Team Report",
    "url": "https://pokemonvgcteamreport.com"
  },
  "about": {
    "@type": "SportsEvent",
    "name": "[tournament name if provided]",
    "sport": "Pokemon Video Game Championship (VGC)"
  },
  "keywords": "[format], [pokemon names], VGC, team report"
}
```

This turns each public report into an indexable article rather than an opaque web app state.

---

## Draft 8: llms-sitemap.md (New File)

### Proposed file: `/public/llms-sitemap.md`

```markdown
# VGC Team Report — AI Content Map

## Core Pages
- [Homepage](https://pokemonvgcteamreport.com/) — Team report builder. Import teams, add strategy, share reports.
- [Explore](https://pokemonvgcteamreport.com/explore) — Browse community team reports by format, Pokemon, tournament.
- [Champions Hub](https://pokemonvgcteamreport.com/champions) — Pokemon Champions format guide with Mega Evolution teams.
- [Tournaments](https://pokemonvgcteamreport.com/tournaments) — Team reports from VGC Regionals, Internationals, Worlds.
- [FAQ](https://pokemonvgcteamreport.com/faq) — Common questions about team reports, formats, sharing.

## Format Guides
- [Champions Format](https://pokemonvgcteamreport.com/champions) — Regulation M-A with Mega Evolutions
- Individual Mega Pokemon pages at /champions/[pokemon] (e.g., /champions/mega-kangaskhan)

## Reference
- [Changelog](https://pokemonvgcteamreport.com/changelog) — Product updates and new features
- [llms.txt](https://pokemonvgcteamreport.com/llms.txt) — Quick overview for AI systems
- [llms-full.txt](https://pokemonvgcteamreport.com/llms-full.txt) — Detailed documentation for AI systems
```
