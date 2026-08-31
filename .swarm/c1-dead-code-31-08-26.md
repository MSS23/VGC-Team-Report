# C1 — Dead Code Scan (read-only)

**Date:** 2026-08-31
**Agent:** C1 (overnight code-quality swarm)
**Repo:** `/home/user/VGC-Team-Report` @ `29ef743` (branch `claude/loving-sagan-ib785e`)
**Scope:** (a) exported symbols never imported, (b) orphaned components, (c) dead/unreachable routes, (d) unused files in `src/`.
**Mutations made:** none. No source file edited, created, or deleted. No `git commit`/`push`. No network access. Only this report file was written.

---

## Headline

**The codebase is close to dead-code-free.** 324 TS/TSX files, 282 reachable from production entrypoints, and **all 42 unreachable files are test files**. The August 10 audit's Tier 1 deletions (`DisplayTogglePill.tsx`, `useGlobalDisplayPrefs.ts`, the whole `src/components/display/` and `src/lib/hooks/` dirs) **have been actioned and are gone**.

**Exactly 2 symbols are genuinely dead. Zero orphaned components. Zero unused `.ts`/`.tsx` files.**

The large "unused export" number that a naive grep produces (51 never-imported exports) is almost entirely **a redundant `export` keyword on a symbol that is alive and used inside its own file** — that is a style nit, not dead code. This report separates the two rigorously, because conflating them is how a dead-code scan turns into a dangerous diff.

---

## Method

Three passes, deliberately not relying on a single tool.

1. **Export inventory + full-repo identifier index.** Extracted all 597 `export` declarations (`const/let/var/function/class/interface/type/enum`, `export {}` re-export lists, `export default`) from all 324 `src/**/*.{ts,tsx}` files. Then tokenized **every** file in the repo (`.ts .tsx .js .mjs .cjs .md .json .sh .yml .css .html .txt`, excluding `node_modules`/`.next`/`.git`) into an identifier → {file → count} index in Node. Sanity check: 596 `^export ` lines vs 597 extracted entries — full coverage.
2. **Module reachability graph.** Resolved `@/*`, relative, `index.ts(x)` and dynamic `import("…")` specifiers into a real import graph, seeded from **90 Next.js entrypoints** — every `page/layout/route/template/default/loading/error/global-error/not-found/sitemap/robots/manifest/opengraph-image/twitter-image/icon/apple-icon` file under `src/app`, plus `src/instrumentation.ts` and `src/proxy.ts`. Only 2 import specifiers failed to resolve, both legitimately non-TS assets (`./globals.css`, `./dex-subset.json`) — so there are no blind spots in the graph.
3. **Route pass.** All 53 `src/app/api/**/route.ts(x)` files mapped to URLs, dynamic segments wildcarded to their longest static prefix, then grepped for callers across source, `vercel.json`, `.env.example` and configs.

### Two method notes that changed the conclusions

- **`selfHits` is the load-bearing signal.** For each never-imported export I counted references *inside its own declaring file*. `selfHits == 1` means only the declaration itself — genuinely dead. `selfHits > 1` means the function/type is called or referenced internally and is fully alive; only the `export` keyword is surplus. Skipping this check would have produced 51 false "dead code" claims.
- **`rg` silently skipped some `.swarm/*.md` files** (they contain very long lines — 721 chars). `rg -w asPokemonTypes --no-ignore` returned 1 hit while `grep -c` on the same file returned 4. The Node tokenizer in pass 1 reads every file directly and is therefore the authoritative source here; ripgrep was used only for confirmation. Anyone re-running this scan with ripgrep alone should be aware of that gap.

---

## (a) Exported symbols never imported anywhere

### Ranked findings

