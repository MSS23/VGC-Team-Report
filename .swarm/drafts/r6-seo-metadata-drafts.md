# SEO Metadata Drafts — Wave 2 Implementation
**Status:** DRAFT ONLY — Do NOT implement until Wave 2
**Source audit:** `.swarm/r6-seo-audit.md`
**Date:** 2026-05-07

---

## Draft 1: Root Layout Metadata (`/src/app/layout.tsx`)

### Title

```ts
title: {
  default: "VGC Team Report — Pokemon Champions Team Reports 2026",
  template: "%s | VGC Team Report",
},
```

Rationale: Adds "Pokemon Champions" and "2026" to the default title. 55 chars — under Google's ~60 char display limit. Keeps brand name at end for template override compatibility.

### Meta Description (trimmed to ~150 chars)

```ts
description: "The home for competitive Pokemon VGC team reports. Build Regulation M-A team breakdowns with Mega Evolution, matchup plans, and damage calcs. Share with the community.",
```

Character count: ~170 chars — verify with SERP preview tool; trim "Share with the community" if over limit.

Alternative (145 chars, safer):
```ts
description: "Build and share competitive Pokemon VGC team reports for Pokemon Champions 2026. Mega Evolution, damage calcs, and matchup plans included.",
```

### Open Graph Title

```ts
openGraph: {
  title: "VGC Team Report — Build, Share & Discover Pokemon Champions Teams 2026",
  // ...
}
```

### Open Graph Description

```ts
openGraph: {
  description: "The home for competitive Pokemon Champions VGC team reports. Mega Evolution support, matchup plans, damage calcs, and speed tiers — share your team with the community.",
  // ...
}
```

### Twitter Card

Add `twitter:site` tag:
```ts
twitter: {
  card: "summary_large_image",
  site: "@VGCTeamReport",  // UPDATE: verify correct Twitter handle
  title: "VGC Team Report — Pokemon Champions Teams & Reports 2026",
  description: "Build and share competitive Pokemon Champions VGC team reports with Mega Evolution, matchup plans, and damage calcs.",
},
```

### JSON-LD — Add `sameAs` and `featureList`

```ts
// In root JsonLd component data prop:
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "VGC Team Report",
  url: "https://pokemonvgcteamreport.com",
  description: "Build detailed competitive Pokemon VGC team breakdowns with notes, matchup plans, and damage calcs — then share them with the community or present at tournaments.",
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Pokemon Champions Regulation M-A team reports",
    "Mega Evolution support",
    "Damage calculations",
    "Speed tiers",
    "Matchup plans",
    "PokePaste import",
    "Tournament presentation mode",
    "Public team sharing",
  ],
  sameAs: [
    // ADD: actual social profile URLs when known
    // "https://twitter.com/VGCTeamReport",
    // "https://discord.gg/...",
  ],
  browserRequirements: "Requires a modern web browser",
}
```

### Default OG Image

Add a default OG image (1200x630px) to the root metadata:
```ts
openGraph: {
  // ...existing fields...
  images: [
    {
      url: "/opengraph-image.png",  // Create this file in /public/
      width: 1200,
      height: 630,
      alt: "VGC Team Report — Build, Share & Discover Pokemon Champions Teams",
    }
  ],
},
```
NOTE: Wave 2 must create the `/public/opengraph-image.png` asset. A static branded image with the site name, a Pokemon sprite grid, and a tagline is sufficient. Avoid dynamic generation (prior attempt failed due to edge runtime + CDN timeout).

---

## Draft 2: Explore Page (`/src/app/explore/page.tsx`)

### Title

```ts
title: "Explore Pokemon VGC Teams 2026 — Team Reports & Pastes",
```

### Meta Description

```ts
description: "Browse competitive Pokemon Champions VGC team reports shared by players from tournaments worldwide. Filter by Pokemon, Regulation M-A, tournament, or creator.",
```

### Open Graph

```ts
openGraph: {
  title: "Explore Pokemon VGC Team Reports 2026 — VGC Team Report",
  description: "Browse Pokemon Champions and VGC 2026 team reports shared by the competitive community. Search by Pokemon, tournament, or creator.",
  // ...existing type, siteName, images...
},
```

---

## Draft 3: Champions Hub Page (`/src/app/champions/page.tsx`)

### Title

```ts
title: "Pokemon Champions VGC Team Reports — Mega Evolution 2026",
```

### Meta Description

```ts
description: "Browse Pokemon Champions Regulation M-A VGC team reports with Mega Evolution. Find EV spreads, movesets, damage calcs, and competitive team breakdowns for every legal Mega in 2026.",
```

### Add JSON-LD (currently missing)

```ts
// Add to ChampionsPage or wrap ChampionsContent with:
<JsonLd
  data={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Pokemon Champions VGC Team Reports — Mega Evolution 2026",
    url: "https://pokemonvgcteamreport.com/champions",
    description: "Browse Pokemon Champions Regulation M-A team reports with Mega Evolution support.",
    isPartOf: {
      "@type": "WebApplication",
      name: "VGC Team Report",
      url: "https://pokemonvgcteamreport.com",
    },
  }}
/>
```

