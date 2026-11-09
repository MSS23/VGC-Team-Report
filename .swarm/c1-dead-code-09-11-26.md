# C1 — Dead Code Scan (read-only)

**Date:** 2026-11-09
**Agent:** C1 (nightly code-quality swarm)
**Repo:** `/home/user/VGC-Team-Report` @ branch `swarm-nightly-2026-11-09` (scanned at tip `10dfd74`; line numbers re-verified at `75dbf32`)
**Scope:** (a) exported symbols in `src/` with no importer, (b) orphaned React components, (c) dead routes / API endpoints under `src/app`, (d) unused files in `src/lib` and `src/components`. Dependency pass included as a bonus.
**Mutations made:** none. No source file was edited, created or deleted; no state-changing git command was run. This report is the only write.

**Prior reports read first:** `.swarm/c1-dead-code-26-10-26.md` and `.swarm/c1-dead-code-10-08-26.md`. Every finding below is tagged **NEW** or **ALREADY-REPORTED** with its current status.

> ⚠️ **The working tree was dirty and actively churning during this scan.** Another swarm agent held uncommitted work on `src/app/api/share/route.ts`, `src/lib/db.ts`, `src/lib/parser/showdown-parser.ts`, `src/lib/sharing/url-codec.schemas.ts`, `src/lib/types/pokemon.ts`, plus untracked `src/lib/sharing/rental-code.ts` (+ test) and `src/lib/db/migrations/add-rental-code-column.sql` — `rental-code.ts` appeared and vanished mid-run. That work has since landed as **`75dbf32 VGC-291: carry the stat unit explicitly on ParsedPokemon`**, and `src/` is clean again.
>
> **Every line number in this report was re-verified by `sed` against the tree at `75dbf32`, after that commit landed.** None of the files I report on were in the churn set, and no line number moved.

---

## Headline

**Zero dead files. Zero dead routes. Zero unused dependencies.** The module reachability graph reaches **323 of 323 non-test code files** in `src/` from Next.js entry points. All remaining dead code is sub-file: dead symbols inside live files.

**The striking result of this run: nothing from the 2026-10-26 report was acted on.** All 10 SAFE_TO_DELETE findings and all 6 PROBABLY_DEAD findings are still present at (almost) the same line numbers. This report therefore adds only 4 genuinely new items, and its main value is a re-confirmed, line-pinned deletion list plus **one new load-bearing trap** (§Load-bearing, item L-1) that a naive unused-export tool would happily delete.

### Method

1. **Reachability graph** — real import graph resolving `@/*`, relative paths, `index.*`, `.json`, `.css`, static `import()` and `require()`, seeded from every App Router entry (`page`/`layout`/`route`/`sitemap`/`robots`/`not-found`/`error`/`global-error`/`loading`/`template`/`default`/`opengraph-image`/`icon`/`manifest`) plus `src/instrumentation.ts` and `src/proxy.ts`. Script: `scratchpad/graph.mjs`.
2. **Export inventory + per-symbol ripgrep** — 554 exported symbols extracted from every non-test `.ts`/`.tsx`/`.mts` in `src/`, each grepped word-boundary fixed-string across `src/ cypress/ scripts/ public/ next.config.ts vitest.config.ts cypress.config.ts eslint.config.mjs postcss.config.mjs vercel.json package.json .github/`. Hits bucketed into own-file / production / test so test-only symbols surface as *production-dead* instead of being counted live. Next.js reserved export names (`GET`, `metadata`, `generateStaticParams`, …) excluded in `src/app/`. Script: `scratchpad/exports.mjs`.
3. **Route pass** — every `src/app/**/{route,page}.tsx?` mapped to its URL with dynamic segments wildcarded (`/api/share/${id}/versions` matches `/api/share/[id]/versions`), then grepped for callers across source, cypress, `vercel.json` and `README.md`. Script: `scratchpad/routes.mjs`.
4. **Dead-prop pass** — members of every `*Props` / `*Options` type never read in the defining file, cross-checked against parents that pass them. Script: `scratchpad/props.mjs`. (16 raw hits, all false positives from the shared type module `pokemon-detail/types.ts`; one real class confirmed via ESLint instead — see M-1.)
5. **ESLint** — `node node_modules/eslint/bin/eslint.js .` for file-local dead code the cross-file passes structurally cannot see (31 `no-unused-vars` hits).
6. **Dependency pass** — all 26 production dependencies grepped as quoted import specifiers.

