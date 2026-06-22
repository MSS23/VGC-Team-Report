# Discord notification — DELIVERY FAILED (22 June 2026)

## Reason
Neither `DISCORD_WEBHOOK_URL` nor `DISCORD_BOT_TOKEN` is present in this swarm environment. `.env.local` does not exist; only `.env.example`. The `discord_notify_build` helper in `.claude/scripts/linear.sh` cannot resolve `DISCORD_BUILDS_WEBHOOK` so the cURL POST would silently fail.

Same gap as the 28 May run and prior — recurring issue.

## Channel
`1487202217298493493` (#builds)

## Payload that should have been posted

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 22 Jun 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-06-22", "inline": true },
      { "name": "Commits pushed", "value": "5", "inline": true },
      { "name": "Build status", "value": "✅ Passing (tsc + next build)", "inline": true },
      { "name": "Linear webhook", "value": "✅ healthy — handler code verified correct; env-var verification at Vercel still recommended", "inline": false },
      { "name": "Linear tickets closed", "value": "None — no Linear API key in swarm environment, could not pull In Progress board", "inline": false },
      { "name": "PostHog signals acted on", "value": "None — no POSTHOG_API_KEY in swarm environment", "inline": false },
      { "name": "Updates page", "value": "1 entry (changelog 5.23) added to June 2026 section", "inline": false },
      { "name": "Merge conflicts", "value": "None — branch was 0 behind origin/main throughout the run", "inline": false },
      { "name": "Rejected changes", "value": "None — all integrated commits passed tsc + build", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/65", "inline": false },
      { "name": "What was pushed", "value": "• Dropped 3 internal-only export keywords + deleted useGlobalDisplayPrefs hook (zero call sites)\n• Tightened types on discordFetch (now generic) and pokepaste fetch (PokePasteResponse interface)\n• Extracted reusable useFocusTrap hook; applied to InlinePokemonEditor modal (WCAG 2.4.3)\n• Changelog 5.23 entry for June 2026\n• Swarm research notes + audit reports for follow-up triage", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

## Recommended human action
Post the payload above to `#builds` manually, or expose `DISCORD_BUILDS_WEBHOOK` (or `DISCORD_WEBHOOK_URL` / `DISCORD_BOT_TOKEN`) to the overnight swarm environment so future runs notify automatically.
