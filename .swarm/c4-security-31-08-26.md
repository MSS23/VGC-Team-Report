# C4 — Security Audit — 2026-08-31

Branch: `claude/loving-sagan-ib785e` (tip `70c4633`)
Scope: `npm audit`, hardcoded-secret sweep of git-tracked files, OWASP review of `src/app/api/**` (54 route files).
Mode: read-only. No files modified, nothing committed. No secret values are printed below.

---

## Executive summary

| | |
|---|---|
| **P0 (hardcoded secrets)** | **NONE FOUND.** No API key, token, signing secret, or connection string is committed. |
| **npm audit** | 0 critical / 0 high / **8 moderate** / 0 low. All 8 are one advisory in the OpenTelemetry tree. |
| **VGC-264 (x-forwarded-for)** | **FIXED on this branch.** Zero routes parse the raw header; a lint-style regression test enforces it. |
| **New P1s** | 2 — an unauthenticated IDOR on `/api/team-graphic`, and name-keyed (spoofable) creator identity. |

Ticket reality-check: **VGC-248 and VGC-221 are both stale and should be re-scoped or closed** (details in §1).

---

## 1. Dependency vulnerabilities (`npm audit --json`)

**Counts: `{ critical: 0, high: 0, moderate: 8, low: 0, info: 0 }`** across 819 deps (132 prod / 641 dev / 134 optional).

All 8 entries trace to a **single advisory**:

> **GHSA-8988-4f7v-96qf** — "OpenTelemetry Core: Unbounded memory allocation in W3C Baggage propagation", CVSS **5.3** (moderate), affects `@opentelemetry/core < 2.8.0`.

The other 7 rows are transitive re-reports of the same root through the OTel graph:

| Package | Direct? | Vulnerable range | Non-breaking fix? |
|---|---|---|---|
| `@opentelemetry/core` | no (root cause) | `<2.8.0` | **No** — fix is a semver-**major** bump of the parent exporter |
| `@opentelemetry/exporter-logs-otlp-http` | **yes** (`^0.214.0`) | `<=0.218.0` | **No** — `fixAvailable.isSemVerMajor: true` → `0.221.0` |
| `@opentelemetry/sdk-logs` | **yes** (`^0.214.0`) | `<=0.218.0` | **No** — semver-major → `0.221.0` |
| `@opentelemetry/resources` | **yes** (`^2.6.1`) | `0.8.0 – 2.7.1` | Yes (`fixAvailable: true`) |
| `@opentelemetry/otlp-exporter-base` | no | `<=0.218.0` | Yes |
| `@opentelemetry/otlp-transformer` | no | `<=0.218.0` | Yes |
| `@opentelemetry/sdk-metrics` | no | `<=2.7.1` | Yes |
| `@opentelemetry/sdk-trace-base` | no | `<=2.7.1` | Yes |

**Practical read:** the four "fix available" rows cannot actually be resolved in isolation — they are pinned by the two direct `0.x` packages whose fix is `0.221.0`, a semver-major hop. So the honest answer is: **no non-breaking fix exists for this advisory; it needs a coordinated `0.214 → 0.221` OTel bump.**

**Exploitability here is low.** The advisory is unbounded allocation while *parsing* W3C `baggage` headers. This repo uses OTel only as an outbound **log exporter** to PostHog (`src/instrumentation.ts`, `getLogger()` in the views/webhook routes) — it never runs a server-side baggage propagator over attacker-controlled request headers. Treat as maintenance, not urgency.

### Ticket reality-check

- **VGC-248 — "12 moderate npm vulns (breaking dep upgrades)"** → **stale count.** It is **8**, not 12, and they are 8 facets of *one* advisory in *one* dependency family, not 12 independent issues. Re-scope the ticket to "bump OpenTelemetry 0.214 → 0.221 (semver-major)".
- **VGC-221 — "Clerk major bump to clear 5 high-severity js-cookie advisories"** → **already resolved; close it.** `npm audit` reports **zero high-severity advisories**. `@clerk/nextjs` is already at **7.5.9** (manifest `^7.3.2`), which resolves `@clerk/shared@4.22.0 → js-cookie@3.0.7` — a non-vulnerable version. `js-cookie` appears nowhere in the audit output.

