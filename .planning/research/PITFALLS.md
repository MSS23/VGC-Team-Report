# Pitfalls Research

**Domain:** GDPR/CCPA compliance added to an existing Next.js app (Clerk + Neon Postgres + Upstash Redis + Vercel)
**Researched:** 2026-04-05
**Confidence:** HIGH — Clerk/Neon/Redis behaviour verified via official docs; regulatory patterns verified via enforcement records (CNIL, ICO 2025)

---

## Critical Pitfalls

### Pitfall 1: Incomplete Deletion — Orphaned Data Across 13 Tables

**What goes wrong:**
The deletion endpoint deletes `shares` rows for the user but misses data the user owns indirectly. After deletion, the following tables still contain personal data tied to that user:

| Table | Column(s) that reference the deleted user |
|-------|-------------------------------------------|
| `saved_reports` | `user_id` |
| `follows` | `user_id` |
| `collections` | `user_id` |
| `collection_items` | cascades from `collections` — but only if the FK DELETE CASCADE fires correctly |
| `collaborators` | `user_id`, `user_name`, `added_by` |
| `edit_changelog` | `editor_id`, `editor_name` |
| `share_versions` | `editor_id`, `editor_name` |
| `notifications` | `user_id`, `source_user_name` |
| `comments` | `session_id` (if that session maps back to a user) |
| `reactions` | `session_id` (same caveat) |
| `feedback` | `submitter_id`, `submitter_name`, `contact` |

The `shares` table uses soft-delete (`deleted_at`) for its own rows, but soft-delete is NOT erasure. The data is still stored, still readable by DB queries, still in backups. GDPR Article 17 requires data to be gone, not flagged.

**Why it happens:**
Deletion logic is written against the primary "owner" path — deleting the user's own `shares` rows. The relational data created as a side-effect of using the app (follows, collaborations, notifications, feedback submissions) is not mapped before implementation.

**How to avoid:**
Build a deletion checklist from the schema before writing a single line of deletion code. The correct order for this schema:

```
1. DELETE FROM notifications WHERE user_id = $userId
2. DELETE FROM follows WHERE user_id = $userId
3. DELETE FROM saved_reports WHERE user_id = $userId
4. DELETE FROM collaborators WHERE user_id = $userId
5. UPDATE edit_changelog SET editor_id = NULL, editor_name = '[deleted]' WHERE editor_id = $userId
6. UPDATE share_versions SET editor_id = NULL, editor_name = '[deleted]' WHERE editor_id = $userId
7. UPDATE feedback SET submitter_id = NULL, submitter_name = '[deleted]', contact = NULL WHERE submitter_id = $userId
8. DELETE FROM collections WHERE user_id = $userId  -- collection_items cascade
9. Hard-DELETE or anonymize shares WHERE owner_id = $userId (do not rely on soft-delete)
10. Call Clerk Backend API: DELETE /v1/users/{userId}
```

For `edit_changelog` and `share_versions`, anonymization (nulling the editor fields) is preferable to hard deletion because removing those rows would corrupt the version history of reports co-edited by others — a legitimate competing interest.

**Warning signs:**
- Deletion endpoint only touches the `shares` table
- "Account deleted" confirmation fires before all steps above complete
- No transaction discipline across the multi-table delete (partial failure leaves orphaned rows)

**Phase to address:**
Phase: Account and Data Deletion — must be the first working endpoint built, before any cookie consent or policy UI work.

---

### Pitfall 2: Clerk Holds Personal Data That Lives Entirely Outside Your Database

**What goes wrong:**
Clerk stores on its own infrastructure — independent of your Neon Postgres — the following personal data:
- Email address
- Display name
- Profile image URL
- OAuth provider identity (Google, Discord, Twitch account links)
- Session history and device metadata

Deleting the user from Neon does NOT delete them from Clerk. The user still exists in Clerk's dashboard and their PII is still being processed by Clerk on your behalf. GDPR Article 17 erasure obligation extends to all data processors — Clerk is your data processor.

The inverse problem also exists: if Clerk is deleted first and the Neon deletion fails, the user's data remains in Neon with no Clerk user attached — orphaned PII with no owner.

Clerk's `user.deleted` webhook (Svix-backed) uses exponential backoff retry but is not guaranteed delivery. Reports in community forums confirm missed events on cold Vercel starts and during payload validation failures. If the webhook is the sole trigger for DB cleanup, a delivery failure produces permanent orphaned data with no detection mechanism.

