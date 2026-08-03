# C5 — Commit Review, last 25 commits on `main` (2026-08-03)

Range reviewed: `0635b74` … `d962cc6` (HEAD of `main`; `origin/main` is one ahead with
`a70d924`, a container-config commit only).

Read-only review. No files were edited.

---

## Regression candidates for VGC-251 / VGC-245

### ★ VGC-251 — ROOT CAUSE CONFIRMED, still live on `main`

**Commit:** `b5712a6` "fix: stop fabricating 32 HP / 32 Atk SP for uninvested spreads"
**File:** `/home/user/VGC-Team-Report/src/lib/analysis/stat-calculator.ts:118-136`

`b5712a6` was billed as the fix for this bug but only fixed the **all-zero** case. The
greedy "distribute remaining SP" top-up in Step 3 still exists; it was merely narrowed
from "all stats" to "stats with non-zero EVs". Any spread with a low-EV filler stat still
gets that filler inflated to fill the whole 66 SP budget.

Reproduced against the exact code on `main`
(`/tmp/claude-0/-home-user-VGC-Team-Report/4ac07288-3f7c-5c21-9125-e568b1765335/scratchpad/sp.mjs`):

| Pasted EVs | Current SP output on `main` | Correct |
|---|---|---|
| `252 HP / 252 Atk / 4 Def` | **32 HP / 32 Atk / 2 Def** | 32 / 32 / 1 |
| `252 HP / 4 Def` | **32 HP / 32 Def** | 32 / 1 |
| `252 Atk / 4 SpD / 252 Spe` | 32 Atk / **2 SpD** / 32 Spe | 32 / 1 / 32 |
| `156 HP / 100 Atk / 252 Spe` | **21 HP** / 13 Atk / 32 Spe | 20 / 13 / 32 |
| all zero | 0 / 0 / 0 / 0 / 0 / 0 | ✅ (this is all `b5712a6` fixed) |

Row 1 is the literal user report ("everyone getting 32 HP / 32 Atk"). `252 HP / 252 Atk / 4 Def`
is the single most common VGC bulky-attacker spread, so essentially every Champions report
built from a classic EV paste shows it.

Two further symptoms of the same top-up:
- The same 4 EVs mean different things depending on the rest of the spread — 31 SP absorbed
  when one other stat is maxed, 2 SP when two are. Conversion is not a function of the stat.
- `hp: 156` → 21 SP, not `ceil(156/8) = 20`, because the leftover 1 SP lands on the
  highest-EV stat with headroom.

**Why the regression tests didn't catch it:** the tests `b5712a6` added
(`/home/user/VGC-Team-Report/src/lib/analysis/__tests__/stat-calculator.test.ts:138-155`)
assert with `toBeGreaterThanOrEqual(1)` / `toBeLessThanOrEqual(CHAMPIONS_TOTAL_SP)` bounds
that pass against the buggy output. There is no exact-value assertion anywhere in the
`convertToChampionsSp` suite except for the zero and single-stat cases.

**A complete fix already exists but is NOT on `main`.** Commit `dea5803`
("fix: make Champions SP conversion reflect actual EV investment") on
`origin/claude/gallant-bohr-nycyuh` deletes the Step-3 top-up entirely, extracts the
SP-detection heuristic into `looksLikeChampionsSp`, and converts the loose assertions to
exact-value ones. Verified with `git merge-base --is-ancestor dea5803 main` → **not an
ancestor**.

**Suggested action (highest priority in this report):** cherry-pick `dea5803` onto `main`,
or re-apply it — delete Step 3 of `convertToChampionsSp` so leftover budget stays unspent.
Close VGC-251 only after the exact-value tests are in. Note this is a *display* change on
every existing Champions report, so it needs a changelog entry (see finding 4).

**Related, lower severity (same file, `stat-calculator.ts:99-103`):** the SP-detection fast
path treats any spread whose total is ≤ 66 with no stat > 32 as already-SP. A genuine EV
spread like `EVs: 20 HP / 12 Def / 20 SpD` (total 52) is therefore read as SP. Unavoidable
without a format hint from the paste, but worth a comment/ticket; `dea5803` also widens it
to accept all-zero spreads, which is correct for an SP-native format.

---

### ★ VGC-245 — ROOT CAUSE CONFIRMED, still live on `main`

**Commit:** `fbfc877` "Address user feedback: Common Combinations, clearer speed tiers, stat legend"
**File:** `/home/user/VGC-Team-Report/src/app/api/share/route.ts:25-33`

`fbfc877` added the structured `commonModes.combinations` field (the Leads | Back | Strategy
table that *replaced* the free-text Leads/Modes inputs) and wired it through
`src/lib/sharing/url-codec.ts:48-69`, `useTeamMeta`, `diff-state`, and all 7 locales —
but **not** through the share API's own zod schema.

The share route defines its own duplicate schema. Its `commonModes` object lists only the
five legacy free-text keys:

```ts
commonModes: z.object({
  leads, modes, strengths, weaknesses, gameplan   // no `combinations`
}).optional(),
```