---

## 2. Hardcoded secrets — **CLEAN (no P0)**

Scanned all **645 git-tracked files** (binaries and `package-lock.json` excluded; `.gitignore` respected — `.env*`, `.claude/`, `.agents/`, `.codex/`, `node_modules/` are all ignored and untracked).

Patterns swept: `lin_api_*`, `sk_live_*`/`sk_test_*`/`pk_live_*`, `whsec_*`, `re_*` (Resend), `phc_*`/`phx_*` (PostHog), `AKIA*`, `ghp_*`, `xox[baprs]-*`, `AIza*`, JWTs (`eyJ...`), `postgres(ql)://` URIs, `discord.com/api/webhooks/<id>`, plus generic `secret|token|api_key|password|signing|client_secret = "<16+ chars>"` assignments and high-entropy 32+ hex / 40+ base64 string literals.

**Result: every match is a documented placeholder.** Nothing to redact.

| Hit | Verdict |
|---|---|
| `.env.example:10` `postgresql://user:password@host/database?sslmode=require` | Placeholder |
| `.env.example:34` `phc_xxxxxxxxxxxxxxxxxxxxxxxx` | Placeholder |
| `.swarm/r-clerk-webhook-18-05-26.md:39` `whsec_xxxxxxxxxxxxxxxxxxxx` | Placeholder in an old audit note |
| `.swarm/discord-failed-12-05-26.md:35` `.../webhooks/...` | Elided placeholder |

### `.env.example` — placeholders only ✅

All 30+ entries use `<your-…>`, `xxxx`, `your-…-here`, or `example.com` forms. No live value. The file is also genuinely useful documentation (it names which route consumes each var).

### Linear webhook signing secret — specifically checked ✅

`src/app/api/webhooks/linear/route.ts:32-34` resolves the secret **from the environment only**:

```ts
const webhookSecret =
  process.env.LINEAR_WEBHOOK_SIGNING_SECRET ??
  process.env.LINEAR_WEBHOOK_SECRET;
if (!webhookSecret) { return 401; }   // fails closed
```

There is **no literal signing secret anywhere in the repo.** The handler does HMAC-SHA256 over the raw body, compares with `crypto.timingSafeEqual` behind a length guard (`:52-59`), and enforces a 60-second `webhookTimestamp` replay window (`:68-73`). This confirms CLAUDE.md's note that the Linear-webhook P0 is stale — it is fixed and stayed fixed.

### The one hardcoded constant, and why it is not a secret

`src/app/api/discord/route.ts:7`

```ts
const DISCORD_PUBLIC_KEY = "44b2…";   // redacted to first 4 chars per audit rules
```

This is Discord's **Ed25519 interaction *public* verification key** — public by design, used at `:86-89` to *verify* inbound signatures. Disclosing it grants nothing. `.env.example` already documents the omission deliberately. **Not a finding**, but see P2-6 for the rotation-hygiene note.

---

## 3. OWASP review of `src/app/api/**`

### 3.1 VGC-264 — client IP derivation — **FIXED, ticket can be closed**

The ticket claims "three API routes still parse `x-forwarded-for` left-most, bypassable." **That is no longer true on this branch.**

- **Zero** files under `src/app/api/**` reference `x-forwarded-for` at all. Every client-IP read funnels through `getClientIp()` in `src/lib/security/input-validation.ts:75-103`.
- The implementation is correct: platform-set `x-vercel-forwarded-for` / `x-real-ip` first (`:77-80`), then **only the right-most** `x-forwarded-for` entry (`:83-88`) — deliberately *not* scanning leftwards, which would let a caller re-spoof by appending junk.
- Consumers: `src/lib/security/api-guard.ts:32` (all rate-limit buckets), `src/app/api/comments/flag/route.ts:36` (the flag-dedupe key that was the original exploit), `src/app/api/explore/route.ts:21`, `src/app/api/share/route.ts:100`, `src/app/api/share/[id]/fork/route.ts:139`.
- A regression guard exists: `src/lib/security/__tests__/no-raw-forwarded-for.test.ts:18-25` walks every `route.ts(x)` under `src/app/api` and fails if any file so much as mentions the raw header. Behavioural regressions are covered in `src/lib/security/__tests__/input-validation.test.ts:20-47`.

