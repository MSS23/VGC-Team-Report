# Commit Review — last 20 commits on `origin/main`

Reviewer: c5 (read-only audit) · Date: 2026-09-14 · Range: `0f73ba3..70c4633`

Scope: `git log origin/main --oneline -20`, full diffs read for the 12 substantive commits
(`70c4633 415a281 6cec919 0024679 82f9210 0242253 a099f97 164fb87 1db8419 b865fa2 9897389 d44b93a bc7dffd c4c6c75 a1255c1 1b14f3b 44f780c fd0aa6f 0f73ba3`).

**Overall:** the batch is unusually high quality for a swarm run — every commit message names the
bug and the mechanism, regressions almost always got a named test, and there are **zero**
`TODO`/`FIXME`/`HACK` markers, zero debug `console.log`, zero empty catch blocks, and zero
`as any` / `@ts-ignore` added across the 64 changed `.ts`/`.tsx` files. The domain-logic fixes in
`1b14f3b` and `82f9210` (type chart, parser headers, Species Clause, EV 510, restricted
legendaries) are all **correct** against real VGC rules — I verified each by hand.

Two findings are real shipped bugs. The rest are follow-ups.

---

## P1 — Shipped bugs

### 1. Three broken Tailwind classes — the mobile touch-target fix does nothing AND drops the font size
**Commit:** `0024679` "fix: mobile touch and layout fixes across report UI"
**Files:**
- `src/components/report/SpeedTierChart.tsx:132` — `py-1 sm:py-1.5 min-h-11text-[10px] sm:text-xs`
- `src/components/report/SpeedTierChart.tsx:482` — `px-3 py-1.5 min-h-11text-xs font-semibold`
- `src/components/report/SpeedTierChart.tsx:500` — `px-3 py-1.5 min-h-11text-xs font-semibold`

A missing space concatenated `min-h-11` onto the following class. `min-h-11text-xs` is not a real
Tailwind utility, so **both** classes are lost: the 44×44px touch target (the entire point of the
commit) never applies, *and* the explicit font size is gone, so the speed-chart modifier pills and
the "Mega Forms" / "Meta Threats" toggles now inherit their parent's size — a visible regression
on top of the un-fixed one.

Confirmed present on `origin/main` today (`git grep -n "min-h-11text" origin/main`). Every other
`min-h-11` in the codebase (60+ sites) is correctly spaced, so this is a typo, not a convention.

**Why it matters:** silently ships a UI standards violation that the commit claims to have fixed,
which means the next audit will believe it is already done. Also confirms `ui-checklist-reviewer`
(required by CLAUDE.md for any `.tsx` change) was not run, or did not catch it.

**Fix (quick win):** insert the missing space in all three — `min-h-11 text-[10px]`,
`min-h-11 text-xs`, `min-h-11 text-xs`. Purely mechanical, no logic touched.

---

### 2. Explore cursor pagination "fix" is a no-op on two of three sort paths, and the third has an ORDER BY / WHERE mismatch
**Commit:** `82f9210` — bullet *"explore cursor pagination compared microsecond timestamps against ms-truncated cursors, skipping same-ms rows at page boundaries"*
**File:** `src/app/api/explore/route.ts:193` (popular), `:207` (views), `:222-226` (newest/updated)

The commit wraps the left-hand side of each cursor predicate in `date_trunc('milliseconds', ...)`.

**(a) The popular and views branches are mathematically unchanged.** The cursor value is built at
`:335` from `(last.created_at as Date).toISOString()`, which is already millisecond-aligned. For a
strict `<` against an ms-aligned constant `t`, `x < t` and `trunc_ms(x) < t` select exactly the
same rows — truncation only ever matters for `=`/`<=`. So the stated bug (same-millisecond rows
dropped at the page boundary) is **still live** on both branches. Neither tuple carries `s.id`, so
there is no tiebreak to fall through to either.

