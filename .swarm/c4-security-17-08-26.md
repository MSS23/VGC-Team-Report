# C4 — Security Audit (read-only)

**Date:** 2026-08-17 · **Agent:** C4 (overnight swarm) · **Branch:** `claude/loving-sagan-853anq` · **Commit:** `5d456cd`
**Scope:** `npm audit`, repo-wide + git-history secret scan, OWASP review of 53 `src/app/api/**` route files, verification of VGC-264 / VGC-274.
**Baseline:** `.swarm/c4-security-10-08-26.md` (2026-08-10, commit `a70d924`). Every prior finding is marked FIXED / STILL-PRESENT below.
**Nothing was modified.** No source file edited, no commit, no push. Only this report was written.

---

## Triage table

| ID | Sev | Finding | Status vs 10-08 | Ticket |
|---|---|---|---|---|
| — | **P0** | **Hardcoded secrets — NONE FOUND** (tracked tree + last 50 commits + full history patterns) | clean, unchanged | — |
| S-1 | **P1** | Creator-profile takeover via Clerk display-name collision — unauthenticated-of-ownership upsert overwrites any creator's public profile | **STILL PRESENT** (was F2) | NEW ticket needed |
| S-2 | **P1** | Unauthenticated `creatorName` → follower-notification spoofing + creator-page attribution injection | **STILL PRESENT** (was F4) | NEW ticket needed |
| S-3 | **P2** | 8 moderate npm advisories, all OpenTelemetry, one root cause (`@opentelemetry/core` GHSA-8988-4f7v-96qf) | improved (was 19 vulns / 9 high) | **VGC-248** — re-scope, see §1c |
| S-4 | **P2** | Production CSP ships `script-src 'unsafe-inline'` | **STILL PRESENT** (was F5) | NEW ticket needed |
| S-5 | **P2** | `apiGuard` body-size cap trusts client `content-length`; omit the header and the cap is bypassed | **NEW** | NEW ticket needed |
| S-6 | **P2** | `/embed/[id]` is globally un-embeddable (`frame-ancestors 'none'` + `X-Frame-Options: DENY`) while `/api/oembed` advertises an iframe — dead feature that invites a dangerous "fix" | **NEW** | NEW ticket needed |
| S-7 | **P2** | Client-chosen `sessionId` → view-count and reaction stuffing | **STILL PRESENT** (was F8) | NEW ticket needed |
| S-8 | **P2** | PostHog webhook uses a static bearer token (not a body signature) and has no rate limit | **STILL PRESENT** (was F12) | NEW ticket needed |
| S-9 | **P3** | CSRF middleware branch is unreachable — CORS is the sole CSRF control | **STILL PRESENT** (was F7), partially improved | NEW ticket needed |
| S-10 | **P3** | Discord public key hardcoded; unvalidated hex signature → uncaught 500 instead of 401 | **STILL PRESENT** (was F9) | NEW ticket needed |
| S-11 | **P3** | `parseInt`/`Number` of untrusted cursor/offset binds `NaN` → 500 instead of 400 | **STILL PRESENT** (was F10) | NEW ticket needed |
| S-12 | **Info** | Stray `ponytail:` authoring marker left in a security-relevant comment | **NEW** | hygiene |
| — | ✅ | **VGC-264** left-most XFF parsing | **VERIFIED FIXED** | close-eligible |
| — | ✅ | **VGC-274** CORS `Allow-Credentials` + `*.vercel.app` wildcard + Linear replay window | **VERIFIED FIXED** | close-eligible |
| — | ✅ | Comments readable on private/deleted reports (was F6) | **FIXED since 10-08** | — |
| — | ✅ | **VGC-221** Clerk / js-cookie | **OBSOLETE — recommend close** | see §1c |

Nothing in this audit rises to P0. The two P1s are the same two unfixed authorization defects carried over from the 10-08 run.

---

## 0. P0 — Hardcoded secrets

**NONE FOUND.** Stated first as required.

