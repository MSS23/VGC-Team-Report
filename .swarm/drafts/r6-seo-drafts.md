# SEO Implementation Drafts — VGC Team Report (May 26, 2026)

**Status:** DRAFT ONLY — Do not implement without review.

---

## Draft 1: Root Layout Keywords Meta

**File:** `src/app/layout.tsx`
**Action:** Add `keywords` array to the existing `metadata` export.

```typescript
// Add inside the existing metadata export, after the robots field:
keywords: [
  "VGC team report",
  "VGC team builder",
  "Pokemon team sharing",
  "VGC team analysis",
  "Pokemon Champions team report",
  "Mega Evolution VGC",
  "competitive Pokemon teams",
  "VGC 2026",
  "Regulation M-A teams",
  "open team sheet generator",
  "VGC damage calculator",
  "VGC speed tiers",
  "SP spread builder",
  "PokePaste import",
  "Pokemon matchup planner",
],
```

---

## Draft 2: Homepage H1 Tag

**File:** `src/app/page.tsx`
**Action:** Add a visible or sr-only `<h1>` near the top of the rendered content.

```tsx
{/* Add as first child inside the main content area, before PasteInput */}
<h1 className="sr-only">
  VGC Team Report — Build & Share Competitive Pokemon VGC Teams
</h1>
```

Alternative (visible H1 if there's a hero section):
```tsx
<h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
  Build & Share Your VGC Team Report
</h1>
<p className="text-muted text-lg mb-8">
  The free tool for competitive Pokemon VGC team breakdowns — matchup plans, damage calcs, speed tiers, and one-click sharing.
</p>
```

---

## Draft 3: Compare Page Metadata Fix

**File:** `src/app/compare/page.tsx`
**Action:** Replace "EV spreads" with "SP spreads" in title, description, and OG tags.

```typescript
export const metadata: Metadata = {
  title: "Compare VGC Teams | VGC Team Report",
  description:
    "Compare two VGC team reports side by side — see differences in Pokemon, movesets, items, and SP spreads.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/compare" },
  openGraph: {
    title: "Compare VGC Teams | VGC Team Report",
    description:
      "Compare two VGC team reports side by side — see differences in Pokemon, movesets, items, and SP spreads.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/compare",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare VGC Teams | VGC Team Report",
    description:
      "Compare two VGC team reports side by side — see differences in Pokemon, movesets, items, and SP spreads.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
};
```

---

## Draft 4: BreadcrumbList Schema Component

**File:** `src/components/seo/JsonLd.tsx`
**Action:** Add a reusable BreadcrumbJsonLd component.

```tsx
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
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

**Usage on /explore page:**
```tsx
<BreadcrumbJsonLd items={[
  { name: "Home", url: "https://pokemonvgcteamreport.com" },
  { name: "Explore VGC Teams", url: "https://pokemonvgcteamreport.com/explore" },
]} />
```

**Usage on /faq page:**
```tsx
<BreadcrumbJsonLd items={[
  { name: "Home", url: "https://pokemonvgcteamreport.com" },
  { name: "FAQ", url: "https://pokemonvgcteamreport.com/faq" },
]} />
```

**Usage on /tournaments page:**
```tsx
<BreadcrumbJsonLd items={[
  { name: "Home", url: "https://pokemonvgcteamreport.com" },
  { name: "Tournaments", url: "https://pokemonvgcteamreport.com/tournaments" },
]} />
```

**Usage on /champions page:**
```tsx
<BreadcrumbJsonLd items={[
  { name: "Home", url: "https://pokemonvgcteamreport.com" },
  { name: "Pokemon Champions", url: "https://pokemonvgcteamreport.com/champions" },
]} />
```

---

## Draft 5: ItemList Schema for Explore Page

**File:** `src/components/seo/JsonLd.tsx`
**Action:** Add ItemList schema component.

```tsx
export interface ItemListEntry {
  name: string;
  url: string;
  position: number;
}

export function ItemListJsonLd({ name, items }: { name: string; items: ItemListEntry[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name,
        numberOfItems: items.length,
        itemListElement: items.map((item) => ({
          "@type": "ListItem",
          position: item.position,
          name: item.name,
          url: item.url,
        })),
      }}
    />
  );
}
```

**Usage on explore page (server component wrapper needed):**
```tsx
<ItemListJsonLd
  name="VGC Team Reports"
  items={topTeams.map((team, i) => ({
    name: team.title || "VGC Team Report",
    url: `https://pokemonvgcteamreport.com/s/${team.id}`,
    position: i + 1,
  }))}
