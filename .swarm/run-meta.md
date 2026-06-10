# Swarm Run Metadata

**Date:** 2026-06-10 (UK time)
**Branch:** swarm-nightly-2026-06-10
**Operator:** vgc-overnight-swarm

## Pre-flight
- Branch fresh from main (commit 8eb39cc)
- No existing PR for this branch
- No .env.local present in sandbox
- No Linear/Discord/PostHog/Vercel env vars exported
- Linear MCP unauthenticated; cannot complete OAuth in headless run
- Discord webhook URL unavailable
- PostHog API credentials unavailable

## Operational adjustments (documented for transparency)
1. **Linear MCP:** Cannot use; OAuth not completable headless. All `Linear MCP` steps in the prompt will be skipped, but research findings and ticket-equivalent work are filed to `.swarm/proposed-linear-tickets.md` for the human to bulk-create on review.
2. **PostHog data:** Cannot pull live; research subagents will cross-reference inferred error/UX patterns from code only.
3. **Vercel MCP:** Cannot reach; webhook env-var verification is code-only.
4. **Discord notification:** Will attempt webhook only if `DISCORD_WEBHOOK_URL` becomes available; otherwise payload saved to `.swarm/discord-failed.md`.
5. **Ticket implementations:** Without Linear access, Wave 2 budget is fully redirected to feature/quality work driven by the research synthesis.

