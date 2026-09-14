# C3 — Bundle Size / Performance Report

**Date:** 2026-09-14
**Repo:** `/home/user/VGC-Team-Report` @ `70c4633`
**Stack:** Next.js 16.3.0 (Turbopack, prod build), React 19.2.3
**Build status:** GREEN (`exit code 0`, 119/119 static pages in 1719ms). DB-backed `generateStaticParams` / sitemap logged `No database connection string` warnings (no `DATABASE_URL` in container) — expected, non-fatal, does not affect client bundle output.

---

## 0. Methodology note — the build gives you NOTHING

`npm run build` on Next 16 + Turbopack prints a route table with **only `Revalidate` and `Expire` columns**. There is no `Size` column, no `First Load JS` column, and no `+ First Load JS shared by all` footer. The numbers below were **reconstructed manually**:

- Parsed every `<script src="/_next/static/chunks/*.js">` out of the 119 prerendered HTML files in `.next/server/app/`.
- gzip -9 each referenced chunk, summed per route.
- "Shared by all" = set intersection of chunk lists across all page routes.

This reconstruction is itself the evidence for VGC-269. Scripts used are in the scratchpad, not committed (read-only run).

---

## 1. First Load JS per route (real measured numbers)

`route-only` = First Load JS minus the shared baseline.

| Route | First Load JS (gz) | raw | route-only (gz) | chunks |
|---|---:|---:|---:|---:|
| **`/`** | **341.7 kB** | 1125.1 kB | 175.4 kB | 21 |
| **`/compare`** | **336.0 kB** | 1177.5 kB | 169.7 kB | 21 |
| **`/dashboard`** | **328.3 kB** | 1081.1 kB | 162.0 kB | 21 |
| **`/dashboard/profile`** | **320.8 kB** | 1040.3 kB | 154.5 kB | 20 |
| **`/explore`** | **301.6 kB** | 981.0 kB | 135.3 kB | 19 |
| `/champions/[pokemon]` (72 pages) | 293.3 kB | 942.6 kB | 127.0 kB | 19 |
| `/feedback` | 291.2 kB | 934.5 kB | 124.9 kB | 19 |
| `/changelog` | 290.7 kB | 932.6 kB | 124.4 kB | 19 |
| `/dashboard/privacy` | 276.8 kB | 898.3 kB | 110.5 kB | 19 |
| `/champions` | 262.9 kB | 860.4 kB | 96.6 kB | 18 |
| `/tournaments` | 253.8 kB | 818.9 kB | 87.5 kB | 18 |
| `/tools/ev-to-sp` | 253.0 kB | 815.7 kB | 86.6 kB | 18 |
| `/faq`, `/privacy`, `/support`, `/terms` | 249.8 kB | 805.0 kB | 83.5 kB | 18 |
| `/_not-found` | 248.6 kB | 802.0 kB | 82.3 kB | 17 |
| `/_global-error` | 170.3 kB | 553.4 kB | 4.0 kB | 9 |

### Shared chunk

```
+ First Load JS shared by all   166.3 kB gz  /  538.5 kB raw   (8 chunks)
```

| Chunk | gz | raw | What it is |
|---|---:|---:|---|
| `34wvn5zw0a69w.js` | 63.0 kB | 199.8 kB | react-dom client runtime |
| `0cz1d0mv5g_q7.js` | 38.6 kB | 110.0 kB | **legacy polyfills (core-js)** — served `noModule`, see below |
| `2reak9ew8mz9t.js` | 33.3 kB | 124.4 kB | Next app-router / prefetch runtime |
| `11jq0c2_zavac.js` | 8.3 kB | 31.2 kB | react |
| `37u51_524syek.js` | 8.3 kB | 26.2 kB | react-dom shim |
| `23c5h5wdeds1s.js` | 8.2 kB | 27.0 kB | Next client shared |
| `turbopack-01jibp7rpdi-8.js` | 4.2 kB | 10.7 kB | Turbopack runtime |
| `0oicg-oelefcn.js` | 2.5 kB | 9.4 kB | Next shared |