**Graph trustworthiness.** The only non-literal `import(` in all of `src/` is a formatted multi-line literal in a test file. All `next/dynamic` call sites use static string literals. No template-literal or variable module resolution exists, so nothing can hide from the graph. It correctly keeps `src/lib/data/__validate-mega-coverage.ts` live via the dynamic `await import("./lib/data/__validate-mega-coverage")` at `src/instrumentation.ts:14`.

---

# ✅ Safe to delete tonight

Exact paths and line ranges, verified against the current tree. All are pure deletions with zero importers and no cascade. **~50 LOC across 14 files, no behaviour change.**

Ordered so each step is independently committable with the gate green. Run `verification-gate` after each step; run `ui-checklist-reviewer` on steps 3–4 (`.tsx`).

### Step 1 — `src/lib` leaf deletions (no `.tsx`, zero conflict risk) · 22 LOC

| File | Delete lines | Symbol | Note |
|---|---|---|---|
| `src/lib/analysis/damage-calculator.ts` | **55–58** | `getCalcSpecies` | Last declaration in the file (58 lines) — clean tail truncation. `Generations` + `isChampionsFormat` stay live via `createCalcPokemon` / `calculateReportDamage`. |
| `src/lib/data/dex-subset.ts` | **219–223** and **38** | `asPokemonTypes` + its sole `import type { PokemonType }` | Lines 219 blank, 220 doc comment, 221–223 the function. The `PokemonType` import at :38 exists only for it — remaining mentions at :45 and :220 are comments, so it must go in the same edit. |
| `src/lib/discord-bot.ts` | **49–55** | `PRIORITY_LABELS` | Siblings `TYPE_EMOJI` (43–48) and the colour map stay. |
| `src/lib/sharing/url-codec.ts` | **77–84** | `toBase64Url` (module-local) | Sibling `fromBase64Url` (85+) **is live — keep it.** The 4 test hits are the test file's *own private copy* at `__tests__/url-codec.test.ts:12`; the symbol was never exported so the test cannot be importing it. |
| `src/lib/data/tags.ts` | **33** | `type EventType` | One line. **Keep** `EVENT_TYPES` (26–31, exported and live) and the live siblings `Archetype` / `Regulation` at 31–32. |

### Step 2 — token-level unused imports and bindings · ~3 LOC

Each is a token removal inside an otherwise-live line, except the two marked *(whole line)*.

| File:line | Binding to remove |
|---|---|
| `src/app/api/user/profile/route.ts:4` | `auth` from `import { auth, currentUser }` |
| `src/app/dashboard/DashboardContent.tsx:8` | `UserButton` from `import { UserButton, Show, SignInButton, useUser }` |
| `src/app/dashboard/profile/page.tsx:9` | `UserButton` from `import { UserButton, Show, SignInButton }` |
| `src/components/explore/ExploreContent.tsx:13` | `type SearchCategory` — **note** the symbol stays exported and live from `ExploreFilters.tsx`; only this import is dead |
| `src/components/home/HomePageClient.tsx:8` | `import Link from "next/link";` *(whole line)* |
| `src/components/home/HomePageClient.tsx:54` | `summarizeChangedFields` from the `version-diff` import |
| `src/components/home/HomePageClient.tsx:158` | `megaStates` destructured from `useHomePage` |
| **`src/components/report/SpeedTierChart.tsx:583`** | **NEW** — unused index `i` in `allEntries.map((entry, i) => {` → `allEntries.map((entry) => {`. The other four `(mon, i)` callbacks in this file (189, 236) **do** use `i` — do not touch those. |
| **`src/lib/__tests__/cron-auth.test.ts:1`** | **NEW** — unused `vi` from the vitest import |
| **`src/lib/sharing/__tests__/url-codec.test.ts:1`** | **NEW** — unused `vi` from the vitest import |

