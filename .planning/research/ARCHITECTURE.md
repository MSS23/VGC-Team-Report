# Architecture Research

**Domain:** GDPR/CCPA legal compliance integration into existing Next.js + Clerk + Neon Postgres app
**Researched:** 2026-04-05
**Confidence:** HIGH (based on direct codebase inspection)

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React 19)                           │
├──────────────┬───────────────────┬──────────────┬───────────────────┤
│  CookieBanner│  Legal Pages       │  Dashboard   │  PageFooter       │
│  (NEW client │  /privacy (MODIFY) │  /privacy    │  (MODIFY: add     │
│  component)  │  /terms (NEW)      │  tab (NEW)   │   ToS + CCPA)     │
├──────────────┴───────────────────┴──────────────┴───────────────────┤
│                       Next.js App Router                            │
│  /api/user/export (NEW)   /api/user/delete (NEW)                    │
│  All existing routes unchanged                                       │
├─────────────────────────────────────────────────────────────────────┤
│               Clerk Middleware (middleware.ts — NO CHANGE)           │
│  Consent is a client-side cookie concern, not middleware concern     │
├──────────────────────────────────────────────────────────────────────┤
│                         Upstash Redis                                │
│  No new keys needed — export/delete are infrequent, not cached      │
│  Post-deletion: cacheDel for user's public report keys              │
├──────────────────────────────────────────────────────────────────────┤
│                         Neon Postgres                                │
│  shares  reactions  comments  saved_reports  follows  notifications │
│  collaborators  edit_changelog  share_versions  collections          │
│  collection_items  creator_profiles  feedback                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | New or Modified | Responsibility |
|-----------|-----------------|----------------|
| `CookieBanner` | NEW client component | Render consent UI, write `cookie_consent` cookie, control analytics mounting |
| `ConsentGate` | NEW client component | Wrap Vercel Analytics/SpeedInsights conditionally on consent cookie |
| `/app/privacy/page.tsx` | MODIFY | Expand from current stub to full GDPR/CCPA policy |
| `/app/terms/page.tsx` | NEW | Terms of Service page |
| `/app/dashboard/privacy/page.tsx` | NEW | Data rights hub (export + delete triggers) |
| `/api/user/export/route.ts` | NEW | Compile all user data into downloadable JSON |
| `/api/user/delete/route.ts` | NEW | Cascade-delete all user data, then revoke Clerk account |
| `PageFooter` | MODIFY | Add ToS and CCPA links to `NAV_LINKS` array |
| `layout.tsx` | MODIFY | Mount `CookieBanner`, wrap analytics in `ConsentGate` |
| `middleware.ts` | NO CHANGE | Clerk handles auth; consent is a client-side concern |

---

## Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── user/
│   │       ├── export/
│   │       │   └── route.ts         # NEW — GDPR data portability
│   │       └── delete/
│   │           └── route.ts         # NEW — right to erasure
│   ├── privacy/
│   │   ├── page.tsx                 # MODIFY — full GDPR/CCPA policy
│   │   └── PrivacyNavbar.tsx        # unchanged
│   ├── terms/
│   │   └── page.tsx                 # NEW — Terms of Service
│   └── dashboard/
│       └── privacy/
│           └── page.tsx             # NEW — data rights hub
├── components/
│   ├── legal/
│   │   ├── CookieBanner.tsx         # NEW — cookie consent banner
│   │   └── ConsentGate.tsx          # NEW — wraps analytics on consent
│   └── layout/
│       └── PageFooter.tsx           # MODIFY — add ToS + CCPA links
└── lib/
    └── consent.ts                   # NEW — read/write consent cookie helpers
