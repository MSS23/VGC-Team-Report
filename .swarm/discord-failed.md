# Discord notification — FAILED to send 12-06-2026

**Reason:** Neither `DISCORD_WEBHOOK_URL` / `DISCORD_BUILDS_WEBHOOK` nor `DISCORD_BOT_TOKEN` are present in the swarm execution environment. No `.env.local` file. No fallback worked.

**Channel ID:** `1487202217298493493` (#builds — fixed per guardrail)

Per guardrail this must not be silently skipped — the payload is preserved below so the human can post it manually if desired.

## Payload that would have been sent

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 12 Jun 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-06-12", "inline": true },
      { "name": "Commits pushed", "value": "12", "inline": true },
      { "name": "Build status", "value": "✅ Passing (tsc + next build green)", "inline": true },
      { "name": "Linear webhook", "value": "⚠️ env-var issue — human action required (handler code healthy, Vercel secret likely mismatched). See PR body + drafts/p0-webhook-env-mismatch.md.", "inline": false },
      { "name": "Linear tickets closed", "value": "None this run — Linear MCP unavailable (no OAuth). Work driven from prior triage + fresh audits. 7 draft tickets in .swarm/drafts/ for human to file.", "inline": false },
      { "name": "PostHog signals acted on", "value": "None — credentials not in env (recurring; see drafts/infra-posthog-credentials.md).", "inline": false },
      { "name": "Updates page", "value": "9 entries added to June 2026 section (version 5.23).", "inline": false },
      { "name": "Merge conflicts", "value": "None.", "inline": false },
      { "name": "Rejected changes", "value": "None.", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/63", "inline": false },
      { "name": "What was pushed", "value": "• Explore feed likes no longer drop past position 60 (chunked client lookup)\n• /api/comments/flag now requires Clerk auth (closes session-rotation abuse)\n• /compare sitemap dedup + contradictory noindex removed\n• InstallPrompt + WhatsNewModal + ShortcutHintOverlay: dialog/focus-trap/Escape/restore\n• Light-mode --text-tertiary #5E5E7A → #4E4E62 (WCAG AA pass)\n• /privacy + /terms now ship openGraph + twitter metadata\n• /creator/[name] now emits BreadcrumbList JSON-LD\n• 6 TS strictness gaps closed (return types + cast removals)\n• ~370 lines of confirmed-dead code deleted (ConsentGate, DisplayTogglePill, useGlobalDisplayPrefs)", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

## How to send manually

```bash
# If you have a webhook URL set:
curl -X POST "$DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '<the embeds object above>'

# Or with a bot token:
curl -X POST "https://discord.com/api/v10/channels/1487202217298493493/messages" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '<the embeds object above>'
```
