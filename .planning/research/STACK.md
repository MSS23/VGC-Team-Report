# Stack Research

**Domain:** Legal Compliance Infrastructure (GDPR, CCPA, Cookie Consent, Data Rights) — v5.1 additions to VGC Team Report
**Researched:** 2026-04-05
**Confidence:** HIGH (cookie consent library, Clerk deletion/export API) / MEDIUM (CCPA scope for hobby app)

---

## Context: What Already Exists (Do Not Re-Introduce)

The following are **in production** and directly relevant to legal compliance work:

| Capability | Already Provided By | Compliance Relevance |
|------------|---------------------|----------------------|
| Authentication + user identity | `@clerk/nextjs` ^7.0.6 | User deletion via `clerkClient.users.deleteUser()`, data via `currentUser()` |
| Database | `@neondatabase/serverless` ^1.0.2 + raw SQL on Neon Postgres | Holds all user-generated data; source for GDPR data export |
| Caching | `@upstash/redis` ^1.37.0 | Must be cleared when user deletes account |
| Validation | `zod` ^4.3.6 | Validate deletion/export request inputs |
| Static pages routing | Next.js 16 App Router | Privacy Policy, ToS, and CCPA pages are static `page.tsx` files — no new infra |
| Webhook handling | Clerk webhooks (svix) already used | `user.deleted` webhook syncs Clerk deletion to Postgres |

**No database migration is needed for v5.1.** Compliance work is API routes, React components, and static pages only.

---

## New Capabilities Required for v5.1

### 1. Cookie Consent Management

**Problem:** GDPR requires explicit opt-in for non-essential cookies (analytics, functional). The app must not fire any tracking script until the user consents, and must store and respect that preference.

**What VGC Team Report actually uses:**
- Clerk session cookie (strictly necessary — exempt)
- Vercel Analytics / Speed Insights (analytics — requires consent if EU users are present)
- No advertising cookies, no third-party ad networks

**Recommended library:** `vanilla-cookieconsent` (orestbida) v3.1.0

**Why this library over alternatives:**
- Pure vanilla JS with ESM export — works with Next.js App Router without `"use client"` wrapper overhead or hydration issues that plague React-specific libraries
- Granular category consent (necessary, analytics, functional) with per-category callbacks — allows blocking Vercel Analytics until user opts in
- Ships its own CSS (one import) and is fully customizable via Tailwind class overrides
- 3.1.0 released February 2025 — actively maintained, not abandoned
- ~10KB bundle — smaller than `react-cookie-consent` (10.0.1) which pulls in React synthetic event overhead for a non-interactive UI element
- No SaaS fees, no phone-home, no external consent platform dependency
- Official docs: https://cookieconsent.orestbida.com/

**Why NOT `react-cookie-consent` (v10.0.1):**
- Wraps a simple banner in a React component tree; overkill for what is a static notification bar
- Less granular — designed for accept/reject, not per-category opt-in/out

**Why NOT Termly / Cookiebot / OneTrust:**
- SaaS CMP platforms with monthly fees ($10–200/mo)
- Inject external scripts that themselves are a privacy risk
- Total overkill for a hobby app with no advertising

**Integration pattern in Next.js App Router:**
```tsx
// src/components/CookieConsent.tsx — "use client"
// Initialize vanilla-cookieconsent in useEffect after hydration
// Store consent in localStorage key 'cc_cookie' (library default)
// On analytics consent: dynamically enable @vercel/analytics
// On analytics reject: ensure Analytics component is not rendered
```

---

### 2. Data Export API (GDPR Article 20 — Right to Data Portability)

**Problem:** GDPR requires the app to provide a machine-readable export of all personal data held about a user within 30 days of request.

**What data VGC Team Report holds per user:**
- Clerk profile data: email, display name, avatar URL, OAuth providers, created_at
- `shares` rows: team reports authored by the user
- `follows` rows: who the user follows and who follows them
- `comments` rows: comments the user has made
- `reactions` rows: reactions the user has placed
- `notifications` rows: notification history
- `feedback` rows: feedback submissions
- `bookmarks` rows: saved teams

