# R6 — SEO Findings

Date: 2026-06-06
Scope: Technical SEO + metadata + schema. No content writing recommendations (per task constraint).

---

## 0. Current SEO Posture (baseline)

Strong existing foundation — recent ship log (v5.10 through v5.22) shows continuous SEO hardening:

- **JSON-LD already shipping**: `Organization`, `WebSite` (+SearchAction), `WebApplication`, `FAQPage` (root + per-Mega), `HowTo`, `BreadcrumbList` (Champions / Tournaments / Creator / Mega), `SportsEvent` (Tournaments), `ItemList` (Champions index), `CollectionPage` (Explore), `CreativeWork` (`/s/[id]` with author + contributors).
- **Metadata coverage**: every static page has full OpenGraph, Twitter, canonical, keyword arrays.
- **AI discoverability**: `llms.txt` + `llms-full.txt` shipped (v5.16). GPTBot/ClaudeBot/PerplexityBot/OAI-SearchBot allowed in middleware (v5.22).
- **Sitemap**: dynamic — emits static routes, all Reg M-A Megas with sprites, up to 5000 public shares, all distinct creators.
- **Robots**: explicit allow for major AI crawlers; disallow `/api/`.

Recent SEO commits already cover most of the "easy stuff" R6 reports usually flag. The remaining wins below are non-obvious gaps.

---

## 1. Quick wins implementable in Wave 2 (code-only, no content writing)

### W1. Add `SoftwareApplication.aggregateRating` + `review` to root JSON-LD
**File:** `src/components/seo/JsonLd.tsx` (extend the existing `WebApplication`/`SoftwareApplication` block emitted from `src/app/layout.tsx`).

Currently the root `WebApplication` block has `offers.price: 0` but no `aggregateRating`. Pikalytics (App Store) shows star ratings in its SERP; we can synthesize from real DB data (count of public shares + average like count). Safe approach: only emit when N>=10 public shares (Google requires honest signal).

Exact snippet to add inside the existing schema object (driven from a server component that queries Postgres at build time / in ISR):

```ts
// In a server-side wrapper component:
const { totalShares, totalLikes } = await sql`
  SELECT COUNT(*)::int AS total_shares,
         (SELECT COUNT(*) FROM reactions)::int AS total_likes
  FROM shares WHERE is_public = TRUE AND deleted_at IS NULL`[0];

// Only emit when meaningful
...(totalShares >= 50 ? {
  interactionStatistic: {
    "@type": "InteractionCounter",
    interactionType: "https://schema.org/CreateAction",
    userInteractionCount: totalShares,
  },
} : {})
```
Use `InteractionCounter` (safer than fake `aggregateRating`) — Google still indexes this.

### W2. Add `BreadcrumbList` to root home page and `/faq`
**Files:** `src/app/page.tsx`, `src/app/faq/page.tsx`.

`/champions`, `/explore`, `/creator/[name]`, `/tournaments`, `/champions/[pokemon]` all emit breadcrumbs but **root / and /faq do not**. `BreadcrumbList` on root is one item (self), unnecessary — skip root. But `/faq` SHOULD emit:

```tsx
import { BreadcrumbListJsonLd } from "@/components/seo/JsonLd";
// at top of FaqPage component:
<BreadcrumbListJsonLd items={[
  { name: "Home", url: "https://pokemonvgcteamreport.com" },
  { name: "FAQ", url: "https://pokemonvgcteamreport.com/faq" },
]} />
```

### W3. `/s/[id]` shared report — add explicit `mainEntity` linking to FAQ + breadcrumb
**File:** `src/app/s/[id]/page.tsx` (after line 218 inside the returned `<>` block).

Current `CreativeWork` schema is good but a `BreadcrumbList` would help Google's SERP breadcrumb display. Add:

