# New Linear tickets to file — 2026-05-31

The Linear API key is not available in this container, so the swarm cannot
file these tickets directly. Please paste each as a new Linear ticket in the
backlog with the `auto-research` (or `posthog-signal` for telemetry-sourced
items) label.

---

## P0 — Infrastructure / SEO

### 1. `[INFRA] Verify Linear webhook signing secret in Vercel matches Linear config`

**Priority:** P0 (Urgent)
**Labels:** `infra`, `auto-research`
**Source:** `.swarm/webhook-investigation.md`

Linear has warned the `/api/webhooks/linear` webhook will auto-disable due to repeated delivery failures. The handler code in `src/app/api/webhooks/linear/route.ts` has been audited and is correct (signature header, raw body HMAC, force-dynamic, empty-body handling, 200-on-transient-error are all in place — verified line by line in `webhook-investigation.md`). The remaining failure mode is env-var configuration:

- `LINEAR_WEBHOOK_SIGNING_SECRET` may be missing from Vercel Production env, OR
- Its value does not match the secret configured in Linear's webhook settings.

Both produce 401 from the handler. Action required:

1. Vercel → VGC Team Report → Settings → Environment Variables → confirm `LINEAR_WEBHOOK_SIGNING_SECRET` exists for **Production**.
2. Linear → Settings → API → Webhooks → VGC webhook → copy signing secret.
3. Verify they match exactly. If env var was changed, trigger a redeploy.
4. Re-enable the webhook in Linear if it was auto-disabled.
5. Test by triggering an issue event in Linear; watch Vercel function logs for a 200.

Close this ticket once a test delivery returns 200 and the webhook stays enabled for 24h.

---

### 2. `[SEO P0] /s/[id] must server-render the team, not client-redirect to /?s=<id>`

**Priority:** P0 (Urgent)
**Labels:** `seo`, `auto-research`
**Source:** `.swarm/r6-seo-indexation-31-05-26.md` finding #1
**Estimated effort:** 1–2 days

R6 deep-dive identified this as the single largest cause of "only ~2 pages indexed despite a sitemap of thousands." Every shared-report URL (`/s/[id]`) currently renders `<ShareRedirectClient>`, a `'use client'` component whose entire job is `router.replace('/?s=<id>')`. Google sees a near-empty document that JS-redirects to `/`, folds all ~5000 share URLs into the single canonical `/`, and drops the rest as "Page with redirect" or "Alternate page with proper canonical tag."

**Fix:** Convert `src/app/s/[id]/page.tsx` to a true server component that renders `<TeamReport>` inline using the DB row already fetched at line ~159. Hydrate interactive bits (presentation mode, `?key=` edit unlock) as a `'use client'` island. Add `export const revalidate = 300` (5-min ISR) to bound Vercel function invocations.

---

### 3. `[SEO P0] Split homepage into server shell + client island so / has real prerendered HTML`

**Priority:** P0 (Urgent)
**Labels:** `seo`, `auto-research`
**Source:** `.swarm/r6-seo-indexation-31-05-26.md` finding #2
**Estimated effort:** 4–6 hours

`src/app/page.tsx` is `'use client'`, so Next.js does not prerender `.next/server/app/page.html` (build verified — file is missing). When Google follows the `/s/[id]` redirect to `/`, it lands on an empty React shell. Soft-404 territory.

**Fix:** Split into `page.tsx` (server) that renders the static landing copy, hero, sample team cards, FAQ links, JSON-LD; and a `<HomeInteractive>` client child that handles paste input, analysis state, share flow. Same pattern `/explore` should adopt.

This and ticket #2 above are the only two changes that will move the GSC "Pages indexed" count meaningfully in the next 30 days.

---

## P1 — Performance / Quality

### 4. `[PERF] Stop double-bundling dex-subset.json across / and /compare`

**Priority:** P1
**Labels:** `performance`, `auto-research`
**Source:** `.swarm/c3-performance-31-05-26.md` finding #1
**Estimated effort:** Small (~1h)

`src/lib/data/dex-subset.ts` does a top-level JSON import of `dex-subset.json` (~340 KB raw / ~40 KB gzipped). The webpack manifest inlines it into BOTH the `/` and `/compare` client bundles. Convert to a lazy `import()` or `fetch('/dex-subset.json')` so the data is fetched on first need and cached by the browser instead of duplicated across route bundles.

---

### 5. `[PERF] Replace motion library with Tailwind CSS transitions where possible`