| Scan | Scope | Result |
|---|---|---|
| High-signal token prefixes — `sk_live_`/`sk_test_`, `pk_live_`/`pk_test_`, `whsec_`, `lin_api_`, `phc_`/`phx_`, `xoxb-`, `ghp_`/`github_pat_`, `AKIA…`, `AIza…`, `-----BEGIN … PRIVATE KEY-----`, Discord webhook URLs | all 641 git-tracked files | placeholders only |
| Credentialed connection strings — `postgres(ql)://u:p@`, `redis(s)://`, `mongodb(+srv)://` | tracked tree | 1 hit, `.env.example` placeholder |
| `(api_key\|secret\|token\|password\|credential\|signing_secret\|private_key\|access_key)\s*[:=]\s*"<12+ chars>"` | tracked tree, non-`.md` | **zero hits** |
| High-entropy 32+ char string literals | `src/`, `scripts/`, configs | 6 hits, all benign (below) |
| Added lines (`^\+`) across the **last 50 commits** for all of the above + JWT triplets | git history | placeholders only |
| Any `.env` / `*.pem` / `*.key` / `*.p12` ever added on any branch | `git log --all --diff-filter=A` | only `.env.example` |

Non-findings, explicitly cleared:

- `.env.example:10` `postgresql://user:password@host/database` — placeholder.
- `.env.example:34` `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_xxxxxxxxxxxxxxxxxxxxxxxx` — placeholder, and a PostHog *project* token is public by design.
- `docs/STRIPE_PAID_REPORTS_ARCHITECTURE.md:335-338` — `sk_test_...` / `whsec_...` ellipses in a design doc.
- `src/app/api/discord/route.ts:7` `DISCORD_PUBLIC_KEY = "44b2cb02…"` — Discord's **published Ed25519 verification key**. Not a secret; it is meant to be distributed. Hygiene note at S-10.
- `scripts/generate-move-names.mjs:4` `POKEAPI_COMMIT = "e21557dd…"` — a git SHA pin.
- Four `"ABCDEFGH…0123456789"` literals (`share/route.ts:82`, `share/[id]/fork/route.ts:14`, `user/collections/route.ts:30`, `user/drafts/route.ts:20`) — base62 alphabets for ID generation, each fed by `crypto.getRandomValues`. Correct CSPRNG usage.

`.gitignore` still does `.env*` with a single `!.env.example` allowlist plus `*.pem`. All 31 distinct credentials referenced in `src/` and `scripts/` resolve through `process.env.*` — no literal fallbacks.

---

## 1. `npm audit`

**8 vulnerabilities: 0 critical · 0 high · 8 moderate · 0 low.** Production-only (`--omit=dev`): also 8 — every remaining advisory is in a runtime dependency.

**This is a large improvement over the 10-08 baseline (19 vulns, 9 high, 10 moderate).** The cause is visible in `package.json`: `next` moved from the exact pin `"16.2.6"` to `"^16.3.0"` (installed 16.3.0). That single change cleared all 9 Next.js advisories plus the `postcss` (now 8.5.26) and `sharp` (now 0.35.3) advisories it pinned. The dev-toolchain highs also resolved on their own — `undici` 7.29.0, `js-yaml` 4.3.1, `axios` 1.19.0, `nanoid` 3.3.18, `dompurify` 3.4.13, `protobufjs` 7.6.5 are all now at patched versions.

### 1a. All 8 remaining advisories — one root cause

Every one traces to **GHSA-8988-4f7v-96qf — `@opentelemetry/core` <2.8.0, unbounded memory allocation in W3C Baggage propagation (CVSS 5.3, moderate)**. The other seven packages are flagged only as "depends on a vulnerable version of `@opentelemetry/core`".

