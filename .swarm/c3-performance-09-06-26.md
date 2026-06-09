# C3 Performance & Bundle Audit — 2026-06-09

Scope: Next.js 16.2.6 + React 19.2 + Turbopack production build.
Build ran successfully (no production errors that abort the build — only non-fatal `Failed to fetch teams for <mega>` warnings during static catalogue prefetch because no DB connection string is set locally).

---

## 1. Build output summary

**Important caveat:** the Next.js 16 + Turbopack production build no longer emits the classic per-route `Size / First Load JS` table to stdout (it only prints the route list with Revalidate / Expire columns). I therefore reconstructed sizes from `.next/static/chunks/` chunk weights, `.next/server/app/*.html` weights, and per-page chunk references.

### Route count
- 1 static `/` (Home)
- 60+ `/champions/[pokemon]` SSG slugs
- 10 static prerendered routes (`/changelog`, `/explore`, `/compare`, `/dashboard`, `/champions`, `/faq`, `/tournaments`, `/privacy`, `/terms`, `/feedback`)
- 50+ dynamic API + serverless routes (`ƒ`)

### Largest client chunks (.next/static/chunks/)
| Chunk | Raw size | Likely owner (by content / import graph) |
|-------|----------|------------------------------------------|
| `085i3dn7oy7w2.js` | **480 KB** | Top-level app shared chunk (Clerk + React + framework) |
| `0xr012s5lag5a.js` | **418 KB** | Likely `/` route (page.tsx, useHomePage, TeamReport tree) |
| `0xpwnv1i16rc1.js` | **341 KB** | Likely dashboard or share/`/s/[id]` |
| `0eeqwi5zjfw3a.js` | **341 KB** | Likely dashboard sibling chunk |
| `0i4g9_wngqb2c.js` | **226 KB** | Likely TeamReport secondary chunk |
| `0rwwge57xnfls.js` | **203 KB** (rootMainFile) | App shell — loaded on every route |
| `10-qc793i1~os.js` | **198 KB** | Heavy single component bundle |
| `02zw10s43j3wt.js` | **197 KB** | — |
| `07gylk333xlq7.js` | **178 KB** | — |
| `0~xd_i9~wueao.css` | **165 KB** | Tailwind v4 global stylesheet |
| `13zgg7no95fse.js` | **158 KB** | — |
| `069~_h90gxh59.js` | **118 KB** | — |
| `03~yq9q893hmn.js` | **112 KB** | Polyfills |
| `177mnb8q87imr.js` | **106 KB** | — |
| `0olrhrf~aymwr.js` | **97 KB** | — |
| `13wvg2qsv5791.js` | **96 KB** (rootMainFile) | App shell |
| `0ma1ilrbq-5.i.js` | **84 KB** | — |

Total `.next/static/chunks/` weight: **4.8 MB raw** (unminified-after-turbopack-mangle figures — gzipped will be ~25-30 % of that).

### Largest static HTML emitted (`.next/server/app/*.html`)
| Route | HTML size |
|-------|-----------|
| `/changelog` | **436 KB** (still the biggest static page on disk despite recent server-component refactor) |
| `/champions` | 140 KB |
| `/faq` | 80 KB |
| `/explore` | 76 KB |
| `/tournaments` | 64 KB |
| `/privacy` | 60 KB |
| `/dashboard` | 56 KB |
| `/terms` | 48 KB |
| `/compare` | 40 KB |
| `/` | 36 KB |
| `/feedback` | 32 KB |

The 5 heaviest **client** routes (by chunks referenced, eager JS, and static HTML combined) are:
1. `/` — Home (paste + TeamReport + Navbar + 8 dynamic modals)
2. `/dashboard` — 1219-line single-file with 8 tabs eagerly bundled
3. `/s/[id]` — same TeamReport graph as Home but ƒ-rendered
4. `/champions` — eagerly loads MetaSnapshot + full mega catalogue helper
5. `/changelog` — biggest static HTML on disk

---

## 2. Top 5 heaviest client components

