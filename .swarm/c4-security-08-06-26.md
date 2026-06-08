# C4 Security Audit — 2026-06-08

**Scope:** npm vulnerabilities, hardcoded secrets, OWASP top-10 in `src/app/api/**/route.ts`, CORS, security headers.
**Mode:** Read-only. No code modified.

---

## P0 — Hardcoded Secrets

**None found.** Greps for `lin_api_`, `sk_live_`, `whsec_`, populated Discord webhook URLs, `AKIA[0-9A-Z]{16}`, JWT triplets, and 30+-char Bearer values returned only placeholders in `.env.example` and prior audit notes in `.swarm/`. `.gitignore` correctly excludes `.env*` (whitelist on `.env.example` only). The discord public key in `src/app/api/discord/route.ts:6` is a public verification key, not a secret — safe to be in source.

---

## Summary Counts

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 3 |
| Medium | 6 |
| Low | 4 |
| **Total** | **13** |

---

## Critical

*(none)*

---

## High

### H1 — `js-cookie ≤3.0.5` prototype hijack via `@clerk/shared`
- **Location:** `node_modules/js-cookie` (transitive via `@clerk/shared`); manifested in any client that ships Clerk
- **Vector:** GHSA-qjx8-664m-686j — per-instance prototype hijack in `assign()` enables cookie-attribute injection (CVSS 7.5)
- **Exploitability:** Moderate — requires an attacker-controlled cookie-name input flowing into `js-cookie.set()`. App code does not directly call js-cookie, but Clerk-managed cookies are session-critical.
- **Suggested fix:** `npm audit fix` resolves this — `@clerk/shared` has a fixed range available. **Patchable tonight (minor bump).**

### H2 — `tmp <0.2.6` path traversal (Cypress dev dep)
- **Location:** `node_modules/tmp` (transitive via `cypress` → `@cypress/request`)
- **Vector:** GHSA-ph9p-34f9-6g65 — unsanitized prefix/postfix allows directory escape
- **Exploitability:** Low in production (devDependency only — never deployed to Vercel). Risk is dev-machine impact when running tests against an untrusted fixture.
- **Suggested fix:** `npm audit fix` → upgrades cypress within the available semver range. **Patchable tonight.**

### H3 — `uuid <11.1.1` buffer-bounds OOB write
- **Location:** `node_modules/uuid` (transitive via `@cypress/request` and `@sentry/webpack-plugin`)
- **Vector:** GHSA-w5hq-g745-h8pq — missing buffer bounds check in `v3/v5/v6` when `buf` is provided (CVSS 7.5)
- **Exploitability:** Low — our code does not call `uuid` with a custom buffer; transitive use is internal to these tools. Both consumers are build/test-time.
- **Suggested fix:** `npm audit fix` resolves automatically. **Patchable tonight.**

---

## Medium

### M1 — `next 9.3.4-canary.0 – 16.3.0-canary.5` via `postcss <8.5.10` XSS
- **Location:** `node_modules/next` → `node_modules/next/node_modules/postcss`
- **Vector:** GHSA-qx2v-qp2m-jg93 — unescaped `</style>` in CSS stringify output (CVSS 6.1)
- **Exploitability:** Low — postcss is build-time; user-controlled CSS would have to flow into the Next.js compile path. We're on Tailwind v4 with no dynamic CSS-from-user-input pipeline.
- **Suggested fix:** `fixAvailable: false` per `npm audit`. Awaiting upstream Next.js patch — **do NOT major-bump tonight**.

### M2 — `@clerk/nextjs` & `@sentry/nextjs` peer on vulnerable `next`
- **Location:** Direct deps `@clerk/nextjs`, `@sentry/nextjs`
- **Vector:** Inherited from M1 above
- **Suggested fix:** Resolves when Next.js patch lands. The `@sentry/nextjs` "fix" listed is a major downgrade to 6.3.5 — **decline that**, it's a regression dressed as a fix.

### M3 — `brace-expansion 5.0.2-5.0.5` DoS via large numeric range
- **Location:** `node_modules/@fastify/otel/node_modules/brace-expansion`, etc.
- **Vector:** GHSA-jxxr-4gwj-5jf2 — `max` DoS protection bypass (CVSS 6.5)
- **Exploitability:** Low — used in dev tooling glob expansion, not user input paths
- **Suggested fix:** `npm audit fix` (minor bump available). **Patchable tonight.**

