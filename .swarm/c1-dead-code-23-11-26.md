# C1 · Dead-code verification for VGC-347 — 2026-11-23

Read-only audit. No edits made. Tree audited at `10dfd74` (local `swarm-nightly-2026-11-23`, clean of src changes).

**Headline: GO for the i18n key deletion. The three open PRs touch `src/lib/i18n/` in zero files.
The verified dead-key count is 76, not 73 — the ticket undercounted by three (`exit`, `hidden`, `unlock`).
No landmines: every one of the ticket's claimed 73 keys is independently confirmed dead.
The ~47 LOC mechanical batch is 100% blocked — every single item sits in a PR-owned file.**

---

## 1 · The i18n access pattern, and how reachability was determined

### The pattern

`src/lib/i18n/index.ts` is a React context provider. Consumers do:

```ts
const { t } = useTranslation();   // t: TranslationKeys
... t.someKey ...                 // static dot access, always
```

`TranslationKeys` is declared at `src/lib/i18n/translations/en.ts:388`:

```ts
export type TranslationKeys = { [K in keyof typeof en]: string };
```

All six non-English locales are typed `const xx: TranslationKeys = { … }`, so the mapped type forces an
identical key set in all 7 files. **Verified: all 7 files carry exactly 314 keys.** This is what makes the
deletion self-checking — drop a key from 6 files and `tsc` fails on the 7th.

### Indirection audited — four mechanisms, only one of which hides usage

| Mechanism | Site | Hides usage? |
|---|---|---|
| **Proxy fallback (provider)** | `src/lib/i18n/index.ts:81-86` | **No.** `get(target, prop)` forwards whatever prop the consumer *statically wrote* to the English object. It does not enumerate keys. |
| **Proxy fallback (ShareModal)** | `src/components/ui/ShareModal.tsx:91-96` | **No.** Same shape — `en[key as keyof typeof en]` with `key` supplied by the caller's static access. |
| **`tr()` string registry** | `src/components/report/CommonModesSlide.tsx:105-109` | **YES.** `tr(key: string, fallback: string)` reads `t` as `Record<string, string \| undefined>`. Called with 14 string literals *and* with `block.labelKey` / `block.placeholderKey` from the `BLOCKS` table at `:70-72`. |
| **Cast access** | `src/hooks/useSlideSystem.ts:56` | No — `commonModesTitle` is statically written, just behind an `as unknown as` cast. |

### Negative checks (all clean)

- `grep -rnE "\bt\s*\["` over all of `src/` → **zero** bracket accesses on `t`.
- `grep -rnE "(const|let)\s*\{[^}]*\}\s*=\s*t\b"` → **zero** destructuring of `t`.
- `grep -rnE "Object\.(keys|values|entries)\s*\(\s*(t|en|tRaw)\s*\)"` → **zero** key enumeration.
- Every variable typed `TranslationKeys` is named `t` (`useShareFlow.ts:17`, `useSlideSystem.ts:29`,
  `i18n/index.ts:38`) — so a `t.<key>` scan is complete, with no aliasing to chase.
- `en` is imported directly in exactly one component (`ShareModal.tsx:9`), only to feed its Proxy.

### Method

For each of the 314 keys, searched every `.ts`/`.tsx` in `src/` (excluding `src/lib/i18n/translations/`)
plus `cypress/` and `scripts/` for: `t.KEY`, `t?.KEY`, `t["KEY"]`/`t['KEY']`, `en.KEY`/`en["KEY"]`, and the
bare string literal `"KEY"`/`'KEY'`. Results: **218 keys with direct access**, **26 literal-only**,
**70 with zero occurrence of any kind**.

The 26 literal-only keys were then triaged by hand. **20 are exactly the `CommonModesSlide` registry set**
and are LIVE-via-dynamic — excluded from deletion:

`addCombination, combinationBack, combinationLabel, combinationLeads, combinationStrategy,
combinationStrategyPlaceholder, commonCombinationsDesc, commonCombinationsTitle, commonModesEmpty,
commonModesTitle, gameplan, gameplanPlaceholder, legacyLeadsLabel, legacyModesLabel, legacyNotesTitle,
removeCombination, strengths, strengthsPlaceholder, weaknesses, weaknessesPlaceholder`

The other **6** were coincidental literals with no path to `t`, and are therefore dead:

