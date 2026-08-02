# Code Review — last 20 commits on `origin/main`

Range reviewed: `cba0832` … `d962cc6` (HEAD). Read-only review; `node_modules` unavailable so
nothing was executed except a standalone JS re-implementation of `convertToChampionsSp` used to
enumerate its edge cases (scratchpad only).

---

## CONFIRMED BUGS

### C1. `b5712a6` is an incomplete fix — SP is still fabricated for 4-EV filler stats
`src/lib/analysis/stat-calculator.ts:118-136`

The commit removed the *uninvested* padding branch but left Step 3, which still pumps the entire
leftover budget into any stat with a non-zero EV value. The exact symptom the commit claims to have
killed ("32 HP / 32 X out of nowhere") reproduces on an extremely common spread:

| paste EVs | SP produced today |
|---|---|
| `EVs: 252 HP / 4 Def` | **`32 HP / 32 Def`** (64 SP) |
| `EVs: 252 HP / 252 SpA / 4 SpD` | `32 HP / 32 SpA / 2 SpD` |
| `EVs: 252 Atk / 252 Spe / 4 HP` | `2 HP / 32 Atk / 32 Spe` |

A 4-EV throwaway in Def becomes **maximum Def investment**. The card, the detail slide, the speed
tier chart and `/compare` all render that fabricated stat as if the user had asked for it. Note the
asymmetry: a 4-EV stat next to two maxed stats absorbs only 2 SP, but the same 4 EVs next to one
maxed stat absorbs 31 SP — the output is a function of what *else* is in the spread, which is not a
defensible conversion rule.

Why it matters: converted stat values are the product. A Garchomp shown at 32 SP Def has ~+32 real
Def it does not have, and every damage calc / speed comparison built on it is wrong.

Fix: cap Step 3 at a proportional share of the original EV weight rather than a greedy fill, or drop
Step 3 entirely and let the SP total come out under 66 (which is what an EV spread genuinely maps to).
Simplest correct version: distribute `remaining` proportionally to `evs[stat] / totalEvs` with
largest-remainder rounding, and never let a stat that started at 1 SP (i.e. ≤ 8 EVs) climb past
~2 SP.

### C2. `0/66 SP` renders with the green "budget satisfied" dot
`src/components/report/PokemonCard.tsx:437-439`, `src/components/report/PokemonDetailSlide.tsx:693-695`

```ts
const spOver  = totalSp > CHAMPIONS_TOTAL_SP;
const spUnder = totalSp < CHAMPIONS_TOTAL_SP && totalSp > 0;
const spDot   = spOver ? "bg-danger" : spUnder ? "bg-amber-500" : "bg-emerald-500";
```

`totalSp === 0` is neither over nor under, so it falls through to **emerald**. Before `b5712a6` a
no-EV paste produced 66 SP and green was correct; after the fix it produces 0 SP and the badge now
reads `0/66` next to a green "all good" dot. This is a direct regression introduced by `b5712a6`
in the exact scenario the commit was written for.

Fix: `const spUnder = totalSp < CHAMPIONS_TOTAL_SP;` (drop the `&& totalSp > 0`) in both files.

### C3. `b5712a6`'s stated safety net does not exist — the validator is silent on a 0-SP mon
`src/lib/validation/champions-legality.ts:265-303`

The commit message says "Leftover budget stays unspent; the legality validator surfaces it." It does
not. `looksLikeSp` requires `total > 0` (line 268) and the EV fallback branch requires `total > 0`
(line 287), so an all-zero spread — precisely the case the fix creates — emits **no issue of any
severity**. A Champions team pasted without EV lines now shows uninvested stats everywhere with zero
feedback anywhere in the UI.

Fix: handle `total === 0` explicitly in the Champions branch and emit
`"<species>: 0/66 SP allocated"` as a warning (not info — a fully uninvested mon is almost always a
paste mistake).

### C4. Three different EV caps in three layers
`src/lib/parser/showdown-parser.ts:138` (`> 510` warn) ·
`src/lib/validation/champions-legality.ts:281,284,287,290` (`> 512` error, "512 total") ·
`src/components/report/PokemonCard.tsx:459-466` (`/508` badge)

