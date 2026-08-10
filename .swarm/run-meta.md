# Swarm Run Meta — 2026-08-10

- Branch: `swarm-nightly-2026-08-10`
- REMOTE_EXISTS at start: 0 (fresh branch, cut from origin/main)
- Cut from: a70d924 origin/main
- Run start (UK): Mon Aug 10 01:14:32 BST 2026
- History mode: unpublished until first push (rebase permitted pre-push; merge-only after)

## Credential preflight
- LINEAR_API_KEY: present (GraphQL via .claude/scripts/linear.sh)
- DISCORD_BUILDS_WEBHOOK: present
- POSTHOG_API_KEY / POSTHOG_PROJECT_ID: MISSING — PostHog data pull skipped this run
- VERCEL_TOKEN / Vercel MCP: not available — Vercel env-var + log checks skipped
- Linear MCP server: requires interactive OAuth, unavailable headless — using REST/GraphQL via linear.sh instead
- gh CLI: not installed in this environment — GitHub operations go through the GitHub MCP server
