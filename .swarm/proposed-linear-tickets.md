# Linear Tickets to File (Backlog) — Proposed by Swarm Run 2026-06-10

The Linear MCP is not authenticated in this sandbox session and `.env.local` is absent, so the swarm cannot create these directly. Each entry below is ready to copy/paste into Linear when the human reviews the PR.

---

## P0 — Linear Webhook env-var verification
**Title:** [INFRA] Linear webhook signing secret mismatch — verify Vercel env var matches Linear webhook config
**Priority:** Urgent (P0)
**Labels:** infra, bug
**Description:**
Linear reports persistent delivery failures to `https://pokemonvgcteamreport.com/api/webhooks/linear`. The handler code in `src/app/api/webhooks/linear/route.ts` was audited and is correct (raw-body HMAC-SHA256, timing-safe compare, 200/401/400 semantics, empty-body ping handled). The fault is almost certainly env-var configuration.

**Required human action:**
1. Open the Linear webhook settings page for this webhook; copy the displayed signing secret.
2. Open Vercel → Project Settings → Environment Variables (Production).
3. Compare against `LINEAR_WEBHOOK_SIGNING_SECRET` (and legacy `LINEAR_WEBHOOK_SECRET`). If either differs from Linear's value, update Vercel and redeploy.
4. After redeploy, replay a failed event from Linear's "Deliveries" view and confirm 200.

Source: `.swarm/webhook-investigation.md` (full audit) in swarm-nightly-2026-06-10 PR.

---

## P1 — Webhook silent-failure observability
**Title:** [OBS] Add structured error logging on webhook 200-on-error catches
**Priority:** High
**Labels:** observability, infra
**Description:**
The Linear, Clerk, and PostHog webhook handlers all return 200 in their outermost catch block to prevent Linear/Clerk auto-disabling the webhook on a transient blip. This is pragmatic, but it silently swallows real failures. Add a `console.error` (no secret material, no raw body) on the catch path so transient and persistent failures are visible in Vercel logs.

Files: `src/app/api/webhooks/linear/route.ts`, `src/app/api/webhooks/clerk/route.ts`, `src/app/api/webhooks/posthog/route.ts`.

Source: `.swarm/c5-commits.md`.

---

## P1 — npm security: upgrade js-cookie and tmp transitives
**Title:** [SEC] Upgrade @clerk/shared and tmp to clear two HIGH npm advisories
**Priority:** High
**Labels:** security, dependencies
**Description:**
`npm audit` flags two HIGH advisories:
1. `js-cookie ≤3.0.5` — per-instance prototype hijack in `assign()` (CVSS 7.5). Reaches us via `@clerk/shared`. Upgrade `@clerk/shared` (and re-pin `@clerk/nextjs`) to a release whose transitive `js-cookie` is patched.
2. `tmp <0.2.6` — path-traversal via unsanitized prefix/postfix (CWE-22). Upgrade `tmp` to ≥0.2.6.

Run `npm audit fix` and re-verify with `npm audit --json | jq '.metadata.vulnerabilities'`.

Source: `.swarm/c4-security-10-06-26.md`.

---

## P1 — Audit remaining `console.error` orphans in API routes
**Title:** [BUG] Standardize API route error responses — surface user-facing fallback for ~80 console.error orphans
**Priority:** High
**Labels:** ux, api
**Description:**
The UX audit found ~80 `console.error(...)` calls in API routes where the failure produces no user-visible feedback. Affected pattern: try/catch logs the error but returns nothing meaningful to the client (or returns a 500 with no body the UI surfaces). Sweep `src/app/api/` and standardize on returning `{ error: "<short user-friendly message>" }` with the appropriate status, so frontend toasts can display a real message.

Source: `.swarm/r5-ux-10-06-26.md`.

---

## P2 — Empty-state UX pass on five collaboration surfaces
**Title:** [UX] Improve empty states across MatchTracker, CompareContent, VersionHistoryPanel, CommentSection, CollaboratorPanel
**Priority:** Medium
**Labels:** ux
**Description:**
The UX audit identified five empty states that read as blank text with no next action:
1. **MatchTracker** — "No matches logged yet." Add CTA + suggested archetypes.
2. **CompareContent** — "No reports yet" dropdown placeholder. Link to Create.
3. **VersionHistoryPanel** — "No versions yet" with no save-workflow hint. Add "Versions save automatically when you edit".
4. **CommentSection** — "No comments yet. Be the first!" → "Share your thoughts on this team strategy".
5. **CollaboratorPanel** — "No collaborators yet" → surface the copy-to-share invite link.