The game cap is 510. `512` is simply wrong and is user-visible in the message
`"<species>: N EVs allocated — M more available (Reg M-A allows 512 total)"`. A 511- or 512-EV paste
gets a parser warning but a validator "info", and the card shows it against 508. Pick 510 as the hard
error, 508 as the optimisation target, and use those two numbers everywhere.

### C5. A blank line inside a Pokémon block creates a phantom team member
`src/lib/parser/showdown-parser.ts:182-187, 195-201`

Blocks are split on `/\n\s*\n/` with no validation of what a block contains. A paste with a stray
blank line before the moves produces a second "block" whose first line is `- Earthquake`, which
becomes `species: "- Earthquake"`. Line 197 only rejects `species === "Unknown"` (unreachable — empty
blocks are already dropped by `.filter(Boolean)` at line 185), so the phantom is pushed into the
team, consumes one of the 6 slots at line 210, and can push a real Pokémon off the report.

Fix: reject blocks whose first line starts with `- `, or require that a block yield a species that
isn't a move/stat/metadata line before pushing.

### C6. A `=== Team ===` header not followed by a blank line becomes a Pokémon
`src/lib/parser/showdown-parser.ts:187`

```ts
.filter(b => !b.match(/^===.*===$/))
```

No `m` flag, so `^`/`$` anchor to the whole block string. When the header is on the line immediately
above the first Pokémon (common in team-sheet exports), the header and the first mon land in one
block and the filter does not fire. `firstLine` is then `=== [gen9vgc] Team ===`, which parses as a
species. The team-name regex at line 175 *does* use `/m` — the two regexes disagree about what a
header is.

Fix: add `m` and `.filter(b => !/^===.*===$/m.test(b))`, or strip header lines from `normalized`
before splitting into blocks.

### C7. Dismiss button's 44px hit area overflows its own line box
`src/components/report/StatColorNote.tsx:48-53`

`min-w-[44px] min-h-[44px] -my-4 -ml-2` on a flex child inside a `text-xs` `<p>`: the negative
margins shrink the *layout* box to ~12px tall while the button's border box stays 44×44 and is
centred on the line. The result is an invisible, click-capturing region extending ~14px above and
below the caption (into the last stat row) and ~8px to the left (over the caption text itself, which
blocks text selection there). Growing a control's hit area with negative margin only works when the
surrounding space is genuinely inert; here it isn't.

Fix: keep `min-h-11 min-w-11` but give the `<p>` matching vertical padding, or use a
`::before`-based hit-area expansion (`after:absolute after:-inset-3`) on a relatively-positioned
button so the layout box and the hit box agree.

### C8. Order-sensitive `JSON.stringify` gates DB version snapshots
`src/lib/utils/diff-state.ts:72, 82, 130`

`JSON.stringify(oldState.tags ?? {}) !== JSON.stringify(newState.tags ?? {})` compares two
semantically-identical objects as different whenever their key order differs. `oldState` is read back
from the `shares.data` column; if that column is `jsonb` (the Postgres default choice, and consistent
with the `data->>'creatorName'` usage in `src/app/sitemap.ts:46`), Postgres **does not preserve key
insertion order** — it re-orders keys by length then bytewise. `newState` arrives with the client's
insertion order. Any mismatch makes `detectChangedSections` report a phantom "Tags" / "How to play"
change, which makes `src/app/api/share/route.ts:172` treat every autosave as a real change and write
a `share_versions` snapshot.

This is the exact failure mode behind the July 2026 incident recorded in `CLAUDE.md`
("`share_versions` snapshots consumed 447MB" of a 512MB Neon tier). Whatever the column type turns
out to be, comparing objects by raw `stringify` is a defect.

Fix: deep-compare with a stable serializer (sort keys recursively before stringify) in
`detectChangedSections` and `diffRecordKeys`. This module has **no test file** — see T1.

