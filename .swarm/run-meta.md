# Run metadata — 2026-06-29

Branch: swarm-nightly-2026-06-29 (cut fresh from main, 0 ahead)
Started: $(TZ=Europe/London date)

## Environment constraints discovered

- **No .env.local file** — `LINEAR_API_KEY`, `DISCORD_BUILDS_WEBHOOK`, `POSTHOG_API_KEY` not available in this run.
- **Linear MCP not connected** to this session.
- **No Vercel MCP** in this session.
- Implication: cannot pull live Linear tickets, cannot pull PostHog insights via API, cannot post Discord webhook directly.
- Fallback strategy:
  - Use GitHub MCP to find candidate work (open branches, recent commits, issue references in code).
  - Skip live PostHog pull; note as gap in research synthesis.
  - Save Discord payload to `.swarm/discord-failed.md` for human action.
  - File Linear tickets via `.swarm/linear-pending.md` for human action.

## Webhook health check (Step 0C)

- Handler at `src/app/api/webhooks/linear/route.ts` — code is CORRECT:
  - Reads `LINEAR_WEBHOOK_SIGNING_SECRET` (with legacy fallback)
  - Uses raw `await request.text()` before parsing
  - HMAC-SHA256 hex digest, `timingSafeEqual` comparison
  - Returns 200 for empty body (setup ping), 200 for unknown event types
  - Returns 400 for missing signature, 401 for invalid signature
  - Catches and returns 200 on transient errors so Linear does not auto-disable
  - Has `export const dynamic = "force-dynamic"` and `runtime = "nodejs"`
- Verdict: **handler code is fine. Issue is almost certainly env-var mismatch in Vercel Production.**
- May 2026 changelog notes "8th consecutive fix proposal — please merge!" so prior runs have repeatedly suggested fixing this in code with no effect, which strongly supports the env-var diagnosis.
- Action: file P0 ticket in `.swarm/linear-pending.md` for human to verify `LINEAR_WEBHOOK_SIGNING_SECRET` in Vercel Production matches Linear's webhook settings.

## Updates page

- Located at `src/app/changelog/` (NOT `src/app/updates/`).
- Data file: `src/app/changelog/data.ts`.
- Format: entries are months ("June 2026", "May 2026") with a list of `{ type, text }` items.
- Current month entry: "June 2026" v5.23 — already exists. **Append to existing entry.**
Branch already existed — resuming swarm-nightly-2026-06-29 from clean start.
