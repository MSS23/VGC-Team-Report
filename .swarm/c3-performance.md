# C3 Performance Benchmark Report

**Date:** 2026-05-26
**Build tool:** Next.js 16.2.6 (Turbopack)
**Build time:** 37.4s compile + 16.8s TypeScript

---

## 1. Build Output Summary

The build completes successfully (with non-fatal DB connection warnings during SSG for `/champions/[pokemon]` pages due to missing `DATABASE_URL` in the CI environment).

**Route breakdown:**
- **Static (SSG):** `/`, `/champions`, `/changelog`, `/compare`, `/dashboard`, `/explore`, `/faq`, `/feedback`, `/privacy`, `/terms`, `/tournaments`, `/sitemap.xml`
- **SSG with params:** `/champions/[pokemon]` (58 paths, revalidate 1h)
- **Dynamic (server-rendered):** 44 API routes, `/s/[id]`, `/creator/[name]`, `/embed/[id]`, etc.

**Total client-side JS in `.next/static`:** ~11 MB (Turbopack output; does not report per-route First Load JS like Webpack builds do).

---

## 2. Top 5 Largest Client Components

### 2.1 `InlinePokemonEditor.tsx` — imports `@pkmn/dex` directly (client-side)
- **File:** `src/components/report/InlinePokemonEditor.tsx` (231 lines, `"use client"`)
- **Issue:** Imports `{ Dex } from "@pkmn/dex"` at module scope. `@pkmn/dex` is **52 MB on disk** (index.mjs alone is 2.3 MB, learnsets 4.9 MB). Even though `InlinePokemonEditor` is dynamically imported via `next/dynamic` in `PokemonCard.tsx`, the entire `@pkmn/dex` dataset (including learnsets for every Pokemon across all generations) ships in the client chunk.
- **Evidence:** The 3.1 MB client chunk contains learnset data: `missingno:{learnset:{blizzard:["1M"],...}}`, `bulbasaur:{learnset:{...}}` — the entire Showdown learnset database.
- **Impact:** ~6.7 MB of client JS from `@pkmn/dex` chunks alone (3.1 MB + 1.8 MB + 1.8 MB).

### 2.2 `pokemon.ts` + `pkmn-dex-fallback.ts` — 3,330 lines of inline Pokemon data
- **File:** `src/lib/data/pokemon.ts` (3,330 lines) + `src/lib/data/pkmn-dex-fallback.ts`
- **Issue:** `pokemon.ts` contains a massive `POKEMON_DATA` record with ~500 Pokemon entries hard-coded as inline objects, AND imports `lookupPokemonFromDex` from `pkmn-dex-fallback.ts` which also imports `@pkmn/dex`. This file is imported by client components (`SpeedTierChart`, `PokemonDetailSlide`, `PokemonCard`, `CompareContent`) — pulling the entire chain into client bundles.
- **Impact:** ~3,330 lines of static data + the `@pkmn/dex` fallback all bundled client-side.

### 2.3 `moves.ts` — 4,183 lines of inline move data
- **File:** `src/lib/data/moves.ts` (4,183 lines)
- **Issue:** Contains the full `MOVES` record with every competitive move's type, category, power, and flags. Imported by `OffensiveCoverageChart` (dynamically loaded), `move-type-style.ts`, and `stat-relevance.ts` — the latter two are likely bundled into client code. The entire 4,183-line file ships even when only a few move lookups are needed.
- **Impact:** Large static data payload in client bundle.

### 2.4 `ChangelogContent.tsx` — 1,133 lines / 96 KB of inline changelog data
- **File:** `src/app/changelog/ChangelogContent.tsx` (1,133 lines, 96 KB, `"use client"`)
- **Issue:** Contains the entire changelog history as a massive inline array of objects (`ENTRIES`). Every version entry with all its text descriptions ships in the client bundle. Also imports `motion/react` for animations. This data should be loaded from a JSON file or API endpoint and paginated.
- **Impact:** ~96 KB of raw source text in the client bundle, growing with every release.

### 2.5 `page.tsx` (Home) — 1,881 lines, imports 30+ modules
- **File:** `src/app/page.tsx` (1,881 lines, `"use client"`)
- **Issue:** This is the main app page and it's entirely a client component. It imports ~30 modules including `TeamReport`, `TournamentMode`, `PasteInput`, `Navbar`, Clerk auth, and various utilities. While some heavy components are dynamically imported (ShareModal, CommentSection, OTSSheetModal, PrintableReport), core components like `TeamReport`, `PasteInput`, `Navbar`, `SlideNavControls` are statically imported. The file also imports `CHAMPIONS_SAMPLE_TEAMS` data.
- **Impact:** Massive initial JS bundle for the homepage; every visitor downloads all this code before hydration.

---

## 3. Oversized npm Dependencies

| Package | `node_modules` size | Client-side? | Notes |
|---------|-------------------|-------------|-------|
| `posthog-js` | **55 MB** | Yes (deferred) | Dynamically imported via `requestIdleCallback` — well-optimized |
| `@pkmn/dex` | **52 MB** | **Yes (eagerly)** | Ships learnsets + species data for every gen to client |
| `@sentry/nextjs` | **51 MB** | Yes | Client config is minimal but SDK is large |
| `jspdf` | **29 MB** | Deferred | Dynamically imported in `export-report.ts` |
| `@clerk/nextjs` | **16 MB** | Yes | Auth SDK, unavoidable |
| `html2canvas-pro` | **6.1 MB** | Deferred | Dynamically imported on export action |
| `zod` | **6.2 MB** | Mixed | Used in API routes and some client validation |
| `axios` | **3 MB** | Potentially | Should use native `fetch` in Next.js |

---

## 4. Performance Anti-Patterns Found