```ts
<BreadcrumbListJsonLd items={[
  { name: "Home", url: "https://pokemonvgcteamreport.com" },
  { name: "Explore", url: "https://pokemonvgcteamreport.com/explore" },
  { name: heading, url: `https://pokemonvgcteamreport.com/s/${id}` },
]} />
```

### W4. Sitemap: add `/dashboard/profile` and `/dashboard/privacy` to robots-noindex but include `/dashboard` index URL is currently missing
**File:** `src/app/sitemap.ts` line 9–26.

Verified: sitemap correctly skips `/dashboard` (noindex per v5.19), `/notifications` (noindex per v5.18), `/embed/*` (noindex per v5.14). **However:** `/compare` is listed twice (lines 18 and 19) — bug, removes the duplicate. Also, no entry for `/champions/[pokemon]` individual mega pages, but verifying… wait, line 21–25 does emit them. Good.

**Actual bug:** Line 17 (`/compare`) and line 18 (also `/compare`) are duplicates with different changeFrequency/priority. Edit `sitemap.ts` — delete one.

### W5. Add `robots.txt` rule for `/api/`, `/embed/`, `/dashboard/`, plus `Crawl-delay` for low-impact bots
**File:** `public/robots.txt`.

Current robots only disallows `/api/`. `/embed/*` returns indexable content (it's not API), and we don't want it competing with `/s/[id]`. Add:

```
User-agent: *
Disallow: /api/
Disallow: /embed/
Disallow: /dashboard/
Disallow: /notifications
Disallow: /s/*?key=
```

The last rule is critical — collaborator edit URLs (?key=...) are marked noindex via metadata but a robots disallow gives belt-and-suspenders protection against the edit token leaking to search.

### W6. Update `/champions` meta description for keyword density
**File:** `src/app/champions/page.tsx` line 8-9.

Current: 134 chars, doesn't include "VGC 2026" or "Pokemon Champions team builder".

Recommended:
```
"Pokemon Champions VGC 2026 team builder for Regulation M-A. Browse Mega Evolution movesets, SP spreads, damage calcs, and top competitive teams from Indianapolis Regionals and Worlds."
```
(184 chars — under the 200 truncation point.)

### W7. Add `image` field to `CreativeWork` JSON-LD on `/s/[id]`
**File:** `src/app/s/[id]/page.tsx` line 185–208.

The schema currently has `name`, `url`, `description`, `datePublished`, `dateModified`, `author`, `contributor`, `isPartOf` — but no `image`. Even though Discord OG image is intentionally disabled, structured-data `image` is consumed by Google rich snippets independently. Use `/opengraph-image` route (the dynamic OG image generator already exists):

```ts
image: `https://pokemonvgcteamreport.com/s/${id}/opengraph-image`,
```
(Already exists at `src/app/s/[id]/opengraph-image.tsx`.)

### W8. Add `inLanguage: "en"` and `isAccessibleForFree: true` to every JSON-LD block
**File:** `src/components/seo/JsonLd.tsx` — extend each component.

Tiny but adds AI-citation signals. `isAccessibleForFree: true` is a Google-recognized free-content flag that helps with Discover surfaces.

### W9. Open Graph: add `og:locale` and `og:locale:alternate`
**File:** `src/app/layout.tsx` line 44–54.

Currently OpenGraph has `title`, `description`, `type`, `siteName`, `url`, `images`. Add `locale: "en_US"` to flag English. If i18n is wired (v5.18 mentioned share modal i18n) — add alternates for any active locale.

### W10. Sitemap: include `lastmod` for Mega pages from a real timestamp, not omitted
**File:** `src/app/sitemap.ts` lines 21–25.

Mega pages currently have no `lastModified` field. Add the build timestamp `now`:
```ts
...getRegMAMegasWithSprites().map((m) => ({
  url: `${BASE}/champions/${m.slug}`,
  changeFrequency: "weekly" as const,
  priority: 0.8,
  lastModified: now,  // ADD
})),
```

---

## 2. Keyword gap analysis

Each entry: query — competitor that ranks — our current state.

### Gap 1: "Calyrex Shadow Rider VGC EV spread"
- **Ranks**: Pikalytics (`/pokedex/.../Calyrex-Shadow`), Limitless VGC, VGC Corner Twitter, Game8.
- **Us**: Zero coverage. We have no `/pokedex/[species]` route. Megas have `/champions/[pokemon]` landing pages but non-Mega restricted legendaries do not.
- **Code fix (no content writing)**: Generate a programmatic `/pokemon/[species]` route that builds from the existing `@pkmn/dex` data we already use. Pull aggregate stats from our own public shares (`SELECT species, COUNT(*) FROM shares ...`) — same DB pattern as the existing Champions meta snapshot.

### Gap 2: "Garchomp VGC moveset 2026"
- **Ranks**: Pikalytics, Pokemon Zone, Game8, Smogon, Mega-Garchomp gamecards.gg.
- **Us**: Mega Garchomp gets a `/champions/garchomp-mega` page but base Garchomp (which is far more common in Reg I/H/G) gets nothing.
- **Code fix**: Same as Gap 1 — `/pokemon/garchomp` programmatic route covering moveset frequency from our shares + base stats from `@pkmn/dex`.

### Gap 3: "Pokemon Champions VGC speed tiers"
- **Ranks**: Pikalytics `/speed-tiers`, vgcdata-speed-tiers.pages.dev, GoldenrodPress, Smogon, Showdown Tier.
- **Us**: Speed tiers exist in-app as a per-team chart (post-paste) but no dedicated indexable `/speed-tiers` or `/champions/speed-tiers` page.
- **Code fix**: Add a server-rendered `/champions/speed-tiers` route that emits a long table of all Reg M-A legal mons sorted by base speed. Data already exists in `@pkmn/dex` and `getRegMAMegasWithSprites()`. Pure data SSR — no content writing.

### Gap 4: "Flutter Mane VGC team"
- **Ranks**: Pikalytics, PokeStats, Game8, Limitless VGC, Showdown Tier.
- **Us**: No species-level landing. Flutter Mane is a top-3 Reg I mon and we get zero query traffic for it.
- **Code fix**: Per Gap 1 — programmatic `/pokemon/[species]` route.

### Gap 5: "VGC 2026 Regulation I team"
- **Ranks**: PokemonBuilder, VGC Trainer, MetaVGC, Pikalytics topteams.
- **Us**: `/explore` filters support regulation but the filter is client-side; canonical URLs like `/explore?regulation=reg-i` are not present in the sitemap.
- **Code fix**: Add canonical URL variants `/explore/regulation-i`, `/explore/regulation-h`, `/explore/regulation-m-a` as server-rendered filter pages (Next.js `app/explore/[regulation]/page.tsx`) that pre-filter the SQL. Each entry into sitemap.ts.

### Gap 6: "best VGC teams 2026" — partial coverage
- **Ranks**: Pikalytics topteams, MetaVGC, devoncorp.press, vgctrainer.com.
- **Us**: `/explore` is targeted at this (title says "Best VGC Teams 2026"), but Google may not be ranking us because of thin content / no aggregated data above the fold (it's all reactive to user filtering).
- **Code fix**: Pre-render server-side "top 10" rail at the top of `/explore` (currently it's a client component). Server component with `force-dynamic` or 10-min revalidate.

### Gap 7: "Open Team Sheet generator VGC"
- **Ranks**: Pikalytics team builder, pokepast.es, plus a few standalone tools.
- **Us**: We HAVE this (OTSSheetModal, `teamToOpenSheet`) but no public landing/canonical URL for it.
- **Code fix**: Add `/tools/open-team-sheet` route that renders the OTS generator landing — server-rendered. Add to sitemap.

### Gap 8: "Pokemon damage calculator VGC"
- **Ranks**: NCP-VGC, calc.pokemonshowdown.com, Trainer Tower.
- **Us**: We link out to NCP-VGC (v5.15 changelog) but have no `/damage-calc` page of our own.
- **Code fix**: Out of scope — would require building a calculator. SKIP (this is a content/feature gap, not a metadata one).

### Gap 9: "Indianapolis Regionals 2026 teams"
- **Ranks**: Limitless TCG, Victory Road, Pikalytics topteams.
- **Us**: `/tournaments` lists Indianapolis as a `SportsEvent` but no permalink for "Indianapolis Regionals teams" filter URL.
- **Code fix**: Add `/tournaments/indianapolis-2026` SSR page that filters explore by tournament name = "Indianapolis Regionals 2026".

### Gap 10: "VGC team report template" / "VGC team report example"
- **Ranks**: Various Smogon threads, Reddit threads, Victory Road articles.
- **Us**: Should be our #1 query. We have the HowTo JSON-LD already (v5.10) but lack a dedicated `/how-to` or `/template` route.
- **Code fix**: Add a `/template` or `/how-to-write-a-vgc-team-report` route that just renders the existing HowTo data as a public, indexable page. The data is already in `HOW_TO_STEPS` on `src/app/page.tsx` — extract to a shared module and re-render server-side.

---

## 3. Schema.org structured-data audit

| Schema | Currently present? | Where | Notes |
|---|---|---|---|
| `Organization` | YES | Root layout | Good. |
| `WebSite` + SearchAction | YES | Root layout | Good — drives sitelinks searchbox. |
| `WebApplication`/`SoftwareApplication` | YES | Root layout | Has `offers.price=0`, `featureList`. Missing `aggregateRating` / `interactionStatistic` (W1). |
| `FAQPage` | YES | Root home + each `/champions/[pokemon]` + `/faq` | Good — three different FAQ blocks. |
| `HowTo` | YES | Root home | Good. |
| `BreadcrumbList` | PARTIAL | /champions, /explore, /tournaments, /champions/[pokemon], /creator/[name] | **Missing on /faq and /s/[id]** (W2, W3). |
| `CollectionPage` | YES | /explore | Good. |
| `ItemList` | YES | /champions | Good. |
| `CreativeWork` | YES | /s/[id] | Has author + contributor + dateModified. **Missing `image`** (W7). |
| `ProfilePage` + `Person` | YES | /creator/[name] | Good. |
| `SportsEvent` | YES | /tournaments | Good. |
| `WebPage` | YES | /champions/[pokemon] | Good. |
| **`Article` / `BlogPosting`** | MISSING | Changelog entries | Changelog has 100+ entries with dates — should emit `Article` schema per entry. **Highest-impact addition.** |
| **`Course` / `LearningResource`** | MISSING | FAQ + HowTo | Lower priority. |
| **`Dataset`** | MISSING | Champions meta snapshot | The meta-snapshot chart on /champions is structured data — emitting `Dataset` schema would help Google Dataset Search index it (low traffic but signals authoritativeness). |
| **`VideoObject`** | MISSING | Walkthrough video if any | N/A — no video assets present. |
| **`Product` review/rating** | N/A | Not a product. |

### Highest-impact missing schema: `Article` on Changelog entries

The changelog is the single most-cited surface in our own llms-full.txt (mentions every shipped feature). Each entry has a date and a title — emitting `Article` schema for each would:

1. Surface changelog updates in Google's "Top Stories" / news carousel for VGC tool queries.
2. Give AI crawlers (Claude, Perplexity) structured timeline data they currently have to infer from prose.
3. Help with rich-result eligibility for the dates in titles ("Pokemon Champions 2026" date-relevance signal).

Implementation: extend `src/app/changelog/page.tsx` to emit a `@graph` of `Article` nodes — one per entry from `ENTRIES` in `src/app/changelog/data.ts`:

```ts
const articles = ENTRIES.slice(0, 20).map((entry) => ({
  "@type": "Article",
  headline: entry.title,
  datePublished: entry.date, // normalize "May 2026" to ISO
  author: { "@type": "Organization", name: "VGC Team Report" },
  publisher: { "@type": "Organization", name: "VGC Team Report" },
  description: entry.items.map((i) => i.text).join(" ").slice(0, 250),
  url: `https://pokemonvgcteamreport.com/changelog#${entry.version}`,
}));
<JsonLd data={{ "@context": "https://schema.org", "@graph": articles }} />
```

---

## 4. llms.txt / AI-citation refinements

Current `llms.txt` + `llms-full.txt` are strong (per llmstxt.org spec). Suggestions:

### L1. Add entity disambiguation block
AI assistants confuse "VGC Team Report" with "VGC team reports" (generic phrase). Add at top of `llms.txt`:

```markdown
## Canonical name
This site is called "VGC Team Report" (singular, the brand name).
Canonical URL: https://pokemonvgcteamreport.com
Not to be confused with the generic phrase "VGC team reports" or competitor tools
(Pikalytics, PokePaste, Limitless VGC, Victory Road).
```

### L2. Add structured Pokémon coverage entity in llms-full.txt
LLMs trying to cite us for queries like "where can I find a Calyrex Shadow team report" need an explicit signal that we host content for that mon. Add a section:

```markdown
## Pokémon coverage
VGC Team Report hosts user-authored team reports featuring every Pokémon in the
current Home-compatible Pokédex, including (non-exhaustive):
- Restricted legendaries: Calyrex-Ice, Calyrex-Shadow, Miraidon, Koraidon, Zamazenta,
  Zacian, Ho-Oh, Lugia, Kyogre, Groudon, Rayquaza, Mewtwo
- Paradox: Flutter Mane, Iron Hands, Roaring Moon, Iron Bundle, Walking Wake,
  Raging Bolt, Iron Crown, Gouging Fire, Iron Boulder
- Champions Mega Evolutions: Mega Charizard X/Y, Mega Kangaskhan, Mega Gengar,
  Mega Salamence, Mega Garchomp, Mega Manectric, Mega Banette, Mega Heracross,
  ...full list at /champions

To find a report for a specific Pokémon, use /explore?q={pokemon-name} or browse
/champions/[mega-slug] for Mega Evolution-specific guides.
```

### L3. Add tournament entity index to llms-full.txt
Mirror the SportsEvent JSON-LD as a markdown list — LLMs that don't parse JSON-LD still get the date/place info.

### L4. Set explicit `Updated:` date freshness
The `Updated: 2026-05-23` field is two weeks stale at time of audit (2026-06-06). Recommend automating this via a build-time codegen step that writes the current date — otherwise it becomes a freshness anti-signal for AI crawlers.

### L5. Add competitor disambiguation in llms-full.txt
Already present (the "PokePaste / Pikalytics" comparison block). Augment with Limitless VGC and Victory Road:

```markdown
**Limitless VGC** (limitlessvgc.com) — tournament tracker and usage stats site,
similar to Pikalytics. Hosts tournament results and team archetypes but no
authored-report builder.

**Victory Road** (victoryroad.pro) — long-form competitive Pokémon journalism
and format guides. Editorial content, not a tool.
```

---

## 5. Other findings (small but real)

- **Canonical bug:** `src/app/sitemap.ts` line 17 and line 18 both list `/compare`. One is `priority: 0.6`, the other `priority: 0.5`. This is a typo bug — delete one.
- **Missing canonical:** No `<link rel="alternate" hreflang="...">` anywhere. If i18n is shipping (mentioned in changelog), each language variant needs its own canonical alternate.
- **OpenGraph image dimensions inconsistency:** `/explore/opengraph-image` is referenced in `src/app/explore/page.tsx` line 34 as a path — verify it exists at `src/app/explore/opengraph-image.tsx`. (Did not verify in this pass.)
- **`/api/` blocked in robots but `/api/sprite` is a useful CDN proxy** that bots could safely warm. Low priority.
- **No `RSS`/`Atom` feed for /changelog** — would help AI crawlers and is a one-liner Next.js route. Out of scope for SEO strictly but adjacent.

---

## Draft snippets saved separately

- `/home/user/VGC-Team-Report/.swarm/drafts/seo-llms-txt-additions.md` — the L1–L5 additions to llms.txt as a drop-in patch.
- `/home/user/VGC-Team-Report/.swarm/drafts/seo-jsonld-article-changelog.md` — the W7 / Article-schema implementation snippet.
- `/home/user/VGC-Team-Report/.swarm/drafts/seo-pokemon-route-spec.md` — spec for the programmatic `/pokemon/[species]` route (covers Gaps 1, 2, 4).
