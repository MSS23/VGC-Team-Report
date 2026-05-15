# SEO Audit — VGC Team Report
**Audit date:** 2026-05-14
**Primary domain:** https://pokemonvgcteamreport.com
**Scope:** Focused audit on EV/SP terminology, noindex on private pages, sitemap champion coverage, FAQ schema, and changelog metadata.

---

## 1. EV vs SP Terminology Issue (Champions Format)

Pokemon Champions uses **Stat Points (SP)**, not EVs. The following occurrences of "EV spread" are incorrect for Champions-format content and will mislead players searching for Champions-specific spread guidance.

### `src/app/champions/[pokemon]/page.tsx`

| Line | Issue |
|------|-------|
| 36 | Comment: `// "{Pokemon} EV spread", "{Pokemon} moveset"` — targets wrong search term |
| 38 | **Page `<title>`**: `${mega.displayName} VGC Guide — EV Spreads, Movesets & Teams` — "EV Spreads" is factually incorrect for Champions format |
| 39 | **Meta description**: `best EV spreads, movesets, damage calcs…` — should say "SP spreads" or "Stat Point spreads" |
| 62 | **Keywords array**: `${mega.displayName} EV spread` — wrong term for Champions |
| 70 | **Keywords array**: `${mega.baseName} EV spread` — wrong term for Champions |
| 222 | **FAQ JSON-LD answer text**: `with full EV spreads, movesets, and matchup notes` — rendered in structured data consumed by Google and AI scrapers |
| 233 | **WebPage JSON-LD `name` field**: `${mega.displayName} VGC Guide — EV Spreads, Movesets & Teams` — incorrect in schema |

### `src/app/champions/[pokemon]/MegaLandingContent.tsx`

| Line | Issue |
|------|-------|
| 149 | **Visible `<h2>` heading**: `{mega.displayName} EV Spreads & Competitive Teams` — this is the primary on-page heading above the team grid; rendered in HTML, indexed by Google, and visible to users |

### `src/app/faq/page.tsx` (general FAQ — not Champions-specific, lower urgency)

| Line | Note |
|------|------|
| 37 | "EV spreads" in the "What is a VGC team report?" answer — acceptable for general VGC context, but a note should clarify SP for Champions |
| 67 | "EV spreads were chosen" in damage calcs answer — same context |
| 72 | "EV and IV investment" in speed tiers answer — acceptable for non-Champions |
| 77 | "EV and IV spreads" / "exact EV benchmarks" in OTS answer — acceptable for non-Champions |

**Recommended fix for Champions pages:** Replace "EV Spreads" with "SP Spreads" (or "Stat Point Spreads") in the title, description, keywords, h2, and both JSON-LD fields on `/champions/[pokemon]`. Consider keeping "EV Spreads" as a secondary keyword since some players search using legacy terminology.

---

## 2. Noindex on Private Pages

### `src/app/dashboard/page.tsx`
- **Status: MISSING `robots: { index: false }`**
- Current metadata (lines 4-7): Only `title` and `description` — no robots directive at all.
- The dashboard is an authenticated page listing private user data. Without `noindex`, Googlebot may crawl and potentially index dashboard pages served to logged-out users (which likely redirect to sign-in, but the metadata is still served).
- **Fix required:** Add `robots: { index: false, follow: false }` to the metadata export.

### `src/app/embed/[id]/page.tsx`
- **Status: NO `<head>` metadata block at all** — the page renders a raw `<html>` shell (lines 25-93) bypassing the Next.js layout entirely.
- There is no `export const metadata` and no robots meta tag in the manually constructed `<head>`.
- Embed pages are iframe-embedded widgets intended for third-party sites, not for indexing as standalone pages.
- **Fix required:** Add `<meta name="robots" content="noindex, nofollow" />` inside the manually constructed `<head>` tag (after line 31).
- Also note: `/embed/[id]` pages are not in the sitemap (correct), but without a noindex tag, crawlers following `<a>` links to embed URLs from third-party sites will attempt to index them.

---

## 3. Sitemap Champion Coverage

### Champions pages in sitemap vs pages that actually exist

The sitemap (`src/app/sitemap.ts`, line 18) iterates `MEGA_POKEMON_LIST` (all 59 entries). However, `generateStaticParams` in `src/app/champions/[pokemon]/page.tsx` (line 23) uses `getRegMAMegasWithSprites()` — which filters to only the 58 Reg M-A legal Megas that have a confirmed Showdown sprite.

**Result: One champion slug in the sitemap has no corresponding page:**

| Slug in sitemap | Reason page does not exist |
|----------------|---------------------------|
| `/champions/mega-meowstic` | `meowstic-mega` is in `MEGA_POKEMON_LIST` and `CHAMPIONS_REG_MA_MEGAS` but is **excluded from `MEGAS_WITH_SPRITES`** — it is 404 across all Showdown sprite paths. The page is not statically generated. |

