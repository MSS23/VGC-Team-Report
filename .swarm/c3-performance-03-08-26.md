# C3 — Bundle & Performance Analysis (03-08-26)

Source: existing production build in `.next/` (Next.js 16.2.6, Turbopack, BUILD_ID from 03 Aug 00:14). **No rebuild was run.**
Primary evidence: `.next/diagnostics/route-bundle-stats.json` (Next 16 emits real first-load bytes per route), plus per-chunk gzip measured directly.

All "raw" numbers are uncompressed bytes; "gz" is gzip -6, which is what users actually download.

---

## 1. Route bundles — 5 largest

| # | Route | First-load raw | First-load gz | Chunks |
|---|-------|---------------:|--------------:|-------:|
| 1 | `/` | **2188.2 kB** | **564.1 kB** | 26 |
| 2 | `/compare` | 1332.2 kB | 326.3 kB | 21 |
| 3 | `/dashboard` | 1039.2 kB | 305.7 kB | 22 |
| 4 | `/dashboard/profile` | 998.7 kB | 298.4 kB | 21 |
| 5 | `/explore` | 940.6 kB | 279.3 kB | 20 |
| — | *shared baseline* (`/_not-found`) | 761.3 kB | 225.7 kB | 18 |

The shared baseline (761.3 kB raw / 225.7 kB gz) is on **every** route and is essentially framework:

| Chunk | raw | gz | Contents |
|-------|----:|---:|----------|
| `110q6k5sdl4es.js` | 198.6 kB | 62.5 kB | React 19 DOM |
| `0e.0b65iyn233.js` | 107.2 kB | 28.3 kB | Next app-router client runtime |
| `0ejooygj7pzhu.js` | 104.5 kB | 30.3 kB | **Clerk** (`ClerkContextProvider`, `CLERK_PUBLISHABLE_KEY`) |
| `0mu1qslb0zv9i.js` | 43.8 kB | — | Next server-action/bailout runtime |
| others (14) | ~307 kB | — | Next router, redirect, fonts, misc |

`/` is a **1426.8 kB raw outlier above baseline** — 2.9× the next-worst route's delta. That is where essentially all the win is.

### `/` route-specific chunks (the 1426.8 kB)

| Chunk | raw | gz | What it actually is | On other routes? |
|-------|----:|---:|---------------------|------------------|
| `0p-3laet_uvan.js` | 448.9 kB | 110.8 kB | page.tsx + hooks + Navbar + **zod (223.9 kB raw / 50.4 kB gz)** | `/` only |
| `0jy8.5bkrccrl.js` | 330.3 kB | 48.3 kB | **`dex-subset.json`** (species/sprites/mega stones) | `/` only |
| `0e8f0z_59jdmt.js` | 194.0 kB | 40.2 kB | `lib/data/pokemon.ts` | `/`, `/compare` |
| `0jp4wd~ym17xz.js` | 115.4 kB | 37.8 kB | **`motion`** (framerAppearId, projectionUpdate) | 8 routes |
| `00r8djwday8ue.js` | 111.1 kB | 46.4 kB | **`lib/data/move-names.ts`** (6-language move table) | `/` only |
| `0rdt08mg0kz_k.js` | 98.7 kB | 24.9 kB | report UI components | `/` only |
| `00l3bqks93ibj.js` | 74.4 kB | 19.2 kB | `lib/data/mega-pokemon.ts` | `/` only |
| `0f9~ye~49xvi..js` | 54.0 kB | 10.0 kB | `lib/data/moves.ts` | `/` only |

**Headline: ~57% of the home route's route-specific JS is data tables and one server-shaped validation library, not UI code.**

---

## 2. Largest client components

112 files carry `"use client"`. Ranked by source size and by what they drag into the graph:

