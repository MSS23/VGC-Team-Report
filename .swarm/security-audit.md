# Security Audit — VGC Team Report

**Date:** 2026-08-02
**Scope:** `src/app/api/**` (54 route files), `src/proxy.ts` (Next 16 middleware), `src/lib/security/**`, `src/lib/auth/**`, `src/lib/cron-auth.ts`, `src/lib/db.ts`, repo-wide secret scan.
**Method:** static analysis only (`node_modules` unavailable — no `npm audit`, no build, no dynamic testing).
**Commit:** `d962cc6`

---

## Executive summary

The codebase is in **good shape**. Authentication, authorization, and SQL parameterization are applied consistently and deliberately — there is evidence of prior hardening passes (edit-token demoted to a non-authorization nonce, collaborator `status` gating, `is_public` guards added to `/api/user/saved` and `/api/user/collections`, timing-safe bearer comparisons everywhere).

- **0 P0.** No hardcoded secrets, no SQL injection, no unauthenticated destructive endpoints.
- **2 P1.** One IDOR that leaks private report content, one authorization-model flaw allowing creator-profile takeover.
- **8 P2.** Mostly narrow data leaks, integrity/abuse issues, and replay-protection gaps.

### Verdict per task area

| Area | Verdict |
|---|---|
| SQL injection (`@neondatabase/serverless`) | **Clean.** Every user-controlled value is a tagged-template parameter. No `sql.unsafe`, no string concatenation into SQL anywhere in `src/`. |
| Hardcoded secrets | **Clean.** Only `.env.example` / docs placeholders. No `.env*` in git history. |
| Webhook signature verification | **Correct** for all three (Clerk / Linear / PostHog). Missing replay windows (P2). |
| Missing authn on protected routes | **None found.** All admin/cron/migration routes fail closed with timing-safe bearer checks. |
| SSRF | **Closed.** `/api/sprite` and `/api/pokepaste` both enforce host (+path) allowlists. |
| Open redirect | **None.** The only redirect (`src/proxy.ts:70`) targets a hardcoded canonical host. |

---

# CONFIRMED FINDINGS

## P1-1 — IDOR: `/api/team-graphic` renders private reports as images

**File:** `src/app/api/team-graphic/route.tsx:96`

```ts
const rows = await sql`SELECT data FROM shares WHERE id = ${shareId} AND deleted_at IS NULL`;
```

**Issue.** This is the only share-read path in the codebase that does not check `is_public` / `is_unlisted` / ownership. Compare:

| Path | Visibility gate |
|---|---|
| `src/app/api/share/[id]/route.ts:200` | `if (!isPublic && !isUnlisted) return 404` |
| `src/app/s/[id]/page.tsx:33-37` | private ⇒ no title/description in `<head>` |
| `src/app/embed/[id]/page.tsx:13` | `AND is_public = TRUE` |
| `src/app/api/oembed/route.ts:23` | `AND is_public = TRUE` |
| **`src/app/api/team-graphic/route.tsx:96`** | **none** |

**Exploit.** `GET /api/team-graphic?id=<shareId>&style=wrapped` returns a rendered PNG containing the full team (all six species + held items), `tournamentName`, `placement`, `record`, `creatorName`, and tags — for a report the owner has explicitly set to **Private** ("only accessible to you"). The share id is required, but it is not a secret in practice:

- Any report that was public and later flipped to private has its id in Explore listings, `sitemap.xml`, Discord/Twitter unfurls, and CDN caches.
- A removed collaborator, or anyone who had the `/s/{id}` link before the visibility change, retains the id permanently.
- No rate limiter enumeration risk (62^8), but no enumeration is needed.

This also bypasses the tiered-publishing redaction (`applyPrivateFieldRedaction`, `src/app/api/share/[id]/route.ts:18-30`): fields a creator marked in `privateFields` (e.g. held items) are still drawn into the graphic.

**Fix.**
```ts
const rows = await sql`
  SELECT data FROM shares
  WHERE id = ${shareId} AND deleted_at IS NULL
    AND (is_public = TRUE OR is_unlisted = TRUE)
