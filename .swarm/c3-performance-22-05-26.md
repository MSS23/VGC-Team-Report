# C3 Performance Audit — 2026-05-22

Read-only bundle / perf review. No code modified. Next.js 16.2.6 + React 19.2.3, Turbopack build.

## 1. Build Status

`npm run build` completed successfully (exit 0). 106 routes generated, 60 static prerenders for `/champions/[pokemon]`.

Warnings / notes:
- DB connection errors during SSG for `champions/[pokemon]` and `sitemap.xml` — expected locally (no `DATABASE_URL`), they degrade gracefully. Fine in prod.
- **Turbopack does not print per-route First Load JS sizes** in the same way Webpack does — the build summary in Next 16 shows only the route map (static / SSG / dynamic) with no kB column. The conventional "Route — Size — First Load" table is gone, so all chunk-level analysis below is from inspecting `.next/static/chunks/` directly.

## 2. Per-Route Output (from build log)

```
Route (app)                       Type      Revalidate  Expire
○ /                               Static    —           —
○ /champions                      Static    —           —
● /champions/[pokemon]            SSG       1h          1y    (60 prerendered paths)
○ /changelog                      Static    —           —
○ /compare                        Static    —           —
ƒ /creator/[name]                 Dynamic   —           —
○ /dashboard                      Static    —           —
ƒ /dashboard/notifications        Dynamic   —           —
○ /dashboard/privacy              Static    —           —
○ /dashboard/profile              Static    —           —
ƒ /embed/[id]                     Dynamic   —           —
○ /explore                        Static    —           —
○ /faq                            Static    —           —
○ /feedback                       Static    —           —
ƒ /notifications                  Dynamic   —           —
○ /privacy, /terms, /tournaments  Static    —           —
ƒ /s/[id]                         Dynamic   —           —
○ /sitemap.xml                    Static    —           —
+ 50+ /api/* routes (all Dynamic)
+ ƒ Proxy (Middleware)
```

## 3. Bundle Inventory — `.next/static/chunks/` (81 files, 11 MB total)

| Size       | Filename                          | Contents (identified)                                  |
|------------|-----------------------------------|--------------------------------------------------------|
| **3.05 MB** | `0cwh-y-4wc.-9.js`               | `@pkmn/dex` learnsets (per-mon move-by-gen tables)    |
| **1.75 MB** | `0o3vusbk0tbvm.js`               | `@pkmn/dex` abilities / moves / species (gen tables)   |
| **1.75 MB** | `0ksojg.n~4u.h.js`               | **Byte-identical duplicate of `0o3vusbk0tbvm.js`** — same 1,839,319 bytes, same first 200 chars. Likely double-emitted into two route chunks. |
| 474 KB     | `0hbk3b80ma.4~.js`                | (motion / framer — only chunk containing `motion` token; lazily-loaded) |
| 408 KB     | `0xr012s5lag5a.js`                | `html2canvas-pro` + `jspdf` (lazy, only on export click) |
| 220 KB     | `0i4g9_wngqb2c.js`                | Clerk auth bundle (suspected — size + presence on auth routes) |
| 198 KB     | `0rwwge57xnfls.js`                | unidentified (likely Clerk or React internals)         |
| 193 KB     | `10-qc793i1~os.js`                | unidentified                                           |
| 192 KB     | `0xpu3x~vtd_5z.js`                | unidentified                                           |
| 173 KB     | `07gylk333xlq7.js`                | unidentified                                           |

Sum of the top 3 (`@pkmn/dex`-related): **6.55 MB raw**, ~1.4 MB gzipped estimate. That is the dominant cost.

## 4. Top-5 Largest Client Components (`src/components/**`)

All five carry `"use client"`. Justified because every one of them is interactive, but each is also dense enough that splitting helps.

| Lines | Bytes | File                                                     |
|-------|-------|----------------------------------------------------------|
| 962   | 41 KB | `src/components/report/PokemonDetailSlide.tsx`           |
| 916   | 47 KB | `src/components/ui/ShareModal.tsx`                       |
| 872   | 45 KB | `src/components/layout/Navbar.tsx`                       |
| 844   | 37 KB | `src/components/report/TeamOverview.tsx`                 |
| 779   | 35 KB | `src/components/report/MatchupPlanSlide.tsx`             |

Notes:
- `ShareModal` is already `dynamic()`-imported from `src/app/page.tsx` — good.
- `PokemonDetailSlide` and `MatchupPlanSlide` are statically imported via `TeamReport` (which is statically imported in `page.tsx`). They cannot be code-split without first lazy-loading `TeamReport` or its slide registry — and `TeamReport` is the primary feature so eager loading is correct on `/`.
- `Navbar` is statically imported and used everywhere — it should be small. At 872 lines / 45 KB source it's bloated; primary candidate for internal splitting (extract menus / dropdown bodies into lazy chunks).

