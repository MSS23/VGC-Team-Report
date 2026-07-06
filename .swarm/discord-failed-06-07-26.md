# Discord notification — FAILED to send (2026-07-06)

## Reason
- `DISCORD_BUILDS_WEBHOOK` / `DISCORD_WEBHOOK_URL` / `DISCORD_BOT_TOKEN` are not present in this session's environment (no `.env.local` — only `.env.example` is checked into the repo).
- The Discord API cannot be reached without one of these credentials.
- Channel ID `1487202217298493493` is the fixed target per the swarm task; unchanged.

## Payload the swarm would have sent

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 06 Jul 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "claude/optimistic-cerf-jmez32 (harness-designated)", "inline": true },
      { "name": "Commits pushed", "value": "10 (5 code + 5 swarm-scratch)", "inline": true },
      { "name": "Build status", "value": "✅ Passing (tsc + next build)", "inline": true },
      { "name": "Linear webhook", "value": "✅ healthy in code (audit inline, no fix commit needed)", "inline": false },
      { "name": "Linear tickets closed", "value": "None — Linear MCP unauthenticated this session", "inline": false },
      { "name": "PostHog signals acted on", "value": "None — PostHog credentials not available", "inline": false },
      { "name": "Updates page", "value": "6 entries added to July 2026 (v5.24) section", "inline": false },
      { "name": "Merge conflicts", "value": "None", "inline": false },
      { "name": "Rejected changes", "value": "None", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/67", "inline": false },
      { "name": "What was pushed", "value": "• Removed ~355 LOC dead code (DisplayTogglePill, useGlobalDisplayPrefs, ConsentGate)\n• WCAG 2.1 AA quick wins: aria-current on nav links, dialog semantics on shortcut + walkthrough overlays, breadcrumb aria-label/aria-current, Champions contrast fix\n• SEO: OG/Twitter blocks on /privacy and /terms; OG images on /champions; /compare noindex-vs-sitemap contradiction resolved\n• Reliability: DATABASE_URL fail-fast in src/lib/db.ts; i18n key fallback prevents literal 'undefined' rendering\n• Changelog updated (July 2026 v5.24)", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

## Manual replay when the human is at the terminal
```bash
source .claude/scripts/linear.sh   # loads DISCORD_BUILDS_WEBHOOK from .env.local
curl -s -X POST "$DISCORD_BUILDS_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d @.swarm/discord-payload-06-07-26.json
```
(Extract the JSON block above into that file first.)