`;
```
Additionally validate the id (`/^[A-Za-z0-9]{8}$/`, matching `IdSchema` in the sibling routes) before the query, and apply `redactPasteFields()` to the paste before `parseTeamForGraphic()` so `privateFields` is honoured here too.

---

## P1-2 — Creator profiles are keyed on display name, not account ⇒ profile takeover

**Files:**
- Write: `src/app/api/user/profile/route.ts:71-95`
- Read (public): `src/app/api/creator/[name]/route.ts:62`
- Schema: `src/lib/db.ts:74-85` (`creator_profiles.name TEXT PRIMARY KEY`)

```ts
// src/app/api/user/profile/route.ts:71-73
const creatorName = user.firstName
  ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
  : user.username || "Unknown";
// :84-95
INSERT INTO creator_profiles (name, bio, twitter, discord, youtube, is_public, accent_theme, avatar_url, updated_at)
VALUES (${creatorName}, ...)
ON CONFLICT (name) DO UPDATE SET bio = ..., twitter = ..., is_public = ..., avatar_url = ...
```

**Issue.** The row identity is the caller's **Clerk display name**, a field the caller controls, not the immutable `user.id`. There is no ownership column on `creator_profiles` at all.

**Exploit.** An attacker signs up, sets their Clerk first/last name to exactly match a known creator's display name (e.g. a verified creator listed on `/explore`), then sends a single `PUT /api/user/profile`. `ON CONFLICT (name) DO UPDATE` overwrites the victim's row. Consequences, all rendered on the victim's public `/creator/{name}` page:

1. **Defacement / impersonation** — attacker-controlled `bio`, `twitter`, `discord`, `youtube` (phishing links) attributed to the victim, next to the `isVerified` badge (`src/app/api/creator/[name]/route.ts:65`).
2. **Denial of service** — set `isPublic: false` and `src/app/api/creator/[name]/route.ts:68-72` returns `{ isPrivate: true, reports: [] }`, hiding the victim's entire creator page (and caching that for 60s at the CDN).
3. **Victim lockout** — the victim's own `PUT` restores it, but the attacker can re-take it at any time; there is no tie-break.

Rate limiting is 10/min (`profile-write`), which is ample. The attacker's avatar URL is constrained to `https://` (`:21-24`), and the app CSP `img-src` (`next.config.ts:126`) blocks arbitrary hosts, so the avatar vector is limited — the text fields are not.

**Fix.** Add an owner column and make it the identity:
```sql
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS user_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_profiles_user ON creator_profiles(user_id);
```
Then `ON CONFLICT (user_id) DO UPDATE`, and resolve the public read in `/api/creator/[name]` by joining `shares.owner_id → creator_profiles.user_id` rather than matching on the free-text name. Backfill `user_id` from `shares.owner_id` via the existing display-name match, and refuse writes where the resolved name already belongs to a different `user_id`.

---

## P2-1 — Fork-source metadata leaks reports that were later made private

**File:** `src/app/api/share/[id]/route.ts:80-94` (`fetchForkedFromMeta`)

```ts
const rows = await sql`SELECT data, deleted_at FROM shares WHERE id = ${sourceId}`;
...
species: extractSpecies((data.paste as string) ?? ""),
```

**Issue.** No `is_public` / `is_unlisted` check on the *source* row. `/api/share/[id]/fork/route.ts:78-84` correctly restricts forking to public sources, so `forked_from_id` should only ever point at a public share — but visibility is mutable.

**Exploit.** A publishes report X (public). B forks it. A later sets X to Private. Anyone fetching `GET /api/share/{B's id}` now receives `_forkedFrom: { creatorName, tournamentName, species: [...] }` for the now-private X. Same leak appears in the Explore feed (`src/app/api/explore/route.ts:255-262`, which does gate on `src.deleted_at` but not `src.is_public`).

**Fix.** Add `AND (is_public = TRUE OR is_unlisted = TRUE)` to the `fetchForkedFromMeta` SELECT and to the `forkQuery` join in `explore/route.ts:259-261`; treat a non-matching source as `{ deleted: true }`.

---

## P2-2 — Comments readable on reports that are no longer public

**File:** `src/app/api/comments/[shareId]/route.ts:43-57`