Source: `.swarm/r5-ux-10-06-26.md`.

---

## P2 — Guide schema on /champions/[pokemon] mega pages
**Title:** [SEO] Add Guide/Article JSON-LD to /champions/[pokemon] mega landing pages
**Priority:** Medium
**Labels:** seo
**Description:**
The mega Pokémon landing pages currently only emit BreadcrumbList. They read as guides (strategy, abilities, team-building) so an `Article` schema would unlock Google rich result eligibility for guide-style queries. Mirror the Article schema just shipped for `/s/[id]` (this run, commit edb0cc2).

Source: `.swarm/r6-seo.md`.

---

## P2 — Clerk webhook payload type guard
**Title:** [TYPE-SAFETY] Replace unsafe `as unknown as ClerkUserCreatedData` cast in Clerk webhook
**Priority:** Medium
**Labels:** typescript, security
**Description:**
`src/app/api/webhooks/clerk/route.ts:46` casts the verified payload via `event.data as unknown as ClerkUserCreatedData`. The signature check is correct, but the payload shape isn't validated. Add a Zod schema (or hand-rolled type guard) for the `user.created` event so a missing `email_addresses` array can't crash the welcome-email flow.

Source: `.swarm/c2-typescript.md`.

---

## P2 — Audit fire-and-forget SQL without await
**Title:** [BUG] Sweep API routes for `.catch()` without `await` on sql calls — Vercel cancels them
**Priority:** Medium
**Labels:** bug, infra
**Description:**
Changelog v5.20 noted five `sql\`...\`.catch(...)` patterns running without `await`, which Vercel cancels when the response returns (lambda freezes mid-flight). Re-grep the codebase to confirm none have crept back. Pattern: search for `sql\`` followed within 20 lines by `.catch(` without a preceding `await`.

Source: `.swarm/c5-commits.md`.

---

## P3 — Clipboard silent-fail toast in ShareModal
**Title:** [UX] Surface a hint when navigator.clipboard.writeText() fails in ShareModal
**Priority:** Low
**Labels:** ux, accessibility
**Description:**
On non-HTTPS dev contexts and inside the iframe embed flow, `navigator.clipboard.writeText` rejects. The current `catch { /* no-op */ }` leaves the user thinking the copy succeeded. Show a toast or a transient pill: "Clipboard unavailable — select the text above to copy."

Source: `.swarm/r5-ux-10-06-26.md`.

---

## P3 — Empty `aria-hidden` sweep on decorative SVGs
**Title:** [A11Y] Add aria-hidden to ~5 decorative SVGs in ThemePicker, WhatsNewModal badges
**Priority:** Low
**Labels:** accessibility
**Description:**
A11y audit found ~5 decorative SVGs missing `aria-hidden="true"`. Screen readers announce them anyway, which is noise — they carry no meaning beyond their adjacent label. Add the attribute. Files: `src/components/ThemePicker.tsx`, `src/components/whatsnew/WhatsNewModal.tsx`, badge components.

Source: `.swarm/r8-a11y-10-06-26.md`.

---

## P3 — Article schema for /champions/[pokemon] (mirror of /s/[id])
Already covered by P2 ticket "Guide schema on /champions/[pokemon] mega pages" above.

---

## Filed automatically by this swarm run (no Linear ticket needed — already shipped)

These were implemented and committed on the nightly branch:

- swarm: remove duplicate /compare entry from sitemap (77d77d7)
- swarm: replace alert() with inline error banner in TeamCardCTA (34a9e3f)
- swarm: avoid leaking PostHog error messages in 500 response (3b44bb6)
- swarm: rate limit collaborator-link revoke PATCH (9acca61)
- swarm: drop non-null assertion in sync presence touch (726f6e4)
- swarm: remove two orphan components and de-export internal helpers (d487c22)
- swarm: native button elements for ShareModal copy actions (c1baef9)
- swarm: add loading.tsx skeletons for /champions, /compare, /creator (04c6055)
- swarm: emit Article JSON-LD on public team report pages (edb0cc2)
- swarm: update changelog/Updates page for June 2026 (1c3375b)
