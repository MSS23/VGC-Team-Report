# Commit review — last 20 on origin/main (2026-09-28)

Range reviewed: `0f73ba3` … `70c4633` (2026-08-11 → 2026-08-24).
Conflict marks are against `.swarm/open-pr-conflict-risk.md`.

`src/lib/analysis/stat-calculator.ts` was **not touched** in this range
(`evToChampionsSp` / `championsSpToEv` / `trimToChampionsBudget` unchanged since
`b5712a6`). The only SP work here is docs (`1db8419`) and it is correct:
`66 SP total` / `32 SP per stat` match `CHAMPIONS_TOTAL_SP` /
`CHAMPIONS_MAX_SP_PER_STAT`, and `sp-docs-drift.test.ts` pins both. No SP/EV
conversion defect found.

---

## 1. Broken Tailwind class — the 44px touch-target fix never landed, and the pill font-size was destroyed

- **Commit:** `0024679` ("fix: mobile touch and layout fixes across report UI")
- **File:** `src/components/report/SpeedTierChart.tsx:132`, `:482`, `:500`
- **CONFLICT-RISK: yes** (SpeedTierChart.tsx is touched by 5 open PRs — but the fix is a one-character insert per line)

A missing space concatenated two utilities into one nonexistent class:

```
py-1 sm:py-1.5 min-h-11text-[10px] sm:text-xs     (line 132)
px-3 py-1.5 min-h-11text-xs                        (lines 482, 500)
```

`min-h-11text-xs` is not a Tailwind class, so **neither** `min-h-11` nor
`text-xs` / `text-[10px]` is emitted.

**Failure scenario:** open any report's Speed Tier slide on a 390px-wide phone
(below the `sm` breakpoint, so `sm:text-xs` does not apply). The "Mega Forms"
and "Meta Threats" buttons and every speed-modifier pill render at the
inherited body font size (~16px) instead of 12px/10px — the pill row overflows
its container — and they are still ~28px tall, i.e. the commit's stated 44px
minimum (and the CLAUDE.md UI standard) is **not** met on the exact controls it
claims to have fixed.

**Fix:** `min-h-11 text-[10px]` / `min-h-11 text-xs` (three sites).

**Process note:** tsc + vitest + `next build` all pass on this — a malformed
className is invisible to the pre-commit gate. This is the class of defect
`ui-checklist-reviewer` exists to catch; it evidently did not run, or did not
diff the literal class strings.

---

## 2. `=== header ===` fix is half-done: a header with no blank line after it now *drops* the first Pokémon

- **Commits:** `82f9210` (extract-species + SQL replica), against `1b14f3b` (which fixed exactly this case in `showdown-parser.ts`)
- **Files:**
  - `src/lib/utils/extract-species.ts:9` — **CONFLICT-RISK: yes** (1 open PR)
  - `src/app/api/champions/meta/route.ts:82` (`WHERE … first_line !~ '^==='`) — **CONFLICT-RISK: no**
  - `src/app/s/[id]/opengraph-image.tsx:44` — **CONFLICT-RISK: yes** (2 open PRs) — a 4th private copy that got **no** header handling at all

`1b14f3b` fixed the parser by stripping header *lines* before splitting into
blocks, precisely because "a `=== header ===` not followed by a blank line was
parsed as the first Pokemon's species, silently eating the real first mon."
`82f9210` fixed the same bug in `extract-species.ts` the *other* way — a
per-block `firstLine.startsWith("===") → continue` — which is the filter shape
`1b14f3b` had just rejected.

**Failure scenario** (Showdown's "Backup all teams" export, which does not put a
blank line after the header):

```
=== [gen9vgc2026regmа] My Team ===
Garchomp @ Life Orb
Ability: Rough Skin
- Earthquake

Flutter Mane @ Booster Energy
...
```

