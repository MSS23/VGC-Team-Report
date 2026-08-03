# 🚨 HEADLINE FINDING — the swarm's output is not reaching production

## 21 open draft swarm PRs, none merged, going back to 01 June 2026.

| PR | Date | Branch |
|----|------|--------|
| #71 | 02 Aug | claude/gallant-bohr-nycyuh |
| #70 | 27 Jul | swarm-nightly-2026-07-27 |
| #69 | 20 Jul | swarm-nightly-2026-07-20 |
| #68 | 13 Jul | swarm-nightly-2026-07-13 |
| #67 | 06 Jul | claude/optimistic-cerf-jmez32 |
| #66 | 29 Jun | swarm-nightly-2026-06-29 |
| #65 | 22 Jun | swarm-nightly-2026-06-22 |
| #64 | 14 Jun | swarm-nightly-2026-06-14 |
| #63–#52 | 01–12 Jun | swarm-nightly-2026-06-* |

Tonight's PR is the **22nd**.

## Why this is the most important thing in tonight's report

The routine's stated ambition is "wake up to a board that has visibly moved." The board
cannot move, because the swarm's terminal state is **In Review**, and only a human merge
promotes work to Done. With 21 PRs queued, every night's run adds to a queue that is never
drained. Consequences observed directly tonight:

1. **A live P1 user-reported bug has a finished fix sitting unmerged for a day.**
   VGC-251 ("Champions paste — everyone getting 32 HP / 32 Atk") is fixed by `dea5803`
   on PR #71. Users are still hitting the bug in production.
2. **PR #71 alone strands six real fixes**, two of them user-facing breakage and one a
   privacy leak:

   | Commit | What it fixes |
   |--------|---------------|
   | `847e160` | **Privacy:** `/api/team-graphic` rendering **private** reports |
   | `c41d42c` | **Crash:** an out-of-union Pokémon type white-screening the report |
   | `0021e4e` | **Parser:** blank lines / team headers becoming phantom Pokémon |
   | `dea5803` | **VGC-251:** Champions SP conversion ignoring actual EV investment |
   | `e2ab391` | a11y: game-plan delete unreachable by keyboard |
   | `4be024e` | stat-caption dismiss button capturing clicks on stat rows |

   A privacy leak and a white-screen crash have been sitting in a draft PR for a day.
   These are exactly the class of change that should not wait on a review queue.
3. **Runs are starting to duplicate each other.** Tonight's dead-code audit independently
   re-discovered `DisplayTogglePill` / `useGlobalDisplayPrefs`, which PR #67 already deleted
   on 06 July. Two PRs deleting the same files will conflict. The `.swarm/` directory now
   holds 133 report files, with `c1-dead-code` alone written 8 separate times.
4. **Merge risk compounds nightly.** Every unmerged PR ages against a moving `main`.

## Action taken tonight

Tonight's branch **merges `origin/claude/gallant-bohr-nycyuh` (PR #71)** so that last night's
four stranded fixes and tonight's work land in ONE reviewable PR, rather than two PRs that
both modify `convertToChampionsSp` and conflict with each other. PR #71 should be **closed as
superseded** once tonight's PR is merged. The older PRs (#52–#70) were left untouched — they
are the human's to triage.

## Recommendation (needs a human decision, not a swarm action)

The nightly swarm is **producing faster than it is being consumed**. Options:
- **Merge cadence:** triage the queue weekly; close stale PRs whose findings have been
  superseded rather than leaving them open.
- **Reduce run frequency** to match actual review capacity (e.g. weekly instead of nightly).
- **Narrow scope per run** — one or two tickets, small enough to review in ten minutes.
- **Auto-close swarm PRs older than N days** so the queue reflects live work only.

Also noted for the PR body: **GitHub branch protection on `main` requiring PRs before merge
could not be verified from this container.** Worth enabling as the backstop that makes a
direct push to `main` technically impossible.
