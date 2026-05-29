# Discord Notification FAILED — 2026-05-25

## Reason
Neither DISCORD_BUILDS_WEBHOOK nor DISCORD_BOT_TOKEN environment variables are available in this container.

## Payload (for manual posting to channel 1487202217298493493)
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 24 May 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-05-24", "inline": true },
      { "name": "Commits pushed", "value": "13", "inline": true },
      { "name": "Build status", "value": "✅ Passing (tsc + next build clean)", "inline": true },
      { "name": "Linear webhook", "value": "🔧 fixed in commit c1c1201 — header `linear-signature`, env-var fallback, force-dynamic. Re-enable in Linear settings after deploy.", "inline": false },
      { "name": "Linear tickets closed", "value": "VGC-209 (Pokemon filter chips on /explore) — ready for review", "inline": false },
      { "name": "PostHog signals acted on", "value": "None — .env.local not present in this sandbox (PostHog API key missing).", "inline": false },
      { "name": "Updates page", "value": "v5.20 added to May 2026 section (12 entries)", "inline": false },
      { "name": "Merge conflicts", "value": "None (branch cut fresh from main tonight)", "inline": false },
      { "name": "Rejected changes", "value": "None — every commit passed the build gate", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/38", "inline": false },
      { "name": "What was pushed", "value": "• Webhook fix: header name + env-var fallback\n• SECURITY: escape HTML in welcome + comment emails\n• SECURITY: timing-safe bearer compare on migrate/setup/cleanup\n• Bug: preserve is_unlisted on share re-POST dedup\n• i18n: fallback to English on empty translation stubs\n• VGC-209: Pokemon filter chips on /explore\n• ShareModal: team card preview at top\n• ShareModal: achievement-led share text\n• a11y: focus rings, aria-labels, 44px targets, kbd backdrops\n• SEO: BreadcrumbList JSON-LD on /explore /tournaments /creator\n• Cleanup: deleted useScrollHide + ReactionBar", "inline": false }
# Discord Notification — NOT SENT — 22 May 2026

**Reason:** Neither `DISCORD_WEBHOOK_URL` nor `DISCORD_BOT_TOKEN` is present in the swarm container environment. The container is a fresh clone without a populated `.env.local`. Per the orchestrator spec ("If both methods fail: Save the full payload to `.swarm/discord-failed.md`. Do NOT silently skip."), the payload is preserved below for a manual send by the user.

**Channel:** `1487202217298493493` (#builds)

**Payload (Discord webhook JSON):**

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
    "title": "🤖 Nightly Swarm — 22 May 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-05-22", "inline": true },
      { "name": "Commits pushed", "value": "13", "inline": true },
      { "name": "Build status", "value": "✅ Passing", "inline": true },
      { "name": "Linear webhook", "value": "🔧 fixed in commit f2121c3 — human must verify delivery + re-enable in Linear settings if auto-disabled", "inline": false },
      { "name": "Linear tickets implemented", "value": "VGC-208 (rental code in ShareModal), VGC-211 (Pikalytics dead code), VGC-WEBHOOK (signature handler). VGC-210 + VGC-212 were already implemented in 5.19 but never closed — will be closed via Linear MCP.", "inline": false },
      { "name": "PostHog signals acted on", "value": "None — POSTHOG_API_KEY not set in container", "inline": false },
      { "name": "Updates page", "value": "10 entries added to May 2026 section as v5.20", "inline": false },
      { "name": "Merge conflicts", "value": "None — branch was 0/0 vs main at start and push", "inline": false },
      { "name": "Rejected changes", "value": "None — all 12 code commits passed tsc + build", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/36", "inline": false },
      { "name": "What was pushed", "value": "Webhook signature fix; rental code copy block in ShareModal (VGC-208); Pikalytics dead code cleanup (VGC-211); weekly-digest cross-product stats fix; Save-toggle dedup + race fix; noindex collab ?key= URLs; 44x44 px touch targets; aria-labels on damage-calc + Explore controls; GraphQL teamId bound via variables; type-soundness on 7 helpers; 311 lines of dead exports removed.", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

## Action Required
Human should post this payload to Discord #builds channel manually, or the next swarm run with proper credentials will handle it.
**To send manually after the next deploy populates `.env.local` (or in any env that has the secrets):**

```bash
# Either via webhook (preferred):
curl -s -X POST "$DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  --data-binary @.swarm/discord-failed.json   # extract the JSON block above

# Or via bot token:
curl -s -X POST "https://discord.com/api/v10/channels/1487202217298493493/messages" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @.swarm/discord-failed.json
```