> **Important correction:** the 38.6 kB polyfill chunk is emitted with the `noModule` attribute, so **modern browsers never download it**. The *effective* shared baseline for a real visitor is **127.7 kB gz**, and every route number above should have 38.6 kB subtracted for modern-browser reality (e.g. `/` is **303.1 kB gz** in practice). Both figures are given because the "166.3 kB" is what a restored bundle analyzer would print.

---

## 2. Ticket verdicts

### VGC-268 — motion eager on 7 routes, 37.8 kB gz → **STILL REAL** ✅ (exact match)

The ticket's numbers are still precisely correct. `motion/react` resolves to chunk `0y3cx1zi-ccxg.js` = **37.4 kB gz / 114.8 kB raw**, and it is in the first-load set of **exactly 7 routes**:

| Route | motion in first load |
|---|---:|
| `/` | 37.4 kB |
| `/dashboard` | 37.4 kB |
| `/champions/[pokemon]` ×72 | 37.4 kB |
| `/feedback` | 37.4 kB |
| `/changelog` | 37.4 kB |
| `/dashboard/profile` | **47.2 kB** (+ `AnimatePresence` chunk `43ba0qx5t7yea.js`) |
| `/explore` | **52.8 kB** (+ `049v0ugl1d4ym.js`, `useReducedMotion`/`AnimatePresence` via `ExploreFilters`) |

12 files statically `import { motion } from "motion/react"`:

```
src/app/champions/[pokemon]/MegaLandingContent.tsx:5
src/app/changelog/ChangelogContent.tsx:4
src/app/dashboard/profile/page.tsx:4          (motion, AnimatePresence)
src/app/feedback/FeedbackContent.tsx:4
src/components/explore/ExploreContent.tsx:4
src/components/explore/ExploreEmpty.tsx:3
src/components/explore/ExploreFilters.tsx:6   (AnimatePresence, motion, useReducedMotion)
src/components/explore/ReportCard.tsx:4
src/components/explore/SpotlightCard.tsx:4
src/components/input/PasteInput.tsx:6
src/components/social/CreatorProfile.tsx:4
src/components/ui/WhatsNewModal.tsx:5
```

`next.config.ts` already sets `experimental.optimizePackageImports: ["motion/react"]` — **this does not help**, because the cost is the `motion.*` component factory + the animation runtime, not unused named exports. Tree-shaking cannot remove it; only deferral can.

**Note for whoever takes this:** `/explore` and `/dashboard/profile` are *worse* than the ticket says (52.8 / 47.2 kB, not 37.8). Worth updating the ticket.

---

### VGC-271 — lazy-load dex-subset fallback → **STILL REAL, but the scope has moved to `/compare`**

The homepage is **fixed** — `/`'s first load contains no full data table (verified: no chunk on `/` has >300 distinct species strings; the biggest app chunk `2x-jhdbql1keu.js` at 42.3 kB is `page.tsx` + `CHAMPIONS_SAMPLE_TEAMS`, 33 species, no `baseStats` table). `src/lib/analysis/analyze-team.ts` carries an explicit guard comment and is import()-ed lazily. Good.

**`/compare` was not fixed and is now the worst data-table offender.** `src/components/compare/CompareContent.tsx` (a `"use client"` component) statically imports:

```ts
import { lookupPokemon } from "@/lib/data/pokemon";         // → pkmn-dex-fallback → dex-subset
import { detectMegaFromItem, isMegaForm } from "@/lib/utils/mega-detect";  // → pkmn-dex-fallback
```

Measured cost in `/compare`'s first load:

| Chunk | gz | raw | Contents |
|---|---:|---:|---|
| `3yv3y7esj_hpn.js` | 37.3 kB | 189.1 kB | `src/lib/data/pokemon.ts` (1,397 distinct species, full `baseStats`) |
| `2s786ain9e09t.js` | 33.2 kB | 128.1 kB | `dex-subset.json` decoder + payload |
| | **70.5 kB** | **317.2 kB** | **eagerly shipped to every `/compare` visitor** |

`/compare` is the **only** route in the app that still eager-loads either table. That makes it the single largest one-route win available.

---

### VGC-269 — no bundle-size visibility since Next 16 + Turbopack → **STILL REAL** ✅

