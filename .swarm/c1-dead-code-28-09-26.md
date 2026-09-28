# C1 — Dead Code Scan (read-only)

**Date:** 2026-09-28
**Agent:** C1 (overnight code-quality swarm)
**Repo:** `/home/user/VGC-Team-Report` (branch `main`)
**Mutations made:** none. No repo file edited, created or deleted except this report. No state-mutating git command run.
**Baseline:** `tsc --noEmit --incremental false` → **exit 0** (green, cold). `eslint .` → 33 errors / 62 warnings (pre-existing; errors are all `react-hooks/set-state-in-effect`, unrelated to dead code).

---

## Method

Four independent passes, cross-checked:

1. **Module reachability graph** (`ts`/`tsx`/`mjs`, resolving `@/*`, relative, `index.*`, `.json`, dynamic `import()`, `require()`), seeded from every Next.js entry point (`page|layout|loading|error|global-error|not-found|route|sitemap|opengraph-image|template|default`), plus `src/proxy.ts` and `src/instrumentation.ts`.
   **Result: 0 orphan `.ts`/`.tsx` files.** Every source file has at least one static importer. (Sanity check passed: the graph correctly resolves `src/lib/data/__validate-mega-coverage.ts` as *live* through the dynamic `await import("./lib/data/__validate-mega-coverage")` at `src/instrumentation.ts:14`.) The only orphans are 3 `.sql` files (finding 11).
2. **Export inventory + per-symbol whole-repo scan.** TypeScript AST extraction of every `export` (function/const/class/type/interface/enum/`export {}`) from every non-test file, then a word-boundary scan of every other file in `src`, `cypress`, `scripts` and the root configs. Test-file hits bucketed separately so "production-dead but test-alive" surfaces rather than being hidden.
3. **Route pass.** Every `src/app/api/**/route.ts(x)` mapped to its URL and grepped for callers with dynamic segments wildcarded (`/api/share/${id}/versions` style), cross-referenced against `vercel.json` crons and `src/proxy.ts` exemptions. Every `page.tsx` route cross-referenced against `src/app/sitemap.ts` and in-app links.
4. **Asset / dependency / i18n / CSS passes.** Every `package.json` dep grepped for import specifiers; every `public/` asset grepped; every top-level key in `src/lib/i18n/translations/en.ts` grepped (including the two dynamic-access sites, `ShareModal.tsx:91` Proxy and `CommonModesSlide.tsx:107` `tr()` helper, which were read manually); every class selector in `globals.css` grepped.

**False-positive guards applied:** dynamic `import()` targets resolved; `next/dynamic` call sites all use static string literals (verified — nothing can hide from the graph); the two runtime `t[key]` i18n accessors read by hand; `vanilla-cookieconsent`'s library-generated `.cm*`/`.pm*` classes excluded from the CSS pass; `_`-prefixed intentional-omit destructures (e.g. `normalize-report.ts:97`) excluded.

**Headline:** this codebase has been swept repeatedly (8 prior `c1-dead-code-*.md` reports) and the last sweep's Tier 1 has landed — `DisplayTogglePill.tsx`, `useGlobalDisplayPrefs.ts`, `ConsentGate.tsx` are all gone from `main`, and the stale `/api/builder/` CORS exemption is now just a note comment in `src/proxy.ts:86`. There are **no dead files left**. What remains is (a) one genuinely redundant API route cluster, (b) a large block of dead i18n keys, (c) dead CSS, and (d) a long tail of redundant `export` keywords.

---

# PART A — Zero-conflict findings (ranked first, most valuable tonight)

None of the files below appear in `.swarm/open-pr-conflict-risk.md`.

---

## A1. `/api/bot` is a redundant duplicate of `/api/discord` — 242 lines

| | |
|---|---|
| **File** | `src/app/api/bot/route.ts:1-242` (whole file) |
| **What is dead** | The entire route. Its `?action=summary|popular|bugs` handlers are re-implemented in `src/app/api/discord/route.ts:125` / `:158` / `:182`. |
| **Confidence** | **MEDIUM-HIGH** (see caveat) |
| **CONFLICT-RISK** | **no** |
| **Diff size** | −242 lines, + cascade below |

**Evidence**

Zero in-repo callers, and it is not a Vercel cron:

```
$ grep -rn "api/bot" src cypress scripts docs .github vercel.json
src/app/api/bot/route.ts:46: * GET /api/bot?action=summary|popular|bugs|weekly-email
.env.example:77: # Bot token for the Discord bot route (src/app/api/bot)
```

```
$ cat vercel.json          # crons: /api/cleanup, /api/cron/daily-ops,
                           # /api/cron/weekly-report, /api/cron/posthog-errors,
                           # /api/cron/weekly-digest — /api/bot is NOT listed
```

