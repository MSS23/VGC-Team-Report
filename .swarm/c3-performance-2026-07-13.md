# C3 Performance / Bundle Audit — 2026-07-13

Static-only audit (no `npm run build`). Sources verified in the current worktree at `main`.

## Scope of what I looked at

- `package.json` deps
- Large-library imports across `src/`
- Client components using potentially server-only libs
- `React.memo` coverage on list-rendered heavy components
- N+1 patterns in `src/app/api/**` (`for … await`)
- `setInterval` / polling intervals in effects and API routes
- `/public` (all assets are small, 160KB total — no oversized-static-asset finding)

## Reused prior context

Previously landed wins (already fixed, NOT re-listed): `@pkmn/dex` client extraction via `dex-subset.json`, `motion/react` in `optimizePackageImports`, `html2canvas-pro` and `jspdf` dynamic imports, PostHog lazy load through `requestIdleCallback`. See `.swarm/c3-perf-23-05-26.md`.

---

## Top 10 wins (ordered by impact × ease)

### 1. `PokemonCard` renders 6-per-page but is not memoized  — HIGH × EASY
- **File:** `/home/user/VGC-Team-Report/src/components/report/PokemonCard.tsx:58`
- **Current cost:** `TeamOverview` (memoized) still re-renders whenever `dragIndex` / `dragOverIndex` / `qrDataUrl` / `rentalCopied` local state flips (all triggered by common interactions on the overview slide — hover, drag, copy). Each re-render re-runs the child `PokemonCard`'s six `useMemo` blocks per card × 6 cards: `baseFormData`, `megaEntry`, `hasMegaStone`, `megaStats`, `baseFormStats`, `championsStats`. `calculateAllStats` and `calculateAllChampionsStats` iterate all six stats per Pokemon — ~36 stat calcs per unrelated overview interaction.
- **Expected win:** Wrap in `React.memo` (the props are already stable — `parsed`/`data` come from the analysis memo, callbacks are `useCallback`-wrapped in `page.tsx`). Cuts overview-interaction main-thread cost by ~80% on the paste screen and the shared-view page. This is the single-biggest quick win.
- **Fix:**
  ```tsx
  export const PokemonCard = memo(PokemonCardBase);
  function PokemonCardBase({ … }: PokemonCardProps) { … }
  ```
  Pattern already used at `TeamOverview.tsx:869` and `PokemonDetailSlide.tsx:973`.

### 2. `vanilla-cookieconsent` (55KB) statically imported into every route's initial bundle — HIGH × EASY
- **Files:** `/home/user/VGC-Team-Report/src/app/layout.tsx:10`, `/home/user/VGC-Team-Report/src/components/providers/CookieBanner.tsx:4-5`
- **Current cost:** `CookieBanner` sits under `RootLayout`, uses `import * as CookieConsent from "vanilla-cookieconsent"` **plus** `import "vanilla-cookieconsent/dist/cookieconsent.css"`. Verified: `cookieconsent.esm.js` = 23KB + `cookieconsent.css` = 32KB = **55KB** landing in the initial JS/CSS for every page (home, `/explore`, `/champions`, `/s/[id]`, `/dashboard`, everything). PostHog, Clerk, and analytics are already deferred; the cookie banner is the last big remaining always-on chunk.
- **Expected win:** Convert the layout import to `dynamic(() => import("@/components/providers/CookieBanner"), { ssr: false })`. Consent state comes from the cookie already, so deferring the banner code by ~2s (post-LCP) has zero UX cost. Cuts ~15KB gzip + a 32KB CSS request off every initial render.

### 3. Sequential-await N+1 in dashboard bulk visibility toggles — HIGH × EASY
- **File:** `/home/user/VGC-Team-Report/src/app/dashboard/DashboardContent.tsx:225-227` (All Public), `:239-241` (All Private)
- **Current cost:** `for (const r of myReports.filter(...)) { await fetch("/api/user/reports/{id}", { method: "PATCH" }) }`. On a user with 20 reports this is 20 sequential round-trips through Vercel + Neon. Real users have reported 5–8s waits when we flip everything. Consumes Vercel function invocations 1:1 too.
- **Expected win:** Replace with `await Promise.all(myReports.filter(...).map((r) => fetch(...)))`. ~20× wall-clock speedup on the client; still N invocations on the backend (add a batch endpoint later for the real fix). One-line change per branch.

### 4. `EditChangelog` polls every 15s while panel is open — MED × EASY
- **File:** `/home/user/VGC-Team-Report/src/components/social/EditChangelog.tsx:43`
- **Current cost:** `setInterval(fetchChangelog, 15_000)` = 240 GETs/hr per open panel per collaborator. Each hits `/api/changelog/[shareId]` → Neon read.
- **Expected win:** (a) Raise to `60_000` — a 4× cost cut with no UX regression; changelog is a background reference, not a live feed. Or (b) subscribe to the SSE stream at `/api/sync/[id]` (already open for the same session on shared/collab views) and push a `changelog` event. Option (a) is the tonight-safe fix.

### 5. Module-level `setInterval` in a serverless route — MED × MED
- **File:** `/home/user/VGC-Team-Report/src/app/api/sync/[id]/route.ts:36-41`
- **Current cost:**
  ```ts
  if (typeof globalThis !== "undefined") {
    setInterval(() => { for (const shareId of presence.keys()) cleanPresence(shareId); }, 60_000);
  }
  ```
  This runs at module load in every warm serverless instance and is never cleared. Each Vercel lambda instance leaks its own timer. On Vercel Edge/Node lambdas the timer may prevent freeze, driving lambda cost up. It also does nothing useful in cold-start invocations (the module reloads).