**Recommended approach: Custom Next.js API Route — no new library**

A `GET /api/user/export` route that:
1. Authenticates via `auth()` from `@clerk/nextjs/server` (already installed)
2. Queries all user-owned rows across relevant tables using `@neondatabase/serverless` (already installed)
3. Fetches Clerk profile via `clerkClient.users.getUser(userId)` (already installed)
4. Assembles a single JSON object
5. Returns with `Content-Disposition: attachment; filename="my-vgc-data.json"` header

**Why JSON and not PDF:**
- GDPR Article 20 specifies "structured, commonly used, machine-readable format" — JSON is the correct output
- PDF generation (e.g. `@react-pdf/renderer`) is expensive and unnecessary; a data export is for portability, not presentation
- The existing PDF export feature (already shipped) serves the presentation case

**Why no new library:**
- The export is a series of `SELECT` queries + JSON serialization — entirely handled by existing `@neondatabase/serverless` and `JSON.stringify`
- Rate-limit the endpoint using existing Upstash Redis to prevent abuse (one export per user per 24h)

---

### 3. Account and Data Deletion API (GDPR Article 17 — Right to Erasure)

**Problem:** Users must be able to delete their account and all associated data. The app must remove or anonymize all personal data within a reasonable timeframe (GDPR standard: 30 days; best practice: immediately).

**Recommended approach: Custom Next.js API Route — no new library**

A `DELETE /api/user/account` route that:
1. Authenticates via `auth()` — confirms the user is deleting their own account
2. Deletes all user-authored rows from Postgres in a transaction:
   - `DELETE FROM shares WHERE clerk_user_id = $1`
   - `DELETE FROM comments WHERE clerk_user_id = $1`
   - `DELETE FROM reactions WHERE clerk_user_id = $1`
   - `DELETE FROM follows WHERE follower_id = $1 OR following_id = $1`
   - `DELETE FROM notifications WHERE user_id = $1`
   - `DELETE FROM feedback WHERE clerk_user_id = $1`
   - `DELETE FROM bookmarks WHERE user_id = $1`
3. Clears all Redis cache keys associated with the user (pattern-match on `user:{userId}:*`)
4. Calls `clerkClient.users.deleteUser(userId)` to remove the Clerk auth record
5. Returns 200 with confirmation

**Clerk's `deleteUser()` API** (confirmed HIGH confidence via official docs):
```typescript
// Available in @clerk/nextjs ^7.x
import { clerkClient } from '@clerk/nextjs/server'
await clerkClient.users.deleteUser(userId)
```

**Webhook backup:** Clerk fires a `user.deleted` webhook event after deletion. The existing webhook handler (`/api/webhooks/clerk`) should handle this event as a safety net to catch any Postgres rows missed by the direct deletion — sets a `deleted_at` tombstone on any remaining rows.

**Why hard delete over anonymization:**
- Simpler; no risk of accidentally re-linking anonymized data
- Appropriate for a hobby app where user data is not operationally critical to retain
- GDPR "right to erasure" is most cleanly satisfied by actual deletion

---

### 4. Static Legal Pages — No Library

**Problem:** The app needs Privacy Policy, Terms of Service, and CCPA disclosure pages.

**Recommended approach: Static Next.js pages — no library, no CMS**

Three new routes in the App Router:
- `src/app/privacy/page.tsx` — Privacy Policy (GDPR Article 13/14 compliant)
- `src/app/terms/page.tsx` — Terms of Service
- `src/app/ccpa/page.tsx` — CCPA disclosures ("Do Not Sell My Personal Information")

**Why static pages over a CMS or legal service:**
- Legal text changes rarely (at most a few times per year)
- No SEO or dynamic content requirements
- A CMS (Contentful, Sanity) adds cost, ops burden, and a new integration for content that a developer can update in a text editor
- Legal text generators (Termly, iubenda) produce generic output; hand-written policy is more accurate to what the app actually does

