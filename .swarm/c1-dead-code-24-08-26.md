# C1 — Dead Code Audit (read-only)

**Date:** 2026-08-24
**Agent:** C1
**Repo:** `/home/user/VGC-Team-Report` @ `415a281`
**Scope:** unused exports, orphaned components, dead routes, unused npm deps, unused files in `src/`.
**Mutations:** none. No file outside `.swarm/` was created, edited, or deleted. Only read-only git commands (`git log`, `git rev-parse`, `git status`). No `npm install`, no `next build`.

---

## Method

Four independent passes, cross-checked:

1. **Module reachability graph** (`scratchpad/graph.mjs`). Built the real import graph resolving `@/*`, relative paths, `index.*` barrels, `.json`, and dynamic `import("…")`. Seeded from all 90 Next.js entry points (`page`/`layout`/`route`/`template`/`default`/`loading`/`error`/`global-error`/`not-found`/`sitemap`/`opengraph-image` under `src/app`) plus `src/instrumentation.ts` and `src/proxy.ts`.
2. **Per-symbol ripgrep** (`scratchpad/symbols.mjs`). Extracted all 577 exported symbols from every non-test file and ran a word-boundary fixed-string `rg` for each across `src/`, `cypress/`, `scripts/`, `docs/`, `public/`, `next.config.ts`, `vitest.config.ts`, `package.json`, `README.md`. Hits in the defining file excluded; test/cypress hits bucketed separately so test-only symbols surface as production-dead.
3. **Module-local declaration scan** (`scratchpad/locals.mjs`) + **independent ESLint confirmation** (`node node_modules/eslint/bin/eslint.js src -f json`). Every module-local finding below is corroborated by `@typescript-eslint/no-unused-vars`.
4. **Route + dependency + asset passes.** Every `src/app/api/**/route.ts` mapped to its URL and grepped for callers with dynamic segments wildcarded. Every `package.json` dependency grepped for import specifiers. Every `public/` asset grepped.

---

## Headline results

| Check | Result |
|---|---|
| Files in `src/` | 324 (`.ts`/`.tsx`) |
| Reachable from prod entry points | 284 |
| **Unreachable non-test files** | **0** — no orphaned files or components |
| Unreachable = test files only | 40 |
| Dead API routes | 0 (all 0-ref routes are externally invoked — see below) |
| Unused npm dependencies | 0 |
| Unused `public/` assets | 5 |
| Genuinely dead exported symbols | 1 |
| Dead module-local declarations (ESLint-confirmed) | 6 |
| Unused imports / unused locals (ESLint-confirmed) | 23 more |
| Dead feature chains (wired but unreachable) | 2 |
| Unused i18n keys | 57 of 314 |

`src/` has no orphaned files. Prior swarm cleanups (the `DisplayTogglePill` / `useGlobalDisplayPrefs` cluster from the 2026-08-10 report) landed — those files no longer exist. What is left is **intra-file** dead code and two dead feature chains.

---

## Conflict-risk baseline

`git log origin/main --since="7 days ago" --name-only --pretty=format: | sort -u` returned 30 files. Recommendations touching any of them are marked **⚠️ CONFLICT RISK** inline. The list:

```
src/app/api/champions/meta/route.ts        src/hooks/useHomePage.ts
src/app/api/explore/route.ts               src/hooks/useTeamMeta.ts
src/app/api/pokepaste/route.ts             src/hooks/useTeamReport.ts
src/app/champions/[pokemon]/MegaLandingContent.tsx
src/app/layout.tsx                         src/lib/analysis/analyze-team.ts
src/app/page.tsx                           src/lib/analysis/item-boosts.ts
src/components/match-tracker/MatchTracker.tsx
src/components/providers/ClarityProvider.tsx
src/components/report/CalcInput.tsx        src/lib/data/gen9-regulation-signals.ts
src/components/report/DefensiveCoverageChart.tsx
src/components/report/OffensiveCoverageChart.tsx
src/components/report/PokemonDetailSlide.tsx
src/components/report/SlideNavControls.tsx src/lib/utils/extract-species.ts
src/components/report/SpeedTierChart.tsx   src/lib/utils/pokepaste.ts
src/components/social/CommentSection.tsx   src/lib/validation/champions-legality.ts
src/components/ui/Button.tsx
src/components/ui/DeferredLayoutExtras.tsx
(+ 4 test files)
```

**Good news:** every Tier 1 item except the two page.tsx/useHomePage ones lives in a file untouched for 7+ days.

