# R6 SEO Audit — VGC Team Report vs Pikalytics / PokePaste / Limitless

**Status:** DRAFT — do not implement. Competitor homepages 403'd WebFetch; signals derived from SERP snippets + ranking patterns.

## Competitive landscape (SERP positions observed)
- "best VGC team builder 2026" → Pikalytics dominates 4 of top-10; PokemonBuilder #1; **we don't rank**.
- "VGC team paste share" → Pikalytics #1, VGCPastes, Falinks; **we don't rank**.
- "pokemon VGC report" → **we rank #1** (homepage) and #6 (/champions). Brand term only.
- Title pattern that wins: `<Pokemon Champions VGC 2026 Best [thing] | Brand>`. Pikalytics nails it.
- URL patterns: pikalytics.com/{topic}, pokepast.es/{hash} (no SEO from leaf pages), limitlesstcg.com/tournaments/{game}/{id}.

## Top 10 keyword gaps (with recommended title / description)

1. **"pokemon champions team builder"** → `/` — Title: `Pokemon Champions Team Builder — Free VGC 2026 Reports & Mega Evolution Builds | VGC Team Report` · Desc: "Build Pokemon Champions VGC 2026 teams with Mega Evolution, speed tiers, damage calcs, and matchup plans. Free, no signup. Share with one link."
2. **"VGC team builder"** → `/` (currently buried) — Title: `VGC Team Builder 2026 — Speed Tiers, Damage Calcs & Open Team Sheets` · Desc: "The free VGC team builder used to write tournament-ready team reports. Speed tiers, damage calcs, OTS export."
3. **"VGC speed tier calculator"** → new `/speed-tiers` landing page — Title: `VGC Speed Tier Calculator 2026 — Regulation M-A` · Desc: "Compare speed tiers across your team and the current Regulation M-A meta. Free, instant."
4. **"VGC damage calculator team"** → new `/damage-calculator` (or surface existing) — Title: `VGC Damage Calculator — Save Calcs to Your Team Report`.
5. **"open team sheet generator"** → `/explore` already targets "OTS" but no dedicated LP. Title: `Open Team Sheet Generator (OTS) — Pokemon VGC 2026`.
6. **"Regulation M-A teams"** → `/champions` — replace current title: `Regulation M-A Teams — Pokemon Champions VGC 2026 (Mega Evolution Builds)`.
7. **"pokepaste alternative"** → new `/pokepaste-alternative` — Title: `PokePaste Alternative with Notes, Matchup Plans & Damage Calcs`.
8. **"VGC matchup chart" / "VGC matchup plan"** → new `/matchups` — Title: `VGC Matchup Plans 2026 — Bring Order & Game Plans by Opponent`.
9. **"share pokemon team link"** → `/` H2 + dedicated `/share` LP — Title: `Share Your Pokemon Team with a Link — Free VGC Team Sharing`.
10. **"VGC tournament report"** → `/tournaments` — Title: `VGC Tournament Reports 2026 — Top Cuts, Rosters & Builds`.

## 5 SEO quick wins (impact ÷ effort, ordered)

1. **Rewrite homepage `<title>` to lead with intent verbs + year** (~30 min). Current: brand-first. Proposed: `VGC Team Builder & Report Maker 2026 — Free, Pokemon Champions Ready | VGC Team Report`. Captures "VGC team builder" + "2026" + brand. Highest impact, near-zero effort.
2. **Add `<h1>` to `/`, `/explore`, `/champions` that exactly matches target keyword** (~1 h). Currently page.tsx is a client component with no semantic H1 — check, add visible or `sr-only` H1 above PasteInput.
3. **Generate `/champions/[mega]` per-Mega landing pages with unique meta** (~3 h — routes already in sitemap; need metadata.ts per slug if missing). Each: `<Mega Name> Pokemon Champions VGC Build — Moves, EVs, Counters`. Targets long-tail "mega charizard y vgc 2026" etc.
4. **Add FAQ section + FAQPage schema to `/champions` and `/explore`** (~2 h). Existing FAQPageJsonLd lives on `/`; replicate per page with topic-specific Q&A — earns rich-result eligibility on commercial-intent pages.
5. **Internal-link hub: add "Popular topics" footer block site-wide** (~1.5 h) linking /champions, /explore, /tournaments, /compare, /faq, /speed-tiers, /damage-calculator with keyword anchors. Currently the persistent navbar has no SEO-anchored crawl paths to deep pages.

## 3 structured-data improvements

1. **`SoftwareApplication` → add `aggregateRating` + `review`** on root layout JsonLd. Pull from public Likes/comments table to compute rating/count. Eligible for rich star snippet on brand SERP.
2. **`HowTo` schema** for "How to share a VGC team report" on `/` already exists (good) — **add a second HowTo on `/champions`** for "How to build a Mega Evolution team for Regulation M-A". Earns "How to" carousel.
3. **`Dataset` + `ItemList` on `/explore`** with `numberOfItems` reflecting actual public team count, plus per-team `CreativeWork` entries in the itemList — currently `/explore` only has CollectionPage. Pikalytics-style usage stats pages would also benefit from `Dataset` schema with `temporalCoverage` set to the current reg.

---
Word count target: ~400. Actual: ~395.