**CCPA scope for VGC Team Report:**
The formal "Do Not Sell My Personal Information" opt-out mechanism (with a GPC signal handler) is legally mandatory only for businesses that sell or share personal information. VGC Team Report does not sell or share user data with third parties. However:
- A CCPA disclosure page is still best practice and prevents user confusion
- The page should affirmatively state: "We do not sell your personal information"
- No GPC signal handler or opt-out form is needed (no data selling to opt out of)
- Confidence: MEDIUM — confirmed from CCPA.com guidance; formal legal review recommended

---

## Recommended Stack (Net-New Additions for v5.1)

### New npm Package

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `vanilla-cookieconsent` | ^3.1.0 | Cookie consent banner with granular opt-in/out | Lightweight (~10KB), no SaaS fees, ESM-compatible with Next.js App Router, actively maintained, per-category callbacks to conditionally enable Vercel Analytics |

### New API Routes (no new packages)

| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/user/export` | GET | Download all user data as JSON | Yes — Clerk `auth()` |
| `/api/user/account` | DELETE | Delete account + all user data | Yes — Clerk `auth()` |

### New Static Pages (no new packages)

| Page | Purpose |
|------|---------|
| `/privacy` | GDPR-compliant privacy policy |
| `/terms` | Terms of Service |
| `/ccpa` | CCPA disclosures |

### Existing Capabilities Leveraged

| Existing Asset | New Usage in v5.1 |
|---------------|-------------------|
| `clerkClient.users.deleteUser()` | Account deletion endpoint |
| `clerkClient.users.getUser()` | Include Clerk profile in data export |
| `@neondatabase/serverless` | Query all user rows for export; transactional delete for erasure |
| `@upstash/redis` | Rate-limit export endpoint; flush user cache keys on deletion |
| Clerk `user.deleted` webhook | Safety net to tombstone any remaining Postgres rows |

---

## Installation

```bash
# One new package
npm install vanilla-cookieconsent
```

```bash
# Nothing else. All other capabilities use existing stack:
# @clerk/nextjs ^7.0.6        — deleteUser(), getUser(), auth()
# @neondatabase/serverless     — data export queries, deletion transactions
# @upstash/redis               — rate limiting, cache flush on delete
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|------------------------|
| `vanilla-cookieconsent` v3.1.0 | `react-cookie-consent` v10.0.1 | React-specific if you need deep React context integration (not needed here) |
| `vanilla-cookieconsent` v3.1.0 | Termly / Cookiebot / OneTrust | If app processes advertising data, has IAB TCF requirements, or requires a legally-backed consent audit trail (not applicable to hobby app) |
| Custom `/api/user/export` route | `gdpr-tools` or similar npm package | If the app has complex data relationships across 20+ tables or multi-tenant data segregation requirements |
| Hard delete via `deleteUser()` + SQL | Anonymization (replace PII with placeholders) | If historical analytics on deleted user behavior is needed (not applicable) |
| Static `page.tsx` for legal text | Headless CMS (Contentful, Sanity) | If legal text needs non-developer editing, versioning, or multi-locale variants managed by a legal team |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Termly / Cookiebot / OneTrust | SaaS CMPs cost $10–200/mo, inject external scripts, and are overkill for a hobby app with no advertising | `vanilla-cookieconsent` v3.1.0 — free, self-hosted, no external calls |
| `@react-pdf/renderer` or `pdfmake` for data export | GDPR Article 20 requires machine-readable format; PDF is for humans, not portability | Return JSON with `Content-Disposition: attachment` header |
| `gdpr-tools`, `express-gdpr`, or similar npm packages | These target Express.js apps; the data export and deletion for this app is simple enough to be 2 API routes with existing DB/auth clients | Custom route handlers with existing `@neondatabase/serverless` and `@clerk/nextjs/server` |
| Stripe/Chargebee GDPR erasure webhooks | No payments integration in this app | N/A |
| Cookie scanning / auto-categorization services | The app's cookies are fully known (Clerk session + optional Vercel Analytics) — no discovery service needed | Hard-code the two consent categories in `vanilla-cookieconsent` config |
| IAB TCF consent framework | Required only for advertising platforms with programmatic ad bidding; this app has no ads | Simple opt-in/out banner with analytics and functional categories |
| Global Privacy Control (GPC) server-side handler | Required only if the app sells/shares personal data (it does not) | Affirmative "we don't sell data" statement in CCPA page |

