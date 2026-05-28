# C3 -- Performance & Bundle Analysis

**Date:** 2026-05-28
**Build:** Next.js 16.2.6 (Turbopack), `npm run build` completed successfully
**Total static JS:** 10.35 MB (uncompressed across all routes)

---

## 1. Build Output Summary

Build completed in ~36.5s (compile) + ~16.9s (type check) + 1.6s (static generation).
106 pages generated. No type errors. DB warnings expected (no env vars in CI).

### Route Types
| Type | Count | Notes |
|------|-------|-------|
| Static (SSG) | ~15 | /, /champions, /changelog, /compare, /explore, /faq, etc. |
| Dynamic (SSR) | ~50+ | API routes, /s/[id], /creator/[name], /embed/[id] |
| ISR | 58 | /champions/[pokemon] (1h revalidate) |

---

## 2. Five Largest Client-Side Chunks by JS Bundle Size

| # | Chunk | Raw Size | Gzip Size | Content |
|---|-------|----------|-----------|---------|
| 1 | `0cwh-y-4wc.-9.js` | **3,197 KB** | **407 KB** | `@pkmn/dex` learnset data (every Pokemon, every gen). Loaded on-demand by InlinePokemonEditor. |
| 2 | `0o3vusbk0tbvm.js` | **1,839 KB** | **342 KB** | `@pkmn/dex` species + abilities + moves + items + tiers. Loaded by /compare page. |
| 3 | `0ksojg.n~4u.h.js` | **1,839 KB** | **342 KB** | **DUPLICATE** of chunk #2 (identical @pkmn/dex data). Loaded on **homepage initial load**. |
| 4 | `0cxvus.lx94w7.js` | **485 KB** | **115 KB** | styled-jsx runtime + framework code (motion integration). |
| 5 | `0xr012s5lag5a.js` | **418 KB** | ~100 KB | html2canvas-pro (PDF/image export). Lazy-loaded via dynamic(). |

**Total @pkmn/dex client footprint: 6.88 MB raw / 1,091 KB gzip** (across all routes)

---

## 3. Oversized npm Dependencies Shipping to Client

### @pkmn/dex (CRITICAL -- 52 MB on disk, ~6.88 MB in client bundles)

The `@pkmn/dex` package ships the **entire Pokemon Showdown dataset** to the client:
- **Species data** (1,839 KB x2 = 3,678 KB) -- all 1,200+ Pokemon with baseStats, abilities, types, tiers
- **Learnset data** (3,197 KB) -- every move every Pokemon can learn across all generations
- **Moves data** (included in species chunk) -- all 800+ moves with full metadata

**Import chain causing homepage exposure:**
```
src/app/page.tsx ("use client")
  -> src/lib/utils/mega-detect.ts
    -> src/lib/data/pkmn-dex-fallback.ts
      -> import { Dex } from "@pkmn/dex"   // pulls in 1.8MB
```

A second copy pulled in by the /compare page (separate chunk, same data).
A third chunk (3.1MB learnsets) loaded on-demand by InlinePokemonEditor.

**The two 1.8MB chunks have identical content** (verified by diff). Turbopack emits them separately because they are referenced from different entry points.

### Other Large Dependencies
| Package | Client Chunk Size (raw) | Notes |
|---------|------------------------|-------|
| `html2canvas-pro` + `jspdf` | ~924 KB | Properly lazy-loaded via dynamic import |
| `motion` (framer-motion) | ~604 KB | In homepage initial load (118 KB entry chunk) |
| `posthog-js` | ~178 KB | In layout (loaded on all pages) |
| `@sentry/nextjs` | ~178 KB | In layout (loaded on all pages) |
| `@clerk/nextjs` | ~243 KB | In layout (loaded on all pages) |

### Dependency Not in optimizePackageImports
`next.config.ts` only lists `["motion/react"]` in `optimizePackageImports`. Missing: `@pkmn/dex`, `@clerk/nextjs`, `posthog-js`.

---

## 4. Homepage (/) Performance Profile

### Initial JS Load: 3,033 KB raw / ~654 KB gzip

| Component | Raw | Gzip Est | % of Page |
|-----------|-----|----------|-----------|
| @pkmn/dex (species data) | 1,839 KB | 342 KB | **52%** |
| styled-jsx + framework | 485 KB | 115 KB | 18% |
| pkmn-dex-fallback + pokemon.ts static data | 197 KB | 40 KB | 6% |
| motion/framer-motion | 118 KB | ~30 KB | 5% |
| @clerk/nextjs (layout) | 106 KB | ~30 KB | 5% |
| App code (paste detection, analysis) | 96 KB | ~25 KB | 4% |
| Theme data | 61 KB | ~15 KB | 2% |
| Moves data | 55 KB | ~15 KB | 2% |
| Layout shared chunks | 147 KB | ~42 KB | 6% |