**Action: close VGC-264 as already delivered.** One residual gap is carried below as P2-1 (the fingerprint fallback), and one coverage gap as P2-2 (the guard test does not cover `src/lib` or `src/proxy.ts`).

### 3.2 Findings

---

#### P1-1 — Unauthenticated IDOR: `/api/team-graphic` renders **private** reports and ignores field redaction

**`src/app/api/team-graphic/route.tsx:96`**

```ts
const rows = await sql`SELECT data FROM shares WHERE id = ${shareId} AND deleted_at IS NULL`;
```

The visibility columns are never consulted. Every other read path enforces the project's stated privacy rule — `src/app/api/share/[id]/route.ts:199-201` returns 404 to outsiders when `!is_public && !is_unlisted`, and `src/app/api/oembed/route.ts:23` filters on `is_public = TRUE`. This route does neither.

Two distinct leaks:

1. **Private reports render.** Anyone who knows or replays a share ID (they appear in referrers, bookmarks, browser history, prior public↔private toggles, and forked/expired links) gets a fully rendered social card for a report the owner marked private. The image contains species, held **items**, abilities, Tera types, tournament name, placement, record, and creator name (`parseTeamForGraphic`, `:18-45`; rendered `:96-120`+). No auth, no ownership check.
2. **`privateFields` redaction is bypassed even for public reports.** `share/[id]` runs `applyPrivateFieldRedaction` (`src/app/api/share/[id]/route.ts:227`), which strips owner-marked private EVs/IVs/items/natures from the paste before serving. `team-graphic` reads `data.paste` raw at `:104`, so a user who hid their items still has them drawn onto the shareable card.

Rate limiting is `{ key: "graphic", max: 10 }` per minute, which slows but does not prevent targeted retrieval of a known ID.

**Suggested fix** — mirror the canonical rule and the redaction step:

```ts
const rows = await sql`
  SELECT data, is_public, is_unlisted FROM shares
  WHERE id = ${shareId} AND deleted_at IS NULL`;
if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
if (!rows[0].is_public && !rows[0].is_unlisted) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
// then run the same privateFields redaction share/[id] applies before parseTeamForGraphic
```

Best done by extracting `applyPrivateFieldRedaction` out of `share/[id]/route.ts` into `src/lib/sharing/` and importing it in both places — `src/lib/sharing/__tests__/redact-integration.test.ts:17` already flags that it is copy-pasted into the test because it is not exported. Add a vitest case asserting a private share ID yields 404 from `team-graphic`.

---

#### P1-2 — Creator identity is keyed on a user-editable display name (impersonation + profile takeover)

The whole social layer treats the free-text creator **name** as the identity key instead of the Clerk user ID.

**(a) Profile takeover — `src/app/api/user/profile/route.ts:72-96`**

```ts
const creatorName = user.firstName ? `${user.firstName}…` : user.username || "Unknown";
…
INSERT INTO creator_profiles (name, …) VALUES (${creatorName}, …)
ON CONFLICT (name) DO UPDATE SET bio = …, twitter = …, avatar_url = …, is_public = …
```

The table's primary key is `name`. A Clerk user can freely edit their own first/last name, so setting it to an existing creator's name makes the `ON CONFLICT … DO UPDATE` branch **overwrite that creator's public profile** — bio, Twitter/Discord/YouTube handles, avatar URL, and the `is_public` flag. `src/app/api/creator/[name]/route.ts:66` then serves the attacker's content on the victim's public creator page. No ownership check exists anywhere on this path. (Every user whose Clerk profile lacks a name also collides on the shared bucket `"Unknown"`.)

**(b) Verified-badge spoofing — `src/app/api/explore/route.ts:270,323`**

