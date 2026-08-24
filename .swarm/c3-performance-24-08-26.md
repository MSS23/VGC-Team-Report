# C3 — Performance / Bundle Audit — 2026-08-24

Read-only audit. Next 16.3 + Turbopack, production build (`.next/`, BUILD_ID present, build exited 0 in 36.9s).
No files modified outside `.swarm/`. No build or install run by this agent.

## Method (worth keeping — see VGC-269)

Turbopack's `next build` prints the route table with **no size columns at all**, so all numbers below were
recovered from build artefacts instead:

1. Every prerendered route emits `.next/server/app/<route>.html` containing the exact `<script src>` list
   the browser will fetch on first load.
2. Sum `stat` + `gzip -c | wc -c` over those chunk files = real first-load JS per route.
3. **Exclude `noModule` scripts.** `0cz1d0mv5g_q7.js` (112.6 kB raw / 39.5 kB gz, core-js) is tagged
   `noModule` — it is Next's legacy polyfill bundle and modern browsers never download it. Any audit that
   counts it (several earlier ones did) overstates every route by ~39 kB gz.
4. Chunks were fingerprinted by grepping distinctive strings (`cc_cookie`, `ClerkLoaded`, `schemaVersion`,
   `transformPerspective`, zod's `_zod` trait installer, etc.).

---

## First-load JS per route (modern browsers, gzipped)

| Route | Chunks | Raw | **Gzip** | Over baseline |
|---|---:|---:|---:|---:|
| `/` | 20 | 1,039,205 | **310.7 kB** | +94.1 kB |
| `/compare` | 20 | 1,093,144 | **306.2 kB** | +89.6 kB |
| `/dashboard` | 20 | 994,426 | **297.1 kB** | +80.5 kB |
| `/explore` | 18 | 891,971 | **269.6 kB** | +53.0 kB |
| `/champions/[pokemon]` (74 SSG pages) | 18 | 852,663 | **261.1 kB** | +44.6 kB |
| `/feedback` | 18 | 844,304 | **259.0 kB** | +42.5 kB |
| `/changelog` | 18 | 842,395 | **258.5 kB** | +42.0 kB |
| `/champions` | 17 | 768,479 | **230.0 kB** | +13.4 kB |
| `/tournaments` | 17 | 725,949 | **220.7 kB** | +4.1 kB |
| `/terms`, `/privacy`, `/faq`, `/support` | 17 | 711,776 | **216.6 kB** | baseline |
| `/_not-found` | 16 | 708,643 | **215.3 kB** | — |

Plus 24.8 kB gz CSS (`3v3l-5lo0fvhs.css`, 169.9 kB raw) shared everywhere.

**The headline is the baseline, not the routes.** A static legal page with zero interactivity ships
216.6 kB gz. That is ~70% of the homepage's total. Route-specific code is the *small* half of every
number in this table.

### Shared-baseline breakdown (every route, incl. `/terms`)

| gz | raw | Chunk | Contents |
|---:|---:|---|---|
| 64,529 | 204,596 | `34wvn5zw0a69w.js` | react-dom |
| 34,229 | 127,335 | `2reak9ew8mz9t.js` | next app-router client |
| 31,080 | 107,027 | `2eekuzkw77x2a.js` | **@clerk/react** |
| 14,858 | 41,547 | `2f2ge-w31c466.js` | **@clerk/nextjs** |
| 13,728 | 35,728 | `1bghurpleveap.js` | **@clerk/clerk-react components + vanilla-cookieconsent** |
| 12,114 | 50,471 | `30c-09oqb9kj6.js` | **@clerk/shared** (loadScript/retry) |
| 8,539 | 31,917 | `11jq0c2_zavac.js` | next navigation errors |
| 8,490 | 26,791 | `37u51_524syek.js` | next server-actions client |
| 8,366 | 27,629 | `23c5h5wdeds1s.js` | small polyfill set |
| 6,370 | 16,225 | `28j5o-dyfxx1h.js` | **@clerk/nextjs keyless** |
| 4,340 | 10,943 | `turbopack-*.js` | Turbopack runtime |
| 9,921 | 31,567 | 6 small chunks | misc |

**Clerk + cookie-consent ≈ 78.2 kB gz — 36% of the shared baseline — on all 89 prerendered pages.**

---

## Cross-check of the open perf tickets

### VGC-269 — no bundle-size visibility since Next 16 + Turbopack → **STILL BROKEN**

Confirmed empirically. The build's route table (tail captured in this run's output) prints only route
paths and the `○ ● ƒ` legend — no "Size" or "First Load JS" columns. Corroborating evidence:

