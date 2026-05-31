# C3 — Performance Audit (Bundle + Runtime)
**Date:** 2026-05-31
**Scope:** Next.js 16.2.6 / React 19.2.3 / Turbopack production build
**Build status:** PASSED (DB-connection warnings during SSG of `/champions/[pokemon]` continue — same as previous audits; not perf-impacting, just log noise).

Prior audit `c3-perf-23-05-26.md` flagged VGC-214 (`@pkmn/dex` on client, ~1.84 MB raw) and changelog data (~73 KB). Both are FIXED:
- `@pkmn/dex` no longer in any client chunk. Replaced by `src/lib/data/dex-subset.json` (~324 KB raw, ~40 KB gzipped) — see `src/lib/data/dex-subset.ts` accessor and `scripts/build-dex-subset.mjs`.
- `changelog/data.ts` (~77 KB) is now imported by the RSC `src/app/changelog/page.tsx` and passed as a prop to `ChangelogContent`. The changelog-unique client chunk is **16 KB** (`0znjfc82_q3eo.js`) — confirmed RSC-only path for the data.

The biggest opportunities remaining are **(a) dex-subset duplication across `/` and `/compare`** and **(b) the unchanged largest-component / page-shape items from the prior audit** (page.tsx still 1884-line `"use client"`, motion library still 118 KB on shared chunk).

---

## 1. Build output (per-route bundle composition)

Next 16 + Turbopack doesn't print a First Load JS table. Sizes were derived by reading the `<script src>` tags in pre-rendered HTML under `.next/server/app/*.html` and summing the unique `.next/static/chunks/*.js` files. Identification by byte signatures (`grep -ao` for `Html2CanvasConfig`, `jsPDF`, `schemaVersion`, `MotionConfig`, etc.). Total chunks dir: **4.8 MB raw** (was ~10 MB before VGC-214 fix).

### Largest static chunks (`.next/static/chunks/`)

| chunk                           | raw     | contents (verified by string signatures)                                       |
|---------------------------------|--------:|--------------------------------------------------------------------------------|
| `0rvctb-cw8l5i.js`              | **485 KB** | App code for `/` (TeamReport / PokemonDetailSlide / WalkthroughOverlay JSX)    |
| `0xr012s5lag5a.js`              | **418 KB** | jsPDF (`jsPDF`, fflate worker) + bundled-in html2canvas                        |
| `0eeqwi5zjfw3a.js`              | **340 KB** | `dex-subset.json` literal — bundled into the `/compare` client manifest        |
| `0xpwnv1i16rc1.js`              | **340 KB** | `dex-subset.json` literal — bundled into the `/` client manifest (DUPLICATE)   |
| `0i4g9_wngqb2c.js`              | 226 KB  | html2canvas-pro standalone (loaded via `getHtml2Canvas()` singleton)            |
| `0rwwge57xnfls.js`              | 203 KB  | Clerk / framework shared root chunk                                            |
| `10-qc793i1~os.js`              | 198 KB  | html2canvas (classic, embedded by jsPDF) — only loaded when jsPDF imports it   |
| `02zw10s43j3wt.js`              | 197 KB  | App code on `/` (mega-detect / pkmn-dex-fallback / pokemon.ts client surface)  |
| `07gylk333xlq7.js`              | 178 KB  | posthog-js + Sentry (only after consent, dynamic-imported in `PostHogProvider`)|
| `13zgg7no95fse.js`              | 158 KB  | Clerk runtime                                                                  |
| `069~_h90gxh59.js`              | 118 KB  | `motion` core (animation values / spring / parsers / colour easing)            |
| `03~yq9q893hmn.js`              | 113 KB  | polyfills                                                                      |

### Per-route bundle size (sum of unique `<script src>` chunks in the pre-rendered HTML, raw bytes)

