# Security Audit — VGC Team Report
**Date:** 2026-05-07
**Auditor:** Claude Code (security-engineer role)
**Scope:** API routes, dependency vulnerabilities, secrets, rate limiting, OWASP patterns

---

## 1. Dependency Vulnerabilities (npm audit)

**Total:** 11 vulnerabilities — 3 critical, 5 high, 3 moderate. All have fixes available.

### Critical
| Package | Issue | Fix |
|---------|-------|-----|
| `@clerk/nextjs` | **Middleware-based route protection bypass** — attacker can bypass Clerk auth middleware protecting routes | `npm update @clerk/nextjs` |
| `@clerk/nextjs` | Authorization bypass when combining org/billing/reverification checks | Same |
| `@clerk/shared` | Same two issues (transitive) | `npm update @clerk/shared` |
| `protobufjs` | Arbitrary code execution via prototype pollution | `npm update protobufjs` |

### High
| Package | Issues |
|---------|--------|
| `@clerk/backend`, `@clerk/react` | Authorization bypass (transitive) |
| `axios` | 14 CVEs: SSRF via NO_PROXY bypass, CRLF injection, prototype pollution, auth bypass, header injection, credential injection, null byte injection, DoS via deeply nested data, response tampering, maxBodyLength bypass |
| `next` | Denial of Service via Server Components |
| `vite` | Path traversal, `server.fs.deny` bypass, arbitrary file read via WebSocket |

### Moderate
| Package | Issues |
|---------|--------|
| `dompurify` | Multiple XSS bypass patterns via FORBID_TAGS, ADD_TAGS, prototype pollution |
| `follow-redirects` | Auth header leakage to cross-domain redirect targets |
| `postcss` | XSS via unescaped `</style>` in stringify output |

**Action Required:** Run `npm update` to pull in all patched versions. The Clerk critical bypasses are the most immediately dangerous — a production app relying on Clerk middleware for route protection may be bypassable right now.

---

## 2. XSS / Injection Patterns

### dangerouslySetInnerHTML (2 findings)

**File:** `src/components/seo/JsonLd.tsx:5`
```tsx
dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
```
**Risk:** LOW. `JSON.stringify()` produces valid JSON, not arbitrary HTML. The `<script type="application/ld+json">` context means HTML tags in the JSON are not parsed. Not directly exploitable, but any future change to `data` rendering that skips `JSON.stringify` would be critical.

**File:** `src/app/layout.tsx:97`
```tsx
dangerouslySetInnerHTML={{ __html: `(function(){...})()` }}
```
**Risk:** LOW. This is a static string literal — no user-controlled input reaches it. No injection vector.

### eval() — None found in application code
The only match is in `src/lib/security/input-validation.ts` where `eval(` appears in a **blocklist regex**, which is correct.

### innerHTML — None found.

### GraphQL Injection in Discord Route

