# Swarm run meta — 21 Sep 2026

## Branch

`claude/loving-sagan-sp9n85` — the harness-designated branch for this session.

Deviation from the routine prompt (which specifies `swarm-nightly-YYYY-MM-DD`), for two reasons:

1. This session's environment pins pushes to `claude/loving-sagan-sp9n85` and forbids
   pushing elsewhere without explicit permission.
2. It matches established practice: the last six nightly runs (PRs #72–#78) all used
   harness `claude/...` branches, not `swarm-nightly-*`. The last `swarm-nightly-*`
   branch was 2026-08-10.

Guardrail intent is preserved: one fresh branch cut from `main`, never `main` itself,
exactly one PR. At run start the branch was 0 ahead / 0 behind `origin/main`.

REMOTE_EXISTS = 1 (branch pre-created by the harness, at main). Merge-only mode; no rebase.

## Integration preflight

| Integration | Status | Notes |
|---|---|---|
| Linear GraphQL API | ✅ via curl | `LINEAR_API_KEY` valid; viewer resolves. Used instead of Linear MCP. |
| Linear MCP | ❌ unauthenticated | Needs OAuth in an interactive session. REST used instead — no loss. |
| GitHub | ✅ via MCP | No `gh` CLI in this container; `mcp__github__*` used for PR ops. |
| WebSearch / WebFetch | ✅ | Routes via Anthropic, bypassing the container proxy. |
| Discord `#builds` | ⚠️ webhook present | `DISCORD_BUILDS_WEBHOOK` set (121 ch). `DISCORD_WEBHOOK_URL` unset — used the BUILDS var. |
| PostHog | ❌ creds absent | `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` unset. Skipped for the whole run. Tracked by VGC-220. |
| Vercel MCP / CLI | ❌ unavailable | No Vercel MCP tool, no `VERCEL_TOKEN`. Env-var inspection impossible. |
| Production site | ❌ blocked | Proxy gateway 403s CONNECT to `pokemonvgcteamreport.com`. Tracked by VGC-255. |

`scripts/swarm-setup.sh` was deliberately NOT sourced: it unsets `HTTPS_PROXY`, but in this
container the proxy is required for outbound HTTPS (Linear/GitHub work only through it).
Its other effect (`CYPRESS_INSTALL_BINARY=0`) was unnecessary — `npm install` succeeded clean.

## Baseline (before any change)

- `npm run typecheck` → exit 0
- `npm run build` → exit 0

## The dominant finding

VGC-265 (Urgent) — "~30 unmerged nightly branches and 10 tickets stuck In Review" — is
real and has grown:

- 36 remote branches unmerged into `main`; 22 of them stale `swarm-nightly-*`.
- 6 open draft PRs, all titled "swarm: nightly improvements", none reviewed:
  #78 (14-09), #77 (07-09), #76 (31-08), #75 (24-08), #74 (17-08), #72 (03-08).
  The last merged swarm PR was #73 on 10-08.
- 32 Linear tickets sit In Review. Several (VGC-264/266/267/272/274) have commits
  already on `main`, so the board is understating what is actually shipped.
- `.swarm/` already holds 145 research files from prior runs.

Conclusion driving tonight's allocation: the binding constraint on this project is
human review/merge capacity, not agent implementation throughput. Dispatching ~24
agents to produce more unreviewed code and more unread research would worsen the exact
problem the board flags as Urgent. This run therefore spends a reduced agent budget,
weighted towards (a) reconciling the board and (b) a small number of verified-unimplemented
fixes, and it leads the PR with a triage plan rather than volume.

## Agent budget (cap 25)

Deliberately under-spent. Consolidated 13 planned Wave-1 agents into 3.
