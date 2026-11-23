# Merge-order plan: draining PRs #91, #92, #93 into `main` (23-11-26)

**Produced read-only.** Every conflict claim below comes from a `git merge-tree --write-tree`
run recorded in this document. No refs, no worktree and no Linear issue were modified. The
only objects written were throwaway trees/commits from `merge-tree --write-tree` and
`commit-tree`, used to simulate step 3 honestly; they are unreferenced and will be garbage
collected.

## TL;DR

| | |
|---|---|
| **Merge order** | #91 (`02`) → #92 (`09`) → #93 (`16`) — i.e. date order |
| **Genuinely conflicting code files, whole operation** | **2 distinct files, 3 resolutions** — `src/app/changelog/data.ts` twice, `src/app/sitemap.ts` once |
| **Worst conflict** | `src/app/changelog/data.ts` — it *looks* like "keep both sides" but deleting the markers produces **duplicate object keys** and will not compile. See §3.1 |
| **Any PR closeable instead of merged?** | **No.** All three carry work that exists on no other branch. One *commit* is redundant (§6) |
| **Mechanical time** | ~30–40 min including the gate runs. Two review items cannot be done in that hour — §7 |

Preconditions verified at the time of writing:

```
local main      = 10dfd74  (== origin/main, 3 weeks old, zero commits in 7 days)
merge-base(main, each of the three branches) = 10dfd74 = main's tip
```

So **main is an ancestor of all three branches** and nothing has moved underneath them.
Confirmed with `git merge-base --is-ancestor origin/main origin/swarm-nightly-2026-11-02`
(exit 0) and the same for the other two.

> **Housekeeping before you start.** You are currently on `swarm-nightly-2026-11-23` with 5
> modified and 2 untracked files under `.swarm/`. Commit or set those aside before switching
> to `main`, or the merges will trip over them.

---

## 1. Recommended merge order, and why

```
git switch main
git merge --ff-only origin/swarm-nightly-2026-11-02   # PR #91 — zero conflicts
git merge            origin/swarm-nightly-2026-11-09   # PR #92 — 1 code conflict
git merge            origin/swarm-nightly-2026-11-16   # PR #93 — 2 code conflicts
```

### Why #91 first

**Because the first merge is free, and #91 is by far the biggest payload.** Since main is the
merge-base of all three, whichever branch goes first is a **fast-forward**: 0 conflicts, 0
resolutions, 0 judgement calls. #91 is 21 commits / 110 non-`.swarm` files; #92 is 5 / 21 and
#93 is 13 / 38. Putting the 110-file branch in the free slot means 110 files land without a
human reading a single conflict hunk.

Three supporting reasons:

- **#91 exclusively owns the shared config files.** `package.json`, `package-lock.json` and
  `src/app/globals.css` are modified **only** by #91 (verified per file with
  `git diff --name-status` against each branch). Landing it first puts the final dependency
  tree and the final CSS token set in place before anything else is merged, so the
  `tsc`/`vitest`/`build` gate runs against a stable baseline from step 1 onward. **There is no
  lockfile conflict anywhere in this operation** — that is the single biggest piece of good
  news in this plan.
- **#92's dead-code deletions become no-ops.** Four of the 16 files in #92's
  `298a842 chore: delete 17 confirmed-dead exports` are **byte-identical** to #91's versions
  (§6). With #91 already in, git resolves those as duplicate deletes silently.
- **It is the branch that most needs eyes.** Merging it first means it sits on local `main`
  while you review it, and nothing ships until you `push` + `promote` (§7).

### Why #92 second — and yes, date order really is best

The totals are a tie on raw conflict count. Both candidate orders cost 3 resolutions:

| Order | Step 2 conflicts | Step 3 conflicts | Total |
|---|---|---|---|
| #91 → **#92** → #93 | `changelog/data.ts` | `changelog/data.ts`, `sitemap.ts` | 3 |
| #91 → **#93** → #92 | `changelog/data.ts`, `sitemap.ts` | `changelog/data.ts` | 3 |

