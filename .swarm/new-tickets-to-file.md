# New Linear Tickets to File After Run

## P0 / Webhook follow-up (carry forward)
1. **[INFRA] Standardise Linear webhook signing secret to LINEAR_WEBHOOK_SIGNING_SECRET (drop legacy LINEAR_WEBHOOK_SECRET fallback)**
   Priority: High (2)
   Description: VGC-WEBHOOK fix in this run accepts both LINEAR_WEBHOOK_SIGNING_SECRET (preferred) and the legacy LINEAR_WEBHOOK_SECRET to be safe. Once the user has confirmed via Vercel that the env var is set under the SIGNING_SECRET name (and Linear's webhook config matches), remove the legacy fallback in src/app/api/webhooks/linear/route.ts.
   Source: webhook-investigation.md

2. **[INFRA] Verify Linear webhook delivery succeeds end-to-end after handler fix**
   Priority: High (2)
   Description: This run's first commit (VGC-WEBHOOK) fixed the header name (linear-signature vs x-linear-signature), added env-var fallback, force-dynamic, and 200 on unknown event types. Once deployed, re-enable the webhook in Linear settings and confirm a test delivery returns 200. Webhook URL: https://pokemonvgcteamreport.com/api/webhooks/linear.

## P0 Security (from C5)
3. **Bug: Clerk webhook has no svix-id idempotency — duplicate welcome emails on retry**
   Priority: Urgent (1)
   Description: src/app/api/webhooks/clerk/route.ts only validates the Svix signature; Clerk retries on 5xx, causing duplicate welcome emails. Add a 5-min TTL cache keyed by svix-id to short-circuit duplicates. Source: c5-commit-review.md finding 4.

4. **Bug: Weekly digest unsubscribe footer references UI that does not exist (CAN-SPAM gap)**
   Priority: High (2)
   Description: The weekly digest email says "unsubscribe via notification preferences" but no toggle exists in /dashboard/notifications that writes publicMetadata.digestUnsubscribed. Add the toggle, or include a signed one-click unsubscribe link per CAN-SPAM §316.5. Source: c5-commit-review.md finding 3.

## Features from R3 community sentiment (each <8hr)
5. **Source / Credit field with auto-linkify on team reports**
   Priority: High (2)
   Description: Add separate sourceUrl + creditPlayer columns on the report. Renders as "Based on [Player]'s team from [Event]" line. Solves PokePaste's long-running pain about un-selectable URLs buried in notes.
   Source: r3-community-sentiment.md unmet need #1 secondary.

6. **Sprite-fallback CDN proxy: wrap pokepaste-derived sprites with a Pokemon HOME / Showdown fallback**
   Priority: High (2)
   Description: PokePaste sprites are broken for many DLC formes (Zygarde-10%, Sirfetch'd, Ash-Greninja). When our viewer renders a pokepast.es-derived team, route through our existing /api/sprite proxy and substitute a Pokemon HOME / Showdown sprite on 404. Effectively builds the community pokepastefix Chrome extension into our app, which also fixes iOS Safari users.
   Source: r3-community-sentiment.md pain point #1.

7. **Open Team Sheet (OTS) PDF export from any report**
   Priority: High (2)
   Description: VGC 2026 mandates OTS at tournaments. Generate a print-friendly, regulation-compliant team sheet (Pokemon, item, ability, moves, Tera type) directly from any report page. Daily-use utility tied to mandatory tournament format.
   Source: r3-community-sentiment.md ticket idea #5.

## Tech debt
8. **Refactor email HTML builders behind a tagged-template helper that escapes by default**
   Priority: Medium (3)
   Description: Two XSS regressions in two weeks (digest in 19-05 swarm, welcome+comment fixed today). Move all email templates into an html`...` tagged-template helper that escapes interpolations by default with a raw() opt-out. One audit point, no foot-guns.
   Source: c5-commit-review.md architectural rec #1.

9. **Integration test for shares INSERT/UPDATE flow against test schema**
   Priority: Medium (3)
   Description: 17-05 INSERT column-mismatch bug and today's unlisted-demotion bug both passed tsc + build cleanly. A 30-line vitest creating → reading → updating → reading a share through getDb() against a test schema catches column-list bugs at CI. Currently only extractSpecies has unit coverage.
   Source: c5-commit-review.md architectural rec #2.

10. **DoubleTapLikeOverlay: strip dead dock selectors after ShareDock removal**
    Priority: Low (4)
    Description: DoubleTapLikeOverlay still has 50+ lines guarding against [data-vgc-dock], aria-label*="share", aria-label*="reaction" elements that were removed in commit 850e91c. Also: ChangelogContent.tsx:274 still advertises "Persistent ShareDock on every shared report" — strip both. Source: c5-commit-review.md architectural rec #3.

## SEO (from R6)
11. **SEO: ship per-species EV-spread landing pages at /champions/[species]/spreads (largest keyword gap vs Pikalytics)**
    Priority: High (2)
    Already filed as VGC-217 — confirm still on backlog, do not re-file.

12. **SEO: BreadcrumbList JSON-LD on /explore, /tournaments, /creator/[name]**
    Priority: Medium (3)
    Implemented this run by F5 if applicable — only file if F5 reports it could not complete.

