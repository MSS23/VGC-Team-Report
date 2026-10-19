# C1 + C2 — Dead Code & TypeScript Strictness Audit

**Date:** 2026-10-19 · **Agent:** C1/C2 (combined) · **Repo:** `/home/user/VGC-Team-Report` @ `534a59b` (parity with `origin/main`)
**Mutations:** none. No source file created, edited or deleted. No git state changed. This report is the only file written.

**Measurement hygiene.** Sibling agents hold uncommitted edits in `src/lib/types/pokemon.ts`, `src/lib/parser/showdown-parser.ts`, `src/lib/data/type-chart.ts`, `src/lib/utils/type-colors.ts`, `src/components/report/TypeBadge.tsx`, `src/lib/db.ts` (+ 3 test files). A first measurement pass against the live working tree was polluted by 8 phantom `TeraType`/`PokemonType` errors from those edits. **Every number below was re-measured against a pristine `git archive HEAD` extract** (node_modules symlinked) so it reflects committed `main` only. Baseline `tsc --noEmit --incremental false` on that tree: **0 errors**.

---

## Top 5 quick wins

| # | Finding | Where | Confidence | Effort | Conflict risk |
|---|---------|-------|-----------|--------|---------------|
| 1 | Enable `noImplicitReturns` — measured at **2 errors** | `tsconfig.json` + 2 call sites | certain | ~20 min | none |
| 2 | Delete 5 unreferenced `create-next-app` leftover SVGs | `public/` | certain | ~5 min | none |
| 3 | Delete an unnecessary `as unknown as` double-cast — the key it reaches for already exists | `src/hooks/useSlideSystem.ts:56` | certain | ~2 min | none |
| 4 | Delete 2 exports with **zero** references anywhere (incl. tests) | `damage-calculator.ts:56`, `dex-subset.ts:221` | certain | ~5 min | none |
| 5 | `/tournaments` is the only sitemap page with no internal inbound link | `src/components/layout/PageFooter.tsx:10-21` | certain | ~2 min | none |

All five are independent, total under an hour, and none touches a file on the high-conflict list. They fit in one commit each and can ride the next real push.

---

## Measured strict-flag error counts

Command per flag, on the pristine HEAD tree:
`node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit --incremental false --<flag>`

| Flag | Errors | Status | Verdict |
|------|-------:|--------|---------|
| `noImplicitOverride` | **0** | already ON in `tsconfig.json` | nothing to do |
| `noFallthroughCasesInSwitch` | **0** | already ON in `tsconfig.json` | nothing to do |
| `useUnknownInCatchVariables` | **0** | already ON via `strict: true` | writing it out is a no-op |
| `noImplicitReturns` | **2** | **OFF** | **free win — enable (finding 1)** |
| `exactOptionalPropertyTypes` | **74** | OFF | tractable, staged (finding 8) |
| `noUncheckedIndexedAccess` | **392** | OFF | not worth it (finding 11) |
| `noPropertyAccessFromIndexSignature` | **681** | OFF | do not enable (finding 12) |

The three zero-error flags are not new wins — `tsconfig.json` already carries a VGC-261 comment block recording that they were measured clean on 2026-08-10. **This audit re-confirms all three still measure 0 at `534a59b`.** The only genuinely free flag left is `noImplicitReturns`.

`verbatimModuleSyntax` (noted as deliberately OFF in `tsconfig.json`) was not in the candidate list and was not measured.

---

## Part 1 — Dead code

### Finding 1 — `noImplicitReturns` is 2 errors away from free
*(listed here because it is the single highest value-for-effort item in the whole audit; detail in Part 2, finding 6)*

---

### Finding 2 — Five `create-next-app` leftover SVGs in `public/`

| | |
|---|---|
| **Files** | `public/next.svg` (1375 B), `public/vercel.svg` (128 B), `public/file.svg` (391 B), `public/globe.svg` (1035 B), `public/window.svg` (385 B) |
| **Confidence** | **certain** |
| **Effort** | ~5 min |
| **Conflict risk** | none |

Each was grepped across `src/`, `public/manifest.json`, `public/sw.js`, `public/robots.txt`, `next.config.ts` and `docs/`. **Zero references for all five.** Every other asset in `public/` resolves to at least one real consumer:

```
favicon.svg            <- src/app/layout.tsx, public/manifest.json, public/sw.js
apple-touch-icon.png   <- src/app/layout.tsx, public/sw.js
og-default.png         <- src/app/layout.tsx
icon-192.png           <- src/app/layout.tsx, public/manifest.json, public/sw.js
icon-512.png           <- src/components/seo/JsonLd.tsx, src/app/layout.tsx, manifest, sw.js
icon-{192,512}-maskable.png <- public/manifest.json
favicon.ico            <- src/app/layout.tsx
screenshots/*.png      <- public/manifest.json:58-61 (PWA install dialog)
```

Byte savings are trivial (3.3 KB). The reason to act is different: `next.svg` and `vercel.svg` are **third-party brand marks being served from `pokemonvgcteamreport.com`**. They are scaffolding residue from `create-next-app`, the same batch as the README that commit `55d5510` already replaced. Finishing that cleanup is the point.

---

### Finding 3 — Two exports with zero references repo-wide

| | |
|---|---|
| **Files** | `src/lib/analysis/damage-calculator.ts:56` (`getCalcSpecies`), `src/lib/data/dex-subset.ts:221` (`asPokemonTypes`) |
| **Confidence** | **certain** |
| **Effort** | ~5 min (7 lines total) |
| **Conflict risk** | none (neither file is on the high-conflict list) |

Word-boundary grep across `src/`, `cypress/` and `scripts/` returns exactly one hit each — the definition itself. No test imports them either, so this is not "tested code":

```
$ grep -rnw getCalcSpecies src cypress scripts
src/lib/analysis/damage-calculator.ts:56:export function getCalcSpecies(regulation?: string): string[] {

$ grep -rnw asPokemonTypes src cypress scripts
src/lib/data/dex-subset.ts:221:export function asPokemonTypes(types: string[]): PokemonType[] {
```

`getCalcSpecies` is **new since the 2026-08-10 scan** — it arrived with `src/lib/analysis/damage-calculator.ts` and was never wired up. It builds a sorted species-name list from `Generations.get(...)`, presumably intended for an autocomplete in the damage-calc UI that shipped using a different source.

`asPokemonTypes` is a three-line `as` cast helper (`return types as PokemonType[]`) and is a **repeat finding** — flagged in `.swarm/c1-dead-code-10-08-26.md` as Tier-2 item 6 with the advice "fold into the next real change to that file rather than spending a build on it." That advice still holds; the only change is that it now has company, so the two together are worth one small commit. `dex-subset.ts` has had no other dead-code churn, so this is a clean 2-line diff plus a 5-line diff.

---

### Finding 4 — `/tournaments` has no internal inbound link

| | |
|---|---|
| **File** | `src/components/layout/PageFooter.tsx:10-21` (the `as const` link array) |
| **Confidence** | **certain** on the fact; **needs-human-check** on whether it is intentional |
| **Effort** | ~2 min (one array entry) |
| **Conflict risk** | none |

`src/app/sitemap.ts` declares 13 URL patterns. `PageFooter` links 10 of them; the remaining two (`/feedback`, `/creator/*`, `/s/*`, `/champions/*`) are covered by the feedback callout, creator cards and report cards. **`/tournaments` is linked from nowhere in the app** — the only occurrence of the string is `src/app/sitemap.ts:19`, at `priority: 0.7, changeFrequency: "weekly"`.

This is explicitly *not* a dead-route recommendation: the page carries `SportsEvent` JSON-LD (per `changelog/data.ts` v5.16) and is an intentional SEO landing page, exactly like the `/champions/[pokemon]` cluster. **Do not delete it.** The finding is the inverse — it is an orphan in the internal link graph, which is the same problem the footer comment at `PageFooter.tsx:12-14` records solving for `/champions` ("It was reachable only from the top nav, so the cluster had no sitewide footer link at all"). Adding `{ href: "/tournaments", label: "Tournaments" }` applies the fix that was already reasoned through for the neighbouring cluster.

Flagging as needs-human-check only because the omission could be deliberate (e.g. the tournament list is stale and nobody wants traffic on it). If so, the honest fix is to drop it from the sitemap instead.

---

### Finding 5 — `@pkmn/dex` is a build-time-only dependency sitting in `dependencies`