| Package | Installed range | Direct? | npm `fixAvailable` | Non-breaking? |
|---|---|---|---|---|
| `@opentelemetry/core` | `<2.8.0` | no | via `exporter-logs-otlp-http@0.221.0` | **major** (`isSemVerMajor: true`) |
| `@opentelemetry/exporter-logs-otlp-http` | `<=0.218.0` | **yes** (`^0.214.0`) | `0.221.0` | **major** — 0.x minor bump is a semver major |
| `@opentelemetry/sdk-logs` | `<=0.218.0` | **yes** (`^0.214.0`) | `0.221.0` | **major** — same |
| `@opentelemetry/resources` | `0.8.0 - 2.7.1` | **yes** (`^2.6.1`) | `true` | non-breaking (2.8.0 is in-range) |
| `@opentelemetry/otlp-transformer` | `<=0.218.0` | no | `true` | non-breaking, but pinned by the two 0.214 direct deps |
| `@opentelemetry/otlp-exporter-base` | `<=0.218.0` | no | `true` | ditto |
| `@opentelemetry/sdk-metrics` | `<=2.7.1` | no | `true` | ditto |
| `@opentelemetry/sdk-trace-base` | `<=2.7.1` | no | `true` | ditto |

**Practical read:** the five `fixAvailable: true` rows are misleading in isolation. They are peer-pinned by `@opentelemetry/exporter-logs-otlp-http@0.214` and `@opentelemetry/sdk-logs@0.214`, so a plain `npm audit fix` will not actually move them. **The whole tree clears with one action:** bump those two direct deps `^0.214.0 → ^0.221.0` in `package.json` and let `@opentelemetry/resources` follow to 2.8.0.

**Blast radius is small.** These packages are used only by `src/instrumentation.ts` for PostHog log export, and `next.config.ts:26-31` already lists them under `serverExternalPackages`, so they are `require()`d at runtime rather than bundled. Reachability of the advisory itself is low — it needs attacker-controlled W3C Baggage headers reaching the OTel propagator, and this app does not accept inbound trace context.

### 1b. Requires a major bump

Only the two rows above (`exporter-logs-otlp-http`, `sdk-logs`). **There is nothing left in the tree that needs a framework-level or breaking application change** — a notable difference from 10-08, when the `next` pin and 9 high advisories dominated.

### 1c. Existing-ticket accuracy

**VGC-248 — "12 moderate vulns needing breaking upgrades": STALE, re-scope.** *(covered-by-existing-ticket, but the scope is wrong.)*
- Count is now **8**, not 12 (was 10 on 10-08).
- All 8 are the single OTel cluster, and the fix is **one line touching two dependency ranges**, not twelve upgrades. Suggested new title: *"Bump @opentelemetry/{sdk-logs,exporter-logs-otlp-http} 0.214 → 0.221 (clears all 8 moderate advisories)."*

**VGC-221 — "Clerk major bump / js-cookie advisories": OBSOLETE, recommend close.** *(covered-by-existing-ticket; second consecutive audit reaching this conclusion.)*
- `@clerk/nextjs` is at **7.5.9**, satisfying the existing `^7.3.2` — no major bump was ever required.
- `js-cookie` resolves to **3.0.7** and appears **nowhere** in the current advisory set.

> The Linear MCP server is unauthorized in this session, so ticket bodies could not be read and no ticket was created or updated. All ticket assessments here are from `npm audit` evidence plus the installed tree.

---

## 2. Verification of the two tracked-as-merged tickets

Both were confirmed present on this branch **and** confirmed correct by reading the implementation, not just the commit subject.

### VGC-264 — left-most `x-forwarded-for` parsing — ✅ **FIXED**

Commit `b865fa2`. `src/lib/security/input-validation.ts:79-96` now reads:

```ts
// 1. Platform-set headers — not client-controllable behind Vercel's proxy.
for (const header of ["x-vercel-forwarded-for", "x-real-ip"]) { … }
// 2. Right-most x-forwarded-for entry = appended by the nearest trusted proxy.
const parts = forwarded.split(",");
const ip = normalizeIp(parts[parts.length - 1] ?? "");
```