| Key | Where the literal actually comes from |
|---|---|
| `base` | `mode: "base" \| "mega"` discriminant (`SlideNavControls.tsx:58`), Tailwind `text-base` |
| `hidden` | `overflow: "hidden"`, `aria-hidden`, `document.visibilityState === "hidden"` |
| `visible` | Framer `animate="visible"`, `visibilityState === "visible"` |
| `reactions` | rate-limit key `{ key: "reactions" }` (`api/reactions/[shareId]/route.ts:62`), DB table name |
| `comments` | rate-limit key (`api/comments/[shareId]/route.ts:100`), DB table name |
| `anonymous` | `crossOrigin="anonymous"`, `?? "anonymous"` email fallback |

Finally, all 76 survivors were re-checked with a repo-wide **raw identifier** grep (`\bKEY\b`, no quotes,
across `src/ cypress/ scripts/`). 20 produced hits; every hit was inspected and every one is a coincidental
English word — a local variable, CSS class, code comment, API route segment, or an unrelated function. Two
worth naming explicitly because they look alarming:

- `exportAsImage` / `exportAsPdf` — real exported **functions** in `src/lib/utils/export-report.ts:79,95`,
  imported by `HomePageClient.tsx:504`. The i18n *keys* of the same name (button labels) have zero `t.` site.
  Name collision only.
- `gaps` — a local `const gaps = …` in `OffensiveCoverageChart.tsx:180` and `ThreatMatrix.tsx:60`.

---

## 2 · Verified count and the deletion list

**`en.ts` key count: 314** (verified; flat object, zero nested object/array values — so one key = one line).
**All 7 locales: 314 each.** 238 live · 76 dead (238 + 76 = 314 ✓).

**76 dead keys × 7 files = 532 lines** (ticket said 511 for 73; the arithmetic method matches, the count differs).

Every one of the 76 is confirmed present exactly once in all 7 locale files.