| Rank | Path (absolute) | Lines | What it does | Optimisation |
|------|------|------|------|------|
| 1 | `/home/user/VGC-Team-Report/src/app/dashboard/DashboardContent.tsx` | **1219** | 8-tab dashboard: drafts/reports/saved/feed/collab/collections/analytics/trash. Every tab's UI (incl. `AnalyticsPanel` with chart, `CollectionsPanel`, `MatchTracker`, four card subtypes) is bundled into one client component. | Split tabs into separate dynamic imports. `AnalyticsPanel`, `CollectionsPanel`, `TrashReportCard`, `CollabReportCard`, and especially `MatchTracker` (518 lines, only used inside dashboard) should be `next/dynamic` with `ssr:false` and loaded on tab activation. |
| 2 | `/home/user/VGC-Team-Report/src/components/report/PokemonDetailSlide.tsx` | **963** | Per-Pokémon slide w/ stats, EV/IV calculator, calc input, mega toggle. Pulls `lib/data/pokemon.ts` (3330 lines) + `champions-dex`, `mega-pokemon`, `stat-calculator`. | Static metadata blocks (`STAT_COLORS`, `CATEGORY_CONFIG`) are duplicated across slides — already minor. Larger wins: extract `lookupPokemon` mega-detect heavy path to a child island lazy-loaded only when the user opens the mega toggle, and trim the static `POKEMON_DATA` import: many fields in pokemon.ts (3.3k lines) are only consumed in 1-2 places — most slides only need name/types/stats/abilities. A `dex-subset`-style trim for the client (matching what was already done for `@pkmn/dex`) would help. |
| 3 | `/home/user/VGC-Team-Report/src/components/ui/ShareModal.tsx` | **933** | Share sheet with paste copy, QR, rental code, visibility toggle, comments toggle. Already lazy-loaded from `page.tsx`. | Already dynamic — but it also pulls `TeamCardExport.tsx` (395 lines, html2canvas). Split TeamCardExport behind a second tier of dynamic import that fires only when the user clicks the "Download card" tab inside the modal. |
| 4 | `/home/user/VGC-Team-Report/src/components/layout/Navbar.tsx` | **890** | Top nav + slide picker + theme menu + gen picker + share button + version-history button. Statically imports `VersionHistoryPanel` (379 lines) which is only ever opened from a click. | `VersionHistoryPanel` is rendered conditionally (`canShowVersionHistory`) but the *module* is statically imported on every route the Navbar appears (basically every page). Convert to `next/dynamic` with no SSR — the panel only renders after a user click on the save-status pill. |
| 5 | `/home/user/VGC-Team-Report/src/components/report/TeamOverview.tsx` | **850** | First slide of a report. Uses `parseShowdownPaste`, multi-import detect, validates champions legality, draws QR for rental code (qrcode already dynamic). | Move `validateChampionsTeam` and `multi-import` detection to a server action / route — both are pure functions of the paste and don't need to ship to the client until the user clicks "Validate". The `LongPressWrapper` helper component (50 lines) is duplicated logic from other slides; deduping it removes weight without changing behaviour. |

---

## 3. Heavy npm dependencies