## 5. Server-vs-Client Pages

Out of 19 `page.tsx` files, only **3 carry `"use client"` directly**:

| Page                                  | Necessary? | Notes                                                                                              |
|---------------------------------------|------------|----------------------------------------------------------------------------------------------------|
| `src/app/page.tsx` (1,882 lines)       | **Yes**    | Full team-report UI, 55+ hook call-sites. Cannot convert.                                          |
| `src/app/dashboard/profile/page.tsx`   | **Yes**    | Heavy form state, Clerk `UserButton`, motion animations.                                          |
| `src/app/dashboard/privacy/page.tsx`   | Partially  | Tiny interactivity (delete-account modal + download). Could be a small client child wrapped in a Server Component shell. Low priority — page is 174 lines. |

The bigger issue is **content components imported by Server pages**, every one of which is `"use client"`:

| Server page          | Content component                                                | `'use client'` | Justified?                                                                 |
|---------------------|------------------------------------------------------------------|----------------|----------------------------------------------------------------------------|
| `/champions`         | `app/champions/ChampionsContent.tsx`                              | yes            | **No** — only needs `useEffect` for `applyRandomAccent()` + a `usePostHog` call on mount. The whole page is static markup (TYPE_COLORS table, Mega grid). Could be 95% Server Component + a tiny client `<MountTelemetry/>` child. |
| `/tournaments`       | `app/tournaments/TournamentsContent.tsx` (325 lines)              | yes            | Same pattern — only `useEffect` + posthog telemetry. Same refactor opportunity. |
| `/changelog`         | `app/changelog/ChangelogContent.tsx` (1,133 lines, 95 KB)         | yes            | Mixed — animated motion entries, but the 95-KB changelog **data array is statically inlined** in client JS. Should be a Server Component reading from a JSON manifest, with only the filter/animated row as a client child. Single biggest pure-content win. |
| `/dashboard`         | `app/dashboard/DashboardContent.tsx` (1,216 lines)                | yes            | Justified — interactive dashboard.                                         |
| `/explore`           | `components/explore/ExploreContent.tsx`                           | yes            | Justified — search/filter UI.                                              |
| `/feedback`          | `app/feedback/FeedbackContent.tsx`                                | yes            | Justified — form state.                                                    |

## 6. Dependency Heavy-Hitters (`npm ls --depth=0`)

| Package                  | node_modules | Files importing | Loaded eagerly? | Comment                                                       |
|-------------------------|--------------|-----------------|-----------------|---------------------------------------------------------------|
| `posthog-js`             | 55 MB       | 2 files (Provider + Changelog) | Lazy (via `requestIdleCallback`) | Already deferred — good. |
| `@pkmn/dex`              | 52 MB       | 8 files (3 client, 5 server)   | **Eager in some client chunks** | **Biggest problem.** 3.0 MB + 1.75 MB chunks in client bundle, including a byte-identical duplicate. See §3. |
| `@sentry/nextjs`         | 51 MB       | 1 file (client config)         | Eager (prod only) | `@sentry/cli-linux-x64` is 21 MB but devDep — not shipped.   |
| `@opentelemetry/*`       | 50 MB       | server-only (instrumentation.ts) | server-only    | Not in client bundle. Fine.                                   |
| `jspdf`                  | 29 MB       | 1 file (`export-report.ts`)    | Dynamic `import()` only on PDF click | Good.                                |
| `@clerk/nextjs`          | 16 MB       | many             | Eager client    | Required for auth. ~220 KB chunk. Acceptable.                 |
| `zod`                    | 6.2 MB      | 23 files         | Mostly server   | Used in API routes + a few client validators. Acceptable.    |
| `html2canvas-pro`        | 6.1 MB      | 4 files          | Dynamic `import()` only on export | Good.                                  |
| `axios`                  | 3.0 MB      | **0 files**      | n/a             | **Dead dependency — not imported anywhere in `src/`.** Drop it. |
| `@neondatabase/serverless` | 3.0 MB    | server-only      | server-only     | Fine.                                                         |
| `posthog-node`           | 2.2 MB      | server-only API routes | server-only | Fine.                                                         |
| `vanilla-cookieconsent`  | 196 KB      | 3 files          | client (ConsentGate) | Small, fine.                                              |
| `motion`                 | 728 KB      | 12 files         | client           | 474 KB chunk. Already in `experimental.optimizePackageImports`. Fine. |
| `tweetnacl`              | 196 KB      | 1 file (Discord API route)     | server-only      | Fine.                                                         |

