# C1 — Dead Code Scan (read-only)

**Date:** 2026-09-07
**Agent:** C1 (overnight code-quality swarm)
**Repo:** `/home/user/VGC-Team-Report` @ working branch `claude/loving-sagan-12996k`, `origin/main` @ `70c4633`
**Scope:** unused exports across `src/**`, orphaned components, unreachable routes, unused npm dependencies, leftover files from reverted work, unused `public/` assets, unused CSS.
**Mutations made:** none. No source file edited, created, or deleted. Only this report was written. Read-only git commands only (`git log`, `git status`, `git fetch`).

---

## Conflict-risk assessment

```
$ git log origin/main --since="7 days ago" --name-only --pretty=format: | sort -u
(no output)
```

`origin/main`'s most recent commit is `70c4633` dated **2026-08-24** — 14 days ago. **No file on main has changed in the last 7 days, so no candidate in this report carries CONFLICT-RISK.** Verified per-candidate anyway; the newest touch on any recommended file is `bdbbfac` (2026-08-11).

---

## Method

Three passes, cross-checked:

1. **Module reachability graph.** Resolved every static import, re-export and dynamic `import("…")` across all 324 `.ts`/`.tsx` files under `src/`, honouring `@/*` → `./src/*`, relative specifiers, `index.ts`, and `.json`. Seeded from **90 Next.js entry points**: every `page`/`layout`/`route`/`sitemap`/`opengraph-image`/`not-found`/`error`/`global-error`/`loading`/`template`/`default`/`icon`/`manifest` file under `src/app`, plus `src/instrumentation.ts` and `src/proxy.ts`.
2. **Per-symbol export inventory.** Extracted 417 exported symbols (function/const/class/interface/type/enum + `export { … }`) from every non-test file, excluding Next.js framework-reserved names (`default`, `generateMetadata`, `generateStaticParams`, `GET`/`POST`/…, `metadata`, `dynamic`, `revalidate`, `runtime`, `register`, …). Word-boundary fixed-string ripgrep for each across `src/`, `cypress/`, `scripts/`, `docs/`, `public/`, and the config files. Hits were bucketed into **outside-file production**, **test-only**, and **inside-own-file** so that "used internally, export redundant" is never confused with "genuinely dead".
3. **Route, dependency, asset and CSS passes.** Every `src/app/api/**/route.ts` mapped to its URL (dynamic segments wildcarded) and grepped for callers. Every `package.json` dependency grepped for real import specifiers. Every `public/` asset grepped repo-wide. Every custom class selector in `globals.css` grepped against `src/`, `public/` and `cypress/`.

Guard against false positives from dynamic class names: `rg 'animate-\$\{|print-\$\{'` returns nothing — there is **no runtime class-name concatenation anywhere in `src`**, so the CSS pass cannot be fooled.

---

## Headline result

```
TOTAL code files:                  324
PROD reachable from entry points:  284
UNREACHABLE:                        42
  of which test files:              42
  of which NON-test files:           0
```

**There are zero orphaned source files.** Every non-test `.ts`/`.tsx` in `src/` is reachable from a production entry point. This is a materially cleaner state than the 2026-08-10 scan, which found 3 dead files — all three were deleted and the deletion **did merge** (see "Status of prior findings" below).

Likewise: **zero dead API routes** and **zero unused npm dependencies**.

Everything remaining is small-grain: one dead function, five boilerplate assets, and a handful of dead CSS rules.

---

## Tier 1 — HIGH confidence, recommended for deletion tonight

### 1. Five `create-next-app` boilerplate SVGs in `public/` — **NEW**

| | |
|---|---|
| **Confidence** | **HIGH** |
| **Saves** | **3,314 bytes / 5 files** |
| **Conflict risk** | None — last touched `0825946` (2026-07-04) |

```
$ rg -n "file\.svg|globe\.svg|next\.svg|vercel\.svg|window\.svg" . \
    --glob '!node_modules' --glob '!.next' --glob '!.git' --glob '!.swarm'
(no matches)
```