---

# Tier 1 — HIGH confidence, recommended for deletion

## 1.1 `src/components/explore/ExploreFilters.tsx` — three dead i18n key maps

| | |
|---|---|
| **Symbols** | `CATEGORY_I18N` (L57–63), `SORT_I18N` (L65–71), `PLACEMENT_I18N` (L73–79) |
| **Confidence** | **HIGH** |
| **Saves** | ~23 lines |
| **Conflict risk** | None — file untouched in the last 7 days |

Evidence:

```
$ rg -n "CATEGORY_I18N|SORT_I18N|PLACEMENT_I18N" src/components/explore/ExploreFilters.tsx
57:const CATEGORY_I18N: Record<SearchCategory, string> = {
65:const SORT_I18N: Record<string, string> = {
73:const PLACEMENT_I18N: Record<string, string> = {
(no other occurrences anywhere in the file or repo)

$ node node_modules/eslint/bin/eslint.js src/components/explore/ExploreFilters.tsx
  57:7  warning  'CATEGORY_I18N' is assigned a value but never used
  65:7  warning  'SORT_I18N' is assigned a value but never used
  73:7  warning  'PLACEMENT_I18N' is assigned a value but never used
```

**Why they're dead:** these map option keys → i18n *key strings* (`all: "filterCatAll"`). The component was later rewritten to read the translation object directly at L110–127 (`const catLabel = { all: t.filterCatAll, … }`) and renders through `catLabel` / `sortLabel` / `placementLabel` at L247, L268, L277, L315. The string-key maps became a redundant second copy of the same mapping and were never removed.

Note the sibling `CATEGORY_KEYS` / `SORT_KEYS` / `PLACEMENT_KEYS` arrays **are live** (L246, L263, L304) — delete only the three `*_I18N` objects.

---

## 1.2 `src/lib/sharing/url-codec.ts` — `toBase64Url`

| | |
|---|---|
| **Symbol** | `toBase64Url` (module-local, L77–83) |
| **Confidence** | **HIGH** |
| **Saves** | ~8 lines |
| **Conflict risk** | None |

```
$ rg -n -w "toBase64Url" src
src/lib/sharing/url-codec.ts:77:function toBase64Url(bytes: Uint8Array): string {
src/lib/sharing/__tests__/url-codec.test.ts:12:function toBase64Url(bytes: Uint8Array): string {   ← its OWN local copy
src/lib/sharing/__tests__/url-codec.test.ts:36,43,154                                              ← uses the local copy

$ eslint → 77:10  warning  'toBase64Url' is defined but never used
```

The module is now **decode-only**: its single public export is `decodeShareState()` (L97), which calls `fromBase64Url` (L104). Encoding moved server-side. The test file defines its own identical `toBase64Url` helper to build fixtures, so deleting the source copy does not break the test suite — verified: the test's import list does not include it.

---

## 1.3 `src/lib/discord-bot.ts` — `PRIORITY_LABELS`

| | |
|---|---|
| **Symbol** | `PRIORITY_LABELS` (module-local, L50–55) |
| **Confidence** | **HIGH** |
| **Saves** | ~7 lines |
| **Conflict risk** | None |

```
$ rg -n -w "PRIORITY_LABELS" src cypress scripts docs
src/lib/discord-bot.ts:50:const PRIORITY_LABELS: Record<number, string> = {
$ eslint → 50:7  warning  'PRIORITY_LABELS' is assigned a value but never used
```

Sibling `TYPE_EMOJI` (L43) and `TYPE_COLORS` are live in `postFeedbackEmbed`. `PRIORITY_LABELS` is a leftover from a Linear-priority embed field that was dropped.

---

## 1.4 `src/lib/data/tags.ts` — `EventType`

| | |
|---|---|
| **Symbol** | `type EventType` (module-local, L33) |
| **Confidence** | **HIGH** |
| **Saves** | 1 line |
| **Conflict risk** | None |

```
src/lib/data/tags.ts:33: type EventType = (typeof EVENT_TYPES)[number];
$ eslint → 33:6  warning  'EventType' is defined but never used
```

Note it is **not** exported (unlike its siblings `Archetype` and `Regulation`, both of which are exported and used). `ReportTags.eventType` is typed as plain `string`, not `EventType` — so the type alias never got wired in. Either delete it or (better, but out of scope for a dead-code pass) export it and use it on `ReportTags.eventType`.

---

