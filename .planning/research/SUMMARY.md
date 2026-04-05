# Project Research Summary

**Project:** VGC Team Report v5.1 — Legal Compliance and Data Protection
**Domain:** GDPR/CCPA compliance integration into existing Next.js + Clerk + Neon Postgres app
**Researched:** 2026-04-05
**Confidence:** HIGH

## Executive Summary

VGC Team Report v5.1 is a compliance milestone, not a product discovery exercise. The scope is defined by legal obligation: GDPR applies unconditionally to any site collecting personal data from EU residents (email, OAuth identity, analytics), and the app has real users in that category. The required features are non-negotiable — Privacy Policy, cookie consent with analytics gating, data export, and account deletion. The good news is that all the infrastructure needed already exists: Clerk handles auth and user deletion, Neon Postgres holds the data, Upstash Redis handles caching, and the App Router handles static pages. Only one net-new npm package is warranted (`vanilla-cookieconsent` v3.1.0, ~10KB).

The recommended approach is incremental delivery in dependency order: static legal pages first (zero risk, no dependencies), then cookie consent (independent of data APIs), then data export and account deletion APIs (highest complexity, deepest legal exposure), then a Data Rights Hub UI that surfaces the APIs to users. This order means the highest-value legal coverage (Privacy Policy, Terms of Service, cookie consent) ships earliest and is not blocked by the more complex deletion work.

The dominant risks are implementation completeness, not technology selection. Incomplete deletion (missing one of 13 tables) is a GDPR Article 17 violation. Analytics firing before consent makes the banner legally meaningless. A privacy policy using vague vendor-deferring language instead of specific retention periods and named legal bases fails Article 13. Each pitfall is easy to get wrong and requires explicit checklists at verification time, not just code review.

---

## Key Findings

### Recommended Stack

The existing stack covers almost everything. No database migrations, no new infrastructure, no new auth layers. The entire compliance feature set is API routes, React components, and static pages on top of what already exists in production. Clerk's `clerkClient.users.deleteUser()` handles auth-layer erasure; `@neondatabase/serverless` handles data export queries and deletion transactions; `@upstash/redis` handles rate limiting and cache invalidation; Next.js App Router handles static legal pages.

The only justified net-new dependency is `vanilla-cookieconsent` v3.1.0 — a pure vanilla JS/ESM library (~10KB) that provides a GDPR-compliant consent banner with per-category callbacks. It avoids the hydration issues of React-specific consent libraries and requires no SaaS fees or external scripts. All paid CMPs (Termly, Cookiebot, OneTrust) are explicitly out of scope for a hobby app with no advertising.

**Core technologies (net-new for v5.1):**
- `vanilla-cookieconsent` ^3.1.0: cookie consent banner — lightweight ESM, per-category callbacks, no SaaS fees
- `GET /api/user/export` (custom route, no new package): GDPR Article 20 data portability
- `DELETE /api/user/delete` (custom route, no new package): GDPR Article 17 right to erasure

**Existing stack leveraged (no changes required):**
- `@clerk/nextjs` ^7.0.6: `deleteUser()`, `getUser()`, `auth()` — all GDPR deletion/export APIs are present in this version
- `@neondatabase/serverless` ^1.0.2: parallel table queries for export; ordered transactional delete
- `@upstash/redis` ^1.37.0: rate-limit export endpoint (1 per 24h); flush user cache keys on deletion
- Clerk `user.deleted` webhook (svix): safety-net reconciliation signal only — not the primary deletion trigger

### Expected Features

The feature set is fully determined by legal requirements. There is no ambiguity about what must ship.

**Must have (table stakes — GDPR legally required):**
- Privacy Policy page (`/privacy`) — GDPR Art. 13/14 mandatory; must name legal bases, retention periods, processors, user rights
- Terms of Service page (`/terms`) — essential for a UGC platform; Pokemon IP disclaimer required
- Cookie consent banner — blocks Vercel Analytics until explicit opt-in; "Accept All" + "Reject All" with equal visual prominence
- Vercel Analytics conditional loading — technical enforcement; `<Analytics />` must not render without consent
- Data deletion endpoint (`DELETE /api/user/delete`) — GDPR Art. 17; cascades 13 tables + Clerk deletion in correct order
- Data export endpoint (`GET /api/user/export`) — GDPR Art. 20; all 13 user-linked tables as structured JSON
- Footer legal links — links to `/privacy`, `/terms`, and cookie settings trigger on every page