Block 1 is `"=== … ===\nGarchomp @ Life Orb\nAbility: …"`, whose first line
starts with `===`, so the whole block is skipped and **Garchomp is dropped**.
`extractSpecies` returns 5 species where the parser returns 6. Because
`extractSpecies` feeds the species array on explore cards, share pages, embeds,
OG images, drafts, collections, analytics and the champions SSG pages, the
report is unfindable by its own lead Pokémon in Explore's species filter, and
its sprite row is missing a mon — while the report itself renders all 6.
The `champions/meta` SQL replica has the identical gap, so the Champions usage
table undercounts the first Pokémon of every such team.
The `opengraph-image.tsx` copy is worse: it still yields
`"=== [gen9vgc2026regmа] My Team"` as species #1 and truncates mon 6 at
`.slice(0, 6)`.

**Missing test (CLAUDE.md requires one naming the bug):** the commit's new test
only covers `header + "\n\n" + blocks`, i.e. the easy case. Add the no-blank-line
case.

**Fix:** mirror the parser — `paste.replace(/^===.*===[ \t]*$/gm, "")` before
splitting; drop the per-block `continue`; delete the `opengraph-image.tsx` copy
in favour of the shared util; change the SQL to strip `^===` lines from the
paste (`regexp_replace(..., '^===.*===[ \t]*$', '', 'gn')`) rather than
filtering blocks.

---

## 3. Explore cursor pagination still silently skips rows — WHERE truncates to ms, ORDER BY does not

- **Commit:** `82f9210` ("explore cursor pagination compared microsecond timestamps against ms-truncated cursors, skipping same-ms rows at page boundaries")
- **File:** `src/app/api/explore/route.ts:193`, `:207`, `:222-226`
- **CONFLICT-RISK: yes** (explore/route.ts: 1 open PR; `src/lib/explore/chronological-cursor.ts`: 1)

The cursor is built from `Date.toISOString()` (ms precision — see
`serializeChronologicalCursor` and `route.ts:334`), and the commit wrapped the
**filter** in `date_trunc('milliseconds', …)`. But `ORDER BY` is still
`${col} DESC, s.id DESC` on the **raw** (microsecond) column. Filter and sort
now disagree, so the boundary is still not a clean cut.

**Failure scenario** (`sort=new`, `limit=12`, two shares created in the same
millisecond, e.g. a bulk import or a fork storm):

- A: `created_at = 12:00:00.123900`, `id = 'aaa'`
- B: `created_at = 12:00:00.123100`, `id = 'zzz'`

`ORDER BY created_at DESC` puts A before B. A is row 12, so
`nextCursor = "…T12:00:00.123Z~aaa"`. Page 2 evaluates
`(date_trunc('ms', created_at), id) < ('…123Z', 'aaa')`; for B that is
`('…123', 'zzz') < ('…123', 'aaa')` → **false**. B is excluded from page 2 and
appeared on no earlier page — it is unreachable through pagination entirely.
(The change does recover the symmetric case `id < 'aaa'`, which is why it looked
like a fix.)

The `popular` and `views` branches are worse: their tuple has **no id
tiebreak**, so *any* two rows sharing a `like_count`/`view_count` and a
millisecond drop everything at and after the boundary row within that ms.

**Fix:** make the sort match the filter —
`ORDER BY date_trunc('milliseconds', ${col}) DESC, s.id DESC` — and add
`s.id` to the popular/views tuples (or emit microsecond-precision cursors
instead of `toISOString()`).

---

## 4. The 30-day draft TTL renews itself on every visit, so the bound it exists to provide never fires

- **Commit:** `70c4633` ("published teams can no longer resurface as a device-only draft")
- **Files:** `src/hooks/useTeamReport.ts:96` (persist effect) vs `:56-74` (`readRestorableDraft`); `src/hooks/useHomePage.ts:404`
- **CONFLICT-RISK: yes** (useTeamReport.ts: 1 open PR; useHomePage.ts: 3)

The commit's own comment states the TTL is the *only* bound on a team published
from another device: "a publish from another device/browser can't flip this
device's marker, so age is the only bound on how long such a team keeps
resurfacing as a 'draft'." But restoring a draft re-arms the clock:
`readRestorableDraft()` → `setPaste` + `parseTeam` → `parsedTeam` set → the
persist effect writes `STORAGE_SAVED_AT_KEY = Date.now()` again.

