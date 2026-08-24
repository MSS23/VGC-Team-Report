# Swarm run metadata — 24 Aug 2026

## Branch decision (DEVIATION — read this first)

The stored swarm prompt specifies a branch named `swarm-nightly-2026-08-24`.
This session's harness assigned a different working branch and instructs:
"NEVER push to a different branch without explicit permission."

Resolution: **all work lands on `claude/loving-sagan-zs6xpl`**, which was
already checked out and sat at exactly `origin/main` (0 ahead, 0 behind) at
run start — i.e. it is a fresh cut from main, satisfying the "one fresh
branch per run, cut from main" rule. The shared, non-negotiable guardrail —
never push to `main` — is honoured either way. The only deviation is the
branch *name*. Flagged in the PR body and Discord.

- REMOTE_EXISTS for `claude/loving-sagan-zs6xpl`: 0 at run start (never pushed)
- Divergence from origin/main at run start: 0 ahead / 0 behind
- Existing open PR for this branch at run start: none

## Preflight results

| Integration | Status |
|---|---|
| Linear API (`LINEAR_API_KEY`) | ✅ live via GraphQL/curl (Linear **MCP** is unauthenticated in this non-interactive session — used curl helpers in `.claude/scripts/linear.sh` instead) |
| Discord (`DISCORD_BUILDS_WEBHOOK`) | ✅ present |
| PostHog (`POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`) | ❌ absent — **entire PostHog data pull skipped this run** (tracked by VGC-220) |
| Vercel MCP / CLI token | ❌ absent — cannot inspect prod env vars or invocation logs |
| GitHub | ✅ via GitHub MCP (no `gh` CLI in this environment) |
| General web egress | ✅ WebSearch works |
| **Own domain** `pokemonvgcteamreport.com` | ❌ EGRESS_BLOCKED — no live-site audit possible; all site audits are static/repo-based |

Note: VGC-255 ("egress policy blocks every external data source") is now only
**partially** true — general web egress works; it is the project's own domain
that is blocked. Worth updating that ticket.

## Baseline gate (before any change)

- `npm run typecheck` (cold, `--incremental false`): ✅ exit 0
- `npm run build`: see `.swarm/` build log notes

## Step 0C — Linear webhook health check

Handler: `src/app/api/webhooks/linear/route.ts`. Audited against every point
in the Step 0C checklist:

| Check | Result |
|---|---|
| Secret from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | ✅ (with legacy `LINEAR_WEBHOOK_SECRET` fallback) |
| No hardcoded secret in source | ✅ none found |
| Raw body via `await request.text()` before JSON parse | ✅ |
| HMAC-SHA256 over raw bytes, hex | ✅ |
| Constant-time compare (`timingSafeEqual`) | ✅ (with length guard) |
| 200 valid / 401 invalid / 400 missing header | ✅ |
| Unknown event types → 200, not 500 | ✅ |
| Setup-time verification ping / empty body | ✅ handled |
| App Router: `POST` export + `dynamic = "force-dynamic"` | ✅ both present |
| No secret/PII logging | ✅ |

**Conclusion: the handler code is healthy. No code fix required this run.**
The residual risk is env-var/Linear-settings configuration, which the swarm
must never touch. This is already tracked by existing tickets — **VGC-222**,
**VGC-213** and **VGC-236** — so no duplicate P0 ticket was filed.
Human action required: confirm `LINEAR_WEBHOOK_SIGNING_SECRET` in Vercel
Production matches Linear's webhook config, then re-enable the webhook in
Linear settings.

## Board state at run start

100 open issues: 58 Backlog, 30 In Review, 12 Todo.

**The dominant finding:** 30 tickets are parked In Review and ~30
`swarm-nightly-*` branches sit unmerged on origin. Only 8 VGC identifiers
(VGC-64, 219, 243, 264, 266, 267, 272, 274) appear in main's recent history,
so roughly two thirds of the In Review pile is finished code stranded on
unmerged branches. VGC-265 (P1) already names this. See
`.swarm/board-blockage-24-08-26.md`.
