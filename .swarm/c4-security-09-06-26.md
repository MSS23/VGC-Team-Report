# Security Audit — Agent C4 — 2026-06-09

Scope: `/home/user/VGC-Team-Report` (Next.js 16, React 19, TypeScript). Read-only.

---

## 1. `npm audit` Summary

```
info: 0  low: 0  moderate: 10  high: 3  critical: 0  total: 13
```

### Direct dependencies with advisories

| Package | Severity | Direct? | Issue | Fix Available |
|---|---|---|---|---|
| `next` | moderate | yes | Pulls vulnerable `postcss` < 8.5.10 (XSS via unescaped `</style>` — GHSA-qx2v-qp2m-jg93) | No (no upstream fix yet) |
| `@clerk/nextjs` | moderate | yes | Transitive via `next` (postcss) | No |
| `@sentry/nextjs` | moderate | yes | Transitive via `next` (postcss). Fix available is a major downgrade — DO NOT take | Major downgrade only |
| `cypress` | moderate | yes (devDep) | `@cypress/request` → `qs` + `uuid` DoS / write-OOB | Yes |

### Notable transitive highs (devDeps)

- `js-cookie` ≤3.0.5 — prototype hijack, cookie-attribute injection (via `@clerk/shared`). Fix available, but only by upgrading `@clerk/nextjs` (currently blocked by next).
- `tmp` <0.2.6 — path traversal in prefix/postfix (via dev tooling). Fix available.
- `uuid` <11.1.1 — buffer bounds bug (via `@cypress/request`, `@sentry/webpack-plugin`).

**No critical CVEs. No production-runtime high CVEs that are exploitable in the deployed app** — the `next` advisory is buildtime-only (PostCSS stringify), the rest live under `cypress`/`tmp`/`uuid` in the dev tree.

**Recommendation:** run `npm audit fix` to clear the cypress + uuid + js-cookie chains where fixes are available. Hold `next` until upstream patches PostCSS.

---

## 2. Hardcoded Secrets in `src/**`

Scanned for `sk_`, `lin_api_`, `whsec_`, `Bearer …`, and ≥32-hex strings.

**Result: NONE that are actual secrets.**

One match needs to be called out so future scanners don't trip on it:

- `src/app/api/discord/route.ts:6` — `const DISCORD_PUBLIC_KEY = "44b2cb02932ad5b5eae681352246314ffb23ecd299c2490d7875d5883e5596ae";`
  - This is the Discord application's **Ed25519 verification public key**, used by `nacl.sign.detached.verify(...)`. It is **public by design** (Discord publishes it on the app's dashboard). Not a secret. Leave as-is but consider moving to `process.env.DISCORD_PUBLIC_KEY` for clarity / multi-env support.

No `Bearer XXXX`, `sk_…`, `lin_api_…`, or `whsec_…` hardcoded strings found anywhere under `src/`. All real secrets are referenced via `process.env.*`. **No hard fail.**

---

## 3. OWASP Top-10 Findings

### 3.1 SQL Injection — CLEAR

All database access uses the Neon HTTP `sql` tagged-template client (parameterised). The two patterns that could theoretically be unsafe are well-contained:

- `src/app/api/explore/route.ts` builds compound queries by composing `sql`…`sql` fragments — variables are interpolated via the template literal, not string concat. Confirmed safe across `searchCondition`, `tagFilters`, cursor and `following` filters.
- `src/app/api/cron/daily-ops/route.ts` / `cron/posthog-errors/route.ts` build Linear GraphQL with the now-parameterised `variables` map (confirmed from prior-run hardening). No string-concat into queries.

No SQLi gaps found in new routes.

### 3.2 SSRF — CLEAR (with one mild concern)

- `src/app/api/sprite/route.ts` — strict allow-list: only `play.pokemonshowdown.com` + `/sprites/` paths, 3 s timeout. Good.
- `src/app/api/pokepaste/route.ts` — restricts URLs to `hostname === "pokepast.es"`. Good. Note: an attacker can choose any path on pokepast.es, and the response title is HTML-decoded and returned — this is fine because it isn't injected into HTML server-side.
- `src/app/api/oembed/route.ts` — extracts `shareId` via regex; does not fetch arbitrary URLs.
- All cron routes only fetch known constants (`SITE_URL`, `LINEAR_API`, `registry.npmjs.org`, `posthog`).

**Mild concern (LOW):** `pokepaste` POST forwards user-supplied paste/title/author/notes verbatim to `pokepast.es` form-encoded. That's the route's contract, not an SSRF — but worth noting that a hostile caller can repeatedly create pastes; rate limit is `20/min` which is adequate.

