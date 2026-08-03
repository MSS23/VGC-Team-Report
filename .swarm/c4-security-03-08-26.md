# C4 — Security Audit — 03 Aug 2026

Scope: `npm audit`, hardcoded-secret scan (working tree only), OWASP review of all 51 route
handlers under `src/app/api/**`, and signature verification in the three webhook handlers.
Read-only run — no files were modified.

**Headline: no P0. No hardcoded secrets anywhere in the working tree.**
Two High findings are new authorization/DoS bugs in the creator-identity surface; the third High
is a one-line, non-breaking `next` bump that closes 13 advisories.

| Severity | Count |
|---|---|
| P0 | 0 |
| High | 3 (deps) + 2 (code) |
| Medium | 1 (deps, ALREADY-KNOWN) + 5 (code) |
| Low | 1 (deps) + 4 (code) |

---

## 1. `npm audit` — 16 vulnerabilities (0 critical, 6 high, 9 moderate, 1 low)

Run with proxy vars cleared. Raw metadata: `{"critical":0,"high":6,"moderate":9,"low":1,"total":16}`.

### 1.1 ALREADY-KNOWN (VGC-248) — the 9 moderates

All 9 moderate advisories are the OpenTelemetry cluster plus its `protobufjs` leaf:

`@opentelemetry/core` (GHSA-8988-4f7v-96qf, unbounded memory alloc in W3C Baggage), and the
packages it poisons — `exporter-logs-otlp-http`, `otlp-exporter-base`, `otlp-transformer`,
`resources`, `sdk-logs`, `sdk-metrics`, `sdk-trace-base` — plus `protobufjs` 7.6.4
(GHSA-j3f2-48v5-ccww, infinite loop in `.proto` option parsing).

Three of these are direct deps in `package.json` and need **semver-major** bumps
(`isSemVerMajor: true`): `@opentelemetry/exporter-logs-otlp-http` and `@opentelemetry/sdk-logs`
both 0.214.0 → **0.221.0**. The other six resolve transitively once those move.

Note for the ticket: the count has **dropped from 12 to 9**. Nothing new here; no action this run.
Only reachable from `src/instrumentation.ts` (server-side PostHog log export), so exploitability is
low regardless.

### 1.2 NEW — 6 high, all fixable **non-breaking**

| Sev | Package | Path | Fix |
|---|---|---|---|
| High | `next` 16.2.6 | direct | `16.2.12` — `isSemVerMajor: false` |
| High | `postcss` ≤8.5.17 | via `next` | same bump |
| High | `sharp` 0.34.5 | via `next` | same bump |
| High | `axios` 1.16.0 | dev: `start-server-and-test` → `wait-on` | `fixAvailable: true` |
| High | `systeminformation` ≤5.31.6 | dev: `cypress` | `fixAvailable: true` |
| High | `brace-expansion` | dev: `eslint`, `@typescript-eslint` | `fixAvailable: true` |

**`next` is the one that matters and it is a patch bump.** 16.2.6 carries 9 advisories, several
directly relevant to this codebase:

- **GHSA-6gpp-xcg3-4w24 — Middleware/Proxy bypass in App Router (CWE-285).** This app puts
  *every* non-route-level control in `src/proxy.ts`: bot detection, the CORS Origin allowlist,
  and the CSRF hook. A proxy bypass removes all of them at once. Highest-impact item in this report.
- **GHSA-89xv-2m56-2m9x and GHSA-p9j2-gv94-2wf4 — SSRF** in Server Actions / rewrites. Note
  `next.config.ts:37-51` defines three PostHog rewrites.
- GHSA-955p-x3mx-jcvp — unauthenticated disclosure of internal Server Function endpoints.
- GHSA-68g3-v927-f742 / GHSA-4633-3j49-mh5q — cache confusion on requests with bodies.
- GHSA-m99w-x7hq-7vfj, GHSA-4c39-4ccg-62r3, GHSA-q8wf-6r8g-63ch — DoS variants.

