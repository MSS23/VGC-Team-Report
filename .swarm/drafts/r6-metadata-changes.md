# R6 Metadata Drafts — 2026-05-24

**Status:** DRAFT ONLY — do not publish. All strings need a SERP-preview pass before deploy.
**Source audit:** `.swarm/r6-seo-audit.md`

---

## 1. Root layout (`src/app/layout.tsx` lines 38–92)

### Current title
```
VGC Team Report — Build & Share Pokémon VGC Teams | Pokemon Champions 2026
```
89 chars — truncates in SERP at ~60.

### Draft (54 chars, brand at end for template chain)
```ts
title: {
  default: "Pokemon VGC Team Builder & Reports — Champions 2026",
  template: "%s | VGC Team Report",
},
```
Rationale: "team builder" matches the dominant query (gap #3); "Pokemon" front-loaded; "Champions 2026" retained for format intent.

### Current description (240 chars)
```
The free VGC team report builder — share your VGC team with notes, matchup plans, and damage calcs. Supports Pokémon Champions, Mega Evolution, and all VGC team builder formats.
```

### Draft description (157 chars)
```ts
description: "Free Pokemon VGC team builder for Regulation M-A, H, I & Champions 2026. Share team reports with EV spreads, damage calcs, matchup plans, and speed tiers.",
```
Rationale: drops self-referential "VGC team report builder" tautology; adds "EV spreads" synonym (gap #2); enumerates regulations (gaps #4, #5).

---

## 2. Champions Mega landing (`src/app/champions/[pokemon]/page.tsx` lines 38–77)

### Current title pattern
```
{displayName} VGC Guide — SP Spreads, Movesets & Teams
```

### Draft (adds "EV spread" synonym; keeps under 60 for the longest legal Mega name)
```ts
const title = `${mega.displayName} VGC — EV Spreads, Counters & Teams`;
```
Rationale: "EV spread" is 30–50× higher search volume than our coined "SP spread"; "Counters" opens gap #1 surface. Still 50–58 chars for every Mega in the dataset.

### Add to `keywords` array (lines 59–76)
```ts
`${mega.displayName} counters`,
`${mega.displayName} EV spread`,
`${mega.displayName} weaknesses`,
`how to beat ${mega.displayName}`,
`${mega.displayName} Pokemon Champions team`,
```

### Add 7th FAQ item (around line 224, before the conditional teams entry)
```ts
{
  q: `What counters ${mega.displayName} in VGC?`,
  a: `${mega.displayName} is weak to ${weaknesses.join(", ")}-type moves. Common Regulation M-A counters include Pokemon that resist ${typeLine} and outspeed base ${pokemonData.baseStats.spe}.`,
},
```
(Requires deriving `weaknesses` from `pokemonData.types` against the type chart — keep grounded; no hallucinated specific counter names.)

---

## 3. Share page (`src/app/s/[id]/page.tsx` lines 38–51)

### Current title logic
```ts
if (tournamentName && placement) {
  title = `${tournamentName} — ${placement} | VGC Team Report`;
}
```
Problem: "Indianapolis Regional Championships 2026 — 1st Place | VGC Team Report" = 71 chars, truncates the brand.

### Draft (length-aware reorder)
```ts
const brand = " | VGC Team Report";
const TARGET = 60;
let core: string;
if (speciesLine && tournamentName && placement) {
  core = `${speciesLine} — ${placement} ${tournamentName}`;
} else if (tournamentName && placement) {
  core = `${tournamentName} — ${placement}`;
} else if (tournamentName) {
  core = speciesLine ? `${tournamentName}: ${speciesLine}` : tournamentName;
} else if (speciesLine && creatorName) {
  core = `${speciesLine} by ${creatorName}`;
} else if (speciesLine) {
  core = `${speciesLine} VGC Team`;
} else {
  core = "VGC Team Report";
}
title = core.length + brand.length <= TARGET ? `${core}${brand}` : core;
```
Rationale: species-led titles get higher CTR in Pokemon search; we still attach the brand when there's room, but drop it gracefully under truncation pressure. No new fields read — same data shape.

---

## 4. New `BreadcrumbJsonLd` helper (`src/components/seo/JsonLd.tsx` append)

```ts
export interface BreadcrumbItem { name: string; url: string }

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.name,
          item: it.url,
        })),
      }}
    />
  );
}
```

### Insert at the top of each list page's return:
- `src/app/explore/page.tsx`: `[{name:"Home",url:"…"},{name:"Explore",url:"…/explore"}]`
- `src/app/tournaments/page.tsx`: `[{name:"Home",…},{name:"Tournaments",…}]`
- `src/app/creator/[name]/page.tsx`: `[{name:"Home",…},{name:"Creators",url:"…/explore?tab=creators"},{name:creator,…}]`

---

## 5. Sitemap addition (`src/app/sitemap.ts`)

Once the `/regulation/[code]` route ships (medium-term rec #1), append:
```ts
...["m-a","h","i","g","f"].map(code => ({
  url: `${BASE}/regulation/${code}`,
  changeFrequency: "weekly" as const,
  priority: 0.85,
  lastModified: now,
})),
```

---

## Verification checklist before publishing

- [ ] Run Google Rich Results Test on `/champions/charizard-mega-y` and `/s/{publicId}` after deploy
- [ ] SERP-preview each new title to confirm <60 char width (not just byte count — em-dashes are wide)
- [ ] Confirm `keywords` array isn't bloated past ~15 entries (diminishing returns / spam signal)
- [ ] Crawl with `next-sitemap` validator to confirm no orphan canonicals
- [ ] No content changes to FAQ schema beyond grounded type-chart-derived counters answer