The GET handler queries `comments WHERE share_id = ${shareId}` with **no** join against `shares` and no visibility check. The POST handler correctly requires `is_public = TRUE AND allowComments` (`:111-118`), so this only matters after a visibility change — but comment bodies (user-authored discussion of a team) then remain readable by share id forever.

**Fix.** Join `shares` and require `is_public = TRUE AND deleted_at IS NULL`, mirroring the POST handler.

---

## P2-3 — Client-supplied `sessionId` allows like/view count manipulation

**Files:**
- `src/app/api/reactions/[shareId]/route.ts:12-15, 70, 85-101`
- `src/app/api/views/[shareId]/route.ts:12, 37`

Both treat an arbitrary caller-supplied string as the dedup identity. The `UNIQUE(share_id, reaction_type, session_id)` constraint (`src/lib/db.ts:38`) and the Upstash `view:{shareId}:{sessionId}` NX key are therefore both trivially defeated by generating a fresh random `sessionId` per request.

**Impact.** Like counts drive the default `sort=popular` ranking on Explore (`src/app/api/explore/route.ts:176-195`), and view counts are surfaced on cards and in `/api/user/analytics`. An attacker can arbitrarily promote their own report or bury others by inflating a competitor's stats (or, more simply, farm the leaderboard). The only brake is the per-IP limit (30/min reactions, 60/min views) — see **P2-4**, which weakens even that.

The author's own comment at `comments/[shareId]/route.ts:34-38` shows the team already recognises `session_id` as a trusted credential; the same reasoning applies to counting.

**Fix.** Follow the pattern already used correctly in `src/app/api/comments/flag/route.ts:35-36`: derive the identity server-side —
```ts
const key = userId ? `user:${userId}` : `ip:${getClientIp(request)}`;
```
— and ignore the client value entirely (keep accepting it only for PostHog attribution).

---

## P2-4 — Rate-limit bucket is caller-controlled

**File:** `src/lib/security/input-validation.ts:53-78`

Two problems in `getClientIp()`:

1. **Left-most `X-Forwarded-For` wins** (`:55-60`). The left-most entry is the value a client can prepend; only the right-most hop is trustworthy. Whether this is exploitable depends on whether Vercel *overwrites* or *appends to* a client-supplied `X-Forwarded-For` — this is why the item is P2 and not P1, and it should be verified empirically.
2. **Confirmed:** the fallback (`:68-75`) builds the bucket from `user-agent | accept-language | sec-ch-ua` — headers the caller fully controls. Any request path that reaches the fallback gets a fresh, unlimited bucket per randomized User-Agent.

Every `apiGuard()` call in the codebase derives its key from this function, so this is the single point of failure for all rate limiting (share creation, comments, reactions, views, forks, collaborator invites, account deletion).

The file's own docstring (`:48-51`) acknowledges the `"unknown"` collapse but not the spoofability of the fingerprint.

**Fix.** On Vercel, prefer `request.headers.get("x-vercel-forwarded-for")` (platform-set, not client-forgeable) or `x-real-ip`; if falling back to `x-forwarded-for`, take the **right-most** entry. Drop the header fingerprint and treat an unresolvable identifier as always-limited on state-changing routes.

---

## P2-5 — `maxBodySize` trusts `Content-Length`

**File:** `src/lib/security/api-guard.ts:53-61`

```ts
const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
if (contentLength > maxBodySize) return 413;
```

A request with a chunked transfer encoding (or a spoofed/absent `Content-Length`) defaults to `0` and skips the check entirely. Used by `/api/share` (500 KB) and `/api/user/drafts` (500 KB), both of which write the body into a JSONB column on a **512 MB free-tier Neon instance** — the same cost surface that already caused the 447 MB `share_versions` incident noted in `CLAUDE.md`.

**Fix.** Measure the actual body: read via `await request.text()` and check `.length` (or use a counting `TransformStream`) before `JSON.parse`. Keep the `Content-Length` check as a cheap pre-filter.

---

## P2-6 — No replay window on the Linear webhook

**File:** `src/app/api/webhooks/linear/route.ts:49-59`

