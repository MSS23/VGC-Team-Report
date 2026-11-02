# BLOCKER: Linear workspace is at its free-plan active-issue limit

Discovered 02-11-26 while filing research tickets (Step 6).

## What happened

The first ticket filed this run, **VGC-330**, succeeded. **Every subsequent
`issueCreate` failed**, all with the same error:

```
"message": "usage limit exceeded",
"code": "USAGE_LIMIT_EXCEEDED",
"userPresentableMessage": "You've exceeded the free issue limit for this
  workspace. Please upgrade or contact sales@linear.app for a free trial.",
"meta": { "usageMetric": "activeIssueCount" }
```

The metric is **`activeIssueCount`** — the cap is on *open* issues, not issues
ever created. So closing issues frees capacity; nothing else does, short of
upgrading the plan.

## Scope of the blockage

- 1 of 11 planned tickets filed (VGC-330).
- The other **10 are written in full** and saved under
  `.swarm/unfiled-ticket-bodies/02-11-26-*.md`, each with its intended title,
  priority, labels and complete description. They can be pasted straight in
  once capacity exists.
- **Comments and status transitions still work** — only issue *creation* is
  capped. So this run could still annotate existing tickets and move implemented
  ones to In Review.

## Why this is the run's most important finding

The board holds **129 open issues: 71 Backlog, 56 In Review, 1 Todo**. The 56 In
Review are the accumulation of prior nightly runs' implemented work, and
`origin` currently holds **only `main`** — every prior nightly branch has been
merged and deleted. So that work is almost certainly **already shipped**, and
those 56 tickets are occupying the workspace's paid capacity while describing
finished work.

This is the mechanism behind **VGC-265** ("the swarm is re-fixing already-fixed
bugs"), and it has now escalated from a process smell into a hard stop: the
swarm can no longer record findings at all. This is also not the first time —
`.swarm/unfiled-ticket-bodies/` already contained 7 bodies from the 26-10-26
run, which means the limit was hit then too and the cause was never addressed.

## The fix is a human action, and it is cheap

Moving the 56 In Review tickets to **Done** (after confirming the corresponding
PRs merged) would free 56 slots at a stroke — far more than the ~11 a nightly
run needs. The swarm deliberately does not make that transition: per its
status-integrity guardrail, Done means "live on main" and only a human merge
makes that true.

Alternatively, upgrade the workspace.

## What the swarm did instead

- Did **not** retry the failing mutation in a loop — the error is a policy
  denial, not a transient fault.
- Did **not** delete, close or cancel any existing issue to make room. Choosing
  which of someone's tickets to close is not the swarm's call.
- Wrote every unfiled ticket body to disk so no finding is lost.
- Surfaced this in the PR body, the Discord notification and the final report.
