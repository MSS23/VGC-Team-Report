# C1 — Dead Code Scan (read-only)

**Date:** 2026-11-16
**Agent:** C1 (audit wave)
**Repo:** `/home/user/VGC-Team-Report` @ `10dfd74` (main)
**Scope:** unused exports in `src/`, orphaned components, dead routes (page + API), unused files in `src/lib/**`, unused npm dependencies. Plus an i18n key pass (new this run).
**Mutations made:** none. No source file edited, created or deleted; no state-changing git command run. This report file is the only write.

---

## Method

1. **Module reachability graph.** Resolved every static `import`/`export … from`, `import()` and `require()` (handling `@/*`, relative paths, `index.ts`, `.json`), seeded from all 96 Next.js convention entry points under `src/app` plus `src/instrumentation.ts` and `src/proxy.ts`.
2. **Export inventory.** Extracted 514 exported symbols from every non-test `.ts`/`.tsx`/`.mts` in `src/`, then ran a word-boundary fixed-string `rg` for each across `src/`, `cypress/`, `scripts/`, `public/`, `docs/`, `.github/`, and every root config file. Hits in the defining file were counted separately from external hits; external hits were split prod vs. test so test-only symbols surface as *production-dead* rather than "live".
3. **Route pass.** Every `src/app/**/{page.tsx,route.ts}` mapped to its URL with dynamic segments wildcarded, then grepped for callers; cross-checked against `src/app/sitemap.ts`, `vercel.json` and the layout components.
4. **Dependency pass.** Each `package.json` dependency grepped as a quoted import specifier, with a config/script fallback.
5. **ESLint** (`node node_modules/eslint/bin/eslint.js . --format json`) for file-local dead code the cross-file passes structurally cannot see.
6. **i18n key pass** (new). All 314 keys in `en.ts` checked against every static `t.<key>` / `t?.<key>` site **and** against the string-keyed lookup sites.

