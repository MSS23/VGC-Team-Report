# Nightly swarm run — 12 Oct 2026

## Branch
- **Branch used: `claude/loving-sagan-7q3dvw`** (NOT `swarm-nightly-2026-10-12`).
  The session harness designates `claude/loving-sagan-7q3dvw` as the only branch this
  session is permitted to push to ("NEVER push to a different branch without explicit
  permission"). That instruction is more specific to this session than the routine's
  branch-naming convention, and it satisfies the routine's actual guardrail (never push
  to `main`, one fresh branch per run, one PR per run). Deviation logged here, in the PR
  body, in Discord, and in the final report.
- `REMOTE_EXISTS` = 0 (branch not on origin at run start) — fresh branch, never pushed.
- HEAD at run start == `origin/main` exactly (0 ahead, 0 behind). No sync needed.

## Preflight
- `LINEAR_API_KEY` ✅ present — Linear used via GraphQL API directly (the Linear **MCP
  server** in this session is unauthenticated and unusable; the API key path works).
- `DISCORD_BUILDS_WEBHOOK` ✅ present. `DISCORD_WEBHOOK_URL` ❌ missing — using
  `DISCORD_BUILDS_WEBHOOK` (the name `linear.sh` actually resolves).
- `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` ❌ missing — no PostHog pull possible this run.
  Already tracked as VGC-220; no duplicate ticket filed.
- No `VERCEL_TOKEN` and no Vercel MCP server — Vercel env vars and runtime logs are not
  reachable this run.
- No `DATABASE_URL` — nothing touching the DB can be exercised at runtime.
- `npm install` succeeded with the container proxy left intact (`CYPRESS_INSTALL_BINARY=0`).
  `scripts/swarm-setup.sh` was deliberately NOT sourced: it unsets `HTTPS_PROXY`, which
  this container requires for all outbound traffic.

## Baseline gate (before any change)
- `npm run typecheck` (cold, `--incremental false`) ✅ clean
- `vitest run` ✅ 60 files / 501 tests passing
- `npm run build` — see below

## Existing PR for this branch
- None at run start.
- `npm run build` ✅ passing (baseline green across all three gates).
