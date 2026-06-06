# C3 — Bundle Analysis

Date: 2026-06-06
Build: `npm run build` succeeded (Next 16.2.6 + Turbopack). Sentry build phase logged the usual "No database connection string" warnings during static team-page generation — expected in this sandbox (no `.env.local`), **not a P0**.

> **Caveat on Next 16 + Turbopack:** the per-route "First Load JS" size table that older Next versions printed at the end of `next build` is **not emitted by Turbopack**. The build manifests (`build-manifest.json`, `fallback-build-manifest.json`) only list root-level chunks, not per-page chunk graphs. Numbers below come from `.next/static/chunks/*.js` file sizes + grep-identifying which library each chunk contains. They are bytes-on-disk (uncompressed), not gzipped first-load — gzip typically reduces these by ~3x.

## Build output snapshot

- Total static JS chunks dir: **4.79 MB** uncompressed across 77 chunk files (~1.6 MB gzipped, rough estimate).
- Total static CSS: 166 KB (one big chunk `0~xd_i9~wueao.css`).
- **Root-main bundle** (loaded on every route, per `build-manifest.json → rootMainFiles`): 8 chunks totaling **458 KB raw**:
  - `0rwwge57xnfls.js` — 203 KB — React + scheduler core.
  - `13wvg2qsv5791.js` — 96 KB — Next.js client runtime (navigation/router).
  - `0zjs5hlwbvch9.js` — 45 KB — Next.js misc client glue.
  - `0g0_bc~umulzx.js` — 38 KB — Next.js app-router runtime.
  - `0k6c9i47ki3cm.js` — 27 KB.
  - `0ob2p44h354w8.js` — 27 KB.
  - `turbopack-03d_bwg26m60c.js` — 11 KB.
  - `0u93mr1-uj5n6.js` — 9 KB.
  - Polyfill: `03~yq9q893hmn.js` — 113 KB.
- **Estimated gzipped First Load JS (shared baseline)**: ~150–180 KB. That is on the high end but not pathological for a Clerk + PostHog + motion app.

### Top 10 chunks by raw size (these are the candidates to investigate)

| Chunk | Size (raw) | Content |
|------|-----------|---------|
| `085i3dn7oy7w2.js` | 480 KB | Zod schemas, share-codec, i18n strings, motion `motion.*` JSX wrappers — shared "big things" chunk |
| `0xr012s5lag5a.js` | 418 KB | `jspdf` + `html2canvas-pro` combined async chunk |
| `0xpwnv1i16rc1.js` | 340 KB | `dex-subset.json` (duplicate — variant A) |
| `0eeqwi5zjfw3a.js` | 340 KB | `dex-subset.json` (duplicate — variant B, differs by 1 byte) |
| `0i4g9_wngqb2c.js` | 225 KB | `html2canvas-pro` Unicode tables |
| `0rwwge57xnfls.js` | 203 KB | React core (root) |
| `10-qc793i1~os.js` | 198 KB | `html2canvas-pro` Unicode tables (second copy?) |
| `02zw10s43j3wt.js` | 197 KB | Mega-pokemon data tables (`mega-detect`, sprite lookups) |
| `07gylk333xlq7.js` | 178 KB | `posthog-js` + `rrweb` recorder + Sentry-init bridge |
| `069~_h90gxh59.js` | 118 KB | `motion` (framer-motion successor) runtime |

### 5 largest client components (by source LOC / source bytes — proxy for hydrated client work)

All are `"use client"`:

1. **`src/app/page.tsx`** — 1868 LOC, 84 KB source. Home / report page entry. Imports Navbar, ShareModal, PrintableReport, OTSSheetModal, CommentSection, CollaboratorPanel, EditChangelog, DiffNavigator, DoubleTapLikeOverlay, mega-detect, `motion/react` indirectly through children. Several already lazy-loaded via `next/dynamic`.
2. **`src/components/ui/ShareModal.tsx`** — 933 LOC, 47.7 KB. Imports html2canvas (via lazy wrapper), Clerk hooks, motion.
3. **`src/components/layout/Navbar.tsx`** — 890 LOC, 46.2 KB. Imports Clerk SignInButton/UserButton (eager), useTranslation, NotificationBell, VersionHistoryPanel.
4. **`src/components/report/PokemonDetailSlide.tsx`** — 963 LOC, 41.4 KB. Imports `lib/data/pokemon` → transitively pulls `pkmn-dex-fallback` → `dex-subset.json` (340 KB raw).
5. **`src/components/report/TeamOverview.tsx`** — 850 LOC, 37.2 KB. Imports qrcode (lazy `import("qrcode")`), `motion/react`, dex-subset chain.

Honourable mentions: `MatchupPlanSlide.tsx` (779 LOC), `ExploreFilters.tsx` (719), `SpeedTierChart.tsx` (675), `PasteInput.tsx` (670), `PokemonCard.tsx` (558).

