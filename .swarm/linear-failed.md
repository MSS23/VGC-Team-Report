# Linear API — NOT REACHABLE (2026-06-09)

`LINEAR_API_KEY` is not present in the sandbox env (no `.env.local`). Linear MCP requires interactive OAuth flow that cannot complete in an unattended overnight run.

Therefore the following Linear operations described in Step 6 of the swarm spec were NOT performed:

## Skipped: comment + state transition on implemented tickets

Tonight's commits do not reference specific `VGC-XX` ticket identifiers because the swarm was unable to query the board for In Progress tickets to pick from. The work was driven entirely off Wave 1 code audits. Items addressed map to recurring themes from prior swarm runs:

- Security: collections access leak (HIGH), version revert collaborator gating (MED)
- Performance: VersionHistoryPanel dynamic import
- SEO: sitemap dedup, footer nav additions, privacy/terms metadata
- A11y: dialog semantics, aria-live, input labels, theme picker pressed state
- TypeScript: explicit return types on 6 lib functions
- Dead code: DisplayTogglePill, useGlobalDisplayPrefs, ConsentGate, asPokemonTypes, exportAsPdf, dead i18n keys/maps, jspdf dep

A human reviewer on Linear should:
1. Map these changes to any existing In Progress ticket and update accordingly.
2. File new tickets for findings the swarm did not implement tonight (see below).

## Skipped: file new Backlog tickets for research findings

Findings from Wave 1 that should become Backlog tickets (with `auto-research` label) on the next manual Linear pass:

- **[INFRA] Linear webhook signing secret mismatch — verify Vercel env var matches Linear webhook config** (P0). Static audit of `src/app/api/webhooks/linear/route.ts` confirms handler code is correct. The "failing delivery" symptom is Vercel env-var configuration. Changelog v5.22 explicitly notes "8th consecutive fix proposal — please merge!" — repeated swarm code fixes have already landed. Human must verify `LINEAR_WEBHOOK_SIGNING_SECRET` in Vercel Production exactly matches the secret configured in Linear's webhook settings.
- **[PERF] Split `src/app/dashboard/DashboardContent.tsx` (1219 lines)** — every tab (drafts/saved/feed/collab/collections/analytics/trash) plus inline `AnalyticsPanel`, `CollectionsPanel`, and below-the-fold `MatchTracker` (518 lines) bundles into one client component. From C3 #1.
- **[PERF] Dynamic-import TournamentMode + WalkthroughOverlay in `src/app/page.tsx`** — 400+353 lines, both behind user actions. Skipped tonight because `page.tsx` is on the conflict-risk list. From C3 #3.
- **[PERF] Defer Sentry init + lazy-load vanilla-cookieconsent** — both load eagerly in layout. Gate behind `requestIdleCallback`. From C3 #4.
- **[A11y] InstallPrompt + ConnectivityStatus already have dialog/aria-live partially applied** — Wave 2 agent reported they were already in place. Worth a manual audit to confirm completeness.
- **[Security MED] `/api/discord` admin commands lack role checks** — `approve`/`reject` mutate Linear state on any valid Ed25519-signed interaction. Add a check against `body.member.roles`. From C4 #4.
- **[Security MED] Reaction/flag stuffing via client `sessionId`** — `reactions/[shareId]/route.ts:65` and `comments/flag/route.ts:14` accept a client-supplied identity, rotating sessionId trivially stuffs explore "popular" sort. From C4 #3.
- **[SEO] Add `Article`/`TechArticle` JSON-LD per changelog entry** in `src/app/changelog/page.tsx`. From R6 #4.
- **[SEO] Lower `/feedback` sitemap priority and add explicit AI-bot Allow rules** in `public/robots.txt` (Google-Extended, Applebot-Extended, CCBot, Amazonbot, Bytespider, Meta-ExternalAgent). From R6 #5.
- **[Deps] `npm audit fix` for cypress / uuid / tmp / js-cookie transitives** — From C4 #5.

## Skipped: mark tickets as Done

Per Step 6B: no Linear access, no state transitions performed. PR body and Discord-payload notes both indicate which work landed so a human can do the Linear updates manually.