**(b) The chronological branch is now half-fixed, and inconsistent with its own ordering.**
`:222-224` filters on `(date_trunc('milliseconds', col), s.id) < (ts, id)` but `:227` still orders
by `ORDER BY ${col} DESC, s.id DESC` — the *untruncated* column. Within a single millisecond the
query orders by microsecond while the cursor walks by id. Concretely, given rows
`A(.123100, id='z')` and `B(.123900, id='a')`: ORDER BY emits B then A; the page ends at B, so the
cursor is `(.123, 'a')`; the next page requires `id < 'a'`, and **A is silently skipped**.

**Why it matters:** silent, un-reproducible data loss in the Explore feed — reports vanish from
pagination rather than erroring. Low frequency (needs same-ms ties) but permanent for the affected
rows, and the commit message asserts it is fixed, so no one will look again.

**Suggested fix:** pick one representation and use it on both sides.
Cleanest: stop truncating, and widen the cursor to full precision instead (Postgres `timestamptz`
is µs; serialize with `to_char(..., 'YYYY-MM-DD"T"HH24:MI:SS.USOF')` rather than JS
`toISOString()`). Alternative: keep truncation but apply it in `ORDER BY` too, *and* add `s.id` as
a third tuple element + ORDER BY key on the popular/views branches so ties are always breakable.
Either way this deserves its own ticket — not a quick win.

---

## P2 — Correctness risks worth a ticket

### 3. `detect-archetype` invents a third, weaker SP-detection heuristic, with no test
**Commit:** `1b14f3b` · **File:** `src/lib/analysis/detect-archetype.ts:87-92`

```ts
const isSpScale = pokemon.length > 0 && pokemon.every((p) => {
  const evs = p.parsed.evs;
  if (!evs) return true;
  return Object.values(evs).reduce((a, b) => a + (b ?? 0), 0) <= CHAMPIONS_TOTAL_SP;
});
const evScale = isSpScale ? CHAMPIONS_MAX_SP_PER_STAT / 252 : 1;
```

The codebase already has a canonical "is this spread SP or EV?" test, used identically in two
places:
- `stat-calculator.ts:213-215` (`convertToChampionsSp` fast path): `total > 0 && total <= 66 && !anyOverMax`
- `champions-legality.ts:263` (`looksLikeSp`): `total > 0 && total <= 66 && maxPerStat <= 32`

Both require **total ≤ 66 AND per-stat ≤ 32**. This new one checks only the total. A classic EV
spread such as `EVs: 60 Spe` (total 60, one stat at 60) is read as SP here but as EV by the
converter and the validator — the same team is then scored on two different scales, and the
archetype thresholds are divided by ~7.9 for a team that is actually on the EV scale, which will
tag a lightly-invested EV team as Hyper Offense.

Narrow trigger, but it is exactly the "subtle scoring bug" class: user-visible, silent, and in the
SP/EV maths.

**Also a CLAUDE.md violation:** this is new logic in `src/lib/` and `src/lib/analysis/__tests__/`
contains no `detect-archetype.test.ts` — the directory has only `item-boosts`, `sp-docs-drift`, and
`stat-calculator`. The commit added tests for its type-chart, parser, and legality changes but not
for this one.

**Suggested fix:** export a single `looksLikeSpSpread(evs): boolean` from `stat-calculator.ts`, have
all three call sites use it, and add `detect-archetype.test.ts` covering (a) a Champions SP team
that should now detect Hyper Offense, (b) an EV team with a sub-66 total that must **not** be
treated as SP. Medium-sized, not a quick win.

### 4. `getRestrictedBase` now aliases `getRegulationLookupKey` — a strip list it does not control
**Commit:** `82f9210` · **File:** `src/lib/validation/champions-legality.ts:112-116`

De-duplicating the two form-strip lists is the right instinct, but the direction is backwards: the
legality validator now inherits *whatever* `gen9-regulation-signals.ts:325-359` strips, which today
is 24 suffixes including `-alola`, `-galar`, `-hisui`, `-paldea`, `-therian`, `-incarnate`,
`-hero`, `-rapid-strike`, `-single-strike`. Restricted-cap counting needs none of those. Anyone
adding a suffix for regulation auto-detect (a purely cosmetic concern) now silently changes which
teams pass the max-2-restricted check (a scoring concern), with no test linking the two.