- `package.json:5-19` — no `analyze` script.
- `node_modules/@next/bundle-analyzer` — **not installed**.
- `next.config.ts` — no analyzer wrapper.
- `.github/workflows/ci.yml` — no size step (by design it skips `next build` entirely).

**Concrete fix** — the artefact-parsing method above works today with zero new dependencies. Add
`scripts/bundle-size.mjs` run after `next build`:

```js
// walk .next/server/app/**/*.html, for each: collect <script src> excluding noModule,
// stat + gzipSync each .next/<src>, print a route table sorted by gz total,
// and diff against a committed .bundle-size-baseline.json; exit 1 on >5% growth.
```

This reproduces (and improves on) the pre-Turbopack table, works for SSG *and* dynamic routes that
prerender a fallback, and is CI-safe because it needs only `.next/`, no prod secrets. Collapse
`/champions/mega-*` into one `[pokemon]` row (74 near-identical pages).

### VGC-268 — motion eager on 7 routes (~37.8 kB gz) → **STILL BROKEN, unchanged**; move-names half **FIXED**

Motion chunk `0y3cx1zi-ccxg.js` = 117,580 raw / **38,422 gz**. Present in the first-load `<script>` list of
exactly **7 route groups**, matching the ticket verbatim:

`/` · `/changelog` · `/dashboard` · `/dashboard/profile` · `/explore` · `/feedback` · `/champions/[pokemon]`

15 client files statically `import … from "motion/react"`:

- `src/components/input/PasteInput.tsx:6` ← **the homepage's pull** (`src/app/page.tsx:10` imports PasteInput statically; 35 `motion.*` usages, all entrance fades/slides)
- `src/app/changelog/ChangelogContent.tsx:4`
- `src/app/dashboard/profile/page.tsx:4`
- `src/app/feedback/FeedbackContent.tsx:4`
- `src/app/champions/[pokemon]/MegaLandingContent.tsx:5`
- `src/components/explore/ExploreContent.tsx:4`, `ExploreFilters.tsx:6`, `ExploreEmpty.tsx:3`, `ReportCard.tsx:4`, `SpotlightCard.tsx:4`
- `src/components/social/CreatorProfile.tsx:4`
- `src/components/ui/WhatsNewModal.tsx:5`

Note `next.config.ts:19` already sets `experimental.optimizePackageImports: ["motion/react"]` — it is
**not helping**: the chunk is still a monolithic 38.4 kB gz. Turbopack does not apply barrel optimisation
the way the webpack path did, so that config line is currently dead weight and should not be treated as
the fix.

**Concrete fix, cheapest first:**
1. `PasteInput.tsx` and the `champions/[pokemon]` + `changelog` + `feedback` pages use motion only for
   one-shot entrance transitions (opacity/translate). Replace those with CSS `@keyframes` +
   `prefers-reduced-motion` — removes motion from 4 of the 7 routes outright.
2. For the genuinely interactive ones (`ExploreFilters` `AnimatePresence`, `WhatsNewModal`,
   `dashboard/profile`), switch to `motion/react-m` + `LazyMotion` with `domAnimation` features loaded
   via `import()`. That cuts the eager cost to ~5 kB gz and defers the rest.
3. `dashboard/profile` is behind auth — wrap its motion usage in `next/dynamic(..., { ssr: false })`.

**Move-names half is fixed.** `0283r4a4lwfak.js` (113,717 raw / 47,564 gz, the `MOVE_NAMES` table) appears
in the first-load list of **zero** routes. Its only importer is `src/lib/utils/translate-move.ts:3`, whose
five consumers (`PokemonCard`, `PokemonDetailSlide`, `OffensiveCoverageChart`, `TournamentMode`,
`OTSSheetModal`) are all reached through `next/dynamic` from `src/app/page.tsx:13-64`. See NEW-4 below
for the residual problem.

