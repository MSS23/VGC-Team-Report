# C4 Security Audit — 22 May 2026

Scope: `npm audit`, hardcoded-secret grep across `src/**`, OWASP review of all `src/app/api/**/route.ts`, webhook/cron signature validation. Read-only; no code modified.

## Headline

- **No hardcoded secrets in `src/**`.** Every secret reference goes through `process.env.*` — no leaked Stripe/Clerk/Linear/Postgres URIs in source. P0 grep is clean.
- **npm audit: 0 critical / 5 high / 8 moderate / 0 low.** All 5 highs are the same Clerk dependency chain (`@clerk/nextjs → @clerk/backend/react/shared → js-cookie <=3.0.5`, GHSA-qjx8-664m-686j, CVSS 7.5 — prototype hijack in `assign()` enabling cookie-attribute injection). Fix requires a major Clerk bump (`@clerk/nextjs@4.6.18`, listed as `isSemVerMajor: true`) — needs migration testing.
- **Webhook signature verification is in good shape.** Linear (HMAC-SHA256 + `timingSafeEqual`), Clerk (`verifyWebhook`), Discord (Ed25519 via tweetnacl), PostHog (timing-safe shared secret). All four fail closed when the signing secret env var is absent.
- **Cron routes uniformly use `isCronAuthorized` with `timingSafeEqual`.** No cron route accepts unauthenticated traffic.
- **SQL queries use the `neon` tagged template** — all `${…}` interpolations bind parameters. No raw concatenation or `sql.unsafe()`. Identifier-position fragments in `explore/route.ts` (sort column, conditional WHERE fragments) are built from an allowlist or from other `sql\`\`` fragments, not user strings.

---

## P0 — Critical

_None._

## P1 — High

### P1-A: Clerk dependency chain pinned to vulnerable js-cookie (GHSA-qjx8-664m-686j)
- **What:** `@clerk/nextjs` → `@clerk/shared` → `js-cookie <=3.0.5`. Vulnerability is per-instance prototype hijack in `assign()` allowing cookie-attribute injection (CVSS 7.5).
- **Why it matters:** Clerk session/CSRF cookies are set by this code path. Exploit requires an attacker-controlled object reaching `Cookies.set` — unlikely in our usage, but the CVE is rated High and the auto-fix needs `@clerk/nextjs@4.6.18` (semver major).
- **Remediation:** Schedule a `@clerk/nextjs` major bump on a branch + smoke-test auth + webhook + middleware. Defer to a follow-up ticket; do not rush a major Clerk upgrade tonight.

### P1-B: `/api/migrate` POST handler uses non-timing-safe secret comparison (`!==`)
- **File:** `src/app/api/migrate/route.ts:23`
- **What:** `if (!secret || secret !== process.env.MIGRATE_SECRET) return 401;`
- **Why it matters:** The handler runs unbounded `UPDATE shares` over the entire `shares` table when authorised. A timing oracle against the secret would unlock a destructive endpoint. Also: the secret is read from the JSON body rather than an `Authorization` header, so it lands in any body-logging path.
- **Remediation:** (1) Move secret from body to `Authorization: Bearer …` header, (2) use `crypto.timingSafeEqual` over `Buffer.from()` like `isCronAuthorized` does, (3) optionally add `apiGuard` with a low rate limit.

### P1-C: `/api/cleanup` DELETE handler uses non-timing-safe secret comparison
- **File:** `src/app/api/cleanup/route.ts:100`
- **What:** `if (!CLEANUP_SECRET || authHeader !== \`Bearer ${CLEANUP_SECRET}\`) return 401;`
- **Why it matters:** Same class of issue. The handler issues bulk `DELETE FROM shares/reactions/comments/saved_reports`. Timing-safe comparison is cheap defence-in-depth.
- **Remediation:** Replace with the existing `isCronAuthorized` helper (already exported from `@/lib/cron-auth`) — uses a separate env var via a small refactor, or factor a generic `verifyBearer(request, expectedSecret)` helper into `@/lib/cron-auth`.

## P2 — Medium

### P2-A: `/api/setup` GET handler uses non-timing-safe `!==` + no rate limit
- **File:** `src/app/api/setup/route.ts:7`
- **What:** Compares `authHeader !== \`Bearer ${secret}\`` directly. No rate limit. Falls back to `CRON_SECRET` if `MIGRATE_SECRET` not set, so the surface area widens.
- **Why it matters:** Only calls `ensureTable()` (idempotent CREATE TABLE IF NOT EXISTS), so impact is low — but it's the same anti-pattern as P1-B/C and is exempted from middleware bot detection (`isCronOrWebhook` short-circuits in `middleware.ts:65`).
- **Remediation:** Use the shared `verifyBearer` helper. Wrap in `apiGuard` with a tight rate limit.

### P2-B: `/api/bot` timing-safe comparison has redundant length check ordering
- **File:** `src/app/api/bot/route.ts:64-67`
- **What:** Pads both buffers to a common length before `timingSafeEqual`, then OR's a length check. The pad-then-compare pattern leaks the *length* of the user input via the `authHeader.length !== expected.length` short-circuit on the right-hand side of `||`.
- **Why it matters:** Minor side-channel — an attacker can already infer expected length from the format (`Bearer <64 hex>` ≈ predictable). But the pattern fights the helper that exists at `@/lib/cron-auth.ts`. Easy win to make it consistent.
- **Remediation:** Replace the inline check with `isCronAuthorized(request)` — one line.

