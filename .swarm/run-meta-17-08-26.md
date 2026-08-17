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

## BLOCKER discovered at ticket-filing time
Linear workspace is at its FREE-PLAN ISSUE CAP (activeIssueCount). issueCreate
returns USAGE_LIMIT_EXCEEDED after VGC-275. Team query returns the 250 API page
cap, of which 143 are already `completed` and still consuming quota (Linear
counts non-archived issues, so closing does not free a slot -- only archiving does).

Result: 1 of 11 research tickets filed (VGC-275). The other 10 -- including three
P1 security/SEO defects -- are written up paste-ready in
.swarm/pending-tickets-17-08-26.md so nothing is lost.

Human action: archive the ~143 Done issues, or upgrade/start Linear's free trial.
Until then Goal B (compound the board) is blocked at the source.

## Final run tally
- Subagents dispatched: 14 of 25 cap (7 audit/research, 7 implementation)
- Commits: 12 (11 + this note), all on claude/loving-sagan-853anq
- Pushes to main: ZERO. Every push used the guard + explicit refspec, no --force.
- Gate on integrated tree: tsc cold PASS, vitest 520/520 PASS, next build PASS
- Rejected changes: NONE (no .swarm/rejected.md created)
- Merge conflicts: NONE (origin/main had not moved; post-commit merge was a no-op)
- PR: #74, DRAFT, https://github.com/MSS23/VGC-Team-Report/pull/74

## Discord
Sent OK (HTTP 204) via DISCORD_BUILDS_WEBHOOK using curl.
NOTE for future runs: python urllib gets Cloudflare 403 "error code: 1010" on the
Discord webhook (banned browser signature -- the Python-urllib UA). curl works.
Use curl for Discord in this container. The several .swarm/discord-failed-*.md
files from earlier runs are likely this same cause, not a bad webhook URL.

## Step 6B status integrity
All 7 implemented tickets are In Review with a closing comment. No ticket failed
the gate, so no ticket needed reverting to In Progress, and
.swarm/linear-status-failures.md was not created.