| | |
|---|---|
| **File** | `package.json` (`dependencies`) |
| **Confidence** | **certain** on the facts; **needs-human-check** on the action |
| **Effort** | ~10 min + a full verification cycle |
| **Conflict risk** | **HIGH CONFLICT RISK** — `package.json` is modified by several open PRs |

There is still **no runtime import of `@pkmn/dex` anywhere in `src/`**. The only real import in the repo is the build-time generator:

```
$ grep -rn "from ['\"]@pkmn/dex" src scripts cypress
scripts/build-dex-subset.mjs:48:import { Dex } from "@pkmn/dex";
src/lib/data/dex-subset.ts:34: *  ... can still `import { Dex } from "@pkmn/dex"` directly — only the   ← comment
```

`src/lib/data/pkmn-dex-fallback.ts:12-17` documents the design explicitly: the client reads the pre-extracted `dex-subset.json` (~127 KB raw / ~32 KB gzipped), and the full package is "~1.8MB raw / ~350KB gzipped" and deliberately not shipped. The package is only needed when someone runs `npm run generate:move-names`-style regeneration.

Moving it to `devDependencies` takes ~1.8 MB out of the production install graph and off every Vercel install step. **This is a repeat of finding 8 in `.swarm/c1-dead-code-10-08-26.md`, still unactioned after two months** — which suggests either it was judged not worth the risk, or it keeps getting lost. Either is worth resolving once, explicitly.

⚠️ Two reasons to hold: (a) `package.json` is on the high-conflict list, so this will fight several open PRs — land it *after* they merge, not before; (b) it is the kind of change that only fails at install time on Vercel, not in local `tsc`/`vitest`/`next build`, so it needs a real preview deploy to verify, not just the pre-commit gate.

---

### Verified NOT dead — recorded so the next scan does not re-litigate

