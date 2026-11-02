# C1 — Dead Code Scan (read-only)

**Date:** 2026-11-02
**Agent:** C1 (overnight audit swarm)
**Repo:** `/home/user/VGC-Team-Report` @ `10dfd74` (merge of VGC-230/231/233/235) — the last code commit. A concurrent swarm agent committed `f73802c` (run notes only) and added a `zod` entry to `overrides` in `package.json` while this scan ran; neither affects any finding below (`@pkmn/dex` is still in `dependencies`).
**Prior run:** `.swarm/c1-dead-code-26-10-26.md` @ `68796c5`
**Scope:** unused exports in `src/`, orphaned components, dead routes, unused files, unused npm dependencies.
**Mutations made:** none. No source file edited, created or deleted; no git state-changing command run. This report file is the only write.

---

## Method

Four cross-checked passes. Scripts in the session scratchpad (`graph.mjs`, `exports.mjs`, `routes.mjs`).

1. **Module reachability graph.** Real import graph resolving `@/*`, relative paths, `index.*`, `.json`, static `import()` and `require()`, seeded from every Next.js convention file under `src/app` (`page`/`layout`/`route`/`template`/`default`/`loading`/`error`/`global-error`/`not-found`/`sitemap`/`robots`/`manifest`/`opengraph-image`/`twitter-image`/`icon`/`apple-icon`), plus `src/instrumentation.ts`, `src/proxy.ts`, and anything referenced from `cypress/`, `scripts/` or the root configs.
2. **Export inventory + per-symbol ripgrep.** 746 exported symbols extracted from all 323 non-test `.ts`/`.tsx` files, each grepped word-boundary fixed-string across `src`, `cypress`, `scripts`, `public`, `docs`, `.github` and every root config. Hits split into *self* / *external-prod* / *external-test* so test-only symbols surface as production-dead rather than counting as live.
3. **Route pass.** All 80 `route.ts`/`page.tsx` mapped to URLs with dynamic segments wildcarded, then grepped for callers and cross-checked against `src/app/sitemap.ts`, `vercel.json` and `src/components/layout/*`.
4. **Dependency pass + ESLint.** Every `dependencies`/`devDependencies` entry grepped as an import specifier; then `node node_modules/eslint/bin/eslint.js .` for file-local dead code the cross-file passes structurally cannot see.