```ts
sql`SELECT name FROM verified_creators WHERE LOWER(name) = ANY(${creatorNames.map(n => n.toLowerCase())})`
…
isVerified: creatorNameStr ? verifiedSet.has(creatorNameStr.toLowerCase()) : false,
```

`creatorNameStr` comes from `shares.data.creatorName`, which is **request-body input** — `src/app/api/share/route.ts:135` only checks it is non-empty. Publishing a public report with `creatorName` set to a verified creator's name renders a **verified badge** on the attacker's report in Explore. Same pattern at `src/app/api/spotlight/route.ts:51-57` and `src/app/api/creator/[name]/route.ts:65-69`.

**Suggested fix:**
- Add an `owner_id` (Clerk user ID) column to `creator_profiles`, make it the identity key, and gate the upsert on it: `ON CONFLICT (owner_id) DO UPDATE …`. Reject the write when a row with that `name` exists under a different `owner_id`.
- Key `verified_creators` on Clerk user ID as well, and resolve `isVerified` from `shares.owner_id` (already stored and trustworthy) rather than from the user-typed `data.creatorName`.
- Short-term mitigation if the migration is deferred: in `share/route.ts`, reject a POST whose `state.creatorName` case-insensitively matches a `verified_creators` row that the authenticated `owner_id` does not own. That closes the badge spoof without a schema change.

---

#### P2-1 — `getClientIp` fingerprint fallback is client-controllable

**`src/lib/security/input-validation.ts:93-100`** — when no trusted IP header is present, the identity becomes `fp:<user-agent>|<accept-language>|<sec-ch-ua>`, all attacker-supplied. Rotating a User-Agent mints unlimited rate-limit buckets and unlimited `comment_flags` dedupe identities — the exact class of bypass VGC-264 fixed on the header path.

On Vercel this is unreachable (the platform always sets `x-vercel-forwarded-for`), so severity is low today; it becomes live if the app is ever fronted differently or run self-hosted.

**Fix:** hash the fingerprint and mark it low-trust (e.g. return `fp:${sha256(fp).slice(0,16)}`), and apply a much tighter rate-limit multiplier to any identity with the `fp:` or `unknown` prefix. The file's own doc-comment at `:70-73` already recommends treating `unknown` as always-limited — implement that in `api-guard.ts:32`.

---

#### P2-2 — The `no-raw-forwarded-for` guard test only covers `src/app/api`

**`src/lib/security/__tests__/no-raw-forwarded-for.test.ts:20`** — `collectRouteFiles(join(process.cwd(), "src", "app", "api"))` matches only `route.ts(x)`. A raw header parse added in `src/proxy.ts`, `src/lib/**`, or a server action would pass the guard. Nothing violates it today.

**Fix:** widen the scan to all of `src/` (excluding `src/lib/security/`), still matching on `/x-forwarded-for/i`.

---

#### P2-3 — `apiGuard` body-size limit trusts `Content-Length`

**`src/lib/security/api-guard.ts:53-61`** — the check reads the `content-length` header and defaults to `0` when absent. A chunked / omitted-length request bypasses it entirely. It gates the two largest write paths: `share/route.ts:97` (`MAX_BODY_SIZE`) and `user/drafts/route.ts:98` (512 KB).

**Fix:** enforce the ceiling on the parsed body too — read via a size-counting stream, or after `await request.json()` check the serialized size and reject over the limit before touching the DB. Keep the header check as a cheap pre-filter.

---

#### P2-4 — View counts inflatable via client-chosen `sessionId`