| # | `en.ts` line | Key | Cluster | Confidence |
|---|---|---|---|---|
| 1 | 11 | `loadSample` | Misc / input screen | High |
| 2 | 26 | `locked` | Misc / navbar | High |
| 3 | 35 | `exportTeam` | Edit-link & share copy | High |
| 4 | 36 | `exportCopied` | Edit-link & share copy | High |
| 5 | 37 | `editLink` | Edit-link & share copy | High |
| 6 | 38 | `present` | Edit-link & share copy | High |
| 7 | **39** | **`exit`** | Edit-link & share copy | High — **ticket missed this** |
| 8 | 41 | `newShort` | Edit-link & share copy | High |
| 9 | 46 | `tournamentInfo` | Misc | High |
| 10 | 86 | `base` | Misc | High |
| 11 | 88 | `benchmarks` | Misc | High |
| 12 | 89 | `tailwindDoublesBase` | Misc | High |
| 13 | **106** | **`hidden`** | Slide visibility | High — **ticket missed this** |
| 14 | 107 | `visible` | Slide visibility | High |
| 15 | 108 | `hideSlideTooltip` | Slide visibility | High |
| 16 | 109 | `hiddenSlideTooltip` | Slide visibility | High |
| 17 | 117 | `publicLinkCopied` | Edit-link & share copy | High |
| 18 | 118 | `saveEditLink` | Edit-link & share copy | High |
| 19 | 119 | `copyEditLink` | Edit-link & share copy | High |
| 20 | 120 | `lostEditLink` | Edit-link & share copy | High |
| 21 | 121 | `generateNewEditLink` | Edit-link & share copy | High |
| 22 | 122 | `oldEditLinkStops` | Edit-link & share copy | High |
| 23 | 173 | `yourBring4` | Misc | High |
| 24 | 174 | `selectedCount` | Misc | High |
| 25 | 197 | `commonLeads` | Legacy common-modes | High |
| 26 | 198 | `commonModesField` | Legacy common-modes | High |
| 27 | 203 | `commonLeadsPlaceholder` | Legacy common-modes | High |
| 28 | 204 | `commonModesPlaceholder` | Legacy common-modes | High |
| 29 | 218 | `combinationsEmpty` | Legacy common-modes | High |
| 30 | 230 | `offensiveTypeCoverage` | Type-coverage charts | High |
| 31 | 231 | `defensiveTypeCoverage` | Type-coverage charts | High |
| 32 | 232 | `offensiveCoverageDesc` | Type-coverage charts | High |
| 33 | 233 | `defensiveCoverageDesc` | Type-coverage charts | High |
| 34 | 234 | `gaps` | Type-coverage charts | High |
| 35 | 235 | `noSeCoverage` | Type-coverage charts | High |
| 36 | 236 | `thin` | Type-coverage charts | High |
| 37 | 237 | `onlyOneAnswer` | Type-coverage charts | High |
| 38 | 238 | `covered` | Type-coverage charts | High |
| 39 | 239 | `twoPlusAnswers` | Type-coverage charts | High |
| 40 | 240 | `vulnerable` | Type-coverage charts | High |
| 41 | 241 | `threePlusWeak` | Type-coverage charts | High |
| 42 | 242 | `exposed` | Type-coverage charts | High |
| 43 | 243 | `twoWeak` | Type-coverage charts | High |
| 44 | 244 | `manageable` | Type-coverage charts | High |
| 45 | 245 | `oneWeak` | Type-coverage charts | High |
| 46 | 246 | `resistant` | Type-coverage charts | High |
| 47 | 247 | `noWeakness` | Type-coverage charts | High |
| 48 | 255 | `pasteCalcsPlaceholder` | Misc | High |
| 49 | 267 | `setPasscode` | Passcode sharing (removed) | High |
| 50 | 268 | `unlockEditing` | Passcode sharing (removed) | High |
| 51 | 269 | `passcodeEditDesc` | Passcode sharing (removed) | High |
| 52 | 270 | `passcodeUnlockDesc` | Passcode sharing (removed) | High |
| 53 | 271 | `enterPasscode` | Passcode sharing (removed) | High |
| 54 | 272 | `passcode` | Passcode sharing (removed) | High |
| 55 | 273 | `shareWithPasscode` | Passcode sharing (removed) | High |
| 56 | 274 | `shareWithoutPasscode` | Passcode sharing (removed) | High |
| 57 | **275** | **`unlock`** | Passcode sharing (removed) | High — **ticket missed this** |
| 58 | 284 | `exportAsImage` | Export menu | High |
| 59 | 285 | `exportAsPdf` | Export menu | High |
| 60 | 286 | `exporting` | Export menu | High |
| 61 | 290 | `exploreTitle` | Explore sort/search | High |
| 62 | 292 | `searchPlaceholder` | Explore sort/search | High |
| 63 | 293 | `sortNewest` | Explore sort/search | High |
| 64 | 294 | `sortUpdated` | Explore sort/search | High |
| 65 | 314 | `listPublicly` | Misc | High |
| 66 | 315 | `listPubliclyTooltip` | Misc | High |
| 67 | 371 | `sortPopular` | Explore sort/search | High |
| 68 | 372 | `reactions` | Comments | High |
| 69 | 373 | `comments` | Comments | High |
| 70 | 374 | `addComment` | Comments | High |
| 71 | 375 | `commentPlaceholder` | Comments | High |
| 72 | 376 | `displayNameLabel` | Comments | High |
| 73 | 377 | `anonymous` | Comments | High |
| 74 | 378 | `deleteComment` | Comments | High |
| 75 | 379 | `noComments` | Comments | High |
| 76 | 380 | `loadMoreComments` | Comments | High |

### Cluster corroboration