The same bump also closes `postcss` (GHSA-6g55-p6wh-862q / GHSA-r28c-9q8g-f849, **arbitrary file
read** via attacker-controlled `sourceMappingURL`; GHSA-qx2v-qp2m-jg93, XSS via unescaped
`</style>`) and `sharp` (GHSA-f88m-g3jw-g9cj, four inherited libvips CVEs, reachable through
Next's Image Optimization API).

`axios`, `systeminformation` (OS command injection, CWE-78), and `brace-expansion` are all
**devDependencies only** — CI/test-time exposure, not production runtime. Still worth taking since
all three are non-breaking.

### 1.3 NEW — 1 low, runtime dependency

`dompurify` ≤3.4.11 — GHSA-c2j3-45gr-mqc4, `CUSTOM_ELEMENT_HANDLING` bypasses
`afterSanitizeElements` for allowed custom elements. Pulled in by **both `jspdf@4.2.1` and
`posthog-js@1.392.0`**, so it ships to the browser. `fixAvailable: true`, non-breaking.

### 1.4 Recommended action

One command takes the count from 16 → 9 with no breaking changes:

```bash
npm i next@16.2.12 && npm audit fix
```

Leave the 9 OTel moderates to VGC-248. Per CLAUDE.md this is a code change, so it can ride the
next real push as the tip commit.

---

## 2. Hardcoded secrets — clean

Scanned the working tree (not git history) for: known key prefixes (`sk_live`, `pk_live`,
`whsec_`, `lin_api_`, `xoxb-`, `ghp_`/`github_pat_`, `AKIA…`, `AIza…`, `phc_`, `SG.`, `re_`),
credentialed connection strings (`postgres://user:pass@`, `mysql://`, `redis://`), Slack and
Discord webhook URLs, `SECRET|TOKEN|API_KEY|PASSWORD|PRIVATE_KEY|WEBHOOK`-style assignments to
string literals, and long high-entropy literals in `src/` and `scripts/`.

**No literal secret found in any source, script, config, or workflow file.** Every credential is
read through `process.env` at point of use. `.env.example` contains placeholders only
(`postgresql://user:password@host/database`, `phc_xxxxxxxx…`). `.gitignore` correctly covers
`.env*` with an `!.env.example` exception, plus `*.pem`; no `.env`, `.pem`, `.key`, or `.p12`
file is tracked or present on disk.

Three literals matched the entropy heuristic and were each verified **not** to be secrets:

- `src/app/api/discord/route.ts:7` — `DISCORD_PUBLIC_KEY`. This is a Discord *application public
  key*, the Ed25519 **verification** key. Public by design, not a credential. **Low / hygiene
  only**: it is deploy-environment config baked into source, so pointing a preview at a different
  Discord app requires a code change. Move to env for consistency with every other integration.
- `src/app/api/webhooks/posthog/route.ts:428-433` and `src/app/api/cron/posthog-errors/route.ts:25-27`
  — Linear label UUIDs. Non-sensitive identifiers.
- `.claude/scripts/linear.sh:26-27` — Linear workflow-state UUIDs. Non-sensitive. (`.claude/` is
  gitignored anyway.)

### 2.1 Low — `.swarm/` is tracked in git

172 files under `.swarm/` are committed and the directory is absent from `.gitignore`. These are
internal audit reports (this one included) containing route inventories, DB schema detail, and
findings. Nothing secret today, but it is an unusual thing to publish and it is one careless paste
away from being a real leak. Consider adding `.swarm/` to `.gitignore` the way `.claude/` already is.

---

## 3. OWASP review — `src/app/api/**` (51 route files)

### What is solid (stated so it doesn't get re-litigated next run)

- **SQL injection: clean.** `@neondatabase/serverless@1.0.2` exposes composable `SqlTemplate`
  fragments, so the fragment-building in `src/app/api/explore/route.ts:94-155` (`ftsCondition`,
  `speciesCondition`, `tagFilters`, …) parameterizes every value rather than concatenating. The
  only raw-SQL escape hatch, `sql.unsafe()`, is **never called anywhere** in the codebase. The
  `to_tsquery` input at `explore/route.ts:82` is stripped to `\w` before use, so tsquery
  metacharacters can't reach the parser either.
- **SSRF: closed on both fetch-by-user-URL paths.** `src/app/api/sprite/route.ts:40-45` enforces a
  host allowlist (`play.pokemonshowdown.com`) *and* a `/sprites/` path prefix.
  `src/app/api/pokepaste/route.ts:13-22` pins `hostname === "pokepast.es"` via zod and rebuilds the
  URL from a sanitized path (`:52-54`) rather than reusing the caller's string. Both use bounded
  timeouts.
- **Ownership checks are consistent and correct** on the mutating surface: `share/route.ts:148-166`
  (owner-or-accepted-collaborator, with the edit token explicitly demoted to a non-authorization
  nonce), `share/[id]/collaborators/route.ts:88-91,174-177,205-208` (owner-only for add/rotate/remove),
  `user/reports/[shareId]/route.ts:42,63,109` (`AND owner_id = ${userId}` in the UPDATE predicate
  itself — the right pattern), `user/collections/[id]/route.ts:22`, `user/collaborations/route.ts:90-96`
  (pending-invite check before accept), `sync/[id]/route.ts:79-93`, `changelog/[shareId]/route.ts:27-41`.
- **IDOR on share IDs is handled.** `share/[id]/route.ts:41-86` serves `_editToken` only after
  confirming owner-or-collaborator; `:103-111` 404s reports that are neither public nor unlisted.
  `share/[id]/fork/route.ts:78-84` refuses to fork non-public reports. `comments/[shareId]/route.ts:36-38,67`
  deliberately withholds each comment's `session_id` and computes `isOwn` server-side — that is
  exactly right, since `session_id` is the credential the DELETE handler trusts.
- **Rate limiting covers 43 of 51 routes** via `apiGuard`. The 8 without it are all
  secret-authenticated (4 crons, `keep-alive`, `setup`, `migrate`, `bot`) or signature-verified
  (the 3 webhooks, `discord`). `user/export/route.ts:14-21` uses a bespoke 24h-per-user limiter
  instead — fine.
- **Cron/admin auth is correct**: `src/lib/cron-auth.ts:14-17` and `src/lib/auth/verify-bearer.ts:23-26`
  both fail closed on a missing env var and use `timingSafeEqual` behind a length check.

### Findings

---

#### H-1 — High — Creator identity is keyed on display name, enabling profile takeover and verified-badge impersonation

**Where:**
- `src/app/api/user/profile/route.ts:71-73` (identity derived from Clerk display name), `:83-95`
  (`INSERT … ON CONFLICT (name) DO UPDATE`)
- `src/app/api/creator/[name]/route.ts:61` (verified lookup by name), `:62` (profile lookup by name)
- `src/app/api/explore/route.ts:269,293,322` (badge attached by matching free-text `creatorName`)
- `src/lib/db.ts:56-60` (`verified_creators` PK is `name`), `:73-85` (`creator_profiles` PK is `name`)

**Exploit scenario, part 1 — profile takeover.** `creator_profiles` is keyed on the caller's Clerk
first+last name, not on their user ID, and the write is an upsert. An attacker signs up, sets their
Clerk profile name to a well-known VGC creator's name, and `PUT /api/user/profile`. The
`ON CONFLICT (name) DO UPDATE` at `:86-94` silently overwrites that creator's public `bio`,
`twitter`, `discord`, `youtube`, and `avatar_url`. The victim gets no signal; their public creator
page now serves the attacker's links. Two legitimate users who share a name collide the same way by
accident.

**Exploit scenario, part 2 — verified badge.** `isVerified` is computed by matching
`data->>'creatorName'` — a free-text field the report author types into the "By" box — against
`verified_creators.name`. Any signed-in user can publish a public report with `creatorName` set to
a verified creator's name and inherit the verified badge on Explore
(`explore/route.ts:322`), the spotlight (`spotlight/route.ts:51-57`), and the creator page
(`creator/[name]/route.ts:65`). The badge is the site's only trust signal, so this hollows it out
entirely.

**Fix:** key `creator_profiles` on the Clerk `user_id` (migrate existing rows by name, then add a
unique index on `user_id`) and have `PUT /api/user/profile` write `WHERE user_id = ${userId}`.
Resolve verified status through `shares.owner_id` → a verified *user id*, not through the free-text
`creatorName` string. Keep `creatorName` as a display label only.

---

#### H-2 — High — ILIKE wildcard injection + unbounded result set on `/api/creator/[name]`

**Where:** `src/app/api/creator/[name]/route.ts:29` (`decodeURIComponent` of the path segment),
`:46` and `:53` (that value used as an `ILIKE` **pattern**), `:43-57` (UNION with **no `LIMIT`**),
`:99,:104` (second unbounded fan-out over every matched share id).

**Exploit scenario.** The path segment is interpolated straight into `ILIKE` without escaping `%`
or `_`, so it is a pattern, not a literal. `GET /api/creator/%25` (URL-decoded: `%`) matches
*every* public report in the `shares` table. The UNION has no `LIMIT`, so the whole corpus is
loaded, then `:95-106` runs two more unbounded queries keyed on `ANY(${shareIds})` covering every
one of those ids, then `:122-139` maps and serializes the lot. One request; response size and DB
work both scale with the entire public dataset.

At the route's 30 req/min/IP budget this is a cheap sustained DB-exhaustion vector against a Neon
free-tier instance, and patterns like `%_%_%_%_%` force expensive scans without even returning much.
It also poisons the Redis cache: `:34` builds the key as `creator:${creatorName}`, so each distinct
pattern writes its own 60-second entry, and `:151` caches the full mega-payload.

Secondary: it's an aggregation channel — one request enumerates every public report with creator
names, placements, and view counts, bypassing the paginated `/api/explore` surface.

**Fix:** treat the name as a literal — `WHERE LOWER(data->>'creatorName') = LOWER(${creatorName})`
(matching what `:61-63` already does for the verified/profile/follower lookups, which are correctly
written as `=` comparisons). If pattern matching is genuinely wanted, escape `%`, `_`, and `\`
first. Add a `LIMIT` to the UNION regardless. Same `%`-as-wildcard note applies to
`explore/route.ts:104-107` (`searchPattern = "%" + q + "%"`), though there the `LIMIT` bounds it —
Low, worth escaping anyway.

---

#### M-1 — Medium — CORS allowlist admits attacker-registerable hostnames, with credentials

**Where:** `src/lib/security/cors.ts:21` (the preview-deploy regex), `:33`
(`Access-Control-Allow-Credentials: "true"`), `:27` (reflects the caller's Origin verbatim).

```
/^https:\/\/vgc-team-report[a-z0-9-]*\.vercel\.app$/
```

**Exploit scenario.** `vercel.app` subdomains are first-come-first-served across all Vercel
accounts. `[a-z0-9-]*` matches any suffix, so an attacker creates a project named
`vgc-team-report-x` in their own free Vercel account, gets `vgc-team-report-x.vercel.app`, and that
origin is now reflected into `Access-Control-Allow-Origin` **with
`Access-Control-Allow-Credentials: true`**. A victim visiting the attacker's page has their browser
issue credentialed cross-origin reads against every `/api/user/*` endpoint, and the responses are
readable.

The impact is currently blunted because Clerk's session cookie defaults to `SameSite=Lax`, so the
cookie isn't attached to the cross-site subrequest. That is a mitigation living entirely in a
third-party default, not in this codebase — one Clerk config change away from a full authenticated
data read. It also grants the attacker origin a bypass of the `proxy.ts:87` Origin gate for
state-changing requests.

**Fix:** drop the open-ended wildcard. Vercel preview URLs include the deployment hash and team
scope (`vgc-team-report-<hash>-<scope>.vercel.app`); pin the regex to that shape, anchoring on the
scope segment. Or gate previews on `process.env.VERCEL_ENV !== "production"` so the loose pattern
never applies to the production deployment.

---

#### M-2 — Medium — The CSRF layer never executes

**Where:** `src/proxy.ts:87` (Origin gate), `:100-113` (CSRF gate), `src/lib/security/csrf.ts`
(entire module).

**Analysis.** Line 87 returns 403 for any API request whose Origin header is present and *not* in
the allowlist. Line 104 then computes `isTrueCrossOrigin = !!origin && !isAllowedOrigin(request)`
and only calls `validateCsrf` when that is true — i.e. exactly the condition line 87 already
rejected. Every request that reaches line 106 has either no Origin (→ `isTrueCrossOrigin` false) or
an allowed one (→ false). **`validateCsrf` is unreachable.** The double-submit cookie machinery in
`src/lib/security/csrf.ts` and the `setCsrfCookie` call at `proxy.ts:130` are doing nothing.

This is not currently exploitable — the Origin allowlist is a legitimate CSRF control, cross-site
form POSTs do send `Origin`, and `bot-detection.ts:113-124` additionally 403s API requests carrying
none of `referer`/`origin`/`sec-fetch-mode`. But the codebase believes it has two layers and has
one, and that one layer is the same allowlist weakened by M-1. The `/api/sync` and `/api/keep-alive`
exclusions at `:100` further narrow it.

**Fix:** either enforce CSRF on all state-changing API requests regardless of Origin (change the
condition at `:105` to just the method check), or delete `src/lib/security/csrf.ts` and document
the Origin allowlist as the sole control so the next reader isn't misled. The first is better given
M-1.

---

#### M-3 — Medium — Production CSP allows `'unsafe-inline'` for scripts

**Where:** `next.config.ts:5` (`"'unsafe-inline'"` in `scriptSources`, unconditional — the
`'unsafe-eval'` entry on `:8` is correctly dev-gated, this one isn't), consumed at `:118-123`.

**Exploit scenario.** Any HTML-injection sink anywhere in the app becomes directly exploitable;
the CSP contributes zero XSS defence-in-depth. The rest of the policy is genuinely good
(`object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `form-action` pinned,
`upgrade-insecure-requests`), which makes this the one weak link.

Worth fixing because the migration is cheap here: the app has only two `dangerouslySetInnerHTML`
call sites and both are first-party — `src/app/layout.tsx:102` (the theme bootstrap script) and
`src/components/seo/JsonLd.tsx:9` (JSON-LD, already passing through a `safe` transform). No
user-controlled HTML is rendered anywhere.

**Fix:** switch to nonce-based `script-src` — generate a nonce in `src/proxy.ts`, pass it via
request header, and attach it to those two inline scripts.

---

#### M-4 — Medium — No replay protection on the Linear and Discord webhooks

**Where:**
- `src/app/api/webhooks/linear/route.ts:49-59`
- `src/app/api/discord/route.ts:85-89`

Both verify their signature correctly — Linear does HMAC-SHA256 over the raw body with a
length-checked `timingSafeEqual`; Discord does Ed25519 over `timestamp + rawBody` via `tweetnacl`.
Neither checks **freshness**.

**Exploit scenario.** Linear signs the body only, and the handler never reads the `webhookTimestamp`
field Linear includes for exactly this purpose — a captured request replays indefinitely. Discord
is worse in principle: the signature covers a timestamp (`:86`) that the code never validates, so
anyone who captures a signed `/approve` or `/reject` interaction can replay it forever to drive the
Linear pipeline (`discord/route.ts:264-355`). The invoker allowlist at `:50-66` doesn't help — the
replayed payload carries the original authorized invoker's ID.

Note `/api/discord` also bypasses all middleware (`proxy.ts:13-16`), so there is no rate limit
behind which to hide.

**Fix:** reject payloads whose timestamp is more than ~60s old, in both handlers.

**Also in `webhooks/linear/route.ts`:** `:27-30` returns `200 {ok:true}` for an empty body
*before* the signature check. Harmless today (no side effects on that path) but it is an
unauthenticated code path in a signature-verified handler; move it after verification.

**Webhook verification verdict overall:**
- **Clerk** (`webhooks/clerk/route.ts:38`) — **correct.** Delegates to Clerk's `verifyWebhook`
  (Svix: signature + timestamp + replay window), fails closed on a missing signing secret
  (`:28-32`), returns 4xx on verification failure and 200 only on downstream handler errors
  (`:68-74`) — the right split.
- **Linear** — signature correct, **replay window missing**, empty-body early-return.
- **PostHog** (`webhooks/posthog/route.ts:174-186`) — a static shared-secret header, not a body
  signature. Comparison is length-checked and `timingSafeEqual`, and it fails closed on a missing
  secret. Acceptable, but strictly weaker than HMAC: the secret is replayable by anyone who
  observes it, and the handler fans out to three external services per request
  (PostHog query `:43`, Linear `:229`, Discord `:278`). The `$session_id` is properly UUID-validated
  at `:31-32` before use and the HogQL is parameterized via `values` (`:54`) — good.

---

#### M-5 — Medium — Anonymous reaction identity is a client-supplied `sessionId`

**Where:** `src/app/api/reactions/[shareId]/route.ts:14` (schema accepts any non-empty string),
`:70`, `:85-95` (dedupe keyed on it); `src/lib/db.ts:32-39` (`UNIQUE(share_id, reaction_type, session_id)`).

**Exploit scenario.** The uniqueness constraint dedupes on a value the client chooses. A caller
sends a fresh random `sessionId` per request and inflates a report's like count without limit,
capped only by the 30 req/min/IP guard at `:62`. Like counts drive Explore's **default** "popular"
sort (`explore/route.ts:176-195`), so this is direct manipulation of the site's primary ranking —
either to promote one's own report or to bury others by promoting noise.

The self-like guard at `:79-82` is trivially sidestepped by signing out.

`comments/[shareId]/[commentId]/route.ts:63-69` has the same client-supplied-identity shape for
comment deletion, but is much better bounded: the GET handler deliberately never returns any
comment's `session_id` (`comments/[shareId]/route.ts:36-38,67`), so an attacker has nothing to
replay. Leave that one; it's a reasonable anonymous-comment model.

**Fix:** derive reaction identity server-side the way `comments/flag/route.ts:36` already does —
`userId ? \`user:${userId}\` : \`ip:${getClientIp(request)}\`` — and drop `sessionId` from the
request body. That file is the in-repo precedent, and its comment (`:30-34`) explains this exact
reasoning.

---

#### L-1 — Low — Rate-limit identity is client-spoofable

**Where:** `src/lib/security/input-validation.ts:53-78`, consumed by
`src/lib/security/api-guard.ts:32-33`.

`getClientIp` takes the **left-most** `x-forwarded-for` entry, which is fully client-controlled.
On Vercel the platform rewrites this header so it's fine in production, but any request path that
reaches the app off-platform trusts it, letting a caller rotate the value to get unlimited fresh
rate-limit buckets. The `fp:<user-agent|lang|sec-ch-ua>` and `unknown` fallbacks (`:68-77`) also
collapse unrelated clients into shared buckets. The file's own docblock (`:46-51`) already flags
this and advises treating `"unknown"` as always-limited — no caller does.

**Fix:** prefer Vercel's `x-vercel-forwarded-for`, or take the right-most XFF entry (the last
trusted hop) rather than the left-most.

---

#### L-2 — Low — `avatarUrl` accepts any HTTPS URL and is echoed to all visitors

**Where:** `src/app/api/user/profile/route.ts:21-24` (validation is `startsWith("https://")` and a
500-char cap — nothing else), stored `:85`/`:93`, served publicly at `creator/[name]/route.ts:79`.

Rendering is blocked by the CSP `img-src` allowlist (`next.config.ts:77`), so it can't currently
load — but an arbitrary attacker-chosen URL is stored and returned to every visitor of a creator
page. Combined with **H-1** (any user can overwrite any creator's profile row), this becomes an
attacker-controlled URL served under a victim creator's identity.

**Fix:** allowlist the hostname (Clerk's `img.clerk.com` is the obvious intended source, and
`clerkImageUrl` is already returned separately at `:45`), and parse with `new URL()` rather than a
prefix check.

---

#### L-3 — Low — `X-Frame-Options: DENY` contradicts the advertised oEmbed iframe

**Where:** `next.config.ts:80-81` and the `frame-ancestors 'none'` directive at `:147`, both applied
to `source: "/(.*)"`; versus `src/app/api/oembed/route.ts:38`, which advertises
`<iframe src="https://pokemonvgcteamreport.com/embed/{shareId}">`.

No third-party consumer (Discord, Slack, WordPress) can ever render that iframe. Not a
vulnerability — the headers are the correct default — but the oEmbed surface is dead weight, and
the fix is a scoped header override for `/embed/:path*` with `frame-ancestors *`, which *is* a
security decision and should be made deliberately rather than by accident. Flagging so it isn't
"fixed" by weakening the global policy.

---

#### L-4 — Low — Deploy config baked into source

`src/app/api/discord/route.ts:7` — `DISCORD_PUBLIC_KEY` hardcoded. Not a secret (see §2), but every
other integration in this codebase resolves through `process.env`, and pointing a preview
deployment at a different Discord app currently requires a code change and a rebuild.

Also minor: `src/lib/db.ts:4` non-null-asserts `process.env.DATABASE_URL!` and constructs a new
Neon client on every `getDb()` call, so a missing env var surfaces as a query-time failure rather
than at boot.

---

## 4. Suggested priority

1. **`npm i next@16.2.12 && npm audit fix`** — 7 of 16 advisories gone, non-breaking, one command.
   Closes the middleware-bypass advisory that `src/proxy.ts` depends on.
2. **H-2** — smallest code fix with the largest blast radius reduction (`ILIKE` → `=`, add `LIMIT`).
3. **H-1** — needs a migration; worth a dedicated ticket.
4. **M-1 / M-2** together — they are the same control surface and should be reasoned about at once.
5. **M-4**, **M-5**, then the Lows.

VGC-248 (9 remaining OTel moderates) unchanged — no action taken.
