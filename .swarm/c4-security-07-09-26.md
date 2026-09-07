# C4 — Security Audit, 07 Sep 2026

Read-only audit of the owner's own repo. Scope: `npm audit`, tracked-tree secret scan,
OWASP review of `src/app/api/**`, webhook signature handling, and a cross-check of four
open Linear tickets.

Prior report compared against: `.swarm/c4-security-10-08-26.md` (findings marked KNOWN / NEW).

---

## 0. P0 — Hardcoded secrets

**None found.** No P0.

Scan method: `git ls-files -z | xargs -0 grep` over the **tracked** tree (working tree only,
no history probes) for `lin_api_`, `sk_live`/`sk_test`/`pk_live`, `whsec_`, `xoxb-`, `ghp_`,
`github_pat_`, `AKIA…`, `phc_…`, `postgres(ql)://user:pass@`, `discord.com/api/webhooks/<id>`,
`Bearer <20+ chars>`; plus two structural passes for `*_SECRET|TOKEN|API_KEY|PASSWORD ||/?? "literal"`
fallbacks and for `secret|token|apikey|password|signing = "<16+ char literal>"`. Both structural
passes returned **zero** rows.

Every credential resolves through `process.env.*`. Confirmed for
`LINEAR_WEBHOOK_SIGNING_SECRET`, `CLERK_WEBHOOK_SIGNING_SECRET`, `POSTHOG_WEBHOOK_SECRET`,
`POSTHOG_PERSONAL_API_KEY`, `LINEAR_API_KEY`, `DISCORD_BOT_TOKEN`, `DISCORD_BUILDS_WEBHOOK`,
`MIGRATE_SECRET`, `CRON_SECRET`, `DATABASE_URL`.

**No literal Linear webhook signing secret exists anywhere in the tracked tree.** The only
`LINEAR_WEBHOOK*` references are `process.env` reads, `.env.example` placeholders, and prose in
`.swarm/*.md` + `src/app/changelog/data.ts`.

### Two non-secret observations (neither is a credential)

- **`src/app/api/discord/route.ts:7`** — a hardcoded 64-hex constant named `DISCORD_PUBLIC_KEY`.
  This is Discord's **Ed25519 verification public key**; its only use is
  `nacl.sign.detached.verify(..., hexToUint8(DISCORD_PUBLIC_KEY))` at `:88`. Public keys are
  published in Discord's developer portal and are not credentials — **not a P0, not a leak**.
  Hygiene only: moving it to `DISCORD_PUBLIC_KEY` env would give it a rotation path if the app
  is ever re-registered. KNOWN (prior report §0 reached the same conclusion).
- **NEW — `.claude/scripts/linear.sh` is tracked in git** even though `.gitignore:.claude/`
  suggests otherwise (the file was committed before the ignore rule, and ignore rules do not
  untrack). Its contents are safe: `LINEAR_API_KEY` and `DISCORD_BUILDS_WEBHOOK` are resolved
  env-first with a `.env.local` fallback (`:20`, `:34`), and the only literals are non-secret
  Linear UUIDs (`LINEAR_TEAM_ID`, `STATE_IN_PROGRESS`, `STATE_IN_REVIEW`) and the public GitHub
  repo slug. No action required beyond awareness that this file is public if the repo ever is.

---

## 1. `npm audit`

**12 advisories total: 1 high, 11 moderate, 0 critical, 0 low.**

### 1a. Fixable without breaking changes — `npm audit fix` clears these 10

| Sev | Package | Advisory |
|-----|---------|----------|
| **HIGH** | `browserslist` | GHSA-c83g-rgw3-j3cx (unbounded cache growth → OOM) + GHSA-73wf-gq98-2v4g (prototype write via untrusted `browserslist-stats.json`) |
| Moderate | `qs` | GHSA-x5fp-wj9c-mxmx (array-limit bypass) + GHSA-4mjr-xmp4-gh2g (DoS via attacker-controlled `isBuffer`) |
| Moderate | `fflate` | GHSA-px8p-9vwx-vf98 (infinite loop on malformed ZIP64) |
| Moderate | `@humanfs/node` | GHSA-p498-v437-472g (recursive copy follows symlinks out of tree) |
| Moderate | `@opentelemetry/core` | GHSA-8988-4f7v-96qf (unbounded alloc in W3C Baggage propagation) |
| Moderate | `@opentelemetry/otlp-exporter-base`, `otlp-transformer`, `resources`, `sdk-metrics`, `sdk-trace-base` | transitive on `@opentelemetry/core` |

