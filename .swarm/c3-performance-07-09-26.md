# C3 — Bundle / Performance Analysis (2026-09-07)

**Agent:** C3 (read-only). **Build:** `npm run build` at `70c4633`, exit 0, `/tmp/build-c3.txt`.
**Scope:** production bundle composition, per-route first-load JS, heavy-dependency audit, `src/lib/data/` payload placement, `"use client"` boundaries, and revalidation of VGC-256/257/268/269/271.

---

## 0. TL;DR — ticket verdicts

| Ticket | Verdict | Evidence in THIS build |
|---|---|---|
| **VGC-256** zod out of the client bundle (223.9 kB raw / 50.4 kB gz) | ✅ **ALREADY FIXED** | zod is chunk `3fh60j1aq6y_9.js` = **265.6 kB raw / 62.9 kB gz**, referenced by **zero** prerendered HTML files → lazy. `url-codec.ts` now dynamic-imports `./url-codec.schemas`. |
| **VGC-257** `dex-subset.json` eager on homepage (330.3 kB) | ✅ **ALREADY FIXED on `/`** — ⚠️ moved, not gone | The only chunk containing `schemaVersion` is `2s786ain9e09t.js` (**131,143 B raw / 33.1 kB gz**). It is **absent from `/`** and now eager on **`/compare` only**. |
| **VGC-271** lazy-load the dex-subset fallback | ❌ **STILL VALID** | `src/lib/data/pokemon.ts:2` still `import { lookupPokemonFromDex } from "./pkmn-dex-fallback"` → `dex-subset.ts:39` `import rawSubset from "./dex-subset.json"`. Any *client* module importing `lookupPokemon` still drags the 130 kB JSON. Live on `/compare`. |
| **VGC-268** motion eager on 7 routes (37.8 kB gz), move-names eager | ⚠️ **HALF FIXED** — motion **STILL VALID**, move-names **FIXED** | motion = `0y3cx1zi-ccxg.js` **114.8 kB raw / 37.5 kB gz**, eager on **78 prerendered pages** (7 route groups; 72 of them are the `/champions/[pokemon]` SSG set). move-names = `0283r4a4lwfak.js` (111.1 kB raw / 46.1 kB gz), **zero** HTML references → now lazy. |
| **VGC-269** no bundle-size visibility since Next 16 + Turbopack | ❌ **STILL VALID (confirmed)** | The route table in this build prints only `Route (app) / Revalidate / Expire`. **No `Size` and no `First Load JS` columns at all.** Everything below was reconstructed by hand. |

---

## 1. Methodology (because the build no longer tells you)

Turbopack emits no size table and **no source maps** in `.next/static/chunks`. Numbers below were derived by:

1. Parsing every prerendered `.next/server/app/**/*.html` for `<script src="/_next/static/chunks/…">`.
2. Excluding the `noModule` script (`0cz1d0mv5g_q7.js`, 110.0 kB raw / 38.6 kB gz core-js polyfill) — **modern browsers never fetch it**, so counting it inflates every route by ~38 kB gz. Do not report it as a win.
3. Sizing each chunk raw + `gzip -9`.
4. Identifying chunk contents by minification-surviving string fingerprints (`cc_cookie`, `MotionConfig`, `schemaVersion`, `$ZodError`, `Kangaskhanite`, Clerk export names, Next router header names) and by splitting chunks on Turbopack module boundaries.

A chunk referenced by **no** HTML is lazy (on-demand). That is the load-bearing test used throughout.

---

## 2. Per-route first-load JS

Module scripts only; `noModule` polyfill excluded.

| Route | raw kB | **gz kB** | chunks |
|---|---:|---:|---:|
| `/` (homepage) | 1015.1 | **303.1** | 20 |
| `/compare` | 1067.5 | **297.4** | 20 |
| `/dashboard` | 971.1 | **289.7** | 20 |
| `/dashboard/profile` | 930.3 | **282.2** | 19 |
| `/explore` | 871.1 | **263.0** | 18 |
| `/champions/[pokemon]` ×72 SSG | 832.7 | **254.7** | 18 |
| `/feedback` | 824.5 | **252.6** | 18 |
| `/changelog` | 822.7 | **252.1** | 18 |
| `/dashboard/privacy` | 788.3 | 238.2 | 18 |
| `/champions` | 750.5 | 224.3 | 17 |
| `/tournaments` | 708.9 | 215.2 | 17 |
| `/tools/ev-to-sp` | 705.7 | 214.4 | 17 |
| `/faq`, `/privacy`, `/terms`, `/support` | 695.1 | 211.2 | 17 |
| **`/_not-found` (= shared shell floor)** | **692.0** | **210.0** | 16 |
| `/_global-error` | 443.5 | 131.7 | 8 |

