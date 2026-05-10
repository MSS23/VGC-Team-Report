# SEO Metadata Recommendations — Draft Changes
**Status:** DRAFT ONLY — do not implement without review
**Audit source:** `.swarm/r6-seo-audit.md`
**Date:** 2026-05-10

> Note: A prior draft exists at `.swarm/drafts/r6-seo-metadata-drafts.md` (Wave 1, 2026-05-07).
> This file supersedes it with updated competitor landscape data and revised priorities.

---

## Priority 0 (Critical — implement first)

### P0-A: Add default OG image to root layout

File: `/src/app/layout.tsx`

Add to `openGraph` block:
```ts
openGraph: {
  title: "VGC Team Report — Pokemon Champions Team Reports 2026",
  description:
    "Build detailed Pokémon VGC team reports with EV spreads, matchup notes and damage calcs. Share in one link. The richer alternative to PokéPaste.",
  type: "website",
  siteName: "VGC Team Report",
  url: "https://pokemonvgcteamreport.com",
  images: [
    {
      url: "/opengraph-image.png",
      width: 1200,
      height: 630,
      alt: "VGC Team Report — Build & Share Pokemon Champions Team Reports",
    },
  ],
},
```

**Also update Twitter card to match:**
```ts
twitter: {
  card: "summary_large_image",
  site: "@VGCTeamReport",  // VERIFY handle before implementing
  title: "VGC Team Report — Pokemon Champions Team Reports 2026",
  description:
    "Build detailed Pokémon VGC team reports with EV spreads, matchup notes and damage calcs. Share in one link. The richer alternative to PokéPaste.",
},
```

Asset required: Create `/public/opengraph-image.png` at 1200×630px. Branded static image with site name, a 6-Pokemon sprite row, and tagline. Do NOT use Next.js dynamic OG (prior attempt timed out on edge runtime).

---

### P0-B: Add "Pokemon Champions 2026" to homepage title

File: `/src/app/layout.tsx`

Current:
```ts
title: {
  default: "VGC Team Report — Build & Share Pokémon VGC Teams",
  template: "%s | VGC Team Report",
},
```

Proposed:
```ts
title: {
  default: "VGC Team Report — Pokemon Champions Team Reports 2026",
  template: "%s | VGC Team Report",
},
```

Character count: 54 chars (under 60 char display limit). Keeps brand at front; adds format and year signal that every competitor includes in their root title.

---

## Priority 1 (High impact, quick to implement)

### P1-A: Update `/explore` page metadata

File: `/src/app/explore/page.tsx`

```ts
export const metadata: Metadata = {
  title: "Explore Pokemon Champions VGC Team Reports 2026",
  alternates: { canonical: "https://pokemonvgcteamreport.com/explore" },
  description:
    "Browse competitive Pokemon Champions VGC team reports shared by players worldwide. Filter by Pokemon, Regulation M-A format, tournament, or creator.",
  openGraph: {
    title: "Explore Pokemon Champions VGC Team Reports 2026 — VGC Team Report",
    description:
      "Browse Pokemon Champions VGC 2026 team reports from the competitive community. Search by Pokemon, tournament, or creator.",
    type: "website",
    siteName: "VGC Team Report",
    images: [{ url: "/explore/opengraph-image", width: 1200, height: 630, alt: "Explore VGC Teams — Browse competitive Pokemon team reports" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Pokemon Champions VGC Team Reports 2026",
    description: "Discover Pokemon Champions and VGC 2026 team reports shared by the competitive community.",
  },
};
```

---

### P1-B: Update `/creator/[name]` metadata

File: `/src/app/creator/[name]/page.tsx`

