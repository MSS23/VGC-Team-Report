# Recommended Linear Backlog Tickets — 2026-06-02

The swarm could not file these directly because LINEAR_API_KEY is not available in this run's
environment. Please file these manually from the Linear board after merging this PR.

## P1 — high leverage

### [Perf] Lazy-load motion library in PasteInput and ExploreContent
- **Label**: `performance`, `auto-research`
- **Description**: `src/components/input/PasteInput.tsx` and `src/components/explore/ExploreContent.tsx`
  eagerly import `motion/react`, landing ~580 KB into the homepage and Explore first-load JS. Refactor
  these client components to use `dynamic()` with `ssr: false` for the motion-bearing children.
- **Source**: `.swarm/C3-perf-2026-06-02.md`
- **Estimated impact**: 80–120 KB saved on `/`, 60–100 KB on `/explore`

### [SEO] Route-specific OG images for tournaments, faq, feedback, changelog
- **Label**: `seo`, `auto-research`
- **Description**: Currently fall back to the root `opengraph-image.tsx`. Build dedicated OG images
  via Next.js `ImageResponse` for these four high-traffic public pages.
- **Source**: `.swarm/R6-seo-2026-06-02.md`

### [Type Safety] Apply asRecord helper to dex-subset.ts and i18n/index.ts
- **Label**: `tech-debt`, `auto-research`
- **Description**: `normalize-report.ts` was cleaned up this run. Apply the same `asRecord` pattern
  to `src/lib/data/dex-subset.ts:62` and `src/lib/i18n/index.ts:83`. Both were on the conflict-risk
  list this run; coordinate with active feature branches.
- **Source**: `.swarm/C2-typescript-2026-06-02.md`

## P2 — security hygiene

### [Security] Upgrade @clerk/nextjs to resolve js-cookie GHSA-qjx8-664m-686j
- **Label**: `security`, `auto-research`
- **Description**: Transitive `js-cookie 3.0.5` via `@clerk/shared` has a CVSS 7.5 prototype-injection
  advisory. Upgrade `@clerk/nextjs` to the latest minor — verify no auth regressions in a manual test
  pass after upgrade.
- **Source**: `.swarm/C4-security-2026-06-02.md`

### [Security] Upgrade cypress when next stable lands to clear tmp GHSA-ph9p-34f9-6g65
- **Label**: `security`, `auto-research`
- **Description**: Transitive `tmp < 0.2.6` via cypress. Dev-only dependency, no production impact.
  Defer until cypress publishes a release that upgrades the transitive dep.
- **Source**: `.swarm/C4-security-2026-06-02.md`

## P0 — infrastructure (human action required)

### [INFRA] Verify Linear webhook delivery
- **Label**: `infra`, `webhook`
- **Description**: Step 0C of this run confirmed the Linear webhook handler code at
  `src/app/api/webhooks/linear/route.ts` is correct (signature verification, raw-body read,
  timing-safe compare, force-dynamic, runtime nodejs — all in place since changelog 5.20/5.22).
  If the webhook is still flagged as failing in Linear's admin UI, the root cause is an env-var
  mismatch:
  1. Open Vercel → Project → Environment Variables → Production
  2. Confirm `LINEAR_WEBHOOK_SIGNING_SECRET` exists and matches the secret shown in Linear's
     webhook configuration screen
  3. If mismatched, copy from Linear, paste into Vercel, trigger a redeploy
  4. In Linear webhook settings, click "Re-enable" if auto-disabled, then "Send test event"
- **Source**: `.swarm/webhook-investigation.md`