### VGC-257 — `dex-subset.json` 330.3 kB eagerly bundled into homepage → **FIXED for `/`, REGRESSED onto `/compare`**

The positional-array re-encode landed: `src/lib/data/dex-subset.json` is now **129,858 bytes raw**
(was 330.3 kB), shipping as `2s786ain9e09t.js` at 131,143 raw / **34,229 gz**. Documented at
`src/lib/data/dex-subset.ts:11-27`.

Homepage: **clean.** Neither the dex-subset chunk nor `pokemon.ts` appears in `index.html`'s script list.
The `analyze-team.ts:8-15` barrier ("Nothing on the homepage's initial render path may import this module
statically") is being honoured — `src/app/page.tsx` reaches it only through `next/dynamic`.

But the barrier is a comment, not a mechanism, and `/compare` walks straight past it. **`/compare` is the
only route that eagerly loads both data tables:**

| gz | raw | Chunk | Contents |
|---:|---:|---|---|
| 39,095 | 193,674 | `3yv3y7esj_hpn.js` | `src/lib/data/pokemon.ts` (243 kB source) |
| 34,229 | 131,143 | `2s786ain9e09t.js` | `dex-subset.json` |

**73.3 kB gz of static data on `/compare`'s critical path.** Chain:

- `src/components/compare/CompareContent.tsx:6` — `import { lookupPokemon } from "@/lib/data/pokemon"`
- `src/components/compare/CompareContent.tsx:20` — `import { detectMegaFromItem, isMegaForm } from "@/lib/utils/mega-detect"`
- → `src/lib/data/pokemon.ts:2` — `import { lookupPokemonFromDex } from "./pkmn-dex-fallback"`
- → `src/lib/data/pkmn-dex-fallback.ts:35` — `from "@/lib/data/dex-subset"`
- → `src/lib/data/dex-subset.ts:39` — `import rawSubset from "./dex-subset.json"`

**Concrete fix:** `/compare` only needs the data *after* the user supplies two pastes. Move
`CompareContent`'s analysis into the same `await import("@/lib/analysis/analyze-team")` deferral the
homepage uses (`src/app/page.tsx:534` is the existing pattern), holding results in state. Expected saving:
**306.2 → ~233 kB gz first load** on `/compare`, a 24% cut.

Also worth adding an ESLint `no-restricted-imports` rule so the `analyze-team.ts` barrier is enforced
rather than commented — that is exactly the class of regression that happened here.

### VGC-271 — lazy-load dex-subset fallback → **PARTIALLY DONE; the bundle half is still broken**

`src/lib/data/dex-subset.ts:20-21` documents "Decoding is lazy: nothing is materialised until the first
`getSpecies()`". That is true and correct — but it defers **CPU**, not **bytes**. Line 39 is still a
static `import rawSubset from "./dex-subset.json"`, so all 129,858 bytes are welded into whatever chunk
`pokemon.ts` lands in and download with it.

On `/` that is harmless (the whole group is behind `analyze-team`'s dynamic import). On `/compare` it is
34.2 kB gz on first load. The lazy-decode work does not protect anything the static import already leaked.

**Concrete fix:** make the payload lazy too —

```ts
let subsetPromise: Promise<RawSubset> | null = null;
const loadSubset = () => (subsetPromise ??= import("./dex-subset.json").then(m => m.default));
```

and make `getSpecies` / `allSpecies` / `getMegaStone` async (or keep a sync fast path over `pokemon.ts`
and only await for genuine fallback misses — the fallback is documented at `pkmn-dex-fallback.ts:3-6` as
firing only when the hand-maintained maps miss, which "a typical team never reaches"). Fixing VGC-271
this way also fixes the `/compare` half of VGC-257 for free.

### VGC-256 — lazy-load zod out of client bundle → **FIXED**

Verified from both sides.

- Source: `src/lib/sharing/url-codec.ts:12-22` holds a memoised `import("./url-codec.schemas")` with a
  correct failure-path reset (`schemasPromise = null` in the `catch`, so a transient chunk-fetch error
  doesn't permanently break decoding). The rationale and the "do NOT re-add a static import" warning are
  at `url-codec.ts:3-10`.
- Artefact: the zod chunk `3fh60j1aq6y_9.js` (271,983 raw / **63,600 gz**) appears in the first-load script
  list of **zero** prerendered routes. Matches the ticket's predicted ~265 kB raw / ~63 kB gz exactly.
- The 23 remaining static `import { z } from "zod"` sites are all under `src/app/api/**` (server routes) —
  correctly unaffected.

No action needed. Ticket can be closed.

---

## NEW findings

### NEW-1 (P1) — Clerk ships ~78 kB gz on all 89 prerendered pages, including logged-out static pages

`src/app/layout.tsx:106` wraps the **entire** app in `<ClerkProvider>`, including `</ClerkProvider>` at
line 144 closing after `DeferredLayoutExtras`. Four Clerk chunks plus the cookie-consent chunk are in the
first-load list of `/terms`, `/privacy`, `/faq`, `/support`, `/tournaments`, `/champions/*` — pages with
no sign-in affordance and no auth-gated content.

Verified: all four Clerk chunk hashes are present in `.next/server/app/terms.html`.

This is the single largest lever in the audit: **~78 kB gz off every route**, dwarfing motion (38 kB on
7 routes) and the `/compare` data problem (73 kB on 1 route).

**Concrete fix:** Clerk's provider only needs to wrap the subtree that calls `useAuth`/`useUser`/
`SignInButton`. Consumers found: `src/app/page.tsx:50`, `src/components/compare/CompareContent.tsx:4`,
`src/components/providers/PostHogProvider.tsx:5`, `src/app/dashboard/**`, `src/components/layout/Navbar.tsx`.
Options in order of payoff/effort:

1. Move `ClerkProvider` out of the root layout into a route-group layout
   (`src/app/(authed)/layout.tsx`) covering `/dashboard`, `/notifications`, `/s/[id]`, and the homepage;
   leave `(marketing)` — legal pages, `/faq`, `/tournaments`, `/champions/**` — outside it. Saves ~78 kB gz
   on ~80 of the 89 pages, including all 74 SEO-critical mega guide pages.
2. If the navbar's sign-in state must render everywhere, render a static logged-out navbar and hydrate the
   authed variant behind `next/dynamic(..., { ssr: false })`.
3. `PostHogProvider.tsx:5` imports `useAuth`/`useUser` from `@clerk/nextjs` purely to attach identity —
   that hook usage is what forces Clerk into the provider tree on every page. It can be split into a small
   `<PostHogIdentify />` mounted only inside the authed subtree (the component already exists at
   `PostHogProvider.tsx:35`).

Note the `/champions/[pokemon]` pages are called out in `CLAUDE.md` as SEO-critical; they currently pay
78 kB gz of Clerk **and** 38 kB gz of motion for a static marketing page. Fixing NEW-1 + VGC-268 takes them
from 261.1 → ~145 kB gz.

### NEW-2 (P2) — `CookieBanner` is statically imported in the root layout while its siblings are deferred

`src/app/layout.tsx:8` statically imports `CookieBanner`, rendered at line 107. It in turn does
`import * as CookieConsent from "vanilla-cookieconsent"` **plus** `import "vanilla-cookieconsent/dist/cookieconsent.css"`
at `src/components/providers/CookieBanner.tsx:4-5`. The library lands (Turbopack-merged with Clerk react)
in `1bghurpleveap.js` and its CSS inside the shared 169.9 kB raw stylesheet.

This is inconsistent with the file next to it: `src/components/ui/DeferredLayoutExtras.tsx` defers four
below-the-fold widgets via `next/dynamic(..., { ssr: false })` with the comment "loading them after
hydration keeps their code out of every route's initial bundle". `ClarityProvider` (`ClarityProvider.tsx:27`)
and `PostHogProvider` (`PostHogProvider.tsx:168`, behind `requestIdleCallback`) are both deferred too.
CookieBanner is the one holdout.

**Concrete fix:** move `CookieBanner` into `DeferredLayoutExtras.tsx` as a fifth `dynamic(..., { ssr: false })`
entry. The banner is not above the fold and is already a post-hydration `useEffect` (`CookieBanner.tsx:15`),
so nothing regresses. Saves ~8-13 kB gz JS + the cookieconsent CSS from every route.

### NEW-3 (P2) — `/compare` duplicates the homepage's analysis stack without any of its deferral

Beyond the data tables in VGC-257 above, `src/components/compare/CompareContent.tsx:5-20` statically pulls
`showdown-parser`, `stat-calculator`, `item-boosts`, `type-chart`, `pokepaste`, and `mega-detect` — a
498 kB transitive source graph, all eager. The homepage reaches the identical stack lazily. `/compare` is
`robots: { index: false }` (`src/app/compare/page.tsx`), i.e. a low-traffic utility route paying the
second-highest first-load cost on the site.

**Concrete fix:** covered by the VGC-257 fix — route everything through
`await import("@/lib/analysis/analyze-team")` on submit.

### NEW-4 (P3) — `translate-move.ts` builds a 900-entry Map at module scope that English users never read

`src/lib/utils/translate-move.ts:16-21` runs `new Map(Object.entries(MOVE_NAMES).map(...))` at module
evaluation time, normalising every move name. `translateMove` then early-returns at line 28 for
`lang === "en"` — the default and the overwhelming majority of sessions.

So English users download 47.6 kB gz of `move-names` and pay ~900 `normalize("NFKC")` + regex calls during
hydration for a table they never index into. This is not a first-load cost (the chunk is correctly lazy —
see VGC-268 above), but it is a hydration-time cost on the report view, which is the app's core screen.

**Concrete fix:** two lines —

```ts
let byName: Map<string, {name: string; translations: Record<string,string>}> | null = null;
export function translateMove(englishName: string, lang: LanguageCode): string {
  if (lang === "en") return englishName.trim();
  byName ??= new Map(Object.entries(MOVE_NAMES).map(/* … */));
  …
}
```

Better still, move `MOVE_NAMES` behind `await import("@/lib/data/move-names")` inside a non-`en` branch so
the 47.6 kB gz chunk is never fetched for English sessions at all.

### NEW-5 (P3) — `optimizePackageImports: ["motion/react"]` is inert under Turbopack

`next.config.ts:18-20`. The motion chunk is a single 117.6 kB raw / 38.4 kB gz blob, i.e. no barrel
splitting occurred. Harmless but misleading — it reads like motion is already optimised, which is
presumably why VGC-268 has stayed open. Either remove the line or annotate it as non-functional so the
next reader doesn't assume the problem is handled.

---

## Heavy npm deps — status

Checked every dependency in `package.json` against client-component imports.

| Dep | Chunk gz | In any first load? | Verdict |
|---|---:|---|---|
| `@clerk/nextjs` | 78,150 (5 chunks) | **Yes — all 89 pages** | **NEW-1, worst offender** |
| `react-dom` | 64,529 | yes (unavoidable) | fine |
| `posthog-js` | 69,181 | **no** | correct — `PostHogProvider.tsx:168`, `requestIdleCallback` + 3s timeout. Type-only imports at lines 8-12 erase correctly. |
| `jspdf` (+ fflate) | 132,291 | **no** | correct — `src/lib/utils/export-report.ts:5` |
| `html2canvas-pro` | 54,295 | **no** | correct — `src/lib/dynamic-imports/html2canvas.ts:15`, memoised |
| `zod` | 63,600 | **no** | correct — VGC-256, fixed |
| `motion` | 38,422 | **yes — 7 routes** | **VGC-268, still broken** |
| `qrcode` | ~45,000 | **no** | correct — `OTSSheetModal.tsx:95`, `TeamOverview.tsx:402` |
| `@pkmn/dex` | (~350 kB gz) | **no** | correct — never imported from client code; replaced by `dex-subset.json`. Only textual mentions remain in comments. |
| `vanilla-cookieconsent` | ~8-13k | **yes — all pages** | **NEW-2** |
| `@microsoft/clarity` | ~4,000 | no | correct — `ClarityProvider.tsx:27` |
| `core-js` | 39,496 | `noModule` only | **not a real cost.** Pulled transitively by `posthog-js` and `canvg`(←`jspdf`); Next emits it as the legacy polyfill bundle. Do not "fix" this. |
| `@opentelemetry/*` | — | n/a | correct — `serverExternalPackages`, `next.config.ts:24-29` |
| `@neondatabase/serverless`, `@upstash/*`, `posthog-node`, `tweetnacl` | — | no | server-only, clean |

---

## Largest client components

### By own source size

| Bytes | File |
|---:|---|
| 81,586 | `src/app/page.tsx` |
| 57,226 | `src/app/dashboard/DashboardContent.tsx` |
| 49,094 | `src/components/layout/Navbar.tsx` |
| 45,523 | `src/components/ui/ShareModal.tsx` |
| 42,800 | `src/hooks/useHomePage.ts` |
| 42,218 | `src/components/report/PokemonDetailSlide.tsx` |
| 39,850 | `src/components/report/TeamOverview.tsx` |

### By transitive static-import weight (source bytes, `@/`-resolved, excluding `import type` and `import()`)

| Transitive | Own | Files | Entry |
|---:|---:|---:|---|
| 1,040,439 | 5,553 | 55 | `src/components/ui/PdfExport.tsx` |
| 966,777 | 30,402 | 48 | `src/components/report/MatchupPlanSlide.tsx` |
| 949,877 | 4,241 | 48 | `src/components/report/MatchupSheet.tsx` |
| 927,570 | 14,829 | 44 | `src/components/report/TeamReport.tsx` |
| 927,570 | 42,218 | 44 | `src/components/report/PokemonDetailSlide.tsx` |
| 927,570 | 39,850 | 44 | `src/components/report/TeamOverview.tsx` |
| 734,963 | 30,098 | 28 | `src/components/report/PokemonCard.tsx` |
| 517,077 | 34,865 | 19 | `src/components/report/SpeedTierChart.tsx` |
| 498,371 | 22,100 | 21 | `src/components/compare/CompareContent.tsx` |
| 480,613 | 81,586 | 61 | `src/app/page.tsx` |

Reading this correctly: the `report/*` cluster is ~930 kB of transitive source, but it is **entirely
behind `next/dynamic`** from `src/app/page.tsx:13-64` and appears in no route's first load. That is the
architecture working as intended and should not be "fixed".

The outlier is **`CompareContent.tsx` at 498 kB transitive with zero deferral** — the only entry in this
list whose weight actually lands on a first paint. See NEW-3 / VGC-257.

---

## Recommended order of work

| # | Change | Saving | Routes | Risk |
|---|---|---:|---|---|
| 1 | Scope `ClerkProvider` to an authed route group (NEW-1) | ~78 kB gz | ~80 of 89 | medium — touches auth surface, needs care per `CLAUDE.md` branch policy |
| 2 | Defer analysis stack on `/compare` (VGC-257 regression + NEW-3) | ~73 kB gz | `/compare` | low |
| 3 | CSS-ify entrance animations, `LazyMotion` for the rest (VGC-268) | ~38 kB gz | 7 route groups | low-medium |
| 4 | Add `scripts/bundle-size.mjs` + CI budget (VGC-269) | prevents regressions | all | low |
| 5 | Move `CookieBanner` into `DeferredLayoutExtras` (NEW-2) | ~8-13 kB gz + CSS | all | very low |
| 6 | Lazy `dex-subset.json` payload (VGC-271) | reinforces #2 | `/compare` | low |
| 7 | Lazy `MOVE_NAMES` Map (NEW-4) | hydration CPU | report view | very low |
| 8 | Close VGC-256 | — | — | — |

Items 1 and 3 together take `/champions/[pokemon]` — 74 SEO-critical SSG pages — from 261.1 kB gz to
roughly 145 kB gz, and the static legal/marketing pages from 216.6 to ~130 kB gz.

Per `CLAUDE.md`, item 1 qualifies as large/risky (auth surface, many files) and should go on a feature
branch rather than straight to `main`.
