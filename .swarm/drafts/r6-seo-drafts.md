# R6 SEO Drafts — Metadata & Content Changes
**Generated:** 2026-05-25
**Source audit:** `.swarm/r6-seo-audit.md`

These are DRAFTS ONLY. Do not implement without explicit user approval.

---

## DRAFT 1: Homepage Title Fix (Under 60 chars)
**File:** `/src/app/layout.tsx` line 39-42
**Target keywords:** VGC Team Report, Pokemon VGC Teams, Pokemon Champions 2026
**Issue:** Current title is 73 chars, gets truncated in SERPs.

```ts
// Current:
title: {
  default: "VGC Team Report — Build & Share Pokémon VGC Teams | Pokemon Champions 2026",
  template: "%s | VGC Team Report",
},

// PROPOSED (58 chars — fits in SERP):
title: {
  default: "VGC Team Report — Build & Share Pokemon VGC Teams 2026",
  template: "%s | VGC Team Report",
},
```

**Alternative (if "Pokemon Champions" is more important):**
```ts
title: {
  default: "VGC Team Report — Pokemon Champions Team Reports 2026",
  template: "%s | VGC Team Report",
},
```

---

## DRAFT 2: Add BreadcrumbList Schema to /explore
**File:** `/src/app/explore/page.tsx`
**Impact:** Breadcrumb rich results in SERPs for explore queries

```tsx
// Add inside ExplorePage() alongside existing JsonLd:
<JsonLd
  data={{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "VGC Team Report",
        item: "https://pokemonvgcteamreport.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Explore Teams",
        item: "https://pokemonvgcteamreport.com/explore",
      },
    ],
  }}
/>
```

---

## DRAFT 3: Add BreadcrumbList Schema to /faq
**File:** `/src/app/faq/page.tsx`
# R6 SEO Drafts — Wave 2 Implementation Targets

Generated: 2026-05-23. Each block is a drop-in ready edit. Do NOT apply during Wave 1 — these are drafts only.

---

## DRAFT 1 — BreadcrumbList JSON-LD (add to `src/components/seo/JsonLd.tsx`)

Currently missing across the whole site. Google uses BreadcrumbList to show breadcrumb trails in SERPs (CTR uplift ~10-20%) and as the primary signal for hierarchical site understanding. Add the helper:

```tsx
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}
```

Then add to each non-home page:
- `/explore` → `[{name:"Home",url:".../"}, {name:"Explore",url:".../explore"}]`
- `/champions` → `[{name:"Home",url:".../"}, {name:"Champions",url:".../champions"}]`
- `/champions/[pokemon]` → 3-level with the Pokémon name
- `/tournaments` → similar
- `/s/[id]` → `[Home > Explore > {team name or species}]`

---

## DRAFT 2 — Root metadata.keywords (add to `src/app/layout.tsx`)

Currently the root metadata has NO `keywords` field. While Google ignores it, Bing and several AI crawlers still parse it. Add:

```typescript
keywords: [
  "VGC team builder",
  "Pokemon VGC team report",
  "Pokemon Champions team builder",
  "Regulation M-A team builder",
  "VGC 2026",
  "Pokemon damage calculator",
  "VGC speed tiers",
  "open team sheet generator",
  "OTS Pokemon VGC",
  "PokePaste viewer",
  "Pokemon Showdown team analyzer",
  "competitive Pokemon teams",
  "Mega Evolution VGC",
  "VGC matchup planner",
],
```

Also bump title to lead with the highest-volume query:
```
"VGC Team Builder & Report Maker — Pokémon Champions Reg M-A | VGC Team Report"
```
(keeps "VGC Team Builder" first — that's the #1 query gap.)

---

## DRAFT 3 — SoftwareApplication aggregateRating + review

Currently the SoftwareApplication JSON-LD in `layout.tsx` has `offers` but no `aggregateRating`. Google rich snippets for SoftwareApplication require it. Once we have >5 real reviews/likes in the DB, add:

```typescript
aggregateRating: {
  "@type": "AggregateRating",
  ratingValue: "4.8",        // pull from /api/stats once available
  reviewCount: 142,           // pull live from DB
  bestRating: "5",
  worstRating: "1",
},
```

Until live, omit (Google penalizes fake ratings). Wave 2 should add a `/api/seo/stats` endpoint returning aggregate likes/comments → render server-side in layout.

---

## DRAFT 4 — `/champions/[pokemon]` enriched JSON-LD (CreativeWork + ItemList of teams)

Currently champions/[pokemon] only has metadata. Add to that page:

```tsx
<JsonLd
  data={{
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${mega.displayName} VGC Guide — SP Spreads, Movesets & Sample Teams`,
    description: `Complete ${mega.displayName} guide for Pokemon Champions Regulation M-A.`,
    about: {
      "@type": "Thing",
      name: mega.displayName,
      sameAs: `https://bulbapedia.bulbagarden.net/wiki/${mega.baseName}`,
    },
    keywords: [`${mega.displayName} VGC`, `${mega.displayName} EV spread`, `${mega.displayName} moveset`],
    author: { "@type": "Organization", name: "VGC Team Report" },
    datePublished: "2026-01-01",
    dateModified: new Date().toISOString().slice(0, 10),
    publisher: {
      "@type": "Organization",
      name: "VGC Team Report",
      logo: { "@type": "ImageObject", url: "https://pokemonvgcteamreport.com/icon-512.png" },
    },
    mainEntityOfPage: `https://pokemonvgcteamreport.com/champions/${mega.slug}`,
  }}