```ts
return {
  title: `${creator} VGC Team Reports | VGC Team Report`,
  description: `Browse all competitive Pokemon VGC team reports published by ${creator}. Full team breakdowns with EV spreads, damage calcs, matchup plans, and speed tiers for Pokemon Champions 2026.`,
  alternates: {
    canonical: `https://pokemonvgcteamreport.com/creator/${encodeURIComponent(creator)}`,
  },
  openGraph: {
    title: `${creator} — Pokemon Champions VGC Team Reports`,
    description: `Competitive VGC team reports by ${creator}: EV spreads, matchup plans, damage calcs, and speed tiers for Pokemon Champions 2026.`,
    type: "profile",
    siteName: "VGC Team Report",
  },
};
```

---

### P1-C: Add JSON-LD to `/champions` hub page

File: `/src/app/champions/page.tsx`

Current: no structured data on this page.

Add to `ChampionsPage`:
```tsx
import { JsonLd } from "@/components/seo/JsonLd";

export default function ChampionsPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Pokemon Champions VGC Team Reports — Mega Evolution 2026",
          url: "https://pokemonvgcteamreport.com/champions",
          description:
            "Browse Pokemon Champions Regulation M-A team reports with Mega Evolution support. Find EV spreads, movesets, damage calcs, and competitive team breakdowns for every legal Mega in 2026.",
          isPartOf: {
            "@type": "WebApplication",
            name: "VGC Team Report",
            url: "https://pokemonvgcteamreport.com",
          },
        }}
      />
      <ChampionsContent />
    </>
  );
}
```

---

## Priority 2 (Medium impact)

### P2-A: Add `sameAs` and `featureList` to root WebApplication JSON-LD

File: `/src/app/layout.tsx` — in the `<JsonLd>` data block.

```ts
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "VGC Team Report",
  url: "https://pokemonvgcteamreport.com",
  description:
    "Build detailed competitive Pokemon VGC team breakdowns with notes, matchup plans, and damage calcs — then share them with the community or present at tournaments.",
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
    "Inline damage calculations",
    "Speed tier comparisons",
    "Matchup plans",
    "PokePaste and Showdown import",
    "Tournament presentation mode",
    "Public team sharing with single link",
  ],
  sameAs: [
    // Insert verified social profile URLs before implementing
    // "https://twitter.com/VGCTeamReport",
    // "https://discord.gg/...",
  ],
  browserRequirements: "Requires a modern web browser",
}
```

---

### P2-B: Update `/champions` page title and description to emphasize "Mega Evolution"

File: `/src/app/champions/page.tsx`

Current title: "Pokemon Champions VGC Team Builder & Reports"

Proposed:
```ts
title: "Pokemon Champions VGC Team Reports — Mega Evolution 2026",
description:
  "Browse Pokemon Champions Regulation M-A VGC team reports with Mega Evolution. Find EV spreads, movesets, damage calcs, and competitive team breakdowns for every legal Mega in 2026.",