### 4.1 `@pkmn/dex` ships full dataset to client (CRITICAL)
- `InlinePokemonEditor.tsx` does `import { Dex } from "@pkmn/dex"` in a `"use client"` component
- `pkmn-dex-fallback.ts` (no directive, but imported by `pokemon.ts` which is used in client components) also imports `{ Dex } from "@pkmn/dex"`
- The result: **~6.7 MB of minified @pkmn/dex data** ships to every client, including learnsets, abilities, and species data for all 9 generations
- `@pkmn/dex` is NOT in `optimizePackageImports` (only `motion/react` is listed)

### 4.2 Zero usage of `next/image` (MODERATE)
- The entire codebase uses raw `<img>` tags — there are **zero imports of `next/image`** anywhere in `src/`
- Components using `<img>`: `TeamCardExport`, `OTSSheetModal`, `CollaboratorPanel`, `ChampionsContent`, `MegaLandingContent`, `CreatorProfile`, `ItemIcon`, `PokemonSprite`, `ReportCard`, `Navbar`, `TeamOverview`, `PasteInput`, `ExploreEmpty`, `SpotlightCard`, `DashboardContent`, `profile/page`
- **Note:** Some of these (`TeamCardExport`, `OTSSheetModal`) use `<img>` intentionally because `html2canvas` cannot capture `<Image>` components. But the majority (sprites, avatars, logos) would benefit from `next/image` optimization (WebP/AVIF, responsive sizing, lazy loading, blur placeholders).

### 4.3 Large inline data arrays in client components (MODERATE)
- `pokemon.ts`: 3,330 lines of Pokemon data — all bundled client-side via import chain
- `moves.ts`: 4,183 lines of move data — partially bundled client-side
- `pokemon-types-map.ts`: 1,336 lines — but only used in a server API route (good)
- `ChangelogContent.tsx`: 96 KB of changelog entries as inline array — grows unboundedly
- `champions-sample-teams.ts`: 220 lines imported into the homepage

### 4.4 Missing dynamic imports for heavy components (LOW-MODERATE)
- `PokemonDetailSlide` is statically imported in `TeamReport.tsx` (line 10) while `SpeedTierChart`, `OffensiveCoverageChart`, `DefensiveCoverageChart`, `MatchupPlanSlide`, and `MatchupSheet` are correctly dynamically imported
- `MegaLandingContent` is statically imported in the Champions page (but this page is server-rendered SSG, so it's less impactful)
- `TournamentMode` is statically imported in `page.tsx` but is only shown conditionally

### 4.5 Missing Suspense boundaries (LOW)
- The main `page.tsx` wraps only the `PostHogPageView` in Suspense
- Most dynamically imported components in `page.tsx` provide loading skeletons via `dynamic()`'s `loading` option, which is good
- The `/explore` and `/dashboard` pages have loading.tsx files for streaming — well done
- However, the `/changelog` page (96 KB client component) has no loading skeleton or Suspense boundary

### 4.6 `axios` dependency is unnecessary (LOW)
- `axios` (3 MB) is a dependency but Next.js has built-in `fetch` with caching, revalidation, and streaming. Could be replaced to remove a dependency.

---

## 5. Priority Recommendations

### P0 — Critical: Fence `@pkmn/dex` from client bundles (~6.7 MB savings)
1. **Move `InlinePokemonEditor`'s species search to a server action or API route.** The component currently calls `Dex.species.all()` on the client to build a search index. This should be a server endpoint (`/api/species-search?q=...`) that returns the filtered results. The component stays lightweight; the 52 MB Dex stays server-side.
2. **Lazy-load `pkmn-dex-fallback.ts` with dynamic `import()`** instead of static import in `pokemon.ts`, or split `lookupPokemon` into a client-safe version (static data only) and a server-enriched version.
3. **Add `@pkmn/dex` to `optimizePackageImports`** in `next.config.ts` as an interim measure.

### P1 — High: Externalize inline data files (~200 KB savings)
1. Move `ChangelogContent.tsx` entries to a JSON file loaded via `fetch` or a server component, with client-side pagination.
2. Consider moving `POKEMON_DATA` and `MOVES` to server-only modules or use `server-only` package marker, exposing only a lookup API to client components.

### P2 — Medium: Adopt `next/image` for sprites and avatars
1. Replace `<img>` with `<Image>` in `PokemonSprite`, `Navbar`, `ReportCard`, `ExploreEmpty`, `SpotlightCard`, `CreatorProfile`, `DashboardContent` — anywhere that doesn't need `html2canvas` compatibility.
2. Benefits: automatic WebP/AVIF, responsive `srcset`, lazy loading, blur placeholders, and CLS prevention.

### P3 — Medium: Dynamic import remaining heavy components
1. Make `PokemonDetailSlide` dynamic in `TeamReport.tsx` (it's already the pattern for siblings).
2. Make `TournamentMode` dynamic in `page.tsx` (only rendered conditionally).

### P4 — Low: Remove `axios`, use native `fetch`
1. Replace any `axios` calls with `fetch` to drop the 3 MB dependency.

---

## 6. Estimated Impact

| Optimization | Est. Client JS Savings | Effort |
|-------------|----------------------|--------|
| Fence @pkmn/dex from client | ~6.7 MB | Medium (API route + refactor) |
| Externalize changelog data | ~100 KB | Low (JSON file + fetch) |
| Externalize pokemon/moves data | ~100 KB | Medium (server-only pattern) |
| Adopt next/image | Indirect (bandwidth) | Low-Medium |
| Dynamic import remaining components | ~50-100 KB | Low |
| Remove axios | ~3 MB (node_modules) | Low |

**Total potential client JS reduction: ~7 MB+ (primarily from @pkmn/dex)**
