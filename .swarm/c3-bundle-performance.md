# Bundle Performance Analysis — VGC Team Report

_Analyzed: 2026-05-07 (static analysis, no build run)_

---

## 1. Dependency Weight Estimates

| Package | Estimated minified+gzip | Notes |
|---|---|---|
| `jspdf` ^4.2.1 | ~300 KB | PDF generation, only needed on export action |
| `html2canvas-pro` ^2.0.2 | ~200 KB | DOM-to-canvas capture, only needed on export action |
| `@pkmn/dex` ^0.10.7 | ~150–250 KB | Full Showdown Pokémon dataset, used only for InlinePokemonEditor |
| `posthog-js` ^1.364.7 | ~80–120 KB | Analytics SDK, loaded eagerly in page.tsx |
| `motion` ^12.35.2 | ~60–80 KB | Animation library, used in 12 components |
| `@sentry/nextjs` ^10.45.0 | ~50–80 KB | Error tracking (server+client) |
| `@clerk/nextjs` ^7.0.6 | ~40–60 KB | Auth SDK |
| `vanilla-cookieconsent` ^3.1.0 | ~20 KB | Cookie banner |
| `qrcode` ^1.5.4 | ~15 KB | QR code generation |

**Total heavy client-side bundle risk: ~750–1100 KB uncompressed**

---

## 2. Dynamic Import Coverage (Positive Findings)

### Correctly lazy-loaded
- `jspdf` — dynamically imported inside `getJsPDF()` in `/src/lib/utils/export-report.ts`
- `html2canvas-pro` — dynamically imported inside `getHtml2Canvas()` in the same file
- `qrcode` — dynamically imported inside `TeamOverview.tsx` on demand (`import("qrcode")`)
- `PrintableReport` from `PdfExport` — dynamically imported in `page.tsx` via `next/dynamic`
- `ShareModal`, `ShareDock`, `CommentSection`, `CollaboratorPanel`, `DiffNavigator`, `EditChangelog` — all properly dynamic-imported in `page.tsx`
- `SpeedTierChart`, `OffensiveCoverageChart`, `DefensiveCoverageChart`, `MatchupPlanSlide`, `MatchupSheet` — all `next/dynamic` in `TeamReport.tsx`
- `InlinePokemonEditor` (which imports `@pkmn/dex`) — dynamically loaded from `PokemonCard.tsx`
- `motion/react` — listed in `next.config.ts` under `optimizePackageImports`

---

## 3. Problems Found

### Problem 1: `posthog-js` eager-imported in `page.tsx` (HIGH IMPACT)

**File:** `/src/app/page.tsx` line 38
```ts
import posthog from "posthog-js";
```
`posthog-js` (~80–120 KB) is a **static top-level import** in the main page file — it lands in the initial JS bundle for every visitor, including anonymous users who never trigger analytics events. The `PostHogProvider` component already handles initialization lazily inside a `useEffect`, so there is no render-blocking reason for this eager import. The direct `posthog.capture()` calls in `page.tsx` (lines 553, 648) could be replaced with `usePostHog()` (already available via the provider) or the `posthog` singleton accessed through a helper, eliminating the top-level import.

**Also affected:** `posthog-js` is imported directly (not dynamically) in:
- `/src/components/social/ShareModal.tsx`
- `/src/components/social/FollowButton.tsx`
- `/src/components/social/CreatorProfile.tsx`
- `/src/components/social/SaveButton.tsx`
- `/src/components/social/ReactionBar.tsx`
- `/src/components/explore/ExploreContent.tsx`
- `/src/hooks/useHomePage.ts`
- `/src/hooks/useShareFlow.ts`
- `/src/app/champions/ChampionsContent.tsx`

Some of these are themselves dynamically imported components (e.g. ShareModal via `dynamic()`), which helps. But `useHomePage.ts` is imported statically into `page.tsx`, pulling `posthog-js` into the main bundle regardless.