## 1.5 `src/lib/data/dex-subset.ts` — `asPokemonTypes`

| | |
|---|---|
| **Symbol** | `asPokemonTypes` (exported, L220–223) |
| **Confidence** | **HIGH** |
| **Saves** | 4 lines |
| **Conflict risk** | None |

```
$ rg -n -w "asPokemonTypes" src cypress scripts docs public *.ts *.json
src/lib/data/dex-subset.ts:221:export function asPokemonTypes(types: string[]): PokemonType[] {
```

**Exactly one occurrence in the entire repo — its own definition.** This is the only exported symbol in `src/` with zero references anywhere, including inside its own file. It is a 1-line `as` cast wrapper (`return types as PokemonType[]`) that callers inline instead.

---

## 1.6 Dead template feature chain — `src/lib/templates.ts` and its plumbing

| | |
|---|---|
| **Confidence** | **HIGH** that the code path is unreachable |
| **Saves** | ~88 lines |
| **Conflict risk** | ⚠️ **YES** — `src/app/page.tsx` and `src/hooks/useHomePage.ts` both changed within 7 days |

This is the largest dead artifact in the codebase. The chain:

```
useHomePage.ts:38   const [pendingTemplateId, setPendingTemplateId] = useState<string>("blank");
useHomePage.ts:911  → returned
page.tsx:234-235    → destructured
page.tsx:805-806    <PasteInput selectedTemplate={pendingTemplateId}
                                onTemplateSelect={setPendingTemplateId} />
PasteInput.tsx:87-88   selectedTemplate?: string; onTemplateSelect?: (id: string) => void;
PasteInput.tsx:121  export function PasteInput({ …, selectedTemplate, onTemplateSelect }) {
                    ↑ destructured and NEVER READ — the template-picker UI was removed
```

ESLint confirms the terminus:

```
src/components/input/PasteInput.tsx:121  'selectedTemplate' is defined but never used.
src/components/input/PasteInput.tsx:121  'onTemplateSelect' is defined but never used.
```

`setPendingTemplateId` has no other call site:

```
$ rg -n "setPendingTemplateId" src
src/hooks/useHomePage.ts:38    (definition)
src/hooks/useHomePage.ts:911   (returned)
src/app/page.tsx:235           (destructured)
src/app/page.tsx:806           (passed as onTemplateSelect — never invoked)
```

**Therefore `pendingTemplateId` is permanently `"blank"`.** Which makes the consumer a provable no-op:

```ts
// useHomePage.ts:652-665
const tmpl = getTemplate(pendingTemplateId);   // always getTemplate("blank")
if (!tmpl || tmpl.id === "blank") return;      // ← ALWAYS returns here
setTemplateId(tmpl.id);                        // unreachable
if (!summary && tmpl.defaults.summaryPlaceholder) { … }  // unreachable
```

Consequently `src/lib/templates.ts` (62 lines) is dead data: its only external consumer is `getTemplate` at `useHomePage.ts:657`, whose result is always the `"blank"` entry that is immediately discarded. The `quick` / `tournament` / `guide` templates and all their `summaryPlaceholder` / `hideMatchupSlides` / `hideSpeedTier` defaults have never been applied.

**Removal set:** `src/lib/templates.ts` (whole file, 62 lines), the `useHomePage.ts` template-defaults effect (L652–665, ~14 lines) + `templateApplied` ref + `pendingTemplateId` state + its return-object entry, `PasteInput.tsx` L87–88 + the two destructured params, `page.tsx` L234–235 + L805–806.

**⚠️ IMPORTANT — do NOT remove the separate `templateId` meta field.** `templateId` (in `useTeamMeta.ts`, `url-codec.ts:67`, `url-codec.schemas.ts:112`, `normalize-report.ts:118`, `api/share/route.ts:64`) is a *persisted* field on the share payload and DB schema. It is currently write-only (nothing reads it for behaviour) but it is serialized into existing share links, so it must stay for backwards compatibility. Only the *picker* chain above is safe to delete.

---

## 1.7 Unused imports (ESLint-confirmed)