**Failure scenario:** publish a team from desktop (the phone's
`vgc-team-paste-published-v2` is never written, and its source marker stays
`user`). Open the homepage on the phone once a week. Every visit restores the
paste, shows "Welcome back — we restored your team / this draft only lives on
this device" for an already-published report, and bumps `saved-at` to now —
so `now - savedAt < DRAFT_TTL_MS` is true forever and the entry is never
evicted. The 30-day TTL only fires for someone who does not open the site for
30 consecutive days.

Related, same commit: `reset()` now calls `evictStoredDraft()`, which also
deletes `vgc-team-paste-published-v2`. Re-pasting an already-published team
after a reset therefore has no snapshot to compare against and is restorable
again — reopening the same mislabel the commit set out to close.

**Fix:** only write `saved-at` when the paste content actually changes (compare
against the stored value before writing), or stamp it once per draft
generation; and preserve `STORAGE_PUBLISHED_KEY` across `reset()`.

---

## 5. Lower-severity / notes

- **`fd0aa6f` — comments GET returns `200 {comments: []}` for a non-public report**
  (`src/app/api/comments/[shareId]/route.ts:41-50`). **CONFLICT-RISK: no.**
  An owner who flips their own report private sees an empty thread with no
  indication the comments still exist server-side. `403` (or an owner bypass,
  as the delete route already has via `canModerate`) would not swallow it.
  Unlisted reports are unaffected (`is_public` stays TRUE).
- **`0242253` — Discord failures are logged but still reported as success**
  (`src/lib/discord-webhook.ts:30-34`). **CONFLICT-RISK: no.**
  `postToBuildsChannel` returns `Promise<void>` and does not throw on `!ok`, so
  `daily-ops` / `weekly-report` still return 200 and the crons still "look
  healthy" — the stated goal is only half met. Return a boolean (or throw) and
  let the cron route surface it.
- **`fd0aa6f` — `comment_flags` purge ordering is inconsistent** between
  `cleanup/route.ts` (before the comments delete, as its comment insists) and
  `comments/[shareId]/[commentId]/route.ts:78` (after). Harmless today —
  `src/lib/db.ts:63` declares `comment_flags` with no FK to `comments` — but if
  that FK is ever added, the single-comment DELETE breaks.
- **`1b14f3b` — `detect-archetype.ts` SP-scale detection is heuristic, not a
  format check** (`isSpScale = every mon's EV total <= 66`).
  **CONFLICT-RISK: yes** (1 open PR). An all-zero team (CLAUDE.md: "No EVs line
  ⇒ all-zero spread") takes the SP branch; the commit says this is harmless and
  it is, since no threshold fires on zeros. But a *classic* VGC team where every
  mon happens to be lightly invested (e.g. six `EVs: 4 Spe` scouting sets) also
  takes the SP branch and gets thresholds scaled to 25/12, so it can be tagged
  Hyper Offense off 4-EV spreads. Narrow, but a regulation check
  (`isChampionsFormat(tags.regulation)`) would be exact and is already available.
- **Speculative (no failure scenario constructed):** `82f9210` routed
  `getRestrictedBase` through `getRegulationLookupKey`, which strips many more
  suffixes (`-hero`, `-therian`, `-galar`, `-alola`, `-hisui`, `-paldea`,
  `-rapid-strike`, `-10|50|complete`, `-terastal`, `-stellar`). I checked every
  entry of `RESTRICTED_BASE_NAMES` (`champions-legality.ts:49`) and found no
  legal species that now collapses onto a restricted base, and `-mega`/`-primal`
  are still stripped, so the sharing is safe as far as I can tell. The
  behavioural change worth a second opinion is that `!inDex && isRestricted`
  now *suppresses* the "not available in Champions format" error for form
  variants like `Zygarde-10%` that previously errored — correct only if those
  forms really are Reg M-A legal. I could not determine that from the repo.
