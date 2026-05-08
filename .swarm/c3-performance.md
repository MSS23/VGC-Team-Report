# Bundle Size & Performance Analysis
**Date:** 2026-05-08  
**Build:** Next.js 16.2.2 (Turbopack)  
**Analyst:** c3-performance agent

---

## Build Status

Build succeeds with warnings:
- `⚠ The "middleware" file convention is deprecated` — `src/middleware.ts` should be renamed to `proxy.ts`
- DB connection errors during static page generation for `/champions/[pokemon]` routes — expected in local build (no `DATABASE_URL` env var)

---

## Home Page First-Load JS

**Total: ~3.5MB raw / ~820KB gzip**

| Chunk | Raw | Gzip | Contents |
|-------|-----|------|----------|
| `0uu0-pzi~xr_-.js` | 2,141KB | **419KB** | Main app logic: Pokemon analysis engine, all components, hooks, POKEMON_DATA static map |
| `0rwwge57xnfls.js` | 199KB | 62KB | React + scheduler runtime |
| `0mn.b9iy1~frl.js` | 170KB | **55KB** | PostHog + Sentry client SDKs |
| `0k_dx0g55s_1c.js` | 202KB | **52KB** | motion/react + Clerk client |
| `069~_h90gxh59.js` | 115KB | 38KB | App components |
| `03~yq9q893hmn.js` | 110KB | 38KB | App components |
| `124n_vvotopco.js` | 52KB | 19KB | vanilla-cookieconsent |
| `05sx~xv5j49du.js` | 93KB | 24KB | App utilities |
| `0a0myxlrdpdpj.js` | 40KB | 12KB | Mega Pokemon static data + nav |
| smaller chunks | ~200KB | ~60KB | Various utilities |

**820KB gzip is well above the 150KB recommended first-load budget.**

---

## Chunk Size Overview (Raw)

| Chunk | Raw | Gzip | Status |
|-------|-----|------|--------|
| `0cwh-y-4wc.-9.js` | **3,197KB** | 392KB | @pkmn/dex learnsets — **LAZY** (not in initial load) |
| `12i0_c8xmaqqh.js` | 2,192KB | 420KB | Main app module (alt entrypoint) |
| `0uu0-pzi~xr_-.js` | 2,192KB | 420KB | Main app module (home entrypoint) |
| `0xr012s5lag5a.js` | 418KB | 132KB | html2canvas-pro + jsPDF — **LAZY** |
| `0i4g9_wngqb2c.js` | 226KB | 56KB | html2canvas internals chunk — LAZY |

---

## Lazy Loading Status

### What IS lazy loaded correctly

| Library | How | Estimated savings |
|---------|-----|-------------------|
| `html2canvas-pro` (~200KB gz) | `async import()` in `export-report.ts` | ~200KB deferred |
| `jspdf` | `async import()` in `export-report.ts` | ~130KB deferred |
| `@pkmn/dex` learnsets (~392KB gz) | Loaded only by `InlinePokemonEditor` (8KB chunk via `dynamic()`) | ~392KB deferred |
| `ShareModal` (32KB source) | `next/dynamic()` | ~30KB deferred |
| `CommentSection` | `next/dynamic()` | ~20KB deferred |
| `SpeedTierChart`, `MatchupPlanSlide` | `next/dynamic()` in TeamReport | ~50KB deferred |
| `PrintableReport` | `next/dynamic()` | ~10KB deferred |
| `QRCode` | Inline `import()` in TeamOverview | ~10KB deferred |

### What is NOT lazy loaded (but could be)

| Library | Where loaded | Size (gz) | Reason it's eager |
|---------|-------------|-----------|-------------------|
| `posthog-js` + `posthog-js/react` | `PostHogProvider` in `layout.tsx` | ~55KB | `PostHogProvider` wraps all children — loaded on every page even for anonymous users who haven't consented |
| `motion/react` | Multiple components (`PasteInput`, `ChangelogContent`, `ExploreContent`, etc.) | ~30KB | Not isolated to lazy-loaded routes; `optimizePackageImports` helps but all pages share the chunk |
| `@clerk/nextjs` (client) | `Navbar.tsx`, `useHomePage.ts`, multiple social components | ~25-30KB of the 52KB motion+clerk chunk | Needed for auth state everywhere |
| `vanilla-cookieconsent` | `CookieBanner` in `layout.tsx` with `import * as` | 20KB | Mounted on every page; `import * as` prevents tree-shaking |
| Sentry SDK | Layout-level (via Next.js Sentry integration) | ~55KB | Required for error capture |

