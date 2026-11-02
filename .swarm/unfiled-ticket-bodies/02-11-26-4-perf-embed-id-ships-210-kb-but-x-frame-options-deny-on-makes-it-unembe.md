# [Perf] /embed/[id] ships 210 KB but X-Frame-Options: DENY on /(.*) makes it unembeddable

- **Priority:** High
- **Labels:** auto-research, Performance, Web App
- **Target state:** Backlog
- **Status:** NOT FILED — Linear workspace is at its free-plan active-issue limit

## Source

`.swarm/c3-perf-02-11-26.md`, flagged during bundle analysis.

## Finding

`next.config.ts` applies **`X-Frame-Options: DENY`** and CSP **`frame-ancestors 'none'`** to the path pattern `/(.*)` with **no override**. So `/embed/[id]` — which builds and ships roughly **210 KB gzipped** — **cannot be framed by anyone**.

This looks unintended rather than a deliberate lockdown: the app also ships an **oEmbed endpoint** at `src/app/api/oembed/route.ts`, whose entire purpose is to let other sites discover and embed this content. A route built to be framed, advertised via oEmbed, and then blocked from framing by a blanket header is a defect — and it is shipping 210 KB to nobody.

## Why the swarm did not fix it

**The swarm's attempt to implement this was blocked by its own permission classifier**, which judged a change relaxing `frame-ancestors` to be unsafe to apply unattended. That is a reasonable call for an automated run — loosening clickjacking protection is exactly the sort of change that should have a human behind it — so it is being handed over rather than retried.

## Decision required before any fix

Establish **what `/embed/[id]` is allowed to serve**:

* If it only ever serves **public or unlisted** reports, then opening `frame-ancestors` for that one path is correct and consistent with oEmbed.
* If it can serve **private** content, the blanket `DENY` is **load-bearing** and must stay — in which case the real bug is that the route exists and ships 210 KB while being unusable, and it should either be gated properly or removed.

## Implementation notes if it proceeds

* `X-Frame-Options` has no "allow any origin" value — legacy `ALLOW-FROM` is unsupported by modern browsers. Express the policy via CSP `frame-ancestors` and ensure the embed path does **not** inherit the catch-all's `X-Frame-Options: DENY`.
* In Next.js, a more specific `source` must precede the catch-all `/(.*)` to take effect.
* Every other route must keep `DENY` + `frame-ancestors 'none'` exactly as now, and all other security headers must be preserved on the embed route.
* Verify by actually inspecting served headers for both an embed URL and a normal URL — a passing build proves nothing about header config.