| Package | node_modules size | How it ships | Risk / opportunity |
|---|---|---|---|
| `posthog-js` | **55 MB** disk (much smaller bundled) | Already lazy-loaded via `requestIdleCallback` in `PostHogProvider.tsx`. Good. | Verify only `posthog-js` core (not `posthog-js/react`) is in the critical chunk. Currently both are dynamically imported together — could split so only the React provider waits on idle and the core lib loads on first capture. |
| `@pkmn/dex` | **52 MB** disk (~1.8 MB raw / 350 KB gz) | Already replaced on client by `dex-subset.json` (~324 KB raw / ~47 KB gz). Server still uses full lib. | No client-side action needed; existing extraction is correct. |
| `jspdf` | **29 MB** disk (~270 KB gz) | Lazy-loaded only when user runs PDF export (`src/lib/utils/export-report.ts`). | OK. |
| `html2canvas-pro` | **6.1 MB** disk | Singleton dynamic import (`src/lib/dynamic-imports/html2canvas.ts`). | OK. |
| `zod` | 6.2 MB disk | Used by API routes for input validation and by client (`useShareUrl`, share codec). v4 of zod is much heavier — verify the *client*-reachable graph only imports the small surface. A grep would reveal whether the whole package or just `z.object`/`z.string` shape is imported. | Audit client-side `zod` usage; for hot client paths (`url-codec`), consider a hand-rolled validator (~2 KB) and keep zod server-side only. |
| `@sentry/nextjs` | **3.8 MB** disk | `sentry.client.config.ts` initialises Sentry on every page load with replay-on-error enabled. | Sentry replay adds ~50 KB gz on top of the SDK. Consider: only enable replay for authenticated users, or gate Sentry init behind `requestIdleCallback` like PostHog. Currently Sentry is in the synchronous client config and ships in the rootMainFiles graph. |
| `@clerk/nextjs` | 2.6 MB disk | `ClerkProvider` wraps the whole app. The Clerk JS shell is ~80–100 KB gz on initial load. | Unavoidable for auth, but `@clerk/nextjs` v7 supports `<ClerkProvider dynamic>` — not currently used. Verify whether moving Clerk pieces (e.g. `UserButton`, `SignInButton`) to dynamic imports on routes that don't need them (e.g. `/changelog`, `/terms`, `/privacy`, `/faq`) gives wins. |
| `motion` | 728 KB disk (~30 KB gz with `optimizePackageImports`) | `optimizePackageImports: ["motion/react"]` is set in `next.config.ts` — good. | 12 files import `motion/react`; this is fine given the tree-shaking config. |
| `vanilla-cookieconsent` | 196 KB disk | Used by `CookieBanner.tsx`. Loaded on every page in the root layout. | Could be dynamic-import-on-mount inside `CookieBanner` — banner doesn't need to be on the critical path. |
| `@microsoft/clarity` | 36 KB | `ClarityProvider` calls `Clarity.init(id)` in a `useEffect`. The 36 KB stub is fine; Clarity then loads its real script async from clarity.ms. | OK. |
| `qrcode` | 260 KB disk | Already lazy-loaded via `import("qrcode")` in `TeamOverview.tsx` and `OTSSheetModal.tsx`. | OK. |

---

## 4. `next/dynamic` lazy-load opportunities

Specific component → trigger condition:

