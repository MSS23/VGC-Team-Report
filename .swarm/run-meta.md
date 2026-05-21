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