### M4 — `qs 6.11.1-6.15.1` DoS via null/undefined entries
- **Location:** `node_modules/qs` (via `@cypress/request`)
- **Vector:** GHSA-q8mj-m7cp-5q26 (CVSS 5.3) — devDep only
- **Suggested fix:** `npm audit fix`. **Patchable tonight.**

### M5 — Discord interactions endpoint missing rate limit
- **Location:** `src/app/api/discord/route.ts:35` (POST handler)
- **Vector:** No `apiGuard()` call. Ed25519 signature is enforced (good), but an attacker holding the Discord app's private key (or replaying valid commands) could trigger unlimited Linear GraphQL mutations (`approve`/`reject` flows mutate state).
- **Exploitability:** Low (requires Discord app key compromise), but defence-in-depth missing.
- **Suggested fix:** Add `apiGuard(request, { rateLimit: { key: "discord-bot", max: 60 } })` after signature verification. **One-line addition.**

### M6 — `share/[id]/collaborators` PATCH (revoke) missing rate limit
- **Location:** `src/app/api/share/[id]/collaborators/route.ts:155`
- **Vector:** PATCH regenerates the edit token; no `apiGuard` rate-limit is applied (POST and DELETE both have one). An owner could be coerced/scripted into hammering the endpoint, though the owner-only guard limits damage to their own report.
- **Exploitability:** Very low
- **Suggested fix:** Add the same `apiGuard` line used in POST. **One-line addition.**

---

## Low

### L1 — `setInterval` at module scope in `sync/[id]/route.ts`
- **Location:** `src/app/api/sync/[id]/route.ts:35-41`
- **Vector:** `setInterval` registered at module load keeps lambda warm, defeating scale-to-zero and costing build/exec minutes. Not strictly a security issue but a resource concern flagged here for visibility.
- **Suggested fix:** Move into the SSE stream's start callback. **Deferred — not security-critical.**

### L2 — `team-graphic` route accepts unvalidated `id` query
- **Location:** `src/app/api/team-graphic/route.tsx:88`
- **Vector:** No regex on `shareId` before SQL `WHERE id = ${shareId}`. Driver parameterises (no SQLi), but pathologically long values waste DB round-trips. Also leaks existence of private shares via 404-vs-200 timing.
- **Suggested fix:** Add the same `IdSchema = /^[A-Za-z0-9]{8}$/` z-validation used by `share/[id]`. **One-line addition.**

### L3 — `spotlight` route hardcodes share ID
- **Location:** `src/app/api/spotlight/route.ts:7` (`SPOTLIGHT_ID = "TRjVuD8B"`)
- **Vector:** Not a vulnerability, but rotating the spotlight requires a code push (and a build minute). Move to env var for ops hygiene.
- **Suggested fix:** Env var `SPOTLIGHT_SHARE_ID`. **Deferred.**

### L4 — Sprite proxy returns `Access-Control-Allow-Origin: *`
- **Location:** `src/app/api/sprite/route.ts:72`
- **Vector:** This is **intentional** (sprite must be cross-origin-loadable by html2canvas) and the response carries no credentials, no cookies, no auth state — sprites only. **No fix needed**; flagged for completeness so reviewers don't second-guess it.

---

## Configuration Review

### CORS (`src/lib/security/cors.ts`)
- Allowlist correct: `pokemonvgcteamreport.com`, `www.*`, `vgc-team-report.vercel.app`, preview deploys via regex
- `Access-Control-Allow-Credentials: true` is **only** sent for allowed origins — empty string for others. Safe.
- **No `*` on any credentialed endpoint.** Only the sprite proxy uses `*`, and it carries no credentials.

### Security Headers (`next.config.ts`)
All present and well-configured:
- HSTS: `max-age=63072000; includeSubDomains; preload` ✓
- X-Frame-Options: `DENY` ✓
- X-Content-Type-Options: `nosniff` ✓
- Referrer-Policy: `strict-origin-when-cross-origin` ✓
- Permissions-Policy: locked down ✓
- CSP: strict default-src 'self', explicit allowlists per directive, `frame-ancestors 'none'`, `upgrade-insecure-requests` ✓
  - Note: `'unsafe-inline'` is in `script-src` (necessary for Next.js inline hydration scripts) — acceptable tradeoff documented widely; no immediate fix.
