# Research Synthesis — 2026-06-02

## Top 5 highest-leverage opportunities (for future tickets)

1. **Motion library lazy-loading (C3)** — `PasteInput.tsx` and `ExploreContent.tsx` import `motion/react` eagerly,
   landing ~580 KB into the homepage and Explore first-load bundles. Lazy-loading via `dynamic()` could save
   80–120 KB gzipped on the homepage and 60–100 KB on `/explore`. Deferred this run because the homepage
   refactor touches `src/app/page.tsx` and needs SSR/hydration verification.

2. **Custom OpenGraph images for high-traffic pages (R6)** — `/tournaments`, `/faq`, `/feedback`, and
   `/changelog` currently fall back to the root `opengraph-image.tsx`. Building route-specific OG images via
   Next.js `ImageResponse` would improve social share CTR. Deferred — design work needed.

3. **Type-safe `asRecord` helper consolidation (C2)** — `normalize-report.ts` was cleaned up this run but
   `src/lib/data/dex-subset.ts:62` and `src/lib/i18n/index.ts:83` still have similar `as unknown as X`
   patterns. Both files were on the conflict-risk list this run; defer to a follow-up when main is quiescent.

4. **Transitive npm vulnerabilities (C4)** — 13 vulnerabilities (10 moderate, 3 high) all from transitive
   deps (`@clerk/shared → js-cookie`, `cypress → tmp`, `brace-expansion`). Upgrading `@clerk/nextjs` resolves
   the highest-severity item. Touches `package.json` — risky in a swarm run, file for human merge planning.

5. **Linear webhook end-to-end verification (Step 0C investigation)** — Handler code is healthy. If the
   webhook is still failing in production, the cause is an env-var mismatch between Vercel
   `LINEAR_WEBHOOK_SIGNING_SECRET` and the secret configured in Linear. Verification belongs to a human via
   Vercel + Linear dashboards.

## Top 5 quick-win bugs / issues (shipped this run unless noted)

1. Explore card like/bookmark buttons missed 44px tap target (R5/R8) — SHIPPED
2. ShareModal didn't lock background scroll on iOS (R5) — SHIPPED
3. Explore search input missed inputMode="search" keyboard hint (R5) — SHIPPED
4. Champion banner dismiss button was 20x20px (R8) — SHIPPED
5. TeamOverview textarea and dashboard sort select lacked aria-labels (R8) — SHIPPED

## Blockers / environment notes

- No Linear API key in this environment — could not query the live board, could not file research findings
  as tickets, could not update tickets. See `.swarm/linear-status.md` for recommended human follow-up.
- No PostHog credentials — could not cross-reference rage-click / error-frequency data with audit findings.
- No Discord webhook URL — final swarm summary cannot be posted from the swarm container. See
  `.swarm/discord-failed.md` for the payload that should have been sent (logged at end of run if applicable).

## Conflict-risk files flagged by C1–C5 (high overlap with main-changed-files.md)

- `src/lib/data/dex-subset.ts` (C2 finding) — DEFERRED, not touched
- `src/lib/i18n/index.ts` (C2 finding) — DEFERRED, not touched
- `src/app/changelog/data.ts` (changelog) — TOUCHED, low risk (data-only append)
- All other Wave 2 touched files: not on conflict-risk list, safe to commit
