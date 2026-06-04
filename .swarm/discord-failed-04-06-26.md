# Discord Notification — FAILED (not sent) — 2026-06-04

## Reason

`DISCORD_WEBHOOK_URL` / `DISCORD_BUILDS_WEBHOOK` are unavailable in this session container. `.env.local` is missing and the runtime environment exposes no Discord-related env vars. Bot-token fallback (`DISCORD_BOT_TOKEN`) is also unavailable.

Per the swarm protocol Step 5C fallback: save the full payload below to `.swarm/discord-failed-*.md` and surface in the final report so the human can post manually.

## Target channel

`1487202217298493493` (#builds) — hardcoded per protocol.

## Payload (would have been POSTed to webhook URL)

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 4 Jun 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-06-04", "inline": true },
      { "name": "Commits pushed", "value": "4 (+1 notes pending)", "inline": true },
      { "name": "Build status", "value": "✅ Passing (tsc + next build)", "inline": true },
      { "name": "Linear webhook", "value": "✅ handler code correct; ⚠️ env-var issue on Vercel — human action required (see PR body and `.swarm/drafts/linear-tickets-04-06-26.md` P0 ticket)", "inline": false },
      { "name": "Linear tickets closed", "value": "None — Linear MCP requires OAuth (user asleep) and LINEAR_API_KEY env var missing. Board could not be queried tonight.", "inline": false },
      { "name": "PostHog signals acted on", "value": "N/A — POSTHOG_API_KEY missing", "inline": false },
      { "name": "Updates page", "value": "1 entry added to June 2026 section (version 6.1, 7 items: SEO dedup, /compare canonical+robots, Breadcrumb JSON-LD on 4 pages, /dashboard disallow, /api/share+/api/explore Promise.all parallelization, ConsentGate dead-code removal)", "inline": false },
      { "name": "Merge conflicts", "value": "None — branch cut fresh from main 1a30839", "inline": false },
      { "name": "Rejected changes", "value": "None", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/55", "inline": false },
      { "name": "What was pushed", "value": "• SEO: removed duplicate /compare entry from sitemap\n• SEO: /compare canonical + robots fix (noindex+nofollow)\n• SEO: BreadcrumbList JSON-LD on /compare, /feedback, /privacy, /terms\n• SEO: Disallow /dashboard/ in robots.txt\n• Perf: Promise.all parallelization in /api/share/[id]\n• Perf: Fork-lineage query batched into /api/explore Promise.all\n• Dead-code: deleted orphan ConsentGate component\n• Updates page: June 2026 version 6.1 entry\n• Meta: bumped public/llms.txt 'Updated' date to 2026-06-04", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

## To send manually

```bash
# After restoring .env.local with DISCORD_BUILDS_WEBHOOK or DISCORD_WEBHOOK_URL:
source .claude/scripts/linear.sh
curl -s -X POST "$DISCORD_BUILDS_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d @.swarm/discord-failed-04-06-26.payload.json
```

(Extract just the `{ "embeds": [...] }` block above into the payload file.)
