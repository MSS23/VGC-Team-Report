# Discord Notification — fallback payload (send manually)

## Reason for fallback
No `DISCORD_BUILDS_WEBHOOK` env var or `.env.local` present in the swarm
container. No `DISCORD_BOT_TOKEN` either. The mandatory Discord notification
to channel ID `1487202217298493493` (#builds) could not be sent.

Send this manually, or run via `.claude/scripts/linear.sh` after restoring
`.env.local` on a workstation.

## Channel
`1487202217298493493` (#builds)

## Payload (Discord webhook JSON)

```json
{
  "embeds": [
    {
      "title": "🤖 Nightly Swarm — 05 Jun 2026",
      "color": 5763719,
      "fields": [
        { "name": "Branch", "value": "swarm-nightly-2026-06-05", "inline": true },
        { "name": "Commits pushed", "value": "19", "inline": true },
        { "name": "Build status", "value": "✅ Passing", "inline": true },
        { "name": "Linear webhook", "value": "🩹 Handler healthy in code — env-var mismatch suspected (P0 ticket queued)", "inline": false },
        { "name": "Linear tickets closed", "value": "VGC-WEBHOOK-OBSERVABILITY, VGC-DEAD-CODE-1, VGC-SEC1a, VGC-SEC1b, VGC-SEO1, VGC-A11Y-QW1, VGC-FEAT-POKEPASTE, VGC-TYPE (queued for human Linear update — see .swarm/linear-pending.md)", "inline": false },
        { "name": "PostHog signals acted on", "value": "None — POSTHOG_API_KEY not available in env this run", "inline": false },
        { "name": "Updates page", "value": "1 entry added (v5.23) to June 2026 section", "inline": false },
        { "name": "Merge conflicts", "value": "None", "inline": false },
        { "name": "Rejected changes", "value": "None — all 8 implementations passed tsc + build", "inline": false },
        { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/56", "inline": false },
        { "name": "What was pushed", "value": "• Webhooks: Linear handler now console.errors before returning 200\n• Code cleanup: 4 dead share-codec exports removed\n• Security: comment flags bound to Clerk userId / hashed IP (no more sessionId spoofing)\n• SEO: homepage title leads with 'VGC Team Builder 2026'\n• Security: profile API strict-validates social handles + avatarUrl hostname\n• Accessibility: focus-visible:ring-2 on PageNavbar Links + Toggle (WCAG 2.4.7)\n• Feature: paste a pokepast.es URL — we'll auto-import the team\n• TypeScript: tightened normalize-report + diff-state + pokepaste types", "inline": false }
      ],
      "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
    }
  ]
}
```

## Send commands (run after restoring credentials)

```bash
# Webhook (preferred)
curl -s -X POST "$DISCORD_BUILDS_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d @.swarm/discord-failed.md  # NOTE: extract the JSON block above into a file first

# OR bot token (fallback)
curl -s -X POST "https://discord.com/api/v10/channels/1487202217298493493/messages" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '<payload from above>'
```