This is the correct fix and it is better than the one recommended on 10-08: it takes the right-most entry **only**, rather than scanning leftwards for the first parseable address — which would have let a caller reinstate the spoof by appending junk. The reasoning is documented in a 30-line comment above the function.

Corroborating evidence:
- Regression tests exist at `src/lib/security/__tests__/input-validation.test.ts` and `api-guard.test.ts`.
- `src/lib/security/__tests__/no-raw-forwarded-for.test.ts` is an architectural guard test asserting no API route may parse the header directly.
- I independently confirmed that guard holds: `grep -rn "x-forwarded-for" src/app` returns **nothing**.
- The downstream exploit is closed as a consequence — `comments/flag/route.ts:36` still derives `ip:${getClientIp(request)}` for signed-out callers, but that value is no longer forgeable, so the 3-request arbitrary-comment-deletion path is gone.

**Not re-filed.**

### VGC-274 — CORS `Allow-Credentials` + Linear webhook replay — ✅ **FIXED (both halves)**

Commit `a099f97`.

1. **`Access-Control-Allow-Credentials` removed entirely** from `getCorsHeaders` (`src/lib/security/cors.ts:47-62`), with an in-code rationale explaining that nothing legitimate does a credentialed cross-origin read. Stronger than the 10-08 recommendation, which only suggested narrowing it.
2. **The `*.vercel.app` wildcard is anchored to the team scope** (`cors.ts:36-37`):
   ```ts
   /^https:\/\/vgc-team-report-(?:[a-z0-9]+|git-[a-z0-9-]+)-mss23s-projects\.vercel\.app$/
   ```
   `vgc-team-report-evil.vercel.app` no longer matches. Both real Vercel preview hostname shapes still do. Covered by `src/lib/security/__tests__/cors.test.ts`.
3. **Linear webhook replay window present** (`src/app/api/webhooks/linear/route.ts:66-73`): rejects any payload whose `webhookTimestamp` is more than 60 s from now, with 401 "Stale webhook". Placed **after** HMAC verification, which is the correct order. The residual gap (no delivery-id dedupe within the 60 s window) is acknowledged in-code and is acceptable — the handler is still side-effect-free.

Bonus improvement not in either ticket: the `/api/builder/` middleware exemption noted on 10-08 has been **removed**, with a comment warning against re-adding a pre-authorised prefix nothing owns (`src/proxy.ts:84-88`).

**Not re-filed.**

---

## 3. OWASP review — 53 route files under `src/app/api/**`

### 3.0 Clean results (the important negatives)

**A03 Injection — none.** Every DB call goes through `getDb()` → `@neondatabase/serverless` tagged templates. A targeted sweep for `sql.unsafe(`, `sql.query(`, `sql(\``, `query(\``, and string-concatenated SQL fragments returns **zero hits** across `src/`. Every `${}` inside a `sql` template is a bind parameter. `explore/route.ts` still composes `sql` fragments into an outer template — verified safe on 10-08 (fragments nest as parameterised objects rather than stringifying) and unchanged since; its user input is additionally hardened (FTS stripped to `\w`, `sort` allowlisted, `limit` clamped 1–50).

**A01 Broken access control / IDOR — none found.** Every id-addressed resource scopes to the caller. Re-verified this run: `share/[id]` (owner/collaborator branch, outsiders 404 unless public/unlisted), `share/[id]/versions{,/[version]}`, `share/[id]/collaborators` (mutations owner-only), `user/reports/[shareId]` (`AND owner_id = ${userId}` inside the UPDATE/DELETE), `user/collections/[id]` (`WHERE id = ${id} AND user_id = ${userId}`), `sync/[id]` SSE, `changelog/[shareId]`, `match-log` DELETE, and all of `user/{collections,drafts,saved,notifications,feed,analytics,export,delete}`.

`share/[id]/fork` is newer than the 10-08 baseline and is **correctly authorized**: requires `userId`, validates the id against `/^[A-Za-z0-9]{8}$/`, and restricts forking to `is_public` sources — "link-possession grants view, not the right to copy". Generated ids and edit tokens use `crypto.getRandomValues`. Clean.