Other oddities:
- `npm ls` reports 5 **extraneous** packages: `@emnapi/core`, `@emnapi/runtime`, `@emnapi/wasi-threads`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util`. These are leftover from a removed peer dep. Pruning via `npm prune` is harmless.

## 7. Concrete Optimisation Recommendations (ranked by leverage)

### #1 — Stop shipping `@pkmn/dex` to the browser (HIGHEST IMPACT, ~2 h)

The build emits **two `@pkmn/dex` chunks totalling 4.85 MB raw** plus a byte-identical 1.75 MB duplicate of the dex tables. That is the largest single lever in the entire bundle.

Files importing `@pkmn/dex` in client code:
- `src/components/report/InlinePokemonEditor.tsx` (client) — uses dex for species search/swap
- `src/lib/data/pkmn-dex-fallback.ts` — imported by both client (`mega-pokemon.ts`) and server (`champions/[pokemon]/page.tsx`)
- `src/lib/data/mega-pokemon.ts` — used by `ChampionsContent` (client wrapper) and Champions pages

Action: pre-extract the **subset** of dex data actually needed at runtime (species name + types + base stats + slug + ability — maybe 300 KB of JSON) into a static `public/data/pkmn-min.json` (or a typed TS module imported on the server only). Stop importing `@pkmn/dex` anywhere reachable from a client component graph. The 4.85 MB drops to ~300 KB.

Even just **deduplicating the byte-identical 1.75 MB chunk** (likely caused by route-level code splitting copying the dex tables into two route bundles) would shave 1.75 MB raw / ~380 KB gzipped without behaviour change. Investigate via the `next build --turbopack --analyze` flag (if supported in 16.2) or temporarily switch to webpack to use `@next/bundle-analyzer`.

### #2 — Convert `/changelog`, `/champions`, `/tournaments` content to mostly-Server (~1.5 h)

These three pages share an identical anti-pattern: a Server `page.tsx` (good — has `metadata`) that immediately renders a single big `"use client"` content component whose only client-side concern is `useEffect(() => { applyRandomAccent(); posthog.capture(...); }, [])`.

Refactor each into:
- Server Component shell (static markup, MetaSnapshot data fetched on the server, JSON-LD, TYPE_COLORS table)
- One small `<MountTelemetry pageName="champions"/>` client child that does the `applyRandomAccent + posthog.capture` `useEffect`

Estimated savings:
- `/changelog`: the 95 KB inlined changelog data array stops shipping as JS — becomes server-rendered HTML. Probably 60–80 KB compressed saving per first load of that route.
- `/champions`, `/tournaments`: smaller wins (10–20 KB each) but identical pattern, easy to do alongside.

### #3 — Drop `axios` (5 min)

`axios` is in `dependencies` (3.0 MB on disk) but **`grep -rln 'from "axios"' src` returns zero results**. It's pulled in transitively or was kept after a refactor. Remove from `package.json` and `npm prune`. Saves install time + supply-chain surface; no bundle effect (it's not currently shipped) but pure cleanup.

### #4 — Internally split `Navbar.tsx` (1 h)

`Navbar.tsx` is 872 lines / 45 KB and is **imported eagerly on every route** (it's in `src/app/page.tsx` line 20 and likely every layout). Splitting the user-menu dropdown body, the search overlay, and the notification bell flyout into `dynamic()` children that only mount on open would shave the per-route critical path by maybe 15–25 KB. Lower urgency than #1 / #2 but high traffic.

### #5 — Prune extraneous dev artefacts (5 min)

Run `npm prune` to drop the 5 extraneous `@emnapi/*`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util` packages. Zero runtime impact, cleaner `npm ls`. Worth doing in the next housekeeping pass.

## 8. Items Already Done Well (do not regress)

- `posthog-js` is lazy-loaded via `requestIdleCallback` in `PostHogProvider.tsx`.
- `html2canvas-pro`, `jspdf`, `qrcode` are all behind dynamic `import()` at the call site.
- `ShareModal`, `CommentSection`, `CollaboratorPanel`, `DiffNavigator`, `OTSSheetModal`, `PdfExport`, `DoubleTapLikeOverlay`, `EditChangelog` are all `dynamic()`-imported from `src/app/page.tsx`.
- `motion/react` is in `experimental.optimizePackageImports`.
- Sentry replay session sampling is `0` (only on error), which is the right default.
- No `@smogon/calc` in the bundle (confirmed via changelog — removed in earlier pass).

## 9. Things I Could Not Verify

- Per-route First Load JS sizes — Turbopack output omits this. To recover the metric, either:
  - Run a one-off `next build --no-turbo` (webpack mode) locally and capture the route table.
  - Or add `@next/bundle-analyzer` and inspect the route → chunk graph.
- gzip / brotli sizes of individual chunks — would need `gzip -c chunk.js | wc -c`. Raw sizes used throughout above.
- Whether the duplicated 1.75 MB chunk is two separate route bundles or a Turbopack quirk — needs bundle-analyzer to confirm.