## Heavy deps audit

Methodology: grep `from ['\"]<pkg>['\"]` across `src/`, check whether `next/dynamic`, `await import()`, or eager top-level import is used, and verify chunks contain the dep.

| Package | node_modules size | Import sites in src/ | Lazy-loaded? | Verdict |
|--------|-------------------|----------------------|--------------|--------|
| **`@pkmn/dex`** | 53.7 MB | 0 direct client imports — only via `dex-subset.json` accessor. Used directly in `instrumentation.ts` (server). | N/A direct. The **subset** still ships ~340 KB raw to client. | Subset wrapper is excellent. Still: 340 KB client cost. Could lazy-load. |
| **`posthog-js`** | 47.1 MB | `src/components/providers/PostHogProvider.tsx` only. | **Yes** — `await import("posthog-js")` inside `requestIdleCallback`. `dist/module.full.js` is 423 KB but ships in `07gylk333xlq7.js` (178 KB) as async chunk. | Already optimal. No action. |
| **`@sentry/nextjs`** | 40.2 MB (includes 21 MB `@sentry/cli` devOnly!) | `sentry.client.config.ts`, `src/app/global-error.tsx`. | Eager. Client bundle ~11 KB stub + bigger pieces tree-shaken in via `instrumentation-client`. | Mostly fine — Sentry is small client-side because most code is server. Consider gating `replayIntegration` behind a route-pattern. |
| **`jspdf`** | 30.2 MB | `src/lib/utils/export-report.ts` only. | **Yes** — `await import("jspdf")`. | Async chunk shared with html2canvas (418 KB). Optimal — only loaded on PDF export. |
| **`@clerk/nextjs`** | 10.5 MB | 30+ import sites across client + server. | Eager. ClerkProvider mounted in root layout. | Necessary baseline cost. No simple win. |
| **`html2canvas-pro`** | 4.6 MB | `src/lib/dynamic-imports/html2canvas.ts` singleton, used by ShareModal, OTSSheetModal, TeamCardExport. | **Yes** — `await import("html2canvas-pro")`. | Async chunk (418 KB combined with jspdf) — loaded only on share-image / PDF export. Optimal. |
| **`motion`** | 608 KB | 12 client components — all eager `import { motion } from "motion/react"`. `next.config.ts` sets `experimental.optimizePackageImports: ["motion/react"]`. | Eager but tree-shaken. | Motion runtime is in `069~_h90gxh59.js` (118 KB). With 12 import sites including the homepage hero (`page.tsx` indirectly via children) and Navbar-adjacent components, motion gets pulled into the shared baseline. **Largest opportunity for measurable savings.** |
| **`vanilla-cookieconsent`** | 152 KB | `src/components/providers/CookieBanner.tsx` — eager at module scope in root layout. Also pulls its `.css` file. | **Eager.** | Mounts in root `layout.tsx`, so every page pays. Could be deferred. |
| **`@microsoft/clarity`** | 7.6 KB | `src/components/providers/ClarityProvider.tsx` — eager import. | Eager (but tiny). | Negligible. The actual Clarity tracker is loaded by the SDK at runtime via script tag, so the npm package is just a thin wrapper. No action. |
| **`qrcode`** | 135 KB | `TeamOverview.tsx`, `OTSSheetModal.tsx`. | **Yes** — `import("qrcode")` inside `useEffect`. | Optimal. |
| **`tweetnacl`** | 174 KB | Server-only (webhook signature verification). | N/A | Server-side, never reaches client. |
| **`@neondatabase/serverless`** | 2.8 MB | Server-only via `lib/db.ts`. | N/A | Server-side. |
| **`@upstash/ratelimit` + `@upstash/redis`** | 1.5 MB | Server-only. | N/A | Server-side. |

### Heavy deps already removed from the client path — credit where due
- `posthog-js` — gated behind `requestIdleCallback` + consent.
- `html2canvas-pro` + `jspdf` — shared singleton dynamic wrapper, only loads on user action.
- `qrcode` — dynamic import on demand.
- `@pkmn/dex` — replaced with hand-built `dex-subset.json` (~324 KB raw / ~47 KB gzipped vs ~1.8 MB raw upstream).
- 6 components/pages routed through `next/dynamic` in `app/page.tsx` alone (ShareModal, CommentSection, PrintableReport, OTSSheetModal, DiffNavigator, CollaboratorPanel, EditChangelog, DoubleTapLikeOverlay).
- 4 charts (`SpeedTierChart`, `OffensiveCoverageChart`, `DefensiveCoverageChart`, `MatchupPlanSlide`, `MatchupSheet`) routed through `next/dynamic` in `TeamReport.tsx`.
- `InlinePokemonEditor` is `next/dynamic` from `PokemonCard.tsx`.