**Graph trustworthiness.** `rg 'import\(\s*[^'"'"'")\s]' src` returns **zero** hits — no template-literal or variable module resolution anywhere in `src`, so nothing can hide from the graph. An independent check (for each of the 240 files under `src/components`, `src/hooks`, `src/data`, `src/lib/utils`, `src/lib/dynamic-imports`, grep the repo for any module specifier ending in that file's stem) returned **zero** files with no importer, confirming the graph.

**Headline result:** 407 code files (323 production + 84 test). **All 323 production files are reachable. Zero orphaned files, zero dead routes, zero test-only files.** The one misclassified dependency and 5 starter assets aside, all remaining dead code is **sub-file**: dead symbols inside live files.

**The most important result of this run is a negative one:** *none* of the 10 `SAFE_TO_DELETE` findings from 26-10-26 were actioned. See **Changed since 26-10-26** for why.

---

## Summary table

| # | Finding | File:line | Rank | NEW? | conflict_risk |
|---|---------|-----------|------|------|---------------|
| 1 | 5 `create-next-app` starter SVGs, zero references repo-wide | `public/{file,globe,next,vercel,window}.svg` | SAFE_TO_DELETE | **NEW** | false |
| 2 | `CATEGORY_I18N` + `SORT_I18N` + `PLACEMENT_I18N` (18 LOC) | `src/components/explore/ExploreFilters.tsx:57,65,73` | SAFE_TO_DELETE | carried | false |
| 3 | `toBase64Url()` — module-local, superseded | `src/lib/sharing/url-codec.ts:77` | SAFE_TO_DELETE | carried | false |
| 4 | `PRIORITY_LABELS` — module-local const, never read | `src/lib/discord-bot.ts:50` | SAFE_TO_DELETE | carried | false |
| 5 | `asPokemonTypes()` + its now-unused `PokemonType` import | `src/lib/data/dex-subset.ts:221` & `:38` | SAFE_TO_DELETE | carried | false |
| 6 | `getCalcSpecies()` — exported, zero call sites | `src/lib/analysis/damage-calculator.ts:56` | SAFE_TO_DELETE | carried | false |
| 7 | `type EventType` — module-local alias, never referenced | `src/lib/data/tags.ts:33` | SAFE_TO_DELETE | carried | false |
| 8 | `displayData` — dead computed local | `src/components/report/PokemonCard.tsx:180` | SAFE_TO_DELETE | carried | false |
| 9 | `exportMenuOpen`/`setExportMenuOpen` — dead `useState` | `src/components/layout/Navbar.tsx:202` | SAFE_TO_DELETE | carried | **true** |
| 10 | dead `useTranslation()` + import, `t` never used | `src/components/explore/SpotlightCard.tsx:4,28` | SAFE_TO_DELETE | carried | false |
| 11 | unused map index `i` | `src/components/report/SpeedTierChart.tsx:583` | SAFE_TO_DELETE | **NEW** | **true** |
| 12 | 2 unused `eslint-disable-next-line` directives | `opengraph-image.tsx:146`, `HomePageClient.tsx:1693` | SAFE_TO_DELETE | **NEW** | **true** (HomePageClient) |
| 13 | 7 token-level unused imports / destructured bindings | see §SAFE-13 | SAFE_TO_DELETE | carried | mixed |
| 14 | unused `vi` import in two test files | `cron-auth.test.ts:1`, `url-codec.test.ts:1` | SAFE_TO_DELETE | **NEW** | false |
| 15 | **Whole metric-cursor API prod-dead; route has a legacy duplicate** | `src/lib/explore/chronological-cursor.ts:48,96,115` | PROBABLY_DEAD | **NEW** | **true** |
| 16 | `getRegMAMegasWithSprites()` superseded by the M-C variant | `src/lib/data/mega-pokemon.ts:987` | PROBABLY_DEAD | **NEW** | **true** |
| 17 | `syncStatus` prop — passed but never rendered (**wiring gap**) | `src/components/layout/Navbar.tsx:68,186` | PROBABLY_DEAD | **NEW** | **true** |
| 18 | `isRateLimited()` — legacy sync shim, test-only | `src/lib/rate-limit.ts:84` | PROBABLY_DEAD | carried | false |
| 19 | `onResultChange` — passed but never called (**wiring bug**) | `src/components/report/MatchupPlanSlide.tsx:456` | PROBABLY_DEAD | carried | **true** |
| 20 | `selectedTemplate`/`onTemplateSelect` — passed, never consumed | `src/components/input/PasteInput.tsx:90,91,120` | PROBABLY_DEAD | carried | **true** |
| 21 | `category` prop on `CollapsibleCalcGroup` | `src/components/report/pokemon-detail/CalcEntryGroup.tsx:187` | PROBABLY_DEAD | carried | false |
| 22 | `hiddenSlides` option — declared, passed, never read | `src/hooks/useSlideSystem.ts:13,34` | PROBABLY_DEAD | carried | **true** |
| 23 | 3 hand-run SQL migrations referenced by no code | `src/lib/db/migrations/*.sql` | PROBABLY_DEAD — **keep** | carried | false |
| 24 | ~50 redundant `export` modifiers (**do not delete the symbols**) | see §REDUNDANT-EXPORTS | PROBABLY_DEAD | carried | mixed |

**SAFE_TO_DELETE: 14 items — 5 whole files (3.3 KB) + ~48 LOC.** No dead routes. One misclassified dependency.

---

# Confirmed dead (safe to delete)

Ranked by confidence, then value.

### SAFE-1 · 5 `create-next-app` starter SVGs — `public/` · **NEW** · `conflict_risk: false`

The only whole-file deletions this run. These are the stock Next.js scaffold assets; nothing has ever referenced them.

```
$ for f in file.svg globe.svg next.svg vercel.svg window.svg; do
    rg -n --fixed-strings "$f" . --glob '!node_modules' --glob '!.next' \
       --glob '!package-lock.json' --glob '!.git'; done
(no output for any of the five)
```

Zero hits repo-wide — not in `src/`, not in `public/manifest.json`, not in `public/sw.js`'s precache list, not in `next.config.ts`. For contrast, every asset that *is* in use shows up:

```
$ for f in $(find public -type f); do echo "$(rg -l -F "$(basename $f)" src public next.config.ts vercel.json | grep -v "^$f$" | wc -l)  $f"; done
0  public/file.svg          <- dead
0  public/globe.svg         <- dead
0  public/next.svg          <- dead
0  public/vercel.svg        <- dead
0  public/window.svg        <- dead
2  public/favicon.ico
3  public/favicon.svg
5  public/manifest.json
4  public/sw.js
4  public/icon-512.png
...
```

Sizes: `file.svg` 391 B, `globe.svg` 1035 B, `next.svg` 1375 B, `vercel.svg` 128 B, `window.svg` 385 B — **3314 B, 5 files.** Highest-confidence deletion in this report: whole files, no code to re-check, no conflict risk, and they ship to the CDN today.

### SAFE-2 · `CATEGORY_I18N`, `SORT_I18N`, `PLACEMENT_I18N` — `src/components/explore/ExploreFilters.tsx:57, 65, 73` · 18 LOC · carried · `conflict_risk: false`

Three `Record<…, string>` maps of i18n *key names*, superseded by inline literals 50 lines lower that reference the translated values directly. Write-only.

```
$ rg -c -w "CATEGORY_I18N|SORT_I18N|PLACEMENT_I18N" src
src/components/explore/ExploreFilters.tsx:3
```

Three hits in one file = the three declaration lines, nothing else. ESLint agrees:

```
src/components/explore/ExploreFilters.tsx:57:7  'CATEGORY_I18N' is assigned a value but never used
src/components/explore/ExploreFilters.tsx:65:7  'SORT_I18N' is assigned a value but never used
src/components/explore/ExploreFilters.tsx:73:7  'PLACEMENT_I18N' is assigned a value but never used
```

**Do not also delete** the sibling `CATEGORY_KEYS` (56), `SORT_KEYS` (64), `PLACEMENT_KEYS` (72) — live, and ESLint does not flag them. **Do not touch the locale files**; all 7 still need `filterCatAll` etc. for the live path at `:111-123`. Still the biggest single LOC win. Note `ExploreFilters.tsx` has **dropped off** the churn list since last run, so the conflict risk the prior report flagged is gone.

### SAFE-3 · `toBase64Url()` — `src/lib/sharing/url-codec.ts:77` · 7 LOC · carried · `conflict_risk: false`

Module-local base64url encoder; nothing in the module calls it. Its sibling `fromBase64Url` (85-95) **is** live.

```
$ rg -n -w toBase64Url src
src/lib/sharing/url-codec.ts:77:function toBase64Url(bytes: Uint8Array): string {
src/lib/sharing/__tests__/url-codec.test.ts:12:function toBase64Url(bytes: Uint8Array): string {
src/lib/sharing/__tests__/url-codec.test.ts:36:  return "1:" + toBase64Url(new Uint8Array(compressed));
...
```

The test hits are the test file's **own private copy** declared at its line 12 — the source symbol isn't exported, so it could not be imported. Deleting the source copy cannot break the test. `url-codec.ts:77:10 'toBase64Url' is defined but never used.`

### SAFE-4 · `PRIORITY_LABELS` — `src/lib/discord-bot.ts:50` · 6 LOC · carried · `conflict_risk: false`

```
$ rg -c -w -F PRIORITY_LABELS src cypress scripts
src/lib/discord-bot.ts:1
```

Declaration only. Sibling `TYPE_EMOJI` (43-48) is live. `discord-bot.ts:50:7 'PRIORITY_LABELS' is assigned a value but never used.`

### SAFE-5 · `asPokemonTypes()` — `src/lib/data/dex-subset.ts:221` (+ import at `:38`) · 5 LOC · carried · `conflict_risk: false`

Exported identity-cast helper, zero call sites anywhere.

```
$ rg -n -w "getCalcSpecies|asPokemonTypes" src cypress scripts docs public .github
src/lib/data/dex-subset.ts:221:export function asPokemonTypes(types: string[]): PokemonType[] {
src/lib/analysis/damage-calculator.ts:56:export function getCalcSpecies(regulation?: string): string[] {
```

The declaration is the only occurrence of the name in the repo. The export-inventory pass independently classified it `DEAD_NO_REFS` (self-hit count 1). The *file* stays live via `allMegaStones`/`getSpecies`/`getMegaStone`.

**Collateral:** `PokemonType` is imported at `:38` solely for this function; lines 45 and 220 that mention it are comments. Delete both lines.

### SAFE-6 · `getCalcSpecies()` — `src/lib/analysis/damage-calculator.ts:56` · 3 LOC · carried · `conflict_risk: false`

Same grep as SAFE-5 — the declaration is the only hit. Also `DEAD_NO_REFS` in the export pass. It is the **last** declaration in a 58-line file, so this is a clean tail truncation. No collateral: `Generations` and `isChampionsFormat` stay live via `createCalcPokemon` (:15) and `calculateReportDamage` (:34).

### SAFE-7 · `type EventType` — `src/lib/data/tags.ts:33` · 1 LOC · carried · `conflict_risk: false`

```
$ rg -c -w -F EventType src cypress scripts
src/lib/data/tags.ts:1
```

Not exported (plain `type EventType = …`), which is why ESLint can see it: `tags.ts:33:6 'EventType' is defined but never used.` The underlying `EVENT_TYPES` const (26-30) **is** exported and live — delete only the alias.

### SAFE-8 · `displayData` — `src/components/report/PokemonCard.tsx:180` · 1 LOC · carried · `conflict_risk: false`

`const displayData = showMega ? megaData : effectiveBaseData;` — computed, never read. Siblings `displayAbility` (172) and `displayStats` (177) are live. `PokemonCard.tsx:180:9 'displayData' is assigned a value but never used.` `PokemonCard.tsx` has dropped off the churn list since last run.

### SAFE-9 · `exportMenuOpen` / `setExportMenuOpen` — `src/components/layout/Navbar.tsx:202` · 1 LOC · carried · `conflict_risk: true` — **CONFLICT-RISK**

A whole dead `useState` pair; neither half is referenced anywhere in the file.

```
$ rg -n -w exportMenuOpen src
src/components/layout/Navbar.tsx:202:  const [exportMenuOpen, setExportMenuOpen] = useState(false);
```

```
src/components/layout/Navbar.tsx:202:10  'exportMenuOpen' is assigned a value but never used
src/components/layout/Navbar.tsx:202:26  'setExportMenuOpen' is assigned a value but never used
```

Removing it also drops one `useState` call per Navbar render. `src/components/layout/Navbar.tsx` is on `.swarm/main-changed-files.md` — **CONFLICT-RISK**.

### SAFE-10 · dead `useTranslation()` in `SpotlightCard` — `src/components/explore/SpotlightCard.tsx:4, 28` · 2 LOC · carried · `conflict_risk: false`

```
$ rg -n "useTranslation|\bt\b" src/components/explore/SpotlightCard.tsx
4:import { useTranslation } from "@/lib/i18n";
28:  const { t } = useTranslation();
116:          <div className="border-t border-border/50 pt-3">   <- "border-t", not `t`
```

`t` is never dereferenced. `SpotlightCard.tsx:28:11 't' is assigned a value but never used.` Both lines go; this also drops a context subscription from a card rendered in a carousel.

### SAFE-11 · unused map index `i` — `src/components/report/SpeedTierChart.tsx:583` · **NEW** · `conflict_risk: true` — **CONFLICT-RISK**

Introduced by `1fa2e4a` ("speed tiers model +1/+2 stages, doubling abilities and Trick Room order").

```
583:          {allEntries.map((entry, i) => {
```

```
src/components/report/SpeedTierChart.tsx:583:35  warning  'i' is defined but never used
```

The row key is built from `entry.speciesKey` (`entryKey`, line 596), not the index, so `i` is genuinely surplus. Change `(entry, i)` to `(entry)`. `SpeedTierChart.tsx` is on the churn list — **CONFLICT-RISK**.

### SAFE-12 · 2 unused `eslint-disable-next-line` directives · **NEW**

Dead suppressions — ESLint itself reports that the rule they silence no longer fires. Deleting them restores real coverage of those rules on the next line.

```
src/app/champions/[pokemon]/opengraph-image.tsx:146:12
  warning  Unused eslint-disable directive (no problems were reported from '@next/next/no-img-element')
src/components/home/HomePageClient.tsx:1693:7
  warning  Unused eslint-disable directive (no problems were reported from 'jsx-a11y/no-static-element-interactions')
```

`opengraph-image.tsx:146` sits above an `<img>` inside an `ImageResponse` (the rule does not apply in that context). `HomePageClient.tsx:1693` sits above a `<div>` that now carries both `onClick` *and* `onKeyDown`, so the rule is satisfied legitimately. `HomePageClient.tsx` is on the churn list — **CONFLICT-RISK**.

### SAFE-13 · 7 token-level unused imports and destructured bindings · carried

All ESLint `no-unused-vars` findings, each verified to have no other reference in its file. Token removals inside otherwise-live lines, except the one marked *(whole line)*.

| Binding | File:line | conflict_risk |
|---|---|---|
| `auth` (from `import { auth, currentUser }`) | `src/app/api/user/profile/route.ts:4` | false |
| `UserButton` (from `import { UserButton, Show, SignInButton, useUser }`) | `src/app/dashboard/DashboardContent.tsx:8` | **true** |
| `UserButton` (from `import { UserButton, Show, SignInButton }`) | `src/app/dashboard/profile/page.tsx:9` | false |
| `type SearchCategory` (from `import { ExploreFilters, type SearchCategory }`) | `src/components/explore/ExploreContent.tsx:13` | false |
| `import Link from "next/link";` *(whole line)* | `src/components/home/HomePageClient.tsx:8` | **true** |
| `summarizeChangedFields` (from the `version-diff` import) | `src/components/home/HomePageClient.tsx:54` | **true** |
| `megaStates` (destructured from `useHomePage`) | `src/components/home/HomePageClient.tsx:158` | **true** |

`SearchCategory` is still **exported and live** from `ExploreFilters.tsx` (used by `ExploreFilters` itself) — only `ExploreContent`'s import of it is dead.

### SAFE-14 · unused `vi` import in two test files · **NEW** · `conflict_risk: false`

```
src/lib/__tests__/cron-auth.test.ts:1:32        warning  'vi' is defined but never used
src/lib/sharing/__tests__/url-codec.test.ts:1:32  warning  'vi' is defined but never used
```

Both are `import { describe, it, expect, vi } from "vitest";` where `vi` is never called. Trivial, listed for completeness.

---

# Probably dead (needs a human call)

### PD-15 · The whole metric-cursor API is production-dead, and `/api/explore` carries a legacy duplicate — `src/lib/explore/chronological-cursor.ts:48, 96, 115` · **NEW** · `conflict_risk: true` — **CONFLICT-RISK**

**Highest-value finding of this run, and it is a bug report, not a deletion.** `MetricCursor`, `parseMetricCursor` and `serializeMetricCursor` have **zero production callers**:

```
$ rg -n -w "serializeMetricCursor|parseMetricCursor|MetricCursor" src \
     --glob '!src/lib/explore/chronological-cursor.ts'
src/lib/explore/__tests__/chronological-cursor.test.ts:4:  parseMetricCursor,
src/lib/explore/__tests__/chronological-cursor.test.ts:6:  serializeMetricCursor,
... (all 20 remaining hits are in that one test file)
```

`serializeMetricCursor` has self-hit count **1** — its own declaration. It is called nowhere, by anything, except the test. `parseMetricCursor` is referenced once more inside the module, in a *doc comment*.

Meanwhile the only consumer imports just the chronological half and reimplements the metric half locally, **without the id tiebreaker**:

```
$ rg -n "Cursor" src/app/api/explore/route.ts
10:  parseChronologicalCursor,
11:  serializeChronologicalCursor,      <- only these two imported
163:    const parseCompositeCursor = (raw: string | null): { value: number; createdAt: string } | null => {
                                                                      ^^^^ no `id` field
178:      const c = parseCompositeCursor(cursor);      <- popular branch
198:      const c = parseCompositeCursor(cursor);      <- views branch
340:      if (sort === "popular") nextCursor = `${last.like_count ?? 0}:${lastCreatedAt}`;
341:      else if (sort === "views") nextCursor = `${last.view_count ?? 0}:${lastCreatedAt}`;
342:      else if (sort === "updated") nextCursor = serializeChronologicalCursor(last.updated_at, last.id);
343:      else nextCursor = serializeChronologicalCursor(last.created_at, last.id);
```

Lines 340-341 hand-build the **legacy two-part** `<value>:<iso>` format — exactly the form `chronological-cursor.ts` documents as "legacy, no id tiebreaker" — instead of calling `serializeMetricCursor`, which would emit `<value>:<iso>~<id>`. The `updated`/`created` branches (342-343) correctly use the module.

**This is deliberate, documented, and still outstanding.** The module's own header says so:

> `VGC-295 IS ONLY HALF-FIXED. DO NOT ASSUME THE BUG IS GONE.` … `STILL OUTSTANDING: the SQL half. The WHERE/ORDER BY mismatch in route.ts (~L194-195 popular, ~L208-209 views, ~L217-227 chronological) is UNCHANGED and still mispaginates.` … `Whoever has a database next: run the EXPLAIN, then make WHERE and ORDER BY agree on (timestamp, id) using parseMetricCursor().id / parseChronologicalCursor().id.`

**Do NOT delete this.** It is the staged, tested half of a fix whose other half is gated on an `EXPLAIN` against a real database. Deleting it would discard the work and cement the bug. **User-facing symptom that still exists today:** on Explore sorted by *Popular* or *Most viewed*, reports sharing a like/view count (most teams have 0) have no total order, so rows are **skipped or duplicated across page boundaries**. Both `chronological-cursor.ts` and `src/app/api/explore/route.ts` are on the churn list — **CONFLICT-RISK**. The right action is to finish VGC-295, not to clean up. Noted here so the next scan does not mistake a staged fix for rot.

### PD-16 · `getRegMAMegasWithSprites()` — `src/lib/data/mega-pokemon.ts:987` · **NEW** · `conflict_risk: true` — **CONFLICT-RISK**

Production-dead; superseded by `getRegMCMegasWithSprites` when VGC-258 repointed the Champions surfaces at the widest live regulation.

```
$ rg -n "RegMAMegasWithSprites" src cypress scripts
src/lib/data/mega-pokemon.ts:987:export function getRegMAMegasWithSprites(): MegaPokemonEntry[] {
src/app/champions/[pokemon]/page.tsx:25:  // getRegMAMegasWithSprites() the 14 sprited Reg M-B Megas were never
src/app/champions/[pokemon]/__tests__/generate-static-params.test.ts:11:  getRegMAMegasWithSprites,
src/app/champions/[pokemon]/__tests__/generate-static-params.test.ts:33:    const missing = getRegMAMegasWithSprites()
```

Self-hit count **1** (declaration only). `page.tsx:25` is a **comment** recording the VGC-258 history — it reads *"When it was pinned to `getRegMAMegasWithSprites()` the 14 sprited Reg M-B Megas were never prerendered, never sitemapped and never linked (VGC-258)"*. The only executable reference is the test. Every live caller uses the M-C variant:

```
src/app/sitemap.ts:3,35                        getRegMCMegasWithSprites
src/app/champions/[pokemon]/page.tsx:3,28,226  getRegMCMegasWithSprites
```

**Why a human decides:** `generate-static-params.test.ts:33` uses it for a real assertion (every Reg M-A Mega has a sprite — a regression guard with independent value). Deleting the function means rewriting that assertion as `getRegMAMegas().filter(m => MEGAS_WITH_SPRITES.has(m.dataKey))`, which is exactly the function body. **Recommendation: either keep it as the named, tested M-A accessor, or inline it into the test — do not delete the assertion.** `mega-pokemon.ts` is on the churn list — **CONFLICT-RISK**.

### PD-17 · `syncStatus` prop — `src/components/layout/Navbar.tsx:68, 186` · **NEW** · `conflict_risk: true` — **CONFLICT-RISK**

Same shape as PD-19/PD-20: a prop plumbed all the way through and then ignored.

```
$ rg -n -w syncStatus src
src/hooks/useCollaborativeSync.ts:31:   const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
src/hooks/useCollaborativeSync.ts:147:  return { collaborators, syncStatus, lastRemoteUpdate, markSaving, updateVersion };
src/hooks/useHomePage.ts:503:          const { collaborators, syncStatus, markSaving, updateVersion } = useCollaborativeSync({
src/hooks/useHomePage.ts:867:           syncStatus,
src/components/home/HomePageClient.tsx:117:  syncStatus,
src/components/home/HomePageClient.tsx:925:        syncStatus={syncStatus}      <- real value passed in
src/components/layout/Navbar.tsx:68:    syncStatus?: string;                 <- prop declared
src/components/layout/Navbar.tsx:186:   collaborators, syncStatus,           <- destructured, never read
```

`useCollaborativeSync` computes a real status, `useHomePage` re-exports it, `HomePageClient` passes it, `Navbar` declares and destructures it — **and never renders it.** `Navbar.tsx:186:20 'syncStatus' is assigned a value but never used.`

**More likely a wiring gap than dead code.** Symptom: *"on a collaborative report, the navbar never shows sync state (saving / synced / conflict)"* — the sibling `collaborators` on the same destructure line **is** rendered, so the omission looks accidental rather than a cut feature. Deleting the prop would orphan the value through three layers and cement the gap. Hand to whoever owns collaboration. **CONFLICT-RISK** (`Navbar.tsx`, `HomePageClient.tsx` both on the churn list).

### PD-18 · `isRateLimited()` — `src/lib/rate-limit.ts:84` · carried · `conflict_risk: false`

Production-dead; only references are its declaration and its own test file (self-hit count 1, 16 test hits).

```
$ rg -n -w isRateLimited src --glob '!**/__tests__/**' --glob '!**/*.test.*'
src/lib/rate-limit.ts:84:export function isRateLimited(
```

Everything in production uses the async sibling (`api-guard.ts`, `api/feedback/route.ts`, `api/quick-share/route.ts`). **Why a human decides:** the docblock says *"Synchronous in-memory rate limiter (legacy API). Kept for backward compatibility — prefer isRateLimitedAsync"* — it is deliberately retained. Its 5 tests are also the only coverage of the shared `isRateLimitedInMemory` fallback that `isRateLimitedAsync` uses when Upstash is unconfigured. **Recommendation: keep it, or delete it *and* re-point `rate-limit.test.ts` at `isRateLimitedAsync` so the fallback stays covered.** Do not delete the tests outright. Unchanged since 26-10-26.

### PD-19 · `onResultChange` — `src/components/report/MatchupPlanSlide.tsx:456` · carried · `conflict_risk: true` — **CONFLICT-RISK**

The parent passes a real handler calling `onGamePlanResultChange`, the child's props type declares it, the child destructures it — **and never calls it.** `MatchupPlanSlide.tsx:456:3 'onResultChange' is defined but never used.` (Line moved 447 → 456 since last run; the finding is unchanged.)

**A wiring bug, not dead code.** Symptom: *"per-game W/L result does not save in a matchup game plan."* Already filed as `.swarm/unfiled-ticket-bodies/2-bug-matchup-wl-never-saves.md`; still unfixed. Deleting the three lines would orphan the parent handler and cement the broken behaviour.

### PD-20 · `selectedTemplate` / `onTemplateSelect` — `src/components/input/PasteInput.tsx:90, 91, 120` · carried · `conflict_risk: true` — **CONFLICT-RISK**

```
$ rg -n -w "selectedTemplate|onTemplateSelect|pendingTemplateId" src
src/hooks/useHomePage.ts:38,661,669,922       pendingTemplateId / setPendingTemplateId
src/components/home/HomePageClient.tsx:778:   selectedTemplate={pendingTemplateId}
src/components/home/HomePageClient.tsx:779:   onTemplateSelect={setPendingTemplateId}
src/components/input/PasteInput.tsx:90:       selectedTemplate?: string;
src/components/input/PasteInput.tsx:91:       onTemplateSelect?: (id: string) => void;
src/components/input/PasteInput.tsx:120:      export function PasteInput({ …, selectedTemplate, onTemplateSelect })
```

Both wired, both ignored. Symptom: *"template picker selection has no effect in the paste box."* Already filed as `.swarm/unfiled-ticket-bodies/3-bug-template-picker-inert.md`; still unfixed. Deleting would orphan `pendingTemplateId` and strip `src/lib/templates.ts`'s only UI entry point. **Treat as a feature regression first, dead code second.**

### PD-21 · `category` prop on `CollapsibleCalcGroup` — `src/components/report/pokemon-detail/CalcEntryGroup.tsx:187` · carried · `conflict_risk: false`

Declared in the destructure, never read. One call site (`CalcsPanel.tsx:11`), so removal is a two-file edit. Lower risk than PD-19/20 because `cfg` carries the category config that is actually used — but confirm the caller isn't relying on `category` for a label it meant to show. `CalcEntryGroup.tsx` has dropped off the churn list since last run.

### PD-22 · `hiddenSlides` option on `useSlideSystem` — `src/hooks/useSlideSystem.ts:13, 34` · carried · `conflict_risk: true` — **CONFLICT-RISK**

```
13:  hiddenSlides: Set<string>;                    <- SlideSystemOptions declaration
34:    analysis, speciesKeys, plans, hiddenSlides,  <- destructured, never read
```

`useSlideSystem.ts:34:35 'hiddenSlides' is assigned a value but never used.` The hook uses the `isHidden`/`toggleSlide` callbacks it also receives, so the raw Set is redundant. Three touch points: option type (13), destructure (34), caller in `useHomePage.ts`. Low risk, but it is a hook signature change. `useSlideSystem.ts` is on the churn list — **CONFLICT-RISK**.

### PD-23 · hand-run SQL migrations — `src/lib/db/migrations/*.sql` · carried · **recommendation: keep**

```
src/lib/db/migrations/add-species-column.sql    (305 B)
src/lib/db/migrations/add-unlisted-column.sql    (88 B)
src/lib/db/migrations/drop-species-column.sql   (795 B)
```

No code references the directory or any filename; `/api/migrate` does not read them (they are applied by hand against Neon). `add-species-column` + `drop-species-column` are an add-then-revert pair. **These are an operational log, not code.** They cost nothing and carry schema history — leave them. Listed only so the next scan does not re-raise them.

### REDUNDANT-EXPORTS (PD-24) · ~50 symbols · **do not delete the symbols**

50 symbols are exported but imported by nothing — *and are used inside their own defining file.* The dead part is the `export` keyword, not the code. Removing `export` tightens the module surface; **deleting the symbol would break its own file.** Zero LOC saved — hygiene, not cleanup. Recorded explicitly because a naive "unused export" tool reports these as deletable.

Values/functions (self-hit count ≥ 2, all hits inside the defining file): `CHAMPIONS_MB_DEX`, `CHAMPIONS_MC_DEX` (`champions-dex.ts:296, 318` — **definitely keep**: MB is spread into MC at :319 and both are returned by `getChampionsDex` at :326-327, the Reg M-B/M-C legality path), `WALKTHROUGH_STEPS`, `REPORT_TEMPLATES`, `generateCsrfToken`, `flushServerEvents`, `evictStoredDraft`, `migrateCalcEntries`, `replaceSpeciesInBlock`, `SerializedGamePlanSchema`, `SerializedMatchupPlanSchema`, `parseFiltersFromUrl`, `buildUrlSearch`, `isDynamicAllowedOrigin`, `getGenThemedSpriteUrls`, `parseSectionKey`, `sectionKeyLabel`, `sectionKeySlide`, `getNature`, `nextSpriteFallbackState`, `parseFetchedShareState`, `PurgeStatements`, and **new this run** `OG_IMAGE_STYLE`, `ogImageEnabled`, `publishShareOgImage`, `MEGAS_WITH_SPRITES`.

Types/interfaces (each used as a local annotation in its own file): `ChangelogItem`, `TeamCombination`, `HowToStep`, `SportsEventData`, `BreadcrumbItem`, `FAQItem`, `PdfExportProps`, `ChampionsSampleTeam`, `IndyTopCutEntry`, `DraftSaveResult`, `SyncStatus`, `DamageCalcsMap`, `FilterState`, `GamePlanSlots`, `ViewMode`, `AccentTheme`, `SpreadBenchmark`, `ThreatCell`, `VersionDiffState`, `DexSubsetMegaStone`, `MoveCategory`, `MoveFlag`, `MoveData`, `NatureData`, `ChronologicalCursor`, `NotificationType`, `PrivateField`, `ReportTemplate`, `ImportSource`, `SpeedTierForm`, `ProgressiveSpriteUrls`, `GlobalFieldKey`, `LegalitySeverity`, and **new this run** `EffectiveForm`, `EffectiveTyping`.

---

# False-positive notes

Things that look unused and are **not** dead. Do not re-report.

### Next.js framework entrypoints

| Item | Why it has zero inbound references |
|---|---|
| 25 named page/layout/loading default exports (`MegaPokemonPage`, `ChampionsPage`, `ChangelogPage`, `ComparePage`, `CreatorPage`, `DashboardLoading`, `DashboardPage`, `PrivacyLayout`, `PrivacyDashboardPage`, `ProfileLayout`, `EmbedPage`, `ExploreLoading`, `ExplorePage`, `FeedbackPage`, `GlobalError`, `RootLayout`, `NotFound`, `PrivacyPage`, `QuickSharePage`, `ShareLoading`, `SharePage`, `SupportPage`, `TermsPage`, `EvToSpPage`, `TournamentsPage`) | `export default function Foo()` — the **name** is never imported; Next.js consumes the default export. My raw inventory flags all 25 as `DEAD_NO_REFS`; **all are live.** This is the single largest false-positive class in any unused-export tool run against this repo. |
| 191 reserved exports: `default`, `metadata`, `generateMetadata`, `generateStaticParams`, `generateViewport`, `revalidate`, `dynamic`, `dynamicParams`, `runtime`, `alt`, `size`, `contentType`, `GET`/`POST`/`PUT`/`PATCH`/`DELETE`/`HEAD`/`OPTIONS` | App Router conventions. |
| `src/app/api/bot/route.ts` → `/api/bot` | Discord **interaction endpoint**; Discord calls it. `tweetnacl` verification lives here. Route pass: `prod=0 test=0`. |
| `src/app/api/webhooks/{clerk,posthog}/route.ts` | Webhook targets. `prod=0 test=0`. |
| `src/app/api/webhooks/linear/route.ts` | Linear webhook target. `prod=0 test=8`. Per CLAUDE.md the Linear-webhook-fix P0 is stale/merged — **not re-verified**. |
| `src/app/api/cron/{daily-ops,weekly-report,weekly-digest,posthog-errors}/route.ts` | Vercel cron. Each has exactly one reference: `vercel.json:8/12/20/16`. |
| `src/app/api/{cleanup,setup,migrate,keep-alive}/route.ts` | Operational endpoints hit by schedule or by hand (`vercel.json:4`, `README.md:30`, `src/proxy.ts`). Their other "hits" are prose in `src/app/changelog/data.ts`. |
| `src/app/q/[id]/page.tsx` → `/q/[id]` | Reached via the URL the API *returns* (`api/quick-share/route.ts` → `url: /q/${id}`), never a static `href`. |
| `src/app/s/[id]/redirect.tsx` | **Not** a convention file — a plain client component imported by `s/[id]/page.tsx:5` as `ShareRedirectClient`. |
| `/compare` absent from `sitemap.ts` | **Deliberate** — `robots: { index: false }`; `sitemap.ts:21-23` carries an explicit "do not re-add" comment (VGC-272). |
| `/dashboard/notifications` **and** `/notifications` | **Not duplicates.** `/dashboard/notifications` is the push-preference form (`BrowserPushSettings`, `/api/user/preferences`); `/notifications` is the activity feed (`useNotifications`). One inbound link each: `DashboardContent.tsx:155` and `NotificationBell.tsx:183`. |

### Reached only through indirection

- `src/lib/data/__validate-mega-coverage.ts` — live via `await import("./lib/data/__validate-mega-coverage")` at `src/instrumentation.ts:14` (build-time Mega-coverage gate). The graph resolves this correctly.
- `src/lib/i18n/translations/{fr,it,es,ja,ko,zh}.ts` — default exports loaded by the lazy map at `src/lib/i18n/index.ts:26-32`. `en.ts` is additionally imported statically.
- `src/components/report/{InlineDamageCalculator,SpreadBuilder,ThreatMatrix}.tsx`, `src/components/home/HomePageClient.tsx` — default exports consumed through `next/dynamic` (e.g. `CalcsPanel.tsx:12`). All 7 `next/dynamic` call sites use static string literals.

### Deliberate unused-variable idioms — ESLint flags them, they are correct

- `src/lib/utils/normalize-report.ts:97` — `const { spreadNotes: _removed, ...rest } = data;` is the rest-destructure **key-omit** idiom. `_removed` is *meant* to be unused; that is the mechanism. Deleting it would reintroduce `spreadNotes` into the output. Two sibling sites already carry an explicit `eslint-disable` for the same pattern (`src/lib/sharing/collaboration.ts:17`, `src/hooks/useShareUrl.ts:279`) — this one just lacks the comment.
- `src/app/global-error.tsx:4` — `error: _error` is intentional; the file's comment states *"Exceptions are captured app-wide by PostHog's error tracking, so this boundary only needs to render a recoverable fallback UI."*
- `src/app/api/user/push/__tests__/route.test.ts:26, 33` — `_args` in mock signatures, underscore-prefixed by convention.

### Classifier gap worth knowing

Three symbols' **only** external production references are **comments**, so a naive hit-count marks them live: `publishShareOgImage` (`team-graphic-image.tsx:77`), `MEGAS_WITH_SPRITES` (`sprite-url.ts:125`, `sprite-slug.ts:67`), `getRegMAMegasWithSprites` (`champions/[pokemon]/page.tsx:25`). Of the three, only `getRegMAMegasWithSprites` is genuinely dead (→ PD-16); the other two are used inside their own files (→ PD-24). Any future scan must strip comment lines before counting hits.

### Structural negatives

- **Zero orphaned files.** All 323 production code files are reachable from a framework entry point. Verified twice — once by the import graph, once by an independent per-file specifier grep over all 240 files in `src/components`, `src/hooks`, `src/data`, `src/lib/utils`, `src/lib/dynamic-imports`.
- **Zero orphaned components.** Every file in `src/components/**` has at least one importer.
- **Zero dead routes.** All 80 routes (58 API + 22 pages) resolve to a caller, a `vercel.json` cron, a sitemap entry, an inbound link, or an external-service entrypoint.
- **Zero test-only files.** No production file exists solely to serve tests.
- `src/data/{indy-top-cut,champions-sample-teams}.ts` are both live (`ChampionsContent.tsx:11-12`, `PasteInput.tsx:13`, `HomePageClient.tsx:11`).

---

# Unused dependencies

### `@pkmn/dex` is in `dependencies` but has no `src/` importer — **misclassified, KNOWN, still unfixed**

```
$ rg -n "@pkmn/dex" . --glob '!node_modules' --glob '!package-lock.json'
package.json:27:    "@pkmn/dex": "^0.10.7",
scripts/build-dex-subset.mjs:48:import { Dex } from "@pkmn/dex";     <- the ONLY import, anywhere
src/lib/data/pkmn-dex-fallback.ts:12   (comment)
src/lib/data/dex-subset.ts:5           (comment)
src/app/changelog/data.ts:224          (changelog prose)
...all other 20 hits are comments or prose
```

The only `import` statement in the repo is in `scripts/build-dex-subset.mjs`, a build-time generator that is **not** part of `next build`. The app reads the generated `src/lib/data/dex-subset.json` through `dex-subset.ts` instead — that indirection is the whole point of the module (`dex-subset.ts:5`: *"This replaces direct `@pkmn/dex` usage on any code path that's reachable from a 'use client' component"*).

**Should be a `devDependency`.** Already filed as `.swarm/unfiled-ticket-bodies/4-perf-pkmn-dex-devdep.md` (52 MB in `node_modules`, saved on every Vercel install and CI run) and **still unfixed** — `package.json:27` has not moved. **CONFLICT-RISK: `package.json` is on `.swarm/main-changed-files.md`.** Verify the generator still runs from a devDependency before shipping; it is not invoked by any Vercel build step.

### Everything else resolves

All other **25** `dependencies` resolve to at least one real `import` in `src/`:

```
@clerk/nextjs(77 files) next(118) react(124) react-dom(13) zod(30) motion(10)
@smogon/calc -> threat-matrix.ts, damage-calculator.ts, spread-builder.ts
@neondatabase/serverless -> db.ts, db/purge-satellites.ts
@opentelemetry/{api-logs,exporter-logs-otlp-http,resources,sdk-logs} -> instrumentation.ts:1-4, api/views/[shareId]/route.ts:5
@upstash/redis(2) @upstash/ratelimit -> rate-limit.ts   @vercel/blob -> sharing/og-image.ts
qrcode -> TeamOverview.tsx, OTSSheetModal.tsx            jspdf -> OTSSheetModal.tsx, export-report.ts
cheerio -> import/limitless.ts                           tweetnacl -> api/discord/route.ts
html2canvas-pro -> dynamic-imports/html2canvas.ts        web-push -> web-push.ts
posthog-js(1) posthog-node -> posthog-server.ts          @microsoft/clarity -> ClarityProvider.tsx
vanilla-cookieconsent -> CookieBanner.tsx
```

The four `@opentelemetry/*` packages look config-only because they also appear in `next.config.ts:27-30`, but that is the required `serverExternalPackages` declaration — they are genuinely imported. `@vercel/blob` is **new this run** (added by `e4d9354`) and correctly used by `src/lib/sharing/og-image.ts`. Lowest-usage-but-live (one import each): `cheerio`, `tweetnacl`, `html2canvas-pro`, `@upstash/ratelimit`, `posthog-node`, `@microsoft/clarity`, `vanilla-cookieconsent`.

All **14** `devDependencies` are also used: `@electric-sql/pglite` (the two `postgres.test.ts` suites), `jsdom` (12 test files' environment pragma), `@tailwindcss/postcss` + `tailwindcss` (`postcss.config.mjs`, `globals.css`), `cypress` + `start-server-and-test` (the `test:e2e` scripts), `eslint` + `eslint-config-next` (`eslint.config.mjs`), `typescript` (`next-env.d.ts`), and the four `@types/*` packages (implicit, via `tsconfig.json`).

**Net: 1 misclassified dependency, 0 genuinely unused.**

---

# Changed since 26-10-26

### Nothing from the prior report was deleted — and here is why

**All 10 `SAFE_TO_DELETE` findings and all 7 `PROBABLY_DEAD` findings from 26-10-26 are still present, byte for byte.** The intervening commit `d8aba62` is titled *"chore: clear the 36 lint errors and make lint blocking in CI"*, which looks like it should have swept them. It did not:

```
$ node node_modules/eslint/bin/eslint.js .
✖ 66 problems (0 errors, 66 warnings)
$ echo $?
0
```

`@typescript-eslint/no-unused-vars` is configured as a **warning**, so ESLint exits 0 and the now-blocking CI lint step passes with all 24 unused-variable findings intact. The lint gate added in `d8aba62` cannot catch any of this report's sub-file dead code. **This is the single highest-leverage thing to change:** promoting `no-unused-vars` to `error` in `eslint.config.mjs` would make 14 of this report's 24 findings CI-enforced and stop the backlog regrowing. (`eslint.config.mjs` currently adds no rule overrides at all — just `nextVitals` + `nextTs` + `globalIgnores`.) Note `.github/workflows/ci.yml` is on the churn list — **CONFLICT-RISK** for any CI edit.

Only drift in the carried findings is line numbers: `MatchupPlanSlide.tsx` `onResultChange` moved 447 → 456.

### Churn-list movement (affects deletion ordering)

Four files the prior report flagged `conflict_risk: true` have **dropped off** `.swarm/main-changed-files.md`, so their findings are now safe to land early: `ExploreFilters.tsx` (SAFE-2, the 18-LOC win), `PokemonCard.tsx` (SAFE-8), `SpotlightCard.tsx` (SAFE-10), `CalcEntryGroup.tsx` (PD-21), `dashboard/profile/page.tsx` and `ExploreContent.tsx` (SAFE-13). Newly flagged this run: `SpeedTierChart.tsx` (SAFE-11), `mega-pokemon.ts` (PD-16), `chronological-cursor.ts` + `api/explore/route.ts` (PD-15), `useSlideSystem.ts` (PD-22).

### Repo growth

| | 26-10-26 | 02-11-26 |
|---|---|---|
| code files | 380 | **407** (323 prod + 84 test) |
| exported symbols | 682 | **746** |
| `dependencies` | 31 | **26** |
| orphaned files / dead routes / unused deps | 0 / 0 / 0 | **0 / 0 / 0** (+1 misclassified) |

Five commits landed on `main`: `1fa2e4a` (speed tiers), `d8aba62` (lint), `2886c78` (mega-slug redirect), `e4d9354` (og:image pre-render), `10dfd74` (merge of VGC-230/231/233/235). 112 files changed, +6341/-1077 in `src`.

### New code is clean

Every module added since the last scan is fully wired, with no dead exports beyond the two redundant-`export` types noted in PD-24:

- **`src/lib/sharing/og-image.ts`** (new) — 9 exports; `getShareOgCard`, `ogCardFingerprint`, `scheduleOgImageBackfill`, `OG_IMAGE_SIZE` → `s/[id]/page.tsx:7`; `schedulePublishShareOgImage` → `api/share/route.ts:9`; `removeShareOgImage` → `api/user/reports/[shareId]/route.ts:4`. `publishShareOgImage`, `ogImageEnabled`, `OG_IMAGE_STYLE` are used internally (→ PD-24).
- **`src/lib/sharing/team-graphic-image.tsx`** (new, 521 LOC) — renderer extracted from `/api/team-graphic` so the route and the pre-render share it. Both consumers live.
- **`src/app/s/[id]/opengraph-image.tsx` deleted** by `e4d9354`. **No dangling references** — the remaining `opengraph-image` mentions in `s/[id]/page.tsx:115,121` are history comments; every other hit is a different, existing convention file (`/opengraph-image`, `/explore/opengraph-image`, `/champions/[pokemon]/opengraph-image`).
- **`src/lib/db/purge-satellites.ts`**, **`src/lib/utils/effective-form.ts`**, **`src/lib/utils/effective-typing.ts`**, **`src/app/tools/ev-to-sp/`** (new page, in `sitemap.ts` and `README.md`) — all live, all tested.

### New findings this run

5 new confirmed-dead items (SAFE-1, 11, 12, 14 — the 5 starter SVGs, the SpeedTierChart index, 2 dead lint directives, 2 unused test imports) and 3 new probably-dead items (PD-15 metric cursors, PD-16 `getRegMAMegasWithSprites`, PD-17 `syncStatus`). PD-15 and PD-17 are **wiring gaps with user-facing symptoms**, not cleanup.

---

# Recommended deletion order

Ordered so each step is independently committable and the gate stays green. Per CLAUDE.md run `verification-gate` (cold `tsc --noEmit --incremental false` + vitest + `next build`) after each step, and `ui-checklist-reviewer` on any step touching `.tsx`.

1. **Step 0 — `public/` starter assets (SAFE-1).** 5 whole files, no code, no conflict risk, no `.tsx`. The one change in this report that needs no judgement at all. Commit alone.
2. **Step 1 — pure `src/lib` leaf deletions.** SAFE-6 `getCalcSpecies`, SAFE-5 `asPokemonTypes` + its import, SAFE-4 `PRIORITY_LABELS`, SAFE-3 `toBase64Url`, SAFE-7 `EventType`. **22 LOC, 5 files, no `.tsx`, nothing imports any of them.** None on the churn list.
3. **Step 2 — SAFE-2, the `ExploreFilters` i18n maps.** Biggest LOC win (18) and **no longer conflict-risk**, so promote it ahead of the risky files. Keep `CATEGORY_KEYS`/`SORT_KEYS`/`PLACEMENT_KEYS` and all locale keys.
4. **Step 3 — token-level removals (SAFE-13) + dead lint directives (SAFE-12) + unused test imports (SAFE-14).** Purely additive-safe. Split `HomePageClient.tsx` (4 of the 7 bindings, plus the dead directive) into its own commit — it is the most-churned file in the set.
5. **Step 4 — the single-line UI deletions.** SAFE-8 `displayData` (no longer conflict-risk), SAFE-10 `SpotlightCard` `useTranslation` (no longer conflict-risk), then SAFE-9 `exportMenuOpen` and SAFE-11 `SpeedTierChart` `i` — both still **CONFLICT-RISK**, so rebase first. Run `ui-checklist-reviewer`.
6. **Step 5 — the leverage fix, not a deletion.** Promote `@typescript-eslint/no-unused-vars` to `error` in `eslint.config.mjs` *after* steps 1-4, so CI then enforces what was just cleaned. This is what stops the 26-10-26 outcome repeating. (`.github/workflows/ci.yml` is **CONFLICT-RISK**; the rule change itself is in `eslint.config.mjs`, which is not.)
7. **Then stop and escalate — do not delete:**
   - **PD-15 (metric cursors)** — finish VGC-295's SQL half. Explore pagination on *Popular*/*Most viewed* is **broken in production today**. Highest-value item in this report; needs a database for the `EXPLAIN`.
   - **PD-17 (`syncStatus`)** and **PD-19/PD-20** (`onResultChange`, `selectedTemplate`) — three instances of the same pattern: a prop plumbed through and ignored. The fix is almost certainly to *render/call* it, not remove it. PD-19 and PD-20 already have ticket bodies in `.swarm/unfiled-ticket-bodies/`; **PD-17 needs one filed.**
   - **PD-16** (`getRegMAMegasWithSprites`) and **PD-21**, **PD-22**, **PD-18** — low-priority hygiene. PD-18 only together with re-pointing `rate-limit.test.ts` at `isRateLimitedAsync`.
   - **PD-23** (SQL migration log) — leave alone. **PD-24** — `export`-keyword cleanup only; **never** delete those symbols.
8. **Separately — `@pkmn/dex` → `devDependencies`.** 52 MB off every install. Already ticketed, still unfixed. **CONFLICT-RISK: `package.json`.**

**Net from steps 0-4: 5 whole files + ~48 LOC across 15 files, no behaviour change.** The repo remains structurally clean — no dead files, no dead routes, no unused dependencies. The real problems this run are two unwired features and one half-landed pagination fix, none of which is a deletion.