**A10 SSRF — none.** Both user-URL routes remain correctly allowlisted:
- `pokepaste/route.ts:13-22, 51-54` — zod `.url()` + exact `hostname === "pokepast.es"`, then **rebuilds** the target as `https://pokepast.es${basePath}` from the parsed pathname, so `https://pokepast.es//evil.com` cannot redirect the host. 5 s timeout.
- `sprite/route.ts:40-46` — host allowlist **and** `/sprites/` path prefix, 3 s abort.

All other outbound `fetch` calls in `src/app/api/**` target hardcoded hosts (Linear, Discord, PostHog, npm registry) or `${SITE_URL}` + a literal path.

**A07 Authentication failures — cron/admin auth all correct.** `src/lib/cron-auth.ts` fails closed when `CRON_SECRET` is unset and uses `timingSafeEqual` behind a length check. `isCronAuthorized` gates all four `/api/cron/*` routes (`daily-ops:299`, `posthog-errors:205`, `weekly-digest:215`, `weekly-report:139`). `/api/setup` and `/api/migrate` — the two routes that can rewrite the `shares` table — are gated on `MIGRATE_SECRET`; `/api/keep-alive`, `/api/cleanup`, `/api/bot` are likewise secret-gated.

**Rate limiting — 45 of 53 route files call `apiGuard`.** The exceptions are all secret-authenticated (4 crons, `cleanup`, `setup`, `migrate`, `bot`, 3 webhooks) or deliberately exempt (`sprite`, documented in `proxy.ts:20-28` as the single largest driver of edge invocations, with SSRF closed at the route). `feedback` uses `isRateLimitedAsync` directly rather than `apiGuard` and additionally requires auth — fine. `user/export` has no rate limit but is auth-gated and cached; low risk. Because VGC-264 is fixed, the limiter key is now trustworthy — the global bypass reported on 10-08 is gone.