Zero references anywhere in the repository — not in `src/`, not in `public/manifest.json`, not in `public/sw.js`'s precache list, not in `public/robots.txt`, not in `next.config.ts`, not in `cypress/`, not in `docs/`.

| File | Bytes |
|---|---:|
| `public/file.svg` | 391 |
| `public/globe.svg` | 1,035 |
| `public/next.svg` | 1,375 |
| `public/vercel.svg` | 128 |
| `public/window.svg` | 385 |
| **Total** | **3,314** |

These are the stock assets scaffolded by `create-next-app` and never used by this project. Cross-checked against the assets that *are* live so the pass is trustworthy: `favicon.svg` (3 referencing files), `og-default.png` (3), `icon-192.png` (4), `icon-512.png` (5), `manifest.json` (5), `apple-touch-icon.png` (2), `llms.txt` (2), `sw.js` (2) all resolve correctly.

⚠️ One operational note: these are `public/` files, so they are served at `/next.svg` etc. today. Deleting them turns those URLs into 404s. Nothing in the app or the sitemap links to them, and no external consumer has any reason to, but it is worth being aware that this is a *served-surface* deletion rather than a purely internal one.

---

### 2. `asPokemonTypes` — `src/lib/data/dex-subset.ts:221` — **ALREADY-REPORTED-AND-STILL-PRESENT**

| | |
|---|---|
| **Confidence** | **HIGH** |
| **Saves** | 4 lines + 1 now-orphaned type import ≈ 180 bytes |
| **Conflict risk** | None — file last touched `bdbbfac` (2026-08-11) |

```
$ rg -n -w "asPokemonTypes" . --glob '!node_modules' --glob '!.next' --glob '!.git'
./src/lib/data/dex-subset.ts:221:export function asPokemonTypes(types: string[]): PokemonType[] {
```

**One occurrence in the entire repository — the declaration itself.** Not used by production, not used by tests, not used by Cypress, not used by scripts. A three-line `as` cast helper:

```
220  /** Narrow a string[] of types to the typed PokemonType union. */
221  export function asPokemonTypes(types: string[]): PokemonType[] {
222    return types as PokemonType[];
223  }
```

This is the only symbol in the codebase with genuinely zero references. It was reported as finding #6 in the 2026-08-10 scan (then at line 123, now at 221) and marked "trivial — piggyback only". It survived that cleanup pass while findings #1/#2/#3/#7 were all actioned, so it is now the single remaining true dead function.

**⚠️ Cascade — must be handled in the same edit.** `PokemonType` is imported solely to serve this function:

```
$ rg -n -w "PokemonType" src/lib/data/dex-subset.ts
38:import type { PokemonType } from "@/lib/types/pokemon";
45:  /** Types as strings — narrowed to PokemonType at the consumer boundary. */   ← comment only
220:/** Narrow a string[] of types to the typed PokemonType union. */              ← comment only
221:export function asPokemonTypes(types: string[]): PokemonType[] {
222:  return types as PokemonType[];
```

Lines 45 and 220 are prose in comments, not code references. Deleting lines 220–223 without also deleting the `import type` on line 38 leaves an unused import, which `@typescript-eslint/no-unused-vars` (active via `eslint-config-next/typescript` in `eslint.config.mjs`) will flag — and `eslint` runs in `.github/workflows/ci.yml` on every push. **Delete line 38 and lines 220–223 together.**

---

### 3. Four dead CSS rules in `src/app/globals.css` — **NEW**

| | |
|---|---|
| **Confidence** | **HIGH** (three of four); **MEDIUM** on `.print-keep-together` |
| **Saves** | ~29 lines / ~800 bytes |
| **Conflict risk** | None — file last touched `0825946` (2026-07-04) |

Of the 32 custom class selectors defined in `globals.css`, four have zero usages anywhere in `src/`, `public/` or `cypress/`. Verified individually with a repo-wide fixed-string grep; each returns only its own definition line:

