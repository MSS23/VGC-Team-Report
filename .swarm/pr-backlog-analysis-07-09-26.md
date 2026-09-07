# THE HEADLINE FINDING — the delivery pipeline is backed up

## State at run start (2026-09-07)

- **4 open DRAFT swarm PRs**, none merged: #72 (03-08), #74 (17-08), #75 (24-08), #76 (31-08)
- **24 unmerged `swarm-nightly-*` branches** on origin, plus the `claude/loving-sagan-*` branches
- **32 Linear tickets sitting In Review** — i.e. implemented, awaiting a merge that never comes
- `origin/main` tip is 70c4633; PR #76 is based on that same commit

Together these carry roughly **57 substantive unmerged commits**.

## This is not a throughput problem, it is a merge problem

Goal A of the nightly swarm is "wake up to a board that has visibly moved". The board
cannot move. Every night's work is correctly implemented, correctly pushed to a branch,
correctly opened as a draft PR — and then stops. Adding a 5th draft PR of fixes on top of
4 unmerged ones adds review burden without moving anything to production.

## What is stranded in the queue (selected)

**Security / privacy — stranded since 24 August (PR #75) and 3 August (PR #72):**
- `f55725f` P0 — live Discord webhook token in public git history (**re-verified live tonight — see .swarm/P0-leaked-discord-webhook-07-09-26.md; needs human rotation, not a merge**)
- `fdacf63` ILIKE injection, creator-identity takeover, CORS lookalike origins
- `f53e522` restore consent gating before analytics initialise (GDPR regression)
- `b753707` owner-only visibility changes + Discord replay protection
- `033ddbb` / `30f091a` team-graphic rendered *private* reports as public PNGs

**Correctness:**
- `7f5ed7c` VGC-251 Champions SP conversion fabricating maxed stats
- `80d0912` a blank Pokemon type could reach the type chart and crash badges
- `d8928bc` paste starting with a team header silently dropped Pokemon
- `83e7b16` VGC-245 /api/share silently dropping Common Combinations

**SEO / perf:** VGC-275 (/s/[id] SSR), VGC-257, VGC-268, VGC-271, VGC-269, VGC-225, VGC-232

## The branches are rotting — merge cost rises every week

Conflict markers when test-merging each PR head into current main:

| PR | Branch | Age | Conflict markers |
|----|--------|-----|------------------|
| #76 | claude/loving-sagan-ib785e | 1 week  | **0** |
| #75 | claude/loving-sagan-zs6xpl | 2 weeks | 1 |
| #74 | claude/loving-sagan-853anq | 3 weeks | 4 |
| #72 | claude/loving-sagan-t7immy | 5 weeks | **58** |

Clear signal: merge newest-first, or merge #76 and #75 now while they are nearly free.
PR #72 at 58 conflict markers is close to being cheaper to re-derive than to merge.

## Independent corroboration found this run

The baseline `npm test` produced one intermittent failure in the `useTeamReport`
draft-restore test. Commit `1e95d8a` in PR #75 — "test: stop useTeamReport flaking under a
loaded worker pool" — already fixes exactly that, and has been sitting unmerged since
24 August. Tonight's swarm independently rediscovered a bug that was fixed two weeks ago.
That is the cost of the backlog, measured directly.

## Recommendation to the human (highest value action available tonight)

1. Merge **PR #76** first (0 conflicts, based on current main tip).
2. Then **PR #75** (1 conflict) — this is the one carrying the P0 credential fix.
3. Then **PR #74** (4 conflicts).
4. Triage **PR #72** (58 conflicts): cherry-pick the security commits rather than merging whole.
5. Enable branch protection on `main` requiring PRs — the one-time setup the routine asks for.

Merging #76 and #75 alone would move ~25 tickets to genuinely Done and clear the P0.