Directly confirmed. The build's route table has only `Revalidate`/`Expire` columns — no `Size`, no `First Load JS`, no shared-chunk footer. `@next/bundle-analyzer` is **not installed** (`node_modules/@next/bundle-analyzer` absent, not in `package.json`). `next.config.ts` has no analyzer wrapper.

This ticket is arguably the **highest-leverage item in the list** — without it, VGC-268/271/162 cannot be verified as fixed after the work lands, and regressions ship silently. The reconstruction method in §0 is a working substitute and could be dropped in as a ~60-line `scripts/bundle-report.mjs` that reads `.next/server/app/**/*.html` post-build. That needs no analyzer dependency and no Webpack, so it survives Turbopack.

---

### VGC-162 — root `page.tsx` Server Component refactor, ~200KB → **STILL REAL** ✅

`src/app/page.tsx` is still line 1 `"use client"` and is **1,833 lines**, with `src/hooks/useHomePage.ts` at another 915. `/` remains the heaviest route in the app at **341.7 kB gz**.

The ticket's "~200KB" is a raw-bytes figure and is in the right ballpark: `/`'s route-only payload is **175.4 kB gz / ~587 kB raw** on top of shared. Partial credit is due — the file already lazy-loads 10+ subtrees via `next/dynamic` (`TeamReport`, `TeamCardCTA`, `TournamentMode`, `SlideNavControls`, `ShareModal`, `CommentSection`, `CollaboratorPanel`, `EditChangelog`, `DiffNavigator`, `DoubleTapLikeOverlay`), which is what killed the data tables on first paint. But the shell itself is still a client component, so `/` pays motion (37.4 kB) + Clerk (56.8 kB) + a 42.3 kB app chunk before anything renders.

---

## 3. Findings not covered by any open ticket

### 3.1 Clerk ships 56.8 kB gz to **every single route** — including pure static marketing pages

`ClerkProvider` wraps the whole tree in `src/app/layout.tsx:106`. Measured Clerk chunks in first load: `2eekuzkw77x2a.js` (30.4) + `3ngubbv-g-qoq.js` (14.6) + `30c-09oqb9kj6.js` (11.8) = **56.8 kB gz**.

This lands on `/faq`, `/privacy`, `/terms`, `/support`, `/tools/ev-to-sp`, `/champions/*` (72 SSG pages) and `/_not-found` — routes with no auth UI at all. At 249.8 kB total for `/terms`, **23% of that page's JS is an auth SDK it never uses.**

This is the largest single unaddressed line item in the report and affects the most routes. It is also the hardest — `ClerkProvider` at the root is the documented pattern and moving it means auditing every `useAuth()`/`SignInButton` call site.

### 3.2 PostHog is already well-handled

Only **6.2 kB gz** (`31c_k5c_98ew6.js`) in first load on every route; the 67.4 kB main `posthog-js` body (`2pwv7tddxbcy1.js`) is correctly deferred and is not in any route's first-load set. No action.

### 3.3 Heavy libs already correctly dynamic — do not re-report

Verified **absent from every route's first-load set**:
- `html2canvas-pro` — 225 kB gz across 3 chunks (`3wb7i39y47n9u` 128.9, `0k0aodha5k86u` 52.7, `3gti1qdk5epqn` 43.7). Routed through the singleton `src/lib/dynamic-imports/html2canvas.ts`. Good pattern.
- `jspdf` (29M in node_modules) — `await import("jspdf")` inside `src/lib/utils/export-report.ts:5`.
- `qrcode`, `vanilla-cookieconsent` — deferred.
- `@pkmn/dex` (52M in node_modules) — **fully excluded from client bundles**. The `dex-subset.json` extraction is working as designed; no client chunk references `@pkmn`.
- `src/app/changelog/data.ts` (88 kB raw) — server-only, consumed by the RSC `page.tsx` and passed as props. Not in `/changelog`'s first load. Correct.

### 3.4 node_modules top offenders vs. what actually ships