| File | Line | Symbol | Conflict risk |
|---|---|---|---|
| `src/app/page.tsx` | 6 | `Link` (from `next/link`) | ⚠️ **YES** |
| `src/app/page.tsx` | 52 | `summarizeChangedFields` (from `@/lib/utils/version-diff`) | ⚠️ **YES** |
| `src/app/dashboard/DashboardContent.tsx` | 8 | `UserButton` (from `@clerk/nextjs`) | none |
| `src/app/dashboard/profile/page.tsx` | 9 | `UserButton` (from `@clerk/nextjs`) | none |
| `src/app/api/user/profile/route.ts` | 4 | `auth` (from `@clerk/nextjs/server`) | none |
| `src/components/explore/ExploreContent.tsx` | 13 | `SearchCategory` (type) | none |

**Confidence: HIGH** — all six are `@typescript-eslint/no-unused-vars` findings from a clean full-`src` ESLint run. Saves ~6 lines; the two `UserButton` imports are the only ones with any bundle relevance (both are client components pulling a Clerk UI widget that never renders).

---

## 1.8 Unused local bindings (ESLint-confirmed)

| File | Line | Symbol | Note | Conflict risk |
|---|---|---|---|---|
| `src/components/layout/Navbar.tsx` | 202 | `exportMenuOpen`, `setExportMenuOpen` | whole `useState` line is dead | none |
| `src/components/layout/Navbar.tsx` | 186 | `syncStatus` | dead prop destructure | none |
| `src/components/report/PokemonCard.tsx` | 180 | `displayData` | dead computed value | none |
| `src/hooks/useSlideSystem.ts` | 34 | `hiddenSlides` | dead option destructure | none |
| `src/components/explore/SpotlightCard.tsx` | 29 | `t` | dead `useTranslation()` call — card renders hardcoded English | none |
| `src/components/report/MatchupPlanSlide.tsx` | 447 | `onResultChange` | see Tier 2.1 | none |
| `src/app/page.tsx` | 190, 229 | `megaStates`, `walkthroughIsFirstTime` | dead destructures | ⚠️ **YES** |
| `src/components/report/PokemonDetailSlide.tsx` | 244 | `category` | dead prop | ⚠️ **YES** |
| `src/components/report/SpeedTierChart.tsx` | 548 | `i` | dead map index | ⚠️ **YES** |

**Confidence: HIGH.** Saves ~10 lines. `src/app/global-error.tsx:4 '_error'` and `src/lib/utils/normalize-report.ts:97 '_removed'` are also reported by ESLint but are **deliberately** underscore-prefixed (required positional params) — **leave them alone**.

---

## 1.9 `public/` — five unused Next.js starter SVGs

| File | Size |
|---|---|
| `public/file.svg` | 391 B |
| `public/globe.svg` | 1035 B |
| `public/next.svg` | 1375 B |
| `public/vercel.svg` | 128 B |
| `public/window.svg` | 385 B |

```
$ rg -c -F "file.svg"   src public/manifest.json public/sw.js public/robots.txt next.config.ts scripts  → 0
$ rg -c -F "globe.svg"  …  → 0
$ rg -c -F "next.svg"   …  → 0
$ rg -c -F "vercel.svg" …  → 0
$ rg -c -F "window.svg" …  → 0
```

**Confidence: HIGH.** Untouched `create-next-app` scaffolding. ~3.3 KB / ~30 lines of SVG markup. Every other `public/` asset (`og-default.png`, all icons, `favicon.svg`, `llms.txt`, `llms-full.txt`, `sw.js`, `manifest.json`, `robots.txt`) has live references.

---

**Tier 1 total: ~177 lines + 5 files removable at HIGH confidence.**
Conflict-free subset (safe to do first, ~90 lines + 5 files): 1.1–1.5, 1.9, and the non-flagged rows of 1.7/1.8.

---

# Tier 2 — MEDIUM confidence (verify intent before deleting)

## 2.1 Dead game-result feature chain

**Confidence: HIGH that it's unreachable, MEDIUM that it should be deleted** — this looks like a half-built feature, not an abandoned one.

```
useMatchupPlans.ts:270-284  updateGamePlanResult  (setPlans mapper, ~15 lines)
page.tsx:1283               onGamePlanResultChange={updateGamePlanResult}
TeamReport.tsx:83,169,369   forwarded (defaults to a no-op arrow)
PdfExport.tsx:153           forwarded as `noop`
MatchupPlanSlide.tsx:45,140 accepted
MatchupPlanSlide.tsx:406    onResultChange={(result) => onGamePlanResultChange(plan.id, gp.id, result)}
MatchupPlanSlide.tsx:432    onResultChange: (result: GameResult) => void;
MatchupPlanSlide.tsx:447    destructured in GamePlanSection — NEVER CALLED
```