**The headline number is the floor, not the peak.** A static legal page ships 210 kB gz. Route-specific code is only 45–93 kB gz on top of that.

### 2.1 Shared shell — what every route pays

| raw kB | gz kB | chunk | what it is |
|---:|---:|---|---|
| 199.8 | **63.0** | `34wvn5zw0a69w.js` | React |
| 124.4 | **33.3** | `2reak9ew8mz9t.js` | Next App Router client runtime |
| 104.5 | **30.4** | `2eekuzkw77x2a.js` | react-dom |
| 49.3 | 11.8 | `30c-09oqb9kj6.js` | **Clerk** |
| 40.6 | 14.6 | `2h7yd05r_37wl.js` | **Clerk** (React bindings) |
| 34.9 | 13.5 | `1bghurpleveap.js` | **vanilla-cookieconsent (22.8 kB of 35.7 kB) + Clerk export shim** |
| 31.2 / 27.0 / 26.2 | 24.8 | `11jq0c2_zavac`, `23c5h5wdeds1s`, `37u51_524syek` | Next internals |
| 15.8 | 6.2 | `3tfz_2iq07odh.js` | app providers (CookieBanner, PostHogProvider glue) |
| 14.0 + 10.7 + 9.4 + 4.3 | 11.8 | misc + turbopack runtime | |

Framework floor (React + react-dom + router) = **126.7 kB gz** and is not reducible.
**Clerk = 89.9 kB raw / 26.4 kB gz on every route**, including `/privacy`, `/terms`, `/faq`, `/support`, `/tools/ev-to-sp` — none of which have a signed-in surface.

### 2.2 Route-specific chunks (the 5 largest client payloads)

| # | Route | Chunk(s) | raw kB | gz kB | Dominated by |
|---|---|---|---:|---:|---|
| 1 | `/compare` | `3yv3y7esj_hpn` + `2s786ain9e09t` + `3k5vry57lq1z1` + `3xkqy1x0k7mz2` | **375.5** | **87.5** | `pokemon.ts` (243 kB src) + **`dex-subset.json` (130 kB)** + `mega-pokemon.ts` — all **eager** |
| 2 | `/` | `3dph6eid8tagn` (161.5/42.3) + `0fju3m2_qh2-p` (43.9/12.6) | 205.4 | 54.9 | `page.tsx` + `useHomePage` + walkthrough/share-token logic; **SpotlightCard/ReportCard** |
| 3 | *(7 route groups)* | `0y3cx1zi-ccxg` | 114.8 | **37.5** | **`motion`** — VGC-268 |
| 4 | `/dashboard` | `3l9gi700_gph-` (86.0/24.9) + `0q4u3ks6_-rxt` (49.8/10.4) + `2uq80fth5w7qh` (28.5/7.0) | 164.3 | 42.3 | dashboard views + a species/sprite table |
| 5 | `/explore` | `049v0ugl1d4ym` | 64.2 | 15.5 | explore grid + filters + regulation labels |

---

## 3. Dependency audit — what reaches the client