---

## Five Largest Client Components (by source file size)

1. **`src/app/page.tsx`** (72KB source) — Home page `"use client"` component. Contains the full `HomeContent` function with all state management. Many sub-components are lazy-loaded via `dynamic()`. The file itself is large but Turbopack splits it well.

2. **`src/app/changelog/ChangelogContent.tsx`** (64KB source) — A pure data + render component. Eagerly imports `motion/react` for animated entries. The changelog data (ENTRIES array with ~50 items of long text strings) bloats this. No lazy loading on this route.

3. **`src/app/dashboard/DashboardContent.tsx`** (56KB source) — Dashboard with multiple tabs (drafts, saved, feed, analytics). All data is client-fetched via `useEffect`. No code splitting by tab — all tab UI loads upfront.

4. **`src/components/report/PokemonDetailSlide.tsx`** (40KB source) — Per-Pokemon detail slide. Eagerly imports `useIsPrintMode` from `PdfExport.tsx`, which pulls in the full PDF export context. However, since PdfExport contains no heavy runtime deps (html2canvas/jspdf are lazily loaded separately), this is acceptable.

5. **`src/components/layout/Navbar.tsx`** (40KB source) — The persistent navbar. Loaded on every page. Transitively references the Mega Pokemon static data map (`mega-pokemon.ts`) which adds ~12KB to the nav chunk, but that's bundled with the main app chunk anyway.

---

## `import * as` Patterns (Tree-shaking risk)

| File | Pattern | Impact |
|------|---------|--------|
| `src/components/providers/CookieBanner.tsx` | `import * as CookieConsent from "vanilla-cookieconsent"` | Prevents tree-shaking; whole 196KB package included. However, the entire package is only 196KB and compresses to ~20KB — low priority |
| `src/app/global-error.tsx` | `import * as Sentry from "@sentry/nextjs"` | Sentry is already required in full for error capture; tree-shaking wouldn't help meaningfully here |

---

## Key Issues & Optimization Opportunities

### CRITICAL: Main app bundle too large (2.1MB / 419KB gzip)

The `0uu0-pzi~xr_-.js` chunk contains the complete app logic in one chunk. This is expected for a Next.js SPA-style page, but 419KB gzip is extremely high. Key contributors:
- `POKEMON_DATA` static map in `pokemon.ts` (236KB source file, ~3,300 lines)
- All report components (PokemonDetailSlide, TeamOverview, MatchupPlanSlide, SpeedTierChart) even though many are dynamically imported within TeamReport — they still ship in this chunk
- All hooks (`useHomePage` 36KB, etc.)

### Issue 1: PostHog loaded eagerly on all pages (~55KB gzip)

`PostHogProvider` is a top-level wrapper in `layout.tsx` and eagerly imports `posthog-js`. The `initPostHogAnonymous()` function runs even for users who haven't consented. While this is intentional for cookieless anonymous tracking, loading the full PostHog SDK (~55KB gz) on every page for all users (including API routes consumers) adds ~55KB to every page's first load.

**Fix:** Wrap `PostHogProvider` in a `dynamic()` with `ssr: false`:
```tsx
const PostHogProvider = dynamic(
  () => import("@/components/providers/PostHogProvider").then(m => ({ default: m.PostHogProvider })),
  { ssr: false }
);
```
**Estimated saving:** ~55KB gzip from initial JS

### Issue 2: motion/react in initial bundle from eager component imports (~30KB gzip)

Despite `optimizePackageImports: ["motion/react"]` in next.config.ts, motion/react ends up in the initial bundle because several components that ARE on the critical path use it: `PasteInput` (used on homepage), `ExploreContent`, `ReportCard`. The `ChangelogContent` and `DashboardContent` pages also use it but those are separate routes.