| Symbol | file:line | Evidence of non-reference | Confidence | Safe to delete? |
|---|---|---|---|---|
| `asPokemonTypes` | `src/lib/data/dex-subset.ts:221` | Only occurrence of the identifier **in the entire repo** (incl. all `.md`, `.planning`, `.swarm`) is its own definition line. `selfHits=1`. Not in the `dex-subset.test.ts` import block (which imports `allMegaStones, allSpecies, getMegaStone, getSpecies` only). Also flagged HIGH by the 2026-08-10 audit (item #6) and never removed. | **HIGH** | **Yes** — 4 lines incl. doc comment |
| `isRateLimited` | `src/lib/rate-limit.ts:84` | `selfHits=1`. Zero production callers; every call site uses `isRateLimitedAsync` (`src/lib/security/api-guard.ts:33`, `src/app/api/feedback/route.ts:86`). Its own JSDoc says "legacy API — prefer isRateLimitedAsync". Sole consumer is `src/lib/__tests__/rate-limit.test.ts`, whose only `describe` block is `"isRateLimited"`. | **HIGH** | **Yes, with one caveat** — see below |
| `/api/oembed` route | `src/app/api/oembed/route.ts` | See section (c). | MED | Not without a decision |
| `generateCsrfToken` | `src/lib/security/csrf.ts:17` | Never imported, but **used internally** at `csrf.ts:49`. Alive. | HIGH (that export is surplus) | Un-export only; do **not** delete |
| 48 further never-imported exports | see table below | All `selfHits > 1` — alive inside their own file | HIGH (surplus export) | Un-export only; do **not** delete |

#### Caveat on `isRateLimited`

`rate-limit.test.ts` (46 lines) is the **only** coverage for `isRateLimitedInMemory`, the private in-memory fallback that `isRateLimitedAsync` uses whenever `UPSTASH_REDIS_REST_URL`/`_TOKEN` are unset — i.e. the path that actually runs in local dev and in any environment without Upstash configured. A blind "delete the function and its test file" loses real coverage of a live code path.

**Correct sequence:** retarget the 6 test cases at `isRateLimitedAsync` (it falls through to the identical in-memory branch when `redis === null`, so the assertions hold with `await` added), *then* delete the `isRateLimited` export. Net: −10 lines of source, coverage preserved and pointed at the API that is actually used.

### Never-imported but alive internally — surplus `export` keyword only

**These are NOT dead code. Deleting any of them breaks the build.** The only available action is dropping the `export` keyword, which is cosmetic, has zero runtime or bundle effect (TS types erase entirely; the bundler already tree-shakes the rest), and churns the diff. Listed for completeness, recommended action: **leave alone**.

Nine of them are consumed by their own unit tests (`renderHook`, `parseFiltersFromUrl`, `buildUrlSearch`, `isDynamicAllowedOrigin`, `pokemonToShowdown`, `sectionKeyLabel`, `sectionKeySlide`, `SectionKey`, `parseSectionKey`) — those exports are **legitimately required** and should not be touched at all.

| Symbol | file:line | Kind | selfHits | Note |
|---|---|---|---|---|
| `ChangelogItem` | `src/app/changelog/data.ts:3` | interface | 2 | |
| `TeamCombination` | `src/components/report/CommonModesSlide.tsx:16` | interface | 7 | |
| `HowToStep` | `src/components/seo/JsonLd.tsx:36` | interface | 3 | |
| `SportsEventData` | `src/components/seo/JsonLd.tsx:83` | interface | 2 | |
| `BreadcrumbItem` | `src/components/seo/JsonLd.tsx:142` | interface | 3 | |
| `FAQItem` | `src/components/seo/JsonLd.tsx:193` | interface | 3 | |
| `PdfExportProps` | `src/components/ui/PdfExport.tsx:25` | interface | 2 | |
| `ChampionsSampleTeam` | `src/data/champions-sample-teams.ts:7` | interface | 2 | |
| `IndyTopCutEntry` | `src/data/indy-top-cut.ts:7` | interface | 2 | |
| `renderHook` | `src/hooks/__tests__/render-hook.ts:14` | function | 2 | **test helper, imported by 5 test files — leave** |
| `DraftSaveResult` | `src/hooks/useAutoDraft.ts:13` | interface | 4 | |
| `SyncStatus` | `src/hooks/useCollaborativeSync.ts:6` | type | 2 | |
| `DamageCalcsMap` | `src/hooks/useDamageCalcs.ts:19` | type | 5 | |
| `FilterState` | `src/hooks/useExploreUrlSync.ts:6` | interface | 11 | |
| `parseFiltersFromUrl` | `src/hooks/useExploreUrlSync.ts:52` | function | 2 | **test-consumed — leave** |
| `buildUrlSearch` | `src/hooks/useExploreUrlSync.ts:78` | function | 2 | **test-consumed — leave** |
| `GamePlanSlots` | `src/hooks/useMatchupPlans.ts:24` | interface | 3 | |
| `evictStoredDraft` | `src/hooks/useTeamReport.ts:31` | function | 3 | called at lines 67, 166 |
| `ViewMode` | `src/hooks/useTeamReport.ts:74` | type | 2 | |
| `WALKTHROUGH_STEPS` | `src/hooks/useWalkthrough.ts:16` | const | 2 | used at line 189 |
| `AccentTheme` | `src/lib/accent-themes.ts:3` | interface | 3 | |
| `VersionDiffState` | `src/lib/contexts/VersionDiffContext.tsx:6` | interface | 3 | |
| `DexSubsetMegaStone` | `src/lib/data/dex-subset.ts:65` | interface | 10 | |
| `MoveCategory` | `src/lib/data/moves.ts:3` | type | 2 | |
| `MoveFlag` | `src/lib/data/moves.ts:4` | type | 2 | |
| `MoveData` | `src/lib/data/moves.ts:10` | interface | 3 | |
| `NatureData` | `src/lib/data/natures.ts:3` | interface | 2 | |
| `TYPE_CHART` | `src/lib/data/type-chart.ts:6` | const | 2 | used at line 180 |
| `ChronologicalCursor` | `src/lib/explore/chronological-cursor.ts:1` | interface | 2 | |
| `NotificationType` | `src/lib/notifications.ts:3` | type | 2 | |
| `flushServerEvents` | `src/lib/posthog-server.ts:56` | function | 3 | scheduled via `after()` at line 44 |
| `isDynamicAllowedOrigin` | `src/lib/security/cors.ts:39` | function | 3 | **test-consumed — leave** |
| `generateCsrfToken` | `src/lib/security/csrf.ts:17` | function | 2 | used at line 49 |
| `PrivateField` | `src/lib/sharing/redact-paste.ts:21` | type | 5 | |
| `SerializedGamePlanSchema` | `src/lib/sharing/url-codec.schemas.ts:30` | const | 2 | composed at line 40 |
| `SerializedMatchupPlanSchema` | `src/lib/sharing/url-codec.schemas.ts:36` | const | 2 | composed at line 92 |
| `ReportTemplate` | `src/lib/templates.ts:1` | interface | 3 | |
| `REPORT_TEMPLATES` | `src/lib/templates.ts:13` | const | 2 | used at line 61 |
| `pokemonToShowdown` | `src/lib/utils/export-paste.ts:20` | function | 2 | **test-consumed — leave** |
| `ImportSource` | `src/lib/utils/multi-import.ts:7` | type | 2 | |
| `migrateCalcEntries` | `src/lib/utils/normalize-report.ts:10` | function | 2 | used at line 103 |
| `replaceSpeciesInBlock` | `src/lib/utils/paste-edit.ts:59` | function | 2 | used at line 97 |
| `SpeedTierForm` | `src/lib/utils/speed-tier-form.ts:9` | interface | 2 | |
| `SectionKey` | `src/lib/utils/version-diff.ts:32` | type | 7 | **test-consumed — leave** |
| `GlobalFieldKey` | `src/lib/utils/version-diff.ts:44` | type | 4 | used at lines 34, 54 |
| `parseSectionKey` | `src/lib/utils/version-diff.ts:83` | function | 4 | **test-consumed — leave** |
| `sectionKeyLabel` | `src/lib/utils/version-diff.ts:119` | function | 3 | **test-consumed — leave** |
| `sectionKeySlide` | `src/lib/utils/version-diff.ts:148` | function | 2 | **test-consumed — leave** |
| `LegalitySeverity` | `src/lib/validation/champions-legality.ts:31` | type | 2 | |

---

## (b) Orphaned components — NONE

| Result | Evidence | Confidence |
|---|---|---|
| Zero orphaned components | Reachability graph from 90 Next.js entrypoints reaches **282 / 324** files. All 42 unreachable files are `__tests__`/`*.test.*`. `deadNonTest = []`. | **HIGH** |

Specifically verified as reachable despite unusual shapes:

- `src/app/s/[id]/redirect.tsx` — not a Next file convention, but imported: `src/app/s/[id]/page.tsx:4` → `import { ShareRedirectClient } from "./redirect"`.
- `src/lib/data/__validate-mega-coverage.ts` — reached only via the dynamic `await import(...)` in `src/instrumentation.ts`; the graph resolves dynamic specifiers, so it is correctly live.
- All `next/dynamic` targets resolve from static string literals — there is no variable or template-literal component resolution anywhere in `src`, so nothing can hide from this analysis.

---

## (c) Dead / unreachable routes

All 53 API routes have callers except the two below. Note that `route.ts` files are Next.js **entrypoints** — the reachability graph cannot judge them, so these were assessed by caller-grep plus intent.

| Route | file | Evidence | Confidence | Safe to delete? |
|---|---|---|---|---|
| `/api/oembed` | `src/app/api/oembed/route.ts` | Zero callers. More importantly, **the endpoint is undiscoverable**: a case-insensitive search for `oembed` across the whole repo returns only the route itself, `IMPROVEMENTS.md:96`, and one `changelog/data.ts` entry. There is **no `<link rel="alternate" type="application/json+oembed">` tag in any page head** — not in `src/app/layout.tsx`, `src/app/s/[id]/`, or `src/app/embed/`. Discord/Slack unfurlers can never find it, so the route has never served a real request. | **MED** | **No — decide first.** The route is correct code that was never wired up. The higher-value fix is to *add* the discovery `<link>` to `/s/[id]` (restoring intended unfurl behaviour) rather than delete. Deleting is only right if rich unfurls are formally abandoned. |
| `/api/migrate` | `src/app/api/migrate/route.ts` | No programmatic caller; only `changelog/data.ts` mentions. | **LOW** | **No.** Secret-guarded (`MIGRATE_SECRET` via `verifyBearer`), idempotent, invoked manually by curl. This is an ops tool, uncalled **by design**. |

Correctly **not** flagged (uncalled in-app but externally invoked — verified as intentional):

- `/api/cron/{daily-ops,weekly-report,weekly-digest,posthog-errors}` — invoked by Vercel Cron.
- `/api/webhooks/{clerk,linear,posthog}` — inbound third-party webhooks; secrets documented in `.env.example`.
- `/api/cleanup` — wired in `vercel.json:4`.
- `/api/setup`, `/api/keep-alive` — exempted explicitly in `src/proxy.ts:33,90`; ops endpoints.
- `/api/bot` — Discord bot token endpoint, documented in `.env.example:77`.

---

## (d) Unused files in `src/`

No unused `.ts`/`.tsx` files exist. The only candidates are three SQL files that **no code path ever reads** (confirmed: no `readFileSync`/`readFile` call anywhere in `src` touches a `.sql` file — the only `readFileSync` uses target `package.json`, `public/llms.txt`, and test fixtures).

| File | Evidence | Confidence | Safe to delete? |
|---|---|---|---|
| `src/lib/db/migrations/drop-species-column.sql` | Zero references repo-wide — not even in `.swarm` docs. Its own header documents the VGC-218 add/drop cycle as complete; `grep species src/lib/db.ts` returns nothing, so the column is gone. | MED | Only as history cleanup |
| `src/lib/db/migrations/add-species-column.sql` | Referenced only in `.swarm` design docs. Superseded by its own `drop-` counterpart. | MED | Only as history cleanup |
| `src/lib/db/migrations/add-unlisted-column.sql` | Superseded by the inline `ALTER TABLE shares ADD COLUMN IF NOT EXISTS is_unlisted …` at `src/lib/db.ts:27`, which is idempotent and runs in `ensureSchema`. | MED | Only as history cleanup |

**Recommendation: keep all three.** They are applied-migration records, not executable code. They cost ~40 lines, carry schema archaeology (the `drop-species-column.sql` comment is the clearest existing explanation of why Champions meta still parses species from `data->>'paste'`), and deleting them buys nothing. Flagged only because the brief asked for unused files.

---

## Safe to remove now

Only items where every reference has been verified absent and deletion cannot break the build. **Both are in `src/lib/`, so per CLAUDE.md conventions the change needs the `verification-gate` subagent (tsc + vitest + build) before commit.** Total: **2 items, ~14 lines**.

### 1. `asPokemonTypes` — `src/lib/data/dex-subset.ts:219-223`

Delete these 4 lines outright. Nothing else changes; no import line needs touching (`PokemonType` is used elsewhere in the file).

```ts
/** Narrow a string[] of types to the typed PokemonType union. */
export function asPokemonTypes(types: string[]): PokemonType[] {
  return types as PokemonType[];
}
```

Verification performed: the identifier appears exactly once in the entire repository (its definition). Independently flagged HIGH by the 2026-08-10 audit and still present 3 weeks later.

### 2. `isRateLimited` — `src/lib/rate-limit.ts:80-90`

Delete the legacy sync export (11 lines incl. JSDoc). **Do this second, and retarget the test first** so `isRateLimitedInMemory` keeps its coverage:

1. In `src/lib/__tests__/rate-limit.test.ts`, change the import to `isRateLimitedAsync`, rename the `describe` block, and `await` each of the 6 call sites. The in-memory branch is reached identically whenever Upstash env vars are unset, so all existing assertions hold unchanged.
2. Then delete `src/lib/rate-limit.ts:80-90`.

Verification performed: `selfHits=1` (declaration only); the sole non-test consumer set is empty; both real call sites (`api-guard.ts:33`, `feedback/route.ts:86`) already use `isRateLimitedAsync`.

### Not in this section, deliberately

- The 49 "surplus `export` keyword" symbols — cosmetic, zero runtime effect, and 9 of them are required by their own tests. Removing exports here is diff churn against CLAUDE.md's "focused diffs; no drive-by refactors".
- `/api/oembed` — needs a product decision (wire it up vs. remove), not a deletion.
- The 3 SQL migration files — applied-migration history; recommend keeping.

---

## Cross-check against the 2026-08-10 audit

| 2026-08-10 finding | Status today |
|---|---|
| `src/components/display/DisplayTogglePill.tsx` (267 ln) | **Deleted** — directory gone |
| `src/lib/hooks/useGlobalDisplayPrefs.ts` | **Deleted** — directory gone |
| `asPokemonTypes` (item #6, HIGH, "trivial — piggyback only") | **Still present** — re-flagged above |

The two large items were actioned; the trivial one was deprioritised as intended and remains the single cheapest outstanding cleanup.