All carry `fixAvailable: true` with no `isSemVerMajor` flag. **This is the tonight-shippable one.**

### 1b. Requires a major bump — 2 packages

| Package | Current range | Fix version | Notes |
|---------|---------------|-------------|-------|
| `@opentelemetry/exporter-logs-otlp-http` | `^0.214.0` (direct dep) | `0.222.0` | `isSemVerMajor: true` |
| `@opentelemetry/sdk-logs` | `^0.214.0` (direct dep) | `0.222.0` | `isSemVerMajor: true` |

Both are server-only, listed in `next.config.ts:serverExternalPackages`, and used solely by
`src/instrumentation.ts` for PostHog log export. Blast radius is narrow — a 0.214→0.222 bump on
the OTel `0.x` line is a coordinated release, so bump all four `@opentelemetry/*` direct deps
together and smoke-test that instrumentation still boots.

### 1c. Ticket accuracy

**VGC-248 ("12 moderate vulns needing breaking upgrades") — PARTIALLY STALE.**
The count is still 12, but the description is now wrong on two points: (a) it is **11 moderate +
1 HIGH** (`browserslist`), not 12 moderate; and (b) only **2** of the 12 need a major bump — the
other 10 clear with a plain `npm audit fix`. Recommend re-scoping the ticket to just the two
`@opentelemetry` majors and splitting the `npm audit fix` batch out as a quick win.

**VGC-221 ("Clerk major bump for 5 high-severity js-cookie advisories") — ALREADY FIXED / STALE. Close it.**
`@clerk/nextjs` resolves to **7.5.9** (range `^7.3.2`). `js-cookie@3.0.7` is still present
transitively via `@clerk/shared@4.22.0`, but `npm audit` reports **zero** advisories against
`js-cookie` or any `@clerk/*` package. No Clerk major bump is required.

---

## 2. Ticket cross-check

| Ticket | Verdict | Evidence |
|--------|---------|----------|
| **VGC-264** — three API routes parse `x-forwarded-for` left-most | **ALREADY FIXED** | `src/lib/security/input-validation.ts:75-103` — `getClientIp` prefers platform-set `x-vercel-forwarded-for`/`x-real-ip` (not client-settable behind Vercel), then the **right-most** XFF entry only, then a header fingerprint, then `"unknown"`. All four call sites (`comments/flag:36`, `explore:21`, `share/[id]/fork:139`, `share:100`) go through it. Locked in by a regression test that greps every route file for raw header access: `src/lib/security/__tests__/no-raw-forwarded-for.test.ts`. |
| **VGC-274** — CORS `Allow-Credentials` + replay protection | **ALREADY FIXED** | `src/lib/security/cors.ts:53-59` deliberately omits `Access-Control-Allow-Credentials`, with a comment naming VGC-274; the preview-origin regex `:35-36` is anchored on the `-mss23s-projects` scope suffix, closing the attacker-registrable `*.vercel.app` hole. Replay: `webhooks/linear/route.ts:68-73` rejects `webhookTimestamp` outside ±60 s. Asserted by `src/lib/security/__tests__/cors.test.ts:80-82`. **Residual (see Finding 4):** no delivery-id dedupe inside the 60 s window (acknowledged in-code at `:66-67`), and the PostHog webhook has no replay protection at all. |
| **VGC-246** — enforce true private reports + visibility-toggle hardening | **ALREADY FIXED** | `src/app/api/share/[id]/route.ts:200` — `if (!isPublic && !isUnlisted)` returns 404 for anyone who is not the owner/edit-token holder. Toggle hardening is present too: app cache is read only for public reads (`:206`), edge `Cache-Control` is set only when public (`:242, :253`), so a public→private flip is not masked by a stale CDN entry. `share/route.ts:278-281` preserves current visibility when a client omits the flags, so an old client cannot silently demote. Comments inherit the rule (`comments/[shareId]/route.ts:46,122` both require `is_public = TRUE`), which also closes prior Finding 6. |
| **VGC-236** — standardise on `LINEAR_WEBHOOK_SIGNING_SECRET`, drop legacy var | **STILL VALID** | `src/app/api/webhooks/linear/route.ts:32-34` still reads `LINEAR_WEBHOOK_SIGNING_SECRET ?? LINEAR_WEBHOOK_SECRET`. `.env.example:72-74` documents both. Fix is a 2-line deletion, but it is **gated on confirming the Vercel production env var name first** — dropping the fallback while prod only has the legacy name fails the webhook closed (401 on every delivery). |

---

## 3. Webhook handlers