/>
{teams.length > 0 && (
  <JsonLd
    data={{
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Top ${mega.displayName} VGC teams`,
      numberOfItems: teams.length,
      itemListElement: teams.slice(0, 10).map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://pokemonvgcteamreport.com/s/${t.id}`,
        name: t.teamName || t.tournamentName || `${mega.displayName} team`,
      })),
    }}
  />
)}
```

---

## DRAFT 5 — Per-share VideoObject + SportsTeam JSON-LD (`/s/[id]`)

The biggest competitive gap. Limitless VGC and Pikalytics do NOT use SportsTeam schema — we can own this entity. For each public share, emit:

```tsx
<JsonLd
  data={{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "VGC Team Report",
        item: "https://pokemonvgcteamreport.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "FAQ",
        item: "https://pokemonvgcteamreport.com/faq",
      },
    ],
  }}
/>
```

---

## DRAFT 4: Add BreadcrumbList Schema to /tournaments
**File:** `/src/app/tournaments/page.tsx`
    "@type": "SportsTeam",
    name: teamName || `${creatorName}'s VGC Team`,
    sport: "Pokémon Video Game Championship (VGC)",
    url: `https://pokemonvgcteamreport.com/s/${id}`,
    member: pokemon.map((p) => ({
      "@type": "Person",   // schema.org doesn't have GameCharacter; Person is the closest indexable type
      name: p.species,
    })),
    ...(tournamentName ? {
      memberOf: {
        "@type": "SportsEvent",
        name: tournamentName,
        ...(placement ? { award: `Top ${placement}` } : {}),
      },
    } : {}),
    coach: creatorName ? { "@type": "Person", name: creatorName } : undefined,
  }}
/>
```

Plus a CreativeWork wrapper so it ranks as content (not just an app):

```tsx
<JsonLd
  data={{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "VGC Team Report",
        item: "https://pokemonvgcteamreport.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tournaments",
        item: "https://pokemonvgcteamreport.com/tournaments",
      },
    ],
  }}
/>
```

---

## DRAFT 5: Fix Sitemap lastModified for Static Pages
**File:** `/src/app/sitemap.ts`
**Issue:** Using `new Date().toISOString()` signals false freshness on every crawl.

```ts
// Current:
const now = new Date().toISOString();

// PROPOSED — use a build-time date that only changes when actually deployed:
const BUILD_DATE = "2026-05-25T00:00:00.000Z"; // Update on each deploy
const staticPages: MetadataRoute.Sitemap = [
  { url: BASE, changeFrequency: "weekly", priority: 1.0, lastModified: BUILD_DATE },
  { url: `${BASE}/explore`, changeFrequency: "daily", priority: 0.9, lastModified: BUILD_DATE },
  // ... etc
];
```

**Alternative (dynamic but stable):** Use `process.env.VERCEL_GIT_COMMIT_SHA` timestamp or a `lastmod.json` file generated at build time.

---

## DRAFT 6: Add twitter:site Handle
**File:** `/src/app/layout.tsx`

```ts
// Add to the twitter section of metadata:
twitter: {
  card: "summary_large_image",
  site: "@VGCTeamReport", // or whatever the actual handle is
  title: "VGC Team Report — Build, Share & Discover Pokemon Teams",
  description: "...",
  images: [...],
},
```

---

## DRAFT 7: /explore Page — Add Server-Rendered Intro Text
**File:** `/src/app/explore/page.tsx`
**Issue:** /explore has no visible text content for crawlers — just the CollectionPage schema and dynamic client components.

```tsx
// Add between <JsonLd> and <ExploreContent />:
<section className="max-w-5xl mx-auto px-4 pt-6 pb-2">
  <h1 className="text-2xl font-bold text-text-primary">
    Explore VGC Team Reports
  </h1>
  <p className="text-sm text-text-secondary mt-2 max-w-2xl">
    Browse competitive Pokemon VGC team reports shared by players from tournaments around the world.
    Find Pokemon Champions Regulation M-A team builds, open team sheets, matchup plans, and 
    SP spreads from Regional Championships, International Championships, and online ladders.
  </p>
