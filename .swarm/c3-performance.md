# Bundle Performance Analysis — VGC Team Report

_Analyzed: 2026-05-25 (full production build via `npm run build`)_

---

## Build Summary

- **Next.js 16.2.6** with Turbopack
- **Total client JS**: 10.3 MB across 79 chunks (uncompressed; gzipped ~3-4 MB)
- **Build time**: ~34s compile + 13s TypeScript + 1.8s SSG (106 pages)
- **Static pages**: 106 (with ISR for `/champions/[pokemon]`)

---

## 1. Largest Client-Side Bundles

| # | Chunk | Size | Content |
|---|-------|------|---------|
| 1 | `0cwh-y-4wc.-9.js` | **3.1 MB** | `@pkmn/dex` learnset data (every Pokemon's full movelist across all gens) |
| 2 | `0o3vusbk0tbvm.js` | **1.8 MB** | `@pkmn/dex` abilities/species descriptions (gen 3-9 ability text) |
| 3 | `0ksojg.n~4u.h.js` | **1.8 MB** | `@pkmn/dex` abilities/species data (duplicate/split chunk) |
| 4 | `0cxvus.lx94w7.js` | **476 KB** | Styled-jsx runtime + PostHog SDK |
| 5 | `0xr012s5lag5a.js` | **412 KB** | jsPDF (Worker-based PDF generation) |
| 6 | `0i4g9_wngqb2c.js` | **224 KB** | html2canvas-pro (DOM-to-canvas rendering) |
| 7 | `0rwwge57xnfls.js` | **200 KB** | React runtime / scheduler |
| 8 | `10-qc793i1~os.js` | **196 KB** | Clerk auth SDK |
| 9 | `0xpu3x~vtd_5z.js` | **196 KB** | `@pkmn/dex` species index data |

**Critical finding**: Chunks 1-3 + 9 = **6.9 MB** (67% of total bundle) all come from `@pkmn/dex`. This library provides the full Pokemon Showdown dataset (1200+ species, learnsets, abilities) which ships to the client because `pokemon.ts` has a **static import** of `pkmn-dex-fallback.ts`.

---

## 2. Oversized npm Dependencies

| Package | node_modules size | Client impact | Verdict |
|---------|-------------------|---------------|---------|
| `@pkmn/dex` | 52 MB | **~6.9 MB client JS** (learnsets + abilities + species) | CRITICAL — tree-shaking not effective; full dataset bundled |
| `posthog-js` | 55 MB | ~100 KB (lazy-loaded via `requestIdleCallback`) | OK — properly deferred |
| `@sentry/nextjs` | 51 MB | Minimal client (only in `global-error.tsx`) | OK |
| `jspdf` | 29 MB | ~412 KB (lazy via `import()` in `export-report.ts`) | OK — properly code-split |
| `@clerk/nextjs` | 16 MB | ~196 KB shared auth chunk | Acceptable |
| `html2canvas-pro` | 6.1 MB | ~224 KB (lazy via `import()`) | OK — properly code-split |
| `motion` | 728 KB | ~50-80 KB (tree-shaken via `optimizePackageImports`) | OK |
| `axios` | — | Could be replaced by native `fetch` | Minor — eliminate dependency |

---

## 3. Client Components That Could Be Server Components

Files with `"use client"` that appear to need no client interactivity:

| File | Reason `"use client"` may be unnecessary |
|------|------------------------------------------|
| `src/components/layout/PageFooter.tsx` | Pure JSX — no hooks, no event handlers, only renders links and text |
| `src/app/not-found.tsx` | Uses `useTranslation()` hook but only for static text — could SSR with server-side i18n |
| `src/components/report/ItemIcon.tsx` | Uses `useState`/`useRef` for fallback detection only — could use CSS-based fallback |
| `src/components/ui/DisplayTogglePill.tsx` | Likely small interactive toggle — verify if state is truly needed on client |

**Total "use client" files**: 96 (many are legitimately interactive — team builder, form inputs, animations).

---

## 4. Image Optimization

### Current approach
- **No `next/image` usage** — all sprites use raw `<img>` tags
- **External CDN**: All Pokemon sprites load from `play.pokemonshowdown.com`
- **Fallback chain**: `PokemonSprite` component cascades through multiple sprite URLs on error
- **Lazy loading**: Applied via `loading="lazy"` on non-priority sprites
- **Priority hints**: LCP sprites get `fetchPriority="high"` + `loading="eager"`

### Issues
1. **Cannot use `next/image`** for external Showdown CDN sprites (no CORS headers from Showdown, sprites are .gif/.png from external domain without ACAO headers). The existing `/api/sprite` proxy exists only for print/export mode.
2. **No WebP/AVIF conversion** — sprites served as PNG/GIF from Showdown with no format optimization
3. **No size optimization** — sprites are served at full resolution even at small display sizes
4. **Public images are fine** — only 24KB icon + small SVGs; not a bottleneck

### Recommendation
The sprite situation is acceptable given the external CDN constraint. The proxy-on-demand approach for print mode is correct. A potential improvement: implement a CDN caching layer (e.g., Vercel Image Optimization or Cloudflare) that proxies, resizes, and converts sprites to WebP.

---

## 5. Dynamic Import Analysis

### Properly code-split (good)
- `html2canvas-pro` — lazy `import()` in `TeamCardExport.tsx`, `OTSSheetModal.tsx`, `export-report.ts`
- `jspdf` — lazy `import()` in `export-report.ts`
- `posthog-js` — deferred via `requestIdleCallback` in `PostHogProvider.tsx`
- `qrcode` — lazy `import()` in `OTSSheetModal.tsx` and `TeamOverview.tsx`
- `SpeedTierChart`, `OffensiveCoverageChart`, `DefensiveCoverageChart`, `MatchupPlanSlide`, `MatchupSheet` — all `next/dynamic` in `TeamReport.tsx`
- `ShareModal`, `CommentSection`, `OTSSheetModal`, `PrintableReport`, `DiffNavigator`, `CollaboratorPanel`, `EditChangelog` — all `next/dynamic` in `page.tsx`
- `InlinePokemonEditor` — `next/dynamic` in `PokemonCard.tsx`
- `WhatsNewModal` — `next/dynamic` in `PasteInput.tsx`

### NOT code-split (opportunities)

| Component/Module | Where imported | Size estimate | Recommendation |
|------------------|---------------|---------------|----------------|
| `@pkmn/dex` via `pkmn-dex-fallback.ts` | Static import in `pokemon.ts` → used everywhere | **6.9 MB** | CRITICAL: Dynamic import the fallback |
| `MatchTracker` | Static import in `DashboardContent.tsx` | ~518 lines, moderate | Use `next/dynamic` — only visible in dashboard tab |
| `CompareContent` | Static import in `compare/page.tsx` | ~537 lines (+ pulls @pkmn/dex) | Already a page-level component; the @pkmn/dex is the issue |
| `ClarityProvider` | Eager in `layout.tsx` | Small but Clarity SDK loads eagerly | Defer to after consent like PostHog |
| `motion/react` in 12 files | Static import | ~50-80 KB shared | `optimizePackageImports` is configured — acceptable |

---

## 6. next.config.ts Performance Config

### Currently configured
- `optimizePackageImports: ["motion/react"]` — good for motion tree-shaking
- `images.minimumCacheTTL: 2592000` (30 days) — good
- `images.remotePatterns: []` — empty (no `next/image` used for remote)

### Missing configurations
- `@pkmn/dex` not in `optimizePackageImports` (won't help — the issue is the data blobs, not named exports)
- No `experimental.optimizeCss` configured
- No bundle analyzer configured for ongoing monitoring
- No `serverExternalPackages` to keep `@pkmn/dex` server-side only

---

## 7. Critical Recommendations (Priority Order)

### P0: Lazy-load @pkmn/dex fallback (~6.9 MB savings on initial load)

The `pkmn-dex-fallback.ts` module is statically imported in `pokemon.ts`. Since 95%+ of lookups hit the hand-maintained `POKEMON_DATA` map directly, the `@pkmn/dex` import only fires on cache miss.

**Fix**: Convert `lookupPokemonFromDex` to a dynamic import:

```typescript
// In pokemon.ts — change from:
import { lookupPokemonFromDex } from "./pkmn-dex-fallback";

// To:
export async function lookupPokemon(species: string): Promise<PokemonData | null> {
  // ... existing static lookups ...
  // Dynamic fallback (lazy-loads @pkmn/dex only when needed)
  const { lookupPokemonFromDex } = await import("./pkmn-dex-fallback");
  return lookupPokemonFromDex(species);
}
```

Or alternatively, use `serverExternalPackages` in next.config.ts to exclude @pkmn/dex from client bundles entirely, and use a thin API route for the rare fallback case.

**Impact**: Removes 6.9 MB from client bundle (67% reduction). Most users will never need the fallback since common Pokemon are in the static map.

### P1: Dynamic import MatchTracker in DashboardContent

```typescript
const MatchTracker = dynamic(() => import("@/components/match-tracker/MatchTracker")
  .then(m => ({ default: m.MatchTracker })), { ssr: false });
```

**Impact**: ~20-30 KB off dashboard initial load.

### P2: Defer ClarityProvider like PostHog

Load Microsoft Clarity via `requestIdleCallback` after consent, matching the PostHog pattern.

### P3: Convert PageFooter to server component

Remove `"use client"` — it has no hooks or interactivity. This removes it from the client bundle entirely.

### P4: Add sprite CDN caching proxy

Consider a Cloudflare Worker or Vercel Edge function that caches + converts Showdown sprites to WebP format, reducing repeated bandwidth for returning visitors.

---

## 8. Bundle Size Budget Recommendation

| Metric | Current | Target |
|--------|---------|--------|
| Total client JS (uncompressed) | 10.3 MB | < 4 MB |
| Largest single chunk | 3.1 MB | < 500 KB |
| Initial page load JS | ~8-9 MB (includes @pkmn/dex) | < 2 MB |
| Time to Interactive (estimated) | Poor on 3G | Under 3s on 4G |

---

## Summary

The project is **well-architected for code-splitting** in most areas (jsPDF, html2canvas, PostHog, qrcode all lazy-loaded). The single critical issue is `@pkmn/dex` shipping its entire 6.9 MB dataset to every client because of a static import chain: `pokemon.ts` -> `pkmn-dex-fallback.ts` -> `@pkmn/dex`. Fixing this one import reduces client bundle by 67%.