### C9. Legacy anonymous reports may have become permanently uneditable
`src/app/api/share/route.ts:103-113, 152`

`359cdef` made the POST path require a signed-in user (401 otherwise) and then gates edits on
`oldRows[0].owner_id === authedUserId` or an accepted `collaborators` row. Rows created before
authentication was mandatory would carry `owner_id IS NULL` — the pre-`359cdef` code explicitly
handled that case (`if (!callerId || callerId !== oldRows[0].owner_id)`), which implies such rows
exist. Those reports now 403 for everyone forever, including their creator holding a valid edit
token.

I cannot query the DB to confirm how many rows have `owner_id IS NULL`, so verify before acting.
Fix if confirmed: a one-time backfill claiming `owner_id` on first authenticated edit with a valid
`edit_token`, or an explicit "claim this report" path.

---

## GAPS IN TEST COVERAGE THAT CARRY REAL BUG RISK

### T1. `src/lib/utils/diff-state.ts` — no tests, gates DB writes
135 LOC, zero tests, and it is the sole guard on `share_versions` snapshot creation. Given the
447MB storage incident this is the highest-value missing test in the repo. Needed cases: identical
states with permuted `tags` key order must return `[]`; identical `matchupPlans` with different `id`
/ `showSlide` must return `[]`; a changed `commonModes.combinations[2].notes` must return
`["How to play"]`.

### T2. `src/lib/analysis/detect-regulation.ts` — 239 LOC, zero tests
This module decides Champions vs. classic, and that decision is what makes the app interpret the EV
line as SP or as EVs. A misdetection changes **every displayed stat on the report**. It has a
five-level priority cascade with early returns, a whole-team M-B pre-pass, and three different
species-key normalisations (`getRegulationLookupKey`, a raw inline normaliser at lines 108 and 178,
and `normalizeMegaKey` inside `mega-detect`). None of that is pinned. Needed: M-B-only mega anywhere
in the team wins over an M-A mega in slot 1; mega stone on a non-matching species must not tag M-A;
Reg H positive detection requires a DLC species *and* a clean team; restricted → Reg G short-circuits
before the Reg H/F branches.

### T3. `src/lib/utils/mega-detect.ts` — no tests
Feeds `detect-regulation`, `speed-tier-form`, `PokemonCard`, `PokemonDetailSlide` and
`CompareContent`. The dual-mega guard in `detectMegaFromItem` (Charizardite X vs Y must match
`entry.baseName`) and the `getMegaEntryFromDex` dynamic fallback are both untested; a Charizard-X/Y
mix-up silently renders the wrong base stats. `speed-tier-form.test.ts` exercises this indirectly for
two species only.

### T4. `convertToChampionsSp` tests are too loose to have caught C1
`src/lib/analysis/__tests__/stat-calculator.test.ts:137-156`

```ts
expect(sp.spd).toBeGreaterThanOrEqual(1); // 4 EVs keeps its minimum investment
...
expect(total).toBeLessThanOrEqual(CHAMPIONS_TOTAL_SP);
for (const v of Object.values(sp)) expect(v).toBeLessThanOrEqual(32);
```

Both assertions pass for the fabricated `32 HP / 32 Def` output in C1. Regression tests for a
"stop fabricating values" fix must assert *exact* spreads (`toEqual`), not bounds. Add the C1 table
above as exact-value cases, plus the `252/252/252/252` trim case (currently yields
`hp: 0, atk: 2, def: 32, spe: 32` — the first-declared stat is zeroed while later ones stay maxed,
which is order-dependent and arbitrary; see N3).

### T5. `champions-legality` has no zero-spread test
`src/lib/validation/__tests__/champions-legality.test.ts` covers the SP path, the EV path and the
disambiguation between them, but never a team with no EV lines — which is why C3 shipped. Add: a
6-mon team with all-zero spreads must produce a per-Pokémon SP warning.

