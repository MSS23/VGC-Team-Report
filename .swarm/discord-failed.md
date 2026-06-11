# Discord notification — DELIVERY FAILED

`DISCORD_BUILDS_WEBHOOK` is not available in this sandboxed container
(`.env.local` is gitignored and absent from the swarm runner). Neither
the webhook URL nor a `DISCORD_BOT_TOKEN` was reachable for the bot-API
fallback. The notification payload for the mandatory `#builds` channel
(ID `1487202217298493493`) is preserved below so the human can either
post it manually or set up the webhook secret on the next swarm run.

## Channel
- Discord channel ID: `1487202217298493493` (#builds)

## Method attempted
- Method 1 (webhook URL): `DISCORD_BUILDS_WEBHOOK` env var not set → skipped.
- Method 2 (bot token): `DISCORD_BOT_TOKEN` env var not set → skipped.
- Outcome: payload saved here for human review (per Step 5 fallback protocol).

## Payload (paste into Discord manually if desired)

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 11 Jun 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-06-11", "inline": true },
      { "name": "Commits pushed", "value": "17", "inline": true },
      { "name": "Build status", "value": "✅ Passing", "inline": true },
      { "name": "Linear webhook", "value": "✅ handler code is correct in source — env-var verification still pending (human action)", "inline": false },
      { "name": "Linear tickets closed", "value": "None — Linear API unreachable from this run (no .env.local). See PR body for proposed backlog tickets that need human filing.", "inline": false },
      { "name": "PostHog signals acted on", "value": "None (no PostHog credentials in container).", "inline": false },
      { "name": "Updates page", "value": "11 entries added to the new June 2026 v5.23 changelog section.", "inline": false },
      { "name": "Merge conflicts", "value": "None — branch was cut fresh from main, BEHIND=0 throughout.", "inline": false },
      { "name": "Rejected changes", "value": "A4 (CookieBanner lazy-load) and 5 motion/react dead-import deletions did not persist to disk despite agent claims. Re-attempt next run. See .swarm/rejected.md.", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/62", "inline": false },
      { "name": "What was pushed", "value": "• Fix /s/[id] self-canonical (was inheriting / from layout — Google was dropping shares)\n• Dedupe /compare in sitemap.ts\n• Add Regulation H + Worlds 2026 keywords to /explore\n• robots.txt explicit Allow for Google-Extended, Applebot-Extended, anthropic-ai, CCBot, Perplexity-User, cohere-ai\n• BreadcrumbList JSON-LD + aria-label on /champions/[pokemon]\n• FAQPageJsonLd on /champions (4 Reg M-A questions)\n• Compare page a11y: label htmlFor/id, role=alert, placeholder contrast lift\n• PageNavbar a11y: aria-current + stateful dark-mode label\n• Security: escape %, _ in /api/creator/[name] ILIKE binds\n• Bundle: lazy-load Clarity, named Sentry import", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```