---

## Draft 4: Creator Pages (`/src/app/creator/[name]/page.tsx`)

### Title

```ts
title: `${creator} — VGC Team Reports`,
// Renders as: "PlayerName — VGC Team Reports | VGC Team Report"
```

### Meta Description

```ts
description: `Browse all competitive Pokemon VGC team reports published by ${creator}. Full team breakdowns with EV spreads, damage calcs, and matchup plans.`,
```

### JSON-LD Enhancement

Add a `knowsAbout` or `hasPart` to link teams:
```ts
// Existing ProfilePage schema is fine; the description is the main gap
description: `Competitive VGC player ${creator}'s public team reports on VGC Team Report.`,
```

---

## Draft 5: New Regulation Landing Pages (New Routes)

### `/src/app/regulation-m-a/page.tsx` (new page)

```ts
export const metadata: Metadata = {
  title: "Regulation M-A VGC Guide — Pokemon Champions 2026",
  description: "Everything about Pokemon Champions Regulation M-A: legal Pokemon, Mega Evolution rules, top teams, and how to build for the 2026 World Championships format.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/regulation-m-a" },
  openGraph: {
    title: "Regulation M-A VGC Guide — Pokemon Champions 2026",
    description: "Legal Pokemon, Mega Evolution rules, top teams, and team reports for Pokemon Champions Regulation M-A — the 2026 Worlds format.",
    type: "website",
    siteName: "VGC Team Report",
  },
};
```

Content should include:
- Format overview (no restricted/legendary, Mega Evolution legal, Omni Ring mechanic)
- Legal Mega list (link to each `/champions/[pokemon]` page)
- Latest team reports tagged Reg M-A
- Link to `/explore` filtered by regulation

### `/src/app/regulation-i/page.tsx` (new page — lower priority)

Similar structure for Regulation I (active April 1 – May 28 2026).

---

## Draft 6: Individual Pokemon Pages — Description Enhancement

Current description template:
```
Complete ${mega.displayName} VGC guide for Pokemon Champions Regulation M-A: best EV spreads, movesets, damage calcs, and top competitive teams. ${mega.ability} with ${mega.megaStone}.
```

Proposed enhancement — make the ability/stone more readable and add year signal:
```ts
const description = `${mega.displayName} VGC guide for Pokemon Champions 2026 (Regulation M-A): best EV spreads, movesets, and damage calcs. Ability: ${mega.ability}. Mega Stone: ${mega.megaStone}. Browse community team reports.`;
```

Also consider adding `"VGC 2026"` to the keywords array explicitly:
```ts
keywords: [
  // ...existing keywords...
  `${mega.displayName} VGC 2026`,
  `${mega.displayName} Pokemon Champions`,
  `${mega.baseName} Mega Stone`,
  "Regulation M-A",
  "VGC 2026",
],
```

---

## Draft 7: Shared Report Pages — Keywords Signal

The `/s/[id]` pages already have strong dynamic metadata. One gap: add a `keywords` tag based on the team's species when available:

```ts
// In generateMetadata for /s/[id]:
keywords: species.length > 0
  ? [
      ...species,
      ...species.map(s => `${s} VGC`),
      "VGC team report",
      "Pokemon Champions",
      tournamentName || undefined,
    ].filter(Boolean)
  : ["VGC team report", "Pokemon Champions", "competitive Pokemon"],
```

---

## Priority Order for Wave 2 Implementation

1. **P0 — Fix root OG image** (creates social preview for homepage shares — currently blank)
2. **P0 — Trim root meta description** to 155 chars (currently truncated in SERPs)
3. **P1 — Update root title** to include "Pokemon Champions" and "2026"
4. **P1 — Update `/explore` title and description** (adds year and format keywords)
5. **P1 — Update `/creator/[name]` title** to include "VGC"
6. **P1 — Add JSON-LD to `/champions` hub page** (currently missing schema)
7. **P2 — Add `twitter:site` tag** to root layout
8. **P2 — Add `sameAs` to root JSON-LD** (social profile links)
9. **P3 — New regulation landing pages** (`/regulation-m-a`, `/regulation-i`)
10. **P3 — `/s/[id]` keywords tag** from species list

---

## Notes for Wave 2

- Do NOT change the `template: "%s | VGC Team Report"` pattern — all per-page titles depend on it.
- The `/champions/[pokemon]` metadata is already strong; do not over-optimize. The limiting factor there is backlinks, not on-page SEO.
- The "VGC team builder" keyword gap is strategic (the site is a report tool, not a builder) — only add it if the site adds a build-first flow in the future.
- Verify the Twitter handle before adding `twitter:site`.
- The regulation landing pages should render real content (not thin placeholder pages) or they risk a thin-content manual action — minimum 300 words + 3 internal links.
