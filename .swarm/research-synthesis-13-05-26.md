# Research Synthesis — Swarm Run 13-05-26

**Generated:** 2026-05-13  
**Sources:** r1–r8, c1–c5, posthog-insights  
**Word count:** ~780

---

## 1. Top 5 Highest-Leverage Opportunities

### O1 — Fix "EV spreads" → "SP spreads" across Champions pages
**Sources:** r6-seo-audit, r3-reddit-sentiment  
**Confidence: High | Impact: High**  
Pokemon Champions uses Stat Points (SP), not EVs. Every `/champions/[pokemon]` title and description still says "EV spread" — factually wrong for the current format and missing the fastest-growing search cluster post-April 2026. Fix in `src/app/champions/[pokemon]/page.tsx` (lines 39, 62, 70, 222) and `src/components/seo/JsonLd.tsx`. This is also a content trust issue: players searching "SP spread Mega Kangaskhan" land elsewhere because the site speaks legacy language.

### O2 — Guest/anonymous team view with no login wall
**Sources:** r5-mobile-ux-patterns, r1-competitor-pikalytics-pokepaste, r3-reddit-sentiment  
**Confidence: High | Impact: Very High**  
35% of users abandon at a login wall before seeing shared content (Baymard). PokePaste's zero-friction share is its primary moat. `/teams/[slug]` (and `/s/[id]`) must render fully for unauthenticated users; gate only actions (duplicate, edit, save). This is the single change most likely to improve the viral sharing loop and word-of-mouth growth.

### O3 — Community citation acquisition (Victory Road + VGCpedia listings)
**Sources:** r7-aeo-geo, r3-reddit-sentiment  
**Confidence: High | Impact: Very High**  
VGC Team Report has zero presence on the five highest-authority VGC resource pages (Victory Road /resources, VGCpedia, DevonCorp, Nimbasa City Post, blog.poketeambuilder.app). Every cited competitor (Pikalytics, Limitless, Falinks) is listed on all five. This is a two-DM action with the highest citation ROI of any single change. Until the site appears in these co-mention clusters, AI engines and new players simply cannot discover it.

### O4 — SP spread FAQ items + `/speed-tiers` standalone page for SEO
**Sources:** r6-seo-audit, r7-aeo-geo  
**Confidence: High | Impact: High**  
"VGC speed tiers 2026" and "Pokemon Champions SP spread" are high-volume queries with low competition in the guide/reference angle. The speed tier feature exists inside reports but has no indexable page. A static `/speed-tiers` SSG page linking to all 59 `/champions/[pokemon]` pages would capture this intent and build dense internal links. Estimated implementation: half a day.

### O5 — Replica/rental code field alongside Showdown paste import
**Sources:** r3-reddit-sentiment, r4-twitter-creator-sentiment  
**Confidence: High | Impact: High**  
PikaChampions (new 2026 entrant) won market share by bundling pokepaste + 10-char replica code in one workflow. Reddit research confirms "rental code + paste + report as a single URL" is the single most-requested missing feature. VGC Team Report would be the only tool linking all three. This is also the feature most likely to generate organic sharing on Twitter/Discord.

---

## 2. Top 5 Quick-Win Bugs / Issues

