# C3 Performance & Bundle Audit — 2026-06-08

Next.js 16.2.6 (Turbopack), React 19, app router. Build succeeds cleanly. Note: Turbopack does NOT print the route-by-route First Load JS table that webpack did, so per-route numbers are inferred from chunk inspection.

## Build output summary

Total client-side static bundle (raw, ungzipped):

| Bucket | Size |
|---|---|
| All JS chunks | **~4.4 MB raw** (≈ 1.0–1.3 MB gzipped est.) |
| All CSS chunks | ~195 KB |
| 79 JS chunks total | average 56 KB |

Estimated gzipped First Load JS by route (Turbopack hashes chunks per-entry so the same library appears in multiple routes' First Load):

| Route | Estimated FLJS (gzip) | Why |
|---|---|---|
| **`/` (home, `app/page.tsx`)** | **~340–420 KB** | Worst offender. `"use client"` page that pulls in TeamReport, all hooks, motion, Clerk, PostHogProvider, Sentry hooks, dex-subset.json (~50 KB gz), html2canvas+jspdf static-imported in PdfExport graph (though gated). |
| `/s/[id]` (shared report) | ~330–400 KB | Same `<Home>` tree via `/s/[id]/redirect.tsx` client redirect — inherits all of `/`'s graph. |
| `/dashboard` | ~250–310 KB | DashboardContent (58 KB src) + MatchTracker + ReportCard + Clerk + motion. |
| `/explore` | ~210–260 KB | ExploreContent + ExploreFilters (29 KB src, motion + AnimatePresence + useReducedMotion) + ReportCard + SpotlightCard. |
| `/champions/[pokemon]` | ~200–250 KB | MegaLandingContent (`"use client"`) + dex-subset.json + motion + Clerk hooks. 58 paths × SSG. |

### Top raw chunks (with library identification from content signature)

| Raw size | Chunk | Library |
|---|---|---|
| 493 KB | `0zkom1flz0pno.js` | **motion** (transformPerspective, pathRotation — full client `motion.*` set) |
| 419 KB | `0pwx0ttsy2_0z.js` | **html2canvas-pro + jspdf** combined chunk |
| **340 KB ×2** | `0n7pf~4q7g5-8.js` + `06063d6lcnpov.js` | **dex-subset.json (Pokemon dex data, ~331 KB)** — DUPLICATED across two entries. Same content shipped twice. |
| 227 KB | `0xzltvn6c6y2s.js` | html2canvas (vendor split — additional) |
| 203 KB | `0rwwge57xnfls.js` | React reconciler/scheduler |
| 198 KB | `10-qc793i1~os.js` | More html2canvas internals |
| 197 KB | `02zw10s43j3wt.js` | @pkmn/dex MegaStone resolver |
| 195 KB | `07o1wciirj.ma.js` | **posthog-js** (58 posthog refs, 9 sentry refs) |
| 158 KB | `13zgg7no95fse.js` | core-js polyfills |
| 121 KB | `14d4-.9ogfmc4.js` | **motion** (additional API surface — 20 motion refs) |
| 113 KB | `03~yq9q893hmn.js` | More core-js |
| 107 KB | `04nbag~wca2om.js` | @clerk/nextjs |
| 96 KB | `0olrhrf~aymwr.js` | App code (Card.tsx etc.) |

Sentry browser SDK is harder to attribute (auto-injected at instrumentation client), but `grep -l sentry` across chunks totals roughly **1.3 MB** of code touching sentry symbols across many chunks.

## Heavy dependencies — opportunity matrix

| Package | Size estimate (raw / gzip) | Where used | Lazy-load possible? | Recommendation |
|---|---|---|---|---|
| **motion** | ~614 KB raw / ~150 KB gz client | 12 source files: `motion.div`/`motion.p`/`motion.button` only (no `useScroll`/`useTransform`/`useDrag`) | Yes — switch to `LazyMotion` + `m` component, drops to ~50 KB initial | **TOP WIN.** Replace `motion.div` with `m.div` + wrap app in `<LazyMotion features={domAnimation}>` — saves ~100 KB gzipped from initial load. |
| **html2canvas-pro + jspdf** | ~640 KB raw / ~180 KB gz | export-report.ts, OTSSheetModal, TeamCardExport | **Already lazy** via `getHtml2Canvas()` singleton + dynamic `import("jspdf")`. Good. | No further action — verify no static import sneaked in. |
| **posthog-js** | ~195 KB raw / ~60 KB gz client | PostHogProvider | **Already lazy** (Promise.all dynamic import inside requestIdleCallback). Good. | Could add `disable_session_recording` config split — already done. |
| **@pkmn/dex** | ~340 KB raw shipped as `dex-subset.json` (~50 KB gz) | dex-subset.ts (client-safe) | Partially. JSON is statically imported into client tree. **Shipped twice in 340kB chunks**. | **Dedupe**: investigate why `dex-subset.json` produces two identical 340 KB chunks — likely because two distinct entries `import` it without a shared async boundary. Forcing dynamic import (`await import("./dex-subset.json")`) inside species resolvers would cut 340 KB from initial JS. |
| **@sentry/nextjs** | ~3.6 MB installed; ~150–250 KB gz on client | sentry.client.config.ts (auto-injected), `global-error.tsx` | Difficult — Sentry recommends static init. Can disable replay/profiling on client. | Drop `replaysOnErrorSampleRate: 1.0` (already loaded `@sentry/replay`). Use `Sentry.init` with `integrations: []` and tree-shake — saves ~80 KB gz. |
| **qrcode** | 260 KB installed | TeamOverview line 376, OTSSheetModal line 91 | **Already lazy** (`import("qrcode")` inside `useEffect`). Good. | None. |
| **@microsoft/clarity** | small but loads its own script | ClarityProvider in root layout — **statically imported** in client graph | Yes — currently `import Clarity from "@microsoft/clarity"` at module top. | Move to `await import("@microsoft/clarity")` inside the `useEffect`. Saves a small chunk on every page. |
| **vanilla-cookieconsent** | ~50 KB raw / ~15 KB gz | CookieBanner (`"use client"`) — module-level imports CSS + lib | Yes — only needed when banner shows. | Lazy-load inside CookieBanner via `useEffect` import; gate on consent state. Saves ~15 KB gz on every page. |
| **@clerk/nextjs** | 2.6 MB installed; ~110 KB gz client | ClerkProvider in root layout, hooks throughout | Hard — provider must wrap whole app. | Already optimized. Skip. |
| **core-js polyfills** | ~270 KB raw / ~70 KB gz combined (2 chunks) | Polyfills auto-injected by Next browserslist | Lower polyfill scope by tightening `browserslist` (drop IE11/Safari 13). | Add `"browserslist": ["defaults and supports es6-module"]` to package.json — saves ~30–40 KB gz across all routes. |

## Client→Server migration candidates

Files marked `"use client"` that could safely become server components (no hooks/events/browser-only APIs in the wrapper) or be split:

| File | Why it could change | Action |
|---|---|---|
| `src/components/social/CreatorLink.tsx` | Has `"use client"` directive? Actually doesn't (verified — no `"use client"` line). Pure JSX. | No action — already a server-compatible component, but it's being PULLED into client trees because it's imported from `app/page.tsx`. Once on client, stays on client. |
| `src/components/social/ViewCount.tsx` | Pure JSX. Same situation. | No action. |
| `src/components/seo/JsonLd.tsx` | Pure JSX (`dangerouslySetInnerHTML` is fine on server). | Already used as server component on most pages — good. Keep it that way. |
| `src/components/explore/ExploreEmpty.tsx` | `"use client"` only because of `motion.div`. Static empty-state — animations could be CSS keyframes. | **Convert**: replace `motion.div` with `<div className="animate-fade-in">`. Drops motion from `/explore` initial bundle. Saves ~30 KB gz. |
| `src/components/explore/SpotlightCard.tsx` | `"use client"` for `motion`. Mostly presentational. | Replace `motion.*` with CSS animations or use `m` from LazyMotion. |
| `src/app/feedback/FeedbackContent.tsx` | `"use client"` whole page. Only the FORM needs interactivity; the I18nProvider + intro copy could be SSR. | Extract the form into a client island; keep the page shell server-rendered. Saves ~40 KB gz on `/feedback`. |
| `src/app/changelog/ChangelogContent.tsx` | `"use client"` whole 137-entry changelog. Only the filter chips need interactivity. | Server-render the timeline; make filter state a client island. Saves ~50 KB gz on `/changelog`. |
| `src/app/champions/[pokemon]/MegaLandingContent.tsx` | `"use client"` because of `motion`. SEO landing page that's mostly static. | Server-render everything except the "View teams" interactive section. Champions pages are 58 SSG routes — every byte counts here. |

## `import * as X from` patterns

Only two — neither is a problem:

| File:Line | Import | Verdict |
|---|---|---|
| `src/app/global-error.tsx:3` | `import * as Sentry from "@sentry/nextjs"` | OK — Sentry tree-shakes against `* as` because of ESM exports. |
| `src/components/providers/CookieBanner.tsx:4` | `import * as CookieConsent from "vanilla-cookieconsent"` | **Replace** with named imports: `import { run, type ... } from "vanilla-cookieconsent"`. Marginal but enables tree-shaking. |

## Top 5 quick wins (implementable tonight, < 50 lines changed each)

### 1. Switch `motion.*` → `m.*` + LazyMotion wrapper (~100 KB gz saved)
**Impact: largest single bundle reduction available.**
Add to `src/app/layout.tsx` (after ClerkProvider):
```tsx
import { LazyMotion, domAnimation } from "motion/react";
// wrap children: <LazyMotion features={domAnimation}>{children}</LazyMotion>
```
Then sed-replace `motion.div` → `m.div` (and `motion.p`, `motion.button`, etc.) and change imports from `{ motion }` to `{ m }` in 12 files. The full `motion` runtime drops from ~150 KB gz to ~50 KB gz. Sweep with grep — no `useScroll`/`useTransform`/`useDrag` in the codebase, so `domAnimation` covers everything.

### 2. Lazy-load `@microsoft/clarity` inside ClarityProvider (~5 KB gz saved on every page)
**Impact: every page in the app.**
```tsx
// src/components/providers/ClarityProvider.tsx
useEffect(() => {
  const id = process.env.NEXT_PUBLIC_CLARITY_ID;
  if (!id) return;
  import("@microsoft/clarity").then(({ default: Clarity }) => Clarity.init(id));
}, []);
```
Removes Clarity from the root layout client graph.

### 3. Lazy-load `vanilla-cookieconsent` inside CookieBanner (~15 KB gz saved on every page)
Currently CookieBanner statically imports both the lib and its CSS at module top. Move both imports inside a `useEffect` that fires only when consent isn't recorded yet. Most return visitors never load the library. Also replace `import * as CookieConsent` with named imports.

### 4. Convert ExploreEmpty + SpotlightCard motion to CSS animations (~30 KB gz saved on /explore)
Both components use `motion.div initial/animate/exit` purely for fade-in. Tailwind already has `animate-fade-in` defined. Drop the motion import; use the class. `/explore` is a high-traffic SEO landing page — worth the optimization.

### 5. Trim Sentry client bundle (~80 KB gz saved)
Edit `sentry.client.config.ts`:
```ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 0,    // was 1.0 — drops @sentry/replay-canvas
  replaysSessionSampleRate: 0,
  integrations: [],                 // explicit — Sentry will auto-add minimum required
});
```
Removes session replay code from client bundles. Replays were already at 0% session sample, so this only loses error-replay capture (rarely viewed). PostHog already captures exceptions via `capture_exceptions: true` — duplicate coverage.

### Bonus (slightly bigger but worth flagging):
**Dedupe the 340 KB `dex-subset.json` chunk.** It's currently shipped twice (340 KB ×2). Add a singleton accessor that wraps the import in `dynamic()` or move species lookups inside route handlers. Investigation needed (>50 lines) but would cut ~340 KB raw / ~50 KB gz from the bundle.
