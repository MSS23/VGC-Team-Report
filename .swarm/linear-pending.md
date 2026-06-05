# Linear Updates Pending Human Action — 2026-06-05

The swarm could not call the Linear API directly this run (no `.env.local` and
no `LINEAR_API_KEY` env var, and the Linear MCP server requires interactive
OAuth which cannot complete in an unattended overnight run). The actions
below are queued for the human to either run via `.claude/scripts/linear.sh`
on a normal workstation, or replicate manually in the Linear UI.

## P0 — File this ticket NOW

**Title:** `[INFRA] Linear webhook signing secret mismatch — verify Vercel env var matches Linear webhook config`

**Priority:** Urgent (P0)

**State:** Backlog

**Description:**
The Linear webhook handler at `src/app/api/webhooks/linear/route.ts` is
code-correct as of this run — audited and confirmed:

- Reads `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` (with legacy fallback)
- Reads raw body via `await request.text()` before JSON parse
- Verifies `linear-signature` header with HMAC-SHA256
- Uses `crypto.timingSafeEqual` (constant-time)
- Returns 200 / 401 / 400 correctly
- Handles empty-body setup ping, `url_verification` challenge, unknown event
  types, and transient exceptions

If Linear is still reporting delivery failures (and warning of auto-disable),
the most likely cause is an env-var mismatch between Vercel Production
(`LINEAR_WEBHOOK_SIGNING_SECRET`) and Linear's webhook settings.

**Action required (human-only — swarm cannot read/write Vercel env vars):**

1. Open Vercel dashboard → Project → Settings → Environment Variables.
2. Copy the Production value of `LINEAR_WEBHOOK_SIGNING_SECRET`.
3. Open Linear → Settings → API → Webhooks. Edit the failing webhook entry.
4. Confirm the "Signing secret" field in Linear matches the Vercel value EXACTLY.
   If different, either update one to match the other, or rotate both to a
   freshly generated value.
5. Re-enable the webhook in Linear if it was auto-disabled.
6. Trigger a test event (edit an issue in Linear) and confirm Vercel function
   logs show 200 and no Sentry alert fires for `/api/webhooks/linear`.

See `.swarm/webhook-investigation.md` for the full audit.

## Comments to post on the tickets implemented this run

For each ticket landed on `swarm-nightly-2026-06-05`, post a comment like:

```
✅ Implemented and pushed to branch swarm-nightly-2026-06-05.

Commit: <SHA>
Files changed: <list>
PR: <PR URL>
Build: passing (tsc + next build green at time of commit)

Ready for human review. Will move to Done when PR is merged.
```

…and move each ticket to **In Review**, then **Done** once the PR merges.

Tickets to comment on (commit SHA from `git log` on the branch):

- **VGC-WEBHOOK-OBSERVABILITY** — commit `876c1b1`
- **VGC-DEAD-CODE-1** — commit `64236a0`
- **VGC-SEC1a** — commit `535ce7a`
- **VGC-SEO1** — commit `858187a`
- **VGC-SEC1b** — commit `7977e74`
- **VGC-A11Y-QW1** — commit `d8138b0`
- **VGC-FEAT-POKEPASTE** — commit `197ddbe`
- **VGC-TYPE** — commit `9c1d197`

(These ticket IDs may not yet exist in Linear — the swarm picked descriptive
prefixes since it had no live Linear board access. Map them to real VGC-XXX
identifiers when filing, or create them fresh in Backlog and move straight
through In Review → Done with the implemented status.)

## New Backlog tickets to file from research

Apply label `auto-research`. Priority based on confidence × impact.

### High priority

1. **`Lazy-load moves.ts + pokemon.ts as JSON for slide chunk perf`**
   Priority: High. Source: `.swarm/c3-perf.md`. 7,500+ lines of literal data
   currently parsed eagerly inside any chunk rendering report slides. Estimated
   300+ KB raw saved per slide chunk. ~2 hr scope. Deferred this run because
   the codemod is non-trivial and the data file is in main-changed-files.

