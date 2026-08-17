# Swarm run meta — 17-08-26

## Branch decision (DEVIATION — read this)
The routine prompt specifies `swarm-nightly-2026-08-17`. This session's harness
configuration explicitly designates branch `claude/loving-sagan-853anq` and states
"NEVER push to a different branch without explicit permission".

Resolution: work lands on **`claude/loving-sagan-853anq`** (harness-designated).
Both instructions share the critical invariant — never push to main, open a DRAFT PR,
human merges. That invariant is honoured. Deviation is branch NAME only.

- REMOTE_EXISTS: 1 (origin/claude/loving-sagan-853anq exists, == origin/main)
- Base: origin/main @ 5d456cd, 0 ahead / 0 behind at run start
- History published => MERGE ONLY, never rebase, never force-push.

## Integration availability (preflight)
- Linear MCP: UNAVAILABLE (OAuth required, non-interactive session).
  WORKAROUND: LINEAR_API_KEY env var present -> direct GraphQL via .claude/scripts/linear.sh. WORKING.
- Discord: DISCORD_BUILDS_WEBHOOK present, endpoint reachable (400 on empty probe = valid). USABLE.
- PostHog: POSTHOG_API_KEY / POSTHOG_PROJECT_ID NOT SET in container. Step 1 PostHog pull SKIPPED.
  (Already tracked as VGC-220.)
- Vercel: no VERCEL_TOKEN, no Vercel MCP. Step 0C deployment/env/log checks NOT POSSIBLE.
- gh CLI: NOT INSTALLED. PR creation via GitHub MCP tools instead.

## Board state at run start (107 open)
Backlog 70 | In Review 23 | Todo 13 | Duplicate 1

## KEY FINDING — VGC-265 confirmed and quantified
Of 23 tickets In Review, cross-referencing against origin/main history:
- ALREADY ON MAIN (8) - human can move to Done now:
  VGC-64, VGC-219, VGC-243, VGC-264, VGC-266, VGC-267, VGC-272, VGC-274
- ON UNMERGED BRANCHES (15):
  VGC-181, VGC-224, VGC-242, VGC-245, VGC-246, VGC-247, VGC-251, VGC-254,
  VGC-256, VGC-257, VGC-258, VGC-259, VGC-260, VGC-261, VGC-262
  (VGC-254/256/257/258/259/260/261/262 are all on origin/swarm-nightly-2026-08-10)
- ~35 unmerged swarm-nightly-* branches on origin.
The bottleneck is MERGE THROUGHPUT, not implementation capacity.

## Wave 1 scope decision
Trimmed from 13 to 7 agents. `.swarm/` already holds dozens of near-identical
competitor teardowns (R1/R2), Reddit/Twitter sentiment (R3/R4) and AEO (R7)
reports across ~35 prior runs, and `.swarm/drafts/` holds 27 unsent drafts.
Re-running them is near-zero marginal value. Budget shifted to Wave 2
implementation, which serves Goal A (drain the board) — the stated top priority.
