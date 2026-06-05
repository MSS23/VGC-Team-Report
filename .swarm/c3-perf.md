# C3 Bundle / Performance Audit — 2026-06-05

Build: succeeded via `npm run build` (Turbopack — does NOT print Next.js's per-route KB table). Total client `.next/static/chunks` = **4.8 MB raw**. Top 5 chunks (raw / gzipped):

| Chunk | Raw | gzip | Contains |
|---|---|---|---|
| 0rvctb-cw8l5i.js | 474 KB | 115 KB | (largest — likely react+app shell) |
| 0xr012s5lag5a.js | 409 KB | 129 KB | `posthog-js` SDK |
| 0eeqwi5zjfw3a.js | 333 KB | 49 KB | |
| 0xpwnv1i16rc1.js | 333 KB | 49 KB | |
| 0i4g9_wngqb2c.js | 221 KB | 53 KB | `posthog-js` (replay) |

## Top 5 Largest Client Components (lines)

1. **PokemonDetailSlide.tsx** — 963 (chained: `move-type-style` → `moves.ts` 4,183 lines + `pokemon.ts` 3,330 lines, both literal objects)
2. **ShareModal.tsx** — 933 (already `next/dynamic` loaded — contained)
3. **Navbar.tsx** — 890 (static import in `/` and many pages; carries Clerk, NotificationBell, VersionHistoryPanel)
4. **TeamOverview.tsx** — 850 (lazy-loads `qrcode` — good)
5. **MatchupPlanSlide.tsx** — 779 (also chains `moves.ts` via `move-type-style`)

## Largest Routes (use-client posture)

Only `/` (`src/app/page.tsx`) is a top-level `"use client"` page — every other top page (`/explore`, `/champions`, `/dashboard`, `/s/[id]`, `/compare`, `/tournaments`) is a server component delegating to a small client island. **Good architecture.** Two non-critical pages also use client: `/dashboard/profile`, `/dashboard/privacy`.

## Status of Prior Audit (c3-performance.md, May 7)

- Problem 1 (posthog static imports): **FIXED** — no `import posthog from "posthog-js"` remains; all call sites use `usePostHog()`.
- Problem 2 (PrintContext extraction): **FIXED** — `src/components/ui/print-context.ts` exists; report slides import from it.
- Problems 3–7: **OPEN** — still applicable.

## 3 Specific Perf Wins (each < 4 hr)

1. **Convert `moves.ts` (4,183 lines) + `pokemon.ts` (3,330 lines) → JSON, lazy-load via `import()` inside getters.** Currently chained into the `PokemonDetailSlide`/`MatchupPlanSlide` chunks via `move-type-style.ts`. Saves ~500 KB of JS-parse work off the slide chunk; data lives in the JSON parse-on-demand path. Effort: ~2 hr (codemod + verify call sites).
2. **Defer `@pkmn/dex` species iteration in `InlinePokemonEditor` behind `requestIdleCallback`.** `Dex.species.all()` (~1,200 entries) runs synchronously on first chunk load and blocks 50–200 ms on mobile. Wrap the index build in `requestIdleCallback`/`setTimeout(0)` with a Promise. Effort: ~1 hr.
3. **Replace `motion/react` in `PasteInput.tsx` with CSS transitions.** `PasteInput` is statically imported by `/` (the only client homepage). `motion` lands in the main chunk (~60–80 KB) even with `optimizePackageImports` because the import is reached eagerly. CSS-only fade/slide is zero-cost. Effort: ~1 hr.

## RECOMMENDED IMPLEMENTATION TICKET

**Title:** Lazy-load `moves.ts` + `pokemon.ts` as JSON
**Priority:** High
**Effort:** ~2 hr
**Why:** 7,500+ lines of literal data are currently parsed eagerly inside any chunk rendering report slides (`PokemonDetailSlide`, `MatchupPlanSlide`). Both files are dead weight 95% of session time.
**Scope:** (a) Move `MOVES` and `POKEMON` objects to `src/lib/data/moves.json` and `pokemon.json`. (b) Refactor `move-type-style.ts` and `lookupPokemon()` to async getters using `await import("./moves.json")`. (c) Update call sites in `PokemonDetailSlide`, `MatchupPlanSlide` to await once on mount (already lazy chunks → fine). (d) `npx tsc --noEmit && npm run build`.
**Acceptance:** Slide chunks shrink by 300+ KB raw; LCP on `/s/[id]` improves on cold mobile.