/>
```

---

## Draft 6: Sitemap lastModified Fix

**File:** `src/app/sitemap.ts`
**Action:** Replace `new Date().toISOString()` with a fixed build date constant.

```typescript
// At the top of the file, define a build-time constant:
const BUILD_DATE = new Date().toISOString(); // frozen at build time for SSG

// For static pages, use specific dates or the build date:
const CONTENT_DATES: Record<string, string> = {
  "/": "2026-05-26T00:00:00Z",
  "/explore": BUILD_DATE,
  "/champions": "2026-05-20T00:00:00Z",
  "/faq": "2026-05-15T00:00:00Z",
  "/feedback": "2026-04-01T00:00:00Z",
  "/tournaments": BUILD_DATE,
  "/changelog": "2026-05-20T00:00:00Z",
  "/privacy": "2026-04-01T00:00:00Z",
  "/terms": "2026-04-01T00:00:00Z",
};

// In the staticPages array, use:
{ url: BASE, changeFrequency: "weekly", priority: 1.0, lastModified: CONTENT_DATES["/"] },
// etc.
```

Note: If the sitemap is regenerated at build time (SSG), `new Date()` is actually frozen at build time and is acceptable. But if it's an ISR/SSR route, the timestamp changes on every request, which is the real issue. Verify which rendering mode the sitemap uses.

---

## Draft 7: Standalone Tool Landing Page — Speed Tiers

**File:** `src/app/tools/speed-tiers/page.tsx` (NEW FILE)
**Action:** Create a lightweight landing page that wraps the existing speed tier component.

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VGC Speed Tiers — Pokemon Champions Regulation M-A | VGC Team Report",
  description:
    "Free VGC speed tier calculator for Pokemon Champions Regulation M-A. Compare speed stats, find optimal SP spreads, and see who outspeeds who in the current meta.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/tools/speed-tiers" },
  keywords: [
    "VGC speed tiers",
    "Pokemon Champions speed tiers",
    "VGC speed calculator",
    "Regulation M-A speed tiers",
    "who outspeeds VGC",
    "Pokemon speed comparison",
    "SP spread speed VGC",
    "VGC 2026 speed tiers",
  ],
  openGraph: {
    title: "VGC Speed Tiers — Pokemon Champions Regulation M-A",
    description:
      "Free speed tier calculator for VGC. Compare speed stats and find optimal SP spreads for Regulation M-A.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/tools/speed-tiers",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Speed Tiers" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VGC Speed Tiers — Pokemon Champions Regulation M-A",
    description: "Free speed tier calculator for VGC 2026. Compare speeds and find optimal SP spreads.",
  },
};
```

Page content structure:
```tsx
export default function SpeedTiersPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">VGC Speed Tiers — Regulation M-A</h1>
      <p className="text-muted mb-8">
        Compare speed stats for all Pokemon in the current VGC format.
        Find the optimal SP spread to outspeed key threats, or check
        if your team's speed benchmarks hold up against the meta.
      </p>

      {/* Existing speed tier component goes here */}

      {/* FAQ section for long-tail keywords */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold mb-4">Speed Tiers FAQ</h2>
        {/* Q&A items with FAQPage schema */}
      </section>
    </main>
  );
}
```

---

## Draft 8: Standalone Tool Landing Page — Damage Calculator