**`src/app/api/views/[shareId]/route.ts:38`** — dedupe key is `view:${shareId}:${parsed.data.sessionId}` where `sessionId` is request-body input. Rotating it inflates `view_count` at up to 60/min per IP. Only integrity of a vanity metric (which also feeds Explore's `sort=views` ranking).

**Fix:** incorporate `getClientIp(request)` into the dedupe key alongside `sessionId`.

---

#### P2-5 — Discord interactions have no timestamp-freshness check

**`src/app/api/discord/route.ts:85-94`** — Ed25519 verification over `timestamp + rawBody` is correct, but `timestamp` is never compared against the clock, so a captured interaction stays valid forever. `/api/discord` also bypasses all middleware (`src/proxy.ts:14-16`), so there is no outer guard. Mutating commands are allowlist-gated (`:37-62`, `isAuthorizedInvoker`), which limits impact to replaying an admin's own past approve/reject.

**Fix:** reject when `Math.abs(Date.now()/1000 - Number(timestamp)) > 300`, matching the 60-second window the Linear webhook already enforces at `webhooks/linear/route.ts:68-73`.

---

#### P2-6 — Discord public key is config-as-code

**`src/app/api/discord/route.ts:7`** — not a secret (see §2), but hardcoding it means rotating the Discord app, or standing up a second bot for staging, requires a code change and a full deploy.

**Fix:** read `process.env.DISCORD_PUBLIC_KEY` with the literal as fallback, and add the var to `.env.example` (replacing the current "intentionally omitted" note).

---

#### P2-7 — `script-src 'unsafe-inline'` in the production CSP

**`next.config.ts:5`** (feeding the CSP at `:118`) — `'unsafe-inline'` is present in **all** environments, not just development the way `'unsafe-eval'` is (`:8`). This substantially weakens the XSS containment the rest of the header set is buying.

Mitigating: the app HTML-escapes user content at the write boundary (`escapeHtml` in `comments/[shareId]/route.ts:112-113` and `user/profile/route.ts:85`), and React escapes on render.

**Fix:** move to a nonce-based `script-src` (`'nonce-<n>' 'strict-dynamic'`) generated per-request in `src/proxy.ts`. Non-trivial with Clerk + PostHog + Vercel Live; worth a dedicated ticket rather than a drive-by.

---

#### P2-8 — Linear webhook swallows all errors as `200`

**`src/app/api/webhooks/linear/route.ts:80-83`** — the `catch` returns `200 { ok: true }`. Intentional (keeps Linear from auto-disabling the webhook), but it also means a persistent handler failure is invisible to both Linear and the operator, and nothing is logged.

**Fix:** keep the `200`, but `console.error(err)` inside the catch so the failure reaches PostHog log export.

---

### 3.3 What is solid (verified, no action)

Worth recording so the next audit does not re-derive it:

- **Authorization on mutating routes.** Every mutating route re-checks ownership server-side against the Clerk `userId`. Spot-verified: `share/route.ts:110-179` (auth required for *all* writes; the `editToken` is explicitly demoted to a non-authorizing nonce and ownership/accepted-collaborator status is re-checked at `:154-179`), `share/[id]/collaborators` (owner-only on POST/PATCH/DELETE), `share/[id]/versions/route.ts:122-126`, `user/reports/[shareId]` (`AND owner_id = ${userId}` on every UPDATE/DELETE), `user/collections/[id]/route.ts:22`, `match-log/route.ts:91`, `user/notifications/route.ts:99-101`, `comments/[shareId]/[commentId]`, `user/delete`. **No IDOR found on any write path** — P1-1 is a read path and P1-2 is an identity-model flaw, not a missing owner check.
- **SQL injection.** All queries use `@neondatabase/serverless` tagged templates → bound parameters. No `sql.unsafe`, no string concatenation. The one dynamic-column case, `explore/route.ts:212,227` (`ORDER BY ${col}`), interpolates a **`sql` fragment chosen from a fixed two-element literal set**, never user text. Clean.
- **SSRF.** Both outbound-fetch routes are locked down: `sprite/route.ts:40-45` enforces a host allowlist (`play.pokemonshowdown.com`) *and* a `/sprites/` path prefix with a 3 s abort; `pokepaste/route.ts:12-23` pins the hostname to `pokepast.es`/`www.pokepast.es` and **rebuilds the URL from the validated path** (`:53-55`) rather than forwarding the caller's string — that rebuild is what defeats redirect and userinfo tricks.
- **Secret-authenticated endpoints fail closed and compare in constant time.** `src/lib/cron-auth.ts:12-17` and `src/lib/auth/verify-bearer.ts:20-26` both return `false` when the env var is unset, and use `timingSafeEqual` behind a length guard. Applied consistently across `cron/daily-ops:299`, `cron/posthog-errors:205`, `cron/weekly-digest:215`, `cron/weekly-report:139`, `keep-alive:11`, `cleanup:168` (GET) and `:192` (DELETE, separate `CLEANUP_SECRET`), `migrate:26`, `setup:15-16`.
- **Webhook signature verification.** Clerk via `verifyWebhook` with a configured-secret precondition (`webhooks/clerk/route.ts:27-41`); PostHog via constant-time `x-posthog-token` compare (`webhooks/posthog/route.ts:174-186`); Linear as detailed in §2; Discord via Ed25519. All four reject unsigned requests.
- **CORS / CSRF.** `src/lib/security/cors.ts` uses a static allowlist plus a preview-origin regex **anchored on the `-mss23s-projects` scope suffix** (`:36`) — the comment at `:25-33` documents the prior `vgc-team-report[a-z0-9-]*` bug that matched attacker-registrable `*.vercel.app` names; the anchored form is correct. `Access-Control-Allow-Credentials` is deliberately absent (`:53-58`), so even a widened allowlist could only leak anonymous responses. `src/proxy.ts:90` blocks cross-origin API calls from unknown origins, with a double-submit CSRF token as defence in depth (`:103-116`).
- **Input validation.** Zod schemas on essentially every request body (`share`, `comments`, `views`, `collaborators`, `follow`, `saved`, `profile`, `pokepaste`, `match-log`, `collections`). Share IDs are regex-gated (`SHARE_ID_RE`) before reaching SQL.
- **Rate limiting.** `apiGuard` applied to ~40 routes with per-route keys and sensible ceilings (account-delete 2/min, versions-write 10/min, comments 5/min). Backed by distributed Upstash, not per-Lambda memory.
- **Security headers.** `next.config.ts:76-140` sets HSTS w/ preload, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, a tight `Permissions-Policy`, and a CSP that is strict apart from P2-7.

### 3.4 Non-security note

`/api/keep-alive` is documented as running on a **5-minute** Vercel cron (`keep-alive/route.ts:7`), which contradicts CLAUDE.md's "Keep crons daily/weekly max" guardrail. Not a security issue — flagging it as a cost//policy drift for whoever owns the Vercel budget.

---

## Ranked action list

| Rank | Finding | Location |
|---|---|---|
| — | **No P0. No hardcoded secrets.** | — |
| P1-1 | Unauthenticated IDOR — private reports + redacted fields rendered as social cards | `src/app/api/team-graphic/route.tsx:96` |
| P1-2 | Name-keyed creator identity → profile takeover + verified-badge spoofing | `src/app/api/user/profile/route.ts:84-86`; `src/app/api/explore/route.ts:270,323`; `src/app/api/share/route.ts:135` |
| P2-1 | Spoofable `fp:` fallback identity | `src/lib/security/input-validation.ts:93-100` |
| P2-2 | Guard test scope too narrow | `src/lib/security/__tests__/no-raw-forwarded-for.test.ts:20` |
| P2-3 | Body-size limit trusts `Content-Length` | `src/lib/security/api-guard.ts:53-61` |
| P2-4 | View count inflatable via client `sessionId` | `src/app/api/views/[shareId]/route.ts:38` |
| P2-5 | No Discord interaction replay window | `src/app/api/discord/route.ts:85-94` |
| P2-6 | Discord public key hardcoded (rotation hygiene) | `src/app/api/discord/route.ts:7` |
| P2-7 | `script-src 'unsafe-inline'` in production CSP | `next.config.ts:5` |
| P2-8 | Linear webhook swallows errors silently | `src/app/api/webhooks/linear/route.ts:80-83` |
| P3 | OTel `<2.8.0` advisory — semver-major bump required | `package.json` (OTel `^0.214.0` / `^2.6.1`) |

**Ticket hygiene:** close **VGC-264** (fixed + regression-tested) and **VGC-221** (Clerk 7.5.9 already ships js-cookie 3.0.7; zero high advisories). Re-scope **VGC-248** from "12 moderate vulns" to "bump OpenTelemetry 0.214 → 0.221". Consider filing P1-1 and P1-2 as new bugs.