| Package | Chunk | raw / gz | Eager? | Verdict |
|---|---|---:|---|---|
| `jspdf` + `html2canvas-pro` | `3wb7i39y47n9u.js` | 408.6 / **130.2** | **LAZY** | ✅ correctly split (PdfExport is `next/dynamic`) |
| `zod` | `3fh60j1aq6y_9.js` | 265.6 / **62.9** | **LAZY** | ✅ VGC-256 done |
| `posthog-js` | `2pwv7tddxbcy1.js` | 206.3 / **67.6** | **LAZY** | ✅ consent-gated dynamic import |
| `@microsoft/clarity` | (lazy) | — | **LAZY** | ✅ consent-gated |
| **`motion`** | `0y3cx1zi-ccxg.js` | 114.8 / **37.5** | **EAGER ×78 pages** | ❌ **VGC-268 — top win** |
| **`vanilla-cookieconsent`** | in `1bghurpleveap.js` | 22.8 of 35.7 / **≈8.6** | **EAGER on ALL routes** | ❌ **NEW** — static import in a provider |
| `@clerk/nextjs` | `30c-…`, `2h7yd05r…` | 89.9 / **26.4** | **EAGER on ALL routes** | ⚠️ root-layout `ClerkProvider` |
| `qrcode` | merged into lazy export chunks | — | LAZY | ✅ |
| `@pkmn/dex` (52 MB) | — | — | **not shipped** | ✅ replaced by `dex-subset.json` |
| OpenTelemetry SDK | — | — | server-only | ✅ `serverExternalPackages` |

**Icon sets / date libs:** none. Icons are a hand-rolled 12.9 kB `src/components/ui/icons.tsx` of inline SVGs; no `date-fns`/`moment`/`dayjs` anywhere. Nothing to win here.

**i18n:** only `translations/en.ts` (14.8 kB) is statically imported by `src/lib/i18n/index.ts:6`; the other six locales are not eager. ✅

**CSS:** two stylesheets, both render-blocking on every route — `3v3l-5lo0fvhs.css` 169.9 kB raw / **24.3 kB gz** (Tailwind) and `1y8ji36wj_c16.css` 35.0 kB raw / **6.2 kB gz**, of which **32.2 kB raw is `vanilla-cookieconsent/dist/cookieconsent.css`** (~92% of the file).

---

## 4. `src/lib/data/` payloads — eager vs lazy

| File | raw src | Eager on | Status |
|---|---:|---|---|
| `dex-subset.json` | 129.9 kB | **`/compare` only** (was `/` + `/compare`) | ⚠️ VGC-271 live |
| `pokemon.ts` | 243.2 kB | **`/compare` only** | ⚠️ same chain |
| `move-names.ts` | 129.5 kB | **nowhere** — lazy | ✅ fixed |
| `moves.ts` | 82.1 kB | nowhere — lazy | ✅ |
| `pokemon-types-map.ts` | 42.3 kB | nowhere — lazy | ✅ |
| `mega-pokemon.ts` | 33.1 kB | `/compare` (client), `/champions/*` (**server-only**, SSG) | ⚠️ minor |
| `gen9-regulation-signals.ts` | 9.5 kB | `/explore` | fine |

**The live chain (VGC-271):**

```
src/components/compare/CompareContent.tsx:6   import { lookupPokemon } from "@/lib/data/pokemon"   ← "use client"
src/lib/data/pokemon.ts:2                     import { lookupPokemonFromDex } from "./pkmn-dex-fallback"
src/lib/data/pkmn-dex-fallback.ts:35          import { getSpecies, … } from "@/lib/data/dex-subset"
src/lib/data/dex-subset.ts:39                 import rawSubset from "./dex-subset.json"      ← 130 kB
```

`CompareContent.tsx` also statically imports `@/lib/parser/showdown-parser` (line 5) and `@/lib/utils/mega-detect` (line 20) — **exactly the modules the homepage tripwire forbids**. `src/lib/__tests__/homepage-eager-imports.test.ts` only guards `app/page.tsx`, `hooks/useHomePage.ts`, `hooks/useTeamReport.ts`, so `/compare` was never covered and silently kept the pattern VGC-257 removed from `/`.

Note the encoding win from VGC-257 held: `dex-subset.json` is 129.9 kB (positional arrays), down from the 323.7 kB array-of-objects the ticket quotes. The `330.3 kB` figure in VGC-257/271 is stale — **the true remaining exposure is 131 kB raw / 33.1 kB gz.**

---

## 5. `"use client"` boundaries higher than necessary

111 files carry `"use client"`. The problems are structural, not count-driven:

