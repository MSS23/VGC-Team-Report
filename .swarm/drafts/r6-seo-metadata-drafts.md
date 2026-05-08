# SEO Metadata Drafts — VGC Team Report

> READ-ONLY research output. Do NOT publish these changes without explicit user sign-off.
> Generated: 2026-05-08

---

## 1. Root Layout — Add `keywords` + `twitter:creator` + WebSite SearchAction Schema

### layout.tsx metadata additions

```ts
// Add to existing metadata object in src/app/layout.tsx
keywords: [
  "VGC team report",
  "Pokemon VGC team builder",
  "competitive Pokemon team",
  "Pokemon Champions team report",
  "VGC 2026",
  "Regulation M-A",
  "Mega Evolution VGC",
  "EV spread VGC",
  "Pokemon damage calculator",
  "VGC matchup plans",
  "Showdown paste",
  "competitive Pokemon team builder",
],
twitter: {
  card: "summary_large_image",
  title: "VGC Team Report — Build, Share & Discover Pokemon Teams",
  description: "The home for competitive Pokemon VGC team reports. Build, share, and explore team breakdowns from players around the world.",
  // TODO: add twitter:site when @handle is confirmed
  // site: "@VGCTeamReport",
},
```

### WebSite schema with SearchAction (Sitelinks Searchbox candidate)

Add a second `<JsonLd>` block in `layout.tsx`:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "VGC Team Report",
  "url": "https://pokemonvgcteamreport.com",
  "description": "Build, share, and discover competitive Pokemon VGC team reports with damage calcs, EV spreads, and matchup plans.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://pokemonvgcteamreport.com/explore?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

---

## 2. Home Page (/) — Add `keywords` to root metadata

```ts
// Add to metadata in src/app/layout.tsx (or a dedicated page metadata export)
// The home page is "use client" so static metadata lives in layout only.
// Already covered by layout keywords above.
```

---

## 3. Explore Page — Strengthen metadata + keywords

```ts
// src/app/explore/page.tsx — replace existing metadata
export const metadata: Metadata = {
  title: "Explore VGC Teams",
  description:
    "Browse Pokemon VGC team reports shared by competitive players from tournaments around the world. Search by Pokemon, tournament, creator, or Regulation M-A archetype.",
  keywords: [
    "explore VGC teams",
    "VGC team database",
    "competitive Pokemon teams",
    "VGC tournament teams 2026",
    "Pokemon Champions teams",
    "Regulation M-A teams",
    "Mega Evolution teams",
    "Incineroar VGC team",
    "Garchomp VGC team",
    "top VGC teams",
    "VGC team search",
  ],
  alternates: { canonical: "https://pokemonvgcteamreport.com/explore" },
  openGraph: {
    title: "Explore VGC Teams — VGC Team Report",
    description:
      "Browse and discover competitive Pokemon VGC team reports from tournaments worldwide. Filter by Pokemon, archetype, or regulation.",
    type: "website",
    siteName: "VGC Team Report",
    images: [{ url: "/explore/opengraph-image", width: 1200, height: 630 }],
  },
};
```

---

## 4. Champions Page — Strengthen description + add ItemList schema

```ts
// src/app/champions/page.tsx — enhanced description
description:
  "Explore all legal Mega Evolutions for Pokemon Champions VGC 2026 Regulation M-A. Get EV spreads, movesets, damage calcs, speed tiers, and competitive teams for every Mega Pokemon.",

// Add ItemList JsonLd for the champion index listing all Mega slugs
// This helps Google index the /champions/{slug} pages faster via structured data
```

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Legal Mega Evolutions — Pokemon Champions VGC Regulation M-A",
  "url": "https://pokemonvgcteamreport.com/champions",
  "numberOfItems": 59,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Mega Kangaskhan VGC Guide",
      "url": "https://pokemonvgcteamreport.com/champions/mega-kangaskhan"
    }
    // ... one entry per slug generated from MEGA_POKEMON_LIST
  ]
}
```

---

## 5. Per-Mega Champion Pages — Add SoftwareApplication / VideoGame schema + OG images

```ts
// src/app/champions/[pokemon]/page.tsx — add to generateMetadata
// Add og:image pointing to the per-pokemon OG image route once it's stable
openGraph: {
  ...existingOg,
  images: [{ url: `/champions/${mega.slug}/opengraph-image`, width: 1200, height: 630 }],
},

