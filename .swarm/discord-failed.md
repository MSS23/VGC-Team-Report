# Discord notification — FAILED (no credentials) — 2026-06-09

Channel: 1487202217298493493 (#builds)

Neither `DISCORD_BUILDS_WEBHOOK` (the project's documented env var, read by `.claude/scripts/linear.sh`) nor `DISCORD_WEBHOOK_URL` / `DISCORD_BOT_TOKEN` are available in this execution environment. No `.env.local` exists.

The notification was not sent. Below is the JSON payload that would have been sent (via webhook method, preferred):

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 09 Jun 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-06-09", "inline": true },
      { "name": "Commits pushed", "value": "7", "inline": true },
      { "name": "Build status", "value": "✅ Passing (tsc + next build green)", "inline": true },
      { "name": "Linear webhook", "value": "⚠️ env-var issue — human action required (handler code correct)", "inline": false },
      { "name": "Linear tickets closed", "value": "None — Linear API key not available in this swarm container", "inline": false },
      { "name": "PostHog signals acted on", "value": "None — no credentials", "inline": false },
      { "name": "Updates page", "value": "9 entries added to June 2026 / v5.23 section in /changelog", "inline": false },
      { "name": "Merge conflicts", "value": "None — branch cut fresh from main", "inline": false },
      { "name": "Rejected changes", "value": "None — all attempted changes landed (some via subagent direct edits, others re-applied by orchestrator after subagent rollbacks)", "inline": false },
      { "name": "PR", "value": "<filled in after gh pr create>", "inline": false },
      { "name": "What was pushed", "value": "• Security HIGH: collections per-share access checks + private-field redaction\\n• Security MED: versions revert + version-detail accepted-status gate\\n• Cron telemetry: weekly-digest .catch logs per-recipient failure\\n• Perf: dynamic VersionHistoryPanel in Navbar\\n• SEO: deduped /compare in sitemap; /tournaments + /champions in footer nav; full /privacy & /terms metadata\\n• A11y: ShortcutHintOverlay dialog, ConnectivityStatus aria-live, input aria-labels, ThemePicker pressed state\\n• TS: explicit return types on 6 exported lib functions\\n• Dead code: ~404 lines removed across 4 files; 3 dead i18n consts; 3 dead i18n keys × 7 locales; jspdf npm dep dropped", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

Action required: when env vars are provisioned, the next swarm run will send this kind of payload automatically.