This codebase is already well-optimised. The remaining wins are narrower.

## Quick wins (Wave 2 candidates)

### 1. Lazy-load `vanilla-cookieconsent` after first paint — est. **~50 KB shaved off shared baseline (gzip ~15 KB)**
`src/components/providers/CookieBanner.tsx` imports `vanilla-cookieconsent` (and its CSS) at module top, and is mounted directly in `src/app/layout.tsx`. The library only runs in a `useEffect`. Replace with:
```tsx
const CookieBanner = dynamic(() => import("./CookieBannerInner"), { ssr: false });
```
and move the lib import inside the dynamically-loaded child. CSS will follow the same chunk. Affects every page load.

### 2. Move `dex-subset.json` (340 KB raw) off the eager client path — est. **~50–80 KB gzip saved on initial chunk**
The subset is reaching the client through:
`PokemonCard / SpeedTierChart / MatchupPlanSlide / CompareContent / app/page.tsx → lib/data/pokemon → pkmn-dex-fallback → dex-subset.ts → dex-subset.json`.
Most consumers only need `lookupPokemonFromDex` for *one specific species at a time*. Refactor `pkmn-dex-fallback.ts` to expose an `async lookupPokemonFromDex()` that does `await import("./dex-subset")` on first call. The lazy chunk would be shared with `InlinePokemonEditor` (which legitimately needs `allSpecies()`). Two ~340 KB sibling chunks suggest both server and client variants are being emitted — consolidating behind a dynamic import should collapse them.

### 3. Replace 12 eager `motion/react` imports with a lazy `MotionDiv` wrapper — est. **~40 KB gzip shaved from baseline**
The 118 KB motion runtime chunk is loaded whenever any of 12 client components mount. On the homepage (`page.tsx`), motion is on the critical path via `WhatsNewModal`, `PasteInput`, and explore-section children. For pages where animation is non-critical (above-fold copy, list rendering), wrap with `m` from `motion/react` + manual `LazyMotion` + `domAnimation` feature pack, OR replace with CSS transitions. The four `app/<route>/Content.tsx` files (`feedback`, `changelog`, `dashboard/profile`, `champions/[pokemon]/MegaLanding`) use motion for fade-in only — that's CSS-replaceable.

### 4. Audit duplicate dex chunks (`0xpwnv1i16rc1.js` and `0eeqwi5zjfw3a.js` are 340 KB each, differ by 1 byte) — est. **~340 KB raw / ~50 KB gzip if dedup'd**
Two near-identical copies of the dex-subset JSON in the static chunks dir suggest Turbopack is emitting both a server-RSC variant and a client variant. Worth investigating whether the `dex-subset.json` import in `dex-subset.ts` can be marked `import.with({type: 'json'})` or moved behind `import()` so only one variant ships to the browser.

### 5. Split Navbar's `VersionHistoryPanel` — est. **~5–10 KB gzip**
`Navbar.tsx` (890 LOC, 46 KB source) eagerly imports `VersionHistoryPanel` (379 LOC), which is only used when the user opens version history. Make it `next/dynamic`. Small but free.

### Deps that look fully removable

- **`@microsoft/clarity` (7.6 KB)** — The wrapper is trivial; the only call is `Clarity.init(id)`. Inline a 4-line script tag into `layout.tsx` if maintaining Clarity, or drop entirely if PostHog session-replay covers the use case. Net savings tiny on JS but removes a dep + a `"use client"` component.
- **`@sentry/cli` (21 MB on disk)** — devDependency only (build-time source-map upload). Not a client cost, but if Vercel build minutes are tight, confirm it's not running on `next build` unless `SENTRY_AUTH_TOKEN` is set. (No action if it's already gated.)
- **None of the runtime deps look "fully removable"** — every heavy one provides a feature the product visibly uses.

### Files for follow-up tickets
- `/home/user/VGC-Team-Report/src/components/providers/CookieBanner.tsx` (lazy)
- `/home/user/VGC-Team-Report/src/components/providers/ClarityProvider.tsx` (consider inlining/removing)
- `/home/user/VGC-Team-Report/src/lib/data/pkmn-dex-fallback.ts` (async-ify)
- `/home/user/VGC-Team-Report/src/lib/data/dex-subset.ts` (investigate duplicate emit)
- `/home/user/VGC-Team-Report/src/components/layout/Navbar.tsx` (dynamic VersionHistoryPanel)
- `/home/user/VGC-Team-Report/src/app/page.tsx` (1868 LOC — beyond bundle, this should probably be split into 2–3 smaller client islands)
- All 12 `motion/react` import sites (CSS-replaceability audit)

### Build status (P0 check)
`npm run build` **succeeded**. The repeated `Failed to fetch teams for <mega>` warnings are runtime fetches during `generateStaticParams` when no DB is configured — not a build failure. **No P0 build issue.**