The `0k_dx0g55s_1c.js` chunk (52KB gz) contains motion/react + Clerk. Since Clerk is required on the homepage, this chunk can't be eliminated. But reducing motion usage in `PasteInput` (the main homepage component) could reduce the shared chunk.

**Fix:** Replace `motion` wrappers in `PasteInput` with CSS transitions (they're only used for simple fade/slide animations).  
**Estimated saving:** ~15-25KB from the initial motion chunk if PasteInput is the primary consumer

### Issue 3: DashboardContent loads all tab UI eagerly (~56KB source)

`DashboardContent` renders all 8 tab panels (drafts, saved, feed, analytics, collections, collab, trash) eagerly, even though only one tab is active at a time. Tab-specific components like the analytics charts/tables are always in the bundle.

**Fix:** Code-split tab content with `dynamic()` per tab:
```tsx
const AnalyticsTab = dynamic(() => import("./tabs/AnalyticsTab"));
const CollectionsTab = dynamic(() => import("./tabs/CollectionsTab"));
```
**Estimated saving:** ~15-20KB gzip from dashboard route

### Issue 4: vanilla-cookieconsent uses `import * as` (20KB gzip, always-on)

`CookieBanner` uses `import * as CookieConsent from "vanilla-cookieconsent"`, which imports the entire library. The library is small (196KB source → 20KB gz) but it's loaded on every single page as part of layout.tsx. It could be lazy-loaded since the banner only needs to show once.

**Fix:** 
```tsx
useEffect(() => {
  import("vanilla-cookieconsent").then(({ run }) => run(config));
}, []);
```
**Estimated saving:** ~20KB gzip moved from initial load to lazy

### Issue 5: ChangelogContent (64KB) has no code splitting for long entries

`ChangelogContent` contains ~64KB of static changelog text in a massive `ENTRIES` array. This is loaded for the `/changelog` route, but since the array is defined at module level, it can't be code-split easily. The entire changelog history (50+ versions) ships in one chunk.

**Fix:** Move older changelog entries into a separate lazy-loaded module:
```ts
const OLD_ENTRIES = lazy(() => import("./changelog-history"));
```
**Estimated saving:** ~25-30KB from the changelog chunk

---

## Warnings from Build

```
⚠ The "middleware" file convention is deprecated. 
  Use "proxy" instead.
  File: src/middleware.ts
```

This is a functional warning — the middleware still works but should be renamed to `src/proxy.ts` per Next.js 16 conventions.

---

## Routes Over 100KB First-Load JS (Estimated)

Since Turbopack doesn't output per-route first-load sizes in the CLI, the following are estimated from chunk analysis:

| Route | Estimated First-Load JS (gzip) | Status |
|-------|-------------------------------|--------|
| `/` (home) | ~820KB | OVER BUDGET |
| `/explore` | ~500KB | OVER BUDGET |
| `/dashboard` | ~450KB | OVER BUDGET |
| `/compare` | ~420KB | OVER BUDGET |
| `/changelog` | ~350KB | OVER BUDGET |
| `/champions` (static) | ~200KB | OVER BUDGET |
| `/champions/[pokemon]` (SSG) | ~180KB | OVER BUDGET |
| `/s/[id]` (shared report) | ~820KB | OVER BUDGET |

**All routes exceed 100KB.** The Next.js recommended threshold of 130KB first-load JS for the framework chunk alone is exceeded significantly by the app code.

---

## Summary

| Priority | Issue | Est. Saving | Effort |
|----------|-------|-------------|--------|
| HIGH | PostHog loaded eagerly on all pages | ~55KB gz | Low — wrap in `dynamic()` |
| HIGH | Main app chunk too large (419KB gz) | 50-100KB gz | High — requires data splitting |
| MEDIUM | motion/react in PasteInput (initial path) | ~15-25KB gz | Medium — swap for CSS transitions |
| MEDIUM | DashboardContent tab code splitting | ~15-20KB gz | Medium |
| LOW | vanilla-cookieconsent eager load | ~20KB gz | Low — lazy import in useEffect |
| LOW | ChangelogContent history splitting | ~25-30KB gz | Low |
| INFO | `middleware.ts` → `proxy.ts` rename needed | n/a | Trivial |