### Step 3 — single-line UI deletions · 3 LOC

| File:line | Delete | Why safe |
|---|---|---|
| `src/components/report/PokemonCard.tsx:180` | `const displayData = showMega ? megaData : effectiveBaseData;` | Never read. Identical to the live `sourceData` at :152. `megaData` (123) and `effectiveBaseData` (133) stay live via :137–139, :152–156, :164–166 — no cascade. Siblings `displayAbility` (172) / `displayStats` (177) are live. |
| `src/components/layout/Navbar.tsx:202` | `const [exportMenuOpen, setExportMenuOpen] = useState(false);` | Whole dead `useState` pair, neither half referenced. Removes one `useState` per Navbar render. Siblings `menuOpen` (201), `versionPanelOpen` (203), `pasteCopied` (204) are live. |
| `src/components/explore/SpotlightCard.tsx:4` **and** `:28` | `import { useTranslation } from "@/lib/i18n";` and `const { t } = useTranslation();` | `t` is never dereferenced in the file. Also drops a context subscription from a card rendered in a carousel. |

### Step 4 — `ExploreFilters` i18n maps · 18 LOC (biggest single win, highest-churn file — do it last, in its own commit)

`src/components/explore/ExploreFilters.tsx` — delete **57–62**, **65–70**, **73–78** (`CATEGORY_I18N`, `SORT_I18N`, `PLACEMENT_I18N`).

- **Do NOT also delete** the interleaved siblings `CATEGORY_KEYS` (56), `SORT_KEYS` (64), `PLACEMENT_KEYS` (72) — all three are live.
- **Do NOT touch the i18n translation keys.** All 7 locale files still need `filterCatAll`, `filterSortPopular`, `filterPlace1st`, … for the live inline path at :111–123 that superseded these maps.

---

## Findings table (ranked by confidence)

