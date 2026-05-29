# Discord Notification — Not Sent (no DISCORD_WEBHOOK_URL in env)

This nightly swarm container did not have a Discord webhook configured.
The payload below should be posted to channel 1487202217298493493 manually.

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 21 May 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-05-21", "inline": true },
      { "name": "Commits pushed", "value": "8", "inline": true },
      { "name": "Build status", "value": "✅ Passing", "inline": true },
      { "name": "Linear webhook", "value": "🔧 Fixed — header was x-linear-signature, Linear sends linear-signature. Re-enable webhook in Linear settings after merge.", "inline": false },
      { "name": "Linear tickets closed", "value": "None — Linear MCP unavailable this run (per-call approval needed). Implemented work is in code-audit categories, not in tickets.", "inline": false },
      { "name": "PostHog signals acted on", "value": "None (PostHog env not provided)", "inline": false },
      { "name": "Updates page", "value": "8 entries added under version 5.20 in May 2026 section", "inline": false },
      { "name": "Merge conflicts", "value": "None", "inline": false },
      { "name": "Rejected changes", "value": "None — every staged change passed tsc + build before commit", "inline": false },
      { "name": "PR", "value": "<add PR URL after creation>", "inline": false },
      { "name": "What was pushed", "value": "• Linear webhook header fix (P0)\n• Drop useScrollHide / ReactionBar / axios\n• Type catch errors as unknown in lib/\n• aria-labels for dashboard / bell / share modal\n• OG+Twitter cards for /feedback and /champions/[pokemon]\n• timingSafeEqual on /api/migrate; Zod on collaborators + collaborations\n• Memoize WarningPopover + PokemonCard derived lists\n• Updates page entry (v5.20)", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```
