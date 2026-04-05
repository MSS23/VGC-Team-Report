# Feature Research

**Domain:** GDPR/CCPA Legal Compliance — Web App (v5.1 milestone)
**Researched:** 2026-04-05
**Confidence:** HIGH (GDPR text is primary law; CCPA thresholds verified from CA AG official sources; Clerk/Vercel processor status verified from official docs)

---

## Legal Applicability Assessment

Before defining features, actual legal exposure must be understood.

### GDPR Applicability

**Applies: YES — unconditionally.**

GDPR applies to any website that collects personal data from EU/EEA residents, regardless of where the business is incorporated or where the server is hosted. VGC Team Report collects: email addresses (via Clerk OAuth), usernames, profile data, IP addresses (via Vercel), and behavioral analytics (Vercel Analytics). All of this constitutes personal data under GDPR Article 4(1). There is no "small business" exemption under GDPR — the SME exemption only relaxes the requirement to appoint a Data Protection Officer and maintain formal Article 30 records, neither of which is relevant to the user-facing features needed here.

**What this means:** Privacy policy, cookie consent for non-essential cookies, and user rights (access, erasure, portability) are **legally required without exception**.

### CCPA Applicability

**Applies: LIKELY NO — but simple disclosure is still recommended.**

CCPA (as amended by CPRA) applies to for-profit businesses meeting at least one of:
- Annual gross revenue exceeding $26.6M (2026 adjusted threshold)
- Processing personal data of 100,000+ California residents/households per year
- Deriving 50%+ of revenue from selling/sharing personal data

VGC Team Report is a hobby/community project and does not plausibly meet any threshold. **Strict CCPA compliance is not legally required.** However, a "We do not sell personal information" statement costs one sentence and signals good-faith privacy practice. It also future-proofs against edge cases if user volume grows.

**What this means:** CCPA features are best-practice, not legal obligation. A single disclosure sentence in the Privacy Policy is sufficient — no separate opt-out flow, no verification UI.

---

## Feature Landscape

### Table Stakes — Legally Required or Universally Expected

These are features that GDPR mandates, or that users in 2026 expect from any app that handles their personal data. Missing these creates legal exposure or significantly damages trust.

| Feature | Legal Basis | Complexity | Notes |
|---------|-------------|------------|-------|
| Privacy Policy page (`/privacy`) | GDPR Art. 13/14 — mandatory transparency at data collection time | LOW | Must cover: data categories collected, legal basis for each (legitimate interest for core functionality; consent for analytics), retention periods, third-party processors, user rights (access/erasure/portability/restriction/objection), contact info for data requests. A well-crafted template from a reputable generator (TermsFeed, FreeprivacyPolicy.com) filled with accurate app-specific information is legally sufficient. |
| Terms of Service page (`/terms`) | Not GDPR — but essential for UGC platforms | LOW | Must cover: acceptable use policy, Pokemon/Game Freak/Nintendo IP disclaimer (not affiliated with TPC; all trademarks belong to their respective owners; fan/community use), user content ownership (users own their team data; app has a license to display), liability limits. Essential because users post team content publicly and the app aggregates/displays it. |
| Cookie consent banner | GDPR/ePrivacy Directive — required prior consent for non-essential cookies | MEDIUM | Vercel Analytics scripts are non-essential and must be blocked until explicit opt-in. Strictly necessary cookies (Clerk auth session tokens, CSRF tokens) do not require consent. Must provide "Accept All" + "Reject Non-Essential" as equal-prominence choices. Pre-ticked boxes or consent walls are illegal under GDPR. Consent stored in localStorage. |
| Footer legal links | GDPR Art. 13 — policy must be "easily accessible" at all times | LOW | Links to `/privacy`, `/terms`, and a cookie settings trigger in the site footer on every page. Regulators check for this first during complaint investigation. |
| Data deletion endpoint | GDPR Art. 17 — Right to Erasure ("right to be forgotten") | MEDIUM | User must be able to delete their account and all associated data. Involves: Clerk user deletion via `deleteUser()` API, plus explicit deletion of all app DB records (teams, shares, comments, reactions, bookmarks, follows, notifications, collaboration invitations, changelogs). DB records must be deleted first, then Clerk user. Referential integrity must be handled. |
| Data export endpoint | GDPR Art. 20 — Right to Data Portability | MEDIUM | User can download all their personal data in a machine-readable format. Scope: profile info (from Clerk), all teams/reports, comments, follows, bookmarks. JSON format (structured, machine-readable, interoperable — meets Art. 20 requirement). Response within 1 month legally required; instant self-service is the correct UX pattern. No fee can be charged. |

