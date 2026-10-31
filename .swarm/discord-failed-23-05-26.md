# Discord notification — FAILED 23-05-26

**Reason:** Neither `DISCORD_WEBHOOK_URL` (`DISCORD_BUILDS_WEBHOOK`) nor `DISCORD_BOT_TOKEN` was set in the swarm container environment. `.env.local` is not provisioned. Both Method 1 (webhook URL) and Method 2 (bot token) were unreachable.

**Required human action:** post the payload below manually to Discord channel `1487202217298493493` (#builds), OR provision the credentials so future runs can post automatically (already filed as VGC-220 in a prior run).

## Channel
`1487202217298493493` (#builds)

## Payload (JSON-equivalent, copy into a webhook tester or post manually)

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 23 May 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-05-23", "inline": true },
      { "name": "Commits pushed", "value": "15", "inline": true },
      { "name": "Build status", "value": "✅ Passing (integrated tsc + next build green)", "inline": true },
      { "name": "Linear webhook", "value": "🔧 fixed in commit 7af7fb7 — re-enable in Linear settings after merge", "inline": false },
      { "name": "Linear tickets closed", "value": "VGC-214, VGC-216, VGC-218, VGC-219 → Done after PR merges", "inline": false },
      { "name": "PostHog signals acted on", "value": "None — POSTHOG_API_KEY unavailable in swarm container (VGC-220)", "inline": false },
      { "name": "Updates page", "value": "13 entries added to May 2026 / v5.20 section", "inline": false },
      { "name": "Merge conflicts", "value": "None — branch cut fresh from main tonight", "inline": false },
      { "name": "Rejected changes", "value": "None — every subagent passed tsc + build", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/37", "inline": false },
      { "name": "What was pushed", "value": "• Critical: Linear webhook header fix (was rejecting every delivery 401)\n• ~300 KB gzipped per-page perf win via @pkmn/dex client extract\n• Security: XSS escape in welcome + comment emails\n• Security: /api/user/saved share-access check\n• Security: verifyBearer() helper across 4 admin routes\n• Drop write-only shares.species[] column + await fire-and-forget SQL\n• a11y wins on share page, slide slider, ReportCard, NotificationBell, :focus-visible\n• PWA install prompt Android pageIsShort rescue\n• SEO breadcrumbs + AEO llms.txt freshness + FAQPage schema\n• html2canvas-pro dedupe (~60 KB gzip)\n• Dead code cleanup", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

## Curl command to post once credentials are available

```bash
# Webhook (preferred):
curl -s -X POST "$DISCORD_BUILDS_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d @.swarm/discord-failed-23-05-26.md  # extract the JSON block first

# Bot fallback:
curl -s -X POST "https://discord.com/api/v10/channels/1487202217298493493/messages" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '<same payload>'
```
