# Discord notification failure — 20-07-26

## Reason
`DISCORD_WEBHOOK_URL` env var not set. `.env.local` is not present in this session container. `DISCORD_BOT_TOKEN` also unavailable, so the fallback path was also inaccessible. No Discord MCP tool is exposed to this session.

## Channel
`1487202217298493493` (#builds).

## Intended payload (would have been posted)

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 20 Jul 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-07-20", "inline": true },
      { "name": "Commits pushed", "value": "15 (8 code + 6 audit notes + 1 pre-flight)", "inline": true },
      { "name": "Build status", "value": "✅ Passing (tsc --noEmit + next build green on every commit)", "inline": true },
      { "name": "Linear webhook", "value": "✅ healthy in code — env-var parity is a human check", "inline": false },
      { "name": "Linear tickets closed", "value": "None — Linear API key not available in session container", "inline": false },
      { "name": "PostHog signals acted on", "value": "None — PostHog credentials not available in session container", "inline": false },
      { "name": "Updates page", "value": "11 entries added to July 2026 section as v5.25", "inline": false },
      { "name": "Merge conflicts", "value": "None — branch 0 behind main at push", "inline": false },
      { "name": "Rejected changes", "value": "None", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/69 (draft)", "inline": false },
      { "name": "What was pushed", "value": "• HIGH security: /api/team-graphic gated on share visibility\n• CSRF constant-time compare + profile handle/avatar validation\n• A11y: InstallPrompt dialog semantics + NotificationBell 44×44\n• Perf: weekly cron parallelised (~900ms saved), bot summary parallelised (200-400ms)\n• SEO: sitemap lastModified restored on static entries\n• Types: return types on 8 hot server helpers\n• Cleanup: ~412 LoC dead code removed\n• Changelog v5.25 entries", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

## Action for human
Post the above payload to #builds manually (or ensure the runner has `DISCORD_WEBHOOK_URL` for future runs).