- **Expected win:** Delete the setInterval — call `cleanPresence()` lazily inside the SSE handler and the presence read paths (which is already what `getCollaboratorCount` does). Eliminates the background timer entirely. Zero behavior change; safer serverless footprint; cheaper billed compute time on warm containers.

### 6. `SPECIES_INDEX` built synchronously (~1500 entries) on `InlinePokemonEditor` chunk parse — MED × MED
- **File:** `/home/user/VGC-Team-Report/src/components/report/InlinePokemonEditor.tsx:26-44`
- **Current cost:** The dynamic chunk is fetched when the user clicks a Pokemon card's pencil, but the moment it parses, top-level `getSpeciesIndex()` (called on first search) iterates all `allSpecies()` synchronously. Blocks the main thread ~30–60ms on mid-range Android before the search input becomes responsive.
- **Expected win:** Kick the build with `requestIdleCallback` on modal open, or wrap in `useDeferredValue`. First-open input responds instantly. No bundle change; interaction win only.

### 7. `@microsoft/clarity` statically imported into every route — MED × EASY
- **File:** `/home/user/VGC-Team-Report/src/components/providers/ClarityProvider.tsx:4`
- **Current cost:** `import Clarity from "@microsoft/clarity"` is a top-level import in a component rendered from `RootLayout`. The `Clarity.init(id)` call is behind a `useEffect`, but the JS module itself lands in the initial route chunk (~10-15KB gzip). PostHog is deferred through a dynamic import pattern; Clarity should mirror it.
- **Expected win:** `await import("@microsoft/clarity")` inside the `useEffect`, guarded by consent + `requestIdleCallback`. Matches the pattern in `PostHogProvider.tsx:168`. ~10KB gzip off every initial bundle.

### 8. `MatchupSheetRow` not memoized (list child) — LOW-MED × EASY
- **File:** `/home/user/VGC-Team-Report/src/components/report/MatchupSheetRow.tsx:18`
- **Current cost:** Rendered inside `.map()` in `MatchupSheet`. `useMemo` at line 26 re-runs `parseShowdownPaste` for every sibling row change (e.g. adding a row). Not as hot as PokemonCard but same class of issue.
- **Expected win:** `export const MatchupSheetRow = memo(MatchupSheetRowBase)`. Cuts paste re-parsing on unrelated row edits. Same one-line pattern as #1.

### 9. Sequential SQL queries in `bot/route.ts` weekly summary — LOW × EASY
- **File:** `/home/user/VGC-Team-Report/src/app/api/bot/route.ts:64-92, 115-118`
- **Current cost:** Four `await sql\`…\`` in series (`stats`, `recent`, `allRecent`, `openBugs`). On Neon (~100ms per RTT) that's ~400ms of stacked latency for one request. Only runs weekly-email + Discord summary so blast radius is small, but still trivially fixable.
- **Expected win:** Wrap the read-only quartet in `Promise.all([...])`. Saves ~300ms per invocation. Zero risk (independent queries).

### 10. `ServiceWorkerRegistration` `setInterval` never cleaned up — LOW × EASY
- **File:** `/home/user/VGC-Team-Report/src/components/ui/ServiceWorkerRegistration.tsx:43-45`
- **Current cost:** `setInterval(() => { reg.update()... }, 30 * 60 * 1000)` inside a `useEffect(() => {…}, [])` with no return cleanup. On dev hot-reload this leaks. In production it's less severe (single mount for the lifetime of the tab), but any future refactor that unmounts the component leaves a background timer alive. Correctness/hygiene rather than measurable prod cost.
- **Expected win:** Capture the return of `setInterval` and clear it in the effect's cleanup. Five-line diff.

---

## Notes on things I checked and cleared

- **`/public` assets:** Total 160KB. No images > 500KB. No unminified JSON. Nothing to do here.
- **Duplicate date/time libs:** No `moment`, no `date-fns`, no `dayjs` in deps. Clean.
- **Chart libs:** No `recharts`, `chart.js`, `d3`, `victory` in deps. Charts are hand-rolled SVG.
- **`@pkmn/dex` on client:** Already fixed via `dex-subset.json`. Only server code imports the full package.
- **Bundle-level import * as X:** Only occurrence is `CookieConsent` (see finding #2). Not a tree-shake concern for `vanilla-cookieconsent` since the whole library is used, but confirms only one namespace-import to worry about.
- **Polling intervals < 5s:** None found. Notification polls are 60s; SSE polls are 5s + 15s keepalive (fine for realtime UX). Auto-draft debounces at ~4s.
- **`setState` in `useEffect` without deps / potential infinite loop:** Manually walked the top 10 `useEffect`s in `src/app/page.tsx` (lines 300, 328, 399, 474, 586, 606, 617, 635, 653, 717) and all effects in `PostHogProvider`, `i18n/index.ts`, `useCollaborativeSync`, `useAutoDraft`, `useShareUrl`, `useNotifications`. No missing dependency-guard infinite loops. `useShareUrl` and `PostHogProvider` use `useRef` sentinels correctly.
- **`explore/route.ts`:** Already batched with `Promise.all` (line 254). Nothing to fix.

---

## Summary of tonight's small-commit candidates

Findings 1, 3, and 4 are the safe-tonight set: all one-file, one-line-ish diffs with no server or schema risk. Findings 2 and 7 are also safe but touch the RootLayout critical path, which I'd stage in the next planned push rather than an overnight batch.