### T6. `src/lib/analysis/detect-archetype.ts` (130 LOC) and `src/lib/data/type-chart.ts` (208 LOC)
Both untested. `getDefensiveProfile` drives the team-weakness display; a single wrong multiplier in
the 18×18 `TYPE_CHART` literal is invisible until a user notices. A cheap high-value test: assert the
chart is symmetric-complete (every type has an entry for every non-1× interaction) and spot-check
~10 known interactions.

### T7. `src/lib/utils/normalize-report.ts` (120 LOC) — untested
`migrateCalcEntries` is a schema migration run on every shared report read
(`src/app/api/share/[id]/route.ts`). A crash or a silent drop here corrupts old reports on load.

---

## STYLE / NITS

- **N1** `src/lib/analysis/stat-calculator.ts:99-103` — the "already SP" fast path fires on any
  spread totalling ≤ 66 with no stat > 32. `EVs: 4 HP` (a classic filler) and `EVs: 20 HP / 12 Def`
  are read as SP and pass straight through. The heuristic is unavoidable given Showdown has no `SPs:`
  line, but it should be documented as lossy and ideally keyed off the detected regulation rather
  than the numbers alone.
- **N2** `src/lib/parser/showdown-parser.ts:197` — `parsed.species !== "Unknown"` is unreachable
  (empty blocks are filtered at line 185), so the `"Empty Pokemon block"` warning at line 57 can
  never surface. Dead branch.
- **N3** `src/lib/analysis/stat-calculator.ts:138-149` — the over-budget trim removes from the
  lowest stats *to zero* in ascending order, so `252/252/252/252` yields `hp: 0, atk: 2, def: 32,
  spe: 32`. Only reachable on already-illegal input, but the result is declaration-order dependent.
  Trim proportionally instead.
- **N4** `.github/workflows/ci.yml:19-21` — lint is `continue-on-error: true` with a TODO comment and
  no tracking issue, so the 35 pre-existing errors will never be forced down. The comment also
  contains a stray marker token (`# ponytail:`) that looks like an internal codename accidentally
  committed. Either file a ticket and reference it, or set a ratchet (`--max-warnings`).
- **N5** `src/components/report/StatColorNote.tsx:12-21` — `subscribe` listens only to the custom
  in-tab event; no `window.addEventListener("storage", …)`, so dismissing in one tab leaves other
  open tabs showing the caption.
- **N6** `src/components/report/StatColorNote.tsx:31-38, 51` — the button is labelled "Hide this note
  permanently" and there is no restore path anywhere in the UI. A user who dismisses it by accident
  can only recover via devtools. Consider a per-session dismissal, or a reset in report settings.
- **N7** `src/components/report/SpeedTierChart.tsx:185` uses `mon.parsed.level` while line 239
  hardcodes `50` for the same calculation. The parser forces level 50 (`showdown-parser.ts:95`), so
  they agree today, but the inconsistency invites divergence. Same latent issue in
  `src/lib/utils/export-paste.ts:44,107` (`if (mon.level !== 50)` is unreachable).
- **N8** `src/app/page.tsx` (from `d706f71`) — the export-theme dialog's Escape handler is bound to
  the dialog element, so Escape does nothing if focus is on the backdrop. Bind to `document` or make
  the backdrop focusable.
- **N9** `src/app/sitemap.ts:36` (from `fe70914`) — the creator query gained `LIMIT 5000` on top of
  the shares' own `LIMIT 5000`. Combined the sitemap can approach the 50k/entry limit; fine now,
  worth a note before the corpus grows.

---

## Commits with nothing to flag

`d962cc6` (changelog data only) · `6671461` (CI workflow, superseded by N4) · `83d195a`,
`470dfa2` (one-liners) · `cba0832` (icon extraction, mechanical) · `2a24ae9` (test-only additions).
`cfcbd2f` extracts `resolveSpeedTierForm` with tests and correctly suppresses the duplicate mega
overlay row — clean. The large product commits (`359cdef`, `3c895f1`, `d3260c6`, `7349ac7`,
`0269462`, `14273a1`) were reviewed at the diffstat level plus a targeted read of the
auth-relevant paths; only C9 surfaced. A deeper pass on the collaborative-sync and draft hooks is
worth scheduling separately.