</section>
```

---

## DRAFT 8: /open-team-sheet Landing Page (New Page)
**File:** `/src/app/open-team-sheet/page.tsx` (new)
**Target keywords:** "VGC open team sheet", "OTS generator Pokemon", "open team sheet VGC 2026"
**Competition:** LOW — no dominant competitor owns this query

```tsx
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "VGC Open Team Sheet Generator — Pokemon Champions OTS 2026",
  description:
    "Generate and share VGC open team sheets (OTS) for Pokemon Champions Regulation M-A. Create tournament-ready OTS from your Showdown paste — free, instant, no sign-up required.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/open-team-sheet" },
  openGraph: {
    title: "VGC Open Team Sheet Generator — Pokemon Champions OTS 2026",
    description:
      "Generate and share VGC open team sheets (OTS) for Pokemon Champions Regulation M-A. Create tournament-ready OTS from your Showdown paste.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/open-team-sheet",
  },
  keywords: [
    "VGC open team sheet",
    "OTS generator",
    "Pokemon Champions OTS",
    "open team sheet VGC 2026",
    "tournament team sheet",
    "OTS Pokemon",
    "VGC team sheet maker",
    "Regulation M-A open team sheet",
  ],
};

export default function OpenTeamSheetPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "VGC Team Report", item: "https://pokemonvgcteamreport.com" },
            { "@type": "ListItem", position: 2, name: "Open Team Sheet Generator", item: "https://pokemonvgcteamreport.com/open-team-sheet" },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "VGC Open Team Sheet Generator",
          applicationCategory: "GameApplication",
          operatingSystem: "Any",
          description: "Generate tournament-ready VGC open team sheets (OTS) for Pokemon Champions. Paste your team, get a shareable OTS — no sign-up required.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          url: "https://pokemonvgcteamreport.com/open-team-sheet",
        }}
      />
      {/* Page content: intro + CTA to paste a team + FAQ about OTS */}
      <main className="min-h-screen max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">VGC Open Team Sheet Generator</h1>
        <p className="text-text-secondary mt-3 max-w-2xl">
          Generate tournament-ready open team sheets for Pokemon Champions VGC (Regulation M-A).
          Paste your Showdown export or PokePaste URL below to instantly create a shareable OTS
          with your team&apos;s Pokemon, moves, items, and abilities — no EVs, IVs, or nature visible to opponents.
        </p>
        {/* TODO: Paste input component + OTS preview */}
      </main>
    </>
  );
}
```

---

## DRAFT 9: /guides/how-to-write-a-vgc-team-report (New Page)
**File:** `/src/app/guides/how-to-write-a-vgc-team-report/page.tsx` (new)
**Target keywords:** "how to write a VGC team report", "VGC team report template", "team report guide"
**Competition:** LOW — no dominant competitor

```tsx
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "How to Write a VGC Team Report — Complete Guide 2026",
  description:
    "Step-by-step guide to writing a competitive VGC team report for Pokemon Champions. Includes team report template, matchup plan format, damage calc documentation, and SP spread notation.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/guides/how-to-write-a-vgc-team-report" },
  openGraph: {
    title: "How to Write a VGC Team Report — Complete Guide 2026",
    description: "Step-by-step guide to writing a competitive VGC team report for Pokemon Champions.",
    type: "article",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/guides/how-to-write-a-vgc-team-report",
  },
  keywords: [
    "how to write a VGC team report",
    "VGC team report template",
    "team report guide",
    "competitive Pokemon team report",
    "VGC report format",
    "matchup plan template",
    "Pokemon Champions team report",
  ],
};