**Priority:** P1
**Labels:** `performance`, `auto-research`
**Source:** `.swarm/c3-performance-31-05-26.md` finding #3
**Estimated effort:** Medium (~half day)

`motion` ships 118 KB on the shared chunk. The library has 12 client import sites; most are trivial fades/slides that can be replaced by `transition-all duration-200 ease-out` Tailwind utilities. Audit each site; replace simple cases; keep `motion` only for the animations that genuinely need its spring physics or layout-animation features. Goal: drop the shared chunk by ~80 KB raw.

---

### 6. `[SEO] Per-route server-fetch first page of results on /explore, /changelog, /champions, /creator/[name]`

**Priority:** P2
**Labels:** `seo`, `auto-research`
**Source:** `.swarm/r6-seo-indexation-31-05-26.md` finding #8
**Estimated effort:** Half-day per page

`/explore`, `/changelog`, `/champions`, `/creator/[name]` are server-component shells (good — they DO prerender HTML) but the heavy content components mount as client islands and fetch via `/api/*` after hydration. Initial HTML has zero individual entries. Pass first-page data as props from the server component to thicken the initial paint.

---

### 7. `[SECURITY] Upgrade js-cookie + tmp to resolve high-severity npm advisories`

**Priority:** P2
**Labels:** `security`, `auto-research`
**Source:** `.swarm/c4-security-31-05-26.md`

`npm audit` reports two high-severity advisories tonight:

- **js-cookie ≤3.0.5** (CVSS 7.5 prototype-hijack via crafted `assign()`). Comes in via `@clerk/nextjs` → `@clerk/shared` 4.10.1. Requires upgrading `@clerk/nextjs` to whichever release pulls in `@clerk/shared ≥ 4.13.2`. Validate Clerk SDK migration notes before bumping; Clerk auth touches every page.
- **tmp <0.2.6** (path-traversal). Transitive via `cypress` only — dev dependency, low real-world risk. `npm update tmp` may resolve.

Run `npm audit` after upgrade to confirm `high` count drops to 0.

---

## P2 — Code quality follow-ups

### 8. `[TYPE] Replace Clerk webhook 'as unknown as' double-cast with Zod validation`

**Priority:** P2
**Labels:** `code-quality`, `auto-research`
**Source:** `.swarm/c2-typescript-31-05-26.md` finding #1
**File:** `src/app/api/webhooks/clerk/route.ts:46`

The `event.data as unknown as ClerkUserCreatedData` pattern bypasses type-narrowing in a security-boundary handler. Replace with a Zod `safeParse()` so malformed payloads fail loudly instead of accessing nonexistent fields at runtime.

---

### 9. `[INFRA] Set up Linear API key in container env so future swarm runs can drain the board`

**Priority:** P2
**Labels:** `infra`, `auto-research`
**Source:** `.swarm/run-meta.md`

Each nightly swarm is supposed to read the In Progress Linear board, work through tickets, and update statuses. This container has no `.env.local` and no `LINEAR_API_KEY` in env, so the L0 triage step is non-functional. Per `CLAUDE.md`, the helper at `.claude/scripts/linear.sh` reads `LINEAR_API_KEY` from `.env.local`.

Options:
- Add `LINEAR_API_KEY` (and `DISCORD_BUILDS_WEBHOOK`, `POSTHOG_API_KEY`) to the remote-container environment provisioning step.
- Or: bind these as secrets at session start so they appear in env.
- Or: have the playbook fall back to Linear MCP OAuth on the first swarm run of a new container.

Without this, swarm runs can only act on prior research artifacts and the in-flight code state, not current Linear ticket priorities.

---

## Done in this run (no ticket needed)

The following items from prior swarm research were implemented tonight without filing new tickets — see PR commit list:

- VGC-WEBHOOK: error-logging on webhook handler catch path
- VGC-SEO: bot-detection empty-UA + indexing-file exemption (sitemap.xml etc.)
- VGC-SEO: sitemap ISR + duplicate /compare removal
- VGC-SEO: title double-suffix on /champions and /changelog
- VGC-CI: tsc + build CI gate
- VGC-DIGEST: weekly-digest N+1 → single pre-aggregation
- VGC-PERF: qrcode dynamic-import singleton
- VGC-PERF: NotificationBell + VersionHistoryPanel via next/dynamic in Navbar
- Code hygiene: replaceSpeciesInBlock + isDynamicAllowedOrigin de-exported
- PWA: InstallPrompt localStorage guard
- Changelog text cleanup