### The "use client" Problem

`src/app/page.tsx` is marked `"use client"` at line 1. This 1,881-line file is the **entire homepage** -- it:
- Has 34 static imports + 8 dynamic imports
- Pulls in the full `@pkmn/dex` dataset via a 3-hop transitive import
- Cannot benefit from React Server Components for any of its content
- Forces all imports (even data-only modules like `mega-detect.ts`, `pokemon.ts`) to ship to the client

**Impact:** The homepage cannot do any server-side data fetching, static rendering of initial content, or selective hydration. Everything is client-rendered.

### Static Imports That Should Be Dynamic
These components are conditionally rendered (only shown after specific user actions) but are eagerly loaded:

| Import | When Actually Used | Est. Size |
|--------|--------------------|-----------|
| `TeamReport` | After paste analysis | Large (imports PokemonDetailSlide, etc.) |
| `TournamentMode` | When tournament mode toggled | Medium |
| `WalkthroughOverlay` | First-time user walkthrough | Medium |
| `ShortcutHintOverlay` | When user presses ? | Small |
| `SlideNavControls` | After analysis | Small |
| `SaveButton` | After analysis in shared view | Small |
| `CreatorLink` | After analysis | Small |
| `ViewCount` | In shared view only | Small |
| `DisplayTogglePill` | After analysis with Mega Pokemon | Small |

---

## 5. Duplicate Module Inclusion

### Confirmed: @pkmn/dex Species Data Duplicated (1.8 MB x 2)

Two chunks with **identical content** (verified via `diff` producing no output):
- `0ksojg.n~4u.h.js` (1,839,319 bytes) -- homepage initial load
- `0o3vusbk0tbvm.js` (1,839,319 bytes) -- /compare page

Different MD5 hashes (different Turbopack metadata wrappers) but identical data payload. Turbopack emits the same `@pkmn/dex` data module separately for two entry points instead of extracting it into a shared chunk.

**Wasted bytes:** 1,839 KB raw / 342 KB gzip

---

## 6. Missing Code Splitting Opportunities

### A. @pkmn/dex Should Be Dynamically Imported
The `detectMegaFromItem` function in `mega-detect.ts` calls into `pkmn-dex-fallback.ts` **only as a fallback** when the static `MEGA_STONE_MAP` misses. The static map covers all common Mega Pokemon. The dynamic fallback fires rarely.

**Fix:** Make the `@pkmn/dex` import in `pkmn-dex-fallback.ts` a dynamic `import()` that loads on first miss, not at module initialization. This removes 1.8 MB from the homepage initial load.

### B. InlinePokemonEditor Already Lazy But Pulls Full Dex
`InlinePokemonEditor.tsx` does `import { Dex } from "@pkmn/dex"` at the top level and calls `Dex.species.all()`. Since the editor is dynamically imported, this is acceptable -- but the species index could be pre-built at build time.

### C. Homepage Should Split into Server + Client Layers
Instead of one monolithic "use client" page, the homepage could be:
1. A **server component** (`page.tsx`) that renders the shell, SEO metadata, JSON-LD, and static content
2. A **client component** (`HomeClient.tsx`) for the interactive report builder
3. A **separate client component** for the paste input (which is the initial view)

This would allow server-side rendering of the page shell, deferred hydration of interactive parts, and selective loading of heavy dependencies only when needed.

### D. Lazy-Load PostHog and Clarity
`PostHogProvider.tsx` and `ClarityProvider.tsx` are in the layout and load on every page. These analytics tools could be lazy-loaded after the initial render or loaded on user interaction.

---

## 7. Recommendations Ranked by Impact

### #1: Dynamically Import @pkmn/dex in pkmn-dex-fallback.ts (CRITICAL)
**Impact:** -1,839 KB raw / -342 KB gzip from homepage initial load (52% reduction)
**Effort:** Low
**Approach:** Replace `import { Dex } from "@pkmn/dex"` with a lazy-loading wrapper:
```ts
let _dex: typeof import("@pkmn/dex") | null = null;
async function getDex() {
  if (!_dex) _dex = await import("@pkmn/dex");
  return _dex.Dex;
}
```
Make `lookupPokemonFromDex`, `getMegaEntryFromDex`, `detectMegaFromItemDex` async.
Since these are fallback paths that rarely fire, the async boundary is acceptable.