**Fix:** Replace direct `import posthog from "posthog-js"` in `page.tsx` and `useHomePage.ts` with `usePostHog()` from `"posthog-js/react"`. The `PostHogProvider` already wraps the app and exposes the singleton.

### Problem 2: `PdfExport.tsx` context pollutes non-export components (MEDIUM IMPACT)

**Files:**
- `/src/components/report/PokemonSprite.tsx` — static import of `useIsPrintMode` from `PdfExport`
- `/src/components/report/PokemonDetailSlide.tsx` — static import of `useIsPrintMode` from `PdfExport`
- `/src/components/report/MatchupPlanSlide.tsx` — static import of `useIsPrintMode` from `PdfExport`

`PdfExport.tsx` exports both the heavy `PrintableReport`/`PdfExportButton` components AND the lightweight `PrintContext`/`useIsPrintMode` helpers. Because `PokemonSprite`, `PokemonDetailSlide`, and `MatchupPlanSlide` all `import { useIsPrintMode } from "@/components/ui/PdfExport"`, the **entire PdfExport module** (which imports all report sub-components) is pulled into any chunk that includes these components — potentially leaking into the main bundle.

**Fix:** Extract `PrintContext` and `useIsPrintMode` into a separate tiny file (e.g. `/src/components/ui/print-context.ts`). This severs the import chain so the heavy report rendering logic in `PdfExport.tsx` remains truly split.

### Problem 3: `@pkmn/dex` — module-level initialization in `InlinePokemonEditor.tsx` (MEDIUM IMPACT)

**File:** `/src/components/report/InlinePokemonEditor.tsx` lines 22–40

`InlinePokemonEditor` imports `Dex` from `@pkmn/dex` as a static top-level import. Immediately at module load time it iterates `Dex.species.all()` (~1200+ entries) to build `SPECIES_INDEX`. `InlinePokemonEditor` itself is dynamically imported in `PokemonCard.tsx`, which is good — but the module-level index build runs synchronously when the chunk is first loaded. This means the first time a user opens the editor, they pay the full `@pkmn/dex` parse cost synchronously on the main thread.

**Fix:** Move the `SPECIES_INDEX` build into an async Web Worker or use `requestIdleCallback` to defer it. Alternatively, pre-build the species list at build time and ship it as a smaller JSON asset, avoiding the full `@pkmn/dex` runtime on the client.

### Problem 4: Large static data files bundled client-side (MEDIUM IMPACT)

**Files:**
- `/src/lib/data/moves.ts` — 4,183 lines; exports `MOVES` record (~hundreds of moves)
- `/src/lib/data/pokemon.ts` — 3,330 lines; exports `POKEMON_DATA` record
- `/src/lib/data/pokemon-types-map.ts` — 1,336 lines

`MOVES` is referenced from `TypeCoverageMatrix.tsx`, `TeamComparisonSlide.tsx`, and `move-type-style.ts`. `POKEMON_DATA` is referenced from `SpeedTierChart.tsx` (dynamically loaded) and several other components. These large TypeScript literal objects are included verbatim in the JS bundle. While they're used by lazily-loaded components in many cases, `move-type-style.ts` and `stat-relevance.ts` use `MOVES` directly and may be pulled into the main chunk via `PokemonDetailSlide` (statically imported).

**Fix:** Convert these files to JSON and load them with `import()` or `fetch()` lazily, or ensure they only appear in dynamically-loaded code paths. Alternatively, use Next.js Route Handlers to serve this data as API responses, moving it fully off the client bundle.

### Problem 5: `motion/react` imported in PasteInput and ChangelogContent without SSR consideration (LOW-MEDIUM IMPACT)

**Files:**
- `/src/components/input/PasteInput.tsx` line 5: `import { motion } from "motion/react"`
- `/src/app/changelog/ChangelogContent.tsx` line 4: `import { motion } from "motion/react"`