**Module reachability is clean.** A full import graph (resolving `@/*`, relative paths, `index.*`, `.json`, and `next/dynamic`'s `import("…")` form) seeded from every App Router entry point — all `page`/`layout`/`route`/`loading`/`error`/`global-error`/`not-found`/`template`/`default`/`sitemap`/`opengraph-image` files under `src/app`, plus `src/instrumentation.ts` and `src/proxy.ts` — reaches **321 of 381** modules. The 60 unreached are **all** test files. **Zero orphaned non-test files.** There are no dead components, no dead subtrees, no dead routes.

> Method note: a first pass reported 39 false positives because the import regex missed the `import("…")` call form. After fixing it, `src/components/ui/ShareModal.tsx`, `src/lib/analysis/*`, the six non-English `src/lib/i18n/translations/*.ts` files and the rest all resolved as live via `next/dynamic` and the locale loader map at `src/lib/i18n/index.ts:25`. Any future scan that reports those as dead has the same bug.

| Item | Why it's live |
|---|---|
| `src/lib/utils/version-diff.ts` — `parseSectionKey:83`, `sectionKeyLabel:119`, `sectionKeySlide:148`, `SectionKey:32` | **Not dead.** All three are called by `getNavigableChanges` (lines 360-367) in the same module, and are additionally exported so `__tests__/version-diff.test.ts` can test them directly. That is a test-visibility export over live internal code — the legitimate pattern, not dead code. `encodeSectionKey` is the half with external callers (`TeamOverview.tsx`, `CalcsPanel.tsx`, `NotesPanel.tsx`, `PokemonDetailLayout.tsx`). |
| `src/lib/rate-limit.ts:84` — `isRateLimited` | Production-dead (every caller uses `isRateLimitedAsync`), but **still kept alive by `src/lib/__tests__/rate-limit.test.ts`**, which is the only coverage of the in-memory sliding-window logic. Unchanged from the 2026-08-10 analysis, and that report's recommendation stands: retarget the test at `isRateLimitedAsync` first, *then* drop the sync export. Behaviour-preserving refactor, needs a human to sign off the coverage swap. Not re-ticketed here. |
| `src/lib/i18n/index.ts` | Imported as `@/lib/i18n` (directory index) by 20+ components. A naive orphan check that only tries `@/lib/i18n/index` will misreport it. |
| `src/lib/templates.ts` | Live via `getTemplate` → `src/hooks/useHomePage.ts:27`. `REPORT_TEMPLATES`/`ReportTemplate` are internal-only exports (see below), but the file stays. |
| `src/app/q/[id]/` | No static link exists by design — the URL is minted server-side at `src/app/api/quick-share/route.ts:25` (`` `/q/${id}` ``) and handed to the client. |
| `src/app/champions/[pokemon]/` | SEO-critical SSG cluster (75 pages via `generateStaticParams`). Never dead. |
| All `src/app/api/**/route.ts` | Every route has callers. The 6 routes added since the last scan (`/api/collaboration/[id]`, `/api/import/limitless`, `/api/quick-share`, `/api/quick-share/[id]/claim`, `/api/user/preferences`, `/api/user/push`) are all wired. External-by-design endpoints (`/api/bot`, `/api/oembed`, `/api/webhooks/*`) and `vercel.json` cron targets remain correctly caller-free. |
| `src/lib/data/__validate-mega-coverage.ts` | Dynamically imported at `src/instrumentation.ts`. The `__` prefix makes it look orphaned; it is not. |
| `scripts/*.mjs` | Build-time generators (`generate-move-names` is an npm script; `build-dex-subset`, `generate-og-default`, `generate-maskable-icon` are one-shot asset/data generators). Invoked by hand, not imported. Not dead. |
| Prior Tier-1 findings | **All actioned.** `src/components/display/DisplayTogglePill.tsx`, `src/lib/hooks/useGlobalDisplayPrefs.ts`, `src/components/providers/ConsentGate.tsx` are gone; `getRegMBMegas` is gone; the stale `/api/builder/` CORS exemption in `src/proxy.ts` is gone (replaced by an explanatory `NOTE:` at line 86). Nothing to re-report. |

### Internal-only exports — still NOT recommended

22 symbols in `src/lib`/`src/components` are `export`ed but referenced only inside their own defining file: `TeamCombination`, `HowToStep`, `SportsEventData`, `BreadcrumbItem`, `FAQItem`, `PdfExportProps`, `AccentTheme`, `SpreadBenchmark`, `ThreatCell`, `VersionDiffState`, `CHAMPIONS_MB_DEX`, `CHAMPIONS_MC_DEX`, `DexSubsetMegaStone`, `MoveCategory`, `MoveFlag`, `MoveData`, `NatureData`, `ChronologicalCursor`, `NotificationType`, `flushServerEvents`, `generateCsrfToken`, `PrivateField`, `SerializedGamePlanSchema`, `SerializedMatchupPlanSchema`, `ReportTemplate`, `REPORT_TEMPLATES`, `ImportSource`, `migrateCalcEntries`, `replaceSpeciesInBlock`, `SpeedTierForm`, `GlobalFieldKey`, `LegalitySeverity`.

**Do not act on these.** Zero bytes saved (every one is used; tree-shaking already handles them), several are legitimately public API (prop types of exported components, shapes of exported data), and it is exactly the drive-by refactor `CLAUDE.md` forbids. This is the same conclusion as the 2026-08-10 scan; it is reproduced only so the list is not mistaken for new signal. Three of them (`SpreadBenchmark`, `ThreatCell`, `CHAMPIONS_MB_DEX`/`CHAMPIONS_MC_DEX`) are new since that scan and fall in the same bucket — `CHAMPIONS_M{B,C}_DEX` are consumed by `getChampionsDex` at `champions-dex.ts:326-327`, and `champions-legality.ts` is on the high-conflict list, so leave them alone.

---

## Part 2 — TypeScript strictness

### Headline: production code has no `any` at all

```
$ grep -rnE '(:|<|as )\s*any\b' src --include=*.ts --include=*.tsx
src/app/api/share/[id]/__tests__/route.test.ts:22: * ... Routes by query text: any   ← prose in a comment
```

**One hit in the entire tree, and it is an English word in a docblock.** Zero explicit `any` in production or test code. Zero `@ts-ignore`, `@ts-expect-error` or `@ts-nocheck`. Implicit `any` is impossible by construction: `strict: true` is on, `noImplicitAny` with it, and baseline `tsc` is 0 errors. The 11 `eslint-disable` comments are all `@next/next/no-img-element` (deliberate, for OG/canvas rendering) or `react-hooks/exhaustive-deps` — none suppress a type rule.

This part of the brief has effectively nothing to report, and that is the finding. Everything below is a narrower soundness concern, not an `any` problem.

---

### Finding 6 — Enable `noImplicitReturns` (2 errors) ← quick win 1

| | |
|---|---|
| **Files** | `tsconfig.json`; `src/components/ui/NotificationBell.tsx:78`, `src/hooks/useShareUrl.ts:159` |
| **Confidence** | **certain** (measured) |
| **Effort** | ~20 min incl. the cold type gate |
| **Conflict risk** | none — neither file is on the high-conflict list, and `tsconfig.json` is not either |

Both errors are `TS7030: Not all code paths return a value`, and both are the same shape: a `useEffect` whose `if` branch returns a cleanup function while another path falls off the end returning `undefined`.

```
src/components/ui/NotificationBell.tsx(78,13): error TS7030: Not all code paths return a value.
src/hooks/useShareUrl.ts(159,13): error TS7030: Not all code paths return a value.
```

`NotificationBell.tsx:78` — the `if (open)` branch ends `return () => cancelAnimationFrame(id);`; the `if (wasOpenRef.current)` branch below it falls through with no return.
`useShareUrl.ts:159` — `if (shareId && !isAuthLoaded) return;` returns bare early, while the effect's main path returns a cleanup.

**Honest framing: neither is a bug.** React accepts a conditional cleanup, and both read as intentional. The fix is two explicit `return undefined;` statements (or restructuring the branches), which is why this is a ~20-minute job rather than a 2-minute one.

The value is not in the two sites, it is in the guarantee. `noImplicitReturns` does catch real bugs in non-React code — a `switch`/`if` chain over regulation strings or stat names that silently returns `undefined` on an unhandled branch is precisely the failure mode this repo's domain logic is full of opportunities for (`spreadRules`, `getChampionsDex`, `detect-regulation`, `sectionKeySlide`). At 2 errors, buying that guarantee is as cheap as it will ever be. It also matches the `tsconfig.json` precedent set by VGC-261: measure a flag, verify it clean, turn it on, record the measurement in the comment block.

Suggested commit: add `"noImplicitReturns": true` into the VGC-261 block in `tsconfig.json`, fix the two sites, and extend the comment to record the 2026-10-19 measurement (including that the other three candidates re-measured 0 and that the remaining three are deliberately off with their counts). That last part is cheap documentation that stops this audit being re-run from scratch next month.

---

### Finding 7 — An `as unknown as` double-cast that is no longer needed ← quick win 3

| | |
|---|---|
| **File** | `src/hooks/useSlideSystem.ts:56` |
| **Confidence** | **certain** |
| **Effort** | ~2 min, 1 line |
| **Conflict risk** | none |

```ts
(t as unknown as Record<string, string | undefined>).commonModesTitle ?? "Common Modes",
```

The cast exists to read a key the `TranslationKeys` type supposedly does not have. **It does have it** — `src/lib/i18n/translations/en.ts:196` reads `commonModesTitle: "Common Modes",`, and `TranslationKeys` is derived from `en`. The key was added at some point after the cast was written, and nobody went back.

The whole line collapses to `t.commonModesTitle,` — type-safe, and the `?? "Common Modes"` fallback becomes dead too (the i18n Proxy at `src/lib/i18n/index.ts:78-87` already falls back to English for empty stubs in the six non-English locales, so the inline default was never the mechanism doing that work).

This is the cheapest strictness win in the repo: one line, removes a double-cast, no behaviour change, no test change.

---

### Finding 8 — `exactOptionalPropertyTypes` (74 errors) is tractable and worth staging

| | |
|---|---|
| **Confidence** | **certain** on the count; **needs-human-check** on scheduling |
| **Effort** | 1-2 days, naturally splittable |
| **Conflict risk** | **HIGH CONFLICT RISK** for one slice — 10 of the 74 are in `src/components/home/HomePageClient.tsx`, which sits next to `src/hooks/useHomePage.ts` and `src/app/page.tsx` on the high-conflict list |

74 errors, and the distribution is the interesting part: **1 in tests, 9 in `src/lib` non-test, 64 elsewhere** (UI components and API routes). Almost every one is the same diagnostic family:

```
Type 'string | undefined' is not assignable to type 'string'.   (20 occurrences)
Type 'boolean | undefined' is not assignable to type 'boolean'. (13 occurrences)
Types of property 'regulation' are incompatible.                 (8 occurrences)
```

That is the classic `{ foo?: string }` vs `{ foo: string | undefined }` distinction: code is spreading or assigning an explicit `undefined` into a slot declared optional. The `regulation` cluster is the one worth a human eye — `regulation?: string` threads through `stat-calculator`, `spread-builder`, `threat-matrix`, `damage-calculator` and `champions-legality`, and whether "absent" and "explicitly undefined" mean the same thing for regulation detection is a **domain** question, not a typing one. Given CLAUDE.md's note that Champions M-A/M-B/M-C are nested supersets with M-C current, getting that distinction right has real behavioural stakes.

Recommended shape if ticketed: **do the 9 `src/lib` errors first as a standalone commit** (that is where the domain logic lives, it is the smallest slice, and none of those 9 files is on the high-conflict list), leave the flag off, and only flip it once the UI slice lands. Do not attempt the `HomePageClient.tsx` slice until the open PRs merge.

This is the only OFF flag besides `noImplicitReturns` that I would put a ticket behind.

---

### Finding 9 — `src/lib/analysis` exports leak inferred third-party types, and one widens a literal union

| | |
|---|---|
| **Files** | `src/lib/analysis/spread-builder.ts:8,9,15,44`, `src/lib/analysis/threat-matrix.ts:31,43`, `src/lib/analysis/damage-calculator.ts:34` |
| **Confidence** | **probable** (the `spreadRules` half is certain) |
| **Effort** | ~1-2 h |
| **Conflict risk** | none — these files are not on the high-conflict list |

313 exported functions across `src` have no explicit return type. The overwhelming majority are React components and App Router handlers where the inferred type is correct and annotating is noise — **not worth a ticket**. 23 are in `src/lib`, and 7 of those are in the `src/lib/analysis` modules added since the last scan, where it actually matters:

```
src/lib/analysis/spread-builder.ts:8   arrow    spreadTotal
src/lib/analysis/spread-builder.ts:9   function spreadRules
src/lib/analysis/spread-builder.ts:15  function spreadStats
src/lib/analysis/spread-builder.ts:44  function evaluateSpread
src/lib/analysis/threat-matrix.ts:31   function findCoverageGaps
src/lib/analysis/threat-matrix.ts:43   function defensiveWeaknesses
src/lib/analysis/damage-calculator.ts:34 function calculateReportDamage
```

Two concrete problems, not stylistic:

**(a) `spreadRules` widens a literal union to `string` — certain.**

```ts
export function spreadRules(regulation?: string) {
  return isChampionsFormat(regulation) ? { max: 32, total: 66, step: 1, unit: "SP" } : { max: 252, total: 510, step: 4, unit: "EVs" };
}
```

With no annotation, `unit` infers as `string`, not `"SP" | "EVs"`. Every consumer — `SpreadBuilder.tsx` interpolates `rules.unit` into eight user-facing strings and an `aria-valuetext` — loses the ability to switch exhaustively on it, and a typo'd third unit would compile. Annotating the return type as `{ max: number; total: number; step: number; unit: "SP" | "EVs" }` (or deriving it from a declared interface) restores that. This is the SP-vs-EV distinction CLAUDE.md calls out as the core domain split, so having it typed as bare `string` at the boundary is the wrong default.

**(b) `spreadStats` re-exports a `@smogon/calc` internal type across a module boundary — probable.**

```ts
export function spreadStats(pokemon: ParsedPokemon, spread: StatSpread, regulation?: string) {
  return createCalcPokemon({ ...pokemon, evs: spread }, regulation).rawStats;
}
```

The return type is whatever `@smogon/calc`'s `Pokemon.rawStats` happens to be. That type is now part of this module's public contract without anyone declaring it, so a `@smogon/calc` minor bump can silently reshape `spreadStats`, `evaluateSpread` and everything downstream in `SpreadBuilder.tsx` with no local diff to review. Annotating as `StatSpread` (the repo's own type) pins the boundary and makes a future upstream change fail at `spread-builder.ts` instead of somewhere in the UI.

I would ticket **(a)** on its own as a small, well-defined fix and fold **(b)** into it. I would not ticket the other 290 missing annotations.

---

### Finding 10 — `SpreadBuilder.tsx` uses 9 non-null assertions on two lines because its state is a loose union

| | |
|---|---|
| **File** | `src/components/report/SpreadBuilder.tsx:52-53` |
| **Confidence** | **certain** on the smell; **probable** that it is currently safe |
| **Effort** | ~1 h |
| **Conflict risk** | none |

There are only **30 non-null assertions in all of `src`**, which is healthy. But 9 of them — nearly a third — sit on two lines of one file:

```
:52  outcome.before![s]  outcome.stats![s]  (×6 across the cell + delta expressions)
:53  outcome.wasted![s]  (×2 + the filter predicate)
```

The cause is the shape returned by the `useMemo` at `SpreadBuilder.tsx:30-32`: the success path returns `{ result, stats, before, wasted }` and the `catch` returns `{ error }`. TypeScript unions those into one object type with every property optional, so even inside the `{outcome.stats && …}` and `{outcome.wasted && …}` guards it cannot see that the siblings are present together.

**They are guarded, so this is not a live crash** — hence "probable that it is currently safe". The problem is that the guard and the assertion are decoupled: anyone editing the JSX inside `{outcome.stats && …}` to also read `outcome.before` gets no help from the compiler, and the `!` pattern is now established in the file as the way to do it. Modelling the memo result as a discriminated union (`{ ok: true; result; stats; before; wasted } | { ok: false; error: string }`) makes all 9 assertions unnecessary and the guards load-bearing.

Worth one ticket mainly because it is a *new* file (added since the last scan) establishing a pattern, and it is cheaper to correct now than after it is copied. The other 21 assertions are spread thinly and are mostly idiomatic (`groups.get(key)!` right after a `set`, `LANGUAGES.find(…)!` over a closed `as const` list) — not worth touching. Two that a human may want to glance at, neither ticket-worthy on its own: `src/app/api/cron/weekly-report/route.ts:22` (`apiKey!` on an env var) and `src/lib/db.ts:4` (`process.env.DATABASE_URL!` — **currently being edited by a sibling agent, excluded from this audit**).

---

### Finding 11 — `src/components/report/CommonModesSlide.tsx` routes 12 i18n keys around the type system

| | |
|---|---|
| **Files** | `src/components/report/CommonModesSlide.tsx:108` + `src/lib/i18n/translations/en.ts` |
| **Confidence** | **certain** |
| **Effort** | ~1 h |
| **Conflict risk** | none (neither file is on the high-conflict list) |

```ts
const tr = (key: string, fallback: string): string => {
  const dict = t as unknown as Record<string, string | undefined>;
  return dict[key] ?? fallback;
};
```

The docblock above it says this is temporary — "The Integrate phase adds the commonModes i18n keys to every translation file. Until then `t` … doesn't statically know every key across all locales." Partially done: `commonModesTitle` and `commonModesEmpty` **are** now in `en.ts` (lines 196, 202), so those two `tr()` calls no longer need the escape hatch.

The remaining 12 distinct keys are genuinely absent from `en.ts` and therefore from `TranslationKeys`:

`commonCombinationsTitle`, `commonCombinationsDesc`, `addCombination`, `removeCombination`, `combinationLeads`, `combinationBack`, `combinationStrategy`, `combinationStrategyPlaceholder`, `combinationLabel`, `legacyNotesTitle`, `legacyLeadsLabel`, `legacyModesLabel`

23 `tr(...)` call sites across the file read them. Because the lookup is `Record<string, string|undefined>`, **a typo in any of those 23 key strings silently renders the fallback instead of failing the build** — and the fallbacks are the real English copy, so it would look correct in English and go blank-ish in the other six locales. That is a quiet production-copy bug waiting to happen, and it is the actual cost of the double-cast.

Fix: add the 12 keys to `en.ts`, delete the `tr` helper and the cast, and use `t.<key>` directly. The six non-English files need no edit — the Proxy at `src/lib/i18n/index.ts:78-87` already falls back to English for missing or empty-string values, which is exactly the case these 12 keys are in. Once done, a mistyped key is a compile error.

This is the same cluster as finding 7 (`useSlideSystem.ts:56`); the two are the only `as unknown as` casts in production UI code, both for the same reason. If both are fixed, the only remaining production double-casts are `src/lib/data/dex-subset.ts:105` (packed-JSON decode, documented and correct) and `src/app/api/webhooks/clerk/route.ts:46` (external webhook payload — unavoidable at a trust boundary).

---

### Finding 12 — Flags not worth enabling

**`noUncheckedIndexedAccess` — 392 errors. Do not enable.**
Split: **106 in test files, 33 in `src/lib` non-test, 253 elsewhere.** Hotspots are `src/lib/parser/__tests__/showdown-parser.test.ts` (40), `src/app/api/share/route.ts` (22), `src/app/api/user/analytics/route.ts` (16), `src/lib/analysis/__tests__/threat-matrix.test.ts` (15). The dominant diagnostic is `Type 'undefined' is not assignable to type 'string'` on `rows[0]`-style SQL result access and `Type 'undefined' is not assignable to type 'ParsedPokemon'` on team-array indexing.

The flag is theoretically right — `rows[0]` on an empty result really is `undefined`, and VGC-195's DB repair notes in `.swarm/drafts/` suggest that class of bug has bitten before. But 392 errors across 100+ files is a multi-week change that would conflict with essentially every open PR, and more than a quarter of the work is appeasing test files that index into fixtures they just constructed. **Not a ticket.** If the underlying concern is worth addressing, the targeted version is a typed `queryOne`/`queryRows` helper in `src/lib/db.ts` that returns `T | undefined` explicitly — which gets most of the safety for a fraction of the diff, and can be done incrementally. (Note `src/lib/db.ts` is under active sibling edit right now.)

**`noPropertyAccessFromIndexSignature` — 681 errors. Do not enable, and do not re-measure.**
Concentrated in `src/app/api/webhooks/posthog/route.ts` (46), `src/lib/utils/normalize-report.ts` (42), `src/app/api/share/route.ts` (32), `src/app/api/explore/route.ts` (32), `src/app/api/user/analytics/route.ts` (31), `src/lib/utils/diff-state.ts` (30), `src/app/api/creator/[name]/route.ts` (26), `src/app/s/[id]/page.tsx` (22).

This flag is purely stylistic — it forces `obj["key"]` instead of `obj.key` wherever a type has an index signature. It would rewrite 681 property accesses to bracket syntax across the codebase's entire data-shuttling layer, buying **zero** additional type safety (both forms are already checked identically). It is the highest-cost, lowest-value flag of the seven. Recording the number so nobody spends an evening measuring it again.

---

## Summary of recommendations

| Rank | Finding | Effort | Conflict risk | Ticket? |
|---:|---|---|---|---|
| 1 | Enable `noImplicitReturns` + fix 2 sites + record measurements in `tsconfig.json` | ~20 min | none | yes |
| 2 | Delete 5 `create-next-app` leftover SVGs from `public/` | ~5 min | none | yes (fold into 1 or 4) |
| 3 | `useSlideSystem.ts:56` — drop the unnecessary double-cast | ~2 min | none | fold into 11 |
| 4 | Delete `getCalcSpecies` + `asPokemonTypes` | ~5 min | none | yes |
| 5 | Add `/tournaments` to the footer link array | ~2 min | none | yes (small) |
| 6 | `src/lib` slice of `exactOptionalPropertyTypes` (9 errors) | ~half day | low for the `src/lib` slice | yes |
| 7 | `CommonModesSlide` — add 12 i18n keys, delete the `tr` escape hatch | ~1 h | none | yes |
| 8 | `spreadRules` return type (`unit: "SP" \| "EVs"`) + annotate 6 sibling exports | ~1-2 h | none | yes |
| 9 | `SpreadBuilder.tsx` — discriminated union, removes 9 `!` | ~1 h | none | maybe |
| 10 | `@pkmn/dex` → `devDependencies` | ~10 min + preview deploy | **HIGH** (`package.json`) | yes, **after** open PRs merge |
| — | `exactOptionalPropertyTypes` UI slice (64 errors) | ~1 day | **HIGH** (`HomePageClient.tsx`) | defer |
| — | `isRateLimited` retarget-then-remove | ~1 h | none | pre-existing, not re-ticketed |
| — | `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature` | weeks | **HIGH** | **no** |

Items 1-5 are a single sub-hour session with no conflict exposure. Items 6-9 are each a self-contained ticket. Item 10 is blocked on the open PRs, not on uncertainty.

Given the repo already carries 70 backlog tickets, the defensible set is **items 1, 4, 5, 7 and 8** — five tickets, each with a concrete file:line and a bounded diff. Items 2 and 3 are too small to track and should ride along with 1 and 7 respectively.