**Security headers — strong.** `next.config.ts:76-152` sets, on `/(.*)`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a tight `Permissions-Policy`, `X-Permitted-Cross-Domain-Policies: none`, HSTS `max-age=63072000; includeSubDomains; preload`, and a CSP with `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `form-action` allowlisted, `upgrade-insecure-requests`. `COOP: unsafe-none` and `CORP: cross-origin` are documented deviations (Clerk OAuth popups, Showdown sprites). Only `script-src 'unsafe-inline'` is a real weakness — S-4.

**Webhook signature verification** — Clerk delegates to Svix `verifyWebhook` (correct); Linear does raw-body HMAC-SHA256 + length check + `timingSafeEqual` + the new 60 s replay window (correct); PostHog is the weak one, S-8. All three read the raw body before parsing; none parse-then-verify.

---

### S-1 — P1 — Creator-profile takeover via display-name collision — **STILL PRESENT**

**Where:** `src/app/api/user/profile/route.ts:71-95` · schema `src/lib/db.ts:74-85` · read back at `src/app/api/creator/[name]/route.ts:66`

Unchanged since 10-08. `creator_profiles.name` is still `TEXT PRIMARY KEY` with **no `user_id` column** (confirmed: the table plus its three `ADD COLUMN IF NOT EXISTS` migrations add `is_public`, `accent_theme`, `avatar_url` — no ownership column). The upsert still keys on a freely user-editable Clerk display name with no ownership predicate:

```ts
const creatorName = user.firstName ? `${user.firstName}${…}` : user.username || "Unknown";
INSERT INTO creator_profiles (name, bio, twitter, discord, youtube, is_public, accent_theme, avatar_url, …)
VALUES (${creatorName}, …)
ON CONFLICT (name) DO UPDATE SET bio = …, twitter = …, discord = …, youtube = …, avatar_url = …
```

**Exploit:** set your Clerk first/last name to a well-known player's, `PUT /api/user/profile` once, and overwrite that creator's public bio, Twitter, Discord, YouTube and avatar — rendered next to the `verified_creators` badge computed at `creator/[name]/route.ts:65`. Setting `isPublic: false` blanks the victim's page entirely (`creator/[name]/route.ts:73`). Cached 60 s at the edge and in Redis, so it sticks. Rate limit is `profile-write` max 10/min — ten takeovers a minute.

Related asymmetry, also unchanged: the write matches exact `name` (PK) while every read matches `LOWER(name)`, so `wolfe glick` and `Wolfe Glick` are distinct rows on write but collide on read — non-deterministic which one a reader gets.

**Minimal fix:** add `owner_user_id TEXT`, set on first insert, and make the upsert `ON CONFLICT (name) DO UPDATE … WHERE creator_profiles.owner_user_id = ${user.id}` so a colliding name no-ops. Backfill from the owning share's `owner_id`. Longer term, key profiles on the Clerk user id and treat the display name as a label.

---

### S-2 — P1 — Unauthenticated `creatorName` → follower-notification spoofing — **STILL PRESENT**

**Where:** `src/app/api/share/route.ts:531-532` → `src/lib/notifications.ts:37-45` · surfaced at `src/app/api/creator/[name]/route.ts:49`

Unchanged since 10-08. `state.creatorName` is still `z.string().optional()` (`share/route.ts:54`), client-supplied, never checked against the caller's identity:

```ts
// share/route.ts:531
if (isPublic && !isUnlisted && state.creatorName) {
  notifyFollowers(state.creatorName as string, id, ownerId ?? undefined);
}
// notifications.ts:43-45
SELECT user_id, 'new_report', ${shareId}, ${creatorName}, ${message}
FROM follows WHERE creator_name = ${creatorName} …
```

**Exploit:** publish with `creatorName: "<popular player>"`. Every follower of that player gets an in-app notification reading *"\<popular player\> published a new team report"* pointing at the attacker's report, and the report appears on `/creator/<popular player>` beside that creator's verified badge (the listing query matches `LOWER(data->>'creatorName')`). `notifyFollowers` already receives `ownerId` as a third argument but does not use it to authorize the name — the plumbing for the fix is half-built.

**Minimal fix:** only call `notifyFollowers` when `creatorName` case-insensitively equals the caller's own Clerk display name, or resolve followers by `owner_id` instead of by name. Gate the creator-page listing the same way, or mark entries whose `creatorName` doesn't match the share's `owner_id` as unverified attribution.

---

### S-4 — P2 — Production CSP allows `script-src 'unsafe-inline'` — **STILL PRESENT**

**Where:** `next.config.ts:3-17` (the `scriptSources` array), applied at `:122`

`'unsafe-eval'` is correctly dev-only, but `'unsafe-inline'` still ships to production, so CSP offers no defence-in-depth against injected inline script. No stored-XSS sink is currently reachable — comment and profile text is `escapeHtml`'d at write time, and the three `dangerouslySetInnerHTML` uses are a static theme bootstrap, changelog copy, and `JsonLd.tsx` (which escapes `</script>`) — so this remains hardening rather than an active hole.

**Minimal fix:** give the inline theme-bootstrap script in `layout.tsx` a per-request nonce, then replace `'unsafe-inline'` with `'nonce-…' 'strict-dynamic'`.

---

### S-5 — P2 — `apiGuard` body-size cap is bypassable — **NEW**

**Where:** `src/lib/security/api-guard.ts:55-62`

```ts
if (maxBodySize) {
  const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
  if (contentLength > maxBodySize) return NextResponse.json({ error: "Request too large" }, { status: 413 });
}
```

The cap is enforced against a **client-supplied header**. A request that omits `content-length` (chunked `Transfer-Encoding`) or simply understates it falls through to `parseInt("0")` and passes. The two callers are both DB writes: `share/route.ts:97` (`maxBodySize: MAX_BODY_SIZE`) and `user/drafts/route.ts:98` (`maxBodySize: 512_000`).

The existing tests (`api-guard.test.ts:103-118`) only assert the honest-header cases, so the gap is untested. Severity is P2 rather than P1 because Vercel enforces its own ~4.5 MB request-body limit upstream, which caps the real blast radius at "larger rows than intended", not unbounded ingestion.

**Minimal fix:** enforce the limit on the actual bytes read — read the body once, check `.length` before `JSON.parse`, and keep the `content-length` check as a cheap fast path. A regression test should name the bug: a body exceeding the cap with no `content-length` header must still 413.

---

### S-6 — P2 — `/embed/[id]` is un-embeddable, and the obvious fix is dangerous — **NEW**

**Where:** `next.config.ts:78-81` (`X-Frame-Options: DENY`) and `:145` (`frame-ancestors 'none'`), both under `source: "/(.*)"` · vs `src/app/api/oembed/route.ts:38` and the real route at `src/app/embed/[id]`

`/api/oembed` returns an oEmbed payload whose `html` field is `<iframe src="https://pokemonvgcteamreport.com/embed/${shareId}" …>`, and `src/app/embed/[id]` exists to serve it. But the global header block applies `X-Frame-Options: DENY` **and** `frame-ancestors 'none'` to every path including `/embed/*`, so no third party can actually render that iframe. The embed feature is effectively dead in production.

This is filed as a security finding rather than a bug because of the failure mode: the intuitive fix is to relax the **global** `frame-ancestors`, which would make the entire app clickjackable — including authenticated pages and Clerk flows.

**Minimal fix:** add a `source: "/embed/:id"` entry to `headers()` that overrides only those two headers for that path (drop `X-Frame-Options`, set `frame-ancestors https:` or an allowlist of unfurlers), leaving the global block untouched. Alternatively, if embedding is not wanted, delete `src/app/embed` and stop advertising the iframe in the oEmbed `html` field.

---

### S-7 — P2 — Client-chosen `sessionId` → view and reaction stuffing — **STILL PRESENT**

**Where:** `src/app/api/views/[shareId]/route.ts:12, 37` · `src/app/api/reactions/[shareId]/route.ts:14, 92-105`

Both still dedupe on a `sessionId` the client picks (`z.string().min(1)`). Rotating it inflates `view_count` and like counts, which drive the Explore "popular" sort and the spotlight/creator stats. The owner self-like guard is still bypassed by signing out. The VGC-264 fix removes the *unlimited* ceiling — the per-IP rate limit now actually binds — but a single client can still stuff freely up to its quota.

**Minimal fix:** now that `getClientIp` is trustworthy, dedupe on `hash(clientIp + shareId)`, or require auth for reactions.

---

### S-8 — P2 — PostHog webhook: static bearer token, no rate limit — **STILL PRESENT**

**Where:** `src/app/api/webhooks/posthog/route.ts:170-186`

Still a static shared bearer (`x-posthog-token` vs `POSTHOG_WEBHOOK_SECRET`) rather than a signature over the body — PostHog webhook destinations don't sign, so this is the available option. Comparison is length-checked + `timingSafeEqual` and fails closed when the secret is unset, which is correct. The residual risks are inherent to the scheme: the token is replayable and body-independent, so anyone who obtains it can forge arbitrary `LINEAR_API_KEY`-authenticated `issueCreate` mutations and Discord posts; the length pre-check leaks the secret's length; there is no timestamp binding. The dedup map is per-instance and explicitly best-effort, not an abuse control. This route has no `apiGuard`.

**Minimal fix:** use a ≥32-byte random token, rotate it, and add a rate limit — it is one of the few endpoints with neither Clerk auth nor a limiter.

---

### S-9 — P3 — CSRF middleware branch is unreachable — **STILL PRESENT** (partially improved)

**Where:** `src/proxy.ts:100-113` vs `:90`

`:90` already 403s any API request failing `isAllowedOrigin`, for everything except `/api/discord`, `/api/webhooks/*` and `/api/setup`. `:104` then computes `isTrueCrossOrigin = !!origin && !isAllowedOrigin(request)`, which can only be true for those same exempt paths — so `validateCsrf` effectively never runs. CORS origin-blocking remains the sole CSRF control.

Materially less dangerous than on 10-08: VGC-274 closed the `*.vercel.app` hole that punched through that single layer, and the orphaned `/api/builder/` exemption was removed. What remains is code that reads as two defences where there is one.

**Minimal fix:** delete the dead branch and document CORS as *the* CSRF control, or invert it to enforce the double-submit token on all state-changing API requests carrying an `Origin`.

---

### S-10 — P3 — `/api/discord` hardcoded key + unvalidated hex — **STILL PRESENT**

**Where:** `src/app/api/discord/route.ts:7, 364-370`

- `DISCORD_PUBLIC_KEY` is hardcoded. **Not a secret** (Discord publishes it), but an env var would avoid a code change + redeploy if the app is recreated.
- `hexToUint8` still doesn't validate that the signature is well-formed hex of the right length. A malformed `x-signature-ed25519` produces a wrong-sized array and `nacl.sign.detached.verify` throws outside the try block → uncaught 500 instead of a clean 401. Cosmetic, but it turns a probe into an error-log spike.

Positives retained: signature verification runs before any body handling (`:85-93`), and mutating `approve`/`reject` commands are gated on an admin allowlist that **fails closed** when unconfigured — correctly recognising that a valid Discord signature proves origin, not identity.

---

### S-11 — P3 — `NaN` from untrusted cursor/offset — **STILL PRESENT**

**Where:** `src/app/api/comments/[shareId]/route.ts:57` (`id < ${parseInt(cursor, 10)}`) · `src/app/api/user/notifications/route.ts:35-36`

A non-numeric `?cursor=` binds `NaN`, which Postgres rejects → 500 rather than 400. In `user/notifications`, `limit` is clamped by `Math.min` but `offset` is neither clamped nor validated. No injection — purely parameter binding — but each is a free 500 and a noisy error-log entry.

---

### S-12 — Info — stray authoring marker in a security comment — **NEW**

`src/app/api/webhooks/linear/route.ts:65` contains:

```
// ponytail: no delivery-id dedupe — within the window a replay is possible;
```

`ponytail:` is not a convention used anywhere else in this repo (no other occurrence in the tracked tree) and reads as a leftover authoring/codename marker committed by accident in `a099f97`. The *content* of the comment is accurate and useful; only the prefix is noise. Worth stripping so it doesn't get mistaken for a tracked-tag convention. Flagged because it sits in a file that documents a deliberate security trade-off, where comment provenance matters.

---

## 4. Delta summary vs 2026-08-10

**Fixed since the last audit (4):** VGC-264 left-most XFF (+ architectural guard test), VGC-274 CORS `Allow-Credentials` and `*.vercel.app` wildcard, Linear webhook replay window, comments readable on private/deleted reports. Plus the `next` bump clearing 11 high advisories, and removal of the orphaned `/api/builder/` middleware exemption.

**Still present (8):** S-1, S-2, S-4, S-7, S-8, S-9, S-10, S-11 — the same set the 10-08 report listed as F2, F4, F5, F8, F12, F7, F9, F10.

**New this run (3):** S-5 (body-size cap bypass), S-6 (embed vs `frame-ancestors`), S-12 (stray marker).

**Suggested order of work:** S-1 → S-2 (the two carried-over P1 authorization defects; both are small, well-understood diffs) → S-3 (`npm audit`, one dependency-range change clearing all 8 advisories) → S-5 → S-6 → S-4.

---

*Integration note: the Linear MCP server is unauthorized in this session. No tickets were read, created, or updated. VGC-221, VGC-248, VGC-264 and VGC-274 were assessed from `npm audit` output and the source tree alone, and all four need manual follow-up in Linear (221: close; 248: re-scope; 264 and 274: verified fixed, close-eligible).*