// Page should include:
// - Article schema with datePublished, dateModified, author
// - HowTo schema with detailed steps
// - FAQPage schema for "how long should a report be", "do I need tournament results"
// - BreadcrumbList: Home > Guides > How to Write a VGC Team Report
// - ~2,000-3,000 words of editorial content
// - Internal links to /explore (examples), / (CTA to build), /champions (format info)
```

---

## DRAFT 10: /speed-tiers Page (New — Highest ROI)
**File:** `/src/app/speed-tiers/page.tsx` (new)
**Target keywords:** "VGC speed tiers 2026", "Pokemon Champions speed tiers", "Regulation M-A speed chart"
**Competition:** MEDIUM — Pikalytics + Turnadus own this but from a calculator angle, not a reference guide angle

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pokemon Champions VGC Speed Tiers — Regulation M-A 2026",
  description:
    "Complete speed tier reference for Pokemon Champions VGC (Regulation M-A). Every Mega Pokemon speed stat, key SP investment benchmarks, Tailwind values, and Trick Room tiers.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/speed-tiers" },
  openGraph: {
    title: "Pokemon Champions VGC Speed Tiers — Regulation M-A 2026",
    description: "Complete speed tier reference for VGC 2026. All Mega Pokemon speeds + benchmarks.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/speed-tiers",
  },
  keywords: [
    "VGC speed tiers 2026",
    "Pokemon Champions speed tiers",
    "Regulation M-A speed chart",
    "Mega Pokemon speed stats",
    "VGC speed calculator",
    "Tailwind speed tiers VGC",
    "Trick Room speed tiers",
  ],
};

// Page should:
// - Be server-rendered (SSG) from pokemon data already in codebase
// - Include BreadcrumbList + FAQPage schema
// - Table sorted by speed stat (descending)
// - Columns: Pokemon | Base Speed | 0 SP | 16 SP | 32 SP | Tailwind
// - Key benchmarks highlighted (e.g., "outspeeds max Speed Sneasler")
// - Internal links to each /champions/[pokemon] page
// - ~800-1200 words of editorial content above/below the data table
```

---

## DRAFT 11: /teams Programmatic Top Teams Page (New)
**File:** `/src/app/teams/page.tsx` (new)
**Target keywords:** "best VGC teams 2026", "top Pokemon Champions teams", "VGC tournament teams"
**Competition:** MEDIUM — VGenC and Pikalytics rank but from tournament database angle

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top VGC Teams 2026 — Pokemon Champions Team Reports",
  description:
    "Browse the most popular Pokemon Champions VGC team reports. Top-performing Regulation M-A teams ranked by community views, with full team breakdowns, matchup plans, and SP spreads.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/teams" },
  openGraph: {
    title: "Top VGC Teams 2026 — Pokemon Champions Team Reports",
    description: "Most popular VGC team reports from the Pokemon Champions competitive community.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/teams",
  },
  keywords: [
    "best VGC teams 2026",
    "top Pokemon Champions teams",
    "VGC tournament teams",
    "popular VGC team builds",
    "Pokemon Champions Regulation M-A teams",
    "VGC team reports ranked",
  ],
};

// Page should:
// - Be ISR (revalidate: 3600) pulling from shares table
// - Show top 50 public reports by view_count DESC
// - Include ItemList schema
// - Filterable by archetype, tournament, Mega Pokemon
// - Internal links to each /s/[id] share page
// - Differentiate from /explore: /teams = "best of", /explore = "browse all"
```

---

## DRAFT 12: Add SP Spread FAQ Items to /faq
**File:** `/src/app/faq/page.tsx`
**Target:** "what are SP spreads", "EV vs SP Pokemon Champions"

```ts
// Add to FAQ_ITEMS array:
{
  question: "What are SP spreads in Pokemon Champions?",
  answer:
    "In Pokemon Champions, the traditional EV (Effort Value) system is replaced by Stat Points (SP). Each Pokemon has 66 SP to distribute across six stats, with a maximum of 32 SP per stat. An 'SP spread' describes how those points are allocated — for example, '32 HP / 16 Atk / 18 Spe' means maxing HP, moderate Attack investment, and enough Speed to outpace specific threats. VGC Team Report lets you document and share your SP spread reasoning alongside damage calcs and matchup plans.",
},
{
  question: "How do Pokemon Champions SP spreads differ from EV spreads in Scarlet & Violet?",
  answer:
    "The key differences are: (1) Total budget: 66 SP vs 510 EVs. (2) Per-stat cap: 32 SP vs 252 EVs. (3) Scaling: each SP gives exactly 1 stat point at level 50, making calculations simpler. (4) No nature multipliers in the traditional sense — Natures are built differently in Pokemon Champions. This means competitive team building focuses on precise benchmark-hitting (e.g., '18 Spe to outspeed base 100 at 0 SP') rather than the 4/252/252 cookie-cutter spreads common in previous VGC formats.",
},
```

---

## DRAFT 13: Internal Linking Widget for /champions/[pokemon] Pages
**Concept:** Add a "Teams Using [Pokemon]" section at the bottom of each Mega landing page, pulling from public shares.

```tsx
// At the bottom of MegaLandingContent.tsx, after existing content:
<section className="mt-12">
  <h2 className="text-xl font-bold">Top Teams Using {mega.displayName}</h2>
  <p className="text-sm text-text-secondary mt-1">
    Browse competitive team reports featuring {mega.displayName} from the VGC community.
  </p>
  {/* List of 5-10 report cards linking to /s/[id] */}
  <a href="/explore?pokemon={mega.baseName}" className="text-accent font-semibold text-sm mt-4 inline-block">
    See all {mega.displayName} teams →
  </a>
