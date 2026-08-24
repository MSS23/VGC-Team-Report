# Board reconciliation — why 30 tickets are stuck In Review

Run date: 24 Aug 2026. Investigated inline (no subagent spent).

## The short version

The board is not stuck because work isn't getting done. It is stuck because
**"In Review" has no exit.** Tickets are moved to In Review by each nightly
swarm — correctly, per the swarm's own guardrail that it must never set Done —
but nothing ever moves them on afterwards, including for PRs that were merged
weeks ago. The pile is a bookkeeping backlog, not an engineering one.

There is also a **hard blocker on filing new tickets**: the Linear workspace is
over its free-plan issue cap (see below).

## Correcting a scary-looking number

`git merge-base --is-ancestor` reports 24 unmerged `swarm-nightly-*` branches,
several "+680 commits ahead of main". That number is an artifact, not a
problem: `main` has only **50 commits total** because nightly PRs are
**squash-merged** (e.g. `bdbbfac swarm: nightly improvements 10-08-26 (#73)`).
A squash merge leaves the source branch un-ancestored forever, so those
branches will always look unmerged. The old `swarm-nightly-*` branches are
stale leftovers that can simply be deleted.

The real state, from the GitHub API rather than from ancestry:

| PRs | Count |
|---|---|
| Open | **2** — #72 and #74, both drafts |
| Everything else | merged or closed |

## Branch-naming note

Both open PRs come from `claude/loving-sagan-*` branches, not `swarm-nightly-*`.
Previous cloud runs already used the harness-assigned branch name. Tonight's run
does the same (`claude/loving-sagan-zs6xpl`) — consistent with the last two runs.

## Where the 30 In Review tickets actually are

### A. Shipped and merged to `main` — safe to move to Done now (~16)

From `main`'s history and from PR #73 (10-08-26, merged):

`VGC-64` `VGC-219` `VGC-243` `VGC-264` `VGC-266` `VGC-267` `VGC-272` `VGC-274`
`VGC-254` `VGC-256` `VGC-257` `VGC-258` `VGC-259` `VGC-260` `VGC-261` `VGC-262`

Spot-verified against the working tree on `main`: `VGC-261`'s strict flags are
in `tsconfig.json`, `VGC-262`'s `/tools/ev-to-sp` route exists and builds,
`VGC-259`'s `sr-only` h1 is in `TeamOverview.tsx:419`, `VGC-254`'s
`ClarityProvider.tsx` exists.

**These 16 are the single highest-value action available to the human tonight:
one bulk status change and the board drops from 30 In Review to ~14.**
The swarm deliberately does not make this change itself.

### B. Genuinely in review — work exists, PR still open (~11)

**PR #74** — 17-08-26, `claude/loving-sagan-853anq`, 13 commits, only 4 behind main.
Nearly mergeable; the best merge candidate on the board.
Carries: `VGC-268` `VGC-269` `VGC-270` `VGC-271` `VGC-273` `VGC-225` `VGC-232`

**PR #72** — 03-08-26, `claude/loving-sagan-t7immy`, 28 ahead but **22 behind main**.
Three weeks stale and will almost certainly conflict.
Carries: `VGC-181` `VGC-224` `VGC-245` `VGC-251`

### C. Unaccounted for (~3)

`VGC-246` `VGC-247` and a small tail have no matching commit on `main` or on
either open PR. They may predate the swarm era or have been moved to In Review
manually. Worth a human eyeball.

## Recommended human actions, in order

1. **Move the 16 tickets in group A to Done.** Biggest board movement for the
   least effort, and it is the transition the swarm is forbidden from making.
2. **Review and merge PR #74.** It is only 4 commits behind main and clears 7
   more tickets.
3. **Decide on PR #72.** 22 behind main and three weeks old. Either rebase and
   land it or close it and re-file the 4 tickets — leaving it open is the worse
   option.
4. **Delete the 24 stale `swarm-nightly-*` branches.** They are squash-merged
   and only create noise.
5. **Resolve the Linear plan cap** (below) — until then, no run can file tickets.

## Blocker: Linear free-plan issue cap

- `organization.subscription` is `null` → **free plan**
- Non-archived issues: **275** (free-plan cap is 250)

The workspace is already ~25 issues over the cap, so `issueCreate` is expected
to be rejected. This is why the 17-08-26 run recorded "Linear free-plan cap
blocker and the 10 unfiled tickets".

**GOAL B is blocked by billing, not by engineering.** Nothing the swarm can do
resolves it. Any tickets this run wants to file are written to
`.swarm/proposed-tickets-24-08-26.md` for bulk creation once the cap is lifted
(upgrade the plan, or archive completed issues to free slots — archiving is a
human decision, so the swarm does not do it).
