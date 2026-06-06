# Draft: Programmatic `/pokemon/[species]` route spec

Status: DRAFT — do not publish. Wave 2 review only.

## Goal

Close the top 3 keyword gaps (Calyrex Shadow Rider, Garchomp moveset, Flutter Mane)
by emitting per-species landing pages built from data already in the codebase.

**Constraint from the task:** no content writing. This route renders pure data,
no editorial prose.

## Route structure

```
src/app/pokemon/
  [species]/
    page.tsx           — server component, generates metadata + JSON-LD + body
    opengraph-image.tsx — dynamic OG image (mirror /champions/[pokemon] pattern)
    not-found.tsx      — for invalid species slugs
```

URL pattern: `https://pokemonvgcteamreport.com/pokemon/calyrex-shadow`,
`/pokemon/garchomp`, `/pokemon/flutter-mane`, etc.

## generateStaticParams

Build for all species that have:
- At least 1 public share that includes them (queried at build time), OR
- Appear in our static "top meta" list (top 30 from `@pkmn/dex` filtered by
  Reg I/M-A legality).

```ts
export async function generateStaticParams() {
  const sql = getDb();
  const rows = await sql`
    SELECT DISTINCT unnest(species) as species
    FROM shares
    WHERE is_public = TRUE AND deleted_at IS NULL
    LIMIT 500
  `;
  // Plus a hardcoded list of meta-relevant species to ensure coverage
  // before community shares accumulate.
  const META = [
    "calyrex-shadow", "calyrex-ice", "miraidon", "koraidon",
    "flutter-mane", "iron-hands", "raging-bolt", "iron-crown",
    "garchomp", "kingambit", "basculegion", "sneasler",
    "incineroar", "rillaboom", "amoonguss", "urshifu-rapid-strike",
    "ogerpon-wellspring", "ogerpon-hearthflame", "ogerpon-cornerstone",
    "chien-pao", "chi-yu", "ting-lu", "wo-chien",
    "tornadus", "landorus-therian", "regigigas",
  ];
  const all = new Set([
    ...rows.map((r) => slugify(r.species)),
    ...META,
  ]);
  return Array.from(all).map((species) => ({ species }));
}
```

## generateMetadata

```ts
export async function generateMetadata({ params }: { params: Promise<{ species: string }> }): Promise<Metadata> {
  const { species } = await params;
  const data = lookupPokemon(species);
  if (!data) return {};
  const display = data.name;
  const types = data.types.join(" / ");
  const title = `${display} VGC Guide — Movesets, Spreads & Teams`;
  const description = `${display} (${types}) VGC 2026 competitive guide. Top movesets, EV/SP spreads, items, tera types, and community team reports from VGC Team Report.`;
  return {
    title,
    description,
    alternates: { canonical: `https://pokemonvgcteamreport.com/pokemon/${species}` },
    openGraph: { /* mirror /champions/[pokemon] */ },
    twitter: { /* mirror */ },
    keywords: [
      display,
      `${display} VGC`,
      `${display} moveset`,
      `${display} EV spread`,
      `${display} VGC 2026`,
      `${display} competitive`,
      "VGC team report",
    ],
  };
}
```

## Page body — data-only sections (no content writing)

1. **Header**: sprite + display name + types + base stats. All from `@pkmn/dex`.
2. **Usage in community shares**: count of public shares featuring this species.
3. **Top 5 movesets**: aggregated from `data->'paste'` JSONB in `shares`.
4. **Top items / tera types / abilities**: same source.
5. **Featured teams rail**: 6 most recent public reports containing this species.
6. **Related Pokémon**: 8 type-overlap mons (computed from `@pkmn/dex` types).
7. **Speed tier context**: row in a min-table showing this mon vs ±10 base-speed neighbours.

All data is computed at build time or revalidated every hour. Zero editorial text.

## JSON-LD

```ts
<JsonLd data={{
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `${display} VGC Guide`,
  description,
  url: `https://pokemonvgcteamreport.com/pokemon/${species}`,
  about: {
    "@type": "Thing",
    name: display,
    sameAs: `https://bulbapedia.bulbagarden.net/wiki/${display.replace(/ /g, "_")}_(Pokémon)`,
  },
  isPartOf: {
    "@type": "WebApplication",
    name: "VGC Team Report",
    url: "https://pokemonvgcteamreport.com",
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://pokemonvgcteamreport.com" },
      { "@type": "ListItem", position: 2, name: "Pokémon", item: "https://pokemonvgcteamreport.com/pokemon" },
      { "@type": "ListItem", position: 3, name: display, item: `https://pokemonvgcteamreport.com/pokemon/${species}` },
    ],
  },
}} />
```

Plus `FAQPage` mirroring the /champions/[pokemon] pattern (only data-grounded
answers — no fabricated "best set" claims that could be flagged as structured-
data spam).

## Sitemap inclusion

Add to `src/app/sitemap.ts`:
```ts
const speciesSlugs = await sql`
  SELECT DISTINCT unnest(species) as species
  FROM shares
  WHERE is_public = TRUE AND deleted_at IS NULL
  LIMIT 500
`;
const pokemonPages: MetadataRoute.Sitemap = speciesSlugs.map((r) => ({
  url: `${BASE}/pokemon/${slugify(r.species)}`,
  changeFrequency: "weekly" as const,
  priority: 0.7,
  lastModified: now,
}));
```

## Cost

- Build time: +N pages where N ≈ 100–500 depending on community shares.
- ISR revalidate: hourly per page. Negligible Vercel bandwidth — same pattern
  as `/champions/[pokemon]` which is already in production.
- One new DB query per build per page (could be batched into a single
  `SELECT species, COUNT(*) GROUP BY species` query that hydrates the page
  on revalidate).

## Risk

- Thin-content penalty if a species has only 1–2 community reports. Mitigation:
  require N>=3 reports OR fall back to "no community teams yet — be the first
  to share one" CTA + base stats / @pkmn/dex moveset frequencies.
- Duplicate-content risk with `/champions/[pokemon]` for Mega forms.
  Mitigation: redirect `/pokemon/garchomp-mega` → `/champions/garchomp-mega`
  via Next.js redirects.

## Coverage

Closes Gap 1 (Calyrex Shadow), Gap 2 (Garchomp moveset), Gap 4 (Flutter Mane),
and the same-shape gap for ~25 other meta-relevant species.
