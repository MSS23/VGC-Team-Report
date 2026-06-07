# Discord Notification — FAILED (no credentials)
Date: 2026-06-07
Channel: 1487202217298493493

Neither DISCORD_BUILDS_WEBHOOK nor DISCORD_BOT_TOKEN are available in this execution environment.

## Payload that would have been sent:

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 07 Jun 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-06-07", "inline": true },
      { "name": "Commits pushed", "value": "9", "inline": true },
      { "name": "Build status", "value": "✅ Passing", "inline": true },
      { "name": "Linear webhook", "value": "✅ healthy in code — defense-in-depth logging fix landed", "inline": false },
      { "name": "Linear tickets closed", "value": "None (no Linear API access)", "inline": false },
      { "name": "PostHog signals acted on", "value": "None (credentials unavailable)", "inline": false },
      { "name": "Updates page", "value": "10 entries added to June 2026 section (v5.23)", "inline": false },
      { "name": "Merge conflicts", "value": "None — branch was cut fresh from main with zero divergence", "inline": false },
      { "name": "Rejected changes", "value": "None — every commit passed tsc + next build", "inline": false },
      { "name": "PR", "value": "<set after gh pr create>", "inline": false },
      { "name": "What was pushed", "value": "• Linear webhook error logging + body typing\n• /api/explore q length cap (100 chars)\n• Bottom-nav: Team tab visible-first targeting fix\n• Bottom-nav: overflow sheet aria-modal + focus trap + restore\n• Bottom-nav: Mega toggle preserves auto state on agreement taps\n• Delete-account modal a11y hardening (dialog + focus + ESC)\n• ExploreFilters clear-search 44x44 touch target\n• aria-modal=true on InlinePokemonEditor + VersionHistoryPanel + WalkthroughOverlay\n• SwipeHint offset tied to --bottom-nav-height var\n• Removed dead code: DisplayTogglePill (267) + useGlobalDisplayPrefs (52) → -328 lines", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```