### Differentiators — Best Practice, Not Legally Required

These go beyond legal minimums and build genuine user trust. Appropriate for a community app with real users.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| CCPA "Do Not Sell" disclosure | Shows California users data isn't sold; good-faith gesture; future-proof | LOW | One paragraph or section in Privacy Policy: "We do not sell or share personal information as defined by the CCPA." No opt-out mechanism needed since no selling occurs. Zero implementation cost. |
| Cookie preference center (post-consent change) | Users can change analytics consent after initial decision | LOW-MEDIUM | A "Cookie Settings" link in the footer that re-opens the consent UI. Technically necessary if you honor opt-in — users who accepted should be able to revoke. Can be a simple modal. |
| Vercel Analytics conditional loading | Ensures analytics script never fires before consent is confirmed | LOW | Wrap `<Analytics />` in a client component that reads consent state from localStorage before rendering. `beforeSend` hook on Vercel Analytics can also filter events. This is the technical implementation of consent enforcement — not just UI. |
| Data retention statement | States explicitly when data is deleted (e.g., deleted accounts purged within 30 days) | LOW | Adds specificity to the Privacy Policy. Required to state retention periods under GDPR Art. 13(2)(a) — already in the Table Stakes privacy policy requirement, but worth calling out as a distinct implementation task. |