**File:** `src/app/api/discord/route.ts:268`
```ts
await linearQuery(`mutation { commentCreate(input: { issueId: "${issue.id}", body: "Rejected via Discord: ${reason.replace(/"/g, '\\"')}" }) { comment { id } } }`);
```
**Risk:** MEDIUM. The `reason` field from a Discord slash command option is interpolated directly into a GraphQL mutation string. The sanitization (`replace(/"/g, '\\"')`) only escapes double quotes. A crafted `reason` containing `\n`, backticks, GraphQL fragment syntax, or other metacharacters could potentially manipulate the mutation body. `issue.id` (a database UUID) is safe, but `reason` is attacker-controlled text. Use GraphQL variables instead of string interpolation.

**Also:** `issueId` from Discord options is interpolated into query strings at lines 161, 169, 214, 254 with only `.toUpperCase()` applied. While the parsed integer via `parseInt(issueId.replace(/\D/g, ""))` mitigates injection for the filter queries, the direct `issue(id: "${issueId}")` on line 161 could accept crafted IDs.

### HogQL Injection

**File:** `src/app/api/webhooks/posthog/route.ts:33-34`
```ts
WHERE properties.$session_id = '${sessionId.replace(/'/g, "")}'
  AND timestamp <= '${beforeTimestamp.replace(/'/g, "")}'
```
**Risk:** LOW-MEDIUM. Both values originate from the PostHog webhook payload (which is authenticated via `POSTHOG_WEBHOOK_SECRET`), so the attack surface is narrow. However, stripping single quotes is a naïve escaping approach — a proper parameterized HogQL API call or allowlisting the format is preferable.

---

## 3. Hardcoded Secrets

### Discord Public Key (hardcoded, not a secret)
**File:** `src/app/api/discord/route.ts:6`
```ts
const DISCORD_PUBLIC_KEY = "44b2cb02932ad5b5eae681352246314ffb23ecd299c2490d7875d5883e5596ae";
```
**Risk:** LOW. This is a public key used for Ed25519 signature *verification* — it is intentionally public (Discord publishes it in their developer portal). It does not grant any write access. No remediation required, but moving it to an env var (`DISCORD_APP_PUBLIC_KEY`) would make the app ID replaceable without a code deploy.

### API Keys in Source
No actual secret values (`sk_live_`, `lin_api_`, webhook tokens) are hardcoded. All credential references use `process.env.*`. The `DISCORD_PUBLIC_KEY` is the only literal that could be confused for a secret, but is not.

### .env Gitignore
`.gitignore` correctly excludes `.env*` and `.env*.local`. `.env.example` is committed (correct). No `.env.local` in the repo. **Pass.**

---

## 4. Rate Limiting Coverage

### Routes WITH rate limiting
- `POST /api/share` — `apiGuard` with 20 req/min per IP
- `POST /api/feedback` — `isRateLimitedAsync` with 3 req/min per user ID (auth required)
- All `/api/user/*` routes — `apiGuard` with appropriate limits
- `/api/bot`, `/api/cleanup`, `/api/migrate`, `/api/setup` — protected by secret tokens (effectively rate-limited at secret-possession level)
- `/api/discord` — protected by Ed25519 signature verification (cryptographically enforced)
- `/api/webhooks/posthog` — protected by `POSTHOG_WEBHOOK_SECRET` header check
- `/api/sprite` — no rate limit, but edge-cached and proxying only an allowlisted host/path

### Routes WITHOUT rate limiting (unguarded)

| Route | Risk | Notes |
|-------|------|-------|
| `POST /api/webhooks/linear` | LOW | Only handles `url_verification` + returns `{ ok: true }` for all other events. No state mutation, no external API calls. Minimal attack surface but should verify Linear's webhook signature. |
| `GET /api/cron/posthog-errors` | MEDIUM | Uses `isCronAuthorized` from `@/lib/cron-auth` — this IS authenticated (CRON_SECRET bearer token) but the grep pattern didn't match because the function name differs. Re-verified: **protected**. |
| `GET /api/cron/weekly-report` | MEDIUM | Same as above — uses `isCronAuthorized`. **Protected**. |
| `GET /api/sprite` | LOW | Open proxy, but locked to `play.pokemonshowdown.com/sprites/*` by hostname + path allowlist. No rate limit = potential abuse for CDN cost amplification. |

**Effective unguarded routes (real risk):**
- `POST /api/webhooks/linear` — no signature verification, returns 200 to any POST. Zero-risk functionally today but will become a risk if webhook processing logic is added.
- `GET /api/sprite` — no rate limit on a proxying endpoint. Abuse could drive up Vercel edge bandwidth costs.

---

## 5. Input Validation

### `/api/feedback/route.ts` — GOOD
- Zod schema with strict field lengths (title: 3-200, description: 10-2000)
- Auth required (Clerk `userId`)
- Rate limited (3/min per user)
- `escapeHtml()` called on title and description before DB insert
- Word filter applied
- Parameterized SQL via tagged template literals (safe from SQL injection)

### `/api/share/route.ts` — GOOD
- Zod schema with `.strip()` to drop unknown fields
- 500 KB body size limit enforced
- Auth required (Clerk `userId`)
- Rate limited (20/min per IP via `apiGuard`)
- All DB queries use parameterized tagged templates
- Edit token checked in constant-time... actually checked via strict equality (`===`) — **timing attack possible** on edit token comparison. Should use `crypto.timingSafeEqual`.
- Visibility change gated to owner via `owner_id` check

---

## 6. Additional Findings

### Timing Attack on Edit Token
**File:** `src/app/api/share/route.ts:121`
```ts
WHERE id = ${existingId} AND edit_token = ${editToken} AND deleted_at IS NULL
```
The edit token comparison happens inside PostgreSQL, which does not guarantee constant-time string comparison. An attacker making many requests could potentially time the response to infer token characters. **Risk: LOW** (requires network precision impossible in practice with Vercel's variable latency), but worth noting.

### `migrate/route.ts` — Secret in Request Body
**File:** `src/app/api/migrate/route.ts:22-24`
```ts
const { secret } = await request.json().catch(() => ({ secret: "" }));
if (!secret || secret !== process.env.MIGRATE_SECRET) {
```
The secret is passed in the JSON request body (not an Authorization header). This means it appears in request logs, reverse proxy access logs, and any API monitoring. **Recommendation:** Move to `Authorization: Bearer <secret>` header pattern (consistent with `/api/cleanup` and `/api/setup`).

### Error Details Leak in `/api/setup`
**File:** `src/app/api/setup/route.ts:16`
```ts
return NextResponse.json({ error: "Setup failed", details: String(e) }, { status: 500 });
```
On failure, the raw error string is returned in the response. This may expose internal stack traces, DB connection strings, or file paths to any caller who can pass the auth check. Minimal real-world risk (auth is required), but should be logged server-side only.

---

## 7. OWASP Top 10 Mapping

| Category | Status |
|----------|--------|
| A01 Broken Access Control | PARTIAL — Edit token comparison not constant-time; Linear webhook has no signature check |
| A02 Cryptographic Failures | OK — Tokens generated via `crypto.getRandomValues` |
| A03 Injection | MEDIUM — GraphQL string interpolation in discord route; HogQL naive escaping |
| A04 Insecure Design | OK — Auth enforced at API layer |
| A05 Security Misconfiguration | LOW — Discord public key hardcoded (non-critical); migrate secret in body |
| A06 Vulnerable Components | CRITICAL — 3 critical + 5 high CVEs in direct deps (`@clerk/*`, `axios`, `next`) |
| A07 Auth Failures | CRITICAL — Clerk middleware bypass CVE affects all middleware-protected routes |
| A08 Software Integrity | OK — No evidence of supply chain issues |
| A09 Logging Failures | LOW — Error details leaking in /api/setup response |
| A10 SSRF | OK — Sprite proxy has strict hostname+path allowlist |

---

## Priority Remediation List

| Priority | Action |
|----------|--------|
| P0 — IMMEDIATE | `npm update @clerk/nextjs @clerk/shared @clerk/backend @clerk/react` — active auth bypass CVE |
| P0 — IMMEDIATE | `npm update protobufjs` — arbitrary code execution |
| P1 — HIGH | `npm update axios` — 14 CVEs including SSRF |
| P1 — HIGH | `npm update next` — DoS via Server Components |
| P1 — HIGH | Refactor `discord/route.ts` GraphQL mutations to use variables, not string interpolation |
| P2 — MEDIUM | Add signature verification to `POST /api/webhooks/linear` |
| P2 — MEDIUM | Add rate limiting to `GET /api/sprite` |
| P2 — MEDIUM | Move `MIGRATE_SECRET` from request body to Authorization header |
| P3 — LOW | `npm update dompurify vite postcss follow-redirects` |
| P3 — LOW | Move Discord public key to env var for configurability |
| P3 — LOW | Strip error details from `/api/setup` 500 response |
