# C1 — Dead Code Scan (read-only)

**Date:** 2026-10-26
**Agent:** C1 (overnight audit swarm)
**Repo:** `/home/user/VGC-Team-Report` @ branch `swarm-nightly-2026-10-26` (cut from `origin/main` 68796c5)
**Scope:** unused exports across all of `src/`, orphaned components, dead routes (page + API), unused `package.json` dependencies, plus file-local dead code surfaced by ESLint.
**Mutations made:** none. No source file was edited, created or deleted; no git state-changing command was run. This report file is the only write.

---

## Method

Four independent passes, cross-checked:

1. **Module reachability graph.** Built the real import graph (resolving `@/*`, relative paths, `index.ts`, `.json`, static `import()` and `require()`), seeded from every Next.js entry point under `src/app` (`page`/`layout`/`route`/`sitemap`/`not-found`/`error`/`global-error`/`loading`/`template`/`default`/`opengraph-image`) plus `src/instrumentation.ts` and `src/proxy.ts`. Script: `/tmp/.../scratchpad/graph.mjs`.
2. **Export inventory + per-symbol ripgrep.** Extracted all 682 exported symbols from every non-test `.ts`/`.tsx`/`.mts` in `src/` and ran a word-boundary fixed-string `rg` for each across `src/`, `cypress/`, `scripts/`, `public/`, `next.config.ts`, `vitest.config.ts`, `cypress.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `vercel.json`, `package.json`. Hits in the defining file were separated from external hits, and external hits were split into production vs. test/cypress so test-only symbols surface as *production-dead* rather than being silently counted as live. Script: `exports.mjs`.
3. **Route pass.** Every `src/app/**/route.ts` and `**/page.tsx` mapped to its URL with dynamic segments wildcarded (so `/api/share/${id}/versions` matches `/api/share/[id]/versions`), then grepped for callers. Cross-checked against `src/app/sitemap.ts` and `src/components/layout/*`. Script: `routes.mjs`.
4. **Dependency pass + ESLint.** Each `package.json` dependency grepped as a quoted import specifier (bare-word fallback for config-only references). Script: `deps.mjs`. Then `node node_modules/eslint/bin/eslint.js .` for file-local dead code the cross-file passes structurally cannot see.

**Graph trustworthiness.** `rg 'import\(\s*`' src` returns **zero** hits — there is no template-literal or variable module resolution anywhere in `src`. All 7 `next/dynamic` call sites use static string literals. So nothing can hide from the graph. The graph correctly resolved `src/lib/data/__validate-mega-coverage.ts` as **live** via the dynamic `await import("./lib/data/__validate-mega-coverage")` at `src/instrumentation.ts:14`, and correctly kept every `next/dynamic` target alive (e.g. `InlineDamageCalculator` via `CalcsPanel.tsx:12`).

**Headline result:** 380 code files, **321 reachable from production entry points, 59 unreachable — and all 59 are test files.** There are **zero orphaned files** and **zero dead routes** in this repo. The previous scan's three whole-file findings (`DisplayTogglePill.tsx`, `useGlobalDisplayPrefs.ts`, and the third) have all been deleted; `src/components/display/` and `src/lib/hooks/` no longer exist. The remaining dead code is all **sub-file**: dead symbols inside live files.

---

## Summary table

| # | Finding | File:line | LOC | Rank | conflict_risk |
|---|---------|-----------|-----|------|---------------|
| 1 | `CATEGORY_I18N` + `SORT_I18N` + `PLACEMENT_I18N` — three superseded const maps | `src/components/explore/ExploreFilters.tsx:57-62, 65-70, 73-78` | 18 | SAFE_TO_DELETE | **true** |
| 2 | `toBase64Url()` — module-local, superseded; test keeps its own copy | `src/lib/sharing/url-codec.ts:77-83` | 7 | SAFE_TO_DELETE | false |
| 3 | `PRIORITY_LABELS` — module-local const, never read | `src/lib/discord-bot.ts:50-55` | 6 | SAFE_TO_DELETE | false |
| 4 | `asPokemonTypes()` — exported, zero call sites (+ now-unused type import) | `src/lib/data/dex-subset.ts:220-223` & `:38` | 5 | SAFE_TO_DELETE | false |
| 5 | `getCalcSpecies()` — exported, zero call sites | `src/lib/analysis/damage-calculator.ts:56-58` | 3 | SAFE_TO_DELETE | false |
| 6 | `type EventType` — module-local type alias, never referenced | `src/lib/data/tags.ts:33` | 1 | SAFE_TO_DELETE | false |
| 7 | `displayData` — dead computed local | `src/components/report/PokemonCard.tsx:180` | 1 | SAFE_TO_DELETE | **true** |
| 8 | `exportMenuOpen`/`setExportMenuOpen` — dead `useState` | `src/components/layout/Navbar.tsx:202` | 1 | SAFE_TO_DELETE | **true** |
| 9 | `useTranslation()` call + import, `t` never used | `src/components/explore/SpotlightCard.tsx:4, 28` | 2 | SAFE_TO_DELETE | **true** |
| 10 | 6 unused imports / destructured bindings (token-level) | see §SAFE-10 | ~2 | SAFE_TO_DELETE | mixed |
| 11 | `isRateLimited()` — legacy sync shim, production-dead (test-only) | `src/lib/rate-limit.ts:84-90` | 7 | PROBABLY_DEAD | false |
| 12 | `onResultChange` prop — passed but never consumed (**may be a wiring bug**) | `src/components/report/MatchupPlanSlide.tsx:406, 432, 447` | 3 | PROBABLY_DEAD | **true** |
| 13 | `selectedTemplate`/`onTemplateSelect` props — passed but never consumed (**may be a wiring bug**) | `src/components/input/PasteInput.tsx:90-91, 120` | 3 | PROBABLY_DEAD | **true** |
| 14 | `category` prop on `CollapsibleCalcGroup` — declared, never read | `src/components/report/pokemon-detail/CalcEntryGroup.tsx:187` | 1 | PROBABLY_DEAD | **true** |
| 15 | `hiddenSlides` option — declared, passed, never read | `src/hooks/useSlideSystem.ts:13, 34` | 2 | PROBABLY_DEAD | false |
| 16 | 3 hand-run SQL migrations, referenced by no code | `src/lib/db/migrations/*.sql` | 3 files | PROBABLY_DEAD | false |
| 17 | ~44 redundant `export` modifiers (symbol used locally — **do not delete the symbol**) | see §REDUNDANT-EXPORTS | 0 | PROBABLY_DEAD | mixed |

**SAFE_TO_DELETE total: ~46 LOC** across 10 findings. No whole files, no routes, no dependencies.

---

## SAFE_TO_DELETE — per-finding evidence

### SAFE-1 · `CATEGORY_I18N`, `SORT_I18N`, `PLACEMENT_I18N` — `src/components/explore/ExploreFilters.tsx:57-62, 65-70, 73-78` · 18 LOC · `conflict_risk: true`

Three `Record<…, string>` maps of i18n *key names*. They were superseded by inline object literals that reference the translated values directly (`t.filterCatAll`, …) further down the same file. The maps are now write-only.

```
$ rg -c -w -F CATEGORY_I18N src cypress scripts
src/components/explore/ExploreFilters.tsx:1
$ rg -c -w -F SORT_I18N src cypress scripts
src/components/explore/ExploreFilters.tsx:1
$ rg -c -w -F PLACEMENT_I18N src cypress scripts
src/components/explore/ExploreFilters.tsx:1
```

One hit each = the declaration line only. ESLint agrees:

```
src/components/explore/ExploreFilters.tsx:57:7  'CATEGORY_I18N' is assigned a value but never used.
src/components/explore/ExploreFilters.tsx:65:7  'SORT_I18N' is assigned a value but never used.
src/components/explore/ExploreFilters.tsx:73:7  'PLACEMENT_I18N' is assigned a value but never used.
```

Proof the replacement is the live path — the same i18n keys are consumed 50 lines lower:

```
$ rg -n -w "filterCatAll|filterSortPopular|filterPlace1st" src/components/explore/ExploreFilters.tsx
58:  all: "filterCatAll",             <- dead map
66:  popular: "filterSortPopular",    <- dead map
74:  "1st": "filterPlace1st",         <- dead map
111:    all: t.filterCatAll,          <- LIVE
117:    popular: t.filterSortPopular, <- LIVE
123:    "1st": t.filterPlace1st,      <- LIVE
```

**Do not also delete** the sibling `CATEGORY_KEYS` (56), `SORT_KEYS` (64) and `PLACEMENT_KEYS` (72) — those are live (ESLint does not flag them). **Do not touch the i18n translation keys** themselves; all 7 locale files still need `filterCatAll` etc. for the live path at :111-123.

### SAFE-2 · `toBase64Url()` — `src/lib/sharing/url-codec.ts:77-83` · 7 LOC · `conflict_risk: false`

Module-local (not exported) base64url encoder. Nothing in the module calls it; its sibling `fromBase64Url` (85-95) *is* live.

```
$ rg -n -w toBase64Url src cypress scripts
src/lib/sharing/url-codec.ts:77:function toBase64Url(bytes: Uint8Array): string {
src/lib/sharing/__tests__/url-codec.test.ts:12:function toBase64Url(bytes: Uint8Array): string {
src/lib/sharing/__tests__/url-codec.test.ts:36:  return "1:" + toBase64Url(new Uint8Array(compressed));
src/lib/sharing/__tests__/url-codec.test.ts:43:  return "1:" + toBase64Url(new Uint8Array(compressed));
src/lib/sharing/__tests__/url-codec.test.ts:154:      const encoded = toBase64Url(original);
```

The four test hits are the test file's **own private copy** declared at `url-codec.test.ts:12` — it is not imported from `url-codec.ts` (the symbol isn't exported, so it could not be). Deleting the source copy therefore cannot break the test. ESLint confirms: `src/lib/sharing/url-codec.ts:77:10 'toBase64Url' is defined but never used.`

### SAFE-3 · `PRIORITY_LABELS` — `src/lib/discord-bot.ts:50-55` · 6 LOC · `conflict_risk: false`

Emoji priority-label map, never read. Its siblings `TYPE_EMOJI` (43-48) and the colour map above it are live.

```
$ rg -n -w -F PRIORITY_LABELS src cypress scripts
src/lib/discord-bot.ts:50:const PRIORITY_LABELS: Record<number, string> = {
```

Single hit = declaration only. `src/lib/discord-bot.ts:50:7 'PRIORITY_LABELS' is assigned a value but never used.`

### SAFE-4 · `asPokemonTypes()` — `src/lib/data/dex-subset.ts:220-223` (+ import at `:38`) · 5 LOC · `conflict_risk: false`

An exported identity cast helper with zero call sites anywhere.

```
$ rg -n "CalcSpecies|asPokemonTypes|calcSpecies" src cypress scripts docs .github public
src/lib/data/dex-subset.ts:221:export function asPokemonTypes(types: string[]): PokemonType[] {
src/lib/analysis/damage-calculator.ts:56:export function getCalcSpecies(regulation?: string): string[] {
```

The declaration is the only occurrence of the name in the repo. The reachability graph agrees the symbol has no importers (the *file* is live via other exports — `allMegaStones`, `getSpecies`, `getMegaStone`).

**Collateral:** `PokemonType` is imported at `:38` solely for this function —

```
$ rg -n -w PokemonType src/lib/data/dex-subset.ts
38:import type { PokemonType } from "@/lib/types/pokemon";
45:  /** Types as strings — narrowed to PokemonType at the consumer boundary. */   <- comment only
220:/** Narrow a string[] of types to the typed PokemonType union. */              <- comment only
221:export function asPokemonTypes(types: string[]): PokemonType[] {
222:  return types as PokemonType[];
```

Lines 45 and 220 are comments, so after deleting 220-223 the `import type` at :38 must go too or `tsc` will not complain but ESLint will. Delete both: 5 LOC.

### SAFE-5 · `getCalcSpecies()` — `src/lib/analysis/damage-calculator.ts:56-58` · 3 LOC · `conflict_risk: false`

Exported species-name list builder, zero call sites (same `rg` as SAFE-4 above — the declaration is the only hit in `src/`, `cypress/`, `scripts/`, `docs/`, `.github/`, `public/`).

It is the **last** declaration in the file (file is 58 lines), so the deletion is a clean tail truncation. No collateral: `Generations` and `isChampionsFormat` each have 6 total references in the file and stay live via `createCalcPokemon` (:15) and `calculateReportDamage` (:34).

### SAFE-6 · `type EventType` — `src/lib/data/tags.ts:33` · 1 LOC · `conflict_risk: false`

```
$ rg -c -w -F EventType src cypress scripts
src/lib/data/tags.ts:1
```

Declaration only. Note it is **not exported** (`type EventType = …`, unlike its neighbours `export type Archetype` / `export type Regulation` which are live), which is why ESLint can see it: `src/lib/data/tags.ts:33:6 'EventType' is defined but never used.` The underlying `EVENT_TYPES` const (26-30) is exported and live — delete only the type alias.

### SAFE-7 · `displayData` — `src/components/report/PokemonCard.tsx:180` · 1 LOC · `conflict_risk: true`

`const displayData = showMega ? megaData : effectiveBaseData;` — computed and never read. Its siblings `displayAbility` (172) and `displayStats` (177) are live. `src/components/report/PokemonCard.tsx:180:9 'displayData' is assigned a value but never used.`

### SAFE-8 · `exportMenuOpen` / `setExportMenuOpen` — `src/components/layout/Navbar.tsx:202` · 1 LOC · `conflict_risk: true`

A whole dead `useState` pair: `const [exportMenuOpen, setExportMenuOpen] = useState(false);`. Neither half is referenced. The export menu was evidently reworked into the overflow menu and this state was left behind.

```
src/components/layout/Navbar.tsx:202:10  'exportMenuOpen' is assigned a value but never used.
src/components/layout/Navbar.tsx:202:26  'setExportMenuOpen' is assigned a value but never used.
```

Deleting it also removes one `useState` call per Navbar render.

### SAFE-9 · dead `useTranslation()` in `SpotlightCard` — `src/components/explore/SpotlightCard.tsx:4, 28` · 2 LOC · `conflict_risk: true`

```
$ rg -n "useTranslation|\bt\." src/components/explore/SpotlightCard.tsx
4:import { useTranslation } from "@/lib/i18n";
28:  const { t } = useTranslation();
```

`t` is never dereferenced anywhere in the file (`src/components/explore/SpotlightCard.tsx:28:11 't' is assigned a value but never used.`). Both lines go; this also drops a context subscription from a card rendered in a carousel.

### SAFE-10 · unused imports and destructured bindings (token-level) · ~2 LOC

All six are ESLint `no-unused-vars` findings verified to have no other reference in their file. These are token removals inside otherwise-live lines, except the two marked *(whole line)*.

| Binding | File:line | conflict_risk |
|---|---|---|
| `auth` (from `import { auth, currentUser }`) | `src/app/api/user/profile/route.ts:4` | false |
| `UserButton` (from `import { UserButton, Show, SignInButton, useUser }`) | `src/app/dashboard/DashboardContent.tsx:8` | **true** |
| `UserButton` (from `import { UserButton, Show, SignInButton }`) | `src/app/dashboard/profile/page.tsx:9` | **true** |
| `type SearchCategory` (from `import { ExploreFilters, type SearchCategory }`) | `src/components/explore/ExploreContent.tsx:13` | **true** |
| `import Link from "next/link";` *(whole line)* | `src/components/home/HomePageClient.tsx:8` | **true** |
| `summarizeChangedFields` (from the `version-diff` import) + `megaStates` (destructured from `useHomePage`, :158) | `src/components/home/HomePageClient.tsx:54, 158` | **true** |

Note `SearchCategory` is still **exported and live** from `ExploreFilters.tsx` (used by `ExploreFilters` itself) — only `ExploreContent`'s import of it is dead.

---

## PROBABLY_DEAD — needs a human glance

### PD-11 · `isRateLimited()` — `src/lib/rate-limit.ts:84-90` · 7 LOC · `conflict_risk: false`

Production-dead: the only references in the entire repo are its declaration and its own test file.

```
$ rg -n -w isRateLimited src --glob '!**/__tests__/**' --glob '!**/*.test.*'
src/lib/rate-limit.ts:84:export function isRateLimited(
```

Zero self-use, zero production callers. All 16 other hits are in `src/lib/__tests__/rate-limit.test.ts`, which imports it at line 2 and exercises it in 5 `it()` blocks. Everything in production uses the async sibling instead:

```
$ rg -c -w isRateLimitedAsync src
src/lib/security/api-guard.ts:2
src/lib/rate-limit.ts:2
src/app/api/feedback/route.ts:2
src/app/api/quick-share/route.ts:2
(+ 2 test files)
```

**Why a human decides:** the function's own docblock says *"Synchronous in-memory rate limiter (legacy API). Kept for backward compatibility — prefer isRateLimitedAsync."* — it is deliberately retained, under the banner comment `── Public API (unchanged signature) ──`. Deleting it also means deleting or rewriting all 5 tests in `rate-limit.test.ts`, which currently are the only coverage of the shared `isRateLimitedInMemory` fallback path that `isRateLimitedAsync` uses when Upstash is unconfigured. **Recommendation: either keep it, or delete it and re-point the test at `isRateLimitedAsync` so the in-memory fallback stays covered.** Do not delete the tests outright.

### PD-12 · `onResultChange` — `src/components/report/MatchupPlanSlide.tsx:406, 432, 447` · 3 LOC · `conflict_risk: true`

```
$ rg -n -w onResultChange src --glob '!**/__tests__/**'
src/components/report/MatchupPlanSlide.tsx:406:   onResultChange={(result) => onGamePlanResultChange(plan.id, gp.id, result)}
src/components/report/MatchupPlanSlide.tsx:432:   onResultChange: (result: GameResult) => void;
src/components/report/MatchupPlanSlide.tsx:447:   onResultChange,
```

The parent passes a real handler (406) that calls `onGamePlanResultChange`, the child's props type declares it (432) and the child destructures it (447) — **and then never calls it.** `src/components/report/MatchupPlanSlide.tsx:447:3 'onResultChange' is defined but never used.`

**This is more likely a wiring bug than dead code.** The user-facing symptom would be *"per-game W/L result does not save in a matchup game plan."* Deleting the three lines would also orphan `onGamePlanResultChange` and silently cement the broken behaviour. Hand this to whoever owns the match-tracker feature before anyone deletes it; if the feature is genuinely cut, the removal spans the parent handler too.

### PD-13 · `selectedTemplate` / `onTemplateSelect` — `src/components/input/PasteInput.tsx:90-91, 120` · 3 LOC · `conflict_risk: true`

```
$ rg -n -w selectedTemplate src --glob '!**/__tests__/**'
src/components/home/HomePageClient.tsx:778:   selectedTemplate={pendingTemplateId}
src/components/input/PasteInput.tsx:90:   selectedTemplate?: string;
src/components/input/PasteInput.tsx:120: export function PasteInput({ …, selectedTemplate, onTemplateSelect }: PasteInputProps) {
```
(identical shape for `onTemplateSelect` → `HomePageClient.tsx:779`)

Same pattern as PD-12: `HomePageClient` wires both props (778-779) and `PasteInput` destructures and ignores both. Symptom would be *"template picker selection has no effect in the paste box."* Deleting these would orphan `pendingTemplateId`/`setPendingTemplateId` in `HomePageClient` and the `getTemplate`/`REPORT_TEMPLATES` path in `src/lib/templates.ts` would lose its only UI entry point. **Treat as a possible feature regression first, dead code second.**

### PD-14 · `category` prop on `CollapsibleCalcGroup` — `src/components/report/pokemon-detail/CalcEntryGroup.tsx:187` · 1 LOC · `conflict_risk: true`

Declared in the destructure and never read (`…CalcEntryGroup.tsx:187:3 'category' is defined but never used.`). Only one call site (`CalcsPanel.tsx:11` imports it), so removal is a two-file edit. Lower risk than PD-12/13 because `cfg` carries the category config that is actually used — but confirm the caller isn't relying on `category` for a key/label it meant to show.

### PD-15 · `hiddenSlides` option on `useSlideSystem` — `src/hooks/useSlideSystem.ts:13, 34` · 2 LOC · `conflict_risk: false`

```
$ rg -n hiddenSlides src/hooks/useSlideSystem.ts
13:  hiddenSlides: Set<string>;      <- SlideSystemOptions declaration
34:    analysis, speciesKeys, plans, hiddenSlides,   <- destructured, never read
```

`src/hooks/useSlideSystem.ts:34:35 'hiddenSlides' is assigned a value but never used.` The hook instead uses the `isHidden`/`toggleSlide` callbacks it also receives, so the raw Set is redundant. Three touch points: the option type (13), the destructure (34), and the caller at `src/hooks/useHomePage.ts:514`. Low risk, but it is a (private) hook signature change, so flagging for a glance rather than calling it safe.

### PD-16 · hand-run SQL migrations — `src/lib/db/migrations/*.sql` · 3 files · `conflict_risk: false`

```
src/lib/db/migrations/add-species-column.sql    (305 B)
src/lib/db/migrations/add-unlisted-column.sql    (88 B)
src/lib/db/migrations/drop-species-column.sql   (795 B)
```

No code references the directory or any of the three filenames:

```
$ rg -n "migrations|add-species-column|drop-species-column|add-unlisted-column" src scripts .github package.json
src/lib/db/migrations/drop-species-column.sql:3:-- …added in add-species-column.sql to back…
.github/pull_request_template.md:23:<!-- …New env vars, migrations, etc. … -->
```

The only cross-reference is one `.sql` file citing another in a comment. `/api/migrate` does **not** read them — they are applied by hand against Neon. `add-species-column.sql` + `drop-species-column.sql` are an add-then-revert pair, so that column no longer exists. **These are an operational log, not code.** They cost nothing to keep and carry schema history; I would leave them. Listed only so the next scan does not re-raise them as a "finding".

### REDUNDANT-EXPORTS (PD-17) · ~44 symbols · **do not delete the symbols**

44 symbols are exported but imported by nothing — *and are used inside their own defining file.* The dead part is the `export` keyword, not the code. Removing `export` tightens the module surface and lets `tsc`/ESLint catch future rot; **deleting the symbol would break its own file.** Zero LOC saved, so this is hygiene, not cleanup. I am recording the list explicitly because a naive "unused export" tool will report these as deletable and someone will believe it.

Verified-local examples (total `rg -c -w` hit count ≥ 2, all hits inside the defining file):

`CHAMPIONS_MB_DEX`, `CHAMPIONS_MC_DEX` (`src/lib/data/champions-dex.ts:296, 318` — **definitely keep**: MB is spread into MC at :319 and both are returned by `getChampionsDex` at :326-327, i.e. the Reg M-B/M-C legality path), `WALKTHROUGH_STEPS` (`useWalkthrough.ts:16` → used :189), `REPORT_TEMPLATES` (`templates.ts:13` → used :61), `generateCsrfToken` (`security/csrf.ts:17` → used :49), `flushServerEvents` (`posthog-server.ts:56` → used :44), `evictStoredDraft` (`useTeamReport.ts:31` → used :67, :166), `migrateCalcEntries` (`normalize-report.ts:10` → used :103), `replaceSpeciesInBlock` (`paste-edit.ts:59` → used :97), `SerializedGamePlanSchema` / `SerializedMatchupPlanSchema` (`url-codec.schemas.ts:30, 36` → used :40, :92), `parseFiltersFromUrl` / `buildUrlSearch` (`useExploreUrlSync.ts:52, 78` → used :106, :119), `isDynamicAllowedOrigin` (`security/cors.ts:39` → used :47, :66), `getGenThemedSpriteUrls` (`sprite-url.ts:66` → used :154-155), `SectionKey` / `parseSectionKey` / `sectionKeyLabel` / `sectionKeySlide` (`version-diff.ts:32, 83, 119, 148` → all used :357-405).

Plus these export-only-redundant **types/interfaces** (each used as a local annotation in its own file): `ChangelogItem`, `TeamCombination`, `HowToStep`, `SportsEventData`, `BreadcrumbItem`, `FAQItem`, `PdfExportProps`, `ChampionsSampleTeam`, `IndyTopCutEntry`, `DraftSaveResult`, `SyncStatus`, `DamageCalcsMap`, `FilterState`, `GamePlanSlots`, `ViewMode`, `AccentTheme`, `SpreadBenchmark`, `ThreatCell`, `VersionDiffState`, `DexSubsetMegaStone`, `MoveCategory`, `MoveFlag`, `MoveData`, `NatureData`, `ChronologicalCursor`, `NotificationType`, `PrivateField`, `ReportTemplate`, `ImportSource`, `SpeedTierForm`, `ProgressiveSpriteUrls`, `GlobalFieldKey`, `LegalitySeverity`.

---

## FRAMEWORK_ENTRY / externally invoked — look unused, are NOT dead. Do not re-report.

| Item | Why it has zero inbound references |
|---|---|
| `src/app/api/bot/route.ts` → `/api/bot` | Discord **interaction endpoint**; Discord calls it. `tweetnacl` signature verification lives here. |
| `src/app/api/oembed/route.ts` → `/api/oembed` | **oEmbed** provider; polled by Discord/Slack/Twitter unfurlers. Its own comment at :45 says so. |
| `src/app/api/webhooks/clerk/route.ts` | Clerk **webhook** target. |
| `src/app/api/webhooks/linear/route.ts` | Linear **webhook** target. (Per CLAUDE.md, the Linear-webhook-fix P0 is stale/merged — not re-verified.) |
| `src/app/api/webhooks/posthog/route.ts` | PostHog **webhook** target. |
| `src/app/api/cron/{daily-ops,weekly-report,weekly-digest,posthog-errors}/route.ts` | Invoked by **Vercel cron** (`vercel.json`), never by `src/`. |
| `src/app/api/{cleanup,setup,migrate,keep-alive}/route.ts` | Operational endpoints hit manually / by schedule. |
| `src/app/q/[id]/page.tsx` → `/q/[id]` | Reached via the URL the API *returns*: `src/app/api/quick-share/route.ts:25` → `url: /q/${id}`. Never a static `href`. |
| `src/lib/data/__validate-mega-coverage.ts` | Live via the dynamic `await import(…)` at `src/instrumentation.ts:14` (build-time Mega-coverage gate). |
| `src/app/s/[id]/redirect.tsx` | Not a Next.js convention file — a plain client component imported at `src/app/s/[id]/page.tsx:5` as `ShareRedirectClient`. |
| `src/lib/i18n/translations/{fr,it,es,ja,ko,zh}.ts` | Default exports loaded by the lazy map at `src/lib/i18n/index.ts:26-32`. `en.ts` is additionally imported statically. |
| `src/components/report/{InlineDamageCalculator,SpreadBuilder,ThreatMatrix}.tsx`, `src/components/home/HomePageClient.tsx` | Default exports consumed through `next/dynamic` (e.g. `CalcsPanel.tsx:12`). |
| `generateStaticParams`, `generateMetadata`, `metadata`, `revalidate`, `dynamic`, `runtime`, `alt`, `size`, `contentType`, all `export default` in `page/layout/route/sitemap/opengraph-image/loading/error/not-found/global-error/template` | Next.js App Router entry points. |
| `src/app/dashboard/notifications/` **and** `src/app/notifications/` | **Not duplicates.** Different pages that happen to share a component filename: `/dashboard/notifications` (95 LOC) is the notification **preferences** form (`BrowserPushSettings`, `/api/user/preferences`); `/notifications` (341 LOC) is the **activity feed** (`useNotifications`, grouping, Load More). `diff` of the two `NotificationsContent.tsx` files is 428 lines — effectively nothing in common. Each has exactly one inbound link: `DashboardContent.tsx:154` and `NotificationBell.tsx:183` respectively. |
| `/compare` absent from `sitemap.ts` | **Deliberate** — it is `robots: { index: false }`; `src/app/sitemap.ts:21-23` carries an explicit "do not re-add" comment (VGC-272). Not a dead route. |

### Unused dependencies: none

All 31 `package.json` `dependencies` resolve to at least one real import in `src/`, `scripts/` or `next.config.ts`. The four `@opentelemetry/*` packages look config-only at first glance but are genuinely imported — `src/instrumentation.ts:1-4` and `src/app/api/views/[shareId]/route.ts:5` (`SeverityNumber`); their appearance in `next.config.ts:27-30` is the required `serverExternalPackages` declaration. Lowest-usage-but-live: `@neondatabase/serverless`, `@upstash/ratelimit`, `cheerio`, `jspdf`, `posthog-node`, `tweetnacl` (one import each).

---

## Recommended deletion order

Ordered so each step is independently committable and the type/test gate stays green throughout. Per CLAUDE.md, run `verification-gate` (cold `tsc --noEmit --incremental false` + vitest + `next build`) after each step, and `ui-checklist-reviewer` on any step touching `.tsx`.

1. **Step 1 — pure `src/lib` leaf deletions (zero conflict risk, zero UI).** SAFE-5 `getCalcSpecies`, SAFE-4 `asPokemonTypes` + its `PokemonType` import, SAFE-3 `PRIORITY_LABELS`, SAFE-2 `toBase64Url`, SAFE-6 `EventType`. **22 LOC, 5 files, no `.tsx`.** Nothing imports any of these, so nothing else can break. Do this first and commit it alone — it is the one batch that needs no judgement.
2. **Step 2 — token-level unused imports/bindings (SAFE-10).** Purely additive-safe; ESLint will confirm the file is clean afterwards. Keep `src/app/api/user/profile/route.ts` (no conflict risk) in the same commit as the four churned files, or split it out if you want the risky files isolated.
3. **Step 3 — the three single-line UI deletions.** SAFE-7 `displayData`, SAFE-8 `exportMenuOpen` useState, SAFE-9 SpotlightCard `useTranslation`. All three are in files on the churn list (`conflict_risk: true`), so land them **after** steps 1-2 and rebase before starting. Run `ui-checklist-reviewer`.
4. **Step 4 — SAFE-1, the `ExploreFilters` i18n maps.** Biggest single win (18 LOC) but the highest-churn file of the set, and it needs care to delete the three `*_I18N` maps while keeping `CATEGORY_KEYS`/`SORT_KEYS`/`PLACEMENT_KEYS` and all the locale keys. Do it last among the safe work, in its own commit, so a conflict here does not block steps 1-3.
5. **Then stop and escalate, do not delete:** PD-12 (`onResultChange`) and PD-13 (`selectedTemplate`/`onTemplateSelect`) first — these look like **unwired features**, and the right fix is probably to *call* the handler, not to remove it. File a ticket each rather than deleting. Afterwards PD-14, PD-15 and PD-11 as low-priority hygiene (PD-11 only together with re-pointing `rate-limit.test.ts` at `isRateLimitedAsync` so the in-memory fallback keeps coverage). Leave PD-16 (SQL migration log) alone. PD-17 is an `export`-keyword cleanup only — **never** delete those symbols.

**Net from steps 1-4: ~46 LOC across 13 files, no behaviour change.** This repo is in good shape: no dead files, no dead routes, no unused dependencies.