HMAC-SHA256 over the raw `request.text()` body, correct header (`linear-signature`), `timingSafeEqual` with a length pre-check, fails closed when the secret is unset — all correct. What is missing is freshness: Linear includes a `webhookTimestamp` field in the payload precisely so handlers can reject stale deliveries. Without it a captured `(body, signature)` pair replays indefinitely.

Impact today is low (the handler has no side effects beyond `url_verification`), but this route is a natural place to grow side effects.

**Fix.**
```ts
const ts = Number(body.webhookTimestamp);
if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > 60_000) {
  return NextResponse.json({ error: "Stale webhook" }, { status: 401 });
}
```

---

## P2-7 — No replay window on the Discord interaction endpoint

**File:** `src/app/api/discord/route.ts:77-93`

The Ed25519 verification is textbook-correct (`timestamp + rawBody`, `nacl.sign.detached.verify`, Discord's public key). But `x-signature-timestamp` is only fed into the signature — never checked for freshness. A captured `/approve` or `/reject` interaction from an authorized admin can be replayed at any later time, re-driving the Linear pipeline.

This route also **fully bypasses middleware** (`src/proxy.ts:14-16`) — no bot detection, no CORS, no CSRF, no rate limiting. That is intentional and acceptable given the signature check, but it means the signature is the *only* control.

**Fix.** Reject when `Math.abs(Date.now()/1000 - Number(timestamp)) > 300`. Optionally add an Upstash NX key on the interaction `id` for single-use semantics.

---

## P2-8 — PII forwarded to third parties

- `src/app/api/feedback/route.ts:112` → `createLinearIssue({ submitterEmail, ... })` puts the submitter's Clerk email into a Linear issue body.
- `src/app/api/webhooks/posthog/route.ts:192, 285, 363` → `body.person.properties.email` is written into the Linear issue table **and** the Discord `#builds` embed.

Both are deliberate internal-triage flows, not leaks to end users. Flagging so the privacy policy / GDPR data-map reflects that end-user email addresses leave the primary systems into Linear and Discord. The account-deletion route (`src/app/api/user/delete/route.ts:73-76`) anonymizes `feedback` rows but cannot reach the Linear/Discord copies.

---

# SPECULATIVE / DEFENSE-IN-DEPTH

Not confirmed exploitable; listed for completeness.

1. **CSRF double-submit is effectively inert.** `src/lib/security/csrf.ts:24-45` + `src/proxy.ts:100-113`: CSRF is enforced only when `origin` is present *and* not allow-listed — but that exact case is already rejected with 403 at `src/proxy.ts:87-92`. Same-origin and missing-`Origin` requests skip it. The origin allowlist is the real control and it is sound (browsers attach `Origin` to all cross-site form/fetch POSTs), so there is no known bypass — but the CSRF layer provides no additional coverage today. The cookie is also `httpOnly: false` by design (`csrf.ts:51`).

2. **Vercel preview origins are allow-listed by regex.** `src/lib/security/cors.ts:21`: `/^https:\/\/vgc-team-report[a-z0-9-]*\.vercel\.app$/` matches any project whose slug starts with `vgc-team-report` — including one created by a third party in another Vercel account (`vgc-team-report-evil-xyz.vercel.app`). Combined with `Access-Control-Allow-Credentials: true` (`cors.ts:33`), a same-named squatted project could read authenticated API responses. Requires the attacker to claim that subdomain; tighten to the `-mss23s-projects` suffix.

3. **Pending collaborators can read the full report.** `src/app/api/user/collaborations/route.ts:28-36` returns `s.data`-derived fields (paste-derived species, `teamSummary`, `tournamentName`) for rows with `status = 'pending'` — i.e. before the invitee accepts. Owner-initiated, so low risk, but the consent flow implies no access until acceptance.

4. **PostHog webhook is a bearer token, not a signature.** `src/app/api/webhooks/posthog/route.ts:174-186`: PostHog does not sign webhooks, so a shared `x-posthog-token` compared with `timingSafeEqual` is the right call and it fails closed. Note the consequence: anyone holding that token can create arbitrary Linear issues and post arbitrary content into Discord `#builds` (`:285`) — the whole `body` is trusted after the token check. Keep it rotated.

5. **`/api/user/collections` `delete` action skips schema validation.** `src/app/api/user/collections/route.ts:150` reads `raw.collectionId as string` with no Zod parse (the other three actions use one). Scoped by `user_id` so it is not exploitable, but a non-string value reaches the driver as a parameter.

6. **`console.warn("Migration statement skipped:", e)`** — `src/lib/db.ts:12` logs raw driver errors, which can embed connection details in Vercel logs. Low.

---

# NON-FINDINGS (verified clean)

**SQL injection — clean.** All 67 `FROM shares`-class queries in `src/app/api/**` interpolate exclusively via tagged-template parameters. Notable cases checked explicitly:
- `src/app/api/explore/route.ts:77-155` composes `sql` fragments for search/filter conditions; every user value (`searchPattern`, `tsQuery`, species/archetype/placement filters) is a bound parameter. `tsQuery` is additionally stripped to `\w` (`:82`) before `to_tsquery`, and `placementCutoff` is coerced through `parseInt` (`:124-131`).
- `src/app/api/cleanup/route.ts` and `src/app/api/user/delete/route.ts` pass id arrays via `ANY(${ids})`.
- No `sql.unsafe`, no `sql.query`, no string concatenation into SQL anywhere in `src/`.

**Secrets — clean.**
- Only tracked env file is `.env.example` (correctly allow-listed in `.gitignore:31`); `git log --diff-filter=A` shows no `.env*` ever committed.
- Placeholder matches (expected, **not findings**): `.env.example:10` `postgresql://user:password@host/database`, `.env.example:34` `phc_xxxx`, `docs/STRIPE_PAID_REPORTS_ARCHITECTURE.md:335-336` `sk_test_...`/`pk_test_...`, `.swarm/r-clerk-webhook-18-05-26.md:39` `whsec_xxxx`.
- `.claude/scripts/linear.sh:9,22` reads `LINEAR_API_KEY` / `DISCORD_BUILDS_WEBHOOK` from `.env.local` at runtime — no literal. `.claude/` is gitignored.
- `src/app/api/discord/route.ts:7` `DISCORD_PUBLIC_KEY` is an Ed25519 **public** key — safe to commit; move to env only for rotation ergonomics.
- `src/app/api/webhooks/posthog/route.ts:427-434` Linear label UUIDs and `.claude/scripts/linear.sh:10-15` team/state UUIDs are opaque identifiers, not credentials.
- No `NEXT_PUBLIC_*` var carries a secret (`.env.example:5` documents the rule; all seven are publishable keys/URLs).

**Webhook signature verification — all three correct.**

| Webhook | Verification | Verdict |
|---|---|---|
| Clerk (`webhooks/clerk/route.ts:26-42`) | `verifyWebhook(request)` (svix over raw body, `CLERK_WEBHOOK_SIGNING_SECRET`), explicit fail-closed when unset (`:28-32`), 400 on failure | **Correct** |
| Linear (`webhooks/linear/route.ts:23-59`) | HMAC-SHA256 over `await request.text()`, header `linear-signature`, `timingSafeEqual` + length pre-check, 401 when secret unset | **Correct** (missing replay window — P2-6) |
| PostHog (`webhooks/posthog/route.ts:170-186`) | Static shared secret `x-posthog-token`, `timingSafeEqual` + length pre-check, 401 when unset | **Correct for the provider** (PostHog does not sign) |

All three intentionally return HTTP 200 on *handler* errors to avoid provider auto-disable — signature failures still return 4xx. That is the right split.

**Authentication coverage — no gaps found.** Every privileged route fails closed with a timing-safe comparison:

| Route | Guard | File:line |
|---|---|---|
| `/api/setup` | `MIGRATE_SECRET` or `CRON_SECRET` bearer | `setup/route.ts:8-19` |
| `/api/migrate` | `MIGRATE_SECRET` bearer | `migrate/route.ts:26` |
| `/api/cleanup` GET | `CRON_SECRET` (Vercel cron) | `cleanup/route.ts:156` |
| `/api/cleanup` DELETE | `CLEANUP_SECRET` bearer | `cleanup/route.ts:180` |
| `/api/keep-alive` | `CRON_SECRET` | `keep-alive/route.ts:11` |
| `/api/bot` | `CRON_SECRET` bearer | `bot/route.ts:55` |
| `/api/cron/daily-ops` | `CRON_SECRET` | `cron/daily-ops/route.ts:299` |
| `/api/cron/posthog-errors` | `CRON_SECRET` | `cron/posthog-errors/route.ts:205` |
| `/api/cron/weekly-digest` | `CRON_SECRET` | `cron/weekly-digest/route.ts:215` |
| `/api/cron/weekly-report` | `CRON_SECRET` | `cron/weekly-report/route.ts:139` |
| `/api/discord` | Ed25519 + admin allowlist for mutations | `discord/route.ts:85-122` |

`verifyBearer` (`src/lib/auth/verify-bearer.ts:15-27`) and `isCronAuthorized` (`src/lib/cron-auth.ts:8-18`) both return `false` when the env var is unset — correct fail-closed behaviour.

**Authorization / IDOR — sound everywhere except P1-1 and P2-1.** Ownership is re-verified server-side on every mutation. Spot-checked and correct:
- `POST /api/share` requires auth *and* owner-or-accepted-collaborator even with a valid `edit_token` (`share/route.ts:144-166`); visibility changes are owner-only (`:275-289`).
- `/api/share/[id]/versions` (GET + revert), `/versions/[version]`, `/changelog/[shareId]`, `/sync/[id]` (SSE) all gate on owner-or-accepted-collaborator.
- `/api/share/[id]/collaborators` POST/DELETE/PATCH are owner-only.
- `/api/user/saved` POST (`:87-97`) and `/api/user/collections` `add-item` (`:117-125`) both verify the target share is public-or-owned before linking, and return 404 rather than 403 to avoid confirming existence.
- `/api/user/reports/[shareId]` PATCH/DELETE, `/api/user/drafts`, `/api/user/collections/[id]`, `/api/match-log`, `/api/user/notifications` are all `WHERE ... = ${userId}`-scoped.
- `/api/comments/[shareId]/[commentId]` DELETE allows owner/collaborator moderation or author-by-session; the GET handler deliberately never echoes `session_id` (`comments/[shareId]/route.ts:34-38, 67`).

**SSRF — closed.**
- `/api/sprite` (`sprite/route.ts:40-45`): host allowlist `play.pokemonshowdown.com` **and** path prefix `/sprites/`, 3 s abort.
- `/api/pokepaste` (`pokepaste/route.ts:13-22, 52-54`): hostname must equal `pokepast.es`; the fetched URL is then *rebuilt* from a hardcoded origin + sanitized path, so even a validator bypass cannot redirect the fetch. `redirect: "manual"` on the POST path.
- `/api/webhooks/posthog:26-28` builds the PostHog host from env only; `sessionId` is UUID-validated (`:31-32`) and HogQL uses bound `values` (`:53-54`).

**Open redirect — none.** The only `NextResponse.redirect` (`src/proxy.ts:70`) targets the hardcoded `CANONICAL_HOST`; `pathname`/`search` come from the parsed URL, not from a user-supplied redirect parameter.

**XSS.** Comment/feedback/profile-bio text is `escapeHtml`-ed on write (`src/lib/utils/sanitize.ts`), and the only `dangerouslySetInnerHTML` uses are a JSON-LD block (`src/components/seo/JsonLd.tsx:9`) and a static inline theme script (`src/app/layout.tsx:102`) — neither takes user input. CSP is strict apart from `'unsafe-inline'` for scripts (`next.config.ts:4`), which is needed by that theme script; a nonce would let you drop it.

---

## Recommended order of work

1. **P1-1** — one-line `WHERE` fix on `team-graphic`. Highest impact/effort ratio.
2. **P1-2** — schema change + backfill; the largest piece of work here.
3. **P2-4** — rate-limit identity; it underpins the abuse resistance of every other route.
4. **P2-3** — server-derived reaction/view identity (pattern already exists in `comments/flag`).
5. **P2-1, P2-2** — two more `WHERE` clauses.
6. **P2-5 through P2-8** — hardening.