1. **`src/app/layout.tsx:24` `<ClerkProvider>` wraps the entire tree.** 26.4 kB gz of Clerk on `/privacy`, `/terms`, `/faq`, `/support`, `/tools/ev-to-sp`, `/tournaments`, `/changelog` — routes with no auth surface. Fixing this needs a `(marketing)` / `(app)` route-group split. **MED/HIGH risk** (Clerk hooks are used inside `PersistentNavbar`, which is also global).
2. **`src/components/providers/CookieBanner.tsx:4-5`** — a `"use client"` component whose *only* job runs inside `useEffect`, yet it statically imports the library and its CSS. The banner shows once per year per visitor; the code ships to 100% of page views.
3. **`src/components/input/PasteInput.tsx:10`** — `SpotlightCard` is imported statically but rendered only behind `{spotlight && …}` (line 548), where `spotlight` is populated by a post-mount `fetch("/api/spotlight")`. It **cannot** be in first paint, yet it is in the first-paint bundle.
4. **`src/app/compare/page.tsx`** is a proper server component, but `CompareContent` is one monolithic `"use client"` island that pulls the whole analysis layer eagerly (§4).

Good news: `src/app/page.tsx` is now an exemplary boundary — 12 `next/dynamic` splits (TeamReport, ShareModal, PdfExport, OTSSheetModal, CommentSection, …), and `DeferredLayoutExtras` correctly defers the four PWA widgets.

---

## 6. Recommendations

Ordered by (gz saved × routes affected) ÷ risk.

### R1 — Remove `motion` from its low-usage consumers *(VGC-268)* — **LOW**
**Files:** `src/app/champions/[pokemon]/MegaLandingContent.tsx` (3 `motion.div`, lines 38/180/189) · `src/components/social/CreatorProfile.tsx` (2) · `src/app/dashboard/profile/page.tsx` (4) · `src/app/changelog/ChangelogContent.tsx` (8).
**Change:** replace `<motion.div initial/animate/transition>` fade-and-rise with a CSS `@keyframes` utility in `globals.css` (`opacity 0→1`, `translateY(16px)→0`, 150–300 ms), honouring `prefers-reduced-motion`.
**Saved:** **−37.5 kB gz on 72 SSG `/champions/*` pages** (SEO-critical, 15% of their JS) plus `/changelog`, `/dashboard/profile`, `/creator/[name]`.
**Risk: LOW** — purely presentational entrance animations, no layout/gesture APIs, no `AnimatePresence` in three of the four files.
*Follow-up (MED):* `/explore` (12 usages) and `/` `PasteInput.tsx` (35 usages, incl. `motion.img`/`motion.button`) delete the chunk entirely — but that is a real UI-review job; route it through `ui-checklist-reviewer`.

### R2 — Lazy-load `vanilla-cookieconsent` — **LOW** — *NEW*
**File:** `src/components/providers/CookieBanner.tsx` lines 4–5.
**Change:** delete the two static imports; inside the existing `useEffect`, do
`const CookieConsent = await import("vanilla-cookieconsent"); await import("vanilla-cookieconsent/dist/cookieconsent.css");`
before `CookieConsent.run({…})`. Keep the `open-cookie-settings` listener registration synchronous and have it await the same memoised promise.
**Saved:** **≈8.6 kB gz JS + ≈5.7 kB gz render-blocking CSS on EVERY route** ≈ **−14 kB gz sitewide**, and it takes 32.2 kB of CSS off the critical path.
**Risk: LOW** — already effect-only; the banner paints a frame later, which is correct behaviour for a consent overlay anyway.

### R3 — `next/dynamic` for `SpotlightCard` on the homepage — **LOW** — *NEW*
**File:** `src/components/input/PasteInput.tsx:10`.
**Change:** `const SpotlightCard = dynamic(() => import("@/components/explore/SpotlightCard").then(m => ({ default: m.SpotlightCard })), { ssr: false });` — matching the file's existing `WhatsNewModal` pattern (line 16).
**Saved:** up to **−12.6 kB gz / −43.9 kB raw on `/`** (chunk `0fju3m2_qh2-p.js`; a shared helper may keep part of it, so treat 12.6 kB as the ceiling).
**Risk: LOW** — render is already gated on an async fetch; it can never be in first paint.