**Should have (best practice, low cost):**
- CCPA "Do Not Sell" disclosure — one paragraph in Privacy Policy; zero implementation cost
- Cookie preference center — "Cookie Settings" link to re-open consent UI after initial decision
- In-app Data Rights Hub (`/dashboard/privacy`) — surfaces export and delete as self-service UI behind auth

**Defer to v2+:**
- Automated data retention enforcement (cron purge of old deleted accounts)
- Formal audit log of data access requests
- Async export with polling for large accounts (relevant at 100+ reports per user)
- Article 30 Records of Processing Activities (SME exemption applies; not required)

### Architecture Approach

The architecture is an additive layer on top of the existing system — no existing routes, components, or DB schema change. New files fit cleanly into established codebase patterns: `components/legal/` mirrors `components/social/` and `components/ui/`; `lib/consent.ts` follows the `lib/db.ts` utility pattern; `app/dashboard/privacy/` sits inside the already-Clerk-protected dashboard.

The critical architectural decision is that cookie consent is client-side state managed in a `cookie_consent` cookie, not middleware. Vercel Analytics is a React component mounted in `layout.tsx` — only client-side conditional rendering can suppress it. Middleware cannot suppress component mounting and runs on every request for UI state only relevant on first visit.

**Major components:**
1. `CookieBanner` (new client component) — renders consent UI on first visit; writes `cookie_consent` cookie; one-click reject required
2. `ConsentGate` (new client component) — wraps `<Analytics />` and `<SpeedInsights />`; renders nothing if consent not granted
3. `lib/consent.ts` (new utility) — `getConsentLevel()` / `setConsentLevel()` cookie helpers shared by banner and gate
4. `GET /api/user/export/route.ts` (new API route) — parallel `Promise.all` queries across all 13 tables; JSON with `Content-Disposition: attachment`; rate-limited
5. `DELETE /api/user/delete/route.ts` (new API route) — 16-step ordered cascade (DB first, Clerk API step 15, Redis flush step 16)
6. `/app/terms/page.tsx` (new static page) — Terms of Service
7. `/app/privacy/page.tsx` (modified) — expanded from current stub to full GDPR/CCPA policy
8. `/app/dashboard/privacy/page.tsx` (new) — Data Rights Hub with export and delete triggers
9. `PageFooter.tsx` (modified) — add Terms link to `NAV_LINKS`
10. `layout.tsx` (modified) — mount `<CookieBanner />`; wrap analytics in `<ConsentGate>`

### Critical Pitfalls

1. **Analytics firing before consent is obtained** — Placing `<Analytics />` unconditionally in `layout.tsx` means the consent banner is legally meaningless. The script executes on first render before the user sees the banner. Gate with `<ConsentGate>` from day one; verify with a fresh incognito window and DevTools Network tab — zero analytics requests should appear before banner interaction.

2. **Incomplete deletion across 13 tables** — Deleting only `shares` rows leaves personal data in `notifications`, `follows`, `collections`, `collaborators`, `edit_changelog`, `share_versions`, `saved_reports`, `reactions`, `comments`, and `feedback`. Each missed table is a GDPR Article 17 violation. Build against a 13-table checklist; verify by querying every table for ghost rows after a test deletion.

3. **Clerk deletion ordered incorrectly** — Deleting the Clerk user before Neon DB purge means if the cascade fails mid-run, the user's data remains permanently orphaned with no Clerk identity to associate it with. Correct order: DB cascade first (steps 1-14), Clerk API call last (step 15), Redis flush last (step 16).

4. **Cookie consent dark patterns** — Pre-checked analytics toggles, asymmetric button styling, or multi-click rejection paths are the exact patterns CNIL fined Google €200M for. "Reject All" must be achievable in exactly one click from the initial banner, visually equal in weight to "Accept All". Any toggle in a preferences pane must default to off.

5. **Privacy Policy missing legally required sections** — The current `/privacy` stub does not satisfy GDPR Article 13: it lacks named Article 6 legal bases per processing activity, specific retention periods (not "per vendor policy"), a named data controller contact, the right to lodge a DPA complaint, or a complete third-party processor list. The policy must be written against regulatory checklists, not as developer prose.

---

## Implications for Roadmap

Based on combined research, a 5-phase structure is recommended. Dependencies drive the order: legal pages have no dependencies; cookie consent depends only on `lib/consent.ts` and `layout.tsx`; data APIs require the full schema (already confirmed by codebase inspection); the Data Rights Hub UI depends on both APIs being deployed.