| Route                  | total JS (raw) | notes                                                              |
|------------------------|---------------:|--------------------------------------------------------------------|
| `/` (home)             | **~2.2 MB**    | Down from ~3.8 MB. Largest remaining: `0xpwnv1i16rc1.js` 340 KB (`dex-subset` JSON) and `0rvctb-cw8l5i.js` 485 KB (home app code). |
| `/compare`             | **~1.4 MB**    | Down from ~3.0 MB. Still includes its own 340 KB `dex-subset` chunk (`0eeqwi5zjfw3a.js`). |
| `/dashboard`           | ~1.1 MB        | Shared chunks + Clerk + dashboard module                            |
| `/explore`             | ~1.0 MB        | Includes ExploreContent + filters                                   |
| `/changelog`           | ~1.0 MB        | Data now RSC, client chunk for body is 16 KB                        |
| `/feedback`, `/faq`    | ~0.9–1.0 MB    | Reasonable                                                          |
| `/champions`           | ~0.9 MB        | Reasonable                                                          |
| `/champions/[pokemon]` | ~1.0 MB        | RSC — dex stays server-side                                          |
| `/embed/[id]`, `/s/[id]` | dynamic SSR  | Not pre-rendered                                                    |

Note: the 3.1 MB `learnsets` chunk and the 1.8 MB `@pkmn/dex/index.min.js` from the prior audit are GONE from `.next/static/chunks/`. The `dex-subset` route-level duplication is the biggest residual issue.

---

## 2. Largest client components (`"use client"`, > 500 LOC)

| LOC  | file                                                            | recently_changed |
|-----:|-----------------------------------------------------------------|:-:|
| 1884 | `src/app/page.tsx`                                              | YES |
| 1219 | `src/app/dashboard/DashboardContent.tsx`                        | YES |
|  963 | `src/components/report/PokemonDetailSlide.tsx`                  | YES |
|  933 | `src/components/ui/ShareModal.tsx`                              | YES |
|  890 | `src/components/layout/Navbar.tsx`                              | YES |
|  850 | `src/components/report/TeamOverview.tsx`                        | YES |
|  834 | `src/hooks/useHomePage.ts` (hook, not a component but heavy)    | no  |
|  779 | `src/components/report/MatchupPlanSlide.tsx`                    | no  |
|  719 | `src/components/explore/ExploreFilters.tsx`                     | YES |
|  675 | `src/components/report/SpeedTierChart.tsx`                      | no  |
|  670 | `src/components/input/PasteInput.tsx`                           | YES |
|  558 | `src/components/report/PokemonCard.tsx`                         | YES |
|  537 | `src/components/compare/CompareContent.tsx`                     | no  |
|  528 | `src/app/dashboard/profile/page.tsx`                            | no  |
|  518 | `src/components/match-tracker/MatchTracker.tsx`                 | no  |

Of these, **5 of the top 6** are in `.swarm/main-changed-files.md`. Any decomposition refactor must rebase carefully.

ShareModal went from 852 → 933 LOC since 23-05-26. Navbar went 872 → 890. `useHomePage.ts` (a hook, 834 LOC) is new in the >500 club.

---

## 3. Heavy npm-dependency audit — file:line of every client-side import

| package          | node_modules size | client-bundle status                                                                                  |
|------------------|------------------:|-------------------------------------------------------------------------------------------------------|
| `@pkmn/dex`      | 52 MB             | **NOT in client.** Only server consumers: `src/instrumentation.ts`, `scripts/build-dex-subset.mjs`. Verified by signature scan of all chunks (no `learnsets`, no `Dex` factory). Replaced by `dex-subset.json`. |
| `motion`         | 728 KB            | Client. 12 import sites (see breakdown below). Shipped in chunk `069~_h90gxh59.js` (118 KB raw) on shared client graph. |
| `qrcode`         | 260 KB            | Client, dynamic-imported. 2 call sites: `src/components/ui/OTSSheetModal.tsx:91`, `src/components/report/TeamOverview.tsx:376`. ~24 KB raw chunk (`0kauo_1p4s347.js`). |
| `html2canvas-pro`| 6.1 MB            | Client, dynamic-imported via singleton. 226 KB raw chunk (`0i4g9_wngqb2c.js`). Centralized through `src/lib/dynamic-imports/html2canvas.ts:13`. |
| `jspdf`          | 29 MB             | Client, dynamic-imported. 1 call site: `src/lib/utils/export-report.ts:5`. ~418 KB raw chunk (`0xr012s5lag5a.js`) + its own internal html2canvas (`10-qc793i1~os.js`, 198 KB). |
| `posthog-js`     | 55 MB             | Client. Lazy-loaded after consent in `src/components/providers/PostHogProvider.tsx:168` (`Promise.all([import("posthog-js"), import("posthog-js/react")])`). 178 KB chunk. |

### `motion` import sites (all `'use client'`)

