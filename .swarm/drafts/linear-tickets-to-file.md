# Linear Backlog Tickets to File — 2026-06-01

Linear MCP requires OAuth and the unattended overnight runner cannot complete the flow.
This file is the structured drop-zone for any tickets the human should create in Linear
on the morning of 2026-06-01. Each entry below maps 1:1 to a `linear_create_issue`
call (title, description, priority, labels). The human or a follow-up authenticated
session should file these via Linear MCP or the Linear UI.

Conventions:
- `priority`: Urgent=1, High=2, Medium=3, Low=4 (matches Linear's numeric scale).
- `labels`: comma-separated. Create `auto-research` and `posthog-signal` if missing.
- Source file under `.swarm/` referenced in each description.

---

## P0 / Urgent

### TICKET-1 — [INFRA] Linear webhook still failing — verify LINEAR_WEBHOOK_SIGNING_SECRET
- **Priority:** Urgent (1)
- **Labels:** `auto-research`, `infra`
- **Description:**
  > The Linear webhook handler at `src/app/api/webhooks/linear/route.ts` has been audited
  > and the code is correct (see `.swarm/webhook-investigation.md` for the full
  > checklist — every requirement passes). This is the **eighth** consecutive nightly
  > swarm run that has identified the env-var configuration as the likely root cause.
  >
  > **Action required (Vercel + Linear dashboards — cannot be automated):**
  > 1. Vercel → Project → Settings → Environment Variables → Production. Confirm
  >    `LINEAR_WEBHOOK_SIGNING_SECRET` is present, non-empty, and not a placeholder.
  > 2. Linear → Settings → API → Webhooks → "pokemonvgcteamreport.com" webhook.
  >    Copy the **Signing secret** field exactly.
  > 3. Compare byte-for-byte (no whitespace, no smart quotes, no truncation).
  > 4. Confirm the Linear webhook URL points to `https://pokemonvgcteamreport.com/api/webhooks/linear`,
  >    not a stale Vercel preview URL.
  > 5. Redeploy production after any env-var change.
  > 6. Linear → Webhooks → click "Resend" on a recent failed delivery, confirm 200.
  > 7. Re-enable the webhook if Linear has auto-disabled it.
  >
  > Closing this ticket without a code change is OK — deliverable is verified delivery.

### TICKET-2 — [P0 DATA] Backfill corrupted owner_id rows from 17-18 May 2026 share INSERT bug
- **Priority:** Urgent (1)
- **Labels:** `auto-research`, `data-integrity`, `bug`
- **Description:**
  > C5 review (`.swarm/c5-review-01-06-26.md`) flagged a column-order bug in
  > `src/app/api/share/route.ts` that ran from 17-18 May 2026, causing the boolean
  > `is_public` to be inserted into the `owner_id` column. Shares created in that
  > window have invalid `owner_id` values (and possibly an incorrect `search_vector`).
  >
  > Action: write a one-off SQL script to identify and repair rows where
  > `owner_id::text` looks like a boolean ('true' / 'false'). Cross-reference with
  > `created_at` between `2026-05-17 00:00:00Z` and `2026-05-18 23:59:59Z`. Map back
  > to the actual owner via Clerk session logs if possible; otherwise mark the rows
  > as orphaned and notify affected users.

---

## P2 / High — research-driven

### TICKET-3 — [FEATURE] Dynamic OG card for shared reports (1200×630 six-sprite team collage)
- **Priority:** High (2)
- **Labels:** `auto-research`, `feature`, `sharing`
- **Description (from `.swarm/r1-competitor-pikalytics-pokepaste-01-06-26.md`):**
  > Both Pikalytics and PokePaste are visibly weak on link unfurls (no rich OG preview).
  > Estimated 2-4x click-through improvement on Discord/Twitter shares once we
  > generate a proper card per report (six-sprite team collage, tera/item icons,
  > author handle, report headline, our brand mark).
  > Use Vercel's `next/og` (Satori) — server-rendered, no client JS cost.
  > Reuse the existing `src/app/s/-/opengraph-image` route as the entry point.

### TICKET-4 — [FEATURE] Structured Team Report editor (Lead Matrix, Win Conditions, EV Justification)
- **Priority:** High (2)
- **Labels:** `auto-research`, `feature`, `editor`
- **Description (from `.swarm/r1-competitor-pikalytics-pokepaste-01-06-26.md`):**
  > The wedge against Pikalytics + PokePaste is the **narrative layer** — the
  > matchup-and-EV writeup that today lives in Google Docs, Smogon threads, and
  > Victory Road. Build a structured form:
  > - Lead Matrix (rows × cols of common opposing leads)
  > - Win Conditions (1-3 per common matchup)
  > - per-mon EV Justifications
  > - Tough Matchups (and what to switch to / lose gracefully)
  > - Replay links
  > This replaces the Google Doc nobody wants to write.

### TICKET-5 — [FEATURE] One-click PokePaste import + optional co-publish to pokepast.es
- **Priority:** High (2)
- **Labels:** `auto-research`, `feature`, `interop`
- **Description (from `.swarm/r1-competitor-pikalytics-pokepaste-01-06-26.md`):**
  > Ride PokePaste's network effect instead of fighting it. Authors keep the canonical
  > paste URL the community trusts AND a richer VGC Team Report at our URL.
  > Already partially built (paste input parser exists). Need: a "Co-publish to
  > pokepast.es" toggle in the share modal that POSTs to pokepast.es and links back.

### TICKET-6 — [SEO] Add visible H1 to homepage
- **Priority:** High (2)
- **Labels:** `auto-research`, `seo`
- **Description (from prior run + R6 audit):**
  > The home page currently has no visible H1 in the above-the-fold area. R6 audit
  > (`.swarm/r6-seo-audit-01-06-26.md`) calls this out as a baseline SEO miss
  > regardless of metadata title.

### TICKET-7 — [PERF] Move @pkmn/dex to server action — 6.7MB client savings
- **Priority:** High (2)
- **Labels:** `auto-research`, `performance`
- **Description (from prior synthesis + C3 audit):**
  > InlinePokemonEditor.tsx and pkmn-dex-fallback.ts import the entire Showdown
  > database for all 9 generations into client bundles (~6.7 MB). Move to a server
  > action or API route. Tonight's C3 found `dex-subset.json` ships twice (2×340KB);
  > a precursor would be to unify on the subset and lazy-import the full dex only
  > when the user is in the editor.

### TICKET-8 — [PERF] Move dex-subset.json behind `import "server-only"` + dynamic import
- **Priority:** High (2)
- **Labels:** `auto-research`, `performance`
- **Description (from `.swarm/c3-perf-01-06-26.md`):**
  > Wrapper in `src/lib/data/dex-subset.ts` causes the JSON to ship twice (2×340KB).
  > Move client consumers to `await import()` and mark the server path with
  > `import "server-only"`. Saves ~340KB off the initial graph on 5 top routes.

### TICKET-9 — [PERF] Dedupe Navbar + dynamic PasteInput
- **Priority:** High (2)
- **Labels:** `auto-research`, `performance`
- **Description (from `.swarm/c3-perf-01-06-26.md`):**
  > `src/components/layout/Navbar.tsx` (890 LOC) is imported in BOTH layout and the
  > home page → ships twice. Dedupe. Also `dynamic({ ssr:false })` PasteInput to drop
  > `motion` from the cold path. Saves ~30-60KB on `/`.
  > High conflict risk — both files are on the changed list.

---

## P3 / Medium — code quality + tests

### TICKET-10 — [TS] Add Zod validation to Clerk webhook payload
- **Priority:** Medium (3)
- **Labels:** `auto-research`, `tech-debt`, `type-safety`
- **Description (from `.swarm/c2-typescript-01-06-26.md` finding #3):**
  > `src/app/api/webhooks/clerk/route.ts:46` casts `event.data` via
  > `as unknown as ClerkUserCreatedData` — the most dangerous TS pattern. If Clerk's
  > webhook payload changes (or sends a partial event), the cast silently accepts
  > invalid data and the handler crashes on first property access. Replace with a
  > Zod schema and `.parse()`.

### TICKET-11 — [TS] Replace z.unknown() validators on /api/share with concrete nested schemas
- **Priority:** Medium (3)
- **Labels:** `auto-research`, `tech-debt`, `type-safety`
- **Description (from `.swarm/c2-typescript-01-06-26.md` finding #9):**
  > `src/app/api/share/route.ts:16-19` uses `z.unknown()` for matchupPlans, notes,
  > calcs, roles, and spriteSettings. Downstream code then assumes specific shapes
  > so the apparent validation is a no-op. Define concrete schemas so the validation
  > actually catches malformed payloads at the API boundary.

### TICKET-12 — [TESTS] Regression tests for /api/share INSERT, webhook signature verify, keep-alive
- **Priority:** Medium (3)
- **Labels:** `auto-research`, `tests`, `tech-debt`
- **Description (from `.swarm/c5-review-01-06-26.md` finding #2):**
  > Three routes have caused incidents in the last 20 commits and **none** have test
  > coverage: `src/app/api/share/route.ts` (INSERT column order — the data
  > corruption bug), `src/app/api/webhooks/linear/route.ts` (signature verify), and
  > `src/app/api/keep-alive/route.ts` (CRON_SECRET). Add a Vitest suite per route.

### TICKET-13 — [PROCESS] Enforce `tsc --noEmit && npm run build` via pre-commit hook
- **Priority:** Medium (3)
- **Labels:** `auto-research`, `process`, `dev-experience`
- **Description (from `.swarm/c5-review-01-06-26.md` finding #4):**
  > Commit `83295c1` existed only to repair a build break in `cddad63`. The gate is
  > documented in CLAUDE.md but not enforced. Add a husky pre-commit hook (or simpler
  > bash script in `.git/hooks/pre-commit`) that runs the gate.

### TICKET-14 — [PERF] Run `npm audit fix` to clear js-cookie/tmp/qs/uuid high CVEs
- **Priority:** Medium (3)
- **Labels:** `auto-research`, `security`, `deps`
- **Description (from `.swarm/c4-security-01-06-26.md`):**
  > `npm audit`: 3 HIGH (`js-cookie`, `tmp`, `@clerk/shared`) and 10 moderate vulns,
  > all with `fixAvailable: true`. Run the bump in a focused branch (touches lockfile).

### TICKET-15 — [SECURITY] CSP nonce for theme-preflight inline script
- **Priority:** Medium (3)
- **Labels:** `auto-research`, `security`, `csp`
- **Description (from `.swarm/c4-security-01-06-26.md` finding #3):**
  > `next.config.ts:85` `script-src 'unsafe-inline'` is only needed for the theme
  > preflight inline script in `src/app/layout.tsx:101`. Move to a nonce'd `<Script>`
  > so we can drop `'unsafe-inline'` from the CSP.

### TICKET-16 — [OBS] Misconfig alert when CRON_SECRET is unset in production
- **Priority:** Medium (3)
- **Labels:** `auto-research`, `observability`
- **Description (from `.swarm/c4-security-01-06-26.md` finding #5):**
  > `src/app/api/cron/daily-ops/route.ts:40-44` treats 401 as alive when CRON_SECRET
  > is unset. Add a clear prod-only check that fires a Sentry event if the var is
  > missing.

---

## P4 / Low — polish

### TICKET-17 — [A11Y] CommentSection form input labels
- **Priority:** Low (4)
- **Labels:** `auto-research`, `accessibility`
- **Description (from `.swarm/r8-accessibility-01-06-26.md`):**
  > `src/components/social/CommentSection.tsx` comment form lacks `<label>` tags or
  > `aria-labelledby` for displayName + body inputs. Inputs are contextually
  > discoverable but not programmatically associated.

### TICKET-18 — [A11Y] Theme selector visible labels
- **Priority:** Low (4)
- **Labels:** `auto-research`, `accessibility`
- **Description (from `.swarm/r8-accessibility-01-06-26.md`):**
  > Navbar theme selector (Pokémon-sprite buttons) — inactive grayscale buttons look
  > disabled to low-vision users. Add visible text labels or richer aria-labels.

### TICKET-19 — [SEO] Champions/Tournaments titles include top-usage Pokémon names + live events
- **Priority:** Low (4)
- **Labels:** `auto-research`, `seo`
- **Description (from `.swarm/r6-seo-audit-01-06-26.md` win #4):**
  > Add Sneasler 43.8%, Basculegion, Kingambit, Mega Charizard-Y to /champions title.
  > Add Indianapolis Regionals + Worlds 2026 San Francisco Aug 14-17 to /tournaments
  > title. Single-line edits, event-spike traffic.

### TICKET-20 — [SEO] /guides hub page + additional guide topics
- **Priority:** Low (4)
- **Labels:** `auto-research`, `seo`, `content`
- **Description:**
  > Tonight's `/guides/how-to-write-a-vgc-team-report` is the first guide. Build a
  > `/guides` hub page and follow up with:
  > - how-to-read-a-pokepaste
  > - how-to-pick-a-vgc-team-for-beginners
  > - common-vgc-team-archetypes-2026
  > - how-to-prep-for-a-vgc-regional