### #2: Add @pkmn/dex to optimizePackageImports (HIGH)
**Impact:** May help Turbopack tree-shake unused data (learnsets, tiers, gen-specific data)
**Effort:** Trivial (one line in next.config.ts)
```ts
optimizePackageImports: ["motion/react", "@pkmn/dex"],
```

### #3: Split Homepage into Server + Client Components (HIGH)
**Impact:** -200-400 KB from initial load; enables streaming SSR; improves FCP/LCP
**Effort:** Medium (refactor page.tsx into server shell + client island)
**Approach:**
- Keep `page.tsx` as server component (renders metadata, JSON-LD, static shell)
- Move `HomeContent` to `HomeClient.tsx` with "use client"
- Lazy-load `TeamReport` and `TournamentMode` since they're not visible until after analysis

### #4: Replace @pkmn/dex With a Lightweight Custom Lookup (HIGH)
**Impact:** Eliminates 6.88 MB across all routes; homepage drops to ~300 KB gzip
**Effort:** High (build a custom mega-stone/species lookup table at build time)
**Approach:** The app only uses @pkmn/dex for:
1. `Dex.species.get(name)` -- baseStats, types, abilities for ~100 Mega forms
2. `Dex.items.get(name)` -- mega stone detection for ~50 items
3. `Dex.species.all()` -- species search in InlinePokemonEditor

Options:
- Pre-generate a JSON file with just the fields needed (~50-100 KB vs 6.88 MB)
- Use a build-time script to extract from @pkmn/dex into a static JSON
- Keep @pkmn/dex as a devDependency for the build script only

### #5: Dynamic-Import Remaining Eager Components on Homepage (MEDIUM)
**Impact:** -100-200 KB from initial load
**Effort:** Low
**Approach:** Convert `TeamReport`, `TournamentMode`, `WalkthroughOverlay`, `ShortcutHintOverlay`, and `SlideNavControls` from static imports to `dynamic()` imports with loading fallbacks.

---

## 8. Additional Findings

### Positive Patterns Already in Place
- html2canvas-pro and jspdf are properly lazy-loaded via `dynamic()`
- ShareModal, CommentSection, PrintableReport, OTSSheetModal are dynamic imports
- SpeedTierChart, OffensiveCoverageChart, DefensiveCoverageChart in TeamReport are dynamic
- The 3.1 MB learnset chunk is NOT in any initial page load (only loaded on-demand)
- `exportAsImage` uses `await import()` for on-demand loading
- DoubleTapLikeOverlay loaded with `{ ssr: false }`

### `"use client"` Directives That Could Be Server Components
Most `"use client"` directives are appropriate (components using useState, useEffect, event handlers). However:
- `src/lib/data/pkmn-dex-fallback.ts` -- Not marked "use client" directly but pulled in via client components. If the fallback were server-side only, @pkmn/dex would not ship to client.
- `src/components/layout/PageFooter.tsx` -- May contain only static content that does not need client interactivity.

### Static Data Files in Client Bundle
- `src/lib/data/pokemon.ts` (240 KB source / ~197 KB in chunk with fallback wrapper) -- Hand-maintained static Pokemon data. Shipped to client because imported by client components.
- `src/data/champions-sample-teams.ts` (4 KB) -- Small, acceptable.

### CSS is Well-Optimized
Only two CSS chunks referenced across all pages, both using Tailwind CSS v4 with purging.

---

## Estimated Total Savings

| Fix | Raw Savings | Gzip Savings | Effort |
|-----|-------------|--------------|--------|
| #1 Dynamic @pkmn/dex import | 1,839 KB | 342 KB | Low |
| #2 optimizePackageImports | Unknown (tree-shaking) | 50-100 KB | Trivial |
| #3 Server/client split | 200-400 KB | 50-100 KB | Medium |
| #4 Custom lightweight lookup | 6,880 KB (all routes) | 1,091 KB | High |
| #5 Lazy-load remaining components | 100-200 KB | 25-50 KB | Low |
| **Realistic near-term (#1+#2+#5)** | **~2,100 KB** | **~450 KB** | **Low** |
| **Full optimization (#1-#5)** | **~8,000 KB** | **~1,300 KB** | **High** |

Homepage initial load would drop from ~654 KB gzip to ~300 KB gzip with fixes #1+#2+#5 alone.
