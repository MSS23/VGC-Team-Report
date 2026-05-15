# Rejected Changes — 15-05-26 Swarm

## VGC-169: PostHog event naming standardization
- STATUS: NOT NEEDED — all 27 posthog.capture() calls already use consistent snake_case
- Wave 1 audit found 0 inconsistencies
- Ticket moved to Done in Linear post-run

## VGC-181: Indianapolis Regionals top-cut table update
- STATUS: SKIPPED — requires real tournament data not available programmatically
- L0 triage excluded per selection criteria

## npm run build
- STATUS: ENVIRONMENT LIMITATION — node_modules not present in sandbox
- Fallback: npx tsc --noEmit passed with zero new errors (only pre-existing env-level errors)
- Same approach as previous swarm runs (14-05-26, 13-05-26) which passed Vercel production build