### 3.3 Open Redirects — CLEAR

`grep` for `NextResponse.redirect|Response.redirect|redirect(` across `src/app/api/**` returned **zero matches**. No API route performs a redirect; only the `pokepaste` POST returns a `Location` from the upstream as JSON (not as a redirect).

### 3.4 Path Traversal — CLEAR

Only one `fs` call in API routes: `src/app/api/cron/weekly-report/route.ts:105` does `readFileSync(join(process.cwd(), "package.json"), …)` with a constant filename. No user input touches the filesystem.

### 3.5 Missing Auth Checks — TWO REAL FINDINGS

**HIGH — Collection detail leaks private/unlisted shares of other users.**
`src/app/api/user/collections/[id]/route.ts` (GET) joins `shares` to `collection_items` and returns `s.data` for every share in the collection, with no `is_public`/owner/visibility filter:

```
SELECT s.id, s.data, … FROM collection_items ci
INNER JOIN shares s ON s.id = ci.share_id
WHERE ci.collection_id = ${id} AND s.deleted_at IS NULL
```

Combined with `src/app/api/user/collections/route.ts` "add-item" which **does not verify** the caller can access the target `shareId`, an attacker can:
1. Guess/brute-force any 8-char share id (62^8 → low for targeted enumeration but trivial for a stolen-id leak).
2. Add it to their own collection.
3. Fetch full `data` blob (paste, EVs, IVs, items, notes, calcs, …) via the collection detail route.

This **bypasses tiered publishing redaction** (`applyPrivateFieldRedaction`) entirely — that logic only runs in `/api/share/[id]`. **Severity: high — confidentiality bypass for unlisted/private reports.**

**Fix:** in "add-item", verify `is_public = TRUE OR owner_id = ${userId} OR EXISTS(collaborator with status='accepted')` mirroring the `saved` route's check (`src/app/api/user/saved/route.ts:77-87` already does this correctly). Also apply `applyPrivateFieldRedaction` in the collection detail GET for non-owner shares.

**MEDIUM — Pending collaborators can revert versions.**
`src/app/api/share/[id]/versions/route.ts:120` (POST revert) checks collaborator existence without `status = 'accepted'`:

```
SELECT 1 FROM collaborators WHERE share_id = ${id} AND user_id = ${userId}
```

Compare with `src/app/api/share/[id]/route.ts:184` and `/api/user/collaborations/route.ts:91` which explicitly require `COALESCE(status,'accepted')='accepted'`. The accept/decline flow exists precisely so an invitee opts in before they can edit — the version-revert handler skips that gate. Same gap also exists in `src/app/api/share/[id]/versions/[version]/route.ts:50` (read access).

**Fix:** add `AND COALESCE(status, 'accepted') = 'accepted'` to both collaborator lookups in `versions/route.ts` and `versions/[version]/route.ts`.

### 3.6 Missing Rate Limiting — ONE GAP

Most POST routes correctly call `apiGuard({ rateLimit: …})`. Gaps:

- **`src/app/api/user/export/route.ts` GET** uses a custom cache-based 24 h limiter (good), but no IP-level `apiGuard`. An anonymous flood is blocked by `auth()`, so OK in practice. Still a stylistic gap — consider standardising via `apiGuard` for instrumentation parity.
- **`src/app/api/webhooks/clerk/route.ts`** and **`webhooks/linear/route.ts`** have no `apiGuard` rate limit, but rely on cryptographic signatures (Svix / HMAC). Acceptable — signature is the rate limit.
- **`src/app/api/share/[id]/collaborators/route.ts` GET** (line 28-) — no `apiGuard` call. Authenticated owner/collab read, so abuse is limited, but should still wrap in `apiGuard` for consistency.

No POST/PUT/PATCH route was missing rate limiting outright.

### 3.7 XSS Risk

**`dangerouslySetInnerHTML` uses:**

- `src/components/seo/JsonLd.tsx:9` — already escapes `</script>` (prior-run fix). Otherwise JSON-stringified. Safe.
- `src/app/layout.tsx:101` — inline `<script>` for theme bootstrap, no user content. Safe.
- `src/app/changelog/data.ts:120` — static changelog text array, no user content. Safe.

**Email templates** all funnel user content through `escapeHtml`:
- `src/app/api/cron/weekly-digest/route.ts:19,123,128` (firstName, top titles) — escaped.
- `src/lib/email.ts` welcome / comment-notification / summary — every interpolation is `${escapeHtml(...)}`. CRLF stripping on subject + from address.

**`src/app/api/oembed/route.ts:38` HTML iframe interpolation** — `encodeURIComponent(shareId)` wraps the value (prior-run fix). `shareId` is also regex-validated. Safe.