`PasteInput` is a statically imported component in `page.tsx`. Although `motion/react` is in `optimizePackageImports` in `next.config.ts` (which enables tree-shaking via the Next.js bundler), `motion` is still included in the main chunk because `PasteInput` is a static import. `motion` adds ~60–80 KB. For a form that exists below-the-fold on first paint, this is unnecessary.

**Fix:** Either wrap `PasteInput`'s motion usage with `useReducedMotion` and fallback to CSS transitions, or lazy-import the motion-using parts of `PasteInput` separately. `ChangelogContent` is already a page-level component so its impact is isolated to that route.

---

## 4. Images — No `next/image` Usage

`next/image` is **never used** in this codebase. All images use raw `<img>` tags:
- `/src/components/social/CreatorProfile.tsx`
- `/src/components/report/ItemIcon.tsx`
- `/src/components/input/PasteInput.tsx`
- `/src/components/social/CollaboratorPanel.tsx`
- `/src/components/report/TeamOverview.tsx`
- `/src/components/layout/Navbar.tsx`
- `/src/components/report/PokemonSprite.tsx`
- `/src/components/explore/ReportCard.tsx`
- `/src/app/dashboard/DashboardContent.tsx`
- `/src/app/dashboard/profile/page.tsx` (2 instances)
- `/src/app/champions/[pokemon]/MegaLandingContent.tsx`
- `/src/app/embed/[id]/page.tsx`
- `/src/components/explore/SpotlightCard.tsx`
- `/src/components/explore/ExploreEmpty.tsx`

Many of these load external Pokémon sprites from `play.pokemonshowdown.com`. Without `next/image`, there is **no automatic WebP conversion, no lazy loading via `loading="lazy"`, no blur-up placeholder, and no automatic `sizes` optimization**. This is particularly impactful for the `/explore` feed (`ReportCard`, `SpotlightCard`) which renders many sprites per page.

**Note:** `next/image` cannot be used for all external domains without configuring them in `next.config.ts`. Some `<img>` usages (like the sprite proxy) have intentional reasons for using raw `<img>` (CORS requirements). However, user avatars (Clerk `img.clerk.com`) and local public assets are good immediate candidates.

---

## 5. Static Assets in `public/`

The `public/` directory is clean — only small PWA icons and SVGs. No large unoptimized images or fonts are served statically. The largest file is `icon-512.png` at 24 KB, which is appropriately sized.

No issues here.

---

## 6. Next.js Config Observations

- `optimizePackageImports: ["motion/react"]` is set — this enables tree-shaking for named exports from `motion/react`. Good.
- No `bundleAnalyzer` configured. Recommend adding `@next/bundle-analyzer` as a dev dependency for precise bundle inspection.
- No `webpack` custom config — standard Next.js chunk splitting applies.

---

## Summary of Recommendations (Priority Order)

1. **HIGH** — Remove `import posthog from "posthog-js"` from `page.tsx` and `useHomePage.ts`; use `usePostHog()` hook instead. Saves ~80–120 KB from the main chunk.
2. **HIGH** — Extract `PrintContext`/`useIsPrintMode` into a standalone file to prevent `PdfExport.tsx`'s full component tree from leaking into non-export chunks.
3. **MEDIUM** — Defer `@pkmn/dex` species index build in `InlinePokemonEditor.tsx` using `requestIdleCallback` or a Web Worker.
4. **MEDIUM** — Audit `moves.ts` and `pokemon.ts` static imports to confirm they are never pulled into the main chunk; consider JSON + `fetch()` for the largest data sets.
5. **LOW** — Add `loading="lazy"` to all `<img>` tags in list/feed components (`ReportCard`, `SpotlightCard`, `ExploreEmpty`); migrate Clerk avatar images to `next/image` for automatic WebP + sizing.
6. **LOW** — Add `@next/bundle-analyzer` to dev dependencies and run on next build to get precise per-chunk sizes before/after optimizations.