### Phase 1: Legal Pages and Footer
**Rationale:** Zero dependencies, zero risk. Delivers the highest legal coverage (Art. 13/14 policy, ToS IP disclaimer) with no impact on existing functionality. The Privacy Policy must exist before any consent banner references it and before cookie consent can be considered complete. Can ship same day.
**Delivers:** Compliant `/privacy` page rewrite, new `/terms` page, footer links (Terms + cookie settings trigger) on all pages
**Addresses:** Privacy Policy, Terms of Service, Footer Legal Links, CCPA "Do Not Sell" disclosure (as inline section of `/privacy`)
**Avoids:** Pitfall 5 (policy missing required sections) — write section-by-section against GDPR Art. 13 + CCPA checklists, state specific retention periods, name each processor

### Phase 2: Cookie Consent and Analytics Gating
**Rationale:** Independent of data deletion APIs; can ship in parallel or sequentially after Phase 1. Must ship before any analytics are considered compliant. The `ConsentGate` pattern is the single most important technical correctness requirement in this milestone.
**Delivers:** `CookieBanner`, `ConsentGate`, `lib/consent.ts`, modified `layout.tsx` — analytics fully gated behind consent; one-click reject; equal-weight buttons
**Addresses:** Cookie consent banner, Vercel Analytics conditional loading, Cookie preference center (footer "Cookie Settings" link)
**Avoids:** Pitfall 4 (dark patterns — asymmetric buttons, pre-checked toggles, analytics firing before consent)

### Phase 3: Data Export API
**Rationale:** Simpler of the two data APIs (read-only, no cascade risk). Building and verifying the 13-table data map here also validates the completeness checklist before committing to the irreversible deletion cascade in Phase 4. Getting export right first de-risks Phase 4.
**Delivers:** `GET /api/user/export/route.ts` — authenticated, parallel queries across all 13 tables, JSON download, rate-limited (1 per 24h via Upstash Redis)
**Addresses:** Data export endpoint (GDPR Art. 20)
**Avoids:** Pitfall 6 (export missing related tables) — diff export output against the 13-table deletion checklist

### Phase 4: Account Deletion API
**Rationale:** Highest-complexity, highest-stakes work. Must be last of the backend phases because it is irreversible and requires the complete 13-table map validated in Phase 3. The correct FK-safe cascade order is non-trivial and requires explicit verification against the codebase schema.
**Delivers:** `DELETE /api/user/delete/route.ts` — 16-step ordered cascade (DB first, Clerk API step 15, Redis flush step 16); includes feedback row anonymisation
**Addresses:** Data deletion endpoint (GDPR Art. 17)
**Avoids:** Pitfall 1 (incomplete deletion), Pitfall 2 (Clerk deletion order), Pitfall 3 (Redis cache serving deleted user data post-erasure)

### Phase 5: Data Rights Hub UI
**Rationale:** Depends on Phases 3 and 4 being deployed and verified in production. Surfaces the compliance APIs as self-service UI within the already-auth-protected dashboard. Low technical complexity but highest user-facing trust value.
**Delivers:** `/app/dashboard/privacy/page.tsx` — "Download My Data" button (triggers export download); "Delete My Account" button (typed "DELETE" confirmation modal, deletion flow, sign-out redirect)
**Addresses:** In-app "My Data" settings page
**Avoids:** UX pitfall — deletion must require typed confirmation and display a summary of what will be permanently removed; no accidental one-click account erasure

### Phase Ordering Rationale

- Phase 1 before all others: the Privacy Policy is referenced by the cookie consent banner copy and by both data rights endpoints — it must exist first.
- Phases 2, 3, and 4 are independent of each other but all benefit from Phase 1 completing first. They can be parallelized but sequential delivery reduces context-switching.
- Phase 4 (deletion) benefits from Phase 3 (export) completing first: the same 13-table data map is used for both, and the read-only export is safer to validate than the irreversible deletion.
- Phase 5 strictly depends on Phases 3 and 4 being deployed and smoke-tested in production.

### Research Flags

Phases needing deeper research during planning: none. The domain is defined by primary law (GDPR Articles 13, 17, 20), and the architecture was validated by direct codebase inspection of the full 15-table schema. No unknowns remain in engineering patterns or legal requirements.

