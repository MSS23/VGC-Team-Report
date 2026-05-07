# Bundle Performance Analysis — VGC Team Report

_Analyzed: 2026-05-07 (static read-only analysis, no build run)_

---

## 1. Dependency Weight Estimates

| Package | Est. min+gzip | Notes |
|---|---|---|
| `jspdf` ^4.2.1 | ~300 KB | PDF generation |
| `html2canvas-pro` ^2.0.2 | ~200 KB | DOM-to-canvas |
| `@pkmn/dex` ^0.10.7 | ~150–250 KB | Full Showdown Pokémon dataset |
| `posthog-js` ^1.364.7 | ~80–120 KB | Analytics SDK |
| `motion` ^12.35.2 | ~60–80 KB | Animation library (12 components) |
| `@sentry/nextjs` ^10.45.0 | ~50–80 KB | Error tracking |
| `@clerk/nextjs` ^7.0.6 | ~40–60 KB | Auth SDK |
| `vanilla-cookieconsent` ^3.1.0 | ~20 KB | Cookie banner |
| `qrcode` ^1.5.4 | ~15 KB | QR generation |

**Estimated heavy client bundle risk: ~750–1100 KB uncompressed**

---

## 2. Dynamic Import Coverage (Positive Findings)

The following are correctly lazy-loaded:
- `jspdf` and `html2canvas-pro` — both dynamically imported inside async helpers in `/src/lib/utils/export-report.ts`. Neither appears in the initial bundle.
- `qrcode` — dynamically imported on demand in `TeamOverview.tsx`.
- `PrintableReport` (PdfExport), `ShareModal`, `ShareDock`, `CommentSection`, `CollaboratorPanel`, `DiffNavigator`, `EditChangelog` — all `next/dynamic` in `page.tsx`.
- `SpeedTierChart`, `OffensiveCoverageChart`, `DefensiveCoverageChart`, `MatchupPlanSlide`, `MatchupSheet` — all `next/dynamic` in `TeamReport.tsx`.
- `InlinePokemonEditor` (which imports `@pkmn/dex`) — dynamically loaded from `PokemonCard.tsx`.
- `motion/react` — listed under `optimizePackageImports` in `next.config.ts` for tree-shaking.

---

## 3. Problems Found

### Problem 1: `posthog-js` static imports pull analytics into the main chunk (HIGH)

**Files with `import posthog from "posthog-js"` (direct, eager):**
- `/src/components/report/TeamCardCTA.tsx` — statically imported in `page.tsx` line 10
- `/src/components/social/ReactionBar.tsx` — statically imported in `page.tsx` line 20
- `/src/components/social/SaveButton.tsx` — statically imported in `page.tsx` line 21
- `/src/hooks/useShareFlow.ts` — statically imported via `useHomePage` → `page.tsx`
- `/src/components/providers/PostHogProvider.tsx` — root layout import (unavoidable for the provider itself)

`TeamCardCTA`, `ReactionBar`, and `SaveButton` are all static top-level imports in `page.tsx`. Each pulls `posthog-js` (~80–120 KB) into the main bundle even though `PostHogProvider` already exposes the singleton via context. `useShareFlow` is similarly pulled in transitively.

**Fix:** Replace `import posthog from "posthog-js"` in these files with `usePostHog()` from `"posthog-js/react"`. This eliminates the direct SDK import without affecting analytics functionality, since the provider already initialises the singleton.

Note: `page.tsx` and `useHomePage.ts` already use `usePostHog()` — only the three components and `useShareFlow` need updating.

---

### Problem 2: `PdfExport.tsx` export chain leaks into non-export component chunks (HIGH)

**Affected files:**
- `/src/components/report/PokemonDetailSlide.tsx` line 25: `import { useIsPrintMode } from "@/components/ui/PdfExport"`
- `/src/components/report/MatchupPlanSlide.tsx` line 16: same import

`PdfExport.tsx` (255 lines) exports both the heavy `PrintableReport`/`PdfExportButton` components AND the lightweight `PrintContext`/`useIsPrintMode` hook. Because `PokemonDetailSlide` and `MatchupPlanSlide` import `useIsPrintMode` from this module, the entire `PdfExport` module is resolved — including all its imports of report sub-components — into any chunk that includes these components.

`PokemonDetailSlide` is referenced from `TeamReport.tsx` (in a dynamically-loaded chunk), so the immediate blast radius is contained. However, if the chunk bundler cannot tree-shake `PdfExport`'s side-heavy component exports (it cannot, since they share the same module), every chunk that renders report slides pays the cost.

**Fix:** Extract `PrintContext` and `useIsPrintMode` into a dedicated file (e.g. `/src/components/ui/print-context.ts`). Update all three import sites. This severs the import chain so `PdfExport.tsx`'s heavy component tree is only included in the actual PDF-export chunk.

---

### Problem 3: `@pkmn/dex` synchronous species iteration at module load time (MEDIUM)

**File:** `/src/components/report/InlinePokemonEditor.tsx` lines 26–42

`InlinePokemonEditor` imports `Dex` from `@pkmn/dex` as a static top-level import, and immediately defines a lazy-initialised `SPECIES_INDEX` that calls `Dex.species.all()` (~1200+ entries) synchronously the first time `getSpeciesIndex()` is called. While `InlinePokemonEditor` itself is correctly `dynamic()`-imported in `PokemonCard.tsx`, when the chunk first loads it synchronously iterates the full dex on the main thread — blocking interaction for potentially 50–200 ms on mobile.