**Why the graph can be trusted.** `rg 'import\(\s*`'` and `rg -E 'import\(\s*[a-zA-Z_$]'` over `src` both return **zero** hits — there is no template-literal or variable module resolution anywhere. All 29 `next/dynamic` call sites use static string literals. Nothing can hide from the graph.

**Headline:** 407 code files; **325 reachable from production entry points, 82 unreachable — and all 82 are test files.** Zero orphaned files, zero orphaned components, zero dead routes, zero unused dependencies. All remaining dead code is sub-file, **except** the i18n finding, which is the one substantial item this run.

**Trap avoided (read this before deleting anything in `src/lib/explore/`).** `MetricCursor` / `parseMetricCursor` / `serializeMetricCursor` in `src/lib/explore/chronological-cursor.ts` have **zero production consumers** — `src/app/api/explore/route.ts:9-12` imports only the two `*ChronologicalCursor` functions. They look like textbook dead code. They are **deliberate scaffolding for an open ticket**: the file header (`:4-26`) states VGC-295 is half-fixed, that the SQL half of the fix is still outstanding, and that whoever has a database next must wire the route up "using `parseMetricCursor().id`". **Do not delete.** Marked KEEP below.

---

## Summary table

| # | Symbol / file | Kind | Evidence it's unused | Confidence | Safe to delete? |
|---|---|---|---|---|---|
| 1 | 73 orphaned i18n keys in all 7 locale files | dead data (511 LOC) | zero static `t.<key>` sites and not in the 20-key string-lookup set; see §1 | **high** | **yes** (type-gated) |
| 2 | `getCalcSpecies` — `src/lib/analysis/damage-calculator.ts:56-58` | unused export | declaration is the **only** occurrence in the whole repo | **high** | **yes** |
| 3 | `asPokemonTypes` + `PokemonType` import — `src/lib/data/dex-subset.ts:220-223` & `:38` | unused export | declaration is the only occurrence repo-wide | **high** | **yes** |
| 4 | `CATEGORY_I18N`, `SORT_I18N`, `PLACEMENT_I18N` — `src/components/explore/ExploreFilters.tsx:57-62, 65-70, 73-78` | superseded consts (18 LOC) | 1 `rg` hit each (declaration); replaced by inline literals at `:111-123` | **high** | **yes** |
| 5 | `toBase64Url` — `src/lib/sharing/url-codec.ts:77-83` | module-local fn | not exported, no caller in module; test has its own copy | **high** | **yes** |
| 6 | `PRIORITY_LABELS` — `src/lib/discord-bot.ts:50-55` | module-local const | 1 `rg` hit (declaration) | **high** | **yes** |
| 7 | `type EventType` — `src/lib/data/tags.ts:33` | module-local type | 1 `rg` hit (declaration) | **high** | **yes** |
| 8 | `displayData` — `src/components/report/PokemonCard.tsx:180` | dead local | computed, never read | **high** | **yes** |
| 9 | `exportMenuOpen`/`setExportMenuOpen` — `src/components/layout/Navbar.tsx:202` | dead `useState` | neither half referenced | **high** | **yes** |
| 10 | `useTranslation()` + import — `src/components/explore/SpotlightCard.tsx:4, 28` | dead hook call | `t` never dereferenced in file | **high** | **yes** |
| 11 | 8 unused imports / bindings (token-level) | unused imports | ESLint `no-unused-vars`; see §2 | **high** | **yes** |
| 12 | `syncStatus` prop — `src/components/layout/Navbar.tsx:68, 186` | **unwired prop** | full chain wired, child never reads it; see §3 | medium | **no** — likely missing UI |
| 13 | `onResultChange` — `src/components/report/MatchupPlanSlide.tsx:406, 432, 456` | **unwired prop** | parent passes real handler, child ignores it | medium | **no** — likely wiring bug |
| 14 | `selectedTemplate`/`onTemplateSelect` — `src/components/input/PasteInput.tsx:90-91, 120` | **unwired props** | `HomePageClient:778-779` wires both, child ignores | medium | **no** — likely wiring bug |
| 15 | `category` prop — `src/components/report/pokemon-detail/CalcEntryGroup.tsx:187` | unused prop | destructured, never read | medium | probably (2-file edit) |
| 16 | `hiddenSlides` option — `src/hooks/useSlideSystem.ts:13, 34` | unused option | destructured, never read; hook uses callbacks instead | medium | probably |
| 17 | `isRateLimited` — `src/lib/rate-limit.ts:84-90` | production-dead export | only refs are declaration + its own test | medium | **no** — see §4 |
| 18 | `serializeMetricCursor` / `parseMetricCursor` / `MetricCursor` — `src/lib/explore/chronological-cursor.ts:48-52, 96-113, 115-120` | production-dead export | zero prod consumers | **n/a** | **NO — KEEP**, open-ticket scaffolding |
| 19 | 3 `.sql` files — `src/lib/db/migrations/*.sql` | operational log | no code references the dir or filenames | low | **no** — keep as schema history |
| 20 | ~52 redundant `export` modifiers | hygiene, 0 LOC | symbol used **inside its own file**; see §5 | medium | **do not delete the symbols** |

**High-confidence deletable: 20 items** (rows 1-11, counting row 11's eight bindings individually). **~558 LOC**, of which 511 is row 1.

---

## §1 · The 73 orphaned i18n keys — biggest single cleanup (511 LOC)

`en.ts` declares **314** keys. `src/lib/i18n/translations/en.ts:387` defines `TranslationKeys = { [K in keyof typeof en]: string }`, and all 6 other locales are typed `const xx: TranslationKeys`, so **every locale carries exactly 314 keys** (verified by count). A key therefore costs 7 lines, and deleting one requires deleting it from all 7 — which `tsc` enforces, so a partial deletion fails loudly rather than silently.

**Why this needed care.** Two `Proxy` wrappers (`src/lib/i18n/index.ts:81-86`, `src/components/ui/ShareModal.tsx:91-96`) forward `prop` to an English fallback. They do **not** enumerate keys — the prop is whatever the consumer statically wrote — so they don't hide usage. But there *is* a genuine string-keyed registry: `src/components/report/CommonModesSlide.tsx:106-109` defines `tr(key: string, fallback: string)` reading `t` as `Record<string, string|undefined>`, called both with string literals and with `block.labelKey`/`block.placeholderKey` from the table at `:70-72`. Plus `src/hooks/useSlideSystem.ts:56` does `(t as unknown as Record<string, string|undefined>).commonModesTitle`.

**20 keys are live only through that registry and are excluded from the deletion list:**
`addCombination, combinationBack, combinationLabel, combinationLeads, combinationStrategy, combinationStrategyPlaceholder, commonCombinationsDesc, commonCombinationsTitle, commonModesEmpty, commonModesTitle, gameplan, gameplanPlaceholder, legacyLeadsLabel, legacyModesLabel, legacyNotesTitle, removeCombination, strengths, strengthsPlaceholder, weaknesses, weaknessesPlaceholder`

The remaining **73** have zero static `t.<key>` site, are not in the registry set, and (spot-checked on `loadSample`, `exportTeam`, `searchPlaceholder`, `listPublicly`, `offensiveTypeCoverage`, `noWeakness`, `setPasscode`, `sortNewest`) have **zero occurrence anywhere** in `src/` or `cypress/` outside `translations/`.

They cluster by removed/refactored feature, which is corroborating evidence rather than coincidence:

| Cluster | `en.ts` lines | Keys | Corroboration |
|---|---|---|---|
| Type-coverage charts | 230-247 | `offensiveTypeCoverage, defensiveTypeCoverage, offensiveCoverageDesc, defensiveCoverageDesc, gaps, noSeCoverage, thin, onlyOneAnswer, covered, twoPlusAnswers, vulnerable, threePlusWeak, exposed, twoWeak, manageable, oneWeak, resistant, noWeakness` | `Offensive/DefensiveCoverageChart.tsx` call `useTranslation()` for `language` only — labels are hardcoded |
| Passcode sharing | 267-274 | `setPasscode, unlockEditing, passcodeEditDesc, passcodeUnlockDesc, enterPasscode, passcode, shareWithPasscode, shareWithoutPasscode` | **feature no longer exists** — zero passcode UI in `ShareModal.tsx` or anywhere in `src/components` |
| Comments | 372-380 | `reactions, comments, addComment, commentPlaceholder, displayNameLabel, anonymous, deleteComment, noComments, loadMoreComments` | `CommentSection.tsx` never calls `useTranslation()`; `:271` hardcodes `"No comments yet. Be the first!"` |
| Explore sort/search | 290-294, 371 | `exploreTitle, searchPlaceholder, sortNewest, sortUpdated, sortPopular` | superseded by the `filter*` keys (`en.ts:296-304`) that `ExploreFilters.tsx:111-123` actually reads — note the near-duplicate pair `sortPopular` (dead, :371) vs `filterSortPopular` (live, :300) |
| Edit-link / share copy | 35-41, 117-122 | `exportTeam, exportCopied, editLink, present, newShort, publicLinkCopied, saveEditLink, copyEditLink, lostEditLink, generateNewEditLink, oldEditLinkStops` | share flow reworked |
| Legacy common-modes | 197-198, 203-204, 218 | `commonLeads, commonModesField, commonLeadsPlaceholder, commonModesPlaceholder, combinationsEmpty` | superseded by the registry keys kept above |
| Misc | 11, 26, 46, 86-89, 107-109, 173-174, 255, 284-286, 314-315 | `loadSample, locked, tournamentInfo, base, benchmarks, tailwindDoublesBase, visible, hideSlideTooltip, hiddenSlideTooltip, yourBring4, selectedCount, pasteCalcsPlaceholder, exportAsImage, exportAsPdf, exporting, listPublicly, listPubliclyTooltip` | — |

**Framing the reviewer should weigh.** For the three clusters whose *feature still exists* (coverage charts, comments), the keys are dead because the component hardcodes English — so an alternative fix is to *use* the keys and localize those surfaces. Deleting them is correct dead-code hygiene but it does close off six languages for those panels. The passcode cluster has no such tension: the feature is gone, delete freely.

**Side finding (not dead code, a content bug):** `src/hooks/useWalkthrough.ts:115` still tells users *"Set a passcode to let trusted people edit and re-share"* for a feature that no longer exists. Worth a ticket independently of this cleanup.

## §2 · Token-level unused imports and bindings (ESLint-verified)

| Binding | File:line |
|---|---|
| `auth` (from `import { auth, currentUser }`) | `src/app/api/user/profile/route.ts:4` |
| `UserButton` | `src/app/dashboard/DashboardContent.tsx:8` |
| `UserButton` | `src/app/dashboard/profile/page.tsx:9` |
| `type SearchCategory` | `src/components/explore/ExploreContent.tsx:13` |
| `import Link from "next/link";` *(whole line)* | `src/components/home/HomePageClient.tsx:8` |
| `summarizeChangedFields` | `src/components/home/HomePageClient.tsx:54` |
| `megaStates` (destructured from `useHomePage`) | `src/components/home/HomePageClient.tsx:158` |
| `i` (unused `.map` index) — **new this run** | `src/components/report/SpeedTierChart.tsx:583` |

`SearchCategory` is still exported and live from `ExploreFilters.tsx` — only `ExploreContent`'s import of it is dead.

**Deliberately excluded** (ESLint flags them, they are not dead): `_error` (`src/app/global-error.tsx:4`) and `_args` (`src/app/api/user/push/__tests__/route.test.ts:26,33`) are underscore-prefixed signature placeholders; `_removed` (`src/lib/utils/normalize-report.ts:97`) is the `const { spreadNotes: _removed, ...rest }` omit idiom — **deleting it changes behaviour**, it is how `spreadNotes` is stripped from the output.

## §3 · `syncStatus` — new unwired-prop finding

A complete wiring chain that terminates in nothing:

```
useCollaborativeSync.ts:147   returns { collaborators, syncStatus, … }
useHomePage.ts:503, :867      destructures and re-exports it
HomePageClient.tsx:117, :925  destructures and passes syncStatus={syncStatus}
Navbar.tsx:68                 syncStatus?: string;          <- declared
Navbar.tsx:186                collaborators, syncStatus,    <- destructured, NEVER READ
```

Its sibling `collaborators` from the same destructure **is** rendered (`Navbar.tsx:448-451`, the "N editing" pill). So a collaboration sync-status indicator was plumbed end-to-end and the final render was never written. Same shape as rows 13-14 — **treat as missing UI first, dead code second.** Deleting the Navbar prop would cascade: `syncStatus` becomes entirely unused back down to `useCollaborativeSync`'s return value.

## §4 · `isRateLimited` — leave it or re-point its tests

Production-dead: the only repo references are the declaration (`src/lib/rate-limit.ts:84`) and 16 hits in `src/lib/__tests__/rate-limit.test.ts`. Everything in production uses `isRateLimitedAsync` (`security/api-guard.ts`, `api/feedback/route.ts`, `api/quick-share/route.ts`). But its own docblock marks it a deliberately-retained legacy shim, and its 5 tests are currently the only coverage of the shared in-memory fallback that `isRateLimitedAsync` uses when Upstash is unconfigured. **Either keep it, or delete it and re-point those tests at `isRateLimitedAsync`.** Do not delete the tests outright.

## §5 · Redundant `export` modifiers (~52 symbols) — do not delete the symbols

52 symbols have zero external importers **and are used inside their own defining file**, so the dead part is the `export` keyword only. Verified by inspection, not just hit counts: e.g. `CHAMPIONS_MB_DEX` (`champions-dex.ts:296` → used `:319`, `:327`), `CHAMPIONS_MC_DEX` (`:318` → `:326`), `WALKTHROUGH_STEPS` (`:16` → `:189`), `REPORT_TEMPLATES` (`templates.ts:13` → `:61`), `generateCsrfToken` (`csrf.ts:17` → `:49`), `flushServerEvents` (`posthog-server.ts:56` → `:44`), `evictStoredDraft` (`useTeamReport.ts:31` → `:67`, `:166`), `migrateCalcEntries` (`normalize-report.ts:10` → `:103`), `replaceSpeciesInBlock` (`paste-edit.ts:59` → `:97`), `OG_IMAGE_STYLE` (`og-image.ts:24` → `:99`), `ogImageEnabled` (`:38` → `:63,69,89,121,135`), `PurgeStatements` (`purge-satellites.ts:22` → `:31,55,84,85`), `SerializedGamePlanSchema`/`SerializedMatchupPlanSchema` (`url-codec.schemas.ts:30,36` → `:40,:92`), plus ~33 export-only-redundant types (`ChangelogItem`, `TeamCombination`, `HowToStep`, `SportsEventData`, `BreadcrumbItem`, `FAQItem`, `PdfExportProps`, `ChampionsSampleTeam`, `IndyTopCutEntry`, `DraftSaveResult`, `SyncStatus`, `DamageCalcsMap`, `FilterState`, `GamePlanSlots`, `ViewMode`, `AccentTheme`, `SpreadBenchmark`, `ThreatCell`, `VersionDiffState`, `DexSubsetMegaStone`, `MoveCategory`, `MoveFlag`, `MoveData`, `NatureData`, `ChronologicalCursor`, `NotificationType`, `PrivateField`, `ReportTemplate`, `ImportSource`, `SpeedTierForm`, `ProgressiveSpriteUrls`, `GlobalFieldKey`, `LegalitySeverity`, `EffectiveForm`, `EffectiveTyping`).

Recorded explicitly because a naive unused-export tool reports these as deletable and they are not. Zero LOC saved — hygiene only.

Separately, these exports are **test-only but must keep their `export`** (the test imports them): `nextSpriteFallbackState`, `parseFiltersFromUrl`, `buildUrlSearch`, `parseFetchedShareState`, `getNature`, `isDynamicAllowedOrigin`, `getGenThemedSpriteUrls`, `SectionKey`, `parseSectionKey`, `sectionKeyLabel`, `sectionKeySlide`.

---

## Negative results

### Orphaned components: none

Every file under `src/components/**` is reachable from a production entry point. A component-export sweep over `src/components` and `src/app` returned 19 "zero external reference" hits — **all 19 are Next.js `export default function XPage/XLayout/XLoading()` convention files** (`feedback/page.tsx`, `champions/page.tsx`, `not-found.tsx`, `layout.tsx`, `global-error.tsx`, `explore/loading.tsx`, `dashboard/*`, …). Zero genuine orphans. All 8 `JsonLd.tsx` component exports have real consumers.

### Dead routes: none

All 96 `page.tsx`/`route.ts` files have at least one inbound reference. The only routes with **zero** in-repo references are externally invoked and must not be touched: `/api/bot` (Discord interaction endpoint), `/api/webhooks/{clerk,linear,posthog}`. Operational endpoints are referenced but not from UI: `/api/cron/*` via `vercel.json:4-20`, `/api/keep-alive` via `daily-ops/route.ts:17` + `proxy.ts:33`, `/api/setup` via `proxy.ts:33,90`, `/api/migrate` + `/api/cleanup` hand-run (and `vercel.json:4` for cleanup).

Pages absent from `sitemap.ts` — all correctly excluded, none dead: `/dashboard`, `/dashboard/{profile,privacy,notifications}`, `/notifications`, `/embed/[id]` (noindex), `/q/[id]` (reached via the URL `api/quick-share/route.ts` returns). `/compare` is **deliberately** omitted — `src/app/sitemap.ts:20-22` carries an explicit "do not re-add, it is `robots: { index: false }`" comment (VGC-272).

### Unused files in `src/lib/**`: none

Every `.ts` under `src/lib` is prod-reachable. Low-traffic files spot-verified by importer: `email.ts`, `linear.ts`, `cache.ts`, `fetch-with-timeout.ts`, `consent.ts`, `templates.ts`, `discord-bot.ts`, `push-subscription.ts`, `dynamic-imports/html2canvas.ts`, `data/indy-top-cut.ts`, `data/champions-sample-teams.ts` — all have real importers. `src/lib/data/__validate-mega-coverage.ts` is live via the dynamic `await import()` at `src/instrumentation.ts:14`. The 7 locale files are live via the lazy loader map at `src/lib/i18n/index.ts:26-32`.

The only non-imported files in `src/` are the 3 `.sql` migrations (row 19) — an operational log applied by hand against Neon, cheap to keep, carrying schema history. Listed so the next scan doesn't re-raise them.

### Unused npm dependencies: none

All 26 `dependencies` resolve to at least one real import in `src/`. The four `@opentelemetry/*` packages are genuinely imported (`src/instrumentation.ts:1-4`, `src/app/api/views/[shareId]/route.ts:5`); their presence in `next.config.ts:27-30` is the required `serverExternalPackages` declaration. Lowest-usage-but-live: `@pkmn/dex`, `cheerio`, `html2canvas-pro`, `posthog-js`, `posthog-node`, `tweetnacl`, `vanilla-cookieconsent`, `@microsoft/clarity`, `@upstash/ratelimit` (one import each).

All 16 `devDependencies` are live too: `@types/*` are consumed implicitly by `tsc`; `start-server-and-test` is used by the `test:e2e` scripts in `package.json`; `jsdom` via `// @vitest-environment jsdom` pragmas; `@tailwindcss/postcss`, `tailwindcss`, `eslint*`, `cypress`, `typescript` via config files.

---

## Safe deletion batch

Items I would stake a build on, ordered so each step is independently committable and the gate stays green. Per CLAUDE.md run `verification-gate` (cold `tsc --noEmit --incremental false` + vitest + `next build`) after each step, and `ui-checklist-reviewer` on any step touching `.tsx`.

| Step | Contents | Files | Est. LOC removed |
|---|---|---|---|
| 1 | Pure `src/lib` leaf symbols, zero importers, no `.tsx`: `getCalcSpecies` (damage-calculator.ts:56-58, clean tail truncation — it is the last decl in a 58-line file), `asPokemonTypes` + its now-unused `PokemonType` import (dex-subset.ts:220-223, :38), `PRIORITY_LABELS` (discord-bot.ts:50-55), `toBase64Url` (url-codec.ts:77-83), `type EventType` (tags.ts:33) | 5 | **22** |
| 2 | Token-level unused imports/bindings — §2's eight entries | 6 | **~3** |
| 3 | Single-line UI dead locals: `displayData` (PokemonCard.tsx:180), `exportMenuOpen` useState (Navbar.tsx:202), `useTranslation` + import (SpotlightCard.tsx:4, 28) | 3 | **4** |
| 4 | `CATEGORY_I18N` / `SORT_I18N` / `PLACEMENT_I18N` (ExploreFilters.tsx:57-78). **Keep** the sibling `CATEGORY_KEYS`/`SORT_KEYS`/`PLACEMENT_KEYS` (:56, :64, :72) and **keep** every `filter*` locale key — the live path at :111-123 needs them | 1 | **18** |
| 5 | The 73 orphaned i18n keys, deleted from **all 7** locale files in one commit (`TranslationKeys` parity means a partial deletion fails `tsc`, so this is self-checking). Keep the 20 registry keys listed in §1 | 7 | **511** |
| | **Total** | **22** | **~558** |

Steps 3-4 touch high-churn files (`PokemonCard`, `Navbar`, `SpotlightCard`, `ExploreFilters`, `HomePageClient`) — land them after steps 1-2 and rebase first. Step 5 is mechanical and the type gate verifies it, but it is the one step with a judgement call (see the §1 framing note on coverage-chart and comment keys), so it deserves its own commit and a reviewer's eye.

**Then stop. Do not delete:** rows 12-14 (`syncStatus`, `onResultChange`, `selectedTemplate`/`onTemplateSelect`) are **unwired features** — file a ticket each; the right fix is probably to render/call them, and deleting would cement broken behaviour and orphan the parent handlers. Row 17 (`isRateLimited`) only together with re-pointing `rate-limit.test.ts`. Row 18 (`parseMetricCursor` & co.) is open-ticket scaffolding — **KEEP**. Row 19 (SQL log) leave alone. Row 20 is an `export`-keyword cleanup only — **never** delete those symbols.

**Scope caveat — concurrent wave writes.** This scan covers the tree as committed at `10dfd74`. While it was running, other agents in this wave created untracked files that are **outside** every count and conclusion above: `src/app/blog/{page.tsx,PostBody.tsx,[slug]/}`, `src/lib/data/blog-posts.ts` (+ its test), and `src/lib/spreads/species-spreads.ts`. Nothing here says anything about them — in particular, do not read "zero dead routes" as covering `/blog`. Re-scan those paths once the wave settles.

**Note for whoever picks this up:** every SAFE item in the 2026-10-26 scan is still present and unmodified — that batch was reported but never actioned. This run re-verified all of them against `10dfd74` and adds four new findings: the 73-key i18n cluster (§1), the `syncStatus` unwired prop (§3), the `SpeedTierChart.tsx:583` unused map index, and the stale passcode walkthrough copy.