**Why it happens:**
Developers treat Clerk as "just auth" and forget it is a data processor holding personal data. The DPA Clerk offers (clerk.com/legal/dpa) confirms they process personal data on your behalf — meaning your GDPR Article 17 obligation extends to Clerk's copy.

**How to avoid:**
- Initiate deletion from your side first (Neon + Redis), then call Clerk Backend API as the final step.
- Do not rely on `user.deleted` webhook as the trigger for DB deletion. Use it only as a reconciliation signal.
- Implement a `deletion_requests` table with step-level status tracking. Mark each step completed atomically. A background cron can catch failed steps.
- Sign Clerk's DPA (clerk.com/legal/dpa) before any EU user data is processed. Keep a record of the signing date.

**Warning signs:**
- Deletion flow uses `user.deleted` webhook as the entry point rather than a user-initiated API route
- No logging of Clerk Backend API call success/failure during deletion
- No reconciliation mechanism between Clerk user list and local `owner_id` values in Neon

**Phase to address:**
Phase: Account and Data Deletion — Clerk deletion must be in scope alongside Neon deletion, not deferred.

---

### Pitfall 3: Redis Cache Surfaces Deleted User Data After Erasure

**What goes wrong:**
After a user is deleted and their Neon rows are gone, Upstash Redis may still hold:
- Explore page results (`explore:*` keys) that include that user's public reports
- Creator profile caches (`creator:*` keys)
- User-specific cached API responses

Because Upstash uses TTL-based expiration, deleted user data remains visible in explore queries and creator profile pages for the full TTL duration — potentially hours. A user who believes they have been erased is still visible to other users through cached responses.

GDPR Article 17 requires erasure "without undue delay." A multi-hour cache window is almost certainly "undue delay" under current 2025 enforcement posture.

**Why it happens:**
TTL-based expiration is designed for performance, not compliance. Developers assume TTL expiry counts as deletion. It does not — the data is still stored and served during the TTL window.

**How to avoid:**
In the deletion endpoint, after Neon rows are deleted, immediately flush the relevant Redis key patterns before returning a success response:

```typescript
// After DB deletes, before returning 200:
const creatorName = /* resolved before starting deletion */;

// Flush explore cache (broad invalidation — acceptable on user deletion which is rare)
const exploreKeys = await redis.keys('explore:*');
if (exploreKeys.length > 0) await redis.del(...exploreKeys);

// Flush creator-specific keys
if (creatorName) {
  const creatorKeys = await redis.keys(`creator:${creatorName}*`);
  if (creatorKeys.length > 0) await redis.del(...creatorKeys);
}
```

For production Redis with large keyspaces, use `SCAN` cursor iteration rather than `keys()` to avoid blocking.

**Warning signs:**
- Deletion endpoint returns 200 without any Redis operations
- Explore page still shows a deleted user's reports immediately after deletion
- No `SCAN`/`DEL` calls anywhere in the deletion code path

**Phase to address:**
Phase: Account and Data Deletion — cache invalidation is part of deletion, not a post-MVP cleanup concern.

---

### Pitfall 4: Cookie Consent Dark Patterns That Regulators Actively Fine

**What goes wrong:**
In 2025, regulators have issued hundreds of millions in fines specifically for consent banner dark patterns. All of the following are easy to accidentally implement in a Next.js app:

1. **Asymmetric buttons** — "Accept All" is a solid primary button; "Reject" is greyed-out or styled as secondary. CNIL fined Google €200M explicitly for this pattern.
2. **Multi-click reject** — Accepting takes one click; rejecting requires opening "Manage Preferences" and unchecking each category. ICO issued 134 warnings in its first-200-site review sweep in January 2025.
3. **Pre-checked analytics toggles** — Any non-essential category toggle defaulted to ON is invalid consent under GDPR Article 7. Consent must be an active affirmative action.
4. **Consent wall** — Banner blocks access to content until the user accepts. Conditioning site access on cookie acceptance is a dark pattern under EDPB guidance.
5. **Cookies fired before consent** — Analytics scripts in `layout.tsx` fire immediately on every page render, including the initial render before the banner is shown or any consent is recorded. This is the most common Next.js-specific violation and makes the banner legally meaningless.

**Why it happens:**
Developers build the banner UI in isolation. The `<Analytics />` component from Vercel is placed in `layout.tsx` because that is the obvious location. It fires on every render. The banner is visible but the consent is technically worthless because the analytics script already executed before the user saw the banner.