```
$ rg -n "GameResult|result" src/components/report/MatchupPlanSlide.tsx
4:import type { …, GameResult } …
45:  onGamePlanResultChange: (…) => void;
406:                onResultChange={(result) => onGamePlanResultChange(…)}
432:  onResultChange: (result: GameResult) => void;
(nothing else — no W/L/T buttons render, `gp.result` is never displayed)
```

The `result?: GameResult` field is defined on `GamePlan` (`useMatchupPlans.ts:11`) and serialized (L61), so the data shape ships, but **no UI can ever set or show it**. ~24 lines of plumbing that can never fire. Recommend asking the owner whether the W/L/T buttons are still planned before removing.

**Conflict risk:** ⚠️ `src/app/page.tsx` (one line).

## 2.2 57 unused i18n keys × 7 locale files (~399 lines)

**Confidence: MEDIUM.** All 314 keys in `en.ts` were grepped word-boundary across `src/` and `cypress/` excluding `src/lib/i18n/`; 57 have zero consumers. Verified there is no dynamic `t[variable]` lookup that could hide them:
- `ShareModal.tsx:93` proxies `tRaw` but every read site uses a static `t.someKey` (grep-visible).
- `CommonModesSlide.tsx:109` uses a `tr("literal", fallback)` helper — but its keys are a *different namespace* (`commonModesTitle`, `combinationLeads`, `combinationBack`, `legacyLeadsLabel`, …), confirming the orphans below are leftovers from the pre-rewrite design.

Spot-checked with `rg -n -w -F <key> src cypress | grep -v i18n/translations` → **zero hits for every key checked**.

Full orphan list: `loadSample, exportTeam, exportCopied, editLink, newShort, tournamentInfo, tailwindDoublesBase, hideSlideTooltip, hiddenSlideTooltip, publicLinkCopied, saveEditLink, copyEditLink, lostEditLink, generateNewEditLink, oldEditLinkStops, yourBring4, selectedCount, commonLeads, commonModesField, commonLeadsPlaceholder, commonModesPlaceholder, combinationsEmpty, offensiveTypeCoverage, defensiveTypeCoverage, offensiveCoverageDesc, defensiveCoverageDesc, noSeCoverage, onlyOneAnswer, twoPlusAnswers, vulnerable, threePlusWeak, twoWeak, manageable, oneWeak, resistant, noWeakness, pasteCalcsPlaceholder, setPasscode, unlockEditing, passcodeEditDesc, passcodeUnlockDesc, enterPasscode, shareWithPasscode, shareWithoutPasscode, exploreTitle, searchPlaceholder, sortNewest, sortUpdated, listPublicly, listPubliclyTooltip, sortPopular, addComment, commentPlaceholder, displayNameLabel, deleteComment, noComments, loadMoreComments`

**Why MEDIUM, not HIGH:** the `CommonModesSlide.tsx` docblock explicitly says *"The Integrate phase adds the commonModes i18n keys to every translation file"* — some of these may be deliberate pre-translation for unshipped UI. Deleting them would discard translator work. Recommend confirming with the owner; the clearly-superseded clusters (`commonLeads`, `commonModesField`, `combinationsEmpty`, `yourBring4`, `selectedCount`, the two `*Placeholder`s — all replaced by the `combination*` namespace) are the safest subset.

---

# Tier 3 — LOW confidence / informational (do NOT delete)

## 3.1 Zero-caller API routes — all externally invoked, all LIVE

| Route | Why it has no in-repo caller |
|---|---|
| `/api/bot` | Discord bot command endpoint. Self-documented `GET /api/bot?action=summary\|popular\|bugs\|weekly-email`; commands registered from `scripts/register-commands.json`. |
| `/api/oembed` | oEmbed provider polled by Discord/Slack unfurlers. Source comment: *"oEmbed payloads are polled repeatedly by Discord/Slack unfurlers"*. |
| `/api/webhooks/clerk` | Clerk webhook. |
| `/api/webhooks/linear` | Linear webhook (`tweetnacl` signature verification). |
| `/api/webhooks/posthog` | PostHog webhook. |

Also confirmed live despite low in-repo reference counts: `/api/cleanup`, `/api/cron/*` (all five registered in `vercel.json` crons), `/api/keep-alive` and `/api/setup` (both explicitly exempted in `src/proxy.ts:33,90,103`), `/api/migrate` (admin bootstrap, `timingSafeEqual`-guarded). **No dead routes.**

