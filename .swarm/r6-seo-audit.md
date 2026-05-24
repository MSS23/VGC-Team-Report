# R6 SEO Audit — 2026-05-24

**Scope:** technical SEO posture of pokemonvgcteamreport.com vs pikalytics, pokepast.es, limitlesstcg, victoryroaddev, vgcpastes.
**Method:** repo grep (sitemap, layout, champions/[pokemon], s/[id], JsonLd component, robots.txt, llms.txt) + WebSearch for competitor URL structure (direct WebFetch returned 403/ECONNREFUSED for every competitor host — cached prior teardowns at `.swarm/r1-competitor-pikalytics-pokepaste.md` and `.swarm/r2-competitor-vgcpastes-limitless.md` supplied the qualitative deltas).

## State of play

We are already strong on foundations: `src/app/layout.tsx` ships `WebSite`+`SearchAction`, `Organization`, and a `WebApplication`/`SoftwareApplication` JSON-LD block; `src/app/champions/[pokemon]/page.tsx` ships per-page `BreadcrumbList` + `FAQPage`; `src/app/s/[id]/page.tsx` ships `CreativeWork` with author/contributor and noindexes private shares; `src/app/sitemap.ts` dynamically emits all public `/s/[id]` and `/creator/[name]` URLs; `public/robots.txt` opens the door to GPTBot/ClaudeBot/PerplexityBot. Pikalytics URL pattern `pikalytics.com/pokedex/{format}/{Species}` (e.g. `/pokedex/gen9vgc2026regi/Volcarona`) shows the canonical pattern competitors win on: **format-segmented species pages**. We only ship `/champions/[megaSlug]` (Reg M-A only) — every other regulation is a gap.

## 3 SEO quick wins (each <2hr)

1. **Add a grounded "counters" FAQ entry on Mega landing pages** — extend the `faqItems` array in `src/app/champions/[pokemon]/page.tsx` around lines 198–225 with a 7th item: `"What counters {Mega} in VGC?"` answered from `pokemonData.types` against the type chart (weaknesses + speed tier baseline). Pure content/JSON-LD change, no new route. Captures the "{Pokemon} counters VGC" query Pikalytics owns. ~30 min.
2. **Make `/s/[id]` titles length-aware** (`src/app/s/[id]/page.tsx` lines 38–51). Current pattern `"${tournamentName} — ${placement} | VGC Team Report"` regularly exceeds 60 chars and Google truncates the brand. Reorder to lead with species (highest CTR signal) and drop the brand suffix when the core would push past ~55 chars. Adds ~10 lines of `length`-aware logic; no schema or data changes. ~45 min.
3. **Add `BreadcrumbList` JSON-LD to `/explore`, `/tournaments`, `/creator/[name]`** — extend `src/components/seo/JsonLd.tsx` with a `BreadcrumbJsonLd` helper (~12 lines), then a 3-line insertion per page. Currently only `/champions/[pokemon]` and `/s/[id]` ship breadcrumbs — Google's site-links treatment needs the helper on every L2 page. ~45 min.

## Keyword gap list (10)

Queries competitors rank for that we do not target in any `keywords`, h1, or URL:

1. **"VGC {Pokemon} counters"** — Pikalytics owns. We have no counters surface.
2. **"VGC {Pokemon} EV spread"** — we use "SP spread" (our coinage). Add "EV spread" as a synonym in titles + h1s; "EV" volume is roughly 30–50× "SP".
3. **"Pokemon Champions team builder"** — Pikalytics, PikaChampions, VGC Coach all rank. Our homepage title says "Build & Share", not "team builder".
4. **"VGC 2026 Regulation I teams"** — Pikalytics has `/pokedex/gen9vgc2026regi/`. We only ship a Reg M-A surface.
5. **"VGC Regulation H sample teams"** — VGCpastes owns. Our `/tournaments` page does not segment by regulation.
6. **"pokepaste alternative"** / **"pokepaste with notes"** — zero on-page targeting; our llms.txt mentions it, our `<title>` chain does not.
7. **"VGC speed tiers Regulation M-A"** — we have speed-tier UI, no dedicated indexable `/speed-tiers/[regulation]` page.
8. **"{Tournament name} VGC top cut teams"** (e.g. "Indianapolis Regionals 2026 teams") — Limitless ranks. We have the data via `tournamentName` on shares but no `/tournaments/[slug]` aggregate landing page.
9. **"{Player name} VGC team"** — Limitless player pages own. Our `/creator/[name]` exists but is not in `keywords` and the h1 is generic.
10. **"VGC team report template"** / **"how to write a VGC team report"** — pure top-of-funnel content gap; we own the category name but rank for nothing.

## Medium-term recommendations

1. **Ship `/regulation/[code]` hub pages** (`/regulation/m-a`, `/h`, `/i`, `/g`, `/f`) mirroring Pikalytics' `/pokedex/{format}` pattern. Each page: top-20 species cards, "browse teams in this format" CTA, breadcrumbs, `CollectionPage` JSON-LD. Pulls from the existing share DB filtered by `data->>'regulation'`. Single new route, ~6 indexable pages, addresses gaps #4 + #5 + #7.
2. **Build a `/tournaments/[slug]` aggregate** (Indianapolis 2026, Worlds 2025, etc.) emitting `SportsEvent` JSON-LD per tournament with a `subEvent`/`workFeatured` list of teams. We already emit two static SportsEvent nodes on `/tournaments` — promote them to indexable pages. Addresses gap #8 and converts Limitless backlink intent.
3. **Promote `/creator/[name]` to a real player profile**: add `ProfilePage`+`Person` JSON-LD, an h1 of `"{name} — VGC Teams & Tournament Reports"`, and a structured tournament-history block. Currently it's a generic feed, so it competes with Limitless player pages on weak signals. Addresses gap #9 and converts pre-existing sitemap entries into rank-worthy pages.

Drafts of all proposed metadata strings are at `/home/user/VGC-Team-Report/.swarm/drafts/r6-metadata-changes.md`. Nothing has been published.