Related, and worth correcting in the same pass: the commit message says *"list now matches
champions-legality"*, but the two sets still differ — `RESTRICTED_LEGENDARIES`
(`gen9-regulation-signals.ts:49+`) contains `cosmog`/`cosmoem`, while `RESTRICTED_BASE_NAMES`
(`champions-legality.ts:49-75`) does not.

**Suggested fix:** keep the shared helper but pin it with a test that asserts the exact set of
suffixes `getRestrictedBase` collapses, so an unrelated addition to the regulation list fails
loudly. Optionally reconcile the two restricted sets (or have one import the other).

### 5. `allowComments` is one-way and can leak across reports
**Commit:** `44f780c` · **Files:** `src/hooks/useShareFlow.ts:60-77`, `src/hooks/useHomePage.ts:625`, `src/app/page.tsx:1608-1611`

The ref-based fix itself is sound and the bug it fixes was real. Three gaps remain:

- **Hydration is one-way.** `useHomePage.ts:625` reads
  `if (share.sharedState.allowComments) share.setAllowComments(true);` — it never sets `false`. If a
  client-side navigation reuses the hook instance between a report with comments on and one with
  comments off, `allowCommentsRef.current` stays `true` and the next autosave **turns comments on
  for a report whose owner never enabled them**. Should be
  `share.setAllowComments(!!share.sharedState.allowComments)`.
- **The save path is a repurposed visibility call.** `page.tsx:1610` fires
  `handleSetPublic(isPublic)` — a deliberate no-op visibility change — purely to trigger a save.
  (Pre-existing, from `0825946`, but `44f780c` is what made it load-bearing.) On failure
  `handleSetPublic` reverts `isPublic` and shows *"Could not update visibility."* while
  `allowComments` is **not** reverted — the toggle reads ON, the server has OFF, and the error
  message names the wrong control.