**No XSS gaps found.** Comment & feedback bodies are escaped at write time (`comments/[shareId]/route.ts:93-94`, `feedback/route.ts:98-99`).

### 3.8 Vote / Reaction / Flag Abuse (BUSINESS-LOGIC, MEDIUM)

Not strictly OWASP-10, but worth flagging since the data hits the same DB:

- `src/app/api/reactions/[shareId]/route.ts:65` and `src/app/api/comments/flag/route.ts:14` take a **client-supplied `sessionId`** as the dedup/identity key. A scripted client can rotate `sessionId` and:
  - inflate reaction counts arbitrarily (vote-stuffing affects `/explore` "popular" sort);
  - auto-flag any comment to deletion in 3 calls (`FLAG_THRESHOLD = 3`).
- Rate limits are IP-keyed (30/min for reactions, 10/min for flags) so a single IP can still burn ~600 flag attempts/hour = arbitrary comment deletion at scale.

**Fix (MED):** for authenticated users, derive the dedup key from `auth().userId` server-side rather than from the request body. For anonymous reactions, hash IP + UA into the key. For flags, require auth (or at minimum increase threshold and add a 24 h reputation gate).

---

## 4. Timing-Safe Comparison Verification

Confirmed `timingSafeEqual` is used everywhere a secret is compared:

| File | Use |
|---|---|
| `src/lib/cron-auth.ts:17` | `isCronAuthorized` — used by all cron routes |
| `src/lib/auth/verify-bearer.ts:26` | `verifyBearer` — used by `/api/bot`, `/api/migrate`, `/api/setup`, `/api/cleanup` DELETE |
| `src/app/api/webhooks/linear/route.ts:56` | HMAC-SHA256 webhook signature compare |
| `src/app/api/webhooks/posthog/route.ts:183` | Token compare |

All four call sites length-check first then `timingSafeEqual`. Pattern is consistent.

**Discord interaction signature** (`src/app/api/discord/route.ts:45`) uses `nacl.sign.detached.verify` — that's an Ed25519 verification primitive (math, not a comparison), so it's constant-time by construction.

**No timing-comparison gaps.**

---

## 5. Hardening Opportunities (lower priority)

- **`src/app/api/share/[id]/collaborators/route.ts:23` `getOwnerId` opens a DB round-trip for every GET; add `apiGuard` rate-limit + short cache. (LOW)
- **Discord public key constant** — move to env for clarity (`DISCORD_PUBLIC_KEY`). (LOW / cosmetic)
- **`profile` `avatarUrl`** (`src/app/api/user/profile/route.ts:21-24`) is validated only as `https://…` — any HTTPS URL is accepted, enabling tracking-pixel embeds via `<img>` of the profile avatar. Add host allowlist (e.g. Clerk CDN + a few known hosts) or proxy through `/api/sprite`-style. (LOW-MED)
- **`creator_profiles` collision** — keyed on the lower-cased display name. Two Clerk users with identical `firstName` + `lastName` can overwrite each other's profile. Switch the key to `clerk_user_id` and surface the name as a display field. (MED for impersonation potential)
- **`/api/discord` slash commands** (`approve`, `reject`) — anyone who can post a signed Discord interaction to the right channel can approve/reject Linear issues. Consider checking `body.member.roles` against a configured "admin role" id. (MED)
- **`/api/feedback` rate limit** is `3/min per user` — good — but the route does **not** verify the user's Clerk email is verified, so a single attacker can create many free Clerk accounts and spam Discord/Linear. Gate on `user.emailAddresses[*].verification.status === 'verified'`. (LOW-MED)
- **Sentry config** files at repo root (`sentry.client.config.ts` etc.) — verify `NEXT_PUBLIC_SENTRY_DSN` is not high-traffic / paid quota (cost rather than security).
- **`vercel.json` cron routes** — confirm all four cron paths (`daily-ops`, `posthog-errors`, `weekly-report`, `weekly-digest`, `cleanup`, `keep-alive`) are listed there so they aren't externally callable without `CRON_SECRET`. (Verification pending — not read in this audit.)

---

## Summary of severities

- **HIGH (1):** `/api/user/collections/[id]` + `/api/user/collections` add-item leak private share data.
- **MEDIUM (3):** version-revert/read accepts pending collaborators; reaction/flag stuffing via client sessionId; `/api/discord` admin commands have no role check.
- **LOW (≥4):** missing `apiGuard` on a couple of GET routes, avatarUrl host allow-list, creator_profile name collision, hardcoded Discord public key constant.
- **DEPS:** 13 advisories, none critical, none high-impact in production code path.