All three were checked against the five required properties.

| Property | Linear | Clerk | PostHog |
|---|---|---|---|
| Raw body read **before** JSON parse | **PASS** — `route.ts:25` `await request.text()`; `JSON.parse` only at `:61`, after verification | **PASS** — delegates to `verifyWebhook(request)` (`:38`), which reads the raw body internally (Svix) | **N/A** — bearer token, not an HMAC over the body |
| Constant-time comparison | **PASS** — `:52-57`, equal-length guard then `timingSafeEqual` | **PASS** — Svix internal | **PASS** — `:179-186`, equal-length guard then `timingSafeEqual` |
| Unknown event types → 200 | **PASS** — `:79` | **PASS** — `:67` "acknowledge all other event types" | **PASS** — falls through `formatEventTitle` default (`:338`) |
| Setup / verification ping handled | **PASS** — empty-body ping 200 at `:28-30`; `url_verification` challenge echoed at `:75-77` | **PASS** — Clerk sends no separate ping; `verifyWebhook` handles it | N/A — PostHog destinations have no ping |
| Secrets kept out of logs | **PASS** — no logging at all in the handler | **PASS** — `:40` logs the Svix error object, which does not embed the signing secret | **MOSTLY** — see Finding 6 |
| Fails closed when secret unset | **PASS** — 401 at `:35-37` | **PASS** — 400 at `:29-32` | **PASS** — 401 at `:176-178` |

**Linear handler nit (LOW, informational):** the bare `catch { return 200 }` at `:80-83` is
correct for transient errors, but it also swallows a `JSON.parse` failure on a *validly signed*
body — a real integration bug would look like a healthy webhook forever. Consider logging inside
the catch (no body, no secret) so the failure is at least observable.

---

## 4. OWASP review — `src/app/api/**` (54 route files, 27 with mutating methods)

### What came back clean (the important negatives)

- **SQL injection — none.** Every query is a `@neondatabase/serverless` tagged template with
  bound parameters. No `sql.unsafe`, no `sql.raw`, no string-concatenated SQL anywhere in
  `src/app/api/**` or `src/lib/**`. Even the conditional filters in `explore/route.ts:101-108`
  are composed as nested `sql` fragments with bound values, not interpolated strings. The one
  `neon()` construction is `src/lib/db.ts:4`.
- **IDOR — none found.** Ownership is enforced *in the WHERE clause*, not post-fetch, which is
  the pattern that actually resists IDOR. Spot-checked and clean:
  `user/reports/[shareId]:42,59,86,132` (`owner_id = ${userId}`),
  `user/collections/[id]:22` (`user_id = ${userId}`),
  `share/[id]/versions:37-47,115-126` and `changelog/[shareId]:29-34` and `sync/[id]:82-87`
  (owner **or** accepted collaborator, checked in SQL),
  `user/analytics:41-114` (every aggregate scoped to `owner_id = ${userId}`).
  `sync/[id]:78` explicitly notes "URL tokens are never authorization."
- **Authz on mutating routes — complete.** Every user-facing mutating route gates on Clerk
  `auth()`/`currentUser()`. Admin/ops routes (`migrate`, `setup`, `cleanup`, `bot`) use
  `verifyBearer` (`src/lib/auth/verify-bearer.ts`) and cron routes use `isCronAuthorized`
  (`src/lib/cron-auth.ts`) — **both fail closed when the env var is unset** and both use
  `timingSafeEqual` after an equal-length check. `migrate` no longer accepts the secret in the
  JSON body (`:13`). `discord` verifies the Ed25519 interaction signature *and* gates mutating
  commands on an explicit user/role allowlist (`:36-50`), correctly noting that signature
  verification proves origin but not invoker.
- **Input validation — zod on effectively every mutating route** (25 of 27; the exceptions are
  the three webhooks and the bearer-gated ops routes, which validate structurally instead).
- **Rate limiting — `apiGuard` on ~44 routes** (`src/lib/security/api-guard.ts`), keyed on the
  now-hardened `getClientIp`, with `Retry-After` on 429. The routes without it are the ones
  behind bearer secrets, which is the right trade.
- **SSRF — clean.** Both URL-fetching routes are allowlisted *and* time-limited:
  `sprite/route.ts:40-45` enforces `ALLOWED_HOSTS = {play.pokemonshowdown.com}` **plus** a
  `/sprites/` path prefix, with a 3 s abort; `pokepaste/route.ts:13-23` enforces
  `pokepast.es`/`www.pokepast.es` via a zod refine and rebuilds the URL from the parsed pathname
  rather than passing the user string through, with 5 s timeouts. The PostHog webhook's
  `fetchSessionTimeline` derives its host from `NEXT_PUBLIC_POSTHOG_HOST` (operator-controlled,
  not request-controlled) and UUID-validates `sessionId` before use (`:31-32`).