- **No test.** `allowComments` persistence has no coverage anywhere; a regression here is invisible
  (the symptom is a 403 on someone else's comment attempt, days later).

### 6. Lazy chunk imports have no failure path and `parseTeam` has no race guard
**Commit:** `415a281` · **Files:** `src/hooks/useTeamReport.ts:110-114`, `src/app/page.tsx` (`hasMegaCapable` effect), `src/hooks/useHomePage.ts` (both auto-detect effects)

```ts
const parseTeam = useCallback((input: string) => {
  void import("@/lib/analysis/analyze-team").then(({ parseShowdownPaste }) => {
    setParsedTeam(parseShowdownPaste(input));
  });
}, []);
```

Two issues:
- **No `.catch()` on any of the four new dynamic imports.** A chunk that 404s (deploy rotation
  while a tab is open — the exact case `ChunkErrorReloader` exists for) or fails offline produces an
  unhandled rejection and a dead Analyze button: the user clicks, nothing happens, no error state,
  no toast.
- **`parseTeam` lost its synchronous ordering guarantee.** The `analysis` effect below it correctly
  uses a `cancelled` flag, but `parseTeam` has none. Two rapid calls (paste → analyze, or the
  `?draft=` hydration racing a user paste) can resolve out of order and leave the earlier paste
  as `parsedTeam`. The old `useMemo` could not do this.

**Suggested fix:** add `.catch()` → a user-visible error state on all four; add a monotonic
generation ref in `parseTeam` and drop stale resolutions. The generation ref is a quick win on its
own.

---

## P3 — Minor / hygiene

| # | Finding | Location | Note |
|---|---------|----------|------|
| 7 | Ref mutated during render — unsafe under React 19 concurrent rendering; a discarded render still writes it | `src/hooks/useNotifications.ts:22-23` (`a1255c1`) | Move into a `useEffect`, or derive the delta inside the `setNotifications` updater |
| 8 | `makeSetter` is re-invoked on every render (12 throwaway closures) and the whole block is wrapped in a blanket `/* eslint-disable react-hooks/exhaustive-deps */` | `src/hooks/useExploreUrlSync.ts:136-151` (`a1255c1`) | Behaviour is correct; hoist `makeSetter` to module scope and the disable can go. **Quick win** |
| 9 | `comment_flags` is deleted **after** the comment it references — the opposite of the ordering the same commit documents in the cleanup cron ("purge them before the comments they point at are gone") | `src/app/api/comments/[shareId]/[commentId]/route.ts:79` (`fd0aa6f`) | Harmless today (no FK), but inconsistent; would break if a FK is ever added. **Quick win** |
| 10 | `LIMIT 100` added with no cursor/pagination — creators with >100 reports and users with >100 saves silently lose the tail with no UI signal | `src/app/api/creator/[name]/route.ts:60`, `src/app/api/user/saved/route.ts:37` (`fd0aa6f`) | Right call for the payload bound, but needs a follow-up ticket for real pagination |
| 11 | Stale doc comment: file header still says SP pastes are *"validated against 512/252"* after the same commit corrected the budget to 510 | `src/lib/validation/champions-legality.ts:15` (`1b14f3b`) | **Quick win** |
| 12 | Replay-window check fails open: `if (typeof body.webhookTimestamp === "number")` — a payload where the field is absent or a string skips validation entirely | `src/app/api/webhooks/linear/route.ts:63` (`a099f97`) | Low risk (body is signature-verified first), but should reject rather than skip |
| 13 | `purgeSatellites` is now 9 sequential non-transactional `DELETE`s — a mid-sequence failure leaves a half-purged share | `src/app/api/cleanup/route.ts:29-48` (`fd0aa6f`) | Pre-existing pattern the commit extended; wrap in a transaction |
| 14 | `[justify-content:safe_center]` arbitrary property — `safe` alignment is Safari 17+ / relatively recent; older mobile Safari falls back to `normal`, not `center` | `src/components/report/SlideNavControls.tsx:493` (`0024679`) | Verify on the oldest supported iOS, or pair with a `justify-center` fallback |
| 15 | `readRestorableDraft` evicts **all four** keys including the published snapshot when only the TTL expired — a future publish comparison is lost for that device | `src/hooks/useTeamReport.ts:67` (`70c4633`) | Consider keeping `STORAGE_PUBLISHED_KEY` on TTL eviction |

### `ponytail:` markers — deliberate self-flagged debt (3, all current)

These are the codebase's known-gap convention and are surfaced here as requested. All three are
honest and correctly scoped; none needs action tonight.

1. `src/hooks/useTeamReport.ts:25` (`70c4633`) — *30-day draft TTL; a publish from another
   device can't flip this device's marker, so age is the only bound.* The real fix is a server-side
   published-content check. This is the highest-value of the three to promote to a ticket.
2. `src/app/api/webhooks/linear/route.ts:66` (`a099f97`) — *no delivery-id dedupe; within the
   60s window a replay is possible.* Correctly gated on "if this webhook ever mutates state".
3. `src/lib/data/type-chart.ts:189` (pre-dates this range) — *Dry Skin's extra Fire weakness isn't
   modeled; immunities only.* A real (small) damage-math gap.

---

## Verified correct — no action

Recording these so a later pass does not re-litigate them. Each was checked against real VGC rules:

- **`1b14f3b` type chart** — Bug→Poison `0.5` is correct (Bug is resisted by Fighting, Flying,
  Poison, Ghost, Steel, Fire, Fairy). Chart is attacker-keyed; the surrounding entries confirm it.
  Regression test names the Amoonguss symptom.
- **`1b14f3b` EV budget 510** — correct; 510 is the real cap (127 × 4 + 2), and it now agrees with
  the parser's warning threshold.
- **`1b14f3b` Species Clause via dex `baseSpecies`** — correct. Species Clause is by National Dex
  number, so Rotom-Wash/Rotom-Heat (#479), Ninetales/Ninetales-Alola (#38) and Urshifu forms (#892)
  are all genuine duplicates. The old "regional forms are distinct species" comment was wrong.
- **`1b14f3b` parser header strip** — moving the `===` filter before the block split is the right
  place for it; the replaced-with-empty-string approach leaves the following Pokémon intact through
  `split(/\n\s*\n/)`.
- **`82f9210` restricted legendaries** — Xerneas/Yveltal/Zygarde are all on the Reg G restricted
  list; their absence really would have mis-tagged Reg G teams as Reg H.
- **`82f9210` FTS tokenizer** — `split(/[^\w]+/)` correctly yields `chien:* & pao:*` for
  "Chien-Pao"; the old `replace(/[^\w]/g,"")` produced the zero-matching `chienpao:*`.
- **`champions-legality` SP/EV branch** (`:263`) matches `convertToChampionsSp`'s fast path exactly
  — these two are consistent with each other. Only `detect-archetype` (finding 3) diverges.
- **`d44b93a` JsonLd** — escaping every `<` to `<` is strictly stronger than the old
  `</script>`-only replace and stays valid JSON-LD. Correct.
- **`9897389` keepalive** — correct diagnosis; the 64 KiB keepalive body cap is real, and confining
  it to the `pagehide` flush is the right trade. The test was properly flipped from pinning the bug.
- **`fd0aa6f` creator ILIKE** — `/creator/%25` dumping the whole table was a genuine data-exposure
  bug; `LOWER(...) = lower(param)` is the right fix.
- **`fd0aa6f` `cacheSetIfAbsent` fail-closed** — deliberate and well-documented; the unconfigured-Redis
  path still returns `true`, so local dev is unaffected.
- **`b865fa2`, `1db8419`, `415a281`** — all three add genuine tripwire/drift tests
  (`no-raw-forwarded-for`, `sp-docs-drift` pinned to `CHAMPIONS_TOTAL_SP`/`CHAMPIONS_MAX_SP_PER_STAT`,
  `homepage-eager-imports`). This is good practice and the SP-docs one directly guards the domain
  constants.

## CLAUDE.md test-requirement compliance

Checked every commit touching `src/lib/`:

| Commit | New `src/lib/` logic | Test beside it? |
|--------|---------------------|-----------------|
| `0f73ba3` | `isDifferentTeam` | ✅ `utils/__tests__/extract-species.test.ts` |
| `1b14f3b` | type-chart, parser, legality | ✅ all three |
| `1b14f3b` | **`detect-archetype` SP scaling** | ❌ **missing** (finding 3) |
| `82f9210` | regulation signals, extract-species, legality | ✅ all three |
| `82f9210` | `item-boosts` case-insensitivity, `pokepaste` www | ❌ no test for either (trivial, low risk) |
| `a099f97` | cors | ✅ `security/__tests__/cors.test.ts` |
| `9897389` | `useAutoDraft` keepalive | ✅ existing test corrected |
| `70c4633` | `readRestorableDraft` | ✅ 6 named regression cases |
| `415a281` | `analyze-team` | ✅ tripwire test |
| `fd0aa6f` | `cache.ts` fail-closed | ❌ no test |

One clear miss (`detect-archetype`), two trivial ones.

---

## Quick wins for tonight

Small, self-contained, low-risk — safe for a later agent to implement:

1. **Finding 1** — three missing spaces in `SpeedTierChart.tsx:132,482,500`. Highest value/effort
   ratio in this report.
2. **Finding 11** — correct `512/252` → `510/252` in the `champions-legality.ts:15` header comment.
3. **Finding 8** — hoist `makeSetter` out of the component body in `useExploreUrlSync.ts` and drop
   the `eslint-disable` pair.
4. **Finding 9** — move the `comment_flags` delete above the comment delete in
   `comments/[shareId]/[commentId]/route.ts`.
5. **Finding 6 (partial)** — add a generation ref to `parseTeam` in `useTeamReport.ts`.
6. **Finding 5 (partial)** — `useHomePage.ts:625` → `share.setAllowComments(!!share.sharedState.allowComments)`.

Findings 2, 3, and 4 need real design thought and should become tickets, not tonight's patches.

---

## Test run

```
node node_modules/vitest/vitest.mjs run
```

```
 Test Files  41 passed (41)
      Tests  417 passed (417)
   Duration  8.50s
```

**417/417 passing, 41/41 files, exit code 0. No failures, no skips.** The suite is green on
`origin/main` as of this review — note that none of the findings above are caught by it, which is
itself the point of findings 3 and 5.