### R4 — Move `/compare` onto the homepage's lazy analysis pattern *(closes VGC-271 in practice)* — **MED**
**File:** `src/components/compare/CompareContent.tsx` lines 5–20.
**Change:** drop the static `parseShowdownPaste` / `lookupPokemon` / `mega-detect` imports; `await import("@/lib/analysis/analyze-team")` (and `mega-detect`) from the paste-submit handler, exactly as `useHomePage` does. Then extend `EAGER_HOMEPAGE_FILES` in `src/lib/__tests__/homepage-eager-imports.test.ts` to include `components/compare/CompareContent.tsx` so it cannot regress.
**Saved:** **−375 kB raw / −87.5 kB gz on `/compare`** (297.4 → ~210 kB gz, the shell floor).
**Risk: MED** — `CompareContent` computes through `useMemo`; converting to an async effect + state needs care around the two-team compare flow. Ship with a Cypress pass.

### R5 — Restore bundle visibility *(VGC-269)* — **LOW**
**File:** new `scripts/bundle-report.mjs` (+ `"analyze": "node scripts/bundle-report.mjs"` in `package.json`).
**Change:** post-build, walk `.next/server/app/**/*.html`, collect `<script src>` (skipping `noModule`), size each chunk raw + gzip, and print the Size / First Load JS table Turbopack dropped. Optionally fail on a per-route gz budget. Working implementation exists at `/tmp/claude-0/-home-user-VGC-Team-Report/c5741578-7d4d-594d-8ae2-210e51e8d44a/scratchpad/final.js` (~40 lines, zero deps).
**Saved:** 0 kB directly — but every number in this report is currently unobservable in CI, which is how VGC-257 could be "fixed on `/`" and silently still live on `/compare`.
**Risk: LOW** — build-output-only, no runtime or source impact.

### R6 — Split Clerk off the marketing/legal routes — **HIGH** (file, don't do now)
Route-group `(marketing)` for `/privacy`, `/terms`, `/faq`, `/support`, `/tools/ev-to-sp`, `/tournaments` with a layout that omits `ClerkProvider`. **−26.4 kB gz** on those six routes. Blocked on `PersistentNavbar` using Clerk hooks globally; needs an auth-free navbar variant.

---

## 7. NEW vs KNOWN

**KNOWN** (tracked, re-verified here): VGC-256 ✅ fixed · VGC-257 ✅ fixed on `/` · VGC-268 ⚠️ motion still live, move-names fixed · VGC-269 ❌ still live · VGC-271 ❌ still live.
Prior report `.swarm/c3-perf-10-08-26.md` item **B** ("move-names eager on `/`, ~45.8 kB gz") is now **RESOLVED**; item **C** ("dex-subset duplicated across route groups") is **RESOLVED** — only one copy is emitted now, and only `/compare` loads it.

**NEW this run:**
- **N1** `vanilla-cookieconsent` + its 32.2 kB CSS eager on every route (R2).
- **N2** `SpotlightCard` eager on `/` behind an async-only render gate (R3).
- **N3** `/compare` is now the *only* route carrying the full Pokémon data tables, and it sits outside the `homepage-eager-imports` tripwire — the guard has a hole (R4).
- **N4** Clerk is 26.4 kB gz on six auth-free static routes (R6).
- **N5** Methodology trap: the 110.0 kB / 38.6 kB gz core-js chunk is `noModule`. Any future analysis that counts it will report a phantom ~38 kB gz per route and a phantom win if "removed".

---

## 8. Caveats

- No source maps in the production build; chunk→module attribution is by string fingerprint and Turbopack module-boundary splitting. Composite chunks (e.g. `1bghurpleveap.js` = cookieconsent + a Clerk export shim) are called out as such, and the R2 saving is stated as an estimate from a measured 22,795/35,726-byte module split.
- gzip figures are `gzip -9`; Vercel serves Brotli, which will run ~15–20% smaller across the board. Relative rankings are unaffected.
- `/s/[id]`, `/embed/[id]`, `/creator/[name]`, `/notifications` are dynamic (`ƒ`) with no prerendered HTML, so they are absent from the route table. They inherit the 210 kB gz shell; `/creator/[name]` additionally loads the motion chunk via `CreatorProfile`.
- Source tree was **not modified**. Read-only throughout; nothing sent anywhere.