- **Error handling — no internal leakage.** A grep for `error: e.message` / `String(e)` in
  responses across all of `src/app/api/**` returned **zero** rows. Every handler logs the
  exception server-side and returns a generic string.
- **CORS** — see VGC-274 above. Allowlist is a closed `Set` plus one anchored regex; the
  `Allow-Origin` value is `""` for a non-allowlisted origin rather than reflected.

### Open findings

#### Finding 1 — HIGH — Creator-profile takeover via display-name collision — KNOWN, still open
**`src/app/api/user/profile/route.ts:71-73` and `:83-95`**

`creator_profiles` is keyed on `name` alone, and `name` is derived from the caller's *mutable
Clerk display name*:

```
const creatorName = user.firstName ? `${user.firstName}${...user.lastName}` : user.username || "Unknown";
...
INSERT INTO creator_profiles (name, bio, twitter, discord, youtube, is_public, ...)
VALUES (${creatorName}, ...)
ON CONFLICT (name) DO UPDATE SET bio = ..., twitter = ..., is_public = ${isPublicValue}, ...
```

There is no owner column and no check that the caller has any claim to that name.

**Exploit:** attacker signs up, sets their Clerk first/last name to match a well-known VGC
player who already has a profile, and issues one `PUT /api/user/profile`. The `ON CONFLICT`
branch overwrites that creator's public bio, Twitter, Discord, YouTube and avatar with attacker
content — which is then served to every visitor of `/api/creator/[name]` (`:66`) and cached
(`:74`). Setting `isPublic: false` instead delists the real creator's page entirely
(`creator/[name]/route.ts:72-75` returns `isPrivate: true, reports: []`), a one-request DoS on a
third party's public identity. Rate limit is 10/min — irrelevant, one request suffices.

**Precise fix (small, but needs a migration):** add `owner_user_id TEXT` to `creator_profiles`,
backfill from the existing owner of each name, then make the upsert conditional:

```sql
ON CONFLICT (name) DO UPDATE SET ... WHERE creator_profiles.owner_user_id = ${user.id}
```

and return 409 when the update affects zero rows. ~10 lines + one migration.

**Tonight-shippable interim (no migration):** before the upsert, `SELECT 1 FROM creator_profiles
WHERE LOWER(name) = LOWER(${creatorName})` and, if a row exists, require that the caller already
owns a share with that `creatorName` (`SELECT 1 FROM shares WHERE owner_id = ${user.id} AND
LOWER(data->>'creatorName') = LOWER(${creatorName})`); otherwise 409. Closes the drive-by
takeover without a schema change.

#### Finding 2 — MEDIUM/HIGH — `creatorName` is unauthenticated free text — KNOWN, still open
`creatorName` lives inside the user-controlled `shares.data` JSON and is the join key for creator
pages (`creator/[name]/route.ts:49`), follows (`:67`), explore filtering
(`explore/route.ts:73,101-108`) and follower notifications. Publishing a report with
`creatorName: "<popular player>"` attributes it to them on `/creator/<name>` and fans it out to
their followers. **Not a small fix** — it needs a verified-identity binding between `owner_id`
and `creatorName` — so this is a ticket, not a tonight change. Note `verified_creators`
(`explore:270`, `creator/[name]:65`) already exists and could carry the binding.

#### Finding 3 — MEDIUM — VGC-236: legacy `LINEAR_WEBHOOK_SECRET` still accepted — KNOWN
`src/app/api/webhooks/linear/route.ts:32-34`. Two dual-named secrets mean rotation can silently
half-apply: rotating only the new name leaves the old one live as an accepted signing key.
**Fix (2 lines):** delete the `?? process.env.LINEAR_WEBHOOK_SECRET` fallback and the
`.env.example:74` line — **after** confirming Vercel production has
`LINEAR_WEBHOOK_SIGNING_SECRET` set. Do not ship blind.

#### Finding 4 — MEDIUM — PostHog webhook has no replay protection — NEW
`src/app/api/webhooks/posthog/route.ts:170-188`. Auth is a static shared bearer
(`x-posthog-token`) with no timestamp, nonce or body HMAC. Anyone who observes one request (a
proxy log, a misconfigured integration, a support paste) can replay it indefinitely to mint
Linear issues. The in-memory dedupe at `:144-168` is per-instance and best-effort, so it does not
mitigate this across a serverless fleet. Severity is capped by the endpoint's blast radius —
creating Linear tickets, not touching app data.