| file                                                   | line | imports                                          | recently_changed |
|--------------------------------------------------------|-----:|--------------------------------------------------|:-:|
| `src/components/ui/WhatsNewModal.tsx`                  | 5    | `motion, AnimatePresence`                         | no  |
| `src/components/social/CreatorProfile.tsx`             | 4    | `motion`                                          | no  |
| `src/components/input/PasteInput.tsx`                  | 5    | `motion`                                          | YES |
| `src/components/explore/ExploreContent.tsx`            | 4    | `motion`                                          | no  |
| `src/components/explore/ExploreFilters.tsx`            | 6    | `AnimatePresence, motion, useReducedMotion`       | YES |
| `src/components/explore/ExploreEmpty.tsx`              | 3    | `motion`                                          | no  |
| `src/components/explore/ReportCard.tsx`                | 4    | `motion`                                          | YES |
| `src/components/explore/SpotlightCard.tsx`             | 4    | `motion`                                          | no  |
| `src/app/feedback/FeedbackContent.tsx`                 | 4    | `motion`                                          | no  |
| `src/app/champions/[pokemon]/MegaLandingContent.tsx`   | 5    | `motion`                                          | no  |
| `src/app/dashboard/profile/page.tsx`                   | 4    | `motion, AnimatePresence`                         | no  |
| `src/app/changelog/ChangelogContent.tsx`               | 4    | `motion`                                          | YES |

All sites are already client components — none could be moved server-side (motion is client-runtime only). The opportunity is replacing simple usages with CSS transitions and lazy-loading the rest.

### `@pkmn/dex` non-client imports (kept server-only — confirm before changes)

- `src/instrumentation.ts` (server)
- `scripts/build-dex-subset.mjs` (build-time)
- All `pokemon.ts` / `mega-pokemon.ts` static maps are pre-resolved, no runtime `@pkmn/dex` call.

---

## 4. Client components importing server-only utilities (and vice-versa)

**None found.** No `'use client'` file imports `@neondatabase/serverless`, `posthog-node`, `server-only`, `@/lib/db`, `nodemailer`, or `tweetnacl`. No `'use server'` annotations anywhere in `src/`.

The closest analog is the **dex-subset coupling**: `pkmn-dex-fallback.ts` (no `'use client'` but server-safe) is pulled into the client graph because `mega-detect.ts` imports from it, and `mega-detect.ts` is imported by `'use client'` components on `/` and `/compare`. This is what causes the duplicated 340 KB JSON chunk per route — not technically a server-only-leak, but the same "boundary not enforced" symptom.

---

## 5. `'use client'` components > 500 LOC that could be split

See §2 above. Top three split candidates (highest ratio of unrelated tab/state code that would code-split cleanly):

1. **`src/app/page.tsx`** (1884 LOC, `'use client'`) — still a giant client root. Has 8 `dynamic(...)` islands already but the marketing-shell + nav + paste flow are all in one client tree. Splitting per VGC-162 stays a high-impact win and is unchanged from prior audit.
2. **`src/app/dashboard/DashboardContent.tsx`** (1219 LOC) — single dashboard shell with tabs, settings panels, and lists. Tab-based lazy-loading would defer the rare-path bundles (privacy settings, deletion flow, export).
3. **`src/components/report/PokemonDetailSlide.tsx`** (963 LOC) — VGC-158 candidate, unchanged from prior audit; per-tab `dynamic()` would shrink eager-load JS.

---

## 6. Findings (prioritized)

