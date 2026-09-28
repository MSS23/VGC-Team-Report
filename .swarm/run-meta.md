# Swarm run meta — 28 Sep 2026

## Branch
- Branch: `claude/loving-sagan-c7sclx`
- REMOTE_EXISTS at start: 0 (fresh, not on origin) — cut from `origin/main` @ 70c4633
- AHEAD=0 BEHIND=0 vs origin/main at start
- **Naming deviation (deliberate):** the scheduled prompt specifies
  `swarm-nightly-YYYY-MM-DD`, but this session's harness config designates
  `claude/loving-sagan-c7sclx` and forbids pushing elsewhere. All 7 existing open
  swarm PRs (#72-#79) also use `claude/loving-sagan-*`, so this name matches the
  established precedent. Functional requirements are unchanged: one fresh branch
  off main, never main, one draft PR.

## Integration availability (preflight)
- LINEAR_API_KEY: PRESENT -> Linear ops via direct GraphQL (Linear MCP needs OAuth, unavailable)
- DISCORD_BUILDS_WEBHOOK: PRESENT -> Discord notify available
- POSTHOG_API_KEY / POSTHOG_PROJECT_ID: **MISSING** -> all PostHog steps SKIPPED for whole run
- VERCEL_TOKEN / Vercel MCP: **MISSING/absent** -> cannot read prod env vars or invocation logs
- gh CLI: absent -> PR via GitHub MCP

## Baseline gate (green before any change)
- tsc --noEmit --incremental false: PASS (16s)
- npm run build: PASS (42s)
- vitest: PASS (41 files / 417 tests)

## HEADLINE FINDING: merge backlog, not implementation backlog
7 open DRAFT swarm PRs, none merged:
#72 (03-08), #74 (17-08), #75 (24-08), #76 (31-08), #77 (07-09), #78 (14-09), #79 (21-09)
- 200 distinct source files changed across them
- `src/app/changelog/data.ts` is touched by ALL SEVEN -> they already conflict with each other
- 32 Linear tickets sit In Review because their code is in these unmerged PRs
=> Tonight's run keeps its diff deliberately small and avoids the 200-file
   overlap set where possible, so it is reviewable rather than adding to the pile.

## Outcome — 28 Sep 2026

- Branch: `claude/loving-sagan-c7sclx`, pushed via guarded refspec `$BRANCH:refs/heads/$BRANCH`
- **Zero pushes to main.** Push guard asserted before every push.
- PR: https://github.com/MSS23/VGC-Team-Report/pull/80 — created once, as a DRAFT
- 8 commits. Final gate: tsc 0 errors, vitest 45 files / 476 tests, build exit 0, eslint clean
- Post-commit sync: `origin/main` had not moved (BEHIND=0) -> merge was a no-op. No conflicts all run.
- Rejected changes: none (nothing failed the gate)
- Subagents dispatched: 8 of the 25 cap (all Wave 1, read-only). Wave 2 ran inline — see below.

### Subagent budget: why 8 and not 25

Wave 1 trimmed 13 -> 8. The board holds 46 unactioned `auto-research` tickets and
`.swarm/drafts/` holds ~40 unsent marketing drafts from prior runs (five separate
Reddit outreach drafts, four creator-outreach). More research would have added to a
pile nobody is drawing down, against Goal A's stated priority.

Wave 2 dispatched **zero** implementation subagents, because there was nothing to
dispatch them at:

- **Zero bugs were implementable.** All 7 open Bug tickets are already In Review —
  i.e. already fixed in the 7 unmerged PRs.
- The remaining eligible pool (53 tickets) is large features (damage calculator,
  i18n scaffold, Stripe, realtime collab, native app), human-gated infra (run SQL
  against production; set Vercel env vars), or marketing/outreach which is
  draft-only by guardrail.
- The one big product gap — Reg M-C — is **already implemented on PR #78**.
  Re-doing it is the exact waste VGC-265 describes.

So the work that mattered came from the Wave 1 audits, and was implemented inline
(6 fixes) rather than delegated. Every fix's regression test was verified to FAIL
against the old code before being accepted.

### Linear: Goal B blocked by workspace limit

`issueCreate` returns `USAGE_LIMIT_EXCEEDED` — the workspace has exceeded its free
issue limit, so **no new issues can be created at all**. Commenting and transitions
still work.

- 0 new tickets filed (11 written up in `tickets-to-file-28-09-26.md` instead)
- 0 PostHog-sourced tickets (no credentials — VGC-220)
- Comments posted: **VGC-213** (webhook root cause + fix + what still needs a human),
  **VGC-253** (three exploits from one schema gap), **VGC-265** (measured merge graph)
- **0 status transitions**, correctly: no board ticket was implemented this run, so
  nothing was eligible to move to In Review. Nothing was moved to Done (never).

### Integrations skipped for the whole run (per preflight, not retried)
- PostHog: no POSTHOG_API_KEY / POSTHOG_PROJECT_ID
- Vercel: no VERCEL_TOKEN, no Vercel MCP -> prod env vars and invocation logs unreadable
- Linear MCP: needs OAuth -> used direct GraphQL throughout
- WebFetch: egress-blocked; Reddit refuses Anthropic's crawler -> community sentiment
  returned ZERO quotes rather than fabricated ones. Unevidenced, not absent.