- **Passcode sharing (9 keys incl. `unlock`)** — feature genuinely gone; no passcode UI anywhere in
  `src/components`. Safest cluster, zero tension. *(Side note, not dead code:
  `src/hooks/useWalkthrough.ts:115` still tells users "Set a passcode to let trusted people edit and
  re-share" — stale copy for a removed feature. Worth its own ticket.)*
- **Comments (9 keys)** — `src/components/social/CommentSection.tsx` never calls `useTranslation()`;
  `:271` hardcodes `"No comments yet. Be the first!"`.
- **Type-coverage charts (18 keys)** — `Offensive/DefensiveCoverageChart.tsx` do call `useTranslation()`
  but only consume `language`; all labels are hardcoded English.
- **Explore sort/search (5 keys)** — superseded by the `filter*` keys at `en.ts:296-304` that
  `ExploreFilters.tsx:111-123` actually reads.

### ⚠ Execution hazards for whoever runs the deletion

The dead and live key sets contain **name prefixes**. A loose regex will silently delete live keys.
Anchor every deletion as `^\s*KEY\s*:` (case-sensitive).

| Dead key | Is a substring of LIVE key |
|---|---|
| `exit` (:39) | `exitPresentation` |
| `hidden` (:106) | `hiddenFromViewers` (:105), `hiddenSlideDescription` |
| `thin` (:236) | `somethingWentWrong` |
| `sortPopular` (:371) | `filterSortPopular` (:300) — **differs only in case**; a case-insensitive match destroys a live key |

Also: these four short keys (`exit`, `hidden`, `base`, `unlock`, `thin`) are the ones the previous scan
either missed or would be riskiest to automate. Delete by line anchor, then let `tsc` confirm 7-file parity.

### Judgement call the reviewer should weigh

For the **coverage-chart (18)** and **comments (9)** clusters the *feature still exists* — the keys are dead
only because those components hardcode English. Deleting them is correct dead-code hygiene, but it closes off
six languages for those panels. The alternative fix is to *wire the keys up*. The passcode, legacy
common-modes and explore-sort clusters have no such tension. Recommend the 27 contested keys get an explicit
nod, or be split into their own commit.

---

## 3 · Keys the ticket claims dead that are actually LIVE

**None. Zero landmines.** All 73 keys named in VGC-347's clusters were independently re-derived as dead by
this scan. The ticket's 20-key `tr()` exclusion set is also exactly correct.

The discrepancy runs the *safe* direction: the ticket **undercounted by 3**. These are dead, unlisted, and sit
immediately adjacent to keys the ticket did list — plainly the same clusters, just overlooked:

| Key | `en.ts` | Neighbour the ticket listed | Verification |
|---|---|---|---|
| `exit` | 39 | `present` (:38) | `t.exit` → 0 hits repo-wide |
| `hidden` | 106 | `visible` (:107) | `t.hidden` → 0 hits repo-wide |
| `unlock` | 275 | `shareWithoutPasscode` (:274) | `t.unlock` → 0 hits repo-wide |

Including them makes the batch **76 keys / 532 LOC**. They can be deleted in the same commit, or dropped from
scope with no loss — either is defensible, but the ticket's "73" should be corrected so the next scan doesn't
re-report them.

---

## 4 · Ownership status and the open-PR i18n diff

### Per-file ownership — all 8 i18n files are FREE

Checked against `.swarm/pr-owned-files.txt` (152 files, PRs #91/#92/#93):

| File | Status |
|---|---|
| `src/lib/i18n/index.ts` | **FREE** |
| `src/lib/i18n/translations/en.ts` | **FREE** |
| `src/lib/i18n/translations/es.ts` | **FREE** |
| `src/lib/i18n/translations/fr.ts` | **FREE** |
| `src/lib/i18n/translations/it.ts` | **FREE** |
| `src/lib/i18n/translations/ja.ts` | **FREE** |
| `src/lib/i18n/translations/ko.ts` | **FREE** |
| `src/lib/i18n/translations/zh.ts` | **FREE** |

`grep -nE "i18n" .swarm/pr-owned-files.txt` → **no matches at all**. The 7 locale files are also positively
listed in `.swarm/free-src-files.txt` (lines 227-233).

### Where `TranslationKeys` lives — FREE

`TranslationKeys` is declared in **`src/lib/i18n/translations/en.ts:388`**, which is FREE. It is a *derived*
mapped type (`{ [K in keyof typeof en]: string }`), so deleting keys from the `en` object updates the type
automatically — **no separate edit to any type file, and no edit to `index.ts`, is required.** The deletion
touches exactly 7 free files.

### ⭐ THE DECIDING CHECK — open PR branches do not touch i18n

```
git diff --stat origin/main...origin/swarm-nightly-2026-11-02 -- src/lib/i18n/   → (empty)
git diff --stat origin/main...origin/swarm-nightly-2026-11-09 -- src/lib/i18n/   → (empty)
git diff --stat origin/main...origin/swarm-nightly-2026-11-16 -- src/lib/i18n/   → (empty)
```

Refs validated so the empty output is not a silent bad-ref:

| Branch | Tip | merge-base w/ main | Total files changed | i18n files changed |
|---|---|---|---|---|
| `swarm-nightly-2026-11-02` (#91) | `d36f77f` | `10dfd74` | 134 | **0** |
| `swarm-nightly-2026-11-09` (#92) | `c2c76c3` | `10dfd74` | 36 | **0** |
| `swarm-nightly-2026-11-16` (#93) | `8978206` | `10dfd74` | 58 | **0** |

All three share merge-base `10dfd74` and have substantial non-zero diffs, so the ranges are live and the
zero is real. **No branch adds, renames, removes or re-sorts a single i18n key.**

Went one step further than the ticket asked, because files-not-owned is not sufficient — a branch could add a
*new call site* for a key we delete, which would break at merge even with `src/lib/i18n/` untouched. Scanned
every added line across all three branches for `t.<key>`:

| Branch | Added `t.*` accesses | Verdict |
|---|---|---|
| `-11-02` | `t.created_at`, `t.data`, `t.id`, `t.likeCount`, `t.updated_at`, `t.view_count` | All SQL table aliases, not i18n |
| `-11-09` | none | — |
| `-11-16` | `t.delete`, `t.gameN` (`MatchupPlanSlide.tsx`, one `aria-label`) | Both are **live** keys (`en.ts:193`, `:186`), **neither is in the dead list** |

**No collision on any of the 76 keys.** Also confirmed no branch adds a `useTranslation()` call to a
previously-untranslated component (the only `useTranslation` additions in the branch diffs are inside `.swarm/*.md`
report prose, plus one `const { language } = useTranslation()`).

Note: `origin/swarm-nightly-2026-11-16` carries `.swarm/c1-dead-code-16-11-26.md`, the prior scan this ticket
was written from. It is documentation only — no code.

---

## 5 · The ~47 LOC mechanical batch — ALL BLOCKED

Every item verified present at the stated location. **Every single one is in a PR-owned file.
None of this batch can be done tonight.**

| # | Item | File:line | Owned? |
|---|---|---|---|
| 2 | `getCalcSpecies` (unused export) | `src/lib/analysis/damage-calculator.ts:56` | **OWNED** |
| 3 | `asPokemonTypes` (unused export) | `src/lib/data/dex-subset.ts:221` | **OWNED** |
| 3b | `import type { PokemonType }` | `src/lib/data/dex-subset.ts:38` | **OWNED** |
| 4 | `CATEGORY_I18N` | `src/components/explore/ExploreFilters.tsx:57` | **OWNED** |
| 4 | `SORT_I18N` | `src/components/explore/ExploreFilters.tsx:65` | **OWNED** |
| 4 | `PLACEMENT_I18N` | `src/components/explore/ExploreFilters.tsx:73` | **OWNED** |
| 5 | `toBase64Url` (module-local fn) | `src/lib/sharing/url-codec.ts:77` | **OWNED** |
| 6 | `PRIORITY_LABELS` | `src/lib/discord-bot.ts:50` | **OWNED** |
| 7 | `type EventType` | `src/lib/data/tags.ts:33` | **OWNED** |
| 8 | `displayData` (dead local) | `src/components/report/PokemonCard.tsx:180` | **OWNED** |
| 9 | `exportMenuOpen` / `setExportMenuOpen` | `src/components/layout/Navbar.tsx:202` | **OWNED** |
| 10 | `useTranslation` import + call | `src/components/explore/SpotlightCard.tsx:4, 28` | **OWNED** |

### The 8 unused imports / bindings — also all owned

| Binding | File:line | Owned? |
|---|---|---|
| `auth` (from `{ auth, currentUser }`) | `src/app/api/user/profile/route.ts:4` | **OWNED** |
| `UserButton` | `src/app/dashboard/DashboardContent.tsx:8` | **OWNED** |
| `UserButton` | `src/app/dashboard/profile/page.tsx:9` | **OWNED** |
| `type SearchCategory` | `src/components/explore/ExploreContent.tsx:13` | **OWNED** |
| `import Link from "next/link"` | `src/components/home/HomePageClient.tsx:8` | **OWNED** |
| `summarizeChangedFields` | `src/components/home/HomePageClient.tsx:54` | **OWNED** |
| `megaStates` | `src/components/home/HomePageClient.tsx:158` | **OWNED** |
| `i` (unused `.map` index) | `src/components/report/SpeedTierChart.tsx:583` | **OWNED** |

**Count: 20/20 mechanical items blocked, 0 free.** Defer the whole ~47 LOC batch until #91/#92/#93 merge.

Harmless cross-check while here: the three dead `*_I18N` maps hold i18n *key-name strings*
(`filterCatAll`, `filterSortPopular`, …). None of those names is in the 76-key dead list, and all are
independently live via the inline path at `ExploreFilters.tsx:111-123` — so deleting the maps later orphans
nothing, and deleting the 76 keys now does not break the maps.

---

## 6 · DO-NOT-DELETE traps — both re-confirmed

### Trap 1 · `src/lib/explore/chronological-cursor.ts` — KEEP. **File is FREE, so nothing mechanically stops a deletion agent. Flagging loudly.**

All three symbols present:

- `export interface MetricCursor` — **line 48**
- `export function parseMetricCursor` — **line 96**
- `export function serializeMetricCursor` — **line 115**

**The file header really does say it is VGC-295 scaffolding** — verbatim, lines 1-25:

> `VGC-295 IS ONLY HALF-FIXED. DO NOT ASSUME THE BUG IS GONE.`
> … `This module is the cursor half of the fix: every cursor now carries a full (timestamp, id) pair, so the
> route *can* filter unambiguously.`
> `STILL OUTSTANDING: the SQL half. The WHERE/ORDER BY mismatch in route.ts (~L194-195 popular, ~L208-209
> views, ~L217-227 chronological) is UNCHANGED and still mispaginates. … Whoever has a database next: run the
> EXPLAIN, then make WHERE and ORDER BY agree on (timestamp, id) using parseMetricCursor().id /
> parseChronologicalCursor().id.`

The exports read as "unused" precisely because the consuming half is unwritten. The ticket gates that edit on
an `EXPLAIN` against a real database. **KEEP.** (Incidentally the consumer,
`src/app/api/explore/route.ts`, *is* PR-OWNED, so the SQL half could not be landed tonight either.)

### Trap 2 · `_removed` in `src/lib/utils/normalize-report.ts` — KEEP. File is **OWNED** (doubly blocked).

Present at **line 97**, exactly as described:

```ts
// Remove spreadNotes from output — it's been merged into notes
const { spreadNotes: _removed, ...rest } = data;
```

This is the rest-omit idiom: `_removed` is *how* `spreadNotes` is stripped from `...rest`, which is spread
into the return value two lines later. ESLint flags it as unused, but **deleting it changes behaviour** —
`spreadNotes` would leak back into every normalized report. **KEEP.**

---

## 7 · Recommendation

### ✅ GO — delete the i18n keys tonight

Reasons, in order of weight:

1. **The deciding fact: all three open PRs change zero files under `src/lib/i18n/`**, on validated diff
   ranges with real non-empty diffs elsewhere. No key added, renamed or removed; no new call site for any
   key in the dead list. Merge-time collision risk is nil.
2. **All 8 i18n files are FREE**, and `TranslationKeys` is a derived mapped type living in the FREE
   `en.ts` — so the change is confined to 7 free files with no type-file or `index.ts` edit.
3. **Zero landmines.** An independent re-derivation reproduced the ticket's 73 exactly, plus 3 it missed.
   The 20-key dynamic `tr()` registry is correctly excluded, and it is the *only* dynamic access path in
   the codebase (no bracket access, no destructuring, no enumeration anywhere).
4. **The change is self-checking.** `TranslationKeys` parity means a key dropped from 6 of 7 files fails
   `tsc` loudly. Run the cold gate: `npm run typecheck` (i.e. `tsc --noEmit --incremental false`).

Scope to execute: **76 keys × 7 files = 532 lines.** Delete with line-anchored,
case-sensitive `^\s*KEY\s*:` matches — see the §2 hazard table, especially `sortPopular` vs
`filterSortPopular` and `exit` vs `exitPresentation`.

Two conditions on the GO:

- **Give the 27 contested keys their own commit** (18 coverage-chart + 9 comments). Those features still
  exist and the keys are dead only because the components hardcode English; deleting forecloses
  localization there. The other 49 keys (passcode, legacy common-modes, explore-sort, share copy, misc)
  are unambiguous.
- **Tidy the orphaned section comments** left in `en.ts` where a whole cluster goes (e.g. the
  `// Explore page` and passcode groupings) so the next scan reads cleanly.

### ⛔ NO-GO — the ~47 LOC mechanical batch

All 20 items sit in PR-owned files. Defer in full until #91/#92/#93 land. Nothing in it is actionable tonight.

### ⛔ NO-GO — both traps

`chronological-cursor.ts` (FREE but deliberate open-ticket scaffolding — protect it explicitly in the
deletion agent's instructions) and `normalize-report.ts:97` `_removed` (OWNED, and behaviour-bearing).

### Ticket follow-ups

- Correct VGC-347's count from 73/511 LOC to **76/532 LOC**, adding `exit`, `hidden`, `unlock`.
- File separately: stale passcode copy at `src/hooks/useWalkthrough.ts:115` (content bug, not dead code).