**How to avoid:**
- Never place `<Analytics />` unconditionally in `layout.tsx`. Gate it behind a consent state check.
- Read consent from `localStorage` synchronously on mount to avoid a flash of incorrect state.
- Make "Accept All" and "Reject All" visually identical in weight — same size, same border, same contrast ratio.
- One-click rejection: if the banner offers "Accept All," it must also offer "Reject All" at the same level, not nested in a preferences modal.
- Never pre-check any non-essential category toggle.

```tsx
// Correct pattern
function ConsentAwareAnalytics() {
  const consent = useConsentStore(); // reads localStorage synchronously
  if (!consent.analytics) return null;
  return <Analytics />;
}
// Use <ConsentAwareAnalytics /> in layout instead of bare <Analytics />
```

**Warning signs:**
- `<Analytics />` appears in `layout.tsx` without a consent check wrapping it
- "Reject" option requires more than one click from the initial banner state
- Any toggle in a preferences pane defaults to checked/on

**Phase to address:**
Phase: Cookie Consent Banner — dark pattern avoidance must be an explicit acceptance criterion, not an afterthought.

---

### Pitfall 5: Privacy Policy Missing Legally Required Sections

**What goes wrong:**
The existing `/privacy` page is informative but does not satisfy the legal disclosure requirements of GDPR Article 13 or CCPA. Missing sections that regulators specifically check:

**GDPR Article 13 — required, currently absent from the existing page:**
- Legal basis for each category of processing (must name the Article 6 basis: contract performance, legitimate interest, or consent — per processing activity)
- Data retention periods with specific timeframes per category (the existing policy states "according to Vercel's data retention policy" — this does not satisfy Article 13(2)(a))
- Identity and contact details of the data controller (a name and email address)
- Right to lodge a complaint with a supervisory authority
- Right to withdraw consent if consent is the legal basis for any processing
- Third-party data processors listed by name with their role (Clerk, Neon/Vercel, Upstash, Vercel Analytics are all processors)
- International transfer basis for US-based processors (Clerk is US-based; must name the transfer mechanism)

**CCPA — required, currently absent:**
- Enumerated categories of personal information collected
- Purposes for collection per category
- Categories of third parties the data is shared with
- "Do Not Sell or Share My Personal Information" disclosure (even if you do not sell data, you must disclose that you do not)
- How California consumers can submit a rights request (email address or web form)
- Response timeframe (45 days under CCPA)

**Why it happens:**
The existing policy is written as a developer explanation of what the app does, not against a regulatory checklist. Vague language like "analytics data is retained according to Vercel's data retention policy" feels complete but shifts responsibility without satisfying Article 13.

**How to avoid:**
Write the policy section by section against GDPR Article 13 and CCPA checklists. For each processing activity, explicitly state: what data, why (purpose), legal basis, how long, who has access.