</section>
```

This creates a powerful internal linking network: /champions/[pokemon] links to /s/[id] share pages, which link back via their species-based metadata. This bidirectional linking helps Google discover and rank both page types.

---

*End of drafts. All changes require explicit user approval before implementation.*
    "@type": "Article",
    headline: title,
    author: { "@type": "Person", name: creatorName || "Anonymous" },
    datePublished: createdAt,
    dateModified: updatedAt,
    image: `https://pokemonvgcteamreport.com/s/${id}/opengraph-image`,
    keywords: [...species, tags?.regulation, ...(tags?.archetype || [])].filter(Boolean).join(", "),
  }}
/>
```

---

## DRAFT 6 — Page-level on-page wins

### a) `/tournaments` — add visible H1 + intro copy block above the fold
Right now the page metadata says "VGC Tournament Results Archive" but the rendered H1 (in `TournamentsContent`) needs to lead with the query, e.g.:

```tsx
<h1 className="text-3xl font-extrabold">VGC Tournament Results — Regionals, Internationals & Worlds 2026</h1>
<p className="text-text-secondary mt-2 max-w-2xl">
  Browse team reports from every major Pokémon VGC tournament of the 2026 season —
  including the Indianapolis Regional Championships (Pokémon Champions Reg M-A debut)
  and the upcoming San Francisco World Championships.
</p>
```

### b) `/explore` — add filter-aware H1 from query params
When `?regulation=M-A` is set, render `<h1>Pokémon Champions Reg M-A Teams</h1>` (and update `<title>` via generateMetadata). Targets long-tail filtered queries directly.

### c) `/faq` — extend FAQPageJsonLd with 4 new high-volume Q&As
Add to `FAQPageJsonLd()` in `JsonLd.tsx`:
1. "What is the best Pokémon for Reg M-A?"
2. "How do I make an open team sheet for VGC?"
3. "What does SP mean in a Pokémon team report?"
4. "How do I calculate damage in VGC?"

### d) Image alt text audit on `/champions/[pokemon]` Pokémon sprite
Currently sprite `<img>` likely uses `alt={mega.displayName}`. Change to `alt="${mega.displayName} sprite — Pokémon Champions Reg M-A Mega Evolution"` for image search ranking.

### e) Add `lastModified` to `/s/[id]` sitemap entries (already done) — but also bump priority of pages with >100 views to 0.8.

---

## DRAFT 7 — Internal linking opportunities

The internal link graph is sparse. Add:
- From `/champions` index → link to top 3 most-used Megas with descriptive anchor text ("See top Mega Kangaskhan teams").
- From every `/s/[id]` → link to `/champions/{mega-slug}` for each Mega-holding Pokémon ("Browse more Mega Salamence teams").
- From `/faq` → link to `/champions`, `/tournaments`, `/explore` with semantically rich anchors.
- Footer (every page): add link list "Browse by format: [Reg G] [Reg H] [Reg I] [Reg M-A Champions]" — each going to `/explore?regulation=X`.

---

## DRAFT 8 — Sitemap improvements (`src/app/sitemap.ts`)

Currently includes shares + creators + champion Megas. Missing:
- `/explore?regulation=M-A`, `/explore?regulation=G`, `/explore?regulation=H` filtered views
- Tournament-specific URLs (once `/tournaments/[slug]` exists)
- Archetype hub URLs (once `/archetypes/[type]` exists — drafted in VGC-62)

Also: 5000-share LIMIT may eventually clip indexed teams. Move to multi-sitemap-index pattern if approaching cap.

---

## NOTES FOR WAVE 2

- Test all JSON-LD with https://search.google.com/test/rich-results before merging.
- BreadcrumbList must use absolute URLs.
- SportsTeam is unusual for Pokémon — monitor GSC for any structured-data warnings; fall back to Game schema if rejected.
- Keep the existing FAQPageJsonLd, HowToSchema, OrganizationJsonLd, WebSiteSchema, SportsEventJsonLd — all are correctly implemented today.