The new argument (this is what the 2026-08-10 report missed): the Discord slash commands that `/api/bot` exists to serve are registered against the **interactions** endpoint, and that endpoint is `/api/discord`, which does signature verification with `tweetnacl`:

```
$ grep -oP '"name": "\K[^"]+' scripts/register-commands.json
summary  popular  bugs  status  issue  approve  issue  reject  issue  reason

$ grep -n 'command === "' src/app/api/discord/route.ts
125:    if (command === "summary") {
158:    if (command === "popular") {
182:    if (command === "bugs") {
208:    if (command === "status") {
264:    if (command === "approve") {
310:    if (command === "reject") {
```

So `summary`, `popular` and `bugs` are served by `/api/discord`. `/api/bot` implements the same three plus a fourth, `weekly-email`, behind a `CRON_SECRET` bearer — and no scheduler calls it. It also carries its own private copies of `discordFetch` (`:13`) and `sendDiscordMessage` (`:38`), duplicating `src/lib/discord-bot.ts`.

**Cascade if deleted** (both in `src/lib/email.ts`, which *is* conflict-touched, CONFLICT-RISK **yes**, 1 PR):

```
$ grep -rn -w "sendWeeklySummary|buildWeeklySummaryHtml" src
src/app/api/bot/route.ts:3:   import { sendWeeklySummary, buildWeeklySummaryHtml } from "@/lib/email";
src/app/api/bot/route.ts:136:  const html = buildWeeklySummaryHtml({
src/app/api/bot/route.ts:153:  await sendWeeklySummary({
src/lib/email.ts:73:          export const sendWeeklySummary = sendEmail;   ← pure alias, only consumer is /api/bot
src/lib/email.ts:321:         export function buildWeeklySummaryHtml(data: {  ← lines 321-529, only consumer is /api/bot
```

Total reachable saving: **242 + ~210 + 1 ≈ 453 lines**.

**Caveat / why this is not Tier-1-delete-on-sight:** the 2026-08-10 sweep classified `/api/bot` as "external entry point by design — never delete", and it *is* bearer-protected and curl-able by the maintainer. The `weekly-email` action has no equivalent in `/api/discord` (the `weekly-digest` cron sends a *user* digest, not the admin feedback summary). **Suggested action:** ask the maintainer one question — "do you still curl `/api/bot?action=weekly-email`?" If no, delete the route plus the two `email.ts` symbols. If yes, delete only the three duplicated actions (`summary`/`popular`/`bugs`, ~150 lines) and keep `weekly-email`, or better, move it to a `/api/cron/` route so it is actually scheduled.

---

## A2. `/api/oembed` is unreachable — no oEmbed discovery link exists

| | |
|---|---|
| **File** | `src/app/api/oembed/route.ts:1-49` |
| **What is dead** | The endpoint has no discovery path. oEmbed consumers (Discord, Slack, Notion) find an endpoint via `<link rel="alternate" type="application/json+oembed" …>` in the page head. No such tag is emitted anywhere. |
| **Confidence** | **HIGH** that it is unreachable; **LOW** that deletion is the right fix |
| **CONFLICT-RISK** | **no** |
| **Diff size** | either −49 lines (delete) or **+4 lines (activate)** |

**Evidence**

```
$ grep -rn -i "oembed" src public docs README.md
src/app/api/oembed/route.ts:6,45      ← the route itself only
```

The share page's metadata declares only a canonical:

```
src/app/s/[id]/page.tsx:132-134
      alternates: {
        canonical: `https://pokemonvgcteamreport.com/s/${id}`,
      },
```

**Suggested action: activate, do not delete.** This is almost certainly a missing-wiring bug, not dead code — add to `generateMetadata` in `src/app/s/[id]/page.tsx`:

```ts
alternates: {
  canonical: `https://pokemonvgcteamreport.com/s/${id}`,
  types: {
    "application/json+oembed":
      `https://pokemonvgcteamreport.com/api/oembed?url=https://pokemonvgcteamreport.com/s/${id}`,
  },
},
```

That turns 49 lines of currently-unreachable code into working rich embeds. Worth a Linear ticket rather than a deletion. (Flag for R6/SEO.)

---

## A3. Three orphan SQL migration files

| | |
|---|---|
| **Files** | `src/lib/db/migrations/add-species-column.sql`, `drop-species-column.sql`, `add-unlisted-column.sql` |
| **What is dead** | Nothing in the repo reads, runs or references them. There is no migration runner — `src/app/api/migrate/route.ts` does data normalisation in inline `sql` template literals, not file-based DDL. `add-species-column.sql` is additionally superseded by its own `drop-species-column.sql`. |
| **Confidence** | **HIGH** (unreferenced) / **LOW** (that deleting is correct) |
| **CONFLICT-RISK** | **no** (all three) |
| **Diff size** | −3 files |

**Evidence**

```
$ grep -rn "add-species-column|add-unlisted-column|drop-species-column" .
./src/lib/db/migrations/drop-species-column.sql:3:
    -- The column and its GIN index were added in add-species-column.sql to back