| # | Issue | File | Source |
|---|-------|------|--------|
| B1 | `text-text-tertiary` (#6E6E8A) fails WCAG AA contrast at 4.0:1; used at 9–11px in ~200 places | `src/app/globals.css:16` | r8-accessibility-audit |
| B2 | `Toggle` component wraps `<button role="switch">` inside `<label>` — invalid, double-announces to screen readers; dark-mode toggle called with `label=""` has no accessible name | `src/components/ui/Toggle.tsx:10–15`, `src/app/Navbar.tsx:507` | r8-accessibility-audit |
| B3 | `ReactionBar` like button has no `aria-label` or `aria-pressed`; state change not announced | `src/components/report/ReactionBar.tsx:122–136` | r8-accessibility-audit |
| B4 | `/dashboard` and `/embed/[id]` pages lack `robots: { index: false }` — private/embed pages are indexable | `src/app/dashboard/page.tsx`, `src/app/embed/[id]/page.tsx` | r6-seo-audit |
| B5 | `/api/bot` uses non-timing-safe `!==` for secret comparison; also silently bypasses auth when `CRON_SECRET` is unset (`authHeader !== "Bearer undefined"`) | `src/app/api/bot/route.ts:38–40` | c4-security-audit |

---

## 3. Tonight's Implemented Work (Wave 2)

| Ticket | Work |
|--------|------|
| VGC-170 | AbortController timeouts on fetch calls — prevents hanging requests |
| VGC-172 | Unit tests for `redact-paste.ts` — closes the test gap flagged in c5-code-review |
| Match log | DELETE endpoint + error state UI for match log deletion |
| Champions meta | SQL LIMIT guard on champions meta query |
| VGC-169 | PostHog event naming cleanup/standardisation |
| ShareModal | Accessibility improvements (aria-modal, focus trap, labelling) |
| SEO metadata | Homepage title updated to include "Pokemon Champions 2026"; noindex on dashboard/embed |
| VGC-156 | OG fallback image verification for `/s/[id]` share pages |
| VGC-171 | Champions dex drift test — automated check that CHAMPIONS_DEX stays aligned with canonical list |
| Share paste copy | Copy-paste button added to share paste flow |

---

## 4. New Linear Tickets to File

| ID | Title | Evidence | Priority |
|----|-------|----------|----------|
| NEW-1 | Fix EV→SP terminology across all Champions-facing metadata and FAQ content | r6 QW-5; r3 SP search intent shift | P1 |
| NEW-2 | Audit and remove login wall from `/s/[id]` public share view | r5 Sec 1.1; r1 PokePaste gap | P1 |
| NEW-3 | Add replica/rental code field to team import and share URL | r3 Sec 10; r4 Sec 8 | P1 |
| NEW-4 | Add Victory Road /resources + VGCpedia outreach to backlog (community DM tasks) | r7 Actions 1–2 | P1 |
| NEW-5 | Create `/speed-tiers` static page for Regulation M-A with JSON-LD | r6 NP-3; r7 Rank 6 | P2 |
| NEW-6 | Fix `Toggle` component — remove `<label>` wrapper, apply `aria-label` directly on `<button role="switch">` | r8 Issue 4 | P2 |
| NEW-7 | Fix `text-text-tertiary` contrast token to ≥4.5:1 (light: #5A5A78, dark: #ABABC8) | r8 Issue 1 | P2 |
| NEW-8 | Extract SLUG_MAP into `src/lib/data/sprite-slug-map.ts` to eliminate OG image manual mirror | c5-code-review Finding 2 | P2 |
| NEW-9 | Add `ItemList` JSON-LD to `/champions` hub page + `SportsEvent` JSON-LD to `/tournaments` | r6 QW-7, QW-8 | P2 |
| NEW-10 | Fix timing-safe secret comparison in `/api/bot` + guard against unset `CRON_SECRET` | c4 Findings 4–5 | P2 |

---

## 5. Wave 2 Blockers

None identified. All Wave 2 work items are self-contained. PostHog credentials remain unavailable in this environment (see posthog-insights.md) — no funnel data was available to inform priority ordering, but all tickets above are supported by static research.

---

*Sources: r1-competitor-pikalytics-pokepaste.md, r2-vgcpastes-limitless-trainerhill.md, r3-reddit-sentiment.md, r4-twitter-creator-sentiment.md, r5-mobile-ux-patterns.md, r6-seo-audit.md, r7-aeo-geo.md, r8-accessibility-audit.md, c1-dead-code.md, c2-typescript-strictness.md, c3-performance-analysis.md, c4-security-audit.md, c5-code-review.md, posthog-insights.md*
