# Swarm run meta — 02-11-26

- Branch: `swarm-nightly-2026-11-02` (cut fresh from `origin/main` @ 10dfd74)
- REMOTE_EXISTS at start: **0** — branch did not exist on origin. Fresh history until first push.
- Existing open PR for this branch at start: **none**
- AHEAD=0 BEHIND=0 vs origin/main at run start. Working tree clean.
- Linear: ✅ LINEAR_API_KEY present. Discord: ✅ DISCORD_BUILDS_WEBHOOK present.
- PostHog: ❌ no POSTHOG_API_KEY / POSTHOG_PROJECT_ID, and app.posthog.com is egress-blocked.
- Vercel: ❌ no VERCEL_TOKEN and no Vercel MCP — deployment/env/log checks impossible.

## Egress policy finding (drives Wave 1 sizing)

The agent proxy gateway answers **403 to CONNECT** for every host outside a narrow
allowlist. Probed and denied: `www.reddit.com`, `app.posthog.com`, `pikalytics.com`,
and even `pokemonvgcteamreport.com` (our own production site). Reachable:
`api.linear.app`, `registry.npmjs.org`, GitHub via the preconfigured `gh` CLI.

Consequence: Wave 1 research agents R1, R2, R3, R4, R5 and R7 (competitor teardowns,
Reddit/Twitter sentiment, mobile-UX benchmarking, AEO/GEO citation scan) **cannot
reach any of their data sources**. Running them would have produced recollection
dressed as research, and filed Backlog tickets on top of a board that already holds
63 `auto-research` items. They were deliberately NOT dispatched.

The budget was reallocated to implementation, consistent with the run's stated
priority (GOAL A — drain the board — above GOAL B — compound it). This is tracked
by existing P1 ticket **VGC-255** ("Swarm container egress policy blocks every
external data source").

## Board state at run start

- 129 open issues: 71 Backlog, 56 In Review, 1 Todo, 1 Duplicate.
- **0 open Bug-labelled tickets in Backlog/Todo. 0 In Progress.**
- 22 Backlog/Todo tickets carry `no-claude` and are non-bugs → skipped entirely.
- 56 tickets sit In Review from prior runs while `origin` holds only `main`
  (every prior nightly branch has been merged and deleted). Those tickets are
  almost certainly shipped but were never moved to Done. Per the status-integrity
  guardrail the swarm does NOT move them; this is the human transition, and it is
  what P1 ticket **VGC-265** is about.

## Wave 1 dispatched (7 agents)

C1 dead code · C2 TypeScript strictness · C3 bundle/perf · C4 security ·
C5 last-20-commit review · R6 SEO (repo-only, live site unreachable) ·
R8 accessibility (static analysis).