// Also add: SoftwareApplication or VideoGame type pointing to the
// Pokemon Champions game to create entity associations
```

```json
{
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "name": "Pokemon Champions",
  "gameEdition": "VGC 2026 Regulation M-A",
  "url": "https://pokemonvgcteamreport.com/champions",
  "applicationCategory": "Game",
  "about": {
    "@type": "Thing",
    "name": "Mega Evolution VGC"
  }
}
```

---

## 6. Shared Report Pages (/s/[id]) — Add og:image generation

Current state: `images: []` explicitly suppresses OG images due to past loading failures with edge runtime + sprite CDN.

### Proposed fix strategy (if OG image reliability is improved):
- Use a static placeholder image (no dynamic sprite fetching) for the base card
- Overlay team species text only (no sprites) — eliminates CDN dependency
- Or: use a Next.js Route Handler at `/api/og/[id]` with a timeout guard

```ts
// When OG image is stable, restore in s/[id]/page.tsx:
openGraph: {
  title,
  description,
  type: "website",
  siteName: "VGC Team Report",
  images: [{ url: `/api/og/${id}`, width: 1200, height: 630 }],
},
```

---

## 7. Creator Pages — Enrich metadata

```ts
// src/app/creator/[name]/page.tsx — current description is thin
// Proposed:
description: `View all public competitive Pokemon VGC team reports by ${creator}. Browse their teams, EV spreads, matchup plans, and tournament results.`,
keywords: [
  `${creator} VGC teams`,
  `${creator} Pokemon team`,
  "VGC team report creator",
  "competitive Pokemon player",
],
```

---

## 8. Keyword Gap Priorities — Target List

### High-volume gaps vs competitors

| Keyword Cluster | Competitor Owning It | Our Gap |
|---|---|---|
| "Pokemon Champions damage calc" | Pikalytics, Porygon Labs | No dedicated calc page |
| "VGC speed tier [Pokemon]" | MetaVGC, Pikalytics | Not surfaced as standalone content |
| "Mega Evolution VGC guide" | vgcguide.com, VGCCoach.pro | Champions pages exist but need depth |
| "replica team code Pokemon Champions" | Victory Road, games.gg | No replica/rental code content |
| "VGC team tier list 2026" | Pokemon-zone.com, showdowntier.com | No tier list content |
| "Pokemon Champions Regulation M-A teams" | Pikalytics, Limitless VGC | Explore page partially covers |
| "VGC tournament results 2026" | Limitless VGC | No tournament result tracking |
| "competitive Pokemon EV spread guide" | vgcguide.com | No tutorial/guide content |
| "Showdown paste VGC" | Falinks, pokepast.es | Import feature exists, not indexed content |
| "VGC team builder free" | ChampionsBuilder, Pikalytics | Builder UX exists but weak keyword targeting |

---

## 9. Sitemap Enhancements

Current sitemap is good. Missing entries to add:

```ts
// src/app/sitemap.ts additions
{ url: `${BASE}/explore`, changeFrequency: "hourly", priority: 0.95 }, // bump from daily — Explore is the discovery page
{ url: `${BASE}/champions`, changeFrequency: "weekly", priority: 0.9 },
// Consider adding: /feedback, /dashboard if they have public-facing content
```

---

## 10. robots.txt — Minor Enhancement

```
# Current:
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://pokemonvgcteamreport.com/sitemap.xml

# Proposed additions:
Disallow: /api/
Disallow: /dashboard  # if dashboard is auth-gated, avoid indexing
Disallow: /embed/     # if embed route exists and is not for public consumption

# Add crawl-delay for aggressive bots (optional)
User-agent: AhrefsBot
Crawl-delay: 10
User-agent: SemrushBot
Crawl-delay: 10
```
