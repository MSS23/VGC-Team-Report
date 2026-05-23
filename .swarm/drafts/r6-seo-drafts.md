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
