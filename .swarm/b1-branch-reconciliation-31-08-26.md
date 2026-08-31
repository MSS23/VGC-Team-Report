# B1 — Branch & In-Review Reconciliation (31-08-26)

Read-only audit for **VGC-265 (P1)**: drain the merge queue. Nothing was checked out,
merged, pushed, deleted, or mutated in Linear. `git fetch origin --prune` was the only
network write (it pruned one already-deleted ref, `origin/claude/loving-sagan-ib785e`).

- Data as of: `origin/main` = `70c4633` (2026-08-24, "fix: published teams can no longer resurface as a device-only draft")
- Remote branches: **35** total → 1 `main` + **34** candidates (24 `swarm-nightly-*`, 10 `claude*`)
- Linear In-Review issues on team VGC Team Report: **32**

---

## THE HEADLINE FINDING — read this before touching any branch

**`origin/main`'s history was rewritten on 2026-07-04.** Its root commit is
`0825946 2026-07-04 "Reduce Neon DB load: cache hot reads, parallelize queries, trim polling"`
and main has only **50 commits total**.

Consequence: **25 of the 34 branches have NO merge base with main.**

```
$ git merge-base origin/main origin/swarm-nightly-2026-06-01
(no output)
$ git merge-tree --write-tree origin/main origin/swarm-nightly-2026-06-01
fatal: refusing to merge unrelated histories
$ git diff origin/main...origin/swarm-nightly-2026-06-01 --stat
fatal: origin/main...origin/swarm-nightly-2026-06-01: no merge base
```

These branches are **not "unmerged PRs waiting for review". They are unmergeable
relics of the pre-rewrite repository.** `git merge` refuses them outright;
`git diff A...B` errors rather than returning empty. Any tooling that treated a
failed/empty three-dot diff as "already merged" has been reporting these as clean —
that is the likely root cause of VGC-265's "30 unmerged branches" number never going down.

**Therefore: the requested "SAFE TO DELETE — branch diff vs main is empty" list is EMPTY.
Zero branches have an empty diff vs main.** A substitute, evidence-backed deletion list is
given below under *SAFE TO DELETE (revised basis)*.

---

## TABLE 1 — Branches

`ahead`/`behind` are `git rev-list --count` against `origin/main`.
`files (3-dot)` = `git diff origin/main...BR --name-only | wc -l` (n/a where there is no merge base).
`files (2-dot)` = raw tree comparison `git diff origin/main BR --name-only | wc -l` — works even for unrelated histories.
`empty diff?` = tree identical to main (the "safe to delete" test in the brief).
`merges clean?` = `git merge-tree --write-tree origin/main BR` exit status.

### 1a. Unrelated history — cannot be merged at all (25 branches)