| Component | Path (absolute) | Current state | Recommended trigger |
|---|---|---|---|
| `TournamentMode` (400 lines) | `/home/user/VGC-Team-Report/src/components/report/TournamentMode.tsx` | Statically imported in `src/app/page.tsx` line 12; rendered only when `tournamentMode === true` (off by default). | `dynamic(() => import("@/components/report/TournamentMode"), { loading: () => <SkeletonTournament /> })` — fires on first toggle of tournament mode. |
| `WalkthroughOverlay` (353 lines) | `/home/user/VGC-Team-Report/src/components/ui/WalkthroughOverlay.tsx` | Statically imported in `src/app/page.tsx` line 14; rendered only when `walkthroughActive`. | Walkthrough only triggers via explicit user action or first-visit flag — perfect dynamic candidate with `{ ssr: false }`. |
| `VersionHistoryPanel` (379 lines) | `/home/user/VGC-Team-Report/src/components/social/VersionHistoryPanel.tsx` | Statically imported in `src/components/layout/Navbar.tsx` line 12; only rendered after the user clicks the autosave pill. | Convert to dynamic; trigger is `setVersionPanelOpen(true)`. Saves ~10-15 KB gz from every Navbar-bearing route. |
| `MatchTracker` (518 lines) | `/home/user/VGC-Team-Report/src/components/match-tracker/MatchTracker.tsx` | Statically imported in `DashboardContent.tsx` line 10; renders only below the fold at the bottom of every dashboard view. | Dynamic import with intersection-observer trigger or simply `{ loading: () => <Skeleton /> }` — below-the-fold means TTI improves immediately. |
| `AnalyticsPanel` + `CollectionsPanel` | `/home/user/VGC-Team-Report/src/app/dashboard/DashboardContent.tsx` (inline, lines 915 & 1020) | Currently inlined in the same 1219-line file. | Extract to their own files and `next/dynamic` them on tab activation (`tab === "analytics"` / `tab === "collections"`). Largest single-file split possible in the repo. |
| `MetaSnapshot` (189 lines) | `/home/user/VGC-Team-Report/src/components/champions/MetaSnapshot.tsx` | Statically imported in `src/app/champions/ChampionsContent.tsx`. Rendered below the hero. | If `MetaSnapshot` fetches client-side, `next/dynamic` it with a skeleton — improves LCP on `/champions`. |
| `InlinePokemonEditor` (230 lines) | `/home/user/VGC-Team-Report/src/components/report/InlinePokemonEditor.tsx` | Already dynamically imported by `PokemonCard.tsx` line 14. | OK. |
| `WhatsNewModal` | `/home/user/VGC-Team-Report/src/components/ui/WhatsNewModal.tsx` | Already dynamic in `PasteInput.tsx`. | OK. |
| `ExploreFilters` (719 lines, includes inline icons + lists) | `/home/user/VGC-Team-Report/src/components/explore/ExploreFilters.tsx` | Statically imported by `ExploreContent.tsx`; visible above the fold. | Cannot fully lazy-load (it's above the fold), but the expanded filter chips (`AnimatePresence` section, line 6) could be lazy — only mounted when user opens "More filters". |
| `CommentSection` | already dynamic in page.tsx | OK | OK |
| `CollaboratorPanel`, `EditChangelog`, `DiffNavigator`, `OTSSheetModal`, `PrintableReport`, `ShareModal`, `DoubleTapLikeOverlay` | already dynamic in page.tsx | OK | OK |

---

## 5. Missing `loading.tsx` / suspense / skeletons

Existing `loading.tsx` files:
- `src/app/dashboard/loading.tsx` (good skeleton — 8 cards, tab bar, header)
- `src/app/explore/loading.tsx` (good skeleton — 6 report cards)
- `src/app/s/[id]/loading.tsx` (verified to exist)

**Missing** (and reasonable to add given the route's content / fetch shape):

| Route | Why a `loading.tsx` would help |
|---|---|
| `/champions` | The page fetches client-side via `MetaSnapshot` and renders 60+ mega cards above the fold; a skeleton would reduce CLS while the data arrives. |
| `/changelog` | The static HTML is 436 KB — a streaming skeleton would unblock paint while React hydrates the long timeline. |
| `/compare` | Fully client side, no skeleton. |
| `/tournaments` | Static, but the content is long and could benefit from a header skeleton. |
| `/creator/[name]` | Dynamic (`ƒ`) and fetches creator + reports; no loading state. |
| `/dashboard/profile`, `/dashboard/privacy`, `/dashboard/notifications` | Each is its own segment under `/dashboard`. The parent `loading.tsx` does not cascade once a child segment is matched, so each needs its own. |
| `/notifications` (top-level) | Fully dynamic, no skeleton. |
| `/embed/[id]` | Public embed shown in iframes — a skeleton avoids the blank-iframe flash. |

**Missing Suspense boundaries inside heavy components:**
- `src/app/page.tsx` only wraps the top-level `HomeContent` in `<Suspense>` (line 79). No Suspense boundary around the `TeamReport` / `TournamentMode` swap (page.tsx line 1128) — when `tournamentMode` first turns on, the dynamically loaded `TournamentMode` chunk will blank the slide area instead of showing a skeleton.
- `src/app/dashboard/DashboardContent.tsx` uses a spinner only — no per-tab Suspense. If tabs are dynamic-imported (per recommendation 4), wrap each tab body in `<Suspense fallback={<TabSkeleton />}>`.
- `ExploreContent.tsx` skeletons report cards directly with inline JSX — good, but the `SpotlightSection` (line 124) is statically imported and shown above the fold with no skeleton.

---

## Notes

- The build emits ~30 `Failed to fetch teams for <mega>` warnings during static generation. These are local-env-only (no `DATABASE_URL`) and don't affect the bundle audit, but on Vercel they would also surface unless the static catalogue is given a fallback path.
- Tailwind v4 ships a single 165 KB CSS chunk — within expected for the design surface. No PurgeCSS issue visible.
- The `rootMainFiles` array in `build-manifest.json` references 8 chunks totalling ~700 KB raw — these load on every page. Cutting Sentry replay and the eager `vanilla-cookieconsent` from this graph is the highest-impact universal win.
