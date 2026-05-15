# Research Synthesis — Swarm Run 14-05-26

**Generated:** 2026-05-14  
**Sources:** C1 (dead-code), C2 (TypeScript), C4 (security), C5 (code-review), R6 (SEO), R8 (a11y)

---

## Already Fixed (update Linear to Done/In Review)

| Ticket | Finding |
|--------|---------|
| VGC-173 | HogQL injection: parameterized `values` + UUID guard already in place |
| VGC-174 | Web Share API: `navigator.share()` wired in ShareModal.tsx:244 |
| VGC-177 | Skip-to-content: `<a href="#main-content">` exists in layout.tsx:99 |
| VGC-146 | url-codec JSON.parse: Zod safeParse validation already applied |

---

## Top 5 Highest-Leverage Opportunities

### O1 — Fix "EV spreads" → "SP spreads" in Champions pages
**Sources:** R6-seo-audit  
**Files:** `src/app/champions/[pokemon]/page.tsx` (lines 38, 39, 62, 70, 222, 233), `MegaLandingContent.tsx:149`  
**Impact:** Factual accuracy + keyword targeting for the Champions format's unique Stat Point system.

### O2 — WCAG AA contrast fix for text-tertiary (~470 locations)
**Sources:** R8-accessibility-audit  
**File:** `src/app/globals.css:16`  
**Fix:** Change `--text-tertiary: #6E6E8A` → `#5E5E7A` (single line, cascades everywhere).

### O3 — noindex on dashboard + embed pages
**Sources:** R6-seo-audit  
**Files:** `src/app/dashboard/page.tsx` (add robots field), `src/app/embed/[id]/page.tsx` (add metadata export)  
**Also:** Remove `/champions/mega-meowstic` from sitemap (page 404s).

### O4 — FAQ anchor IDs + SP/Champions FAQ entries (VGC-176)
**Sources:** R6-seo-audit  
**File:** `src/app/faq/page.tsx`  
**Fix:** Add `id=` anchors to all `<h2>` FAQ headings; add 2–3 FAQ entries about SP system.

### O5 — Damage Calc deep-link button on PokemonCard (VGC-180)
**Sources:** VGC-180 ticket, r3-reddit-sentiment  
**File:** `src/components/report/PokemonCard.tsx`  
**Fix:** Add a small "Calc" icon button that opens Showdown calc in new tab with Pokemon pre-populated.

---

## Top 5 Quick-Win Bugs

| # | Issue | File:Line | Source |
|---|-------|-----------|--------|
| B1 | text-tertiary #6E6E8A fails WCAG AA (4.0:1) in light mode | globals.css:16 | R8 |
| B2 | Toggle wraps `<button>` in `<label>` (invalid HTML); Navbar passes `label=""` | Toggle.tsx:9, Navbar.tsx:507 | R8 |
| B3 | ReactionBar authenticated like button (line 122) missing `aria-label` + `aria-pressed` | ReactionBar.tsx:122 | R8 |
| B4 | dashboard + embed pages missing `robots: { index: false }` | dashboard/page.tsx, embed/[id]/page.tsx | R6 |
| B5 | `cron-auth.ts:10` uses `===` for CRON_SECRET comparison (not timing-safe) | cron-auth.ts:10 | C4 |

---

## C5 Critical/High Issues

- **CRIT:** VGC-170 `finally`-only on Linear fetch — AbortError propagates unhandled, `result` potentially uninitialized
- **HIGH:** `api/bot/route.ts` `discordFetch` call has no AbortController timeout (missed by VGC-170)
- **HIGH:** VGC-175 delete handler returns non-OK silently (no error feedback for non-network errors)
- **HIGH:** `window.confirm` in match tracker suppressed on iOS PWA/WebViews
- **HIGH:** Indy top-cut table has "TBD" + fictional data; Indianapolis Regionals (May 29–31) already past

## Dead Code (C1)

- `postBuildNotification` in `discord-bot.ts` — zero call sites (safe to delete)
- `postToFeedbackChannel` in `discord-webhook.ts` — zero call sites
- `sanitizeInput` and `containsInjection` in `input-validation.ts` — zero call sites

## TypeScript Issues (C2) — VGC-179

- `as unknown as` (4 locations): PostHogProvider.tsx:14, useHomePage.ts:265+439, useSlideNavigation.ts:46
- `: any` (5 locations): version-diff.ts:154+160, diff-state.ts:87+90+94 — use `SerializedMatchupPlan`/`SerializedGamePlan` from url-codec.ts

---

## Wave 2 Implementation Plan

| Agent | Ticket(s) | Scope |
|-------|-----------|-------|
| A1-security | B5 + new cron-auth issues | cron-auth.ts timing-safe, posthog webhook token |
| A2-a11y | VGC-177 + B1+B2+B3 | globals.css contrast, Toggle, ReactionBar, ShortcutHintOverlay |
| A3-seo-noindex | B4 + sitemap | dashboard/embed robots, mega-meowstic sitemap removal |
| A4-seo-ev-sp | O1 | EV→SP in champions pages |
| A5-faq-schema | VGC-176 | FAQ anchor IDs + SP FAQ entries + changelog OG |
| A6-typescript | VGC-179 | as unknown as fixes + any→proper type |
| A7-lcp | VGC-178 | fetchpriority="high" on hero images |
| A8-calc-link | VGC-180 | Calc button on PokemonCard |
| A9-c5-abort | C5 crit | AbortController unhandled error + bot route timeout |
| A10-dead-code | C1 | Remove dead exports from 3 files |

---

## New Backlog Tickets to File

1. Indy top-cut: update with real Indianapolis Regionals data (post-event)
2. Champions meta snapshot: push species aggregation to SQL
3. Sitemap: add `/champions/mega-meowstic` 404 guard / remove stale slug
4. Changelog page: add OG/Twitter card metadata
5. `window.confirm` in match tracker: replace with inline confirmation UI (iOS PWA fix)