### P2-C: `/api/comments/[shareId]` POST allows anonymous posting
- **File:** `src/app/api/comments/[shareId]/route.ts:75-117`
- **What:** Anyone with a `sessionId` (free-form string from client) can post a comment. Rate-limited to 5/min per IP, word-filtered, HTML-escaped, requires `allowComments=true` on the share — but no Clerk auth check.
- **Why it matters:** Intentional design (anonymous engagement) — but it's the loudest UGC ingress on the site. Worth confirming this is intentional and worth adding a tighter per-share rate limit (currently per-IP only — one IP can post to N different shares at 5/min each).
- **Remediation:** Defer — not a bug, but document the policy somewhere. If we later want to require auth for comments, this is the single change.

### P2-D: `daily-ops` + `weekly-report` GraphQL queries interpolate `teamId` into the query string
- **Files:** `src/app/api/cron/daily-ops/route.ts:84`, `src/app/api/cron/weekly-report/route.ts:30-32`
- **What:** `\`{ team(id: "${teamId}") { ... } }\`` instead of using `$teamId` GraphQL variables.
- **Why it matters:** `teamId` comes from `process.env.LINEAR_TEAM_ID`, not user input — so this is not exploitable today. But the pattern is inconsistent with the rest of the file (which uses parameterized `linearGql(q, { teamId })`) and would become an injection vector if the source ever changed.
- **Remediation:** Convert to parameterized GraphQL variables. Small, contained, zero behavioural risk. Worth doing tonight as defence-in-depth.

## P3 — Low / Informational

### P3-A: Brittle title scraping in `/api/pokepaste` GET
- HTML title extraction uses regex (`/<title>(.*?)<\/title>/i`). Manually decodes a fixed list of entities. Not a security bug (we only call pokepast.es and the output flows through React, which auto-escapes), but it's worth tracking as a future cleanup if we need to expand allowed hosts.

### P3-B: `/api/user/profile` GET/PUT — auth via `currentUser()` not `auth()`
- File: `src/app/api/user/profile/route.ts:33-34, 68-69`
- Uses `currentUser()` then `if (!user) return 401`. This works (Clerk returns null when unauthenticated) but every other user/* route uses `await auth()` first as the fast path. Consistency nit, not a vulnerability.

### P3-C: Moderate-severity npm advisories
- `brace-expansion 5.0.2–5.0.5` (GHSA-jxxr-4gwj-5jf2, ReDoS, transitive via glob/eslint)
- `@cypress/request`, `cypress`, `@sentry/*`, `js-cookie`, `uuid` — all dev-only or already fixable
- All have `fixAvailable: true` and are non-breaking. Bundle into the next `npm update` pass; nothing user-facing.

### P3-D: Open-redirect / SSRF surface
- Only two outbound `fetch(userInput)` paths: `/api/sprite` (strict allowlist: `play.pokemonshowdown.com` + `/sprites/`) and `/api/pokepaste` (strict allowlist: `pokepast.es`). Both already correct.
- No `redirect()` calls take user input — searched.
- No `dangerouslySetInnerHTML` with user content — the three occurrences are JSON-LD (already sanitised), the theme bootstrap inline script (literal string), and a removed historical use in changelog.

---

## Webhook / Cron Signature Coverage Matrix

| Route | Auth method | Timing-safe | Fails closed |
|-------|-------------|-------------|--------------|
| `webhooks/linear` | HMAC-SHA256 of raw body | yes (`timingSafeEqual`) | yes |
| `webhooks/clerk` | `verifyWebhook` (Svix) | yes (library) | yes |
| `webhooks/posthog` | shared secret in header | yes | yes |
| `discord` (interactions) | Ed25519 (tweetnacl) | yes (library) | yes |
| `cron/daily-ops` | Bearer + `isCronAuthorized` | yes | yes |
| `cron/weekly-report` | same | yes | yes |
| `cron/weekly-digest` | same | yes | yes |
| `cron/posthog-errors` | same | yes | yes |
| `keep-alive` | same | yes | yes |
| `bot` | Bearer + inline timing-safe (P2-B nit) | partial | yes |
| `migrate` | Bearer in body, plain `!==` (P1-B) | **no** | yes |
| `cleanup` GET | `isCronAuthorized` | yes | yes |
| `cleanup` DELETE | Bearer + plain `!==` (P1-C) | **no** | yes |
| `setup` | Bearer + plain `!==` (P2-A) | **no** | yes |

---

## Recommended Tonight (small, contained, low risk)

1. **P1-B + P1-C + P2-A + P2-B together** — factor a `verifyBearer(request, secretEnvVar)` helper into `@/lib/cron-auth.ts` (mirrors the existing `isCronAuthorized` but accepts the env var name), and call it from `/api/migrate`, `/api/cleanup` DELETE, `/api/setup`, and `/api/bot`. ~30 lines net, no behavioural change for valid callers, closes 4 medium-grade timing-oracle warts in one commit.
2. **P2-D** — convert `daily-ops` + `weekly-report` GraphQL `teamId` interpolation to bound variables. ~5 lines per file. Same risk profile as #1.
3. **P1-A clerk bump** — DO NOT do tonight. Open a Linear ticket to schedule the major bump with smoke testing.

## Out of Scope / Already Patched This Run

- `webhooks/linear/route.ts` was patched this run — not reflagged.

