# Rejected Changes — 16-05-26 Swarm

## VGC-181: Indianapolis Regionals top-cut table
- **Reason**: Event is scheduled May 29–31, 2026 — has not happened yet. No real data available.
- **Action**: Deferred. Leave placeholder TBD data in src/data/indy-top-cut.ts.

## VGC-187: PWA screenshots for enhanced install dialog
- **Reason**: Requires real browser screenshots. Cannot be captured in this headless environment.
- **Action**: Deferred. Requires manual capture from a running browser session.

## VGC-174: Web Share API
- **Reason**: Already fully implemented (canNativeShare, handleNativeShare, share_native_used event).
- **Action**: Linear ticket closed as already Done.

## Next.js upgrade (16.2.2 → 16.2.6)
- **Reason**: Package.json change requires npm install + full build re-test. Filed as urgent Linear ticket.

---

# Previous: Rejected Changes — 15-05-26 Swarm

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