### Finding 1 — `dex-subset.json` duplicated across `/` and `/compare` (~340 KB raw each)
- **Files:** `src/lib/data/dex-subset.ts`, `src/lib/data/dex-subset.json` (~324 KB raw / ~40 KB gzipped), `src/lib/data/pkmn-dex-fallback.ts`, `src/lib/utils/mega-detect.ts`, `src/components/report/InlinePokemonEditor.tsx`
- **Current size:** 340 KB raw / ~40 KB gzip × 2 routes — confirmed via signature scan: chunk `0eeqwi5zjfw3a.js` referenced from `/compare`'s `page_client-reference-manifest.js`, chunk `0xpwnv1i16rc1.js` from `/`'s. Both shipped as `<script async>` in the pre-rendered HTML.
- **Why:** `dex-subset.ts` does `import rawSubset from "./dex-subset.json"` at module top-level. Turbopack inlines the JSON into whatever client chunk pulls in `dex-subset.ts`. `mega-detect.ts` imports `pkmn-dex-fallback`, `pkmn-dex-fallback` imports `dex-subset`, and `mega-detect` is in the client graph of both `/` (via `page.tsx:9` and `PokemonCard`/`PokemonDetailSlide`/`SpeedTierChart`) and `/compare` (via `CompareContent.tsx:20`). Two separate client manifests → two separate inlined copies.
- **Recommended fix:** Convert `dex-subset.ts` to load the JSON via a singleton dynamic import — same pattern as `src/lib/dynamic-imports/html2canvas.ts`. The fallback callers (`detectMegaFromItem`, `lookupPokemonFromDex`) already return `null` when the subset doesn't recognise a species, so a `Promise<DexSubset>`-shaped accessor is feasible if call sites can become async OR if the subset can be made an idle-prefetched module. Simplest version: keep the sync API and convert the `import rawSubset from "./dex-subset.json"` to `await import("./dex-subset.json")` inside `ensureSpeciesIndex()` (requires propagating async up to the 2–3 hot callers). One emitted chunk → both routes share it → ~340 KB saved on whichever route currently double-loads (the user crossing from `/` to `/compare` already gets the warm cache, but the second download is the first-visit cost).
- **Alternative (smaller delta but trivial):** Push the entire subset to a `/public/dex-subset.json` static asset + `fetch()` it lazily from the two call sites that need it (`InlinePokemonEditor` for `allSpecies`, and the rare-path mega-detect fallback). Cuts initial JS by ~340 KB raw / ~40 KB gzip on `/` AND `/compare`. Browser caches the file independently of the JS chunks.
- **Effort:** SMALL (dex-subset wrapper rewrite) or MEDIUM (full fetch-based decoupling).
- **Conflict risk:** `pkmn-dex-fallback.ts`, `dex-subset.ts`, `dex-subset.json`, and `InlinePokemonEditor.tsx` are ALL in `main-changed-files.md`. **recently_changed: true.** Coordinate with the dex-subset author.

### Finding 2 — `src/app/page.tsx` is still a 1884-LOC `'use client'` root (VGC-162)
- **Files:** `src/app/page.tsx`, `src/hooks/useHomePage.ts` (834 LOC hook)
- **Current size:** 485 KB raw home-app chunk (`0rvctb-cw8l5i.js`) + a 197 KB shared chunk (`02zw10s43j3wt.js`) containing TeamOverview / pkmn-dex-fallback transitive code.
- **Recommended fix:** Same plan as the previous audit. Split the marketing-state half (above the paste form, including FAQ JSON-LD and `<TeamCardCTA>`) into a Server Component and keep only the paste/report interactive portion as a client island `<HomeClient>`. The 834-line `useHomePage` hook is the natural boundary — everything it touches stays client-side, everything else gets RSC'd. This also unblocks tree-shaking of `mega-detect` for the non-paste cold path.
- **Effort:** MEDIUM (2 h estimated).
- **Conflict risk:** **recently_changed: true.** `src/app/page.tsx`, `src/hooks/useHomePage.ts` (path inferred), and most of its dependencies are in `main-changed-files.md`. Rebase risk is HIGH.