```

The only cross-reference is one `.sql` file citing another. The reachability graph lists exactly these three as the repo's only orphans.

**Suggested action:** the add/drop pair (`add-species-column.sql` + `drop-species-column.sql`) is a closed loop and safe to delete together — but applied-migration files are arguably schema history, so **needs judgement**. At minimum leave a note; do not delete `add-unlisted-column.sql` without confirming the `is_unlisted` column exists in prod.

---

## A4. Redundant `export` keywords — zero-conflict files

Every symbol below is **used, but only inside its own file**. Dropping the `export` keyword is a one-word diff each, zero behavioural risk, and stops them showing up as false "public API" in future sweeps. Confidence **HIGH** on all; CONFLICT-RISK **no** on all.

| file:line | symbol | kind | internal use |
|---|---|---|---|
| `src/lib/security/csrf.ts:17` | `generateCsrfToken` | function | `:49` inside `setCsrfCookie` |
| `src/lib/utils/normalize-report.ts:10` | `migrateCalcEntries` | function | `:103` |
| `src/lib/utils/paste-edit.ts:59` | `replaceSpeciesInBlock` | function | `:97` |
| `src/hooks/useWalkthrough.ts:16` | `WALKTHROUGH_STEPS` | const | `:189` |
| `src/lib/sharing/url-codec.schemas.ts:30` | `SerializedGamePlanSchema` | const | `:40` |
| `src/lib/sharing/url-codec.schemas.ts:36` | `SerializedMatchupPlanSchema` | const | `:92` |
| `src/lib/data/moves.ts:3` | `MoveCategory` | type | `:10` region |
| `src/lib/data/moves.ts:4` | `MoveFlag` | type | `:10` region |
| `src/lib/data/moves.ts:10` | `MoveData` | interface | ×3 |
| `src/lib/data/natures.ts:3` | `NatureData` | interface | ×2 |
| `src/lib/accent-themes.ts:3` | `AccentTheme` | interface | ×3 |
| `src/lib/notifications.ts:3` | `NotificationType` | type | ×2 |
| `src/lib/sharing/redact-paste.ts:21` | `PrivateField` | type | ×5 |
| `src/lib/utils/multi-import.ts:7` | `ImportSource` | type | ×2 |
| `src/lib/utils/speed-tier-form.ts:9` | `SpeedTierForm` | interface | ×2 |
| `src/lib/utils/version-diff.ts:44` | `GlobalFieldKey` | type | ×4 |
| `src/lib/contexts/VersionDiffContext.tsx:6` | `VersionDiffState` | interface | ×3 |
| `src/components/report/CommonModesSlide.tsx:16` | `TeamCombination` | interface | ×7 |
| `src/components/ui/PdfExport.tsx:25` | `PdfExportProps` | interface | ×2 |
| `src/data/champions-sample-teams.ts:7` | `ChampionsSampleTeam` | interface | ×2 |
| `src/hooks/useAutoDraft.ts:13` | `DraftSaveResult` | interface | ×4 |
| `src/hooks/useCollaborativeSync.ts:6` | `SyncStatus` | type | ×2 |
| `src/hooks/useDamageCalcs.ts:19` | `DamageCalcsMap` | type | ×5 |
| `src/hooks/useExploreUrlSync.ts:6` | `FilterState` | interface | ×11 |
| `src/hooks/useMatchupPlans.ts:24` | `GamePlanSlots` | interface | ×3 |

**Evidence pattern** (representative):

```
$ grep -rn -w "replaceSpeciesInBlock" src cypress
src/lib/utils/paste-edit.ts:59:export function replaceSpeciesInBlock(block: string, newSpecies: string): string {
src/lib/utils/paste-edit.ts:97:  next[index] = replaceSpeciesInBlock(blocks[index], newSpecies);
```

**Suggested action:** batch into one `chore:` commit, ~25 one-word edits, ~25 lines touched. Low value but genuinely free. The 2026-08-10 report marked this class "NOT recommended" as busywork — I agree it is low priority; include only if the night has spare capacity.

---

## A5. Un-wired one-off scripts

| | |
|---|---|
| **Files** | `scripts/generate-maskable-icon.mjs`, `scripts/generate-og-default.mjs`, `scripts/register-commands.json` |
| **What is dead** | None is referenced by a `package.json` script, by CI, or by any source file. |
| **Confidence** | **HIGH** (unreferenced) / **LOW** (that they are dead) |
| **CONFLICT-RISK** | **no** |
| **Diff size** | n/a — recommend **keep** |

**Evidence**

```
$ grep -rIl "generate-maskable-icon.mjs" .   → (nothing but itself)
$ grep -rIl "generate-og-default.mjs"  .     → (nothing but itself)
$ grep -rIl "register-commands.json"   .     → (nothing but itself)
```

Compare `generate-move-names.mjs`, which *is* wired (`package.json` → `generate:move-names`) and referenced from `src/lib/data/move-names.ts`, and `build-dex-subset.mjs`, which is cited from three source-file headers.

**Suggested action: keep, but wire them.** They regenerate committed artefacts (`public/icon-*-maskable.png`, `public/og-default.png`, the Discord command set). The dead thing here is the *discoverability*, not the code — add `generate:icons`, `generate:og` and `discord:register` entries to `package.json` `scripts` so the next sweep does not flag them again. ~3 added lines.

---

# PART B — Conflict-touched findings (real, but will fight the 7 open PRs)

## B1. 57 unused i18n keys × 7 locale files — ~400 lines

| | |
|---|---|
| **Files** | `src/lib/i18n/translations/{en,es,fr,it,ja,ko,zh}.ts` |
| **Confidence** | **HIGH** (see dynamic-access guard below) |
| **CONFLICT-RISK** | **yes** — all 7 locale files appear in the conflict list (1 PR each) |
| **Diff size** | −57 lines from `en.ts`, −57 from each of 6 locales = **−399 lines** |

**Guard against false positives.** There are exactly two dynamic `t[...]` accessors in the codebase and both were read by hand:

* `src/components/ui/ShareModal.tsx:91-96` — a `Proxy` over `t` that falls back to `en[key]`. Keys still arrive as static property accesses on the proxy, so the static scan sees them.
* `src/components/report/CommonModesSlide.tsx:107-110` — a `tr(key, fallback)` index helper. Its 23 call sites all pass **string literals**, and the literals are `commonModesTitle`, `commonCombinationsTitle`, `combinationLeads`, `combinationBack`, `combinationStrategy`, `combinationLabel`, `removeCombination`, `addCombination`, `legacyNotesTitle`, … — **none** of which are in the dead list. This is the smoking gun: the old Common Modes key set (`commonLeads`, `commonModesField`, `commonLeadsPlaceholder`, `commonModesPlaceholder`, `combinationsEmpty`, `yourBring4`, `selectedCount`) was orphaned when the combinations UI was rewritten with a new naming scheme, and the old keys were never removed.

**The 57 dead keys**, grouped by the feature that orphaned them:

* *Old Common Modes UI* — `en.ts:173` `yourBring4`, `:174` `selectedCount`, `:197` `commonLeads`, `:198` `commonModesField`, `:203` `commonLeadsPlaceholder`, `:204` `commonModesPlaceholder`, `:218` `combinationsEmpty`
* *Coverage charts (now hardcoded English)* — `:230` `offensiveTypeCoverage`, `:231` `defensiveTypeCoverage`, `:232` `offensiveCoverageDesc`, `:233` `defensiveCoverageDesc`, `:235` `noSeCoverage`, `:237` `onlyOneAnswer`, `:239` `twoPlusAnswers`, `:240` `vulnerable`, `:241` `threePlusWeak`, `:243` `twoWeak`, `:244` `manageable`, `:245` `oneWeak`, `:246` `resistant`, `:247` `noWeakness`
* *Removed passcode-sharing feature* — `:267` `setPasscode`, `:268` `unlockEditing`, `:269` `passcodeEditDesc`, `:270` `passcodeUnlockDesc`, `:271` `enterPasscode`, `:273` `shareWithPasscode`, `:274` `shareWithoutPasscode`
* *Removed edit-link UI* — `:37` `editLink`, `:117` `publicLinkCopied`, `:118` `saveEditLink`, `:119` `copyEditLink`, `:120` `lostEditLink`, `:121` `generateNewEditLink`, `:122` `oldEditLinkStops`
* *Comment section (now hardcoded)* — `:374` `addComment`, `:375` `commentPlaceholder`, `:376` `displayNameLabel`, `:378` `deleteComment`, `:379` `noComments`, `:380` `loadMoreComments`
* *Explore (now hardcoded)* — `:290` `exploreTitle`, `:292` `searchPlaceholder`, `:293` `sortNewest`, `:294` `sortUpdated`, `:314` `listPublicly`, `:315` `listPubliclyTooltip`, `:371` `sortPopular`
* *Misc* — `:11` `loadSample`, `:35` `exportTeam`, `:36` `exportCopied`, `:41` `newShort`, `:46` `tournamentInfo`, `:89` `tailwindDoublesBase`, `:108` `hideSlideTooltip`, `:109` `hiddenSlideTooltip`, `:255` `pasteCalcsPlaceholder`, `:265`-region `unlock`, `:exportAsImage`, `:exportAsPdf`

**Important ordering constraint.** `en.ts:387` declares `export type TranslationKeys = { [K in keyof typeof en]: string }` and every locale is `const xx: TranslationKeys = {…}`. All 6 non-English files carry all 57 keys. So this must be **one atomic commit across all 7 files** — removing from `en` alone turns every locale into an excess-property error, and removing from a locale alone leaves a missing-property error. Verified: `es/fr/it/ja/ko/zh` each carry 57/57.

**Suggested action:** worth doing, but schedule it *after* the i18n PRs land — a 7-file, 400-line delete against 7 open PRs that each touch a locale file is a guaranteed merge fight. Ship as its own `chore:` commit with the whole set in one diff.

---

## B2. Dead CSS in `globals.css` — 4 blocks, ~32 lines

| | |
|---|---|
| **File** | `src/app/globals.css` |
| **Confidence** | **HIGH** |
| **CONFLICT-RISK** | **yes** (1 PR) |
| **Diff size** | −32 lines |

Evidence — each class appears **only** in `globals.css`, and each keyframe is referenced only by its own dead class:

```
$ grep -rn "animate-fade-in-up|animate-like-pop|version-diff-banner|print-keep-together" src cypress public
src/app/globals.css:443:.animate-fade-in-up {
src/app/globals.css:457:.animate-like-pop {
src/app/globals.css:675:  .print-keep-together,
src/app/globals.css:935:.version-diff-banner {
```

```
$ grep -n "fade-in-up|like-pop|fade-slide-down" src/app/globals.css
391:@keyframes fade-in-up {          ← only consumer is line 444
443:.animate-fade-in-up {
444:  animation: fade-in-up …
451:@keyframes like-pop {             ← only consumer is line 458
457:.animate-like-pop {
458:  animation: like-pop …
936:  animation: fade-slide-down …
939:@keyframes fade-slide-down {      ← only consumer is line 936
```

Safe deletions:

| lines | what |
|---|---|
| `391-394` + `443-445` | `@keyframes fade-in-up` + `.animate-fade-in-up` (8 lines incl. blanks) |
| `451-455` + `457-459` | `@keyframes like-pop` + `.animate-like-pop` (9 lines) |
| `934-950` | `.version-diff-banner` + `@keyframes fade-slide-down` (17 lines) |
| `675` | the single `.print-keep-together,` selector inside the print-rule group (1 line; the other selectors in the group stay) |

Note `.cm`, `.pm`, `.cm__btn*`, `.pm__btn*` also showed as unreferenced-in-code but are **live** — they are `vanilla-cookieconsent`'s own generated class names. Do not touch.

Also note `.version-diff-banner` is dead even though the diff feature is live — `src/components/ui/DiffNavigator.tsx` and `src/lib/contexts/VersionDiffContext.tsx` never apply the class. Confirm with R8/UI that the entrance animation isn't simply un-wired before deleting (same shape of bug as A2).

---

## B3. `PRIORITY_LABELS` — dead const in `src/lib/discord-bot.ts:50-55`

| | |
|---|---|
| **Confidence** | **HIGH** — eslint agrees (`'PRIORITY_LABELS' is assigned a value but never used`) |
| **CONFLICT-RISK** | **yes** (2 PRs) |
| **Diff size** | −6 lines |

```
$ grep -rn -w "PRIORITY_LABELS" src
src/lib/discord-bot.ts:50:const PRIORITY_LABELS: Record<number, string> = {
```

Single occurrence in the whole repo. Note `src/app/api/discord/route.ts:253` builds the same mapping inline as `priMap` — this is the orphaned original.

---

## B4. `toBase64Url` — dead private function in `src/lib/sharing/url-codec.ts:77-83`

| | |
|---|---|
| **Confidence** | **HIGH** — eslint agrees |
| **CONFLICT-RISK** | **yes** (1 PR) |
| **Diff size** | −7 lines |

```
$ grep -rn -w "toBase64Url" src
src/lib/sharing/url-codec.ts:77:function toBase64Url(bytes: Uint8Array): string {
```

Its counterpart `fromBase64Url` (`:85`) *is* live in `decodeShareState`. The encode side evidently moved elsewhere and left this behind.

---

## B5. `templates.ts` — two write-only fields, plus two dead `PasteInput` props

| | |
|---|---|
| **Files** | `src/lib/templates.ts` (CONFLICT, 2 PRs), `src/components/input/PasteInput.tsx` (CONFLICT, **5 PRs** — highest in the repo) |
| **Confidence** | **HIGH** |
| **Diff size** | −8 lines in `templates.ts`, −2 props + 1 call-site line |

`REPORT_TEMPLATES` declares `defaults.hideMatchupSlides` and `defaults.hideSpeedTier` on all four templates, but the only consumer reads `summaryPlaceholder` and nothing else:

```
src/hooks/useHomePage.ts:650-657
    const tmpl = getTemplate(pendingTemplateId);
    if (!tmpl || tmpl.id === "blank") return;
    setTemplateId(tmpl.id);
    if (!summary && tmpl.defaults.summaryPlaceholder) {
      setSummary(tmpl.defaults.summaryPlaceholder);
    }
```

```
$ grep -rn "hideMatchupSlides|hideSpeedTier" src
   → only src/lib/templates.ts (the 2 interface lines + 8 literal values) and nothing else
```

So `hideMatchupSlides`/`hideSpeedTier` are written 8 times and read 0 times. Likewise `REPORT_TEMPLATES[].name`, `.description` and `.icon` have no renderer — the template *picker* UI is gone, and the props that fed it are now dead:

```
src/components/input/PasteInput.tsx:87-88, 121
  selectedTemplate?: string;                  ← declared, destructured, never used
  onTemplateSelect?: (id: string) => void;    ← declared, destructured, never used
src/app/page.tsx:805-806
  selectedTemplate={pendingTemplateId}        ← passed to a component that ignores it
  onTemplateSelect={setPendingTemplateId}
```

eslint confirms both (`'selectedTemplate' is defined but never used`, `'onTemplateSelect' is defined but never used`).

**Needs judgement:** this is either (a) a removed feature to finish removing, or (b) a half-shipped feature to finish shipping. `pendingTemplateId` still defaults to `"blank"` and still round-trips through share state, so templates *do* still do something (the summary placeholder). Ask before cutting. Do not touch `PasteInput.tsx` tonight regardless — 5 open PRs.

---

## B6. `EventType` — dead private type alias, `src/lib/data/tags.ts:33`

Confidence **HIGH** (eslint agrees). CONFLICT-RISK **yes** (3 PRs). Diff −1 line. `EVENT_TYPES` (`:26`) is live; only the derived `type EventType` is unused — `ReportTags.eventType` is typed as plain `string`.

---

## B7. Redundant `export` keywords — conflict-touched files

Same class as A4, listed separately because these files are contested. Confidence HIGH, CONFLICT-RISK **yes**, one-word diffs.

| file:line | symbol | conflicting PRs |
|---|---|---|
| `src/app/changelog/data.ts:3` | `ChangelogItem` | **7** |
| `src/lib/validation/champions-legality.ts:31` | `LegalitySeverity` | 4 |
| `src/lib/data/dex-subset.ts:65` | `DexSubsetMegaStone` | 2 |
| `src/lib/templates.ts:1`, `:13` | `ReportTemplate`, `REPORT_TEMPLATES` | 2 |
| `src/hooks/useTeamReport.ts:31`, `:74` | `evictStoredDraft`, `ViewMode` | 1 |
| `src/lib/data/type-chart.ts:6` | `TYPE_CHART` | 1 |
| `src/lib/posthog-server.ts:56` | `flushServerEvents` | 1 |
| `src/lib/explore/chronological-cursor.ts:1` | `ChronologicalCursor` | 1 |
| `src/data/indy-top-cut.ts:7` | `IndyTopCutEntry` | 1 |
| `src/components/seo/JsonLd.tsx:36,83,142,193` | `HowToStep`, `SportsEventData`, `BreadcrumbItem`, `FAQItem` | 1 |

The four `JsonLd.tsx` interfaces are the prop types of exported components that *are* consumed across the app; they read as deliberate public API. **Recommend leaving those four alone.**

---

## B8. Other eslint `no-unused-vars` hits (all conflict-touched)

Real dead locals/imports, all in contested files. Listed for completeness; none worth touching tonight.

| file:line | dead thing | PRs |
|---|---|---|
| `src/components/layout/Navbar.tsx:202` | `const [exportMenuOpen, setExportMenuOpen] = useState(…)` — dead state pair | 3 |
| `src/components/layout/Navbar.tsx:186` | `syncStatus` destructured, unused | 3 |
| `src/app/page.tsx:6` | `Link` import unused | 3 |
| `src/app/page.tsx:52` | `summarizeChangedFields` import unused | 3 |
| `src/app/page.tsx:190` | `megaStates` assigned, unused | 3 |
| `src/app/page.tsx:229` | `walkthroughIsFirstTime` assigned, unused | 3 |
| `src/components/explore/ExploreFilters.tsx:57,65,73` | `CATEGORY_I18N`, `SORT_I18N`, `PLACEMENT_I18N` — 3 dead consts (pairs with B1's dead Explore i18n keys) | 3 |
| `src/components/explore/ExploreContent.tsx:13` | `SearchCategory` type import unused | 3 |
| `src/components/explore/SpotlightCard.tsx:29` | `t` from `useTranslation()` unused | 3 |
| `src/app/dashboard/DashboardContent.tsx:8` | `UserButton` import unused | 3 |
| `src/app/dashboard/profile/page.tsx:9` | `UserButton` import unused | 4 |
| `src/app/api/user/profile/route.ts:4` | `auth` import unused | 2 |
| `src/components/report/MatchupPlanSlide.tsx:447` | `onResultChange` prop unused | 3 |
| `src/components/report/PokemonDetailSlide.tsx:244` | `category` prop unused | 4 |
| `src/components/report/PokemonCard.tsx:180` | `displayData` assigned, unused | 4 |
| `src/components/report/SpeedTierChart.tsx:548` | `i` map param unused | 5 |
| `src/hooks/useSlideSystem.ts:34` | `hiddenSlides` destructured, unused | 1 |

**Not findings** (intentional idioms, excluded): `src/app/global-error.tsx:4` `_error` (required Next.js signature), `src/lib/utils/normalize-report.ts:97` `_removed` (destructure-to-omit), `vi` imports in `cron-auth.test.ts:1` and `url-codec.test.ts:1` (trivial, leave).

---

## B9. Next.js scaffolding SVGs still in `public/` — 5 files

| | |
|---|---|
| **Files** | `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg` |
| **Confidence** | **HIGH** |
| **CONFLICT-RISK** | **yes** — all five appear in the conflict list (2 PRs each), which strongly suggests an open PR is already deleting them |
| **Diff size** | −5 files |

```
$ for a in next.svg vercel.svg file.svg globe.svg window.svg; do
    grep -rIln "$a" src public scripts docs README.md .github cypress *.ts *.json *.mjs
  done
(no output for any of the five)
```

Every other `public/` asset is referenced (`og-default.png`, `apple-touch-icon.png`, `favicon.*`, `icon-*.png`, `manifest.json`, `sw.js`, `llms*.txt`, `robots.txt` all resolve to `layout.tsx` / `manifest.json` / `sw.js` / generator scripts).

**Suggested action:** skip — almost certainly already handled by an open PR. Verify against that PR rather than duplicating it.

---

# PART C — Dependencies

**No unused npm dependencies.** All 23 `dependencies` and 13 `devDependencies` resolve to at least one real import or config/script reference. Specifically confirmed-live-but-easy-to-doubt: `jsdom` (via `// @vitest-environment jsdom` docblocks in 6 hook tests — `vitest.config.ts` sets no global environment), `start-server-and-test` (`package.json` `test:e2e`), `@types/qrcode` (ambient types for the `qrcode` imports in `OTSSheetModal.tsx` / `TeamOverview.tsx`), `@tailwindcss/postcss` (`postcss.config.mjs`), `tweetnacl` (Discord signature verification in `api/discord/route.ts`).

### C1. `@pkmn/dex` is in `dependencies` but is build-tooling-only — **repeat finding**

| | |
|---|---|
| **File** | `package.json` |
| **Confidence** | **HIGH** |
| **CONFLICT-RISK** | **yes** (3 PRs touch `package.json`) |
| **Diff size** | 1 line moved; ~1.8MB off the production install |

```
$ grep -rn "from \"@pkmn|require(.@pkmn|import .*@pkmn" src scripts
src/lib/data/dex-subset.ts:34: * scripts) can still `import { Dex } from "@pkmn/dex"` directly — only the
scripts/build-dex-subset.mjs:48:import { Dex } from "@pkmn/dex";
```

The only mentions inside `src/` are **comments**. Production reads the pre-extracted `src/lib/data/dex-subset.json` through `dex-subset.ts` / `pkmn-dex-fallback.ts`. Already reported 2026-08-10 (finding 8) and still not actioned.

**Suggested action:** `npm pkg set devDependencies["@pkmn/dex"]=…` + remove from `dependencies`, then confirm `next build` still passes on Vercel (the dex-subset build script must not run during `vercel build`, or it will need the dep at build time — verify before shipping). Needs human sign-off.

---

# PART D — Repeat findings from 2026-08-10, still unactioned

| finding | status | CONFLICT-RISK |
|---|---|---|
| `isRateLimited` — `src/lib/rate-limit.ts:84-90`, production-dead, kept alive only by `src/lib/__tests__/rate-limit.test.ts` | **still present.** Confirmed: zero production callers; `src/lib/security/api-guard.ts:10` and `src/app/api/feedback/route.ts:2` both use `isRateLimitedAsync`. Prior report's advice stands: retarget the test at `isRateLimitedAsync` (which takes the same in-memory path when Upstash env vars are unset, i.e. under vitest) *then* drop the sync wrapper. Behaviour-preserving refactor, not a deletion. | **yes** (2 PRs) |
| `asPokemonTypes` — now `src/lib/data/dex-subset.ts:221`, **fully dead** (this is the one symbol in the repo with zero references anywhere, including tests) | **still present.** `$ grep -rn -w asPokemonTypes .` → 1 hit, the declaration. −3 lines. | **yes** (2 PRs) |
| `@pkmn/dex` in `dependencies` | still present — see C1 | **yes** (3 PRs) |
| `getRegMBMegas` (prior finding 5) | **resolved** — now live at `src/app/champions/page.tsx:4,45` and `ChampionsContent.tsx:17,63` | — |
| `/api/builder/` CORS exemption (prior finding 7) | **resolved** — now a note comment at `src/proxy.ts:86` | — |
| `DisplayTogglePill.tsx`, `useGlobalDisplayPrefs.ts`, `ConsentGate.tsx` (prior Tier 1) | **resolved** — all three files deleted from `main` | — |

---

# Summary table

## High confidence, safe to delete — zero conflict

| # | what | lines | confidence | action |
|---|---|---|---|---|
| A4 | 25 redundant `export` keywords across 21 clean files | ~25 | HIGH | batch `chore:` commit, zero risk |
| A3 | 3 orphan `.sql` migration files | −3 files | HIGH unreferenced | delete the add/drop pair; ask about `add-unlisted` |

## High confidence, needs judgement — zero conflict

| # | what | lines | confidence | action |
|---|---|---|---|---|
| A1 | `/api/bot` route + `email.ts` weekly-summary cascade | ~453 | MED-HIGH | one question to maintainer, then delete |
| A2 | `/api/oembed` unreachable | +4 | HIGH unreachable | **activate**, don't delete — file a ticket |
| A5 | 3 un-wired generator scripts | +3 | HIGH unreferenced | wire into `package.json`, don't delete |

## Real but conflict-touched — schedule after PRs land

| # | what | lines | PRs |
|---|---|---|---|
| B1 | 57 dead i18n keys × 7 locales | −399 | 1 each (atomic 7-file commit required) |
| B2 | 4 dead CSS blocks in `globals.css` | −32 | 1 |
| B8 | 17 eslint-confirmed dead locals/imports | ~−20 | 1–5 |
| B5 | `templates.ts` write-only fields + dead `PasteInput` props | −11 | 2 / **5** |
| B4 | `toBase64Url` dead fn | −7 | 1 |
| B3 | `PRIORITY_LABELS` dead const | −6 | 2 |
| B9 | 5 scaffolding SVGs | −5 files | 2 (likely already in a PR) |
| B7 | 13 redundant `export` keywords | ~13 | 1–7 |
| B6 | `EventType` dead type | −1 | 3 |
| D | `isRateLimited`, `asPokemonTypes`, `@pkmn/dex` (repeats) | ~−14 + 1.8MB | 2/2/3 |

**Total addressable: ~1,000 lines, of which ~480 sit in zero-conflict files (and ~450 of those hinge on the one `/api/bot` question).**

---

## Verification notes for whoever acts on this

* Baseline is clean: `node node_modules/typescript/bin/tsc --noEmit --incremental false` → exit 0, run cold, this session.
* B1 (i18n) **must** be a single atomic commit across all 7 locale files — `TranslationKeys` is `{ [K in keyof typeof en]: string }`, so a partial delete fails `tsc` in both directions.
* A1 cascade: after deleting `src/app/api/bot/route.ts`, `src/lib/email.ts:73` (`sendWeeklySummary` alias) and `:321-529` (`buildWeeklySummaryHtml`) become dead. `escapeHtml`, `sendEmail`, `sendCommentNotificationEmail` and `sendWelcomeEmail` all stay live.
* Repo has no `knip`/`ts-prune`/`depcheck` configured. Consider adding `knip` to CI — every one of the A4/B7 redundant exports and the B1 i18n block would be caught automatically, and this is the 9th manual sweep.