- COOP: `unsafe-none` (justified inline — Clerk OAuth popups require it)
- CORP: `cross-origin` (justified inline — Showdown sprites)

**Verdict:** Security headers are in a strong state. No P0/P1 changes needed.

---

## OWASP Top-10 Survey of `src/app/api/**/route.ts`

| Risk | Status |
|---|---|
| SQLi (template-literal interpolation into raw DB queries) | **Clean.** All routes use Neon's `sql\`\`` tagged template, which parameterises every interpolation. No raw `query(string)` concatenation found. The `explore` route composes via tagged-template fragments (`sql\`\`` returned from helpers) — still parameterised. |
| Path traversal | **Clean.** No `fs.readFile/createReadStream` over user-controlled paths. The `creator/[name]` route uses `decodeURIComponent` but feeds only into parameterised SQL with `ILIKE` — no filesystem access. |
| SSRF | **Clean.** `pokepaste` (PokePasteUrlSchema enforces `hostname === "pokepast.es"`), `sprite` (host + path allowlist), `oembed` (regex-extracts shareId only, no fetch). PostHog/Linear/Discord fetches use env-var-supplied hosts. |
| Missing auth on mutating routes | **Clean.** Every mutating route checks `await auth()` and returns 401 if missing, with the exception of unauthenticated public flows (`/api/views` view-count POST, `/api/reactions/[shareId]` with session-id, `/api/comments/[shareId]` rate-limited + word-filtered + escapeHtml'd). Webhook routes verify HMAC/Ed25519 signatures. Admin routes (`/api/migrate`, `/api/cleanup` DELETE, `/api/setup`, `/api/bot`) require `verifyBearer` with timing-safe compare. |
| IDOR | **Clean.** All routes using user IDs from auth context, never from query string. `share/[id]/route.ts` correctly differentiates owner / collaborator / public access. `saved` POST verifies share is public-or-owned before allowing save. |
| Reflected/Stored XSS | **Clean.** User content stored as JSONB and rendered through React (auto-escaped). Email HTML uses `escapeHtml` on every interpolated user field. `JsonLd` component escapes `</script>`. Profile bio runs through `escapeHtml` on insert. No `dangerouslySetInnerHTML` is fed user content. |
| Missing rate limit on mutations | **Mostly clean.** Found two gaps — M5 (`discord` POST) and M6 (`collaborators` PATCH). All other mutating routes call `apiGuard` with sensible per-key limits backed by Upstash. |
| Rate-limit bypass | **Clean.** `isRateLimitedAsync` falls back to in-memory only when Upstash env vars absent — production is configured. Sliding-window via `@upstash/ratelimit`. |
| Session/auth weakness | **Clean.** Clerk for user auth, env-var bearer for admin/cron via `verifyBearer` (timing-safe). Edit-token is 64-char hex (256 bits of entropy). Share IDs validated with regex. |
| Body-size DoS | **Mostly clean.** `share` POST and `user/drafts` enforce `maxBodySize: 512_000`. Other JSON endpoints rely on zod max constraints. Consider adding `maxBodySize` globally for defence-in-depth — deferred. |

---

## Recommended Action Plan (Tonight, Patch-Only)

1. **Run `npm audit fix`** — resolves H1 (js-cookie), H2 (tmp), H3 (uuid), M3 (brace-expansion), M4 (qs). All five are minor/patch bumps with `fixAvailable: true`. No major bumps.
2. **Add `apiGuard` rate limiter to `src/app/api/discord/route.ts` POST** (M5) — one-line defence-in-depth.
3. **Add `apiGuard` rate limiter to `src/app/api/share/[id]/collaborators/route.ts` PATCH** (M6) — one-line consistency fix.

**Do not** touch:
- `next` / postcss XSS (M1/M2) — `fixAvailable: false`, awaiting upstream Next.js patch. The proposed `@sentry/nextjs` "fix" is a major downgrade.
- Any file in the avoid-list.

---