```

Rationale: "Mega Evolution" is a high-volume keyword that VGC Coach Pro and Pikalytics both rank for. The current description doesn't include it. The title change adds "Mega Evolution" while keeping "Pokemon Champions" and "2026."

---

### P2-C: Enhance `/champions/[pokemon]` description template

File: `/src/app/champions/[pokemon]/page.tsx`

Current:
```ts
const description = `Complete ${mega.displayName} VGC guide for Pokemon Champions Regulation M-A: best EV spreads, movesets, damage calcs, and top competitive teams. ${mega.ability} with ${mega.megaStone}.`;
```

Proposed:
```ts
const description = `${mega.displayName} VGC guide for Pokemon Champions 2026 (Regulation M-A): best EV spreads, movesets, and damage calcs. Ability: ${mega.ability}. Mega Stone: ${mega.megaStone}. Browse community team reports.`;
```

Changes: Adds "2026" year signal; restructures ability/stone as labeled fields (more readable in SERPs); adds "Browse community team reports" CTA that differentiates from Smogon/Pikalytics.

---

## Priority 3 (Strategic — requires new content)

### P3-A: New Regulation M-A landing page

**New file:** `/src/app/regulation-m-a/page.tsx`

```ts
export const metadata: Metadata = {
  title: "Regulation M-A VGC Guide — Pokemon Champions 2026 Format",
  description:
    "Complete guide to Pokemon Champions Regulation M-A: legal Pokemon, Mega Evolution rules, Omni Ring mechanic, top teams, and how to build for the 2026 World Championships format.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/regulation-m-a" },
  openGraph: {
    title: "Regulation M-A VGC Guide — Pokemon Champions 2026",
    description:
      "Legal Pokemon, Mega Evolution rules, top teams, and team reports for Pokemon Champions Regulation M-A — the 2026 Worlds format.",
    type: "website",
    siteName: "VGC Team Report",
  },
};
```

Minimum page content (300+ words):
- Format overview (Reg M-A dates, event coverage: Indianapolis Regionals, 2026 Worlds)
- Legal Pokemon summary (263 entries, Kanto–Paldea)
- Mega Evolution rules (Omni Ring, one Mega per battle, 59 legal Mega forms)
- Top Megas table (link each to `/champions/[pokemon]`)
- Latest team reports tagged Reg M-A (dynamic query)
- Internal links: `/champions`, `/explore`

Add to sitemap in `staticPages`:
```ts
{ url: `${BASE}/regulation-m-a`, changeFrequency: "weekly" as const, priority: 0.8 },
```

---

### P3-B: "PokePaste alternative" landing page or anchor section

Rather than a full page, add a comparison section to the homepage or FAQ that explicitly targets the query "pokepaste alternative VGC." crob.at currently ranks for this; VGC Team Report's meta description already uses "richer alternative to PokéPaste" but there's no dedicated content.

Option A (low effort): Add an FAQ entry: "How is VGC Team Report different from PokePaste?"
Option B (medium effort): Add a `/vs-pokepaste` comparison page — thin pages risk manual action, so minimum 400 words of genuine comparison content.

---

### P3-C: Feature-keyword capture on `/champions/[pokemon]` pages

The site has damage calcs, speed tiers, and matchup plans built into the report editor. These features are not surfaced to search engines because the tool is interactive (client-side). To capture utility queries without building standalone tool pages:

Add static H2 sections to each `/champions/[pokemon]` page with SSR-rendered content:
- "Damage Calculations for [Pokemon] in Pokemon Champions 2026" — with a few pre-computed benchmark calcs (e.g., vs top meta threats Sneasler, Garchomp, Kingambit)
- "Speed Tiers for [Pokemon] in Regulation M-A" — show base Speed, max Speed at +0/+1 nature, with Tailwind

This captures the "damage calculator VGC 2026" and "VGC speed tier calculator" long-tail without building a separate tool page.

---

## Implementation Priority Order

| Priority | Change | File(s) | Est. Time |
|---|---|---|---|
| P0-A | Add default OG image | `layout.tsx` + create `/public/opengraph-image.png` | 30 min |
| P0-B | Update root title to include "Pokemon Champions 2026" | `layout.tsx` | 5 min |
| P1-A | Update `/explore` title + description | `explore/page.tsx` | 10 min |
| P1-B | Update `/creator/[name]` title + description | `creator/[name]/page.tsx` | 10 min |
| P1-C | Add JSON-LD to `/champions` page | `champions/page.tsx` | 15 min |
| P2-A | Add `sameAs` + `featureList` to root JSON-LD | `layout.tsx` | 15 min |
| P2-B | Update `/champions` title to include "Mega Evolution" | `champions/page.tsx` | 5 min |
| P2-C | Update `/champions/[pokemon]` description template | `champions/[pokemon]/page.tsx` | 10 min |
| P3-A | Create `/regulation-m-a` landing page | new file | 2-3 hrs |
| P3-B | PokePaste alternative content | FAQ or new page | 1-2 hrs |
| P3-C | SSR calc/speed sections on pokemon pages | `MegaLandingContent.tsx` | 3-4 hrs |

---

## Notes for Implementation

- Do NOT change `template: "%s | VGC Team Report"` — all per-page titles depend on it
- `/champions/[pokemon]` metadata is already strong; P2-C is incremental optimization only
- Verify Twitter handle (`@VGCTeamReport`) before adding `twitter:site`
- The regulation landing page (P3-A) must have real content — minimum 300 words + 3 internal links to avoid thin-content penalty
- "VGC team builder" keyword is intentionally NOT targeted — the site is a report tool. Avoid false positioning that would create a bounce-rate penalty when builder-intent users land and find a report tool.