2. **`Replace motion/react in PasteInput.tsx with CSS transitions`**
   Priority: Medium. Source: `.swarm/c3-perf.md`. Motion lib lands in the
   main chunk (~60-80 KB) because PasteInput is statically imported from `/`
   (the only client homepage). CSS-only fade/slide is zero-cost. ~1 hr.

3. **`Defer @pkmn/dex species iteration in InlinePokemonEditor via requestIdleCallback`**
   Priority: Medium. Source: `.swarm/c3-perf.md`. ~1,200 species iterated
   synchronously blocks 50-200 ms on mobile first paint. ~1 hr.

4. **`Bump @clerk/nextjs + @sentry/nextjs to clear chained high CVEs (js-cookie, postcss)`**
   Priority: High. Source: `.swarm/c4-security.md`. 3 High npm vulns transitive
   via Clerk; semver-major Sentry upgrade clears next/postcss XSS chain.

5. **`Anonymous "Helpful" reaction on /s/{id} viewer`**
   Priority: Medium-High. Source: `.swarm/r5-mobile-share-ux.md`. Figma
   Community's lowest-friction engagement pattern; lifts engagement floor
   for the ~80% who won't sign in. ~3 hr.

6. **`Auto-fire native share-sheet on first share, modal as fallback`**
   Priority: High. Source: `.swarm/r5-mobile-share-ux.md`. Strava's
   share-now-settings-later flow. ~2 hr.

### Medium priority

7. **`Meta-context sidebar with current-reg Pokemon usage % on share pages`**
   Priority: Medium. Source: `.swarm/r1-competitors.md`. Pikalytics gap-closer.
   Cron-refreshed JSON + server component. ~4 hr.

8. **`Rental-code field + /explore filter chip + pre-seed top 50 Reg-I VGCPastes`**
   Priority: Medium. Source: `.swarm/r1-competitors.md`. ~3 hr.

9. **`Generate /champions/[mega] per-Mega landing pages with unique meta`**
   Priority: Medium. Source: `.swarm/r6-seo.md`. Routes already in sitemap.ts;
   need metadata.ts per slug. ~3 hr.

10. **`Add aria-live="polite" to /s/[id] redirect loading state`**
    Priority: Medium. Source: `.swarm/r8-a11y.md` issue #3. WCAG 4.1.2 fix.
    ~30 min.

11. **`Codemod text-[9px]/text-[10px] → text-[11px] across modals + page.tsx`**
    Priority: Medium. Source: `.swarm/r8-a11y.md` QW2. Deferred this run due
    to ShareModal/page.tsx conflict risk. ~1 hr.

12. **`Replace inline "Copied" with thumb-zone toast in ShareModal`**
    Priority: Medium. Source: `.swarm/r5-mobile-share-ux.md` #2. Deferred due
    to ShareModal conflict risk. ~2 hr.

### Lower priority follow-ups from C5 commit review

13. **`VGC-WEBHOOK-CLEANUP: drop legacy LINEAR_WEBHOOK_SECRET + x-linear-signature fallbacks`** (P2)
14. **`VGC-NIGHTLY-GUARD: skip swarm commits that re-apply diffs already on main`** (P1)
15. **`VGC-SAVE-PROBE-ENDPOINT: replace full saved-list scan with HEAD /api/user/saved/:shareId`** (P2)
16. **`VGC-MIGRATION-DOWN: pair every destructive migration with a .down.sql`** (P3)
17. **`VGC-DOCK-TELEMETRY-CLEAN: prune analytics events from deleted docks`** (P3)
18. **`VGC-LINEAR-EVENT-HANDLER: implement or document the no-op event branch in Linear webhook`** (P2)
19. **`VGC-TYPE-STRICT: enable noUncheckedIndexedAccess project-wide`** (P3 — high churn, surfaces hundreds of touchpoints)