| # | File | Source | Pulls in (transitive, eager) |
|---|------|-------:|------------------------------|
| 1 | `src/app/page.tsx` | 79.3 kB | root of the whole `/` graph; `mega-detect` → **dex-subset.json 330 kB**; Navbar; TeamReport; 8 `dynamic()` already in place |
| 2 | `src/app/dashboard/DashboardContent.tsx` | 57.2 kB | Clerk, motion |
| 3 | `src/components/layout/Navbar.tsx` | 49.1 kB | Clerk `useAuth`, icons; static-imported by page.tsx *and* mounted via PersistentNavbar in layout |
| 4 | `src/components/ui/ShareModal.tsx` | 45.5 kB | already `dynamic()`-loaded from page.tsx |
| 5 | `src/components/report/PokemonDetailSlide.tsx` | 42.0 kB | `pokemon.ts` (194 kB) + `moves.ts` (54 kB) + `move-names.ts` (111 kB) + `mega-detect` → dex-subset |
| 6 | `src/hooks/useHomePage.ts` | 41.5 kB | orchestrates the entire home state machine |
| 7 | `src/components/report/TeamOverview.tsx` | 39.6 kB | lazy `qrcode` (good) |
| 8 | `src/components/report/SpeedTierChart.tsx` | 34.0 kB | `pokemon.ts`, `mega-pokemon.ts` |

`PokemonCard.tsx` (30.1 kB) is the single worst *aggregator*: it eagerly imports `pokemon.ts`, `move-type-style` → `moves.ts`, `stat-relevance` → `moves.ts`, `translate-move` → `move-names.ts`, and `mega-detect` → `mega-pokemon.ts` + `dex-subset.json`. It renders 6× on the home route.

---

## 3. Oversized npm dependencies — client shipping status

| Package | Status | Evidence | Client cost |
|---------|--------|----------|-------------|
| `jspdf` | ✅ **Lazy** | `lib/utils/export-report.ts:5` `await import("jspdf")` | 0 kB first-load |
| `html2canvas-pro` | ✅ **Lazy** | `lib/dynamic-imports/html2canvas.ts` singleton promise wrapper; both call sites use it | 0 kB first-load |
| `qrcode` | ✅ **Lazy** | `OTSSheetModal.tsx:95` and `TeamOverview.tsx:401` both `import("qrcode").then(...)` | 0 kB first-load |
| `posthog-js` | ✅ **Lazy** | `PostHogProvider.tsx:168` `Promise.all([import("posthog-js"), import("posthog-js/react")])` behind `requestIdleCallback`; only a `type` import at top level | 0 kB first-load |
| `@pkmn/dex` | ✅ **Not shipped** | Replaced by pre-extracted `dex-subset.json` via `lib/data/dex-subset.ts`; no client file imports `@pkmn/dex` | 0 kB — **but the 330 kB subset that replaced it is eager (see below)** |
| `motion` | ❌ **Static** | `from "motion/react"` in **12 components** incl. `PasteInput.tsx` (home route) | **115.4 kB raw / 37.8 kB gz on 8 routes** |
| `zod` | ❌ **Static into client** | `lib/sharing/url-codec.ts:1` `import { z } from "zod"` → reached from client hook `useShareUrl.ts:6` | **223.9 kB raw / 50.4 kB gz on `/`** |

### The zod finding (biggest single item)

`zod@4.3.6`'s classic entrypoint pulls the **entire locale table**. Confirmed present in the client chunk — Icelandic (`"ISO dagsetning"`), German (`"E-Mail-Adresse"`), Italian (`"indirizzo IPv6"`), Swedish, Japanese, Korean, Arabic, Urdu, Yoruba, Belarusian, and more. 26 distinct localised IPv6 strings alone.

Measured spans inside `0p-3laet_uvan.js` (442 kB of JS):

- **Non-English locales only: 131.1 kB raw / 26.6 kB gz** — 100% dead weight, the app never sets a zod locale.
- **Full zod (core + JSON-Schema emitter + all locales): 223.9 kB raw / 50.4 kB gz** — *half the chunk*.

The JSON-Schema emitter (`processJSONSchema`, `"Map cannot be represented in JSON Schema"`) is also shipped and never used client-side.

**Why it's there:** the only client *value* import from `url-codec` is `decodeShareState` (`useShareUrl.ts:6`), called only when a `?state=` param exists. `ShareableStateSchema` itself has **zero client references** — it is used solely by `src/app/api/user/drafts/route.ts` (server). So the client is paying 224 kB to validate a URL param on a minority of page loads.

---

## 4. Server Component / eager-data opportunities