The tie-break is **the changelog**. The three branches add changelog entries `5.30` (#91),
`5.31` (#92) and `5.32` (#93), and `ENTRIES` is ordered newest-first. Merging in date order
makes **every** resolution a pure *prepend* of the incoming entry to the top of the array, and
the array stays in descending version order automatically. Merge #93 before #92 and the second
resolution becomes an *insert of 5.31 between 5.32 and 5.30* — same work, more ways to get it
wrong, and a silently mis-ordered changelog page if you do.

There is no commit-level or code-level dependency between the three branches in either
direction (all three were cut from `10dfd74`; none contains another's commits), so order is a
free choice made purely on conflict ergonomics.

### What is *not* a reason

"#92 is almost all documentation, merge it first in five minutes" — that is #93's own board
reconciliation talking (`.swarm/board-reconciliation-16-11-26.md`), and it is good advice if
you are only merging #92. It is wrong advice here: putting the 21-file branch in the
conflict-free slot wastes it, and it costs you the clean changelog ordering above.

---

## 2. Pairwise conflict map

Method: `git merge-tree --write-tree --name-only <a> <b>` (git 2.43.0 — `--write-tree` is
supported, no fallback needed). This reports true content conflicts rather than
"both branches touched this file". Overlapping-file sets came from
`comm -12` on each branch's `git diff --name-only origin/main <branch>` output, with `.swarm/`
filtered out.

### 2.1 #91 × #92 — 14 shared files, **1 real conflict**

```
git merge-tree --write-tree --name-only \
  origin/swarm-nightly-2026-11-02 origin/swarm-nightly-2026-11-09
```

| Shared file | Collides? | What is actually going on |
|---|---|---|
| `src/app/changelog/data.ts` | **YES** | Both prepend a new entry object at the head of `ENTRIES`. See §3.1 |
| `src/lib/analysis/damage-calculator.ts` | no | **Byte-identical change.** Both delete `getCalcSpecies` (same 4 lines). Duplicate delete |
| `src/lib/data/dex-subset.ts` | no | **Byte-identical.** Both delete `asPokemonTypes` + its `PokemonType` type-import |
| `src/lib/data/tags.ts` | no | **Byte-identical.** Both delete `type EventType` |
| `src/lib/discord-bot.ts` | no | **Byte-identical.** Both delete `PRIORITY_LABELS` |
| `src/components/explore/ExploreFilters.tsx` | no | Both delete the same three `*_I18N` maps; #91 additionally does accent-token swaps at far-removed lines |
| `src/components/home/HomePageClient.tsx` | no | #92 drops 3 unused bindings (`Link`, `summarizeChangedFields`, `megaStates`); #91's 22 lines are elsewhere. Verified #91 adds **no** use of any dropped binding |
| `src/components/report/SpeedTierChart.tsx` | no | #92 removes an unused `i` map param at L580; #91's hunks are at L12/218/266/635. See §2.4 |
| `src/components/layout/Navbar.tsx` | no | #92 drops a dead `exportMenuOpen` useState; #91 does `text-white` → `text-accent-foreground` swaps |
| `src/components/explore/SpotlightCard.tsx` | no | #92 drops an unused `useTranslation`; #91 swaps accent tokens |
| `src/components/explore/ExploreContent.tsx` | no | One-line unused-import delete (#92) vs accent swaps (#91) |
| `src/app/api/user/profile/route.ts` | no | One-line unused-import delete (#92) vs #91's `user_id` ownership work |
| `src/app/dashboard/DashboardContent.tsx` | no | One-line unused-import delete vs accent swaps |
| `src/app/dashboard/profile/page.tsx` | no | One-line unused-import delete vs accent swaps |

Plus 3 `.swarm/*.md` bookkeeping conflicts (`main-changed-files.md`, `posthog-insights.md`,
`run-meta.md`) — see §3.3.

### 2.2 #91 × #93 — 3 shared files, **2 real conflicts**

```
git merge-tree --write-tree --name-only \
  origin/swarm-nightly-2026-11-02 origin/swarm-nightly-2026-11-16
```

| Shared file | Collides? | Detail |
|---|---|---|
| `src/app/changelog/data.ts` | **YES** | Same head-of-array collision. §3.1 |
| `src/app/sitemap.ts` | **YES** | Both insert a block at the same point, right after `...blogSitemapEntries()`. §3.2 |
| `src/components/report/SpeedTierChart.tsx` | no | #91 at L12/218/266/635 (Mega ability), #93 at L382/402 (Trick Room baseline). Auto-merges |

Plus 2 `.swarm/*.md` conflicts.

### 2.3 #92 × #93 — 2 shared files, **1 real conflict**

```
git merge-tree --write-tree --name-only \
  origin/swarm-nightly-2026-11-09 origin/swarm-nightly-2026-11-16
```

| Shared file | Collides? | Detail |
|---|---|---|
| `src/app/changelog/data.ts` | **YES** | §3.1 |
| `src/components/report/SpeedTierChart.tsx` | no | `i` param removal (L580) vs Trick Room memo (L382/402). Auto-merges |

Plus 2 `.swarm/*.md` conflicts.

### 2.4 `SpeedTierChart.tsx` — the one file all three branches edit

It never conflicts, at any step, but three independent edits landing in one 600-line component
is worth a two-minute read after the merges:

- **#91** adds `resolveMegaAbility` (L12 import) and threads an `ability` field through the
  entry objects at L218/L266, consumed at L635.
- **#92** changes `allEntries.map((entry, i) =>` to `(entry) =>` at L580 — dropping an unused
  index.
- **#93** re-sorts the baseline into the same turn-order frame at L382 and adds `trickRoom` to
  the `useMemo` deps at L402.

The risk to check was whether #91's L635 edit (inside the very callback #92 narrows) uses `i`.
**It does not** — it adds `entry.ability` only. Verified by reading both hunks.

### 2.5 Files no two branches share (so: zero risk)

Worth stating explicitly because it is where most of the volume lives:

- **#91 only:** `package.json`, `package-lock.json`, `src/app/globals.css`,
  `src/lib/analysis/stat-calculator.ts`, `src/lib/db-availability.ts` (new),
  `src/lib/sharing/url-codec.ts`, `src/lib/db/migrations/add-creator-profile-user-id.sql`,
  and ~90 more.
- **#92 only:** `tsconfig.json`, `src/lib/parser/showdown-parser.ts`,
  `src/lib/types/pokemon.ts`, `src/components/report/PokemonCard.tsx`,
  `src/lib/sharing/__tests__/url-codec.test.ts`, `src/lib/__tests__/cron-auth.test.ts`.
- **#93 only:** `src/lib/utils/type-colors.ts`, `src/lib/spreads/species-spreads.ts` (new),
  `src/lib/data/blog-posts.ts` (new), `src/app/blog/**` (new),
  `src/app/explore/spreads/[species]/**` (new), `src/app/s/[id]/hero.tsx` (new),
  `src/lib/utils/calc-category.ts`, and the rest of 38.

---

## 3. Step-by-step: the conflicts you will actually hit

### Step 1 — `git merge --ff-only origin/swarm-nightly-2026-11-02`

**Zero conflicts.** Fast-forward. 110 non-`.swarm` files, 21 commits.

Run the gate before continuing — it is the only point where you get a clean read on #91 alone:

```bash
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/vitest/vitest.mjs run
node node_modules/next/dist/bin/next build
```

(`node_modules` is present. Per CLAUDE.md the type gate **must** be cold — keep
`--incremental false`.)

### Step 2 — `git merge origin/swarm-nightly-2026-11-09`

Simulated result (`merge-tree --write-tree` of `02` × `09`, tree
`c57abe2a45a61cc23261cb38cedf478136444430`):

```
CONFLICT (content): src/app/changelog/data.ts      <- resolve, §3.1
CONFLICT (content): .swarm/main-changed-files.md   <- bookkeeping, §3.3
CONFLICT (content): .swarm/posthog-insights.md     <- bookkeeping, §3.3
CONFLICT (content): .swarm/run-meta.md             <- bookkeeping, §3.3
```

Everything else auto-merges, including all 13 other shared code files.

### Step 3 — `git merge origin/swarm-nightly-2026-11-16`

This was simulated against a **properly resolved** step-2 tree, not against the
marker-polluted `merge-tree` output — otherwise the changelog result would have been
meaningless. The resolved step-2 tree was built by applying §3.1's recipe, writing the blob
with `git hash-object -w`, assembling a tree through a temporary `GIT_INDEX_FILE`, and wrapping
it with `commit-tree` (resolved tree `cc46b3d8…`, sim commit `4cd0f038…`). Result:

```
CONFLICT (content): src/app/changelog/data.ts      <- resolve, §3.1
CONFLICT (content): src/app/sitemap.ts             <- resolve, §3.2
CONFLICT (content): .swarm/main-changed-files.md   <- bookkeeping, §3.3
CONFLICT (content): .swarm/run-meta.md             <- bookkeeping, §3.3
```

So the step-3 conflict set is confirmed to be exactly `changelog` + `sitemap`. Nothing new
appears because of the step-2 resolution.

---

### 3.1 `src/app/changelog/data.ts` — the worst conflict, and it is a trap

**The brief said the answer is "keep all entries from both sides". I verified the diffs and
that is the right *intent* — but executing it by deleting the conflict markers produces a file
that does not compile.** Here is why.

All three branches prepend a new entry to `ENTRIES`, and all three entries open with the
**identical two lines**:

```ts
  {
    date: "November 2026",
```

Git's diff3 aligns those shared lines, so the conflict region opens *inside a single object
literal* and the two sides share one closing `],\n  },`. The step-2 conflict looks like this:

```ts
export const ENTRIES: ChangelogEntry[] = [
  {
    date: "November 2026",
<<<<<<< HEAD
    version: "5.30",
    title: "Private Previews, Readable Accents & Correct Mega Speeds",
    emoji: "\u{1F512}",
    highlight: true,
    items: [
      ... 16 items ...
=======
    version: "5.31",
    title: "Groundwork for Champions Spreads & a Code Clean-up",
    emoji: "\u{1F9F9}",
    items: [
      ... 3 items ...
>>>>>>> origin/swarm-nightly-2026-11-09
    ],
  },
  {
    date: "October 2026",
    version: "5.29",
```

Delete the three markers and you get **one** object with `version` twice, `title` twice,
`emoji` twice and `items` twice. TypeScript rejects duplicate object keys, and even if it did
not, you would silently publish one changelog entry instead of two. The same shape recurs at
step 3, except "ours" is then a *two*-entry region (5.31 **and** 5.30) against 5.32:

```ts
<<<<<<< HEAD
    version: "5.31", ... ],
  },
  {
    date: "November 2026",
    version: "5.30", ... ],
=======
    version: "5.32", ... ],
>>>>>>> origin/swarm-nightly-2026-11-16
```

**The resolution is: prepend the incoming branch's complete entry object above ours, and keep
ours untouched.** Do it mechanically rather than by hand-editing markers. This exact recipe is
what built the verified step-2 tree:

```bash
# $BRANCH is the branch being merged (…-09 at step 2, …-16 at step 3)
BRANCH=origin/swarm-nightly-2026-11-09
F=src/app/changelog/data.ts

# 1. the incoming branch's new entry = exactly its added lines vs main
git diff origin/main "$BRANCH" -- "$F" | grep '^+' | grep -v '^+++' | cut -c2- > /tmp/entry.md

# 2. discard the markers by taking OUR side whole (stage 2 of the index)
git show :2:"$F" > "$F"

# 3. insert the incoming entry immediately after the ENTRIES line
python3 -I - "$F" /tmp/entry.md <<'PY'
import sys
target, block = sys.argv[1], sys.argv[2]
lines = open(target, encoding='utf-8').read().split('\n')
new = open(block, encoding='utf-8').read().rstrip('\n').split('\n')
for i, l in enumerate(lines):
    if l.startswith('export const ENTRIES'):
        lines[i+1:i+1] = new
        break
open(target, 'w', encoding='utf-8').write('\n'.join(lines))
PY

git add "$F"
```

Step 2 produces `5.31, 5.30, 5.29, …`; step 3 produces `5.32, 5.31, 5.30, 5.29, …`. Both
verified. Sanity-check with:

```bash
grep -n 'version: "5.3[0-9]"' src/app/changelog/data.ts | head -4
```

**Two things to eyeball afterwards**, since they are judgement calls the recipe cannot make:

- `5.30` (#91) and `5.32` (#93) both set `highlight: true`; `5.31` (#92) does not. Three
  November entries with two highlights may not be what `ChangelogContent.tsx` /
  `WhatsNewModal.tsx` expect. Check how `highlight` renders before you push.
- All three use `date: "November 2026"`, so the page will show three November sections. Fine,
  but intentional-looking only if you meant it.

### 3.2 `src/app/sitemap.ts` — real, but small and ordering-sensitive

Both sides insert a block at the same place, immediately after `...blogSitemapEntries()`:

- **#91 (ours at step 3)** adds an early-return guard:
  ```ts
  if (!isDatabaseConfigured()) {
    warnDatabaseUnavailableOnce("sitemap");
    return staticPages;
  }
  ```
- **#93 (theirs)** adds the VGC-217 spread pages:
  ```ts
  const spreadPages: MetadataRoute.Sitemap = (
    await getSpeciesWithSpreadData()
  ).map((slug) => ({ url: `${BASE}/explore/spreads/${slug}`, changeFrequency: "weekly" as const, priority: 0.7 }));
  ```

**Resolution: keep both, with #91's guard FIRST and #93's `spreadPages` second.** Order
matters and the right order is not arbitrary:

- The `return` paths further down (which git already auto-merged) both reference
  `spreadPages` — `return [...staticPages, ...spreadPages, ...sharePages, ...creatorPages]`
  and the `catch`'s `return [...staticPages, ...spreadPages]`. So `spreadPages` must be in
  scope by then, which it is either way.
- With the guard first, a build with no `DATABASE_URL` returns `staticPages` and never calls
  `getSpeciesWithSpreadData()`. Nothing is lost: with no database that function returns `[]`
  anyway (#93's own comment says it self-catches to `[]` on any DB failure), so the early
  return is the cheaper path to the same answer and it preserves #91's single quiet
  "no database" warning instead of adding a second failed query per build.

Put the other way round and you pay a doomed DB call on every database-less build for an
identical result.

The import block needs no attention — git auto-merged it and the merged file correctly carries
all of `isDatabaseConfigured`, `warnDatabaseUnavailableOnce`, `blogSitemapEntries` and
`getSpeciesWithSpreadData`. Verified by reading the merged tree.

### 3.3 `.swarm/*.md` — bookkeeping, not code

`.swarm/main-changed-files.md`, `.swarm/run-meta.md` and `.swarm/posthog-insights.md` conflict
at every step because each nightly run rewrote them. They are swarm run notes with **zero**
effect on the application, the build or the tests.

Resolve however you like — concatenating both sides is the most honest, and
`git checkout --theirs <file>` is the fastest. Do not spend time here.

```bash
git checkout --theirs .swarm/main-changed-files.md .swarm/run-meta.md .swarm/posthog-insights.md
git add .swarm/
```

### 3.4 Gate and commit

After step 2 and again after step 3:

```bash
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/vitest/vitest.mjs run
node node_modules/next/dist/bin/next build
```

Expected vitest floor: #92's commit messages claim **795 passing** on its own branch (up from
784 on main), and #93 adds further suites (blog route, spread pages, share hero, a11y type
colors), so the merged total should exceed 795. A count **below** 795 means something was lost
in a resolution.

---

### 3.5 Cross-branch breakage I went looking for and did **not** find

`merge-tree` only sees text. These are the semantic collisions that a clean merge would hide,
all checked explicitly:

1. **#92 deletes 17 "dead" symbols — does #91 or #93 add a caller?** No. Grepped every deleted
   symbol (`getCalcSpecies`, `asPokemonTypes`, `PRIORITY_LABELS`, `type EventType`,
   `displayData`, `exportMenuOpen`, `summarizeChangedFields`, `megaStates`, `next/link`,
   `useTranslation`) against the added lines of both other branches. Zero hits. This was the
   most likely way to get a clean merge that fails `tsc`.
2. **#91 rewrites `isSpFormSpread` (one rule → three); #92's 11 new parser tests call it.**
   Traced each new test fixture through #91's new rules by hand:
   `4 HP / 252 Atk / 252 Spe` → rule 1 → `"ev"` ✅; `2 HP / 32 Atk / 32 Spe` (total 66) →
   rule 2 → `"sp"` ✅; all-zero → `"ev"` ✅. **All #92 parser tests still pass under #91's
   rewrite.** This was the second-most-likely silent breakage.
3. **#92 adds a new static import edge `showdown-parser` → `stat-calculator` + `tags`, and
   #91 rewrites the bundle tripwire into a transitive import-graph walker.** `showdown-parser`
   is eagerly reachable from `/compare`, so the edge is live. But #91's
   `FORBIDDEN_MODULES` (all entries, any depth) is
   `lib/data/{pokemon,dex-subset,pkmn-dex-fallback,mega-pokemon}` + `lib/utils/mega-detect`,
   and the new edge reaches only `lib/data/natures`, `lib/types/pokemon` and `lib/data/tags`
   (which imports nothing at all). **No forbidden module becomes reachable.**
4. **#93 adds static imports to #91's guarded eager entry files?** None — `git diff` over
   `app/page.tsx`, `HomePageServer/Client.tsx`, `useHomePage.ts`, `useTeamReport.ts`,
   `compare/page.tsx`, `CompareContent.tsx` shows zero added import lines on #93.
5. **#91 deletes the module-private `toBase64Url` from `url-codec.ts` without touching
   `url-codec.test.ts`, which #92 edits.** Not a problem: the test file has its **own local**
   `toBase64Url` helper at L12, unrelated to the private one at `url-codec.ts:77`. #92's edit
   there is removing an unused `vi` import at L1.

**One doc-drift follow-up (cosmetic, post-merge).** #91's new `isSpFormSpread` doc-comment ends
with "The real fix for the whole guess is to carry the unit explicitly (a
`statForm: "ev" | "sp"` on `ParsedPokemon`, set by the parser), which removes it entirely."
Once #92 lands, **that field exists**. Reword it to point at VGC-291 as done and VGC-301 as the
remaining call-site wiring. Symmetrically, #92's `statForm` doc and commit message describe the
*old* one-rule `isSpFormSpread` ("a value > 32 proves EV units"), because #92 was cut from main
and never saw #91's rewrite. Neither is a conflict; both are stale prose in merged code.

---

## 4. Which Linear tickets each PR unblocks

Extracted from `git log --oneline origin/main..origin/<branch>` plus full commit bodies. The
**Implements** column is ticket IDs that appear in a commit *subject* (the strong signal); the
**Also referenced** column is IDs appearing only in bodies — usually as "this is deferred to
X" or "X is the follow-up", so do **not** close those on the strength of this merge.

Cross-checked against `.swarm/board-reconciliation-16-11-26.md` (on #93), which audited all 61
In Review tickets against the code on 16 Nov and carries an orchestrator correction. Where that
document and the commit subjects disagree, I note it.

### PR #91 — `swarm-nightly-2026-11-02`, 21 commits, 110 files

**Implements (subject-level):** VGC-253, VGC-295, VGC-300, VGC-316, VGC-317

**Unblocked per the board reconciliation (8):** VGC-253, VGC-271, VGC-296, VGC-300, VGC-303,
VGC-315, VGC-316, VGC-317 — three of these (VGC-271, VGC-296, VGC-303) are delivered by
commits whose subjects are `perf:`/`chore:`, not `VGC-NNN:`, which is why subject-matching
alone undercounts #91.

**Also referenced in bodies:** VGC-236, VGC-255, VGC-290, VGC-293, VGC-301, VGC-318, VGC-330.

Caveats carried from the reconciliation, worth 10 minutes each before you close anything:

| Ticket | Caveat |
|---|---|
| VGC-295 | The orchestrator correction says main's `bab6c59` landed the cursor *codec*, not the fix — `chronological-cursor.ts` still opens "**VGC-295 IS ONLY HALF-FIXED**". #91's `f2a570b` is the actual completion. Close only after #91 merges |
| VGC-296 | #91 delivers win 1 only; win 2 is **lost work** (cites commit `70c86e3`, which exists in no branch). Re-open for wins 2 + 3, do not close |
| VGC-300 | #91's fix is real but does not match the ticket's named packages (axios/sharp/undici/joi are transitive). Re-verify with `npm audit --omit=dev` yourself |
| VGC-303 | Win 1 only; re-scope to win 3 |
| VGC-315 / VGC-316 | 132 utilities across 28 files start applying at once. #91's own author says this needs a human with a browser |
| VGC-317 | Only the schema-removal half shipped; the homepage/navbar SSR half is still open — re-open that part |
| VGC-253 | Carries a DB migration. Review against the 512 MB Neon tier first |

**Also: #91 carries five fixes with no Linear ticket at all** —
`d0b0ac9` (og:image not revoked when a report goes private — a P0 by its own description),
`fc173e2` (phantom share conflict), `004a8be` (SSE sync normalisation),
`5a201e3` (Redis blip swallowing a welcome email), `e2c4f90` (coverage-chart memoisation).
File tickets for these **before** merging, or the work becomes invisible to the board the
moment it lands. These are also the strongest single argument for merging #91 at all.

### PR #92 — `swarm-nightly-2026-11-09`, 5 commits, 21 files

**Implements (subject-level):** VGC-291, VGC-261

**Actually unblocked: VGC-291 only.** `statForm?: "ev" | "sp"` on `ParsedPokemon` plus the
optional `parseShowdownPaste(paste, { regulation })` argument — deliberately behaviour-neutral,
no call site passes it yet. Verified absent from #91 and #93: neither touches
`src/lib/types/pokemon.ts` or `src/lib/parser/showdown-parser.ts`.

**VGC-261 should not be credited to #92.** `cc6f207` adds **4 comment lines to
`tsconfig.json`** and changes no compiler flag; I read the diff. The five strict flags have
been on since 2026-08-10 (`bdbbfac`). VGC-261 was closeable before this branch existed.

**Also referenced in bodies:** VGC-295, VGC-301, VGC-330.

### PR #93 — `swarm-nightly-2026-11-16`, 13 commits, 38 files

**Implements (subject-level):** VGC-217 (per-species EV-spread pages at
`/explore/spreads/[species]`), VGC-227 (the `/blog` route and `/blog/[slug]`, prerendered),
VGC-318 (server-rendered content hero on `/s/[id]`), and `VGC-SEO` (navbar prerendered so 97
pages ship their internal links — note this is **not a real Linear identifier**; it needs a
ticket or the work is unattributable).

**Three further fixes, no ticket in the subject:** `c42f6aa` (Trick Room false
position-shift badge), `a88454a` (one shared calc-category validator so server and client stop
drifting), `29810d5` (**forking someone else's report no longer copies their hidden
fields** — a privacy fix; this one deserves a ticket and a line in the security log).
Plus `166bd57` (readable type badges + keyboard/screen-reader fixes) and `fad8850` (blog and
spread pages added to the sitemap).

**Also referenced in bodies:** VGC-51, VGC-79, VGC-213, VGC-218, VGC-220, VGC-226, VGC-232,
VGC-243, VGC-262, VGC-265, VGC-273, VGC-288, VGC-289, VGC-291, VGC-292, VGC-295, VGC-296,
VGC-298, VGC-301, VGC-330 — this is mostly #93's board-reconciliation commit citing every
ticket it audited. **Do not read this list as "#93 unblocks these."**

### The bigger ticket story (from #93's own audit, not from me)

Of the In Review tickets, **38 are already live on `main` and closeable on sight without
merging anything**; only **9** are genuinely gated on an unmerged branch (8 on #91, 1 on #92,
plus #93's four); and **10 have no implementation anywhere** and have been masquerading as
finished work. The merge queue is the smaller half of the problem — see
`.swarm/board-reconciliation-16-11-26.md` for the full table and the orchestrator correction.

---

## 5. Backlog tickets that become implementable once each PR merges

> **Read this section as inference, clearly labelled.** I do not have the bodies of VGC-343,
> VGC-344, VGC-345, VGC-346, VGC-347, VGC-349 or VGC-353. I attempted one read-only Linear
> GraphQL query to fetch them and **the sandbox denied the network call**; I did not retry.
> Everything below is reconstructed from committed evidence in the repo, and I say which.

**The unblock mechanism matters, and it is not what "blocked on #91/#92" sounds like.** These
tickets are not waiting for *code* from those PRs. They are waiting for the **files to be
released**. `.swarm/pr-owned-files.txt` is a 150-path file-ownership list, and the swarm's
conflict protocol forbids two agents editing one file. #91's own deferral note for the
`SpeedTierChart` contrast bug says it outright:

> "`SpeedTierChart.tsx` was being edited concurrently by another agent this run … and parallel
> edits to one file are forbidden by the swarm's conflict protocol. Deliberately deferred
> rather than missed."

So **merging the PR is the unblock** — it collapses the three parallel file claims back into
one `main` and any of these tickets can then be implemented against it.

### Evidence-backed: VGC-318

**Not blocked on #91/#92 at all — it is already implemented on #93.** Two independent pieces
of evidence:

- `.swarm/backlog-staleness-16-11-26.md` (on #93) describes VGC-318 as the Backlog ticket for
  "`/s/[id]` is a client-redirect shell", notes the metadata half landed but "the core ask is
  **not** done: the body is still a JS redirect shell", and recommends rescoping to "render
  report content server-side".
- #93's commit `0f013f2 VGC-318: server-render a content hero on /s/[id], so shared links show
  the team` adds `src/app/s/[id]/hero.tsx` and
  `src/app/s/[id]/__tests__/share-hero.test.tsx` — exactly that rescope.

**Files:** `src/app/s/[id]/page.tsx`, `src/app/s/[id]/hero.tsx` (new),
`src/app/s/[id]/__tests__/share-hero.test.tsx` (new) — **all owned by #93, none touched by #91
or #92** (verified: #91 × #93 share only 3 files, and `src/app/s/` is not among them).
**Action: on #93's merge, VGC-318 goes to In Review/Done, not to Todo.** It is also the
follow-up #91 explicitly declined and logged, so it closes a loop.

### Inferred: VGC-343 … VGC-353

#91 committed **ten ticket bodies it could not file** —
`.swarm/unfiled-ticket-bodies/02-11-26-*.md`, each stamped
"**NOT FILED** — Linear workspace is at its free-plan active-issue limit" with
"**Target state:** Backlog". A contiguous run of seven new Backlog IDs in the VGC-343–353 range
is almost certainly this batch, filed once the cap freed. **I could not confirm the
number↔body mapping**, so the table gives the batch and its files, not a one-to-one claim.

| #91 unfiled body (title) | Priority | File(s) it needs | Owner | Unblocked by |
|---|---|---|---|---|
| #1 [A11y] Focus rings measure 1.49–3.05:1 across 49 controls | Urgent | `src/app/globals.css` + the 49 controls (`ui/Button.tsx`, `input/PasteInput.tsx`, …) | **#91** (owns `globals.css` exclusively) | **#91** |
| #2 [A11y] Light-mode `--success` (3.13:1) / `--warning` (3.03:1) fail AA | High | `src/app/globals.css` (token values) | **#91** | **#91** |
| #3 [A11y] `SpeedTierChart` uses unconditional `text-purple-400` at 2.65:1 | High | `src/components/report/SpeedTierChart.tsx` | **all three** | **all three** — the only ticket here that needs the full drain. Still unfixed: `text-purple-400` appears 5× on main and 5× on each branch |
| #4 [Perf] `/embed/[id]` ships 210 KB but `X-Frame-Options: DENY` makes it unembeddable | High | `src/app/api/oembed/route.ts`, `src/app/embed/[id]/`, `middleware.ts` | none of the three | **nothing** — implementable today |
| #5 [Perf] og:image fingerprint cannot survive a `jsonb` key reorder, so every tagged report re-renders and re-uploads on every save | High | `src/lib/sharing/og-image.ts` | **#91** | **#91**. Also a live Vercel Blob cost leak |
| #6 [Test gap] VGC-235's 227-line share-flow suite is `skipIf(!DATABASE_URL)` and CI sets none | High | `.github/workflows/ci.yml`, `src/app/api/share/__tests__/` | **#91** (owns the share tests) | **#91** |
| #7 [Bug] Collaborative sync status plumbed through three layers, never rendered | High | `src/hooks/useCollaborativeSync.ts`, `src/components/home/HomePageClient.tsx`, `src/components/layout/Navbar.tsx:68,186` | **#91** + **#92** (both touch `HomePageClient` and `Navbar`) | **#91 and #92** |
| #8 [CI] Promote ESLint `no-unused-vars` to error | Medium | `eslint.config.mjs` | none of the three | **nothing** — but land #91 and #92's dead-code deletions first or the new gate fails immediately |
| #9 [TS] Staged adoption of `noUncheckedIndexedAccess` (482 errors, 39 in `src/lib`) | Medium | `tsconfig.json` + `src/lib/**` | **#92** (owns `tsconfig.json` exclusively) | **#92** |
| #10 [Security] `creatorName` on `POST /api/share` is unbounded and unchecked against the authenticated user | High | `src/app/api/share/route.ts` | **#91** | **#91** |

**Reading of the chain:** #91 is the keystone — 6 of these 10 are waiting on it alone. #92
releases `tsconfig.json` (the `noUncheckedIndexedAccess` work). Only the `SpeedTierChart`
contrast ticket needs all three merged. Two of the ten are blocked on nothing and could be
done today.

---

## 6. Can any PR be closed instead of merged?

**No. Merge all three.** I looked specifically for a branch whose work a later branch re-did,
and the honest answer is that each of the three carries code that exists nowhere else.

### #92 is the one that *looks* closeable. It is not.

Its case for closure is genuinely strong on four of five commits:

| #92 commit | Superseded? |
|---|---|
| `cc6f207` VGC-261 | **Fully redundant.** 4 comment lines in `tsconfig.json`, no flag change. The flags landed 2026-08-10. Harmless to merge |
| `298a842` dead-code | **Partly redundant.** 4 of 16 files are **byte-identical** to #91: `damage-calculator.ts` (`getCalcSpecies`), `dex-subset.ts` (`asPokemonTypes`), `tags.ts` (`type EventType`), `discord-bot.ts` (`PRIORITY_LABELS`). Verified by comparing blob SHAs — `git rev-parse <branch>:<file>` matches exactly. Git resolves these as duplicate deletes |
| `95020a2`, `c2c76c3` | `.swarm/` notes and a changelog entry |
| **`75dbf32` VGC-291** | **Not superseded by anything.** Net-new |

That last row is the whole argument. `75dbf32` adds `statForm?: "ev" \| "sp"` to
`ParsedPokemon`, the optional `parseShowdownPaste(paste, { regulation })` argument, and **83
lines of new parser tests**. Neither #91 nor #93 touches
`src/lib/parser/showdown-parser.ts` or `src/lib/types/pokemon.ts` at all. Close #92 and you
delete VGC-291 plus 11 tests.

And the half of `298a842` that *isn't* duplicated is also real: `PokemonCard.tsx`
(`displayData`), `Navbar.tsx` (`exportMenuOpen`), `SpotlightCard.tsx` (`useTranslation`),
`HomePageClient.tsx` (`Link`, `summarizeChangedFields`, `megaStates`), `SpeedTierChart.tsx`
(the unused `i`), and two test-file import cleanups — all on files #91 either doesn't touch or
touches elsewhere.

**#92 costs one changelog resolution and buys VGC-291 plus a dead-code sweep. Merge it.**

### #91 and #93: not remotely closeable

- **#91** — 110 files. Sole source of `package.json`/`package-lock.json`/`globals.css`
  changes, the `creator_profiles.user_id` migration, the `/compare` bundle win, the
  `isSpFormSpread` rewrite, the accent-contrast token, and **five fixes no ticket describes**
  including a P0 privacy bug. Nothing else re-does any of it.
- **#93** — 38 files, mostly **new**: `src/app/blog/**`, `src/app/explore/spreads/[species]/**`,
  `src/lib/spreads/species-spreads.ts`, `src/lib/data/blog-posts.ts`,
  `src/app/s/[id]/hero.tsx`, `src/lib/utils/calc-category.ts`, plus the only changes to
  `src/lib/utils/type-colors.ts`. Overlaps the other two on **three files total**. It is the
  cleanest of the three to merge and the only one that closes VGC-318.

### The one thing you *could* drop

`cc6f207` (VGC-261) is the only commit in the three branches with zero functional content and
a ticket that was already complete. It is comment-only and conflict-free, so dropping it buys
nothing mechanically — but **do not credit VGC-261 to #92 when you update the board**; it
landed in August and its In Review status was stale before this branch was cut.

---

## 7. What does *not* fit in the hour, and why that's fine

The mechanical drain is ~30–40 minutes. Two review items are not mechanical, and per
CLAUDE.md's deploy model they do **not** have to gate the merge:

> `git push origin main` builds a **preview**. Production updates only on **Promote**.

So merge all three into local `main` now, and gate these two at the **promote** step:

1. **VGC-315 / VGC-316 (#91) need a human with a browser.** `@custom-variant dark` wiring plus
   the `--accent-foreground` token change makes **132 utilities across 28 files** start
   applying at once. #91's own author flagged this as needing a rendered-page pass. Nothing in
   `tsc`/`vitest`/`next build` will catch a contrast or dark-mode regression.
2. **VGC-253 (#91) carries a DB migration.** `src/lib/db/migrations/add-creator-profile-user-id.sql`
   does `ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS user_id TEXT`. Neon is on the
   512 MB free tier (July 2026: `share_versions` snapshots ate 447 MB). A nullable TEXT column
   on a small table is cheap, but check `pg_total_relation_size` before promoting.

Also worth doing before you push, not after: **file tickets for the eight untracked fixes** —
#91's five (`d0b0ac9`, `fc173e2`, `004a8be`, `5a201e3`, `e2c4f90`) and #93's three (`c42f6aa`,
`a88454a`, `29810d5`). Two of them are privacy bugs. Once they land unticketed they are
invisible to the board, which is precisely the failure mode VGC-265 and VGC-342 exist to fix.

**Push note (CLAUDE.md's Ignored Build Step gotcha):** Vercel diffs only the push's **tip**
commit and ignores `*.md` and `.claude/`. #91's tip (`d36f77f`) is `.swarm/*.md` only — if you
stop after step 1 and push, the build **cancels**. After all three merges the tip is the merge
commit for #93, which carries `src/` changes, so the build runs. Batch it as one push.

---

## Appendix — commands used for this analysis

```bash
# ancestry
git merge-base origin/main origin/swarm-nightly-2026-11-02      # = 10dfd74 (main's tip)
git merge-base --is-ancestor origin/main origin/swarm-nightly-2026-11-02

# per-branch file sets, .swarm filtered, then pairwise intersections
git diff --name-only origin/main origin/swarm-nightly-2026-11-02 | grep -v '^\.swarm/' | sort
comm -12 f02.txt f09.txt

# real conflicts (git 2.43.0 — --write-tree supported)
git merge-tree --write-tree --name-only origin/swarm-nightly-2026-11-02 origin/swarm-nightly-2026-11-09
git merge-tree --write-tree --name-only origin/swarm-nightly-2026-11-02 origin/swarm-nightly-2026-11-16
git merge-tree --write-tree --name-only origin/swarm-nightly-2026-11-09 origin/swarm-nightly-2026-11-16

# conflict hunks, read straight out of the merged tree
git show <tree>:src/app/changelog/data.ts | grep -n -A40 '<<<<<<<'
git show <tree>:src/app/sitemap.ts        | grep -n -B6 -A45 '<<<<<<<'

# honest step-3 simulation: resolve step 2 first, then merge #93 onto the resolved tree
GIT_INDEX_FILE=tmpindex git read-tree <step2-tree>
GIT_INDEX_FILE=tmpindex git update-index --cacheinfo 100644,$(git hash-object -w resolved.ts),src/app/changelog/data.ts
GIT_INDEX_FILE=tmpindex git write-tree                      # -> cc46b3d8…
git commit-tree cc46b3d8… -p <02> -p <09> -m 'sim'          # -> 4cd0f038…
git merge-tree --write-tree --name-only 4cd0f038… origin/swarm-nightly-2026-11-16

# duplicate-vs-unique deletions: compare blob SHAs per file
git rev-parse origin/swarm-nightly-2026-11-02:src/lib/data/tags.ts
git rev-parse origin/swarm-nightly-2026-11-09:src/lib/data/tags.ts

# semantic checks merge-tree cannot see
git grep -c getCalcSpecies origin/swarm-nightly-2026-11-16 -- 'src/**'
git diff origin/main origin/swarm-nightly-2026-11-16 -- src/components/home/HomePageClient.tsx | grep '^+' | grep import
```

*Not verified: I could not run `tsc`/`vitest`/`next build` against any merged tree, because
that needs a checkout and this was a read-only run. Every finding above is static analysis.
Run the gate after each merge step as §3.4 says.*