| # | Symbol / file | Kind | Conf. | Evidence (command run) | NEW / ALREADY-REPORTED | Safe to delete? |
|---|---|---|---|---|---|---|
| S-1 | `getCalcSpecies` — `src/lib/analysis/damage-calculator.ts:55-58` | unused export | **high** | `rg -n -w -F getCalcSpecies src cypress scripts` → 1 hit (declaration). Export scan: prod=0 test=0 ownHits=1. | ALREADY-REPORTED (26-10 SAFE-5; 10-08 did not list) — **still present** | ✅ yes |
| S-2 | `asPokemonTypes` + `PokemonType` import — `src/lib/data/dex-subset.ts:219-223, :38` | unused export | **high** | `rg -n -w -F asPokemonTypes src cypress scripts` → 1 hit. `rg -n -w PokemonType src/lib/data/dex-subset.ts` → 38, 45(comment), 220(comment), 221. | ALREADY-REPORTED **twice** (10-08 #6, 26-10 SAFE-4) — **still present** | ✅ yes |
| S-3 | `PRIORITY_LABELS` — `src/lib/discord-bot.ts:49-55` | dead module-local const | **high** | `rg -c -w -F PRIORITY_LABELS src cypress scripts` → `src/lib/discord-bot.ts:1`. ESLint: `50:7 'PRIORITY_LABELS' is assigned a value but never used`. | ALREADY-REPORTED (26-10 SAFE-3) — **still present** | ✅ yes |
| S-4 | `toBase64Url` — `src/lib/sharing/url-codec.ts:77-84` | dead module-local fn | **high** | `rg -c -w -F toBase64Url src cypress scripts` → `url-codec.ts:1`, `__tests__/url-codec.test.ts:4`. Test hits are its own copy at test:12. ESLint: `77:10 … defined but never used`. | ALREADY-REPORTED (26-10 SAFE-2) — **still present** | ✅ yes |
| S-5 | `type EventType` — `src/lib/data/tags.ts:33` | dead type alias | **high** | `rg -c -w -F EventType src cypress scripts` → `tags.ts:1`. ESLint: `33:6 'EventType' is defined but never used`. | ALREADY-REPORTED (26-10 SAFE-6) — **still present** | ✅ yes |
| S-6 | `CATEGORY_I18N` / `SORT_I18N` / `PLACEMENT_I18N` — `src/components/explore/ExploreFilters.tsx:57-62, 65-70, 73-78` | 3 superseded const maps | **high** | `rg -c -w -F CATEGORY_I18N src cypress scripts` → 1 hit each; ESLint flags all three at 57:7, 65:7, 73:7. Live replacement at `:111-123` (`t.filterCatAll`, …). | ALREADY-REPORTED (26-10 SAFE-1) — **still present, identical lines** | ✅ yes (18 LOC) |
| S-7 | `displayData` — `src/components/report/PokemonCard.tsx:180` | dead computed local | **high** | ESLint `180:9 'displayData' is assigned a value but never used`; `rg -n -w "megaData\|effectiveBaseData" src/components/report/PokemonCard.tsx` → both live at 123/133/137-139/152-156/164-166. | ALREADY-REPORTED (26-10 SAFE-7) — **still present** | ✅ yes |
| S-8 | `exportMenuOpen` / `setExportMenuOpen` — `src/components/layout/Navbar.tsx:202` | dead `useState` | **high** | ESLint `202:10` + `202:26`; `sed -n '200,206p'` confirms siblings live. | ALREADY-REPORTED (26-10 SAFE-8) — **still present** | ✅ yes |
| S-9 | dead `useTranslation()` — `src/components/explore/SpotlightCard.tsx:4, 28` | dead import + binding | **high** | ESLint `28:11 't' is assigned a value but never used`; `sed -n '1,8p;26,30p'` shows no `t.` anywhere. | ALREADY-REPORTED (26-10 SAFE-9) — **still present** | ✅ yes |
| S-10 | 7 unused imports / destructured bindings | token-level | **high** | ESLint `-f json` filtered on `no-unused-vars`; each verified to have no other reference in its file. Full list in Step 2. | ALREADY-REPORTED (26-10 SAFE-10) — **all 7 still present** | ✅ yes |
| S-11 | unused index `i` — `src/components/report/SpeedTierChart.tsx:583` | unused callback param | **high** | ESLint `583:35 'i' is defined but never used`; `rg -n -w "\bi\b" src/components/report/SpeedTierChart.tsx` → 189/236/240 use `i`, 583 does not. | **NEW** | ✅ yes |
| S-12 | unused `vi` — `src/lib/__tests__/cron-auth.test.ts:1`, `src/lib/sharing/__tests__/url-codec.test.ts:1` | unused test import | **high** | ESLint `1:32 'vi' is defined but never used` in both. | **NEW** | ✅ yes (test files, but dead imports) |
| M-1 | `syncStatus` prop — `src/components/layout/Navbar.tsx:68` (declared), `:186` (destructured) | **unwired prop — probable bug** | **high** (unused) / **medium** (that deletion is the right fix) | `rg -n -w syncStatus src` → full chain: `useCollaborativeSync.ts:147` → `useHomePage.ts:503,867` → `HomePageClient.tsx:117,925` → `Navbar.tsx:68,186` → **never rendered**. Contrast its sibling `collaborators`, which IS rendered at `Navbar.tsx:448-451`. ESLint `186:20`. | **NEW** | ⚠️ **no — escalate.** See M-1 below. |
| M-2 | `onResultChange` — `src/components/report/MatchupPlanSlide.tsx:415, 441, 456` | unwired prop — probable bug | medium | `rg -n -w onResultChange src/components/report/MatchupPlanSlide.tsx` → parent passes a real handler (415), child type declares it (441), child destructures it (456), never calls it. ESLint `456:3`. | ALREADY-REPORTED (26-10 PD-12) — **still present** (lines shifted 406→415, 432→441, 447→456) | ⚠️ no — file a ticket |
| M-3 | `selectedTemplate` / `onTemplateSelect` — `src/components/input/PasteInput.tsx:90, 91, 120` | unwired props — probable bug | medium | `rg -n -w "selectedTemplate\|onTemplateSelect" src/components/input/PasteInput.tsx src/components/home/HomePageClient.tsx` → wired at `HomePageClient.tsx:778-779`, destructured at `PasteInput.tsx:120`, never read. ESLint `120:89` + `120:107`. | ALREADY-REPORTED (26-10 PD-13) — **still present, identical lines** | ⚠️ no — file a ticket |
| M-4 | `category` prop on `CollapsibleCalcGroup` — `src/components/report/pokemon-detail/CalcEntryGroup.tsx:187` | unread prop | medium | ESLint `187:3 'category' is defined but never used`; one call site (`CalcsPanel.tsx`) ⇒ two-file edit. | ALREADY-REPORTED (26-10 PD-14) — **still present** | 🟡 probably — confirm the caller isn't expecting a label |
| M-5 | `hiddenSlides` option — `src/hooks/useSlideSystem.ts:13, 34` | unread hook option | medium | `rg -n -w hiddenSlides src/hooks/useSlideSystem.ts` → 13 (option type), 34 (destructured, never read). ESLint `34:35`. Caller at `useHomePage.ts`. | ALREADY-REPORTED (26-10 PD-15) — **still present** | 🟡 probably — private hook signature change (3 touch points) |
| M-6 | `isRateLimited` — `src/lib/rate-limit.ts:84` | production-dead, test-only | medium | Export scan: prod=0, test=16, ownHits=1. Production uses `isRateLimitedAsync` (`security/api-guard.ts`, `api/feedback`, `api/quick-share`). Own docblock: *"legacy API … prefer isRateLimitedAsync"*. | ALREADY-REPORTED (10-08 #4, 26-10 PD-11) — **still present** | ⚠️ no — deleting it strands the only coverage of the in-memory fallback. Re-point `rate-limit.test.ts` at `isRateLimitedAsync` **first**. |
| M-7 | `@pkmn/dex` in `dependencies` | misclassified dependency | medium | `rg -n '@pkmn/dex' src scripts package.json` → only real import is `scripts/build-dex-subset.mjs:48`; the `src/lib/data/dex-subset.ts` hit is a comment. Runtime reads the pre-extracted `dex-subset.json`. | ALREADY-REPORTED (10-08 #8) — **still present** | 🟡 move to `devDependencies` (~1.8MB off the install graph) — validate on Vercel, not a drive-by |
| L-1 | `MetricCursor` / `parseMetricCursor` / `serializeMetricCursor` — `src/lib/explore/chronological-cursor.ts:48, 96, 115` | **looks dead, is load-bearing** | **high** (production-dead) | Export scan: `serializeMetricCursor` prod=0, test=6, **ownHits=1**. `rg -n -w "parseMetricCursor\|serializeMetricCursor" src` → every non-test hit is a declaration or doc comment. `src/app/api/explore/route.ts:10-11` imports only the *chronological* pair. | **NEW** | ❌ **NO — DO NOT DELETE.** See L-1 below. |
| R-1 | ~50 redundant `export` modifiers | hygiene only | high | 77 exported symbols have prod=0 and test=0 but ownHits ≥ 2 — i.e. used inside their own file. Spot-verified `OG_IMAGE_STYLE`, `ogImageEnabled`, `MetricCursor`, `PurgeStatements`, `EffectiveForm`, `EffectiveTyping`, `CHAMPIONS_MC_DEX` as real local uses, not comment mentions. | ALREADY-REPORTED (10-08 Tier 4, 26-10 PD-17) | ❌ **never delete the symbols** — 0 LOC saved, and the symbol's own file would break |
| R-2 | 9 test-visibility exports | legitimate pattern | high | Export scan section B: `nextSpriteFallbackState`, `parseFiltersFromUrl`, `buildUrlSearch`, `parseFetchedShareState`, `getNature`, `getGenThemedSpriteUrls`, `isDynamicAllowedOrigin`, `SectionKey`/`parseSectionKey`/`sectionKeyLabel`/`sectionKeySlide`. Each is used internally **and** imported by its own test. | ALREADY-REPORTED (10-08, 26-10) | ❌ no — removing `export` breaks the test |
| R-3 | 4 hand-run SQL migrations — `src/lib/db/migrations/*.sql` | operational log | high | `rg -n "migrations/\|add-species-column\|add-unlisted-column\|drop-species-column" src scripts .github package.json` → only one `.sql` citing another in a comment. `/api/migrate` does not read them. | ALREADY-REPORTED (26-10 PD-16) — **now 4 files**: `add-rental-code-column.sql` arrived tonight (untracked, VGC-226) | ❌ no — schema history, costs nothing |

---

## ❗ Load-bearing — looks dead, is not

### L-1 · `MetricCursor` / `parseMetricCursor` / `serializeMetricCursor` — `src/lib/explore/chronological-cursor.ts` · **NEW** · DO NOT DELETE

This is the one finding of the night that a naive unused-export tool would get badly wrong, and the reason it is called out at length.

All three symbols are **genuinely production-dead**: `/api/explore/route.ts:10-11` imports only the *chronological* pair (`parseChronologicalCursor`, `serializeChronologicalCursor`, used at :213, :342-343). The *metric* trio has **zero production call sites** — `serializeMetricCursor` has `ownHits=1` (its own declaration) and 6 test hits.

But the module's own header (lines 4–26) documents them as the deliberately-staged half of an unfinished fix:

```
 * VGC-295 IS ONLY HALF-FIXED. DO NOT ASSUME THE BUG IS GONE.
 ...
 * This module is the cursor half of the fix: every cursor now carries a
 * full `(timestamp, id)` pair, so the route *can* filter unambiguously.
 *
 * STILL OUTSTANDING: the SQL half. The WHERE/ORDER BY mismatch in
 * `route.ts` (~L194-195 popular, ~L208-209 views, ~L217-227 chronological)
 * is UNCHANGED and still mispaginates. The ticket gates that edit on an
 * `EXPLAIN` against a real database ...
 * Whoever has a database next: run the
 * EXPLAIN, then make WHERE and ORDER BY agree on `(timestamp, id)` using
 * `parseMetricCursor().id` / `parseChronologicalCursor().id`.
```

Deleting these three symbols would delete the completed half of a live P-bug fix, silently re-close VGC-295, and leave the `popular` / `views` Explore sorts tuple-comparing on `(metric, created_at)` with no id tiebreaker — rows skipped or duplicated across page boundaries. **The correct action is to finish VGC-295 (the SQL half), not to delete the cursor half.** Recorded here so no future scan raises it as a deletion candidate.

### L-2 · `_removed` — `src/lib/utils/normalize-report.ts:97` · **NEW** · not dead code

```js
// Remove spreadNotes from output — it's been merged into notes
const { spreadNotes: _removed, ...rest } = data;
```

ESLint flags it (`97:24 '_removed' is assigned a value but never used`) but this is the standard rest-destructuring **omit idiom** — the binding exists precisely so `spreadNotes` is excluded from `rest`. Deleting it would leak `spreadNotes` back into the output and undo the merge. If the warning is unwanted, the fix is an ESLint `varsIgnorePattern: "^_"`, not a code change.

### L-3 · other ESLint `no-unused-vars` hits that must stay

| Hit | Why it stays |
|---|---|
| `src/app/global-error.tsx:4` `_error` | Next.js passes `{ error, reset }` to `global-error` by contract; the rename to `_error` is the deliberate "intentionally unused" marker. **NEW** sighting, zero value in touching. |
| `src/app/api/user/push/__tests__/route.test.ts:26, 33` `_args` | Intentionally-ignored mock callback args. **NEW** sighting, not dead code. |

### L-4 · framework / externally-invoked entry points — not dead, do not re-report

Confirmed again this run; carried forward from both prior reports.

| Item | Why it has zero inbound references |
|---|---|
| `/api/bot`, `/api/webhooks/{clerk,linear,posthog}` | The only four routes in the repo with **zero** production references. All are external callers' entry points (Discord interactions with `tweetnacl` verification; Clerk / Linear / PostHog webhook targets). Per CLAUDE.md the Linear-webhook P0 is stale/merged — not re-verified. |
| `/api/cron/{daily-ops,weekly-report,weekly-digest,posthog-errors}`, `/api/cleanup` | Declared as Vercel crons in `vercel.json:4,8,12,16,20`. Invoked by the platform. |
| `/api/{setup,migrate,keep-alive}` | Operational. `/api/setup` is documented in `README.md:30`; `/api/keep-alive` is probed by `api/cron/daily-ops/route.ts:17`; `/api/migrate`'s only textual hits are changelog entries — applied by hand. |
| `/api/oembed` | oEmbed provider, advertised to unfurlers at `src/app/s/[id]/page.tsx:154`. |
| `/q/[id]` | Reached via the URL the API *returns* (`api/quick-share/route.ts:25`), never a static `href`. |
| `src/lib/data/__validate-mega-coverage.ts` | Live via the dynamic import at `src/instrumentation.ts:14`. The `__` prefix makes it look orphaned. |
| `src/lib/i18n/translations/{fr,it,es,ja,ko,zh}.ts` | Default exports loaded by the lazy map in `src/lib/i18n/index.ts`. |
| 25 named page/layout functions (`SharePage`, `ExplorePage`, `RootLayout`, `GlobalError`, …) | App Router default exports. My export scan surfaces them with `ownHits=1`; they are entry points, **not** dead code. |
| `src/app/dashboard/notifications/` vs `src/app/notifications/` | **Not duplicates.** Preferences form vs. activity feed; one inbound link each (`DashboardContent.tsx:155`, `NotificationBell.tsx`). |
| `/compare` absent from `sitemap.ts` | Deliberate (`robots: index:false`), with a "do not re-add" comment (VGC-272). |
| `src/components/match-tracker/MatchTracker.tsx`, `src/lib/dynamic-imports/html2canvas.ts` | Newer files, both live — `DashboardContent.tsx:11,419` and the shared `html2canvas-pro` chunk wrapper respectively. Checked because they are new since the last scan. |

### Dependencies: none unused

All 26 production dependencies resolve to a real import in `src/`, `scripts/` or `next.config.ts`. Lowest-usage-but-live (one import each): `@upstash/ratelimit`, `cheerio`, `html2canvas-pro`, `posthog-node`, `tweetnacl`, `vanilla-cookieconsent`. The four `@opentelemetry/*` packages are genuinely imported by `src/instrumentation.ts`; their appearance in `next.config.ts` is the required `serverExternalPackages` declaration. Only misclassification is M-7 (`@pkmn/dex`).

---

## Delta vs. the two prior scans

| | |
|---|---|
| **Acted on since 2026-10-26** | **Nothing.** All 10 SAFE and all 6 PROBABLY_DEAD findings are still present. Line numbers shifted only in `MatchupPlanSlide.tsx` (+9, from unrelated churn). |
| **Acted on since 2026-08-10** | Good follow-through on the whole-file cluster: `DisplayTogglePill.tsx`, `useGlobalDisplayPrefs.ts`, `ConsentGate.tsx` are all **gone**, along with the `src/components/display/` and `src/lib/hooks/` directories. `getRegMBMegas` is **gone**. The stale `/api/builder/` CORS exemption (10-08 #7) is **closed** — `src/proxy.ts:86` now carries only a NOTE comment explaining the removal. |
| **Still outstanding from 2026-08-10** | `asPokemonTypes` (S-2), `isRateLimited` (M-6), `@pkmn/dex` classification (M-7). |
| **Newly dead / newly found this run** | S-11 (`SpeedTierChart` unused `i`), S-12 (two unused `vi` imports), **M-1 (`syncStatus` — new unwired prop, the third instance of this pattern)**, **L-1 (metric-cursor trio — production-dead but load-bearing)**, L-2/L-3 (three non-findings worth recording so they are not re-raised). |
| **Structural trend** | Three separate "parent wires a prop, child destructures and ignores it" bugs now coexist (M-1 `syncStatus`, M-2 `onResultChange`, M-3 `selectedTemplate`/`onTemplateSelect`). This is no longer a coincidence — it is the dominant defect shape in this codebase, and ESLint's `no-unused-vars` is already catching all three. **Recommendation: promote `@typescript-eslint/no-unused-vars` from `warn` to `error` for destructured function parameters.** CI made lint blocking in `d8aba62`, so with the Step 1–4 cleanup landed the repo would be at zero warnings and the gate would catch the fourth instance of this bug at the point it is introduced, instead of a month later in a nightly scan. |

## M-1 · `syncStatus` — the one new escalation

`src/components/layout/Navbar.tsx:68` declares `syncStatus?: string;` under the comment `// Collaborative sync`, and `:186` destructures it alongside `collaborators`. `collaborators` is rendered at `:448-451` (`{collaborators} editing`). **`syncStatus` is never rendered.**

The full producer chain is real and live: `useCollaborativeSync.ts:31,147` → `useHomePage.ts:503,867` → `HomePageClient.tsx:117,925` → `Navbar`. The hook maintains a 6-state machine (`"idle" | "connecting" | "syncing" | "synced" | "conflict" | "disconnected"`) driven by the `/api/sync/[id]` SSE stream, and it is threaded through four files to a component that drops it on the floor.

The user-facing symptom is *"no indication of collaborative sync state — including no 'conflict' or 'disconnected' warning — while co-editing a shared report."* Note `"conflict"` and `"disconnected"` are the two states a user most needs to see.

**Do not delete.** Deleting the prop would also strand the `syncStatus` return value through three intermediate files and cement a silent-failure UX on the collaboration feature. File a ticket to *render* it next to the existing `{collaborators} editing` badge — same place, same condition.

---

## Recommended action order

1. **Steps 1–4 above** (the ✅ section): ~50 LOC, 14 files, zero behaviour change, no judgement required. Four commits, `verification-gate` after each, `ui-checklist-reviewer` on steps 3–4.
2. **File three tickets, delete nothing:** M-1 (`syncStatus`, new), M-2 (`onResultChange`), M-3 (`selectedTemplate`/`onTemplateSelect`). All three are unwired features; the fix is to *use* the value, not remove it.
3. **Low-priority hygiene:** M-4, M-5. Then M-6 **only** bundled with re-pointing `rate-limit.test.ts` at `isRateLimitedAsync` so the in-memory fallback keeps coverage.
4. **Deliberately, not as a drive-by:** M-7 (`@pkmn/dex` → `devDependencies`), validated against a real Vercel build.
5. **Finish VGC-295** (the SQL half in `api/explore/route.ts`) — that is what makes L-1 live rather than dead.
6. **Consider** promoting `no-unused-vars` to `error` once Steps 1–4 land (see Delta, structural trend).
7. **Never:** R-1 (de-exporting ~50 locally-used symbols), R-2 (test-visibility exports), R-3 (SQL migration log), L-1, L-2, L-3.

**This repo remains in good structural shape: no dead files, no dead routes, no unused dependencies — for the third scan running.** The debt is entirely sub-file, and it is not shrinking because the last report's safe list was never executed.