**Page-level split is already healthy.** `/explore`, `/changelog`, `/feedback`, `/compare`, `/tournaments` are all thin server `page.tsx` wrappers (1–3 kB, `import type { Metadata }`) delegating to a `*Content.tsx` client component. `faq`/`privacy`/`terms`/`support` are pure server components. `components/seo/JsonLd.tsx` has **no** `"use client"` — already server. There is no low-hanging "unnecessary `use client` at a high level" left.

**The real problem is eager data imports, not the client boundary.** All of `src/lib/data/` is statically imported into the client graph:

| Data file | On disk | Bundled (raw/gz) | Reached from | Actually needed on first paint? |
|-----------|--------:|-----------------:|--------------|--------------------------------|
| `dex-subset.json` | 331.5 kB | 330.3 / 48.3 | `page.tsx:61` → `mega-detect` → `pkmn-dex-fallback` | **No** — it is an explicit *fallback* ("fires only when our static maps miss") |
| `pokemon.ts` | 243.2 kB | 194.0 / 40.2 | `PokemonCard`, `SpeedTierChart`, `useTeamReport` | Yes (static fast path) |
| `move-names.ts` | 129.5 kB | 111.1 / 46.4 | `translate-move` → `PokemonCard` | **No** — `translateMove` returns early for `lang === "en"` |
| `moves.ts` | 82.1 kB | 54.0 / 10.0 | `move-type-style`, `stat-relevance` | Partially |
| `mega-pokemon.ts` | 32.0 kB | 74.4 / 19.2 | `mega-detect` | Yes |
| `pokemon-types-map.ts` | 42.3 kB | 0 | `api/team-graphic` only | Server-only ✅ |

Two are provably unnecessary on first load:

1. **`dex-subset.json` (330 kB / 48.3 kB gz).** Its own docstring says it fires only when the static maps miss. It is dragged into the home first-load by one call — `import { detectMegaFromItem } from "@/lib/utils/mega-detect"` at `page.tsx:61`. `mega-detect.ts` calls `detectMegaFromItemDex` / `getMegaEntryFromDex` only *after* the static `MEGA_STONE_MAP` / `MEGA_BY_KEY` lookups miss.
2. **`move-names.ts` (111 kB / 46.4 kB gz).** `translate-move.ts` builds a 6-language Map at module scope, but `translateMove()` short-circuits on line 1 for English. Note the unusually poor compression ratio (46.4 kB gz from 111 kB raw) — CJK/accented text does not gzip well, so this is disproportionately expensive on the wire.

---

## 5. VGC-162 validation — "Root page.tsx Server Component refactor — reduce client JS by ~200KB"

### Verdict: **the ~200 kB is real and then some, but the proposed mechanism will not deliver it. Reframe the ticket.**

**Refuting the mechanism.** `src/app/page.tsx` cannot meaningfully become a Server Component:

- It is an interactive SPA shell: `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`, plus `useHomePage` (41.5 kB), `useSwipeNavigation`, `useAuth`.
- Static, server-extractable content totals **930 bytes** (`HOW_TO_STEPS`). There is no FAQ data block in the file.
- `FAQPageJsonLd` / `HowToSchema` are already server components (`JsonLd.tsx` has no `"use client"`), so they are already free.
- 8 `dynamic()` calls already offload the heavy conditional UI (ShareModal, CommentSection, PdfExport, OTSSheetModal, CollaboratorPanel, DiffNavigator, EditChangelog, DoubleTapLikeOverlay).

**A Server Component refactor of `page.tsx` yields roughly 1–2 kB, not 200 kB.** Estimate refuted as written.

**Confirming the magnitude.** ~200 kB *is* available on `/` — but from **import-graph fixes requiring zero Server Component work**:

| Fix | raw saved | gz saved |
|-----|----------:|---------:|
| zod off the client path | 223.9 kB | 50.4 kB |
| `dex-subset.json` lazy | 330.3 kB | 48.3 kB |
| `move-names.ts` lazy | 111.1 kB | 46.4 kB |
| **Combined** | **665.3 kB** | **145.1 kB** |

That is **3.3× the ticket's estimate in raw bytes**, and would cut `/` from 2188.2 kB → ~1523 kB raw (564.1 → ~419 kB gz).