**File:** `src/app/tools/damage-calculator/page.tsx` (NEW FILE)

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VGC Damage Calculator — Pokemon Champions 2026 | VGC Team Report",
  description:
    "Free Pokemon VGC damage calculator for Regulation M-A. Calculate damage ranges with Mega Evolution, Stat Points, abilities, items, and field conditions. Updated for 2026.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/tools/damage-calculator" },
  keywords: [
    "VGC damage calculator",
    "Pokemon Champions damage calc",
    "damage calculator Regulation M-A",
    "Pokemon damage range calculator",
    "VGC 2026 damage calc",
    "Mega Evolution damage calculator",
    "competitive Pokemon damage calc",
  ],
  openGraph: {
    title: "VGC Damage Calculator — Pokemon Champions 2026",
    description:
      "Free VGC damage calculator with Mega Evolution and SP support for Regulation M-A.",
    type: "website",
    siteName: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com/tools/damage-calculator",
  },
};
```

---

## Draft 9: Person Schema for Creator Pages

**File:** `src/app/creator/[name]/page.tsx`
**Action:** Add Person schema to the page render.

```tsx
import { JsonLd } from "@/components/seo/JsonLd";

// Inside the page component render:
<JsonLd
  data={{
    "@context": "https://schema.org",
    "@type": "Person",
    name: creator,
    url: `https://pokemonvgcteamreport.com/creator/${encodeURIComponent(creator)}`,
    description: `Competitive Pokemon VGC player. View ${creator}'s team reports, open team sheets, and tournament results.`,
    mainEntityOfPage: {
      "@type": "CollectionPage",
      name: `${creator}'s VGC Team Reports`,
    },
  }}
/>
```

---

## Draft 10: /compare and /tools/* Added to Sitemap

**File:** `src/app/sitemap.ts`
**Action:** Add missing public tool pages.

```typescript
// Add to staticPages array:
{ url: `${BASE}/compare`, changeFrequency: "monthly", priority: 0.6, lastModified: now },
// Future tool pages:
// { url: `${BASE}/tools/speed-tiers`, changeFrequency: "weekly", priority: 0.7, lastModified: now },
// { url: `${BASE}/tools/damage-calculator`, changeFrequency: "weekly", priority: 0.7, lastModified: now },
```

---

## Draft 11: Internal Linking on Explore Page

**Action:** Add a "Popular Categories" section at the top of the explore page with links to filtered views.

```tsx
<section className="mb-8">
  <h2 className="text-xl font-bold mb-3">Popular Categories</h2>
  <div className="flex flex-wrap gap-2">
    <Link href="/explore?q=mega+charizard" className="chip">Mega Charizard Teams</Link>
    <Link href="/explore?q=mega+garchomp" className="chip">Mega Garchomp Teams</Link>
    <Link href="/explore?q=mega+kangaskhan" className="chip">Mega Kangaskhan Teams</Link>
    <Link href="/explore?q=incineroar" className="chip">Incineroar Teams</Link>
    <Link href="/explore?q=sneasler" className="chip">Sneasler Teams</Link>
    <Link href="/champions" className="chip">Champions Format</Link>
  </div>
</section>
```

---

## Draft 12: FAQ Page SP-Related Questions

**File:** `src/app/faq/page.tsx`
**Action:** Add these Q&A entries to the FAQ_ITEMS array and the JSON-LD schema.

```typescript
{
  question: "What are Stat Points (SP) in Pokemon Champions?",
  answer: "Stat Points (SP) replace EVs in Pokemon Champions. Each Pokemon has 66 SP to distribute across its six stats, with a maximum of 32 SP in any single stat. Unlike the traditional 508 EV / 252-per-stat system, SP spreads require a completely different approach to team building and optimization."
},
{
  question: "How do SP spreads differ from EV spreads in VGC?",
  answer: "In traditional VGC (Scarlet & Violet), Pokemon have 508 EVs with a 252-per-stat cap. In Pokemon Champions, the SP system gives you 66 total points with a 32-per-stat cap. This means spreads are tighter and every point matters more. VGC Team Report's SP Spread Builder helps you optimize your Champions team's stat distribution with damage calc integration."
},
{
  question: "Can I use my old EV spreads in Pokemon Champions Regulation M-A?",
  answer: "No. Pokemon Champions uses a completely different stat system called Stat Points (SP). Your existing EV knowledge transfers conceptually — you still want to hit specific speed benchmarks and survive key attacks — but the actual numbers are different. Use our SP Spread Builder to convert your team building approach to the Champions format."
},
```
