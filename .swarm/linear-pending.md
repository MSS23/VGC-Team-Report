# Linear actions pending — 2026-06-29

The swarm has no Linear API access this run. The following tickets and comments need to be filed by a human (or by a future swarm run with credentials).

## Tickets to create (Backlog)

### P0 — Infra
- **Title:** [INFRA] Linear webhook signing secret mismatch — verify Vercel env var matches Linear webhook config
- **Description:** See `.swarm/webhook-investigation-29-06-26.md`. Handler code at `src/app/api/webhooks/linear/route.ts` is correct; persistent delivery failures are almost certainly an env-var mismatch. Requires human action via Vercel dashboard.
- **Priority:** Urgent
- **Labels:** infra

### Backlog — research findings (target 5–10 tickets)
- **[C4 carry-forward] `protobufjs <=7.6.0` DoS via OTel chain.** Run `npm update protobufjs`. CVSS 7.5. Label: security.
- **[C4] Add `IdSchema` validation to `/api/user/reports/[shareId]` PATCH/DELETE.** Path param currently unvalidated. Label: security.
- **[C4] ILIKE wildcard hardening on `/api/creator/[name]` and `/api/explore`.** Reject `%` and `_`, cap length. Label: security.
- **[C5] Duplicate Zod schema for `commonModes`/`privateFields` in two routes.** Extract shared schema to prevent drift. Label: refactor.
- **[C5] Webhook catch blocks silently mask errors as 200.** Add observability counter inside each catch. Label: observability.
- **[R7] Populated ItemList JSON-LD on `/explore`.** Convert to Server Component; emit ItemList of top public reports. Label: seo.
- **[R3] Reg M-B Legality Badge.** Per-team format-legality indicator on report pages + Explore filter + public `/api/legality` endpoint. Label: feature.
- **[R1] TakeTeamBar — show "Copy paste" / "Open in PokePaste" for viewers** on read-only report pages. Label: feature.
- **[R5] Native share with image attachment.** Pre-render team card PNG, attach via `navigator.share({ files })`. Label: feature.
- **[R4] `/overlay/[id]` route for streamers.** Transparent background variant of /embed/[id] for OBS Browser Source. Label: feature.
- **[R2] Restricted-Duo team label.** Surface "Caly-Shadow / Miraidon" style label on TeamOverview + ReportCard + OG image. Label: feature.

## Comments to post

For each VGC-XX ticket implemented this run, post a "Implemented and pushed to branch swarm-nightly-2026-06-29" comment with commit SHA + PR URL once available. Tickets will be enumerated after Step 4 commits.

## State transitions

- For each implemented ticket: move from In Progress → Done (or whatever team's terminal Done state is).
- For the P0 webhook ticket above: create in Backlog with Urgent priority.

## Discord notification

`.swarm/discord-payload-29-06-26.json` will be written in Step 5 with the build summary for human-driven send to channel `1487202217298493493`.