**Recommendation:** retitle VGC-162 to *"Home route: move zod, dex-subset and move-names off the eager client graph — 665 kB raw / 145 kB gz"* and drop the Server Component framing entirely.

---

## 6. Ranked wins by (kB saved / effort)

| # | Win | raw | gz | Effort | Notes |
|---|-----|----:|---:|--------|-------|
| 1 | **Lazy-load `url-codec` inside `useShareUrl`** — `decodeShareState` only runs when `?state=` is present, so `await import()` it there. Removes all of zod from `/`. | **223.9 kB** | **50.4 kB** | **Low** | `ShareableStateSchema` has zero client refs; server route keeps its static import. Single-file change. |
| 1b | *Fallback if 1 is unwanted:* pin zod to the English locale (`zod/mini`, or `zod/v4/core` + `en`) | 131.1 kB | 26.6 kB | Low | Kills only the dead locales; keeps core + JSON-Schema emitter shipped. |
| 2 | **Lazy `move-names.ts`** — gate the Map build behind `lang !== "en"` in `translate-move.ts` | 111.1 kB | **46.4 kB** | Low | Best gz-per-effort in the codebase. English users (the vast majority) pay nothing. |
| 3 | **Lazy `dex-subset.json`** — make `pkmn-dex-fallback` resolve via `await import()`; it is already a miss-only path with its own cache | **330.3 kB** | 48.3 kB | Medium | Largest raw win. Needs `lookupPokemonFromDex` / `detectMegaFromItemDex` to go async, or a preload-on-idle warm. Touches `pokemon.ts`, `mega-detect.ts`, and their callers. |
| 4 | **`motion` → `LazyMotion` + `domAnimation`, or CSS transitions** — 12 static importers across 8 routes | 115.4 kB | 37.8 kB | Medium | Cross-route win, not just `/`. Several uses (ExploreEmpty, SpotlightCard, PasteInput) are simple fade/slide that CSS already covers per the UI standards. |
| 5 | **Gate Clerk out of the anonymous baseline** — 104.5 kB on *every* route incl. `/terms`, `/privacy`, `/faq` | 104.5 kB | 30.3 kB | Medium-High | `ClerkProvider` sits in root `layout.tsx`. Static legal/FAQ pages never need auth. Route-group split (`(marketing)` vs `(app)`) would drop it from the static pages. |
| 6 | Split `moves.ts` — `move-type-style` needs only type-per-move; `stat-relevance` needs only category | 54.0 kB | 10.0 kB | Low-Medium | Generate two narrow maps instead of importing full `MOVES`. |
| 7 | Dedupe `Navbar` — statically imported by `page.tsx` *and* mounted via `PersistentNavbar` in layout | ~49 kB src | — | Low | Verify only one instance ships; changelog notes a prior duplicate-navbar bug. |

**If wins 1–4 land: `/` goes 2188.2 kB → ~1407 kB raw (−36%), 564.1 → ~381 kB gz (−32%).**

---

## 7. Confirmed non-issues (do not re-open)

- `jspdf`, `html2canvas-pro`, `qrcode`, `posthog-js` are all correctly lazy. The `html2canvas` singleton wrapper is a good pattern.
- `@pkmn/dex` is not shipped to the client at all; the subset strategy worked.
- `pokemon-types-map.ts` (42 kB) is server-only (`api/team-graphic`).
- Page-level server/client split is already correct across the app; no stray high-level `"use client"`.
- React 19 + Next runtime (~390 kB raw) in the baseline is irreducible.

## 8. Method notes / caveats

- Numbers come from Next 16's own `route-bundle-stats.json` (`firstLoadUncompressedJsBytes`), not an estimate. gzip measured per-chunk with `zlib.gzipSync` (level 6); Vercel serves Brotli, which will be ~15–20% smaller again, but the *relative* ranking is unchanged.
- Chunk→source attribution was done by string fingerprinting (Turbopack strips `[project]/` module paths in production), cross-checked against on-disk source sizes — e.g. `dex-subset.json` 331.5 kB on disk ↔ 330.3 kB chunk. Attribution is high-confidence for the data chunks and for zod; the 448.9 kB app chunk is mixed and only its zod span was measured precisely.
- No build was run; no source files were modified.
