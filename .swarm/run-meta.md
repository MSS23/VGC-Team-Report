# Swarm Run Metadata — 2026-05-25

Branch: swarm-nightly-2026-05-25
Created fresh from main at 2026-05-25T00:02Z

## Commits
1. VGC-WEBHOOK: fix Linear webhook handler (ed0558e)
2. swarm: SEO improvements + ExploreFilters i18n wiring (e1385a4)
3. swarm: accessibility fixes — ARIA attributes (f5559ce)
4. swarm: security hardening — timing-safe comparison (18a3709)
5. swarm: remove broken PWA manifest screenshots (92c6670)
6. swarm: remove dead code — useScrollHide + axios (0a9e7ac)
7. swarm: update changelog v5.20 (06cc25c)

## Wave 1 Subagents: 13 dispatched (R1-R8, C1-C5)
## Wave 2 Implementation: done inline (no additional subagents needed)

## Subagent Budget Used: 13 / 25

## Linear Webhook: FIXED in code (commit ed0558e)
- Human must verify LINEAR_WEBHOOK_SIGNING_SECRET in Vercel Production

## Discord: Will attempt notification in Step 5

## Updates Page: 7 entries added to May 2026 section (v5.20)
# Nightly Swarm Run Meta

- Date: 24 May 2026
- Branch: swarm-nightly-2026-05-24
- Branch newly cut from main (no existing branch for today)
- Run started: in progress

## PR
TBD

## Notes

## Run state at PR time

- Branch: swarm-nightly-2026-05-24
- Total commits this run: 12 (1 webhook fix + 10 implementation + 1 changelog)
- Subagents dispatched: 13 of 25 (8 Wave 1 + 5 Wave 2)
- Build status: ✅ tsc clean, next build clean
- Webhook health: 🔧 fixed in commit VGC-WEBHOOK

## Commits
$(git log --oneline origin/main..HEAD 2>/dev/null | sed 's/^/- /')
# Swarm Run Meta — 2026-05-21

- Branch: swarm-nightly-2026-05-21 (cut fresh from main)
- Linear MCP: UNAVAILABLE (requires per-call approval; no human-in-the-loop
  in this run). No Linear comments, ticket moves, or backlog filings done
  this run. PR body and final report call this out for the user.
- Discord webhook: env not provided (.env.local absent in this container).
  Notification payload will be saved to .swarm/discord-failed-21-05-26.md
  for the user to send manually.
- PostHog: env not provided. Skipped insights pull; logged in
  posthog-insights.md.

## Commits on this branch
1. VGC-WEBHOOK fix (linear-signature header) — P0
2. dead code removal (useScrollHide, ReactionBar, axios)
3. TypeScript catch hardening (5 catches in lib/)
4. a11y aria-labels (dashboard, notification bell, share modal)
5. SEO metadata (/feedback + /champions/[pokemon])
6. security defence-in-depth (migrate, collaborators, collaborations)
7. perf memoizations (Navbar WarningPopover, PokemonCard stats)
8. Updates page (changelog version 5.20)