```

### Structure Rationale

- **`components/legal/`**: Groups both new legal components together; mirrors existing `components/social/`, `components/ui/` pattern in this codebase.
- **`lib/consent.ts`**: Centralises cookie name constant and consent-reading logic. Both `layout.tsx` (to conditionally mount analytics) and `CookieBanner.tsx` (to write state) need it.
- **`app/dashboard/privacy/`**: Puts data rights actions behind authentication naturally — the dashboard is already Clerk-protected. No middleware changes needed.
- **`app/terms/`**: Sibling to `/privacy/`. Mirrors existing page structure exactly.

---

## Architectural Patterns

### Pattern 1: Cookie Consent as Client-Side State (NOT Middleware)

**What:** Consent preference is stored in a non-HttpOnly cookie (`cookie_consent=all|essential|none`). The `CookieBanner` client component reads this on mount. If absent, it renders the banner. When accepted/declined, it writes the cookie and controls whether analytics components are mounted.

**When to use:** This pattern is correct here because Vercel Analytics and SpeedInsights are injected as React components in `layout.tsx`, not as server-side scripts. Consent must be read on the client to decide whether to render them.

**Why NOT in middleware:** The existing `middleware.ts` is a Clerk middleware. Adding cookie-reading logic there would run on every request — wrong place for UI state that's only relevant on first visit. Middleware also cannot conditionally suppress React component rendering.

**Trade-offs:** Banner flash on first visit is unavoidable without SSR cookie reading. Use `suppressHydrationWarning` on the banner container and conditionally render only after mount (`useEffect`) to prevent hydration mismatch and CLS.

```typescript
// lib/consent.ts
export const CONSENT_COOKIE = "cookie_consent";
export type ConsentLevel = "all" | "essential" | "none";

export function getConsentLevel(): ConsentLevel | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/cookie_consent=([^;]+)/);
  return (match?.[1] as ConsentLevel) ?? null;
}