Specific values to commit to for this app:
- Team reports/shares: retained until deleted by user or account deletion request
- Vercel Analytics: 90-day rolling window (Vercel's documented Analytics retention)
- Clerk auth data: retained until account deleted; then per Clerk DPA retention schedule
- Upstash Redis cache: ephemeral, not persistent storage — state this explicitly
- Feedback submissions: retained up to 12 months for product improvement purposes
- Data controller contact: a real reachable email (privacy@pokemonvgcteamreport.com or personal email)

**Warning signs:**
- Policy uses phrases like "according to [vendor]'s policy" rather than stating actual periods
- No mention of GDPR Article 6 legal bases
- No right to lodge a DPA complaint
- No third-party processor list
- No CCPA rights exercise mechanism or response timeframe

**Phase to address:**
Phase: Privacy Policy and Terms of Service — write against regulatory checklists, not as informal prose.

---

### Pitfall 6: Data Export That Misses Related Tables and Returns an Unusable Format

**What goes wrong:**
An export endpoint that only returns `shares` rows does not satisfy GDPR Article 20 (right to data portability). A complete export for this schema must include all of:
- All shares owned by the user (including full `data` JSONB)
- All collections and their collection_items
- Saved/bookmarked reports (list of share IDs)
- Follows (list of creator names followed)
- Notifications history
- Collaborations (reports the user co-edits)
- Edit changelog entries authored by the user
- Share version snapshots authored by the user
- Feedback submissions

GDPR Article 20 requires the export in a "structured, commonly used and machine-readable format." A raw JSON dump technically qualifies but a ZIP archive containing named JSON files per category (`reports.json`, `collections.json`, `follows.json`, etc.) is significantly better and reduces the risk of a regulator arguing the format was not "intelligible."

**Why it happens:**
Export is built as "give them their reports." The `data` JSONB column is large and visually dominant; relational metadata tables are overlooked. The same incomplete data map that causes the deletion pitfall also causes the export gap.

**How to avoid:**
Build export against the same 13-table checklist used for deletion — every table that deletion touches, export must also touch. Return a ZIP with named JSON files. Include a `README.txt` explaining each file's structure. Set an async path (return a download link when ready) for users with more than 50 reports, to stay within Vercel's 10s function timeout.

**Warning signs:**
- Export endpoint queries only the `shares` table
- Export returns a single JSON object rather than named sections per data category
- No handling for the case where a user has enough reports to exceed the function timeout

**Phase to address:**
Phase: Account and Data Deletion — export and deletion endpoints should be built in parallel against the same data map.

---

### Pitfall 7: Legal Basis Conflict for Existing Users' Historical Data

**What goes wrong:**
GDPR has retroactive effect: its scope covers ongoing processing regardless of when data was collected. The existing app collected user registrations, comments, reactions, follows, and feedback submissions before any consent mechanism or published privacy policy existed. Adding a cookie consent banner now and claiming "consent" as the legal basis going forward does not retroactively legitimise historical data. More critically, if you claim "consent" as the basis for analytics but consent was not collected at the time of collection, you are now in breach for the historical data — not cured by adding a banner today.

**Why it happens:**
Developers apply the new legal basis going forward and assume the past is forgiven. The regulatory reality is that historical data must also have a documented legal basis, or it must be deleted.

**How to avoid:**
For each existing data category, determine which Article 6 basis applies retroactively and document it:

| Data category | Retroactive basis | Rationale |
|---------------|-------------------|-----------|
| Shares, collections, profiles | Contract performance (6(1)(b)) | Processing is necessary to deliver the service the user signed up for |
| Follows, saved reports, notifications | Legitimate interest (6(1)(f)) | Core platform social features; user would reasonably expect this |
| Vercel Analytics (anonymous, no PII) | Legitimate interest (6(1)(f)) | Truly anonymous aggregate data; passes the balancing test |
| Feedback submissions | Legitimate interest (6(1)(f)) | Product improvement; contact field is optional |
| Clerk auth data | Contract performance (6(1)(b)) | Authentication is necessary for the account-based service |

Do NOT claim consent as the legal basis for data you already hold if you did not collect consent at the time of collection. Write a brief internal Legitimate Interest Assessment (LIA) — a one-page document recording that you performed the three-part test — before publishing the policy. You do not publish the LIA; it is your compliance record.

**Warning signs:**
- Privacy policy claims "consent" as the basis for analytics but there was no consent banner before the compliance milestone
- No written LIA for any processing relying on legitimate interest
- Policy claims contract performance for community features that do not require an account (comments, reactions are session-based, not account-gated)

**Phase to address:**
Phase: Privacy Policy and Terms of Service — legal basis decisions must be made before the policy is drafted.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Soft-delete (`deleted_at`) as "erasure" | Preserves data for recovery | Not GDPR Article 17 compliant; data remains in DB, backups, and caches | Never for compliance — anonymize or hard-delete |
| Relying on `user.deleted` webhook for DB cleanup | Avoids building an explicit deletion endpoint | Webhook failures leave orphaned PII; no audit trail | Never as the primary deletion path |
| Single JSON blob for data export | Simple to implement | Incomplete (misses 10+ tables); may not satisfy Article 20 "intelligible format" | Only as a declared placeholder with a clear follow-up ticket |
| Blanket "legitimate interest" for all processing | Avoids consent UI complexity | Legitimate interest cannot justify non-essential analytics cookies; regulators scrutinise this heavily in 2025 | Only for truly necessary processing with a documented LIA |
| Loading `<Analytics />` in root layout unconditionally | Simpler layout.tsx structure | Regulators treat this as consent never obtained; the banner becomes legally meaningless | Never if you have EU users |
| Skipping Clerk DPA | Saves one legal admin step | You are processing EU personal data without a contractual basis with your processor | Never if you have EU users |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Clerk | Using `user.deleted` webhook as the authoritative deletion trigger | Use an explicit user-initiated API route; use the webhook only for reconciliation |
| Clerk | Not checking the Clerk Backend API DELETE response code | On non-200, mark deletion as incomplete in a `deletion_requests` table; retry via cron |
| Clerk | Assuming all user PII is in your Neon DB | Clerk holds: email, name, profile image, OAuth tokens, session history, device metadata — none are in Neon |
| Clerk | Not signing the DPA before EU users are processed | Fetch the DPA from clerk.com/legal/dpa, sign it, record the date |
| Upstash Redis | Calling `redis.keys('explore:*')` in production with a large keyspace | Use SCAN cursor iteration to avoid blocking the event loop |
| Upstash Redis | Returning deletion success before Redis flush completes | Flush cache synchronously within the deletion handler; do not fire and forget |
| Vercel Analytics | `<Analytics />` in root `layout.tsx` | Gate behind a consent check; render conditionally after consent state resolves |
| Neon Postgres | Wrapping all deletion steps in a single DB transaction | The Clerk API call cannot be in a DB transaction; use a step/saga pattern with status tracking |
| Neon Postgres | Deleting `collection_items` explicitly before `collections` | `collection_items` has `ON DELETE CASCADE` from `collections`; the cascade fires automatically |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous `redis.keys('explore:*')` on large keyspace during deletion | Deletion endpoint times out (Vercel 10s limit) | Use SCAN cursor; or fire Redis flush as a background job after returning 200 | At ~10,000+ Redis keys |
| Data export generating all rows in memory simultaneously | Export endpoint timeout or 1MB Vercel response limit hit | Stream ZIP generation; paginate DB queries; offer async download link | At ~100+ reports per user |
| Polling for consent state on every page render | Layout shift; analytics flicker on/off | Read consent from localStorage synchronously on mount; hydrate once | From day one |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Deletion endpoint accessible without re-authentication confirmation | Attacker with a stolen session deletes the account | Require Clerk re-auth or a fresh session token before initiating deletion |
| Export endpoint scoped by request body user ID rather than auth context | Attacker exports another user's data | Always scope export queries to `WHERE owner_id = $userId` derived from Clerk `auth()`, never from the request payload |
| Storing consent choice in URL params or unencrypted cookies | Consent can be spoofed or replayed | Store consent in localStorage; sync to DB if needed; never trust client-submitted consent for gating server-side behaviour |
| Logging PII fields (name, email) in deletion success/failure logs | PII persists in Vercel log drain after erasure | Log only the user ID, not name or email, in all deletion-related log lines |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Consent banner blocks page content until interacted with | Users bounce; frustration with the app before they start | Banner can overlay content but content must remain accessible; never use a full-screen modal that blocks all interaction |
| Cookie settings only accessible from footer | Users cannot change consent after initial choice without hunting for it | Add "Cookie Settings" link in both footer AND account settings page |
| Account deletion is instant with no confirmation | Accidental deletion of all team reports and data | Require typed confirmation ("DELETE") and show a summary of what will be permanently removed; consider a 30-day grace period |
| Data export returns synchronously for large accounts | Request times out; user gets an empty response | Show "Your export is being prepared" state; provide a download link when ready or use polling |
| Privacy policy is a dense legal wall | Users do not read it; regulators check for "plain language" compliance | Use section headers, short paragraphs, a summary box at the top ("Here's the short version") alongside the full text |

---

## "Looks Done But Isn't" Checklist

- [ ] **Deletion endpoint:** Verify ALL 13 tables are addressed — after a test deletion, run `SELECT COUNT(*) FROM notifications WHERE user_id = $testId` (and equivalent for each table); all must return 0
- [ ] **Deletion endpoint:** Verify Redis cache is flushed — check Upstash console immediately after deletion; no `explore:*` or `creator:*` keys for that user should remain
- [ ] **Deletion endpoint:** Verify Clerk user is gone — call `GET /v1/users/{userId}` from Clerk Backend API after deletion; must return 404
- [ ] **Cookie consent:** Verify no analytics fire before banner interaction — open fresh incognito window, check DevTools Network tab; zero requests to analytics endpoints should appear before the consent banner is interacted with
- [ ] **Cookie consent:** Verify "Reject All" is achievable in exactly one click from the initial banner state, without opening any preferences pane
- [ ] **Privacy policy:** Verify every processing activity lists a named GDPR Article 6 legal basis
- [ ] **Privacy policy:** Verify specific retention periods are stated — no "according to vendor policy" language anywhere
- [ ] **Privacy policy:** Verify Clerk, Neon/Vercel, Upstash, and Vercel Analytics are named as data processors
- [ ] **Data export:** Verify export covers all 13 user-linked tables, not just `shares` — diff the export output against the deletion checklist
- [ ] **CCPA:** Verify "Do Not Sell or Share My Personal Information" language appears in the footer and within the privacy policy
- [ ] **CCPA:** Verify a rights request submission mechanism (email address or web form) is described in the policy with a response timeframe

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Discovered orphaned rows after a "completed" deletion | MEDIUM | Build an audit query per table against known deleted `owner_id` values; batch-delete orphaned rows; document in a post-incident ticket |
| Consent banner found to be firing analytics before consent interaction | HIGH (regulatory exposure) | Gate `<Analytics />` immediately; if EU users were affected and the window was weeks+, consider notifying the relevant DPA |
| Privacy policy challenged by regulator as incomplete | HIGH | Engage legal counsel; update policy with required sections; notify users of material changes via email or in-app notice |
| Clerk DPA not signed before EU user data was processed | MEDIUM | Sign DPA retroactively (Clerk allows this); document the signing date; no user notification required unless a breach occurred |
| Data export found incomplete after a user received it | LOW (if caught pre-complaint) | Update export endpoint immediately; proactively send the corrected export to the affected user |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Incomplete deletion across 13 tables | Phase: Account and Data Deletion | Query every table for ghost rows after a test deletion |
| Clerk holds independent user PII | Phase: Account and Data Deletion | Confirm Clerk Backend API call in code; confirm 404 on `GET /v1/users/{id}` after deletion |
| Redis cache serves deleted user data | Phase: Account and Data Deletion | Upstash console check immediately post-deletion; cache keys must be gone |
| Cookie consent dark patterns | Phase: Cookie Consent Banner | Manual QA: incognito window, DevTools Network tab, count clicks to reject |
| Privacy policy missing required sections | Phase: Privacy Policy and Terms of Service | Line-by-line review against GDPR Article 13 + CCPA checklists |
| Data export misses related tables | Phase: Account and Data Deletion | Diff export output against the 13-table deletion checklist |
| Legal basis conflict for historical data | Phase: Privacy Policy and Terms of Service | Write LIA documents before drafting the policy; legal basis listed per processing activity |

---

## Sources

- [Clerk Data Processing Addendum](https://clerk.com/legal/dpa) — Clerk's DPA and EU transfer basis
- [Clerk Webhooks Overview — Svix retry behaviour](https://clerk.com/docs/guides/development/webhooks/overview) — Confirms exponential backoff retry; not a guaranteed-delivery system
- [GDPR Article 13 — Information to be provided](https://gdpr-info.eu/art-13-gdpr/) — Authoritative text on required privacy notice elements
- [GDPR Article 17 — Right to erasure](https://gdpr-info.eu/art-17-gdpr/) — Authoritative text on deletion obligations
- [GDPR Article 20 — Right to data portability](https://gdpr-info.eu/art-20-gdpr/) — Authoritative text on export format requirements
- [Vercel Analytics Privacy and Compliance](https://vercel.com/docs/analytics/privacy-policy) — Confirms no cookies used; consent for analytics still required under ePrivacy Directive
- [CNIL Cookie Enforcement 2025](https://secureprivacy.ai/blog/gdpr-cookie-consent-requirements-2025) — Enforcement records including Google €200M and SHEIN €150M for dark patterns
- [ICO 1000 Website Review 2025](https://www.auditzo.com/blog/gdpr-cookie-consent-rules-2025) — 134 warnings from 200 sites reviewed in January 2025 sweep
- [Upstash Redis Compliance](https://upstash.com/docs/redis/help/compliance) — GDPR posture; cache invalidation is application-layer responsibility
- [CCPA Do Not Sell or Share — OneTrust guidance](https://www.onetrust.com/blog/navigating-the-cpras-do-not-sell-or-share-requirement/) — CPRA opt-out requirement details
- [GDPR Legitimate Interest — IAPP guide](https://iapp.org/news/a/how-right-erasure-applied-under-gdpr-complete-guide-organizational-compliance/) — Three-part LIA test
- [CCPA Privacy Policy Requirements 2025](https://secureprivacy.ai/blog/ccpa-privacy-policy-requirements-2025) — Enumerated required sections including retention and ADMT disclosures

---

*Pitfalls research for: GDPR/CCPA compliance — Clerk + Neon Postgres + Upstash Redis + Vercel Analytics on VGC Team Report*
*Researched: 2026-04-05*