**Fix (small, ~5 lines):** the handler already parses `timestamp` at `:194`. Add, immediately
after:

```ts
const ts = Date.parse(timestamp);
if (!Number.isNaN(ts) && Math.abs(Date.now() - ts) > 5 * 60_000) {
  return NextResponse.json({ ok: true, skipped: true, reason: "stale" });
}
```

Mirrors the Linear handler's `:68-73` window. Shippable tonight.

#### Finding 5 — LOW/MEDIUM — Production CSP allows `script-src 'unsafe-inline'` — KNOWN
`next.config.ts:5` (fed into `:122`). Removes CSP's value as XSS defence-in-depth. The rest of
the policy is tight (`default-src 'self'`, no wildcard `img-src`, scoped `connect-src`). Fixing
properly means a nonce-based policy threaded through the Next middleware — **not a small change**,
and Clerk's injected scripts complicate it. Ticket it; do not attempt tonight.

#### Finding 6 — LOW — PostHog webhook logs the full Linear API response — NEW
`src/app/api/webhooks/posthog/route.ts:265` — `console.error("...failed", linearRes)` dumps the
entire Linear GraphQL response body into Vercel logs. The `LINEAR_API_KEY` is sent as a *request*
header so it is not echoed back, but error bodies can carry request context and team metadata.
**Fix (1 line):** log `linearRes.errors?.[0]?.message` instead of the whole object.

#### Finding 7 — LOW — View / reaction counts inflatable via client-chosen `sessionId` — KNOWN
`views/[shareId]/route.ts:12` and `reactions/[shareId]/route.ts:14` both accept
`sessionId: z.string().min(1)` from the client and dedupe on it. Rotating the value inflates
`view_count` and reaction counts without limit, which feeds explore ranking. **Fix:** now that
`getClientIp` is trustworthy (VGC-264 done), dedupe on `hash(clientIp + shareId)` instead of the
client-supplied value, or require auth for reactions.

---

## 5. Summary table

| # | Sev | Finding | File:line | New/Known | Fix size |
|---|-----|---------|-----------|-----------|----------|
| — | — | **No hardcoded secrets** | — | — | — |
| 1 | HIGH | Creator-profile takeover via display-name collision | `user/profile/route.ts:71-73,83-95` | KNOWN | S (interim) / M (migration) |
| 2 | MED/HIGH | `creatorName` unauthenticated free text → impersonation | `creator/[name]/route.ts:49`, `explore/route.ts:73` | KNOWN | L |
| 3 | MED | Legacy `LINEAR_WEBHOOK_SECRET` still accepted (VGC-236) | `webhooks/linear/route.ts:32-34` | KNOWN | XS (env-gated) |
| 4 | MED | PostHog webhook: no replay/timestamp protection | `webhooks/posthog/route.ts:170-188` | NEW | XS |
| 5 | LOW/MED | Production CSP `script-src 'unsafe-inline'` | `next.config.ts:5` | KNOWN | L |
| 6 | LOW | Full Linear API response logged | `webhooks/posthog/route.ts:265` | NEW | XS |
| 7 | LOW | View/reaction inflation via client `sessionId` | `views/[shareId]:12`, `reactions/[shareId]:14` | KNOWN | S |
| 8 | HIGH (dep) | `browserslist` advisories | `package-lock.json` | NEW | XS (`npm audit fix`) |
| — | INFO | `DISCORD_PUBLIC_KEY` hardcoded (public key, not a secret) | `discord/route.ts:7` | KNOWN | XS |
| — | INFO | `.claude/scripts/linear.sh` tracked despite `.gitignore` | — | NEW | — |

## 6. Suggested order for tonight

1. `npm audit fix` — clears 10 of 12 advisories including the only HIGH (`browserslist`). Verify with the standard gate.
2. Finding 4 — PostHog replay window, ~5 lines.
3. Finding 6 — one-line log narrowing.
4. Finding 1 interim — the pre-check variant, no migration, closes the only HIGH app-level issue.
5. Close **VGC-221** as stale; re-scope **VGC-248** to the two `@opentelemetry` majors.
6. **VGC-264 / VGC-274 / VGC-246 can all be closed** — verified fixed in current code, with regression tests.
7. **VGC-236** stays open pending a Vercel env check; the code change itself is 2 lines.