| Branch | ahead | behind | files (3-dot) | files (2-dot) | empty diff? | merges clean? | last commit | subject |
|---|---|---|---|---|---|---|---|---|
| `claude-dev` | 672 | 50 | n/a | 376 | no | **N/A — unrelated history** | 2026-05-29 | VGC-234: html tagged-template helper — escape-by-default for all email builders (#41) |
| `claude/VGC-229-jsonld-share-page` | 666 | 50 | n/a | 372 | no | **N/A — unrelated** | 2026-05-24 | VGC-229: Add ArticleJsonLd + SportsTeamJsonLd components, wire into /s/[id] |
| `claude/VGC-234-email-html-tagged-template` | 673 | 50 | n/a | 376 | no | **N/A — unrelated** | 2026-05-29 | Merge branch 'claude-dev' into claude/VGC-234-… |
| `claude/VGC-235-share-flow-integration-test` | 666 | 50 | n/a | 373 | no | **N/A — unrelated** | 2026-05-24 | VGC-235: Integration test for shares INSERT/UPDATE/dedup |
| `claude/cleanup-dead-exports-dock-selectors` | 674 | 50 | n/a | 378 | no | **N/A — unrelated** | 2026-05-31 | cleanup: strip dead dock selectors and unnecessary public exports |
| `swarm-nightly-2026-05-22` | 681 | 50 | n/a | 349 | no | **N/A — unrelated** | 2026-05-29 | Merge branch 'main' into swarm-nightly-2026-05-22 |
| `swarm-nightly-2026-05-23` | 684 | 50 | n/a | 328 | no | **N/A — unrelated** | 2026-05-29 | Merge branch 'main' into swarm-nightly-2026-05-23 |
| `swarm-nightly-2026-05-27` | 675 | 50 | n/a | 370 | no | **N/A — unrelated** | 2026-05-27 | swarm: finalize run-meta with PR URL |
| `swarm-nightly-2026-05-28` | 678 | 50 | n/a | 346 | no | **N/A — unrelated** | 2026-05-28 | swarm: extract changelog data to server component (76KB client saving) |
| `swarm-nightly-2026-05-31` | 687 | 50 | n/a | 276 | no | **N/A — unrelated** | 2026-05-31 | swarm: backfill PR URL into run-meta |
| `swarm-nightly-2026-06-01` | 688 | 50 | n/a | 274 | no | **N/A — unrelated** | 2026-06-01 | swarm: final run-meta + discord payload PR URL |
| `swarm-nightly-2026-06-02` | 682 | 50 | n/a | 266 | no | **N/A — unrelated** | 2026-06-02 | swarm: research notes, synthesis, recommended tickets, run summary |
| `swarm-nightly-2026-06-03` | 680 | 50 | n/a | 266 | no | **N/A — unrelated** | 2026-06-03 | swarm: finalise run-meta with PR #54 URL |
| `swarm-nightly-2026-06-04` | 678 | 50 | n/a | 277 | no | **N/A — unrelated** | 2026-06-04 | swarm: add C1 dead-code + R6 SEO summary notes |
| `swarm-nightly-2026-06-05` | 692 | 50 | n/a | 275 | no | **N/A — unrelated** | 2026-06-05 | swarm: queue Discord notification payload (webhook URL not available) |
| `swarm-nightly-2026-06-06` | 683 | 50 | n/a | 274 | no | **N/A — unrelated** | 2026-06-06 | swarm: record PR URL in run-meta after PR creation |
| `swarm-nightly-2026-06-07` | 684 | 50 | n/a | 268 | no | **N/A — unrelated** | 2026-06-07 | swarm: record PR #58 URL in run-meta |
| `swarm-nightly-2026-06-08` | 684 | 50 | n/a | 281 | no | **N/A — unrelated** | 2026-06-08 | swarm: research notes, drafts, and discord-failed log |
| `swarm-nightly-2026-06-09` | 683 | 50 | n/a | 273 | no | **N/A — unrelated** | 2026-06-09 | swarm: record PR #60 URL in run-meta |
| `swarm-nightly-2026-06-10` | 685 | 50 | n/a | 274 | no | **N/A — unrelated** | 2026-06-10 | swarm: stash Discord payload — no webhook credentials in sandbox |
| `swarm-nightly-2026-06-11` | 691 | 50 | n/a | 271 | no | **N/A — unrelated** | 2026-06-11 | swarm: discord-failed payload + run-meta update |
| `swarm-nightly-2026-06-12` | 689 | 50 | n/a | 267 | no | **N/A — unrelated** | 2026-06-12 | swarm: Discord notification payload (unsent — no .env.local) |
| `swarm-nightly-2026-06-14` | 681 | 50 | n/a | 253 | no | **N/A — unrelated** | 2026-06-14 | swarm: research notes, rejection log, and run metadata |
| `swarm-nightly-2026-06-22` | 687 | 50 | n/a | 261 | no | **N/A — unrelated** | 2026-06-22 | swarm: log discord notification failure payload for #builds |
| `swarm-nightly-2026-06-29` | 712 | 50 | n/a | 270 | no | **N/A — unrelated** | 2026-06-29 | swarm: discord payload + failure log (no webhook URL in session) |

The huge `ahead` numbers (666–712) and the uniform `behind = 50` are the signature of the
history rewrite, **not** of 700 commits of unlanded work: `ahead` is "every commit in the old
repo" and `behind` is "every commit in the new one".

### 1b. Shared history with main — genuinely mergeable, all conflict (9 branches)

| Branch | ahead | behind | files (3-dot) | empty diff? | merges clean? | conflicted files | last commit | subject |
|---|---|---|---|---|---|---|---|---|
| `swarm-nightly-2026-07-13` | 6 | 39 | 19 | no | **CONFLICT** | 3 (all `.swarm/*.md`) | 2026-07-13 | swarm: audit reports, run meta, and Discord fallback payload |
| `swarm-nightly-2026-07-20` | 16 | 30 | 31 | no | **CONFLICT** | 5 (4 `.swarm/*.md` + `src/app/sitemap.ts`) | 2026-07-20 | swarm: final research synthesis + Discord failure log |
| `swarm-nightly-2026-07-27` | 8 | 30 | 23 | no | **CONFLICT** | 4 (3 `.swarm/*.md` + `src/app/champions/ChampionsContent.tsx`) | 2026-07-27 | swarm: log Discord notification failure — no DISCORD_BUILDS_WEBHOOK |
| `swarm-nightly-2026-08-10` | 23 | 23 | 63 | no | **CONFLICT** | 3 (`changelog/data.ts`, `ClarityProvider.tsx`, `__tests__/cors.test.ts` add/add) | 2026-08-10 | swarm: final run summary 10-08-26 |
| `claude/optimistic-cerf-jmez32` | 11 | 39 | 29 | no | **CONFLICT** | 5 (`run-meta.md`, `ChampionsContent.tsx`, `champions/page.tsx`, `PageNavbar.tsx`, `ShortcutHintOverlay.tsx`) | 2026-07-06 | swarm: run-meta + Discord failure log for 06-07-26 |
| `claude/gallant-bohr-nycyuh` | 8 | 24 | 24 | no | **CONFLICT** | 5 (`run-meta.md`, `changelog/data.ts`, `stat-calculator.ts` + its test, `showdown-parser.ts`) | 2026-08-02 | chore: changelog entry (5.26) for the 02-08-26 swarm fixes |
| `claude/loving-sagan-t7immy` | 28 | 23 | 132 | no | **CONFLICT (worst)** | 23, incl. `package.json`, `package-lock.json`, `layout.tsx`, `sitemap.ts`, `cors.ts`, `proxy.ts`, plus 2 modify/delete (`DisplayTogglePill.tsx`, `ConsentGate.tsx` deleted on main) | 2026-08-03 | swarm: final run log 03-08-26 |
| `claude/loving-sagan-853anq` | 13 | **5** | 64 | no | **CONFLICT** | 3 (`api/pokepaste/route.ts`, `hooks/useTeamReport.ts`, `lib/utils/pokepaste.ts`) | 2026-08-17 | swarm: run-meta close-out — Discord delivered, status integrity pass clean |
| `claude/loving-sagan-zs6xpl` | 16 | **1** | 77 | no | **CONFLICT** | 1 (`src/hooks/__tests__/useTeamReport.test.ts`) | 2026-08-24 | swarm: P0 — live Discord webhook token in public git history |

`git cherry origin/main <branch>` reports **0 already-upstream patches** for all nine —
main's PR merges are squashes, so no commit is patch-identical. Patch-equivalence cannot be
used as a merge signal in this repo.

---

## TABLE 2 — Linear "In Review" tickets (32)

Method: for each identifier, `git log <ref> --grep="VGC-NNN([^0-9]|$)"` over the **full commit
message** (`%B`, not just `%s`) — main's history is squashed, so several fixes appear only as
sub-commit lines inside a merge body. Every category-A commit was additionally verified with
`git merge-base --is-ancestor <sha> origin/main`.

| # | Identifier | Title | Class | Evidence |
|---|---|---|---|---|
| 1 | VGC-274 | [Security] CORS Allow-Credentials + Linear webhook replay protection | **A** | `a099f97` (2026-08-13) `VGC-274: Linear webhook replay window + drop CORS Allow-Credentials` — ancestor of main |
| 2 | VGC-272 | [SEO] robots.txt per-bot groups / /compare noindex | **A** | `164fb87` (2026-08-13) `VGC-272: robots.txt named groups un-blocked /api/…` |
| 3 | VGC-266 | [SEO] llms.txt wrong SP definition | **A** | `1db8419` (2026-08-13) `VGC-266: correct SP definition in llms.txt and FAQ` |
| 4 | VGC-264 | [Security] x-forwarded-for left-most parsing | **A** | `b865fa2` (2026-08-13) `VGC-264: regression test — no API route may parse x-forwarded-for directly` |
| 5 | VGC-267 | [Bug] keepalive:true on all draft saves | **A** | `9897389` (2026-08-13) `VGC-267: keepalive only on the exit flush` |
| 6 | VGC-219 | Remaining a11y findings | **A** | `d706f71` (2026-07-17) `VGC-219: finish report accessibility controls` |
| 7 | VGC-64 | Google Search Console + sitemap optimization | **A** | `fe70914` (2026-07-17) `VGC-64: refresh public sitemap hourly` |
| 8 | VGC-243 | Speed-Tiers not adapting to "Mega" selection | **A** | `cfcbd2f` (2026-07-17) `VGC-243: sync Mega selection with speed tiers` |
| 9 | VGC-254 | [Privacy] Clarity session recording not disclosed | **A** | `bdbbfac` PR #73, sub-commit `VGC-254: disclose Microsoft Clarity, and stop it recording before consent` |
| 10 | VGC-256 | Perf: lazy-load zod out of client bundle | **A** | `bdbbfac` PR #73, sub-commit `VGC-256: lazy-load zod out of the homepage client bundle` |
| 11 | VGC-257 | Perf: dex-subset.json eagerly bundled | **A** | `bdbbfac` PR #73, sub-commit `VGC-257: re-encode dex-subset as positional arrays (-60.8% artifact)` |
| 12 | VGC-258 | [SEO] /champions index missing 14 Reg M-B megas | **A** | `bdbbfac` PR #73, sub-commit `VGC-258 + VGC-262: publish the Reg M-B Megas…` |
| 13 | VGC-259 | [a11y] no `<h1>` on report slides | **A** | `bdbbfac` PR #73, sub-commit `VGC-259: give every report slide an sr-only h1` |
| 14 | VGC-260 | Bug: version-diff emits `pokemon:<index>` | **A** | `bdbbfac` PR #73, sub-commit `VGC-260: version history shows the Pokemon's name, not "Set (0)"` |
| 15 | VGC-261 | TypeScript: enable 4 strict flags | **A** | `bdbbfac` PR #73, sub-commit `VGC-261: enable five measured-clean strict flags; make the type gate run cold` |
| 16 | VGC-262 | [SEO] EV→SP converter page | **A** | `bdbbfac` PR #73, sub-commit `VGC-258 + VGC-262: … add the EV to SP converter` |
| 17 | VGC-228 | Server-render /s/[id] without app shell | **B** | Only `claude/loving-sagan-zs6xpl` (1 commit). Confirmed still open on main: `src/app/s/[id]/page.tsx` is a server component but still renders `ShareRedirectClient` from `./redirect`. |
| 18 | VGC-275 | [SEO] /s/[id] serves a client redirect | **B** | `claude/loving-sagan-853anq` (1), `claude/loving-sagan-zs6xpl` (1). Same evidence as VGC-228 — `redirect.tsx` still present on main. |
| 19 | VGC-246 | Enforce true private reports + visibility hardening | **B** | Only `claude/loving-sagan-zs6xpl` (1 commit) |
| 20 | VGC-269 | [Tooling] No bundle-size visibility since Next 16 | **B** | Only `claude/loving-sagan-853anq` (2 commits) |
| 21 | VGC-232 | Sprite-fallback CDN proxy | **B** | Only `claude/loving-sagan-853anq` (1). ⚠ `src/app/api/sprite/route.ts` **does exist on main** (added `0825946`, 2026-07-04) — verify scope before re-implementing. |
| 22 | VGC-225 | PokePaste URL import | **B** | Only `claude/loving-sagan-853anq` (2). ⚠ `src/app/api/pokepaste/route.ts` and `src/lib/utils/pokepaste.ts` **exist on main** (last touched `82f9210`, 2026-08-22) — likely partially landed under a non-VGC commit subject. |
| 23 | VGC-273 | [Chore] Grouped cleanup: sitemap lastModified, CI lint | **B** | Only `claude/loving-sagan-853anq` (2 commits) |
| 24 | VGC-271 | [Perf] Lazy-load dex-subset fallback (VGC-257 follow-up) | **B** | Only `claude/loving-sagan-853anq` (2). Parent VGC-257 is category A — this is the remaining half. |
| 25 | VGC-268 | [Perf] motion eager on 7 routes, move-names eager on / | **B** | Only `claude/loving-sagan-853anq` (2 commits) |
| 26 | VGC-270 | [a11y] Edit-mode slide 0 renders no h1 | **B** | Only `claude/loving-sagan-853anq` (2 commits) |
| 27 | VGC-224 | Decide Cypress: types or delete | **B** | Only `claude/loving-sagan-t7immy` (1 commit) |
| 28 | VGC-181 | Indianapolis Regionals top-cut real data | **B** | Only `claude/loving-sagan-t7immy` (1 commit) |
| 29 | VGC-245 | Modes' section not saving | **B** | Only `claude/loving-sagan-t7immy` (1 commit) |
| 30 | VGC-251 | Champions Paste Not Working | **B** | Only `claude/loving-sagan-t7immy` (2 commits) |
| 31 | VGC-242 | Manage Access collaboration "visual flashes" | **B — unrecoverable by merge** | Only on `swarm-nightly-2026-06-22` / `-06-29`, both **unrelated-history**. See label-swap warning below. |
| 32 | VGC-247 | Update PostHog SDKs (Critical outdated-version alerts) | **C** | No commit matching `VGC-247` on **any** ref. main pins `posthog-js ^1.392.0`, `posthog-node ^5.38.2`. |

**Counts: A = 16, B = 15, C = 1.**

### ⚠ Label-swap hazard on VGC-242 / VGC-243

The two commits on `swarm-nightly-2026-06-2x` carry **swapped identifiers** relative to the
Linear titles:

```
6d32c47 2026-06-20  VGC-243: stop Manage Access panel from flashing      ← actually VGC-242's bug
886119a 2026-06-20  VGC-242: speed tiers now reflect Mega base stats      ← actually VGC-243's bug
```

main's `cfcbd2f "VGC-243: sync Mega selection with speed tiers"` fixes the **speed-tier/Mega**
bug, which is what Linear's VGC-243 actually describes — so **VGC-243 is correctly category A**.
The Manage-Access flash fix (Linear VGC-242) exists only on an unrelated-history branch and
must be **re-implemented**, not merged. A grep of main for `flash`/`manage access`/`collaborat`
found no matching fix.

---

## SAFE TO CLOSE — fix verified on main

16 tickets. A commit bearing the identifier is a verified ancestor of `origin/main`.
**A human should close these; the swarm must not change their status.**

| Identifier | Landing commit | Date |
|---|---|---|
| VGC-64 | `fe70914` | 2026-07-17 |
| VGC-219 | `d706f71` | 2026-07-17 |
| VGC-243 | `cfcbd2f` | 2026-07-17 |
| VGC-254 | `bdbbfac` (PR #73) | 2026-08-11 |
| VGC-256 | `bdbbfac` (PR #73) | 2026-08-11 |
| VGC-257 | `bdbbfac` (PR #73) | 2026-08-11 |
| VGC-258 | `bdbbfac` (PR #73) | 2026-08-11 |
| VGC-259 | `bdbbfac` (PR #73) | 2026-08-11 |
| VGC-260 | `bdbbfac` (PR #73) | 2026-08-11 |
| VGC-261 | `bdbbfac` (PR #73) | 2026-08-11 |
| VGC-262 | `bdbbfac` (PR #73) | 2026-08-11 |
| VGC-264 | `b865fa2` | 2026-08-13 |
| VGC-266 | `1db8419` | 2026-08-13 |
| VGC-267 | `9897389` | 2026-08-13 |
| VGC-272 | `164fb87` | 2026-08-13 |
| VGC-274 | `a099f97` | 2026-08-13 |

One-liner to re-verify any row before closing:

```bash
git log origin/main --oneline --grep='VGC-262' --format='%h %ad %s' --date=short
```

---

## SAFE TO DELETE — branch diff vs main is empty

**EMPTY LIST. Zero branches qualify.** No branch has an identical tree to `origin/main`;
for the 25 pre-rewrite branches `git diff origin/main...BR` errors with
`no merge base` rather than producing empty output. Do not read a failed diff as "merged".

## SAFE TO DELETE (revised basis) — verified-obsolete branches

Same intent, sound evidence. Recommend tagging before deleting so nothing is lost:
`git tag archive/<branch> origin/<branch> && git push origin archive/<branch>`.

**Tier 1 — 25 unrelated-history branches (delete after archiving).**
All of `claude-dev`, `claude/VGC-229-jsonld-share-page`,
`claude/VGC-234-email-html-tagged-template`, `claude/VGC-235-share-flow-integration-test`,
`claude/cleanup-dead-exports-dock-selectors`, and `swarm-nightly-2026-05-22` →
`swarm-nightly-2026-06-29` (20 branches).
Rationale: no merge base with main, so `git merge` refuses them; their unique ticket payload
is entirely pre-VGC-213 era work from the repository that was replaced on 2026-07-04. They
inflate VGC-265's "30 unmerged branches" count while being structurally unmergeable.
**Carve-out:** archive `swarm-nightly-2026-06-22` / `-06-29` specifically — they hold the only
copy of the VGC-242 Manage-Access fix (`6d32c47`), which must be re-implemented against main.

**Tier 2 — `swarm-nightly-2026-08-10` (superseded).**
23 commits ahead, but every ticket it carries (VGC-254/256/257/258/259/260/261/262 + VGC-219)
is already on main via `bdbbfac` (PR #73, 2026-08-11 — the merge of this very branch's work).
The 3 remaining conflicts are re-merge noise from a branch that already landed. Verify then delete.

---

## Recommended drain order for the 8 live branches

Fewest conflicts and most value first:

1. **`claude/loving-sagan-zs6xpl`** — only 1 behind, 1 conflicted file
   (`src/hooks/__tests__/useTeamReport.test.ts`). Carries a **P0 security item**
   ("live Discord webhook token in public git history") plus VGC-228/246/275. **Do this first.**
2. **`claude/loving-sagan-853anq`** — 5 behind, 3 conflicted files. The single biggest payload:
   **9 In-Review tickets** (VGC-225/232/268/269/270/271/273/275 + VGC-266 dupe). Highest ROI.
3. **`claude/gallant-bohr-nycyuh`** — 5 conflicts, but two are `.swarm/run-meta.md` and
   `changelog/data.ts` (append-only, trivial). Touches `stat-calculator.ts` / `showdown-parser.ts`
   — the SP core; review carefully.
4. **`swarm-nightly-2026-07-13`** — 3 conflicts, **all `.swarm/*.md`**. No source conflicts.
5. **`swarm-nightly-2026-07-27`** — 4 conflicts, 3 are `.swarm/*.md`; 1 real (`ChampionsContent.tsx`).
6. **`swarm-nightly-2026-07-20`** — 5 conflicts, 4 are `.swarm/*.md`; 1 real (`sitemap.ts`).
7. **`claude/optimistic-cerf-jmez32`** — 5 real UI conflicts, 39 behind, oldest live branch
   (2026-07-06). Carries **no In-Review ticket**. Consider abandoning.
8. **`claude/loving-sagan-t7immy`** — 23 conflicted files including `package-lock.json`,
   `layout.tsx`, `cors.ts`, `proxy.ts`, and 2 modify/delete conflicts on files main has since
   **deleted** (`DisplayTogglePill.tsx`, `ConsentGate.tsx`). Carries VGC-181/224/245/251.
   A straight merge is not viable — cherry-pick the four ticket commits onto a fresh branch instead.

### Systemic fixes for VGC-265

- **`.swarm/*.md` is the #1 conflict source** — it conflicts on 5 of the 9 live branches and is
  pure run metadata with zero production value. Either move run logs to per-run filenames
  (`.swarm/runs/<date>/…`, never re-edited) or gitignore the directory. This alone removes
  most conflicts.
- **`src/app/changelog/data.ts`** is the #2 source (3 branches). Same fix: append-only per-entry
  files, or a merge driver.
- **Branch lifetime cap.** Every branch older than ~2 weeks in this repo is now unmergeable.
  Nightly branches should merge or die within one cycle.
- **Fix the merge-detection tooling.** Whatever computes "merged?" must treat a
  `no merge base` / non-zero `git diff` exit as *unknown*, not *merged*.

---

## Audit hygiene

- Read-only confirmed: no checkout, no branch created, no merge, no push, no branch deleted.
- Linear: GraphQL **queries only**; no mutation issued; no ticket state changed.
- Network: `api.linear.app` and `github.com` (fetch) only.
- The only file written is this report.
- Pre-existing, unrelated dirty state was present in the working tree on arrival and was left
  untouched: `M .swarm/main-changed-files.md`, `M .swarm/run-meta.md`. HEAD is detached-ish on
  local branch `claude/loving-sagan-ib785e`, whose remote counterpart was pruned during fetch.