A crawler following `/champions/mega-meowstic` from the sitemap will receive a 404. Google Search Console will flag this as a sitemap error. The fix is to change the sitemap to use `getRegMAMegasWithSprites()` instead of `MEGA_POKEMON_LIST` (matching what `generateStaticParams` uses).

### Dashboard and embed routes
- `/dashboard` is correctly absent from the sitemap.
- `/embed/[id]` routes are correctly absent from the sitemap.
- No sitemap issues for these routes.

### Other notable sitemap gaps
- `/compare` is absent — this is a public tool page with full metadata; borderline omission.
- `/feedback` is absent — lower priority.
- `/tournaments` is present (priority 0.7) — correct.
- `/faq` is present (priority 0.6) — correct.

---

## 4. FAQ Page (`src/app/faq/page.tsx`) — Schema and AEO Assessment

### JSON-LD FAQ Schema
- **Status: PRESENT and correct.**
- `faqJsonLd` is defined at line 86-97 and injected via `<JsonLd data={faqJsonLd} />` at line 102.
- The schema is `FAQPage` type with 11 `Question`/`Answer` pairs — well-formed.
- Canonical URL, OG tags, and Twitter card metadata are all present (lines 6-25).

### AEO / Citation-Friendly Concerns (VGC-176)

The FAQ page currently lacks **anchor IDs on question headings**. The `<h2>` elements at line 131 have no `id=` attribute, making it impossible for AI systems or human linkers to cite individual answers with fragment URLs (e.g., `https://pokemonvgcteamreport.com/faq#what-is-sp`).

**Missing questions for Champions/SP format (VGC-176 scope):**
1. "What are Stat Points (SP) in Pokemon Champions?" — The FAQ has no question explaining the SP system that replaces EVs in Champions format.
2. "How do SP spreads differ from EV spreads in VGC?" — No question covers the Champions-specific 66 SP / 32-per-stat cap vs traditional 508 EV / 252-per-stat.
3. "Can I use my old EV spreads in Pokemon Champions Regulation M-A?" — High-value conversion question for established VGC players new to Champions.

**Recommended VGC-176 additions:**
- Add `id` attributes to all `<h2>` question headings (slugified from question text) for deep-link citations.
- Add the three SP-related Q&A entries above to `FAQ_ITEMS` — these are directly relevant to the Champions format the app supports and would capture search intent for "SP spreads Champions" and "Pokemon Champions stat points."

---

## 5. Changelog Page (`src/app/changelog/page.tsx`) — Metadata and Structured Data

### Metadata
- **Title:** `"Changelog"` (line 5) — extremely thin. No site name, no keyword, no year. Should be `"Changelog — VGC Team Report | What's New in 2026"` or similar.
- **Description:** `"See what's new in VGC Team Report — latest features, improvements, and fixes."` (line 6) — acceptable but not keyword-optimized.
- **Canonical:** Present and correct (line 7).
- **OpenGraph:** **MISSING** — no `openGraph` block. When shared on Discord/Twitter, the changelog will fall back to the root layout's generic OG tags rather than showing changelog-specific title/description.
- **Twitter card:** **MISSING** — no `twitter` block.
- **robots:** Not set (inherits default, which is indexable — correct for a changelog, but worth confirming intent).

### Structured Data
- **Status: NO JSON-LD on the changelog page.**
- The `ChangelogContent` component has no `<JsonLd>` import or structured data injection.
- Appropriate schemas would be `ItemList` (list of version entries) or `Dataset`, though these are low-priority for a changelog. A simple `WebPage` or `SoftwareApplication` schema with `softwareVersion` and `dateModified` would help search engines understand the content type.
- **This is a medium-priority gap** — changelog pages rarely earn rich results, but the missing OG tags are a real social-sharing deficiency.

---

## 6. Priority Fix List

| Priority | Issue | File | Lines |
|----------|-------|------|-------|
| P1 | "EV Spreads" in `<title>`, meta description, h2, and JSON-LD on Champions slug pages | `champions/[pokemon]/page.tsx` | 38, 39, 222, 233 |
| P1 | "EV Spreads" in visible `<h2>` heading | `champions/[pokemon]/MegaLandingContent.tsx` | 149 |
| P1 | Missing `robots: { index: false }` on dashboard | `dashboard/page.tsx` | 4–7 |
| P1 | Missing `<meta name="robots" content="noindex">` on embed pages | `embed/[id]/page.tsx` | 30–32 |
| P2 | Sitemap includes `/champions/mega-meowstic` which 404s | `sitemap.ts` | 18 |
| P2 | Missing OpenGraph and Twitter card on changelog | `changelog/page.tsx` | 4–8 |
| P2 | Changelog title too thin (`"Changelog"` only) | `changelog/page.tsx` | 5 |
| P3 | FAQ questions lack `id=` anchor attributes for deep-link citations | `faq/page.tsx` | 131 |
| P3 | No SP-specific FAQ entries for Champions format | `faq/page.tsx` | 28–84 |
| P3 | "EV spread" in keywords array (×2) | `champions/[pokemon]/page.tsx` | 62, 70 |