> **Minor observation, not dead code:** grep found no `<link rel="alternate" type="application/json+oembed">` anywhere (`src/app/layout.tsx:82` and `src/app/s/[id]/page.tsx:133` both define `alternates` but neither advertises the oEmbed endpoint). Unfurlers discover oEmbed via that link tag, so `/api/oembed` may never actually be hit. Worth a separate ticket — it's a functionality gap, not something to delete.

## 3.2 npm dependencies — all 30 used

Every `dependencies` entry resolves to at least one import specifier in `src/`, `scripts/`, or a config. Notable verifications:
- `jsdom` — no direct import, but used via `// @vitest-environment jsdom` pragmas in 6 hook tests (`useShareFlow`, `useSwipeNavigation`, `useAutoDraft`, `useTeamReport`, `useCollaborativeSync`, `useUndoRedo`). **Keep.**
- `start-server-and-test` — used only in the `test:e2e` / `test:e2e:open` package.json scripts. **Keep.**
- `@types/qrcode` — types for `qrcode`, consumed implicitly by tsc. **Keep.**
- `@opentelemetry/*` (4 packages) — all four imported by `src/instrumentation.ts`. **Keep.**
- `@pkmn/dex` — imported by `src/lib/data/pkmn-dex-fallback.ts` (deliberate fallback behind the generated dex subset) and by `scripts/build-dex-subset.mjs`. **Keep.**

## 3.3 Test-only exported symbols (9) — legitimate

These have zero *production* consumers but are imported by their own test files. This is normal internal-unit testing, not dead code:

| File | Symbol |
|---|---|
| `src/hooks/useExploreUrlSync.ts` | `buildUrlSearch`, `parseFiltersFromUrl` |
| `src/lib/rate-limit.ts` | `isRateLimited` |
| `src/lib/security/cors.ts` | `isDynamicAllowedOrigin` |
| `src/lib/utils/export-paste.ts` | `pokemonToShowdown` |
| `src/lib/utils/version-diff.ts` | `parseSectionKey`, `sectionKeyLabel`, `sectionKeySlide`, `SectionKey` |

## 3.4 Over-exported symbols (~29) — cosmetic only

29 symbols are exported but only referenced *inside their defining file* (verified: each has ≥2 in-file occurrences, so none is truly dead). Downgrading `export` → module-local would tighten the public surface but saves 0 lines and risks nothing but churn. Examples: `TYPE_CHART` (`type-chart.ts`), `REPORT_TEMPLATES`/`ReportTemplate` (`templates.ts` — moot if 1.6 is actioned), `generateCsrfToken` (`security/csrf.ts`), `flushServerEvents` (`posthog-server.ts`), `migrateCalcEntries` (`normalize-report.ts`), `replaceSpeciesInBlock` (`paste-edit.ts`), `WALKTHROUGH_STEPS` (`useWalkthrough.ts`), `SerializedGamePlanSchema`/`SerializedMatchupPlanSchema` (`url-codec.schemas.ts`), plus ~20 type/interface exports (`TeamCombination`, `FilterState`, `DexSubsetMegaStone`, `PrivateField`, `LegalitySeverity`, …). **Not recommended.**

## 3.5 One-off generator scripts — keep

`scripts/generate-og-default.mjs` and `scripts/register-commands.json` have no in-repo references (`generate-maskable-icon.mjs` and `build-dex-subset.mjs` are referenced only from docblocks). All four are manual one-shot generators whose outputs are committed. **Keep** — deleting them makes the generated artifacts unreproducible.

---

# Recommended action plan

**Batch A — conflict-free, do first (~90 lines + 5 files, zero merge risk):**
1.1 ExploreFilters `*_I18N` maps · 1.2 `toBase64Url` · 1.3 `PRIORITY_LABELS` · 1.4 `EventType` · 1.5 `asPokemonTypes` · 1.9 five starter SVGs · the non-flagged rows of 1.7 and 1.8.

**Batch B — the template chain (1.6, ~88 lines):** highest single win, but rebase onto latest `main` first — `page.tsx` and `useHomePage.ts` are both hot. Keep the persisted `templateId` field.

**Batch C — needs an owner decision:** 2.1 game-result chain (finish it or cut it) · 2.2 the 57 orphan i18n keys.

Every change is a pure deletion; the pre-commit gate (`npm run typecheck` cold + `vitest run` + `next build`) will catch any missed reference. The 6 module-local items in Batch A additionally clear 6 existing ESLint warnings.
