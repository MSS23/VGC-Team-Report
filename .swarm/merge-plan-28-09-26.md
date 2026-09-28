# Merge plan for the 7 open swarm PRs — 28 Sep 2026

Computed with `git merge-tree` against `origin/main` @ 70c4633. No working tree
was touched and nothing was merged; this is analysis for the human only.

## The situation

7 open DRAFT PRs, oldest from 3 Aug (8 weeks). 32 Linear tickets sit In Review
because their code is in these PRs. Linear ticket **VGC-265** (P1, still in
Backlog) already diagnosed this in August and was never actioned.

**Each PR merges cleanly onto main on its own. They conflict with each other.**
And ~80% of those conflicts are in four append-only accumulator files that
resolve by simply keeping both sides:

- `src/app/changelog/data.ts`  (touched by ALL 7 PRs)
- `.swarm/run-meta.md`
- `public/llms.txt` / `public/llms-full.txt`
- `src/lib/analysis/__tests__/sp-docs-drift.test.ts`
- `package-lock.json` (regenerate with `npm install`, never hand-merge)

## Recommended order: NEWEST FIRST

Counts below are conflicts remaining after merging everything above that row.

| # | PR | Branch | Date | Trivial (keep-both) | Real code | Verdict |
|---|----|--------|------|--------------------|-----------|---------|
| 1 | #79 | `claude/loving-sagan-sp9n85` | 21-09 | 0 | 0 | **Merges clean. Do this first.** |
| 2 | #78 | `claude/loving-sagan-8ryraw` | 14-09 | 3 | 0 | **Easy — and carries Reg M-C.** |
| 3 | #77 | `claude/loving-sagan-12996k` | 07-09 | 1 | 0 | Easy |
| 4 | #76 | `claude/loving-sagan-ib785e` | 31-08 | 1 | 1 (`api/team-graphic/route.tsx`) | Small |
| 5 | #75 | `claude/loving-sagan-zs6xpl` | 24-08 | 2 | 2 (team-graphic, `useTeamReport.test.ts`) | Moderate |
| 6 | #74 | `claude/loving-sagan-853anq` | 17-08 | 0 | 3 (`api/pokepaste/route.ts`, `useTeamReport.ts`, `lib/utils/pokepaste.ts`) | Moderate |
| 7 | #72 | `claude/loving-sagan-t7immy` | 03-08 | 4 | **20** | See below |

## Highest-value action: steps 1 and 2 ship Reg M-C

PR **#78** contains commit `72e482b` "VGC-41: support Pokemon Champions
Regulation M-C". Reg M-C went live **8 Sep 2026** and production still does not
know it exists — `isChampionsFormat()` returns false for M-C, so an M-C report
silently degrades to classic EV mode and loses the 66/32 SP budget, Mega
handling, the IV lock and Tera suppression. **Silently wrong output, live, for
three weeks.** Competitors (Pikalytics, VGCPastes) shipped M-C within days.

Merging #79 then #78 fixes that, and costs only three keep-both-sides
resolutions. This is the single highest-value hour available in this repo.

## PR #72 (03-08) — recommend closing rather than merging

20 real-code conflicts, including `src/lib/analysis/stat-calculator.ts`,
`src/lib/parser/showdown-parser.ts`, `src/lib/security/cors.ts` and `src/proxy.ts`
— all core files that main has since moved on significantly (the Champions SP
correction landed in 5.26, the CORS change in VGC-274). Resolving it means
re-litigating two months of drift in the most correctness-sensitive code in the
project.

Cheaper path: close #72, and re-file anything from it still wanted as fresh
tickets. Check first whether its unique value is already superseded — several of
its items (llms.txt SP definition, robots.txt named groups, CORS credentials)
have since landed on main independently, which is itself evidence the branch is
largely stale.

## Note on this run's own PR

Tonight's branch also edits `src/app/changelog/data.ts` (the Updates page is a
mandatory output). That is an 8th concurrent edit to the worst conflict file, so
it is a **pure prepend** of one new entry at the top of the `ENTRIES` array —
resolve by keeping every entry from both sides, newest first.

Tonight's run deliberately did NOT re-implement Reg M-C, even though it is the
biggest product gap, precisely because #78 already did it. Re-fixing work that
is sitting on an unmerged branch is the failure mode VGC-265 describes.