### Finding 3 — `motion` library still 118 KB on the shared chunk
- **Files:** 12 client components (see §3 table). Recently_changed entries: `PasteInput.tsx`, `ExploreFilters.tsx`, `ReportCard.tsx`, `ChangelogContent.tsx`.
- **Current size:** Chunk `069~_h90gxh59.js`, 118 KB raw / ~35 KB gzip. Loaded on `/`, `/explore`, `/changelog`, `/feedback`, `/dashboard/profile`, `/champions/[pokemon]`.
- **Why:** `optimizePackageImports: ["motion/react"]` in `next.config.ts:5` deduplicates named imports but does not tree-shake the spring/colour-interpolation runtime. Most of the 12 sites just animate opacity / translate on mount.
- **Recommended fix:** (a) Replace simple `<motion.div initial={{opacity:0}} animate={{opacity:1}}>` patterns with `class="animate-fade-in"` CSS (Tailwind's `motion-safe:` + custom keyframes — already used in TeamOverview chunk for `animate-fade-in`). (b) For genuine spring physics (`PasteInput.tsx` paste shimmer), keep `motion` but lazy-load via `next/dynamic` so the chunk is fetched only when the animated component mounts. (c) `ExploreFilters` and `ExploreContent` both use motion — they could share a single lazy `motion` chunk on first interaction.
- **Impact:** ~80–118 KB raw (~35 KB gzip) off `/` and 5 other routes.
- **Effort:** MEDIUM (per-file audit, ~60 min).
- **Conflict risk:** 4 of 12 motion users are in `main-changed-files.md`. **recently_changed: true** for those 4 files.

### Finding 4 — `Navbar.tsx` (890 LOC, root-layout-mounted via `PersistentNavbar`) statically imports `VersionHistoryPanel` (379 LOC) and `NotificationBell` (194 LOC)
- **Files:** `src/components/layout/Navbar.tsx:11-12`, `src/components/social/VersionHistoryPanel.tsx` (379 LOC), `src/components/ui/NotificationBell.tsx` (194 LOC)
- **Current size:** Navbar code is in chunk shared across `/`, `/explore`, `/compare`, etc. (PersistentNavbar mounts on every page except `/s/` and `/embed/`). VersionHistoryPanel only renders when `isSharedView` is true — but the code still ships eagerly.
- **Recommended fix:** Convert both to `next/dynamic` with `ssr: false`. `VersionHistoryPanel` is only opened on user click; `NotificationBell`'s polling logic doesn't need to be in the cold-load JS for signed-out users.
- **Impact:** ~10–20 KB raw (~4–6 KB gzip) off every route's shared chunk. Modest per-route, but multiplies across every page view.
- **Effort:** TRIVIAL (~15 min).
- **Conflict risk:** `Navbar.tsx`, `VersionHistoryPanel.tsx`, `NotificationBell.tsx` are all in `main-changed-files.md`. **recently_changed: true.**

### Finding 5 — `PokemonDetailSlide.tsx` (963 LOC) eager-loads all 5 tabs (VGC-158)
- **Files:** `src/components/report/PokemonDetailSlide.tsx`
- **Current size:** Embedded in the home-page app chunk (~485 KB total).
- **Recommended fix:** Same plan as prior audit — extract each tab (`StatsTab`, `MovesTab`, `CalcsTab`, `MatchupsTab`, `NotesTab`) into its own file and load non-default tabs via `dynamic()`. Wrap each tab in `React.memo` and lift tab-selection state to the container.
- **Impact:** ~20–40 KB raw (~10 KB gzip) off the initial TeamReport chunk. Runtime: 2–4× faster tab switches.
- **Effort:** MEDIUM (~90 min).
- **Conflict risk:** **recently_changed: true** (file is in `main-changed-files.md` now — previous audit said low risk; that's changed since 23-05-26).

### Finding 6 — `qrcode` library is double-bundled — both call sites get their own ~24 KB chunk
- **Files:** `src/components/ui/OTSSheetModal.tsx:91`, `src/components/report/TeamOverview.tsx:376`
- **Current size:** `0kauo_1p4s347.js` (24 KB raw) is the qrcode lib; the wrapper code shows up twice across the build. Same Turbopack-per-call-site pattern that originally bit html2canvas.
- **Recommended fix:** Mirror `src/lib/dynamic-imports/html2canvas.ts` — create `src/lib/dynamic-imports/qrcode.ts` with a singleton promise, replace both `import("qrcode")` call sites with `await getQrCode()`.
- **Impact:** ~24 KB raw (~8 KB gzip) saved on the second export path; the bigger win is consistency / future-proofing.
- **Effort:** TRIVIAL (~10 min).
- **Conflict risk:** `OTSSheetModal.tsx` and `TeamOverview.tsx` are both in `main-changed-files.md`. **recently_changed: true.**

### Finding 7 — `DashboardContent.tsx` (1219 LOC) ships as a single client chunk
- **Files:** `src/app/dashboard/DashboardContent.tsx`
- **Current size:** Contributes ~84 KB raw (chunk `0ma1ilrbq-5.i.js` only loaded on `/dashboard`).
- **Recommended fix:** Tab-based code-split — extract each settings/data panel (notifications prefs, privacy controls, saved-reports list, collaborators list, account deletion) into its own file and load via `dynamic()`. Most users only ever touch one or two tabs.
- **Impact:** ~30–50 KB raw off the initial dashboard load.
- **Effort:** MEDIUM (~90 min).
- **Conflict risk:** **recently_changed: true** (`src/app/dashboard/DashboardContent.tsx` is in `main-changed-files.md`).

---

## 7. Items NOT re-flagged (already fixed since 23-05-26)

- **`@pkmn/dex` in client bundle (VGC-214)** — fixed. Replaced by `dex-subset.json` via `src/lib/data/dex-subset.ts`. No client chunk contains `learnsets`, `Dex.species.all()`, or the index.min.js signature.
- **Changelog data in client bundle** — fixed. `src/app/changelog/page.tsx:34` passes `ENTRIES` to `ChangelogContent` as a prop; the data lives in the RSC layer. Client chunk for the changelog body went from 96 KB → 16 KB (confirmed by `0znjfc82_q3eo.js` size).
- **`html2canvas-pro` duplicate chunks** — fixed. Only one html2canvas-pro chunk now (`0i4g9_wngqb2c.js`, 226 KB). Both `TeamCardExport.tsx` and `OTSSheetModal.tsx` use `getHtml2Canvas()` from `src/lib/dynamic-imports/html2canvas.ts`. The 198 KB `10-qc793i1~os.js` chunk is jsPDF's *internal* bundled html2canvas (loaded only when jsPDF is loaded for PDF export) — not a duplicate of our html2canvas-pro path.

---

## 8. Conflict-risk overlap with `main-changed-files.md`

| Finding | Touches recently-changed file? |
|---------|-------------------------------|
| #1 (dex-subset dedup)          | **YES — high**: `pkmn-dex-fallback.ts`, `dex-subset.ts`, `dex-subset.json`, `InlinePokemonEditor.tsx` all in list |
| #2 (page.tsx RSC split)        | **YES — high**: `page.tsx` itself, plus most of its deps |
| #3 (motion lazy/CSS)           | YES (4 of 12 sites): `PasteInput.tsx`, `ExploreFilters.tsx`, `ReportCard.tsx`, `ChangelogContent.tsx` |
| #4 (Navbar dynamic imports)    | YES: `Navbar.tsx`, `VersionHistoryPanel.tsx`, `NotificationBell.tsx` |
| #5 (PokemonDetailSlide split)  | YES (NEW): `PokemonDetailSlide.tsx` now in `main-changed-files.md` (was not in prior audit) |
| #6 (qrcode dedup)              | YES: both `OTSSheetModal.tsx` and `TeamOverview.tsx` |
| #7 (Dashboard tab split)       | YES: `DashboardContent.tsx` |

Every single finding overlaps with recently-changed files. The safest order is **#6 → #4 → #1 → #5 → #3 → #7 → #2** (trivial dedup first, biggest refactor last).

---

## 9. Build warnings / build-time noise

Still seeing the `Failed to fetch teams for <species>: No database connection string` errors during SSG of `/champions/[pokemon]` (102 paths attempted, every one fails the DB call). Same as prior audit — not a perf finding for the runtime bundle, but each failed call adds latency to the local build and risks misleading `npm run build` exit-code interpretation. Worth a follow-up: either inject `DATABASE_URL` into the build env, or guard `generateStaticParams` to skip the DB call when the URL is missing and rely on ISR.

---

## 10. Summary numbers (deltas from 23-05-26)

| metric                                  | 23-05-26       | 31-05-26      | delta            |
|-----------------------------------------|---------------:|--------------:|-----------------:|
| `.next/static/chunks/` total            | ~10 MB         | **4.8 MB**    | **−52%**          |
| `/` total JS (raw)                      | ~3.8 MB        | **~2.2 MB**   | **−42%**          |
| `/compare` total JS (raw)               | ~3.0 MB        | **~1.4 MB**   | **−53%**          |
| `@pkmn/dex` in client                   | 1.84 MB raw    | **0**         | gone              |
| `html2canvas-pro` chunks                | 2 (418 + 226)  | **1 (226)**   | dedup'd           |
| Changelog client chunk                  | 96 KB          | **16 KB**     | RSC-extracted     |
| Largest single client chunk             | 3.1 MB (learnsets) | **485 KB** (home app) | −85% |

Major progress in the last 8 days. The remaining wins are smaller and more surgical — the biggest single remaining issue is the 340 KB `dex-subset` per-route duplication.
