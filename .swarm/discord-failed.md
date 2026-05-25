# Discord Notification FAILED — 2026-05-25

## Reason
Neither DISCORD_BUILDS_WEBHOOK nor DISCORD_BOT_TOKEN environment variables are available in this container.

## Payload (for manual posting to channel 1487202217298493493)

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 25 May 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-05-25", "inline": true },
      { "name": "Commits pushed", "value": "8", "inline": true },
      { "name": "Build status", "value": "✅ Passing", "inline": true },
      { "name": "Linear webhook", "value": "🔧 fixed (commit ed0558e) — human must verify Vercel env var", "inline": false },
      { "name": "Linear tickets closed", "value": "None (webhook fix is infra, not a numbered ticket)", "inline": false },
      { "name": "PostHog signals acted on", "value": "None (credentials unavailable)", "inline": false },
      { "name": "Updates page", "value": "7 entries added to May 2026 section (v5.20)", "inline": false },
      { "name": "Merge conflicts", "value": "None", "inline": false },
      { "name": "Rejected changes", "value": "None", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/46", "inline": false },
      { "name": "What was pushed", "value": "• Linear webhook handler fixed (wrong env var + header)\n• SEO: /compare in sitemap, FAQ keywords, applicationCategory fix\n• i18n: ExploreFilters labels wired through translation system\n• A11y: ARIA attrs for navbar menu, role input, slide controls, calc sections\n• Security: timing-safe secret comparison in cleanup + migrate\n• PWA: remove broken manifest screenshot references\n• Dead code: remove useScrollHide hook + axios dependency\n• Changelog: v5.20 entry added", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

## Action Required
Human should post this payload to Discord #builds channel manually, or the next swarm run with proper credentials will handle it.
