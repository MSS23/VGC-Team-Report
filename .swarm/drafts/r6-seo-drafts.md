# SEO Change Drafts — May 28, 2026
**Status**: DRAFT ONLY — Do NOT publish or deploy.

---

## Draft 1: Move FAQPageJsonLd + HowToSchema to server-rendered layout

### Problem
`src/app/page.tsx` is `"use client"` — the `FAQPageJsonLd` and `HowToSchema` components render only after JavaScript execution. Crawlers that don't execute JS miss this structured data entirely.

### Proposed Change (layout.tsx)

Add to `src/app/layout.tsx` inside the `<body>` tag, alongside the existing server-rendered JSON-LD:

```tsx
// After existing JsonLd components (line ~137 area)
<JsonLd
  data={{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is a VGC team report?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A VGC team report is a detailed breakdown of a competitive Pokemon Video Game Championship (VGC) team...",
        },
      },
      {
        "@type": "Question",
        name: "How do I share a VGC team report?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "After building your team report on VGC Team Report, click the Share button...",
        },
      },
      // ... remaining FAQ items
    ],
  }}
/>
<JsonLd
  data={{
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Create a VGC Team Report",
    description: "Step-by-step guide to building and sharing a competitive Pokemon VGC team report.",
    step: [
      { "@type": "HowToStep", position: 1, name: "Export your team", text: "Open Pokemon Showdown or PokePaste and export your team as a text paste." },
      { "@type": "HowToStep", position: 2, name: "Paste your team into VGC Team Report", text: "Go to pokemonvgcteamreport.com, paste your Showdown export or PokePaste URL into the input field, and click Analyze." },
      { "@type": "HowToStep", position: 3, name: "Add notes, damage calcs, and speed tiers", text: "Fill in your team overview, per-Pokemon role notes, key damage calculations, and speed tier comparisons." },
      { "@type": "HowToStep", position: 4, name: "Add matchup plans", text: "Document your matchup plans against common threats and tournament meta picks." },
      { "@type": "HowToStep", position: 5, name: "Share your report", text: "Click the Share button to generate a permanent public link." },
    ],
  }}
/>
```

**Note**: Keep the duplicates in `page.tsx` too (they won't conflict; Google deduplicates). The layout version ensures crawlers see them regardless of JS execution.

---

## Draft 2: Update /explore title

### Current (src/app/explore/page.tsx line 6)
```tsx
title: "Explore VGC Teams | VGC Team Report",
```

### Proposed
```tsx
title: "Explore VGC Teams | Pokemon Champions 2026 Team Reports",
```

---

## Draft 3: Align homepage OG title

### Current (src/app/layout.tsx line 46)
```tsx
openGraph: {
  title: "VGC Team Report — Build, Share & Discover Pokemon Teams",
```

### Proposed
```tsx
openGraph: {
  title: "VGC Team Report — Pokemon Champions Team Reports 2026",
```

---

## Draft 4: Add twitter:site handle

### Current (src/app/layout.tsx, twitter object)
No `site` property set.

### Proposed (add to the twitter config in metadata)
```tsx
twitter: {
  card: "summary_large_image",
  site: "@VGCTeamReport", // Replace with actual handle
  title: "VGC Team Report — Pokemon Champions Team Reports 2026",
  description: "The home for competitive Pokemon VGC team reports...",
  ...
},
```

---

## Draft 5: Fix robots.txt / bot-detection contradiction

### Option A: Keep blocking AI scrapers (recommended)
Remove misleading Allow rules from `public/robots.txt`:

```diff
-# Explicitly allow AI crawlers
-User-agent: GPTBot
-Allow: /
-
-User-agent: ClaudeBot
-Allow: /
-
-User-agent: PerplexityBot
-Allow: /
-
-User-agent: OAI-SearchBot
-Allow: /
```

### Option B: Allow AI crawlers
Remove from `src/lib/security/bot-detection.ts` BLOCKED_BOT_PATTERNS:

```diff
  // AI training scrapers
- /gptbot/i,
  /ccbot/i,
- /anthropic-ai/i,
- /claude-web/i,
  /bytespider/i,
  /petalbot/i,
  /amazonbot/i,
```

Note: PerplexityBot and OAI-SearchBot are allowed in robots.txt but NOT in the blocked bots list, so they're already consistent (allowed through). The conflict is specifically GPTBot and anthropic-ai/claude-web.

---

## Draft 6: Add BreadcrumbList to /explore

### Proposed addition to src/app/explore/page.tsx

```tsx
<JsonLd
  data={{
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
        name: "Explore VGC Teams",
        item: "https://pokemonvgcteamreport.com/explore",
      },
    ],
  }}
/>
```

Same pattern for /faq and /tournaments.

---

## Draft 7: Server-rendered footer links for crawlers

### Proposed addition to src/app/layout.tsx (after {children})

```tsx
{/* Minimal server-rendered nav for crawlers — ensures all key pages are discoverable
    without JavaScript execution. Hidden visually but present in HTML. */}
<nav aria-label="Site navigation" className="sr-only">
  <a href="/explore">Explore VGC Teams</a>
  <a href="/champions">Pokemon Champions</a>
  <a href="/faq">FAQ</a>
  <a href="/tournaments">Tournaments</a>
  <a href="/compare">Compare Teams</a>
  <a href="/changelog">Changelog</a>
  <a href="/feedback">Feedback</a>
</nav>
```

**Alternative**: If a visible footer already exists, ensure it's a server component with these links. Check if `PageFooter` is server-rendered.

---

## Draft 8: Google Search Console submission checklist

1. Go to https://search.google.com/search-console
2. Add property: pokemonvgcteamreport.com
3. Verify via DNS TXT record or Vercel integration
4. Submit sitemap: https://pokemonvgcteamreport.com/sitemap.xml
5. Request indexing for priority pages:
   - /explore
   - /faq
   - /tournaments
   - /champions/mega-kangaskhan
   - /champions/mega-charizard-y
   - /champions/mega-mewtwo-y
   - /champions/mega-gengar
   - /champions/mega-blaziken
6. Monitor Coverage report for crawl errors
7. Check Core Web Vitals report once sufficient data accumulates

---

*All drafts are proposals only. Do not implement without explicit approval.*