| Package | on disk | shipped to client? |
|---|---:|---|
| `next` + `@next` | 384M | runtime only (SWC binaries) |
| `@pkmn/dex` | 52M | **No** — replaced by dex-subset |
| `@img` (sharp) | 45M | **No** — server-only |
| `posthog-js` | 39M | 6.2 kB eager, rest deferred |
| `@opentelemetry` | 33M | **No** — `serverExternalPackages` |
| `jspdf` | 29M | **No** — dynamic |
| `@clerk` | 16M | **Yes — 56.8 kB gz on every route** (§3.1) |
| `html2canvas-pro` + `html2canvas` | 10.7M | **No** — dynamic |
| `framer-motion` + `motion-dom` | 10.2M | **Yes — 37.4–52.8 kB gz on 7 routes** (VGC-268) |
| `zod` | 6.2M | server-side validation only |

Disk size is a poor proxy here — the two packages that actually matter (`@clerk`, `motion`) rank 7th and 8th by disk.

---

## 4. Ranked opportunities — kB saved vs. effort

| # | Action | Saves | Routes | Effort | Ticket |
|---|---|---:|---|---|---|
| 1 | **Restore bundle-size visibility.** Add `scripts/bundle-report.mjs` using the §0 HTML-parsing method; wire into CI as a soft budget check. | 0 kB direct — **unblocks and protects all of the below** | all | **S** | VGC-269 |
| 2 | **`/compare`: defer the data tables.** Move `lookupPokemon` + `detectMegaFromItem` behind `await import(...)` in the compare handler, mirroring the `analyze-team.ts` pattern already proven on the homepage. | **70.5 kB gz** (336.0 → 265.5) | `/compare` | **S** | VGC-271 |
| 3 | **Drop motion from the 5 light-use routes** (`MegaLandingContent`, `ChangelogContent`, `FeedbackContent`, `ExploreEmpty`, `WhatsNewModal`). These use simple fade/slide-in — replace with CSS keyframes + `prefers-reduced-motion`. | **37.4 kB gz × 3 routes** + removes motion from 72 SSG `/champions/*` pages | `/changelog`, `/feedback`, `/champions/[pokemon]` | **M** | VGC-268 |
| 4 | **`next/dynamic({ssr:false})` motion on the interaction-heavy routes** (`ExploreFilters`, `ExploreContent`, `ReportCard`, `SpotlightCard`, `dashboard/profile`, `PasteInput`). Keep the API, defer the runtime past hydration. | **37.4–52.8 kB gz** | `/`, `/explore`, `/dashboard`, `/dashboard/profile` | **M** | VGC-268 |
| 5 | **Split `src/app/page.tsx` (1,833 lines) into an RSC shell + a small client island.** The static hero/FAQ/JSON-LD above the paste box needs no JS. | est. **40–80 kB gz** | `/` | **L** | VGC-162 |
| 6 | **Scope `ClerkProvider` away from auth-free routes** — a route-group split (`(marketing)` vs `(app)`) so `/faq`, `/privacy`, `/terms`, `/support`, `/champions/*` skip it. | **56.8 kB gz** | ~78 routes incl. 72 SSG pages | **L** | none — **file one** |

**Recommended order:** 1 → 2 → 3 → 4. Items 1 and 2 together are roughly a day and deliver the measurement harness plus the single biggest one-route win. Items 5 and 6 are real but should not start before item 1 exists to prove they worked.

---

## 5. Things explicitly verified as ALREADY FIXED — do not re-report

- Homepage no longer ships `pokemon.ts` or `dex-subset.json` on first paint (commit `415a281`). Verified against chunk contents, not just the commit message.
- `analyze-team.ts` lazy-import barrier is in place and holding, with a guard comment.
- `html2canvas-pro`, `jspdf`, `qrcode` all correctly dynamic — 225+ kB gz kept out of every first load.
- `@pkmn/dex` (52M) fully excluded from the client graph.
- OpenTelemetry correctly listed in `serverExternalPackages`.
- `changelog/data.ts` (88 kB) is server-only.
- No barrel-import problems found — `src/components/ui/icons.tsx` is a single 333-line file of inline SVGs, tree-shakes cleanly, and `src/lib/i18n` (120K) does not appear in any first-load chunk.