```
$ rg -n --fixed-strings "animate-fade-in-up" . --glob '!node_modules' --glob '!.next' --glob '!.git'
./src/app/globals.css:443:.animate-fade-in-up {

$ rg -n --fixed-strings "animate-like-pop" . --glob '!node_modules' --glob '!.next' --glob '!.git'
./src/app/globals.css:457:.animate-like-pop {

$ rg -n --fixed-strings "version-diff-banner" . --glob '!node_modules' --glob '!.next' --glob '!.git'
./src/app/globals.css:935:.version-diff-banner {

$ rg -n --fixed-strings "print-keep-together" . --glob '!node_modules' --glob '!.next' --glob '!.git'
./src/app/globals.css:675:  .print-keep-together,
```

Each dead rule drags a dead `@keyframes` with it. Confirmed that each keyframe has exactly one consumer — the dead rule — so both go together:

| Lines | What | Sole consumer |
|---|---|---|
| `391–394` | `@keyframes fade-in-up` | `.animate-fade-in-up` (dead) |
| `443–445` | `.animate-fade-in-up` | — none |
| `451–455` | `@keyframes like-pop` | `.animate-like-pop` (dead) |
| `457–459` | `.animate-like-pop` | — none |
| `935–937` | `.version-diff-banner` | — none |
| `939–948` | `@keyframes fade-slide-down` | `.version-diff-banner` (dead) |

```
$ rg -n "fade-slide-down" . --glob '!node_modules' --glob '!.next' --glob '!.git'
./src/app/globals.css:936:  animation: fade-slide-down 0.3s cubic-bezier(0.32, 0.72, 0, 1) both;
./src/app/globals.css:939:@keyframes fade-slide-down {
```

`fade-slide-down` is referenced only from inside the dead `.version-diff-banner` rule — a self-contained dead pair.

**Note on the neighbours, to prevent an over-eager edit.** `@keyframes fade-in` / `.animate-fade-in`, `@keyframes pop-in` / `.animate-pop-in`, `.animate-sheet-up`, `.animate-toast-in` and `.version-diff-highlight` are all **live** and sit immediately adjacent to the dead blocks. The deletion must be surgical — take the six ranges listed above and nothing else.

**`.print-keep-together` is MEDIUM, not HIGH.** It is one selector inside a grouped print rule (`.card, [class*="Card"], .print-keep-together, [role="list"] > *, .grid > *`). The class is never applied, so the selector is dead — but the surrounding rule is live and the saving is a single line. This is a legitimate "escape hatch" utility a future print change might reach for. **Recommend leaving it**; take only the three HIGH pairs.

**HIGH-only CSS total: lines 391–394, 443–445, 451–455, 457–459, 935–948 — 28 lines.**

---

## Tier 2 — Production-dead but test-covered (human review required)

### 4. `isRateLimited` — `src/lib/rate-limit.ts:84` — **ALREADY-REPORTED-AND-STILL-PRESENT**

| | |
|---|---|
| **Confidence** | **HIGH** that it is production-dead; **NOT recommended for tonight** |
| **Saves** | 11 lines, +46 lines / 1,503 B if the test file goes too |