---

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|----------------|-------|
| `vanilla-cookieconsent` | ^3.1.0 | Next.js 16, React 19, Tailwind CSS v4 | Initialize in `useEffect` inside a `"use client"` wrapper component to avoid SSR/hydration mismatch; import CSS in root layout |
| `@clerk/nextjs` | ^7.0.6 (existing) | `deleteUser()`, `getUser()` available in this version | No upgrade needed — all GDPR deletion and export APIs are present |

---

## Integration Notes

### Cookie Consent + Vercel Analytics

The `vanilla-cookieconsent` `onChange` callback fires when a user updates their consent. Use it to conditionally render or remove the `<Analytics />` component from `@vercel/analytics/next`:

```typescript
// Store analytics consent in a React context
// Conditionally render <Analytics /> only when consent is granted
// This prevents Vercel's analytics beacon from firing before consent
```

The `<Analytics />` component must only be included in the React tree when analytics consent is active. Removing it from the tree stops all tracking immediately on revoke.

### Data Deletion + Redis Cache Flush

When `/api/user/account` runs, after the Postgres transaction completes, flush all Redis keys for the user:

```typescript
// Pattern: redis.keys(`user:${userId}:*`) then redis.del(keys)
// Also clear: explore cache entries if user had public teams
// Upstash Redis supports SCAN for pattern-based key deletion
```

### Data Export Rate Limiting

Use the existing `cacheGet`/`cacheSet` Redis helpers to enforce one export per user per 24 hours:

```typescript
const exportKey = `export:rate:${userId}`
const alreadyExported = await redis.get(exportKey)
if (alreadyExported) return 429
await redis.set(exportKey, '1', { ex: 86400 })
```

---

## Sources

- [vanilla-cookieconsent GitHub releases](https://github.com/orestbida/cookieconsent/releases) — v3.1.0 confirmed February 2025 (HIGH confidence)
- [vanilla-cookieconsent official docs](https://cookieconsent.orestbida.com/) — category configuration, ESM format, callback API (HIGH confidence)
- [Clerk docs — deleteUser()](https://clerk.com/docs/reference/backend/user/delete-user) — confirmed `clerkClient.users.deleteUser(userId)` API, returns deleted user object (HIGH confidence)
- [Clerk docs — currentUser / getUser](https://clerk.com/docs/references/nextjs/current-user) — profile data fields available for export (HIGH confidence)
- [Clerk legal — Data Processing Addendum](https://clerk.com/legal/dpa) — Clerk is GDPR-compliant, customers responsible for their own data subject rights responses (HIGH confidence)
- [CCPA Do Not Sell requirements — Termly](https://termsbox.com/blog/ccpa-do-not-sell-page-requirements) — "Do Not Sell" mechanism required only when data is sold; affirmative non-selling statement sufficient otherwise (MEDIUM confidence — not formal legal advice)
- [react-cookie-consent npm](https://www.npmjs.com/package/react-cookie-consent) — v10.0.1 confirmed, compared against vanilla alternative (MEDIUM confidence)
- [GDPR Article 20 — Right to Data Portability](https://gdpr.eu/article-20-right-to-data-portability/) — machine-readable format requirement (HIGH confidence)

---

*Stack research for: VGC Team Report v5.1 — Legal Compliance & Data Protection*
*Researched: 2026-04-05*
