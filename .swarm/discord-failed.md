# Discord Notification — FAILED (no credentials)
Date: 2026-06-08
Channel: 1487202217298493493

Neither DISCORD_BUILDS_WEBHOOK nor DISCORD_BOT_TOKEN are available in this execution environment (fresh ephemeral container — `.env.local` is missing).

## Payload that would have been sent:

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 08 Jun 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-06-08", "inline": true },
      { "name": "Commits pushed", "value": "11 (incl. notes + changelog)", "inline": true },
      { "name": "Build status", "value": "✅ Passing", "inline": true },
      { "name": "Linear webhook", "value": "✅ healthy in code (no fix needed) — see .swarm/webhook-investigation.md", "inline": false },
      { "name": "Linear tickets closed", "value": "None (no Linear API access — no credentials in container)", "inline": false },
      { "name": "PostHog signals acted on", "value": "None (credentials unavailable)", "inline": false },
      { "name": "Updates page", "value": "12 entries added to June 2026 section (v5.23)", "inline": false },
      { "name": "Merge conflicts", "value": "None", "inline": false },
      { "name": "Rejected changes", "value": "None (clearPublishError useCallback skipped by W2A — passed as prop into excluded files)", "inline": false },
      { "name": "PR", "value": "swarm-nightly-2026-06-08 → main (URL pending after push)", "inline": false },
      { "name": "What was pushed", "value": "• Mechanical cleanups (orphan files, CreatorLink, PokemonDropdown key, useDarkMode toggle)\n• Sample-team save guard (all 3 samples) + MAX_SHARE_BODY_SIZE constant\n• Rate limits on /api/discord and /api/share/[id]/collaborators PATCH\n• TS strictness: asPokemonTypes narrow, JSON.parse runtime guards\n• SEO metadata trim + /privacy + /terms full embeds\n• Sitemap dedup + 10 long-tail URLs + modern AI crawlers in robots.txt\n• A11y: InstallPrompt modal, ConnectivityStatus live region, card focus rings\n• AbortController on DashboardContent + ReportCard fetches\n• /s/[id] BreadcrumbList + crawlable footer", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

## Action required (human)
Restore `.env.local` (or set the runner env vars) so future nightly swarms can post directly:
- `DISCORD_BUILDS_WEBHOOK` (preferred), or
- `DISCORD_BOT_TOKEN`

Same goes for `LINEAR_API_KEY` and `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` — without them the swarm cannot triage Linear, update tickets, file new ones, or cross-reference PostHog signals.