zod objects strip unknown keys by default (and the parent `state` is explicitly `.strip()`),
so `combinations` is deleted from the payload at `route.ts:89`. The handler then persists
`parsed.data.state` — the stripped object. The client
(`/home/user/VGC-Team-Report/src/hooks/useShareUrl.ts:355-359`) sets
`autoSaveStatus = "saved"` on any `res.ok`, so the user sees "Saved" on a 200 that discarded
their edits. Exactly the reported symptom.

Secondary effect, same cause: `detectChangedSections(oldState, state)` at `route.ts:169`
compares the *stripped* state. If the user edited only the combinations table,
`sections.length === 0`, so `hasDataChanges` is false — no version snapshot, no edit
changelog entry, no version bump. The edit vanishes with zero trace.

**This is a re-run of a bug that was already fixed once.** Commit `6a20445` ("Fix Modes
section silently not saving on shared/draft reports") added `commonModes` to this schema,
and the comment at `route.ts:21-24` explicitly warns that omitting a key here silently drops
the whole Modes section. `fbfc877` then added a nested key and re-opened it one level down.

**Note the asymmetry:** the draft route (`src/app/api/user/drafts/route.ts:12`) uses the
shared `ShareableStateSchema` from `url-codec.ts`, which *does* have `combinations`. So
combinations persist in drafts and are lost on shared reports — which will read to a user as
intermittent/unreproducible.

**Suggested action:**
1. Immediate fix: add `combinations: z.array(z.object({ id: z.string(), leads: z.array(z.number().int()), back: z.array(z.number().int()), strategy: z.string() })).optional()` to `ShareBodySchema.state.commonModes`.
2. Structural fix (the real one): delete the duplicate schema in `share/route.ts` and validate
   against `ShareableStateSchema` from `url-codec.ts`, as `drafts/route.ts` already does. Two
   hand-maintained schemas for one payload shape have now silently dropped user data twice.
3. Add a test asserting a round-trip through the share route preserves `commonModes.combinations`
   — `src/app/api/share/__tests__/route.test.ts` exists and is the natural home.
4. Consider making `autoSave` compare the server echo to the sent state before showing "Saved",
   so a future strip is loud rather than silent.

---

## Other findings

### 1. UI regression shipped in `7fe21cd` — 44×44 hit target overlays the stat rows
**Commit:** `7fe21cd` · **File:** `/home/user/VGC-Team-Report/src/components/report/StatColorNote.tsx:53`

The dismiss button uses `min-w-[44px] min-h-[44px] -my-4 -ml-2` inside a ~16px line box. The
negative margins let the 44px border box overflow above and below the caption, so it sits
invisibly on top of the adjacent stat rows and swallows taps aimed at them. Affects every
`PokemonCard` and the detail slide.

A fix exists on `origin/claude/gallant-bohr-nycyuh` (`4be024e`) — `min-h-11` on the row plus
`min-w-11 min-h-11 shrink-0` on the button — and is not on `main`.
**Action:** cherry-pick `4be024e`, or size the caption row to contain the target instead of
letting the button overflow.

### 2. Unmerged P1-class fixes stranded on `origin/claude/gallant-bohr-nycyuh`
None of these are ancestors of `main`. Worth a deliberate decision to merge or drop:

| sha | What it fixes |
|---|---|
| `dea5803` | VGC-251 (above) |
| `4be024e` | Stat caption dismiss button eating stat-row taps (above) |
| `c41d42c` | `MissingNo.` carries type `Bird`, absent from `TYPE_COLORS` → `colors.bg` throws → whole report white-screens |
| `0021e4e` | Parser: blank line inside a move block, and a `=== [gen9vgc2024] Name ===` header with no trailing blank line, both become phantom Pokemon and cost a roster slot |
| `847e160` | `/api/team-graphic` renders private reports |
| `e2ab391` | Game-plan delete unreachable by keyboard |

`c41d42c` and `0021e4e` are user-facing correctness bugs in `src/lib/` with tests attached;
they are as valuable as the two open P1s.

### 3. Sitemap `lastModified` regression — a prior fix was undone
**Commit:** `fe70914` (VGC-64) · **File:** `/home/user/VGC-Team-Report/src/app/sitemap.ts:8-27`

`fe70914` removed `lastModified: now` from all 11 static pages *and* from the Reg-M-A champion
pages. `83d195a` ("§7.6: add lastModified to champion sitemap pages") had added exactly that
line eight commits earlier, specifically to complete an SEO finding. The champion pages are
flagged SEO-critical in CLAUDE.md.

Adding `export const revalidate = 3600` (the actual intent of the commit) did not require
dropping `lastModified`; the two are unrelated. A `0306a0e` "restore lastModified on static
sitemap entries" exists on an old swarm branch and is also not on `main`.
**Action:** restore `lastModified` on the static + champion entries; keep `revalidate = 3600`.

### 4. Behaviour changes shipped without a `src/app/changelog/data.ts` entry
Only 2 of the 25 commits touched the changelog (`fbfc877` → v5.24, `d962cc6` → v5.25). The
following changed user-visible behaviour with no entry:

- `b5712a6` — changes the displayed SP numbers on **every** Champions report. Highest-impact omission.
- `cfcbd2f` (VGC-243) — Mega selection now syncs with speed tiers.
- `d706f71` (VGC-219) — report accessibility controls.
- `14273a1` — shared-report home navigation.
- `359cdef` — report editing now requires auth; behaviour change users will hit.
- `3c895f1` — mobile navigation + private sharing.
- `d3260c6` — latest-reports ordering + draft saving.
- `7349ac7` — multilingual move names, `/support` page.
- `0269462` — mobile UX and sharing journey (41 files).

**Action:** batch these into one catch-up changelog entry rather than nine; going forward,
the SP fix in particular needs its own line because report numbers will visibly change.

### 5. `src/lib/fetch-with-timeout.ts` shipped with no test
**Commit:** `0635b74` · **File:** `/home/user/VGC-Team-Report/src/lib/fetch-with-timeout.ts`

CLAUDE.md: "New logic in `src/lib/` gets a vitest test beside it (`__tests__/`)". Every other
new `src/lib/` module in this range complies (`chronological-cursor.ts`, `speed-tier-form.ts`,
`translate-move.ts` all landed with tests). This one is the only gap. Timeout/abort logic is
exactly the kind of thing that silently stops working.
**Action:** add `src/lib/__tests__/fetch-with-timeout.test.ts` covering the abort path and the
happy path.

### 6. CI lint permanently non-blocking, with a stray marker word
**Commit:** `53395ca` · **File:** `/home/user/VGC-Team-Report/.github/workflows/ci.yml:19-21`

```yaml
# ponytail: 35 pre-existing lint errors (react-hooks etc.) — non-blocking
# until that debt is cleared, then remove continue-on-error
- run: npm run lint
  continue-on-error: true
```

Two issues: (a) `# ponytail:` looks like a leftover placeholder/marker with no meaning to a
reader; (b) `continue-on-error: true` with no tracking issue is how debt becomes permanent —
the 35 errors are `react-hooks/set-state-in-effect` and unused vars, and
`react-hooks/set-state-in-effect` violations in `useHomePage`/`useShareUrl` sit right next to
the autosave code implicated in VGC-245.
**Action:** file a follow-up ticket to clear the 35 errors and remove `continue-on-error`;
strip the `ponytail:` prefix.

### 7. `eslint-disable react-hooks/exhaustive-deps` clustered around the save path
**Files:** `/home/user/VGC-Team-Report/src/hooks/useHomePage.ts:90`, `:219`;
`/home/user/VGC-Team-Report/src/hooks/useShareUrl.ts:228`; `/home/user/VGC-Team-Report/src/app/page.tsx:341`

Not a bug I can pin to either open ticket — `buildShareState` correctly lists `commonModes` in
its dep array (`useHomePage.ts:281`) and the client payload is complete. Flagging as latent
risk: suppressed dep arrays on the effects that assemble and fire autosave are where a stale
closure would produce the *other* plausible "saved but didn't persist" failure mode. If the
VGC-245 schema fix does not fully close the ticket, this is the next place to look.

### 8. Positive notes (no action)
- Error handling in this range is generally good: the swallowing `catch` blocks all carry a
  comment justifying the swallow (`useShareUrl.ts:199`, `useTeamMeta.ts:122`,
  `StatColorNote.tsx` localStorage guards), and the paths that matter surface the server's
  message rather than a generic failure (`useShareUrl.ts:268-280`, `:361-370`).
- `0635b74` explicitly replaced a fire-and-forget swallowed `.catch()` on version snapshots
  with a real transaction — the right direction.
- No `TODO` / `FIXME` / `HACK` / `@ts-ignore` was introduced anywhere in the 25 commits.
- The snapshot-coalescing window in `share/route.ts:181-200` correctly "fails open" with a
  logged error, and is the documented fix for the 447MB `share_versions` incident.

---

## Suggested ticket list

| Priority | Ticket | Summary |
|---|---|---|
| P1 | VGC-251 | Remove the Step-3 SP top-up in `convertToChampionsSp` (cherry-pick `dea5803`); add exact-value tests |
| P1 | VGC-245 | Add `combinations` to `ShareBodySchema`, then collapse the duplicate schema onto `ShareableStateSchema`; add a round-trip test |
| P2 | new | Cherry-pick `4be024e` — stat-caption dismiss button swallowing stat-row taps |
| P2 | new | Triage `origin/claude/gallant-bohr-nycyuh`: `c41d42c` (white-screen), `0021e4e` (phantom Pokemon), `847e160` (private report leak) |
| P3 | new | Restore `lastModified` in `src/app/sitemap.ts` (SEO regression from `fe70914`) |
| P3 | new | Catch-up changelog entry for the nine unlogged behaviour changes |
| P3 | new | Test for `src/lib/fetch-with-timeout.ts` |
| P3 | new | Clear the 35 eslint errors; remove `continue-on-error` and the `ponytail:` marker from `ci.yml` |