Unchanged since the 2026-08-10 scan (finding #4). Its own docblock still declares it legacy:

```
80  /**
81   * Synchronous in-memory rate limiter (legacy API).
82   * Kept for backward compatibility — prefer isRateLimitedAsync.
83   */
84  export function isRateLimited(
```

```
$ rg -n -w "isRateLimited" src cypress scripts docs
src/lib/rate-limit.ts:84:export function isRateLimited(
src/lib/__tests__/rate-limit.test.ts:  ← 16 hits, all in this one test file
```

Zero production call sites; both real consumers (`src/lib/security/api-guard.ts:33`, `src/app/api/feedback/route.ts`) use `isRateLimitedAsync`. But `src/lib/__tests__/rate-limit.test.ts` is still the **only** coverage of the in-memory sliding-window logic that `isRateLimitedAsync` itself falls back to. The correct move remains a **coverage swap** (retarget the test at `isRateLimitedAsync`, then drop the sync export), which is a behaviour-changing refactor needing human sign-off — not a deletion. **Carrying forward unchanged; do not act tonight.**

### 5. `@pkmn/dex` misclassified as a production dependency — **ALREADY-REPORTED-AND-STILL-PRESENT**

| | |
|---|---|
| **Confidence** | **HIGH** on the facts; **NOT recommended for tonight** |
| **Saves** | ~1.8 MB off the production install graph |

Re-verified. Still in `dependencies` in `package.json:27`. There is **no runtime import in `src/`** — every one of the 20+ hits is a comment or a changelog string:

```
$ rg -n "@pkmn/dex" src scripts package.json
package.json:27:    "@pkmn/dex": "^0.10.7",
scripts/build-dex-subset.mjs:48:import { Dex } from "@pkmn/dex";     ← the ONLY real import
src/lib/data/dex-subset.ts:5,6,29,34,…                                ← comments
src/lib/data/pkmn-dex-fallback.ts:12,13,17,56,62,75,128               ← comments
src/app/changelog/data.ts:191,192                                     ← changelog prose
…
```

Production reads the pre-extracted `src/lib/data/dex-subset.json` via `pkmn-dex-fallback.ts`. Moving the package to `devDependencies` is near-certainly correct, but it is an install-behaviour change that should be validated against a real Vercel build. **Carrying forward unchanged; still needs the deliberate commit it needed a month ago.**

---

## Tier 3 — Leftover from reverted work (investigated, NOT recommended)

### 6. `src/lib/db/migrations/add-species-column.sql` — superseded by its own revert

The migrations directory contains a matched add/drop pair:

```
src/lib/db/migrations/add-species-column.sql
src/lib/db/migrations/drop-species-column.sql
src/lib/db/migrations/add-unlisted-column.sql
```

`drop-species-column.sql` is explicit that the add was reverted:

```
-- VGC-218 (Option B): drop the write-only shares.species[] column.
-- The column and its GIN index were added in add-species-column.sql to back
-- a planned O(1) Champions meta aggregation, but no read path ever moved to
-- the column — every consumer … still parses species out of data->>'paste'
-- via extractSpecies() at request time.
```

Confirmed no code reads the column — `src/app/api/explore/route.ts:313` still computes `species: extractSpecies(paste)` at request time, and `src/lib/db.ts` has no `species` column reference.

**Do not delete.** These `.sql` files are not imported by any code path (they are applied by hand against Neon); they are a *historical record of what was applied to production*. Removing the `add` while keeping the `drop` would make the schema history unreadable. `docs/WIKI.md:27` also documents the directory as the schema-migration log. Listed here only because the brief asked specifically for leftovers from reverted work — this is one, and the right answer is to keep it.

---

## Tier 4 — Redundant `export` keywords (NOT recommended)

51 symbols are `export`ed but have no importer outside their defining file. Of those, **49 are used inside their own file** (so the `export` is merely redundant — zero bytes saved by de-exporting, and tree-shaking already handles them), and the two with genuinely zero in-file use are findings #2 and #4 above.

This list is essentially unchanged from the 2026-08-10 scan. **Two clusters are new since then and both are explicitly do-not-touch:**

- **`evictStoredDraft` — `src/hooks/useTeamReport.ts:31`.** Used twice inside its own file (lines 67, 166). It was introduced by `70c4633` (2026-08-24), *the current tip of main* — the "published teams can no longer resurface as a device-only draft" fix. Newest code in the repo. Leave it alone.
- **`SectionKey`, `GlobalFieldKey`, `parseSectionKey`, `sectionKeyLabel`, `sectionKeySlide` — `src/lib/utils/version-diff.ts`.** All five are used internally by `getNavigableChanges` (lines 357–363) and `summarizeChangedFields` (lines 402–405), *and* imported by `src/lib/utils/__tests__/version-diff.test.ts`. These are **test-visibility exports** — a legitimate pattern, not dead code. The file was flagged as dirty/WIP in the previous scan, which is why they are appearing for the first time now. Do not de-export: it would break the test suite.

Also confirmed still in this category and still not worth touching: `pokemonToShowdown` (`export-paste.ts`), `parseFiltersFromUrl` / `buildUrlSearch` (`useExploreUrlSync.ts`), `isDynamicAllowedOrigin` (`cors.ts`) — all test-visibility exports; plus the ~40 prop-type / data-shape interfaces (`HowToStep`, `SportsEventData`, `BreadcrumbItem`, `FAQItem`, `PdfExportProps`, `MoveData`, `NatureData`, `AccentTheme`, `ReportTemplate`, `DexSubsetMegaStone`, `FilterState`, `TeamCombination`, `PrivateField`, `DamageCalcsMap`, …) which are legitimately public API of their modules.

Acting on any of these would be a ~40-file diff touching only `export` keywords, for no user-visible or bundle-visible gain, burning a full Vercel build — precisely the drive-by refactor `CLAUDE.md` forbids.

---

## Status of prior findings (delta vs. `c1-dead-code-10-08-26.md`)

The previous run's deletions **did merge** — this is the key answer to the brief's question.

| Prior # | Item | Status now |
|---|---|---|
| 1 | `src/components/display/DisplayTogglePill.tsx` | ✅ **RESOLVED** — deleted in `bdbbfac` "swarm: nightly improvements 10-08-26 (#73)". File and directory gone. |
| 2 | `src/lib/hooks/useGlobalDisplayPrefs.ts` | ✅ **RESOLVED** — deleted in `bdbbfac`. The confusing duplicate `src/lib/hooks/` directory is gone; only `src/hooks/` remains. |
| 3 | `src/components/providers/ConsentGate.tsx` | ✅ **RESOLVED** — deleted in `bdbbfac`. |
| 7 | Stale `/api/builder/` CORS exemption in `src/proxy.ts` | ✅ **RESOLVED** — the clause is gone. Only an explanatory comment survives at `src/proxy.ts:86`: *"a `/api/builder/` exemption used to live here for a builder proxy that…"*. The latent CORS hole is closed. |
| 5 | `getRegMBMegas` (`mega-pokemon.ts:846`) | ✅ **RESOLVED — by being wired up, not deleted.** It now has three live consumers: `src/app/champions/page.tsx:4,45`, `src/app/champions/ChampionsContent.tsx:17,63`, and `mega-pokemon.ts:914`. The previous scan's recommendation ("do not delete — staged Reg M-B API") was correct. |
| 6 | `asPokemonTypes` | 🔴 **STILL PRESENT** — see finding #2 above. |
| 4 | `isRateLimited` | 🔴 **STILL PRESENT** — see finding #4 above. Still awaiting the coverage swap. |
| 8 | `@pkmn/dex` in `dependencies` | 🔴 **STILL PRESENT** — see finding #5 above. |
| — | Tier-4 redundant exports | 🔴 Still present, still not worth acting on. Two new clusters (both do-not-touch) noted above. |

**Interpretation:** every item the previous run marked "✅ Safe — no review needed" was actioned and merged. Every item it marked "⚠️ human review" or "🟡 piggyback only" is still outstanding. The cleanup pipeline is working; the backlog is exactly the set of things that were deliberately deferred.

**Also resolved incidentally:** the stale `describe("encodeShareState / decodeShareState …")` label noted as harmless residue — `encodeShareState` no longer appears anywhere, and `url-codec.test.ts` still passes.

---

## Verified NOT dead (cleared, so the next scan need not re-litigate)

| Item | Why it's live |
|---|---|
| **All 324 source files** | Reachability graph: 284/324 reachable from the 90 Next.js entry points; the other 42 are all test files. **Zero orphaned non-test files.** |
| `src/lib/data/__validate-mega-coverage.ts` | Dynamically imported at `src/instrumentation.ts`. The `__` prefix makes it look orphaned; the graph resolves it correctly. |
| `/api/bot`, `/api/oembed`, `/api/webhooks/{clerk,linear,posthog}` | The only five routes with zero internal callers — all external entry points by design (Discord CLI, unfurlers, third-party webhook senders). **Never delete.** |
| `/api/cleanup`, `/api/cron/{daily-ops,weekly-report,posthog-errors,weekly-digest}` | All five declared in `vercel.json` `crons`. Invoked by Vercel, not by app code. |
| All 49 other API routes | Every one has ≥1 caller in `src/` or `vercel.json`. No dead routes. |
| **All 30 npm dependencies** | Every prod and dev dependency resolves to a real usage. `jsdom` (`@vitest-environment` pragmas), `start-server-and-test` + `typescript` (package.json scripts), `@types/*` (implicit), `tweetnacl` (`api/discord/route.ts:4`), `html2canvas-pro` (`lib/dynamic-imports/html2canvas.ts`), `jspdf`/`qrcode` (PDF+graphic export) all check out. `@pkmn/dex` is **misclassified, not unused** (finding #5). |
| `src/lib/db/migrations/*.sql` | Not code-imported by design; hand-applied ops records, documented in `docs/WIKI.md:27`. |
| 28 of 32 `globals.css` custom classes | All have live usages. Only the four in finding #3 are dead. |
| 11 of 16 `public/` assets | All referenced by `manifest.json`, `sw.js`, metadata or `robots.txt`. Only the five boilerplate SVGs are dead. |
| `src/hooks/useTeamReport.ts:evictStoredDraft` | Used twice in-file; shipped in the tip commit of main. |
| `src/lib/utils/version-diff.ts` section-key helpers | Used in-file by `getNavigableChanges` / `summarizeChangedFields` **and** by the test suite. |

---

## Recommended action list

| # | Action | Confidence | Saves | Verdict |
|---|---|---|---|---|
| 1 | Delete `public/{file,globe,next,vercel,window}.svg` | HIGH | 3,314 B / 5 files | ✅ Safe |
| 2 | Delete `asPokemonTypes` (`dex-subset.ts:220–223`) **+ the `PokemonType` import on line 38** | HIGH | ~180 B / 5 ln | ✅ Safe — both edits together |
| 3 | Delete `globals.css` lines 391–394, 443–445, 451–455, 457–459, 935–948 | HIGH | ~800 B / 28 ln | ✅ Safe — surgical, live rules adjoin |
| 3b | Delete the `.print-keep-together` selector (`globals.css:675`) | MEDIUM | 1 ln | 🟡 Leave it — useful escape hatch |
| 4 | Retarget `rate-limit.test.ts` at `isRateLimitedAsync`, then drop `isRateLimited` | HIGH | 11 + 46 ln | ⚠️ **Human review** — coverage swap |
| 5 | Move `@pkmn/dex` to `devDependencies` | HIGH | ~1.8 MB install | ⚠️ **Human review** — validate on Vercel |
| 6 | Delete `add-species-column.sql` | — | 1 file | ❌ **Do not** — schema history record |
| — | De-export the 49 Tier-4 symbols | HIGH | 0 bytes | ❌ **Do not** — drive-by refactor, no gain |

**Clean, no-review-needed total (#1 + #2 + #3): 5 files deleted + 33 lines removed ≈ 4.3 KB, zero CONFLICT-RISK, zero cascade beyond the one `import type` line called out in #2.** All three should pass `tsc` / `vitest` / `next build` untouched.

---

## Non-dead-code observations (FYI, out of scope)

- **`/tournaments` is still navigationally orphaned** — present in `src/app/sitemap.ts` but linked from no navbar or footer. Raised in the previous two scans; unchanged. Not dead code (SSG + sitemap = live), but users can only arrive from search.
- **No `/sign-in` route exists in `src/app`**, yet `src/app/notifications/page.tsx` and `src/app/dashboard/notifications/page.tsx` both `redirect("/sign-in…")`. Presumably resolved by Clerk's hosted portal via `CLERK_SIGN_IN_URL`; a misconfigured env var would turn both into 404s.
- **Codebase health is markedly improved.** Zero orphaned files, zero dead routes, zero unused dependencies. The residual dead code is 33 lines and five stock SVGs. There is very little left for this audit to find, and it may be worth reducing the cadence of this scan.
- **Working tree is dirty:** `.swarm/run-meta.md` modified, `.swarm/pr-backlog-analysis-07-09-26.md` untracked — both other agents' scratch output, neither is source.