**Fix:** Move the species index build into a Web Worker or wrap in `requestIdleCallback`. Alternatively, pre-build the species list at build time and ship it as a pre-serialised JSON asset, bypassing the runtime `@pkmn/dex` iteration entirely.

---

### Problem 4: Large static data literals pulled into report chunk via `PokemonDetailSlide` (MEDIUM)

**Files:**
- `/src/lib/data/moves.ts` — 4,183 lines; the full VGC move database as a TypeScript literal object
- `/src/lib/data/pokemon.ts` — 3,330 lines; full Pokémon stat/type data
- `/src/lib/data/pokemon-types-map.ts` — 1,336 lines

`move-type-style.ts` imports `MOVES` from `moves.ts` at the top level, and `PokemonDetailSlide` statically imports `getMoveTypeStyle` from `move-type-style.ts`. This chains `moves.ts` (4,183 lines of literals) into the `PokemonDetailSlide` chunk. `pokemon.ts` is similarly pulled in via `lookupPokemon`.

Although these chunks are lazy-loaded (via `SpeedTierChart` and `MatchupPlanSlide` dynamic imports), the data files themselves cannot be tree-shaken — the entire object is emitted.

**Fix:** Convert `moves.ts` and `pokemon.ts` to `.json` files and load them with `import()` or `fetch()` lazily inside the functions that need them. This moves the data out of JS parse budget and into the network/parse-on-demand path.

---

### Problem 5: No `loading.tsx` route segments — zero Suspense fallbacks for page transitions (MEDIUM)

**Finding:** `find src/app -name "loading.tsx"` returns nothing. No route segment has a `loading.tsx` file.

The app relies on `next/dynamic` with inline skeletons for some components, but there are no Next.js App Router streaming boundaries (`loading.tsx`) for any route. The main `page.tsx` (1,663 lines, `"use client"`) has a single `<Suspense>` wrapping only `useSearchParams` — no meaningful loading skeleton for the full page shell.

Routes with server data fetching (`/explore`, `/dashboard`, `/s/[id]`) will block rendering until all server components resolve. With no `loading.tsx`, users see a blank screen during navigation rather than a skeleton/spinner.

**Fix:** Add `loading.tsx` files to at minimum `/src/app/explore/`, `/src/app/dashboard/`, and `/src/app/s/[id]/`. Each should return a lightweight skeleton matching the page layout.

---

### Problem 6: `motion/react` in `PasteInput` adds animation cost to critical render path (LOW-MEDIUM)

**File:** `/src/components/input/PasteInput.tsx` line 5: `import { motion } from "motion/react"`

`PasteInput` is a statically-imported component in `page.tsx`. Although `motion/react` is in `optimizePackageImports` (enabling tree-shaking of named exports), `motion` itself still lands in the main chunk because `PasteInput` is a static import. The `motion` library adds ~60–80 KB.

**Fix:** Lazy-import the animated sub-parts of `PasteInput` separately, or replace `<motion.div>` with CSS transitions for the input area (which are zero-cost). `ChangelogContent` is already isolated to its own route so its impact is confined.

---

### Problem 7: No `next/image` anywhere in the codebase (LOW)

All `<img>` tags use raw HTML. Pokémon sprites (`play.pokemonshowdown.com`), user avatars (`img.clerk.com`), and local icons are never lazy-loaded, WebP-converted, or size-optimised.

Worst-affected: `/src/components/explore/ReportCard.tsx` and `SpotlightCard.tsx` render potentially 20+ sprite images per page load with no `loading="lazy"` attribute.

**Fix:** Add `loading="lazy"` to all `<img>` tags in list/feed components immediately. Migrate Clerk avatar images to `next/image` for automatic WebP + responsive sizing. Sprite proxy images cannot use `next/image` without adding `play.pokemonshowdown.com` to `next.config.ts` `images.remotePatterns`.

---

## 4. Next.js Config Observations

- `optimizePackageImports: ["motion/react"]` — good, enables named-export tree-shaking.
- No `@next/bundle-analyzer` configured — no visibility into precise per-chunk sizes.
- No custom webpack config — standard Next.js chunk splitting applies.
- No `images.remotePatterns` — `next/image` cannot be used for external sprite URLs without adding it.

---

## Summary of Recommendations (Priority Order)

| # | Priority | Fix | Est. saving |
|---|---|---|---|
| 1 | HIGH | Replace `import posthog from "posthog-js"` in `TeamCardCTA`, `ReactionBar`, `SaveButton`, `useShareFlow` with `usePostHog()` | ~80–120 KB from main chunk |
| 2 | HIGH | Extract `PrintContext`/`useIsPrintMode` from `PdfExport.tsx` into a standalone `print-context.ts` | Prevents PdfExport component tree leaking into report chunks |
| 3 | MEDIUM | Defer `@pkmn/dex` species iteration in `InlinePokemonEditor` using `requestIdleCallback` or pre-built JSON | ~50–200 ms main-thread unblock on mobile |
| 4 | MEDIUM | Convert `moves.ts` and `pokemon.ts` to JSON + lazy `import()` | Moves ~500+ KB of literals out of JS parse budget |
| 5 | MEDIUM | Add `loading.tsx` to `/explore`, `/dashboard`, `/s/[id]` routes | Eliminates blank-screen during navigation |
| 6 | LOW | Add `loading="lazy"` to `<img>` in `ReportCard`, `SpotlightCard`, `ExploreEmpty` | Reduces LCP cost on explore feed |
| 7 | LOW | Add `@next/bundle-analyzer` as dev dependency | Enables precise per-chunk auditing |
