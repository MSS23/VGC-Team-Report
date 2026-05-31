# Rejected Changes — swarm-nightly-2026-05-31

No changes rejected at the build gate tonight. Every queued change passed `npx tsc --noEmit` and `npm run build` before being committed.

## Deliberately deferred (not rejected — out of scope for tonight)

1. **R6 stop-gap: server-side `redirect()` from `/s/[id]`** (item 1b in `.swarm/r6-seo-indexation-31-05-26.md`). The 10-min change would convert the current JS client redirect to a 307. Skipped because a 307 short-circuits the response before the SEO metadata + JSON-LD render, removing the only signal Google currently has on those URLs. The proper fix (server-render the team inline) is filed as ticket #2 in `.swarm/new-tickets-to-file.md`.

2. **Sitemap `unstable_cache` wrap** (item 5b). Skipped — the 1h ISR change (5a, shipped) hits the same goal with one line; an additional cache wrapper would double-cache the same SQL with potential staleness mismatch. Filed as a future-work consideration in the SEO ticket only if the ISR cache proves insufficient.

3. **page.tsx + /s/[id] server-rendering refactors** — too large for a swarm-style nightly commit (R6 estimates 4-6h and 1-2d respectively). Filed as separate P0 tickets so the human can plan focused effort.

4. **C2 implicit-any sweep** — tsc is already passing under `strict: true`, which gives `catch (e)` as `unknown` automatically. The agent's findings were technically true but didn't cause compile errors. Deferred until either a future eslint rule catches them or we tighten `noImplicitAny` further.

5. **js-cookie + tmp upgrades** (C4 high-severity advisories). Skipped because the fix requires bumping `@clerk/nextjs` (every-page auth dep) which is risky without testing the full Clerk migration. Filed as ticket #7.