Phases with well-documented standard patterns (skip research-phase for all):
- **Phase 1:** Static Next.js App Router pages — no research needed
- **Phase 2:** `vanilla-cookieconsent` v3.1.0 fully documented at cookieconsent.orestbida.com; auth pattern identical to existing routes
- **Phase 3:** Auth pattern identical to existing `/api/user/analytics/route.ts`; `Promise.all` timeout mitigation is documented
- **Phase 4:** Cascade order determined by direct schema inspection; Clerk delete API confirmed in official docs
- **Phase 5:** Follows existing dashboard page patterns in the codebase

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | `vanilla-cookieconsent` v3.1.0 confirmed from GitHub releases (Feb 2025); Clerk `deleteUser()` API confirmed from official docs; all other capabilities verified from existing production dependencies — no version upgrades needed |
| Features | HIGH | GDPR Articles 13, 17, 20 sourced from primary law text; CCPA thresholds verified from CA AG official sources; Clerk and Vercel processor status verified from official DPAs |
| Architecture | HIGH | Based on direct codebase inspection of `src/lib/db.ts` (full 15-table schema), all existing API routes, middleware, layout, and footer — not inferred from external documentation |
| Pitfalls | HIGH | Regulatory enforcement patterns verified from CNIL and ICO 2025 enforcement records; Clerk webhook unreliability confirmed from official Svix docs; Vercel timeout constraints from official Vercel docs |

**Overall confidence:** HIGH

### Gaps to Address

- **CCPA formal legal review (MEDIUM confidence):** Research confirmed VGC Team Report does not plausibly meet CCPA thresholds, but this is from legal publisher sources, not a licensed attorney. A one-paragraph "we do not sell data" disclosure in the Privacy Policy costs one sentence and mitigates any edge-case exposure.
- **Neon production region:** If the production Neon Postgres instance is in a US region, EU-US data transfers require naming the transfer mechanism in the Privacy Policy (Standard Contractual Clauses via Neon's DPA). Verify the production database region before drafting the Privacy Policy's processor section.
- **Feedback row handling:** Research recommends anonymising feedback rows (null out `submitter_id`, `submitter_name`, `contact`) rather than hard-deleting them, to preserve bug reports for the app owner. This is a business decision that must be documented explicitly in the Privacy Policy's retention section.
- **Export response size at scale:** The `Promise.all` parallel query pattern is sufficient for current data volumes. If any user has 100+ reports with large JSONB blobs, export may approach Vercel's 1MB response limit. This is a known deferred concern; add `LIMIT 1000` per table and a `truncated: true` flag as a precaution at build time.

---

## Sources

### Primary (HIGH confidence)
- [GDPR Article 13 — gdpr-info.eu](https://gdpr-info.eu/art-13-gdpr/) — required privacy notice elements
- [GDPR Article 17 — gdpr-info.eu](https://gdpr-info.eu/art-17-gdpr/) — right to erasure obligations
- [GDPR Article 20 — gdpr-info.eu](https://gdpr-info.eu/art-20-gdpr/) — data portability format requirements
- [Clerk docs — deleteUser()](https://clerk.com/docs/reference/backend/user/delete-user) — confirmed API in `@clerk/nextjs` ^7.x
- [Clerk Data Processing Addendum](https://clerk.com/legal/dpa) — processor status, EU transfer basis, DPA signing requirement
- [vanilla-cookieconsent GitHub releases](https://github.com/orestbida/cookieconsent/releases) — v3.1.0 confirmed February 2025
- [vanilla-cookieconsent official docs](https://cookieconsent.orestbida.com/) — category configuration, ESM format, callback API
- [ICO Right to Data Portability Guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-data-portability/) — UK supervisory authority guidance
- Direct codebase inspection: `src/lib/db.ts`, `src/middleware.ts`, `src/app/api/user/analytics/route.ts`, `src/app/api/cleanup/route.ts`, `src/app/privacy/page.tsx`, `src/components/layout/PageFooter.tsx`, `src/app/layout.tsx`

### Secondary (MEDIUM confidence)
- [CCPA Applicability 2026 — feroot.com](https://www.feroot.com/blog/ccpa-applicability-website-california-law/) — consistent with CA AG official thresholds
- [GDPR Cookie Consent 2026 — secureprivacy.ai](https://secureprivacy.ai/blog/gdpr-cookie-consent-requirements-2025) — enforcement posture, consistent with regulator guidance
- [CNIL Cookie Enforcement 2025](https://secureprivacy.ai/blog/gdpr-cookie-consent-requirements-2025) — Google €200M and SHEIN €150M fines for dark patterns
- [ICO 1000 Website Review 2025](https://www.auditzo.com/blog/gdpr-cookie-consent-rules-2025) — 134 warnings from 200 sites in January 2025 sweep
- [CCPA Do Not Sell requirements — Termly](https://termsbox.com/blog/ccpa-do-not-sell-page-requirements) — affirmative non-selling statement sufficient when data is not sold

---

*Research completed: 2026-04-05*
*Ready for roadmap: yes*
