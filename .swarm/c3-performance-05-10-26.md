# C3 — Performance Audit (read-only)

Repo: `/home/user/VGC-Team-Report` · HEAD `70c4633` · Next.js 16.3.0 (Turbopack), React 19.2.3, Tailwind v4
Build: `npm run build` → exit 0. Date: 2026-10-05.

---

## 0. Methodology note — why there is no "First Load JS" column

Next 16 + Turbopack **no longer prints per-route First Load JS**. The route table in the build
output only carries `Revalidate` / `Expire` columns (build log lines 827–918). All sizes below were
measured directly from the build artifacts:

- For each of the 89 prerendered documents in `.next/server/app/**.html`, every
  `/_next/static/**.js` referenced by a `<script>` or `<link rel=preload|modulepreload>` was
  collected — that set *is* the route's initial JS — and each chunk measured raw + gzip(-9) on disk.
- This is the same measurement the previous perf commit used ("homepage preload set drops
  1780KB → 1124KB raw"), so the numbers are directly comparable to `415a281`.
- Chunk → module attribution was done by content fingerprinting the minified chunks (Turbopack
  strips `[project]/…` module paths from production output, so there is no module graph to read).
  Fingerprints used: `baseStats` ×1343 ⇒ `POKEMON_DATA`; `Écras` ⇒ `MOVE_NAMES`;
  `megaStone` ×75–80 ⇒ `MEGA_POKEMON_LIST`; `calyrex-shadow` ⇒ `POKEMON_TYPES_MAP`;
  `redirection` ⇒ `MOVES`; `jsPDF` ⇒ jspdf; `posthog` ⇒ posthog-js; `Clerk` ⇒ `@clerk/nextjs`.

Dynamic (`ƒ`) routes — `/s/[id]`, `/embed/[id]`, `/creator/[name]`, `/notifications`,
`/dashboard/notifications` — have no prerendered HTML and so are **absent from the size table**.
They are covered qualitatively in §6.

---

## 1. Shared chunk + route table

### Shared chunk

| Scope | Chunks | Raw | Gzip |
|---|---|---|---|
| Intersection of **all 89** prerendered docs (incl. `_global-error`) — the closest analogue to Next's old "shared by all" | 8 | **538.5 KB** | **166.3 KB** |
| Intersection of the **87 real app routes** (excl. `_global-error`, `_not-found`) — the floor every real page pays | 17 | **802.0 KB** | **248.6 KB** |

The 248.6 KB gzip figure is the one that matters: a visitor landing on `/terms` pays it.
Breakdown of the 17-chunk floor:

| Chunk | Raw | Gzip | Identified as |
|---|---|---|---|
| `34wvn5zw0a69w.js` | 199.8 | 63.0 | react-dom (`Minified React error`, `useFormState`) |
| `0cz1d0mv5g_q7.js` | 110.0 | 38.6 | Next polyfills (`polyfillFiles` in build-manifest) |
| `2reak9ew8mz9t.js` | 124.4 | 33.3 | Next client runtime (`rootMainFiles`) |
| `2eekuzkw77x2a.js` | 104.5 | 30.4 | **@clerk/nextjs** |
| `0lu9aq2kd82ql.js` | 40.6 | 14.6 | **@clerk/nextjs** |
| `1bghurpleveap.js` | 34.9 | 13.5 | Clerk + PostHogProvider + CookieConsent providers |
| `30c-09oqb9kj6.js` | 49.3 | 11.8 | **@clerk/nextjs** |
| `11jq0c2_zavac.js` | 31.2 | 8.3 | Next runtime |
| `37u51_524syek.js` | 26.2 | 8.3 | Next runtime |
| `23c5h5wdeds1s.js` | 27.0 | 8.2 | Next runtime |
| `3sette3m27rh0.js` | 15.8 | 6.2 | app shell (`vgc-dark-mode`, `pokemonvgcteamreport`) |
| `turbopack-…-8.js` | 10.7 | 4.2 | Turbopack loader |
| `2229p2c7g6dse.js` | 14.0 | 3.6 | — |
| `0oicg-oelefcn.js` | 9.4 | 2.5 | Next runtime |
| 3 × tiny | 4.3 | 2.3 | — |

**~57 KB gzip (≈23%) of the floor every route pays is `@clerk/nextjs`** — see §4.

### 10 heaviest routes (initial JS, gzip-sorted)

| # | Route | Raw | **Gzip** | Route-specific (gzip) |
|---|---|---|---|---|
| 1 | `/` | 1125.1 KB | **341.7 KB** | 175.4 KB |
| 2 | `/compare` | 1177.5 KB | **336.0 KB** | 169.7 KB |
| 3 | `/dashboard` | 1081.1 KB | **328.3 KB** | 162.0 KB |
| 4 | `/dashboard/profile` | 1040.3 KB | 320.8 KB | 154.5 KB |
| 5 | `/explore` | 981.0 KB | 301.6 KB | 135.3 KB |
| 6 | `/champions/[pokemon]` ×72 SSG | 942.6 KB | 293.3 KB | 127.0 KB |
| 7 | `/feedback` | 934.5 KB | 291.2 KB | 124.9 KB |
| 8 | `/changelog` | 932.6 KB | 290.7 KB | 124.4 KB |
| 9 | `/dashboard/privacy` | 898.3 KB | 276.8 KB | 110.5 KB |
| 10 | `/champions` | 860.4 KB | 262.9 KB | 96.6 KB |

Floor for comparison: `/faq`, `/privacy`, `/terms`, `/support` = 805.0 KB raw / **249.8 KB gzip** —
i.e. a static legal page ships a quarter-megabyte of gzipped JS.

---

## 2. VGC-162 — verdict: **STALE as written** (close or rewrite)

> *"Root page.tsx Server Component refactor — reduce client JS by ~200KB"*

**The KB objective is met and exceeded ~3×; the stated mechanism is not viable and would deliver ~2 KB.**

Evidence:

1. **Target exceeded.** `415a281` recorded the homepage preload set going 1780 KB → 1124 KB raw.
   This build independently measures `/` at **1125.1 KB raw**, confirming the ~655 KB raw
   reduction is real and still in place. The ticket asked for ~200 KB.
2. **The mechanism was never what delivered it.** `src/app/page.tsx` is still `"use client"`
   (line 1) and was never converted. The saving came from lazy-loading
   (`analyze-team`, `mega-detect`, `detect-*`, `TeamReport`, Clarity, `DeferredLayoutExtras`).
3. **The refactor has almost nothing left to hoist.** `HomeContent()` spans lines 101–1833:
   lines 101–916 are **42 hook calls** of interactive state, and lines 917–1833 are JSX bound to
   that state. There is no sizeable static subtree to move server-side.
4. **The only genuine residue is ~2 KB.** Because `"use client"` is at *file* scope, the static
   wrapper `Home()` (lines 89–99), `HOW_TO_STEPS` (lines 66–87, ~2 KB of prose) and
   `<FAQPageJsonLd />` / `<HowToSchema />` are all client-side despite being inert. Splitting
   `page.tsx` into a Server Component shell + a `"use client"` `HomeContent.tsx` would move those
   to the server. Real, correct, and worth ~2 KB gzip — not 200.

**Recommendation:** close VGC-162 as delivered-by-other-means. If the ~2 KB file split is wanted,
file it as a small hygiene ticket, and note `src/app/page.tsx` is the repo's **highest-churn file
(4 touches / last 30 commits) ⇒ high conflict-risk**.

### VGC-158 ("Decompose PokemonDetailSlide — 962-line component") — valid, but **not a perf ticket**

`src/components/report/PokemonDetailSlide.tsx` (974 lines, `"use client"`) renders only inside
`TeamReport`, which `src/app/page.tsx:13` already lazy-loads. Decomposing it moves code between
lazy chunks and saves ~0 KB. Its one real perf liability is line 15,
`import { translateMove } from "@/lib/utils/translate-move"` — see §3, finding **A**. That fix is
independent of decomposition and should not wait for it. Treat VGC-158 as maintainability only.
(`PokemonDetailSlide.tsx`: 3 touches / last 30 commits ⇒ **high conflict-risk**.)

---

## 3. Big data tables — who actually pulls them into the client

| Table | Lines | Reaches client? | Gzip when it does | Verdict |
|---|---|---|---|---|
| `src/lib/data/moves.ts` | 4183 | Yes, **lazy only** | 9.8 KB (`1bnd0bpn5t8y1.js`, 54.0 KB raw) | **OK — leave alone** |
| `src/lib/data/pokemon.ts` | 3404 | Yes, **eager on `/compare` only** | **37.2 KB** (`3yv3y7esj_hpn.js`, 189.1 KB raw) | **FLAG — finding B** |
| `src/lib/data/pokemon-types-map.ts` | 1336 | **No — server/edge only** | — | **OK — leave alone** |
| `src/lib/data/mega-pokemon.ts` | 943 | Yes, eager on `/champions` + `/compare`; lazy elsewhere | within the 33.1 KB dex chunk | partially **finding B** |
| `src/lib/data/move-names.ts` | 926 | Yes, **lazy but on every report view** | **46.1 KB** (`0283r4a4lwfak.js`, 111.1 KB raw) | **FLAG — finding A** |

### A. `move-names.ts` — 46.1 KB gzip of translations English users never read

Exact chain (all static imports):

```
src/app/page.tsx:13  dynamic(() => import("@/components/report/TeamReport"))      [lazy boundary]
  └─ src/components/report/TeamReport.tsx:11   import { PokemonDetailSlide } from "./PokemonDetailSlide"
       └─ src/components/report/PokemonDetailSlide.tsx:15
                                       import { translateMove } from "@/lib/utils/translate-move"
            └─ src/lib/utils/translate-move.ts:3  import { MOVE_NAMES } from "@/lib/data/move-names"
                 └─ src/lib/data/move-names.ts    ~900 moves × 6 languages (fr/it/es/ja/ko/zh)
```

Also entered via `PokemonCard.tsx:24`, `TournamentMode.tsx:13`, `OffensiveCoverageChart.tsx:11`,
`OTSSheetModal.tsx:11`.

Two costs, both paid by every single report viewer regardless of language:

1. **46.1 KB gzip / 111.1 KB raw** downloaded with the report chunk. `translateMove` itself
   short-circuits at `if (lang === "en") return englishName.trim()` (`translate-move.ts:26`), so for
   the overwhelming majority of sessions not one byte is read.
2. **Eager module-init work.** `translate-move.ts:15–20` builds `MOVE_NAMES_BY_NORMALIZED_NAME` at
   *import* time — ~900 `Object.entries` iterations, each running `normalizeMoveName` (trim, NFKC
   normalize, 2 regex replaces, toLowerCase) and inserting into a `Map`. This runs on the main
   thread during report hydration for every user, including English ones.

For contrast, `src/lib/i18n/index.ts` already does this correctly: only `en` is a static import
(line 6); `fr/it/es/ja/ko/zh` are behind `() => import(...)` (lines 26–32). `move-names.ts` is the
one table that never got the same treatment.

### B. `/compare` still ships both data tables on first paint — the exact bug `415a281` fixed on `/`

Exact chain (all static imports, no lazy boundary anywhere):

```
src/app/compare/page.tsx:4                 import { CompareContent } from "@/components/compare/CompareContent"
  └─ src/components/compare/CompareContent.tsx:1   "use client"
       ├─ :6   import { lookupPokemon }    from "@/lib/data/pokemon"
       │         └─ src/lib/data/pokemon.ts:2  import { lookupPokemonFromDex } from "./pkmn-dex-fallback"
       │              └─ pkmn-dex-fallback.ts:30-35  import { getSpecies, getMegaStone, allMegaStones } from "@/lib/data/dex-subset"
       │                   └─ dex-subset.ts:39  import rawSubset from "./dex-subset.json"   (128 KB raw)
       ├─ :20  import { detectMegaFromItem, isMegaForm } from "@/lib/utils/mega-detect"
       │         └─ mega-detect.ts:1  import { MEGA_POKEMON_LIST, MEGA_BY_KEY } from "@/lib/data/mega-pokemon"
       │         └─ mega-detect.ts:6  import … from "@/lib/data/pkmn-dex-fallback"
       └─ :5   import { parseShowdownPaste } from "@/lib/parser/showdown-parser"
```

Measured result — both tables sit in `/compare`'s **preload set**, not behind any `import()`:

| Chunk | Raw | Gzip | Content |
|---|---|---|---|
| `3yv3y7esj_hpn.js` | 189.1 KB | 37.2 KB | `POKEMON_DATA` (`baseStats` ×1343) |
| `2s786ain9e09t.js` | 128.1 KB | 33.1 KB | `dex-subset.json` (128 KB raw — exact match) |
| **Total** | **317.2 KB** | **70.3 KB** | |

This is why `/compare` is the #2 heaviest route despite being a comparatively simple 537-line
component. None of this data is needed until the user actually pastes or selects a team.

**Root cause is a coverage gap in the tripwire.** `src/lib/__tests__/homepage-eager-imports.test.ts`
guards exactly three files (`app/page.tsx`, `hooks/useHomePage.ts`, `hooks/useTeamReport.ts`) against
the same `FORBIDDEN_STATIC_IMPORTS` list that `CompareContent.tsx` violates on four lines.
`CompareContent.tsx` was never added to `EAGER_HOMEPAGE_FILES`.

### Confirmed clean (no action)

- **`@pkmn/dex` (52 MB in `node_modules`, ~1.8 MB raw)** does not reach any client chunk. Grepping
  all 110 chunks for `@pkmn` / `learnset` returns nothing. The `dex-subset.json` indirection in
  `src/lib/data/dex-subset.ts` works exactly as its header comment claims, including the VGC-257
  positional-array encoding. Leave it alone.
- **`pokemon-types-map.ts`** has exactly one importer, `src/app/api/team-graphic/route.tsx:6`
  (`runtime = "edge"`). Never client-side.
- **`moves.ts`** is lazy and compresses to 9.8 KB gzip (highly repetitive). Not worth touching
  despite being the largest file by line count.

---

## 4. Dependencies

`dependencies` (24), with `du -sh node_modules/<pkg>` for the large ones:

| Package | node_modules | Client bundle | Assessment |
|---|---|---|---|
| `@pkmn/dex` | **52 MB** | **0 KB** | Build/server only via `dex-subset.json`. Correct. |
| `posthog-js` | **39 MB** | 0 KB eager / 67.6 KB gz lazy (`2pwv7tddxbcy1.js`) | `PostHogProvider.tsx:168` does `Promise.all([import("posthog-js"), import("posthog-js/react")])` behind consent. Correct. |
| `jspdf` | **29 MB** | 0 KB eager / 130.2 KB gz lazy (`3wb7i39y47n9u.js`, shared with html2canvas) | `export-report.ts:5` `await import("jspdf")`. Correct. |
| `@clerk/nextjs` | **16 MB** | **~57 KB gz on EVERY route** | **Largest avoidable-ish shared cost — see below.** |
| `zod` | 6.2 MB | **0 KB** | Every importer is an `app/api/**/route.ts`. Server only. Correct. |
| `html2canvas-pro` | 6.1 MB | 0 KB eager | `src/lib/dynamic-imports/html2canvas.ts` memoises one `import()`. Correct. |
| `framer-motion` (via `motion`) | 5.7 MB | **37.5 KB gz on 78 of 89 routes** | **Largest app-owned client cost — see below.** |
| `@neondatabase/serverless` | 3.0 MB | 0 KB | Server only. |
| `@upstash/*` | 1.6 MB | 0 KB | Server only. |
| `motion` | 728 KB | (see framer-motion) | |
| `qrcode` | 260 KB | 0 KB eager | `OTSSheetModal.tsx:95`, `TeamOverview.tsx:402` both `import("qrcode")`. Correct. |
| `vanilla-cookieconsent` | 196 KB | in `1bghurpleveap.js` (13.5 KB gz shared) | Static in `CookieBanner.tsx:4`. Small; consent banner is above-fold-ish. Leave. |
| `@microsoft/clarity` | 36 KB | **0 KB** | Made lazy by `6cec919`. Verified: no chunk matches `clarity`. Correct. |
| `@opentelemetry/*` ×4 | — | 0 KB | In `serverExternalPackages` (next.config.ts). Correct. |
| `tweetnacl` | — | 0 KB | Webhook signature verification, server only. |

**Verdict: dependency hygiene is already good.** Every heavy optional dep is behind a dynamic
import, and `next.config.ts` correctly uses `serverExternalPackages` and
`optimizePackageImports: ["motion/react"]`. Only two deps are genuinely in the eager client graph:

#### `motion` / framer-motion — 37.5 KB gzip (114.8 KB raw), chunk `0y3cx1zi-ccxg.js`

Ships on **78 of the 89** prerendered routes: `/`, `/dashboard`, `/dashboard/profile`, `/explore`,
`/feedback`, `/changelog`, and all **72** `/champions/mega-*` SSG pages.
Absent from: `/compare`, `/dashboard/privacy`, `/champions`, `/tournaments`, `/tools/ev-to-sp`,
`/faq`, `/privacy`, `/terms`, `/support`.

12 files import `motion/react`. Features actually used are shallow — 53 `motion.div`,
9 `AnimatePresence`, 8 `motion.p`, 8 `motion.button`, 6 `motion.a`, 3 `whileTap`, 3 `variants`,
2 `useReducedMotion` — overwhelmingly entrance fades. Per-route entry points:

| Route(s) | What pulls motion in |
|---|---|
| `/` | `src/components/input/PasteInput.tsx:6` (above-the-fold, ~17 elements) |
| `/dashboard` | **only** `src/components/explore/ReportCard.tsx:4` |
| `/champions/mega-*` (72) | `MegaLandingContent.tsx:5` **and** `ReportCard.tsx:4` |
| `/explore` | 5 files (`ExploreContent`, `ExploreFilters`, `ExploreEmpty`, `ReportCard`, `SpotlightCard`) |
| `/changelog`, `/feedback`, `/dashboard/profile` | direct imports |

Two viable routes to a saving, both real:

- **Targeted CSS conversion** of `ReportCard.tsx` (one `motion.a` + `variants`, lines 163–387) and
  `MegaLandingContent.tsx` (a `width: 0 → pct%` stat bar at lines 38–43, and one `staggerChildren`
  container at lines 180–189). `src/app/globals.css` **already defines the needed utilities** —
  `@keyframes bar-fill` / `.animate-bar-fill` (lines 402, 470) and `.animate-fade-in-up` (line 443) —
  and a global `@media (prefers-reduced-motion: reduce)` block (lines 812–819) means CSS animations
  inherit reduced-motion for free. Two files remove motion from **73 routes** (72 champions + `/dashboard`).
- **`LazyMotion` + `m` migration.** `motion@12.35.2` ships `motion/react-m`, and `LazyMotion`/
  `domAnimation`/`domMax` are present in the installed `framer-motion`. Swapping the 12 files from
  `motion.*` to `m.*` under one `<LazyMotion features={domAnimation}>` keeps every animation
  verbatim and defers the feature bundle. Saving is **speculative — I did not build it** — but the
  `m` core is typically ~5–6 KB gz vs the full `motion` component, so expect **~15–25 KB gz** off all
  78 routes rather than 37.5 KB off 73.

#### `@clerk/nextjs` — ~57 KB gzip on every route, **no low-risk fix found**

`104.5 + 40.6 + 49.3 KB raw` (30.4 + 14.6 + 11.8 KB gz) sits in the 17-chunk floor, plus
`3l9gi700_gph-.js` (86.0 KB raw / 24.9 KB gz) on the three `/dashboard*` routes. Chain:
`src/app/layout.tsx:4` `<ClerkProvider>` wraps everything, and
`layout.tsx:10 PersistentNavbar → PageNavbar → Navbar` uses `SignInButton, UserButton, useAuth`
(`src/components/layout/Navbar.tsx:8`). `src/proxy.ts:1` also uses `clerkMiddleware`.

So `/terms` pays 57 KB gzip for a sign-in button. Deferring the Clerk *components* does not help,
because `useAuth` needs the provider's context at the root. A real fix means an auth-free navbar
variant for the static legal/marketing routes (`/faq`, `/privacy`, `/terms`, `/support`,
`/tournaments`, `/tools/ev-to-sp`) with `ClerkProvider` scoped to a route group. **That is a layout
re-architecture, and I am flagging the cost without recommending the change** — the saving is real
(~57 KB gz × 6 routes) but the risk is high and these are not the routes traffic lands on.

---

## 5. Next.js perf mistakes — what is actually wrong here

| Check | Finding |
|---|---|
| **`next/image`** | **0 usages**; 20 files use raw `<img>`. **This is correct and I do not recommend changing it.** Sprites are remote (`play.pokemonshowdown.com`) and `next.config.ts` sets `images: { remotePatterns: [] }` — deliberately disallowing remote optimisation. Routing ~6 sprites/report through Vercel Image Optimization would add billable transforms to already-tiny PNG/GIFs, against the cost guardrails in CLAUDE.md. `src/components/report/PokemonSprite.tsx:62–78` is textbook-correct raw `<img>`: explicit `width`/`height` (no CLS), `loading="lazy"` by default with `eager` for print/priority, `fetchPriority="high"` when priority, and an `onError` fallback chain. |
| **Fonts** | **Clean.** `next/font/google` self-hosts `Sora` + `JetBrains_Mono`, both `subsets: ["latin"]` (`layout.tsx:13–21`). Exactly 2 woff2 preloaded per document (36 KB + 40 KB). `font-mono` is used in 17 files so the second preload is justified. `6cec919` also added `<link rel="preconnect" href="https://play.pokemonshowdown.com">` for the LCP sprite path. No action. |
| **`loading` / Suspense** | `loading.tsx` exists for `/s/[id]`, `/explore`, `/dashboard`. Missing on `/compare`, `/champions/[pokemon]` (both static `○`/`●` — harmless) and on `/creator/[name]`, `/notifications`, `/dashboard/notifications` (dynamic `ƒ`). Checked the latter three: they only `await params`/`await auth()` then render a client component — no DB work to stream around. **Low value; not recommending.** |
| **`revalidate`** | Sane throughout. `champions/[pokemon]/page.tsx:15` `revalidate = 3600`; `embed/[id]/page.tsx:5` `revalidate = 600`; `sitemap.ts:9` `revalidate = 3600`; `tools/ev-to-sp` `force-static`; `force-dynamic` only on API routes that need it. No action. |
| **Waterfalling `await`s** | Two real findings — §6. |
| **`dynamic()` for heavy modals/charts** | **Already thorough — 17 `dynamic()` call sites.** `TeamReport.tsx:16–30` lazy-loads `SpeedTierChart`, `OffensiveCoverageChart`, `DefensiveCoverageChart`, `MatchupPlanSlide`, `MatchupSheet`. `page.tsx` lazy-loads `ShareModal`, `CommentSection`, `PrintableReport`, `OTSSheetModal`, `CollaboratorPanel`, `EditChangelog`, `DiffNavigator`, `DoubleTapLikeOverlay`. One gap: `src/app/dashboard/DashboardContent.tsx:11` statically imports `MatchTracker` (518 lines) and renders it unconditionally below the fold at line 418. |
| **`experimental.optimizePackageImports`** | Set to `["motion/react"]` only. Nothing else in the dep list is a barrel-file problem. The local `src/components/ui/icons.tsx` barrel is 333 lines / 13 KB and tree-shakes fine. No action. |

---

## 6. Server-side findings on `/s/[id]` — the most-shared route in the product

`/s/[id]` is dynamic (`ƒ`) so it has no row in §1, but it is where shared links land.

### S1 — the same two queries run twice per request (no `cache()` anywhere in the repo)

`generateMetadata` (`src/app/s/[id]/page.tsx:25–27`) runs:
```
sql`SELECT data, is_public, is_unlisted FROM shares WHERE id = ${id} …`
sql`SELECT user_name FROM collaborators WHERE share_id = ${id} …`
```
and the page component (`:166–169`) runs the **same two queries again** (plus `created_at, updated_at`).
Both correctly use `Promise.all`, so it is 2 round trips each — but **4 where 2 would do**.

Next.js dedupes `fetch()`, **not** raw `@neondatabase/serverless` `sql` tagged templates.
`grep -rn "\bcache("` across `src/` returns nothing, so React `cache()` is unused repo-wide.
Wrapping a `getShare(id)` helper in `cache()` collapses this to 2 queries. Zero KB, but it halves
DB round trips on the hottest dynamic route — and Neon is on the 512 MB free tier with latency that
shows up directly in TTFB.

### S2 — the client-side redirect doubles the critical path (real, but with a genuine SEO tradeoff)

`src/app/s/[id]/page.tsx` renders `<ShareRedirectClient to={`?s=${id}`} …/>`, and
`src/app/s/[id]/redirect.tsx:9–11` does `useEffect(() => router.replace(to))`. So a shared-link visitor:

1. loads the `/s/[id]` document (4 DB queries per S1) → sees a spinner,
2. downloads + hydrates that route's JS,
3. client-navigates to `/` → **now** starts on `/`'s 1125.1 KB raw / 341.7 KB gz bundle,
4. then lazily fetches the 317 KB raw `analyze-team` + `mega-detect` chunks,
5. then fetches the share payload.

A server `redirect()` or a 308 would remove steps 1–2 entirely. **But the client redirect is
deliberate**: an HTTP redirect means `/s/[id]` emits no HTML, losing the JSON-LD `CreativeWork`
block (`:180+`) and the crawlable `<h1>` (`redirect.tsx:17`) that the code comments specifically
call out. This is a speed-vs-SEO decision for a human, not a safe refactor — **I am flagging it,
not recommending it.** UA-sniffing in `src/proxy.ts` to serve crawlers HTML and users a 308 would
work but is fragile.

### S3 — `champions/[pokemon]` sequential queries (low value, noted for completeness)

`getTeamsForPokemon` (`src/app/champions/[pokemon]/page.tsx:136` then `:153`) awaits the `shares`
query, then awaits a `reactions` query that needs `shareIds` from the first. The dependency is
inherent; it could collapse into one query with a `LATERAL` join. **But the page is SSG with
`revalidate = 3600`, so this only affects ISR regeneration latency, never a visitor's TTFB.**
Low priority — included only so it is not re-reported as a finding later.

---

## 7. Conflict risk (from `.swarm/main-changed-files.md`)

Branch is 0 ahead / 0 behind `origin/main`; churn counted over the last 30 commits.

| File a recommendation touches | Touches | Conflict risk |
|---|---|---|
| `src/app/page.tsx` | 4 | **HIGH** |
| `src/components/report/PokemonDetailSlide.tsx` | 3 | **HIGH** |
| `src/app/champions/[pokemon]/MegaLandingContent.tsx` | 2 | **MEDIUM** |
| `src/components/compare/CompareContent.tsx` | 0 | LOW |
| `src/components/input/PasteInput.tsx` | 0 | LOW |
| `src/components/explore/ReportCard.tsx` | 0 | LOW |
| `src/lib/utils/translate-move.ts`, `src/lib/data/move-names.ts` | 0 | LOW |
| `src/app/s/[id]/page.tsx` | 0 | LOW |
| `src/app/dashboard/DashboardContent.tsx` | 0 | LOW |
| `src/lib/__tests__/homepage-eager-imports.test.ts` | 0 | LOW |

Note `src/lib/i18n/*` is **not** on the churn list, so the move-names fix is clear of contention.

---

## 8. Ranked recommendations (KB gzip saved ÷ risk)

Risk weights: Low = 1, Medium = 2, High = 3.

### R1 — Lazy-load `pokemon.ts` + `mega-detect` on `/compare` · **70.3 KB gz** · risk Medium · score **35.2**

- **Change:** apply the `415a281` pattern to `/compare`. Replace the four static imports at
  `CompareContent.tsx:5, 6, 20` with `await import("@/lib/analysis/analyze-team")` /
  `import("@/lib/utils/mega-detect")` inside the paste/select handlers, holding results in state.
  Then **add `components/compare/CompareContent.tsx` to `EAGER_HOMEPAGE_FILES`** in
  `src/lib/__tests__/homepage-eager-imports.test.ts` so it cannot regress.
- **Files:** `src/components/compare/CompareContent.tsx`, `src/lib/__tests__/homepage-eager-imports.test.ts`
- **Saving:** **70.3 KB gzip / 317.2 KB raw**, measured, off `/compare`'s first paint
  (336.0 → ~265.7 KB gz). Takes `/compare` from #2 heaviest to roughly #9.
- **Risk Medium:** a 537-line component moves from sync to async derivation, same as `useTeamReport`
  did. Low conflict risk (0 churn). `/compare` is `robots: { index: false }`, so no SEO exposure.

### R2 — De-motion `ReportCard` + `MegaLandingContent` · **37.5 KB gz × 73 routes** · risk Low-Med · score **25.0**

- **Change:** replace `ReportCard.tsx`'s single `motion.a` + `variants` (lines 163–387) with
  `.animate-fade-in-up` + an inline `animationDelay`, and `MegaLandingContent.tsx`'s stat bar
  (lines 38–43) with the existing `.animate-bar-fill` utility plus its stagger container
  (lines 180–189) with per-index `animation-delay`. Both utilities already exist in
  `src/app/globals.css` (lines 402/443/470) and the global reduced-motion block (lines 812–819)
  covers them automatically.
- **Files:** `src/components/explore/ReportCard.tsx`, `src/app/champions/[pokemon]/MegaLandingContent.tsx`
- **Saving:** **37.5 KB gzip / 114.8 KB raw**, measured, off all **72** `/champions/mega-*` SSG pages
  **and** `/dashboard` — these are the SEO-critical routes (293.3 → ~255.8 KB gz).
- **Risk Low-Medium:** purely visual; two animations per file; `MegaLandingContent.tsx` is
  **MEDIUM conflict-risk** (2 touches). Worth a `ui-checklist-reviewer` pass per CLAUDE.md.

### R3 — Gate `MOVE_NAMES` behind a non-English check · **46.1 KB gz** · risk Medium · score **23.1**

- **Change:** stop `src/lib/utils/translate-move.ts` statically importing `move-names.ts`. Mirror
  what `src/lib/i18n/index.ts:26–32` already does: keep `translateMove` synchronous, but populate
  the lookup `Map` from a `import("@/lib/data/move-names")` fired by `I18nProvider` only when the
  active language ≠ `en`. English sessions then pay 0 KB and skip the ~900-entry
  `normalizeMoveName` init loop entirely.
- **Files:** `src/lib/utils/translate-move.ts`, `src/lib/i18n/index.ts` (+ a vitest beside it per CLAUDE.md)
- **Saving:** **46.1 KB gzip / 111.1 KB raw** off every report view for English users, plus the
  module-init CPU. This is a **lazy-path** saving — it does **not** change any §1 first-paint number,
  which is why it ranks below R1/R2 despite the largest raw KB.
- **Risk Medium:** 5 call sites render move names synchronously; non-English users will briefly see
  English names before the table resolves. Needs a deliberate decision that the flash is acceptable
  (it is strictly better than today for the 6 languages' *first* paint too). Low conflict risk.
- **Supersedes the perf half of VGC-158** — do this independently of decomposition.

### R4 — De-motion `PasteInput` · **37.5 KB gz on `/`** · risk Medium · score **18.8**

- **Change:** convert `PasteInput.tsx`'s ~17 `motion.*` elements (35 references; e.g. lines 253–369,
  all `initial`/`animate` opacity+translate fades with `delay`) to the existing
  `.animate-fade-in-up` / `.animate-fade-in` utilities + inline `animationDelay`.
- **Files:** `src/components/input/PasteInput.tsx`
- **Saving:** **37.5 KB gzip / 114.8 KB raw** off `/` first paint (341.7 → ~304.2 KB gz), dropping `/`
  below `/compare` and `/dashboard`. This is the single largest remaining homepage win and is what
  VGC-162 *should* have asked for.
- **Risk Medium:** `PasteInput` is the homepage's above-the-fold LCP component and the conversion is
  larger than R2's. Low conflict risk (0 churn). Combined with R2, motion would remain only on
  `/explore`, `/changelog`, `/feedback`, `/dashboard/profile`.

### R5 — `dynamic()` the dashboard `MatchTracker` · **~8–12 KB gz (speculative)** · risk Low · score **~10**

- **Change:** `src/app/dashboard/DashboardContent.tsx:11` → `dynamic(() => import(…), { loading: … })`.
  It renders unconditionally below the fold at line 418 (`mt-6 sm:mt-8`), never above it.
- **Files:** `src/app/dashboard/DashboardContent.tsx`
- **Saving: speculative — I did not isolate it.** `MatchTracker.tsx` is 518 lines with no heavy
  imports, and it is bundled inside `3l9gi700_gph-.js` (86.0 KB raw / 24.9 KB gz) along with other
  dashboard code, so I could not attribute its share. **~8–12 KB gz is an estimate, not a measurement.**
- **Risk Low:** one-line change, standard pattern, 0 churn.

### R6 — `cache()` the `/s/[id]` share lookup · **0 KB JS, 4 → 2 DB queries** · risk Low

- **Change:** extract a `getShare(id)` helper wrapped in React `cache()` and call it from both
  `generateMetadata` and the page component.
- **Files:** `src/app/s/[id]/page.tsx`
- **Saving:** no bundle change; halves DB round trips per request on the most-shared route, directly
  improving TTFB. Introduces the first `cache()` usage in the repo — a pattern worth having.
- **Risk Low:** 0 churn; purely additive.

### R7 — `LazyMotion` + `m` migration · **~15–25 KB gz on 78 routes (speculative)** · risk Medium

Alternative to R2+R4 if hand-converting animations is unappealing. 12 files + one provider; keeps
every animation verbatim. **I did not build it, so the number is an estimate** based on the `m` core
being ~5–6 KB gz vs the full `motion` component. Choose R2+R4 (measured, 2–3 files, 73 routes) **or**
R7 (estimated, 13 files, 78 routes) — not both.

### Not recommended (documented so they are not re-raised)

| Item | Why not |
|---|---|
| `next/image` adoption | Deliberately avoided; `remotePatterns: []`; `PokemonSprite` already sets dimensions + lazy + fetchPriority. Would add billable Vercel image transforms. |
| VGC-162 as written | Stale — §2. The ~2 KB residual file split touches the repo's highest-churn file. |
| Scoping `ClerkProvider` off static routes | ~57 KB gz × 6 low-traffic routes, but needs a layout re-architecture + auth-free navbar. High risk, wrong routes. |
| `/s/[id]` server redirect | Real saving (a whole document + hydration), but trades the crawlable JSON-LD + `<h1>`. Human decision — §6/S2. |
| `moves.ts` (4183 lines) | Lazy and only 9.8 KB gz. Line count is misleading. |
| `pokemon-types-map.ts` (1336 lines) | Edge-route only; 0 KB client. |
| `@pkmn/dex` (52 MB) | Already fully excluded from client bundles. Verified. |
| `loading.tsx` on remaining `ƒ` routes | Those routes do no DB work to stream around. |
| `champions` sequential queries | ISR-regeneration only (`revalidate = 3600`); no visitor impact. |

### Cumulative effect of R1–R4

| Route | Now (gz) | After R1–R4 | Δ |
|---|---|---|---|
| `/` | 341.7 KB | ~304.2 KB | −37.5 |
| `/compare` | 336.0 KB | ~265.7 KB | −70.3 |
| `/champions/mega-*` ×72 | 293.3 KB | ~255.8 KB | −37.5 |
| `/dashboard` | 328.3 KB | ~290.8 KB (−~12 more with R5) | −37.5 |

Plus 46.1 KB gz off every report view (R3, lazy path). Floor stays at 248.6 KB gz — reducing that
requires the Clerk work, which is not recommended.

---

## 9. Addendum — concurrent working-tree state at report time

The build measured in §1 ran against an essentially clean tree (only `.swarm/*` was dirty at the
time). While this audit was running, other swarm agents committed nothing but left **uncommitted
edits** to several files, four of which intersect these recommendations:

| File | Working-tree diff | Effect on this report |
|---|---|---|
| `src/app/champions/[pokemon]/MegaLandingContent.tsx` | +40 / −9 | **R2 conflict risk raised MEDIUM → HIGH.** `motion/react` is still imported (line 5) and still used by two `motion.div`s, now at lines **38** and **187–196** (was 180–189). R2's substance is unchanged; rebase before editing. |
| `src/app/page.tsx` | 34 lines changed | Already HIGH. Does not affect §2's verdict — the file is still `"use client"`. |
| `src/lib/data/dex-subset.ts` | −6 | Removed an unused `asPokemonTypes` export + a type-only import. No module-boundary change. |
| `src/lib/data/pkmn-dex-fallback.ts` | +33 / −9 | Added empty-`types` guards. No module-boundary change. |

Both `dex-subset.ts` and `pkmn-dex-fallback.ts` sit on R1's import chain, but the edits are
type-correctness only — they add no imports and remove no lazy boundary, so the measured
317.2 KB raw / 70.3 KB gzip on `/compare` still stands.

**Clear of contention** (no working-tree edits, no churn in the last 30 commits), so safe to start on:
`CompareContent.tsx` (R1), `ReportCard.tsx` (R2 half), `translate-move.ts` + `i18n/index.ts` (R3),
`PasteInput.tsx` (R4), `DashboardContent.tsx` (R5), `s/[id]/page.tsx` (R6),
`homepage-eager-imports.test.ts` (R1 tripwire).
