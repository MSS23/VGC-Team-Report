# Discord notification — NOT SENT (2026-08-02)

The mandatory build notification to channel `1487202217298493493` (#builds)
could not be delivered. **Both** documented methods are unavailable in this
container:

- **Method 1 (webhook):** `.claude/scripts/linear.sh` sources
  `DISCORD_BUILDS_WEBHOOK` from `$PROJECT_ROOT/.env.local`. That file does not
  exist in this fresh clone (`.gitignore` excludes `.env*.local`, correctly).
  The routine's `DISCORD_WEBHOOK_URL` variable is also unset.
- **Method 2 (bot token):** `DISCORD_BOT_TOKEN` is unset.

This is a **standing environment gap, not a transient failure** — there are ten
prior `discord-failed-*.md` files in this directory from earlier runs. The
nightly container has never been given Discord credentials. To fix it
permanently, inject `DISCORD_BUILDS_WEBHOOK` (or `DISCORD_WEBHOOK_URL`) into the
scheduled task's environment.

## Payload that would have been sent

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 02 Aug 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "claude/gallant-bohr-nycyuh", "inline": true },
      { "name": "Commits pushed", "value": "8", "inline": true },
      { "name": "Build status", "value": "✅ Passing (tsc 0, vitest 279/279, next build 0)", "inline": true },
      { "name": "Linear webhook", "value": "✅ healthy — handler already correct on main; routine's P0 is stale", "inline": false },
      { "name": "Tickets implemented", "value": "None — Linear unreachable (no OAuth, no LINEAR_API_KEY). 16 proposed tickets written to .swarm/new-tickets-to-file-02-08-26.md for manual filing.", "inline": false },
      { "name": "PostHog signals acted on", "value": "None — POSTHOG_API_KEY / POSTHOG_PROJECT_ID unset", "inline": false },
      { "name": "Updates page", "value": "6 entries added to August 2026 (v5.26)", "inline": false },
      { "name": "Merge conflicts", "value": "None", "inline": false },
      { "name": "Rejected changes", "value": "None — all 6 implementation agents passed the gate", "inline": false },
      { "name": "⚠️ Needs a human", "value": "21 open draft PRs (#50–#70) have never been merged, going back to 31 May. The bottleneck is review throughput, not code generation.", "inline": false },
      { "name": "What was pushed", "value": "• Private reports can no longer be rendered as shareable PNGs via /api/team-graphic\n• Stray blank lines and '=== Team ===' headers no longer become a phantom 7th Pokémon\n• An out-of-union type (MissingNo. 'Bird') no longer white-screens the report\n• Champions SP conversion now reflects actual EV investment; 0/66 SP no longer shows a green all-clear\n• Game-plan delete is now keyboard and screen-reader accessible\n• Stat-caption dismiss button no longer swallows taps on stat rows", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```