### Anti-Features — Commonly Considered, Often Wrong

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| "Accept All" only cookie banner | Simpler UX, one click | GDPR violation — users must be able to reject non-essential cookies as easily as accepting. Regulators (CNIL, DPC, ICO) have issued fines and enforcement actions for this pattern specifically in 2024-2025. | "Accept All" + "Reject Non-Essential" as equally prominent buttons. Optional "Manage Preferences" for granularity. |
| Cookie wall (block content until consent given) | Maximizes opt-in rates | Illegal under GDPR. "Cookie walls" that deny service to users who decline tracking are an invalid form of consent — consent must be freely given, and conditioning service access on consent is coercion. | Show banner, allow site use regardless of cookie decision. Analytics is non-essential; the app works without it. |
| Consent for Clerk auth session cookies | "Being thorough" | Auth session tokens (Clerk's `__session` and `__client_uat` cookies) are strictly necessary for the service the user explicitly requested. These are exempt from consent requirements under ePrivacy Directive Art. 5(3). Over-asking for consent on functional cookies erodes trust without adding legal protection. | Only ask consent for Vercel Analytics scripts. Strictly necessary cookies need only be disclosed in the Privacy Policy. |
| Full Data Processing Agreement (DPA) with users | Sounds like enterprise compliance | A DPA is a controller-to-processor agreement between two organizations (e.g., VGC Team Report as controller and Vercel as processor). It is not a user-facing document. Creating a user-facing "DPA" is legally incorrect and confusing. | Privacy Policy covers the relationship with users. App already has DPAs available with Clerk, Vercel, Neon, and Upstash — link to them from the Privacy Policy's "Third-Party Processors" section. |
| Monthly consent re-prompting | "Ensures fresh consent" | GDPR requires consent to be freely given, specific, informed, and unambiguous — it does not expire monthly. Aggressive re-prompting violates the spirit of consent (consent cannot be coerced through annoyance) and destroys UX. | Store consent in localStorage, re-prompt only after 12 months or when the purposes stated in the consent change materially. |
| Full CCPA opt-out verification flow | "Full CCPA compliance" | VGC Team Report does not meet CCPA thresholds. Building a California-specific identity verification opt-out flow wastes significant development time for zero legal benefit at current scale. | One sentence in Privacy Policy: "We do not sell personal information." Done. Revisit if revenue or user volume crosses CCPA thresholds. |
| DPO (Data Protection Officer) appointment | Enterprise compliance pattern | DPO requirement only applies to (a) public authorities, (b) organizations whose core activities involve large-scale systematic monitoring of individuals, or (c) large-scale processing of special category data. VGC Team Report meets none of these criteria. | Provide a contact email for data requests in the Privacy Policy (e.g., privacy@domain.com or a personal email). This satisfies the GDPR Art. 13 contact requirement without a formal DPO. |

---

## Feature Dependencies

```
[Footer Legal Links]
    └──requires──> [Privacy Policy Page]
    └──requires──> [Terms of Service Page]
    └──requires──> [Cookie Settings trigger / re-open consent UI]

[Cookie Consent Banner]
    └──must load before──> [Vercel Analytics script]
    └──stores consent state in──> [localStorage]
    └──references──> [Privacy Policy Page] (link in banner copy)
    └──requires──> [Cookie disclosure section in Privacy Policy]

[Vercel Analytics Conditional Loading]
    └──reads consent from──> [localStorage (set by Cookie Consent Banner)]
    └──implements enforcement for──> [Cookie Consent Banner]

[Data Deletion Endpoint]
    └──requires auth from──> [Clerk — authenticated user only]
    └──must delete first──> [All app DB records with user_id FK]
    └──then calls──> [Clerk deleteUser() API]
    └──mentioned in──> [Privacy Policy — user rights section]

[Data Export Endpoint]
    └──requires auth from──> [Clerk — user can only export own data]
    └──reads from──> [Clerk user profile API]
    └──reads from──> [All app DB tables with user_id FK]
    └──outputs──> [JSON zip download]
    └──rate-limited by──> [Upstash Redis rate limiter (already in place)]
    └──mentioned in──> [Privacy Policy — user rights section]

[CCPA Disclosure]
    └──lives in──> [Privacy Policy Page] (no separate page needed)
    └──no opt-out mechanism required──> (data is not sold)
```

### Dependency Notes

- **Cookie Consent Banner must block Vercel Analytics before script execution.** This is the core technical challenge. Vercel's `<Analytics />` component from `@vercel/analytics` begins tracking on import — it cannot simply be rendered and then paused. The correct pattern is conditional rendering: only render `<Analytics />` if consent state in localStorage is `analytics: true`. A client component checks localStorage on hydration and conditionally renders the analytics script.
- **Data Deletion requires DB-first, then Clerk.** Deleting the Clerk user first removes auth credentials, leaving app DB records orphaned and potentially un-deletable if the user_id FK is needed to identify them. The correct order: (1) verify user is authenticated, (2) delete all app DB records with `user_id = clerk_user_id`, (3) call `clerkClient.users.deleteUser(userId)`, (4) sign out and redirect.
- **Data Export must cover ALL tables with user data.** Missing a table is a GDPR violation — the export must be exhaustive. Tables to include: `users`/profiles, `teams`, `shares`, `comments`, `reactions`, `bookmarks`, `follows`, `notifications`, `collaboration_invitations`, `changelogs`. Any table added in the future with a `user_id` column must also be included.
- **Privacy Policy must be accurate.** The policy must name the actual third-party processors. Listing a processor not in use (or missing one that is in use) creates a compliance gap. Verify against current `.env.local` and infrastructure.

---

## MVP Definition

This is an existing product adding a compliance milestone. The scope is defined by legal requirement, not product discovery.

### Must Ship (v5.1 — Legal Compliance)

- [ ] **Privacy Policy page (`/privacy`)** — Covers GDPR Art. 13/14: data categories, legal basis (legitimate interest for core functionality, consent for analytics), retention periods, third-party processors (Clerk, Vercel, Neon, Upstash), user rights (access/erasure/portability/restriction/objection), data request contact, Pokemon IP acknowledgment. Accessible from footer on all pages.
- [ ] **Terms of Service page (`/terms`)** — Covers: acceptable use, Pokemon/Game Freak/Nintendo/TPC trademark disclaimer (fan community, not affiliated), user content ownership (user retains ownership; app has display license), prohibited use (cheating, harassment, impersonation), liability limits. Accessible from footer on all pages.
- [ ] **Cookie consent banner** — Appears on first visit; "Accept All" + "Reject Non-Essential" with equal visual prominence; blocks Vercel Analytics until consent granted; stores consent in localStorage; links to Privacy Policy.
- [ ] **Vercel Analytics conditional loading** — Technical enforcement of cookie consent: `<Analytics />` only renders when analytics consent is `true` in localStorage.
- [ ] **Data deletion endpoint (`DELETE /api/user/account`)** — Authenticated; deletes all DB records in correct cascade order; calls Clerk `deleteUser()`; signs user out; returns 200 on success. Rate-limited.
- [ ] **Data export endpoint (`GET /api/user/export`)** — Authenticated; returns JSON zip containing all user personal data from all tables; rate-limited (1 request per 24 hours per user via Upstash Redis).
- [ ] **Footer legal links** — `/privacy`, `/terms`, "Cookie Settings" trigger on every page layout.

### Add After v5.1 (Nice to Have)

- [ ] **Cookie preference center** — Modal allowing users to change their analytics consent after the initial decision. Useful for user trust; not blocking for launch.
- [ ] **In-app "My Data" settings page** — Surfaces delete/export as self-service buttons rather than raw API endpoints. Better UX but not legally required at launch.

### Explicitly Deferred (Out of Scope)

- [ ] Automated data retention enforcement (cron purge of old deleted accounts) — Good hygiene but not legally required to automate at this scale.
- [ ] Formal audit log of data access requests — Enterprise compliance pattern; irrelevant for hobby project.
- [ ] Consent Management Platform (Cookiebot, OneTrust, Didomi) — Paid third-party CMPs add recurring cost and complexity; a custom banner is legally equivalent and sufficient for this scope.
- [ ] Article 30 Records of Processing Activities — SME exemption applies (fewer than 250 employees); this is not required.

---

## Feature Prioritization Matrix

| Feature | Legal Risk if Missing | User Value | Implementation Cost | Priority |
|---------|----------------------|------------|---------------------|----------|
| Privacy Policy page | HIGH — GDPR Art. 13 breach | MEDIUM | LOW | P1 |
| Terms of Service page | MEDIUM — UGC liability exposure | MEDIUM | LOW | P1 |
| Cookie consent banner + Analytics gate | HIGH — GDPR/ePrivacy breach | LOW (friction) | MEDIUM | P1 |
| Footer legal links | MEDIUM — policy inaccessibility | LOW | LOW | P1 |
| Data deletion endpoint | HIGH — GDPR Art. 17 breach | HIGH (user control) | MEDIUM | P1 |
| Data export endpoint | HIGH — GDPR Art. 20 breach | MEDIUM (user control) | MEDIUM | P1 |
| CCPA disclosure (in Privacy Policy) | LOW — not legally required | LOW | LOW | P2 |
| Cookie preference center | LOW | MEDIUM | LOW-MEDIUM | P2 |
| In-app "My Data" settings page | NONE | HIGH (UX) | LOW | P2 |

---

## What GDPR Actually Requires vs. Nice-to-Have

This section directly addresses the quality gate: small hobby project vs. enterprise requirements.

### Legally Required — No Exemptions for Small Apps

1. **Accessible privacy policy** with specific mandatory content: what data is collected, why (legal basis), how long it is kept, who it is shared with, and how users can exercise their rights. A template filled with accurate app-specific information satisfies this requirement. (GDPR Art. 13/14)
2. **Prior cookie consent** for non-essential cookies before those cookies/scripts are set or executed. Analytics and tracking scripts must not run without prior opt-in. (ePrivacy Directive Art. 5(3), GDPR Art. 6)
3. **Ability to respond to Subject Access Requests** within 1 month. For a small app, an authenticated self-service data export endpoint fulfills this. (GDPR Art. 15/20)
4. **Ability to delete user data on request** (right to erasure). An authenticated self-service account deletion endpoint fulfills this. (GDPR Art. 17)
5. **Data breach notification** to the relevant supervisory authority within 72 hours if a breach occurs. This is a process/policy, not a feature — document the response plan in the Privacy Policy.

### Best Practice — Low Cost, Strongly Recommended

- Cookie preference center allowing users to change consent after initial decision
- Explicit retention periods in the Privacy Policy (required to state them under GDPR; automated enforcement is optional)
- CCPA "We do not sell" disclosure (one sentence, zero risk)
- Links to sub-processor DPAs in the Privacy Policy (Clerk, Vercel, Neon, Upstash all have publicly available DPAs)
- Rate-limiting the data export endpoint (prevents abuse; Upstash Redis already in place)

### Enterprise Patterns — Explicitly Skip

| Pattern | Why Enterprise | Why Skip |
|---------|---------------|----------|
| DPO appointment | Required for large-scale/systematic monitoring or sensitive data processing | Not triggered by a VGC team-sharing app |
| Article 30 Records of Processing | Required for 250+ employee organizations | SME exemption applies |
| DPIA (Data Protection Impact Assessment) | Required for high-risk processing (biometrics, systematic public monitoring, sensitive categories) | Not triggered here |
| ISO 27001 / SOC 2 | Security certifications for enterprise sales | Irrelevant for hobby project |
| EU Representative | Required only if commercially targeting EU users without EU establishment | Fan/community app; no commercial targeting |
| Consent Management Platform (paid) | Scale and multi-jurisdiction complexity | A focused custom banner is legally equivalent |
| Separate CCPA opt-out verification flow | Required only if data is actually sold or shared for value | App does not sell data |

---

## Third-Party Processor Summary

Must be disclosed in Privacy Policy. These are the processors VGC Team Report uses:

| Processor | Personal Data Processed | DPA Available | Notes |
|-----------|------------------------|---------------|-------|
| Clerk | Email addresses, OAuth identity tokens, session data, profile data | Yes — clerk.com/legal/dpa | GDPR compliant; Data Privacy Framework (EU-US) certified; can delete users via API |
| Vercel | IP addresses, request logs, analytics events (pages viewed, referrers) | Yes — vercel.com/legal/dpa | Analytics is described as "cookieless" but IP/device data is still personal data under GDPR |
| Neon (Postgres) | All application data: teams, reports, comments, follows, reactions, bookmarks | Yes — neon.tech | EU region available; check that production instance uses EU region if targeting EU users |
| Upstash (Redis) | Cached query results; rate limit counters; session metadata | Yes — upstash.com | Check region configuration |

---

## Sources

- [GDPR Article 13 — gdpr-info.eu](https://gdpr-info.eu/art-13-gdpr/) (HIGH confidence — primary law text)
- [GDPR Article 17 — Right to Erasure — gdpr-info.eu](https://gdpr-info.eu/art-17-gdpr/) (HIGH confidence — primary law text)
- [GDPR Article 20 — Right to Data Portability — gdpr-info.eu](https://gdpr-info.eu/art-20-gdpr/) (HIGH confidence — primary law text)
- [ICO Right to Data Portability Guidance — ico.org.uk](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-data-portability/) (HIGH confidence — UK supervisory authority official guidance)
- [CCPA Applicability 2026 — feroot.com/blog](https://www.feroot.com/blog/ccpa-applicability-website-california-law/) (HIGH confidence — consistent with CA AG official thresholds)
- [CCPA 2026 Requirements — secureprivacy.ai](https://secureprivacy.ai/blog/ccpa-requirements-2026-complete-compliance-guide) (MEDIUM confidence — legal publisher)
- [Clerk GDPR / DPA — clerk.com/legal/dpa](https://clerk.com/legal/dpa) (HIGH confidence — official Clerk documentation)
- [Vercel Analytics Privacy Policy — vercel.com/docs/analytics/privacy-policy](https://vercel.com/docs/analytics/privacy-policy) (HIGH confidence — official Vercel documentation)
- [GDPR Cookie Consent 2026 — secureprivacy.ai](https://secureprivacy.ai/blog/gdpr-cookie-consent-requirements-2025) (MEDIUM confidence — legal publisher, consistent with regulator guidance)
- [Next.js Cookie Consent without libraries — buildwithmatija.com](https://www.buildwithmatija.com/blog/build-cookie-consent-banner-nextjs-15-server-client) (MEDIUM confidence — implementation guide)
- [GDPR Cookie Consent in 2026 is a Runtime Problem — dev.to/auditzo](https://dev.to/auditzo/gdpr-cookie-consent-in-2026-its-a-runtime-problem-not-a-banner-problem-4fok) (MEDIUM confidence — developer analysis of enforcement timing)

---

*Feature research for: GDPR/CCPA Legal Compliance — VGC Team Report v5.1*
*Researched: 2026-04-05*