export function setConsentLevel(level: ConsentLevel) {
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  document.cookie = `${CONSENT_COOKIE}=${level};path=/;max-age=${maxAge};SameSite=Strict`;
}
```

### Pattern 2: Data Export as Authenticated JSON Download

**What:** `GET /api/user/export` uses `auth()` from `@clerk/nextjs/server` (same pattern as all existing `/api/user/*` routes), queries all tables by `owner_id = userId` in parallel via `Promise.all`, serialises to a structured JSON payload, and returns with `Content-Disposition: attachment` headers.

**When to use:** Always required — this is the GDPR Article 20 data portability endpoint. Must be behind Clerk auth. No caching needed (infrequent, personal data must be fresh).

**Trade-offs:** On Vercel Hobby the 10s function timeout is a real constraint. A user with hundreds of reports, thousands of reactions, and large JSONB blobs could approach this limit. Mitigation: query tables in parallel with `Promise.all`, exclude `search_vector` (tsvector computed column, not user data), and cap individual table queries at 1000 rows.

```typescript
// Pattern: parallel table queries scoped to userId
const [shares, reactions, comments, savedReports, follows, notifications,
       collections, collaborators, editChangelog, shareVersions,
       creatorProfile] = await Promise.all([
  sql`SELECT id, data, is_public, created_at, updated_at, view_count
      FROM shares WHERE owner_id = ${userId} AND deleted_at IS NULL LIMIT 1000`,
  sql`SELECT r.* FROM reactions r
      INNER JOIN shares s ON s.id = r.share_id WHERE s.owner_id = ${userId} LIMIT 1000`,
  // ... all tables in parallel
]);
```

### Pattern 3: Deletion Cascade — Ordered Hard Delete

**What:** `DELETE /api/user/delete` hard-deletes in foreign-key-safe order, then calls Clerk's backend API to delete the Clerk user record last. The existing cleanup route (`/api/cleanup`) demonstrates this exact cascade pattern for share purging.

**When to use:** Right-to-erasure (GDPR Article 17) — user-initiated only, behind Clerk auth with a confirmation step (type "DELETE" in a modal). Not a cron job.

**Deletion Order (foreign key dependencies):**

```
Step 1:  collection_items   — FK references collections(id), drop junction first
Step 2:  edit_changelog     — references share_id (soft FK, no DB constraint)
Step 3:  share_versions     — references share_id (soft FK, no DB constraint)
Step 4:  collaborators      — references share_id (user as collaborator on others' reports — remove their access only)
Step 5:  reactions          — references share_id via INNER JOIN to shares.owner_id
Step 6:  comments           — references share_id via INNER JOIN to shares.owner_id
Step 7:  comment_flags      — references comment_id (cascade from comments in step 6)
Step 8:  saved_reports      — user's own bookmarks (user_id = userId)
Step 9:  notifications      — user_id = userId
Step 10: follows            — user_id = userId (who the user follows)
Step 11: collections        — user_id = userId
Step 12: shares             — owner_id = userId (hard delete, not soft — user is gone)
Step 13: creator_profiles   — keyed by creator name (resolve from shares.data->>'creatorName' before step 12)
Step 14: feedback           — ANONYMISE only: set submitter_id = NULL, submitter_name = 'Deleted User' (preserve bug reports for app owner)
Step 15: Clerk user         — DELETE https://api.clerk.com/v1/users/{userId}
Step 16: Redis cache bust   — cacheDel for user's public report cache keys
```

**Note on anonymous reactions/comments:** The `reactions` and `comments` tables use `session_id` (not `user_id`) for unauthenticated actions. These cannot be linked back to a Clerk user and are excluded from deletion — this is acceptable and should be disclosed in the privacy policy.

---

## Data Flow

### Cookie Consent Flow

```
User visits site (first time)
    ↓
layout.tsx renders <CookieBanner /> (client component, useEffect gated)
    ↓
CookieBanner checks document.cookie for "cookie_consent"
    ↓ (not found)
Banner renders — user clicks "Accept All" or "Essential Only"
    ↓
setConsentLevel("all" | "essential") writes cookie
    ↓
If "all":       <ConsentGate> renders <Analytics /> and <SpeedInsights />
If "essential": <ConsentGate> renders nothing (analytics suppressed)
    ↓
Banner dismissed — preference persisted in cookie for 1 year
```

### Data Export Flow

```
User: Dashboard → Privacy tab → "Download My Data"
    ↓
Client: GET /api/user/export (Clerk session cookie authenticates)
    ↓
Route handler: auth() → userId (returns 401 if not signed in)
    ↓
Promise.all([...12 table queries scoped to userId...])
    ↓
Serialise: { exportedAt, userId, shares: [...], reactions: [...], ... }
    ↓
Response: 200 Content-Disposition: attachment; filename="vgc-data-export.json"
    ↓
Browser auto-downloads file
```

### Account Deletion Flow

```
User: Dashboard → Privacy tab → "Delete My Account"
    ↓
Client shows confirmation modal (type "DELETE" to confirm)
    ↓
Client: DELETE /api/user/delete (Clerk session cookie authenticates)
    ↓
Route handler: auth() → userId
    ↓
Steps 1-13: Sequential deletes in FK-safe order
    ↓
Step 14: Anonymise feedback rows
    ↓
Step 15: Clerk API DELETE /v1/users/{userId} (server-to-server)
    ↓
Step 16: cacheDel for user's Redis cache keys
    ↓
Response: 200 { success: true }
    ↓
Client: Clerk signOut() → redirect to "/"
```

---

## Integration Points

### Clerk Integration for Deletion

| Action | Mechanism | Notes |
|--------|-----------|-------|
| Auth in export/delete routes | `auth()` from `@clerk/nextjs/server` | Same as all existing `/api/user/*` routes |
| Delete Clerk user after DB purge | `fetch("https://api.clerk.com/v1/users/${userId}", { method: "DELETE", headers: { Authorization: \`Bearer ${CLERK_SECRET_KEY}\` } })` | Must be LAST step — after DB is fully cleaned |
| Sign user out after deletion | Client calls Clerk's `useClerk().signOut()` on 200 response | Clerk SDK handles session cookie cleanup |

### Vercel Analytics Consent Integration

| Approach | Implementation | Notes |
|----------|----------------|-------|
| Conditional render (recommended) | Wrap `<Analytics />` and `<SpeedInsights />` in `<ConsentGate>` client component | Simplest — components never mount if no consent |
| Vercel Analytics disable API | `beforeSend: (e) => hasConsent() ? e : null` callback | Alternative if script is pre-injected |

Recommended: conditional render. Simpler, no race conditions between consent state and script execution.

### Cookie Relationships — No Conflicts

The existing middleware already sets a `csrf_token` cookie on GET page loads. The new `cookie_consent` cookie is set by a client component. No conflict.

| Cookie | Set by | HttpOnly | Purpose |
|--------|--------|----------|---------|
| `csrf_token` | `middleware.ts` → `setCsrfCookie()` | `false` (JS-readable for CSRF header) | CSRF double-submit protection |
| `cookie_consent` | `CookieBanner.tsx` client component | `false` | Consent preference |
| `__clerk_*` | Clerk SDK | `true` | Auth session |

### Existing Footer Integration Point

`PageFooter.tsx` already has a `NAV_LINKS` array with `/privacy`. The CCPA "Do Not Sell" disclosure can live as a named section (`#do-not-sell`) on the `/privacy` page rather than a separate route — reducing navigation complexity for a small app.

```typescript
// PageFooter.tsx — add to NAV_LINKS:
{ href: "/terms", label: "Terms" }
// CCPA is a section within /privacy — no separate route needed
```

---

## New vs. Modified Components — Explicit List

### NEW Files

| File | Type | Purpose |
|------|------|---------|
| `src/components/legal/CookieBanner.tsx` | Client component | Cookie consent UI — accept all / essential only / decline |
| `src/components/legal/ConsentGate.tsx` | Client component | Conditionally renders analytics based on consent cookie |
| `src/app/terms/page.tsx` | Server component page | Terms of Service |
| `src/app/dashboard/privacy/page.tsx` | Page with client sections | Data rights hub — export trigger + delete flow |
| `src/app/api/user/export/route.ts` | API route | GDPR Article 20 data portability endpoint |
| `src/app/api/user/delete/route.ts` | API route | GDPR Article 17 right to erasure endpoint |
| `src/lib/consent.ts` | Utility module | Consent cookie read/write helpers |

### MODIFIED Files

| File | What Changes |
|------|-------------|
| `src/app/privacy/page.tsx` | Full content rewrite — expand from current stub to complete GDPR/CCPA policy. Add: legal basis, data categories, retention periods, data rights (access, export, erasure, rectification), third-party list, CCPA disclosures ("Do Not Sell" section), contact info |
| `src/components/layout/PageFooter.tsx` | Add `{ href: "/terms", label: "Terms" }` to `NAV_LINKS` |
| `src/app/layout.tsx` | Import `CookieBanner` and mount it; wrap `<Analytics />` and `<SpeedInsights />` inside `<ConsentGate>` |

### UNCHANGED Files

| File | Why Untouched |
|------|--------------|
| `src/middleware.ts` | Cookie consent is client-side state, not middleware concern |
| All existing `/api/user/*` routes | Export/delete are new endpoints, not modifications to existing ones |
| `src/lib/db.ts` | No new tables required for v5.1 (consent_log is optional audit trail, deferred) |
| All report, explore, social components | No compliance changes touch the core product functionality |

---

## Suggested Build Order

Dependencies drive this order: legal pages have no dependencies and can ship immediately; cookie consent depends only on `lib/consent.ts`; data APIs depend on knowing the full schema (already verified); the data rights UI depends on the APIs being deployed.

### Step 1 — Legal Pages (no dependencies, zero risk)

1. Rewrite `/app/privacy/page.tsx` — full GDPR/CCPA policy, reusing existing `PrivacyNavbar` and `PageFooter`. Add CCPA "Do Not Sell" as an inline section.
2. Create `/app/terms/page.tsx` — same layout pattern as `/privacy/page.tsx`.
3. Modify `PageFooter.tsx` — add Terms link to `NAV_LINKS`.

These three changes are safe to push immediately. Zero impact on existing functionality.

### Step 2 — Cookie Consent (depends on: layout.tsx mounting pattern)

4. Create `src/lib/consent.ts` — cookie read/write helpers.
5. Create `CookieBanner.tsx` — UI component using `lib/consent.ts`. Renders only after mount (`useEffect`) to prevent SSR hydration mismatch.
6. Create `ConsentGate.tsx` — wraps analytics conditional on consent.
7. Modify `layout.tsx` — mount `<CookieBanner />`, wrap `<Analytics />` and `<SpeedInsights />` in `<ConsentGate>`.

Cookie consent is independent of the data APIs. Can ship before or after them.

### Step 3 — Data Export API (depends on: full schema confirmed, Vercel timeout awareness)

8. Create `/api/user/export/route.ts` — parallel queries across all 12 relevant tables. Exclude `search_vector`. Test response size stays under 1MB. Auth pattern identical to existing `/api/user/analytics/route.ts`.

### Step 4 — Account Deletion API (depends on: export done, FK order confirmed, `CLERK_SECRET_KEY` in env)

9. Create `/api/user/delete/route.ts` — ordered cascade (steps 1-14 above), Clerk API call last (step 15), Redis cache bust (step 16). Test with a throwaway Clerk account in development.

### Step 5 — Data Rights Hub UI (depends on: export + delete APIs deployed)

10. Create `/app/dashboard/privacy/page.tsx` — buttons to trigger export download and account deletion. Export button hits `GET /api/user/export`, triggers browser download. Delete button opens confirmation modal, then hits `DELETE /api/user/delete`, then calls `signOut()`.

---

## Scaling Considerations

| Scale | Concern | Approach |
|-------|---------|----------|
| Current (small user base) | Export timeout on Vercel Hobby (10s limit) | `Promise.all` for parallel queries; sufficient for current data volumes |
| 10k+ users | Export response size approaching 1MB Vercel limit | Add `LIMIT 1000` per table query with a `truncated: true` flag in response |
| Any scale | GDPR deletion audit trail | Optionally add `consent_log` table to record deletion requests with timestamp — not required for compliance but useful for disputes |

---

## Anti-Patterns

### Anti-Pattern 1: Cookie Consent in Middleware

**What people do:** Read consent cookie in `middleware.ts` and block analytics script injection at the edge.

**Why it's wrong:** Vercel Analytics in this app is a React component (`<Analytics />`), not an injected script. Middleware cannot suppress component mounting. Also adds latency to every request for UI state only needed on first visit.

**Do this instead:** `ConsentGate` client component that conditionally renders analytics based on `document.cookie` read on mount.

### Anti-Pattern 2: Deleting Clerk User Before DB Purge

**What people do:** Call Clerk's delete API first, then cascade DB tables.

**Why it's wrong:** If DB deletion fails mid-cascade, the Clerk user is already gone. The user loses their account but their data remains in the database — a GDPR violation and a support nightmare.

**Do this instead:** DB cascade first (in FK-safe order), Clerk delete last. If Clerk API fails, log the error. The DB data is already gone; an orphaned Clerk account is recoverable manually.

### Anti-Pattern 3: Sequential Queries in Export

**What people do:** `await query1; await query2; await query3;` for each of 12 tables.

**Why it's wrong:** 12 sequential round-trips to Neon Postgres could take 3-6 seconds total, burning most of the 10s Vercel function timeout before response serialisation even starts.

**Do this instead:** `Promise.all([query1, query2, ...query12])` — all queries run in parallel. Neon serverless handles concurrent connections from the same function invocation.

### Anti-Pattern 4: Storing Consent State in React State Only

**What people do:** `useState(false)` for consent — resets on every page navigation.

**Why it's wrong:** Banner appears on every visit. React state does not persist across page loads in a Next.js app.

**Do this instead:** Write consent to a persistent cookie (`SameSite=Strict; max-age=31536000`). On mount, read the cookie — if present, skip banner. Standard pattern used by every CMP.

---

## Sources

- Direct codebase inspection: `src/lib/db.ts` (full 15-table schema), `src/middleware.ts`, `src/app/api/user/analytics/route.ts`, `src/app/api/user/profile/route.ts`, `src/app/api/cleanup/route.ts`, `src/app/privacy/page.tsx`, `src/components/layout/PageFooter.tsx`, `src/app/layout.tsx`
- GDPR Article 17 (right to erasure) and Article 20 (data portability) — requirements from PROJECT.md
- Clerk backend API for user deletion: `DELETE https://api.clerk.com/v1/users/{userId}` — standard Clerk REST API
- Vercel Hobby tier limits: 10s function timeout, 1MB response — Vercel documentation
- Existing deletion cascade pattern reference: `src/app/api/cleanup/route.ts` (identical approach used for trash purge)

---

*Architecture research for: GDPR/CCPA compliance integration — VGC Team Report v5.1*
*Researched: 2026-04-05*
