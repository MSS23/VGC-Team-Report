# Security Audit — VGC Team Report
**Date:** 2026-05-09  
**Auditor:** Claude Code (Security Engineer role)  
**Scope:** Full codebase at `/home/user/VGC-Team-Report`

---

## Summary

12 npm vulnerabilities (3 Critical, 6 High, 3 Moderate). Two Critical CVEs directly affect auth (Clerk middleware bypass). Several medium-risk issues in API design and CSP configuration. No plaintext secrets found in source. SQL injection risk is low (parameterized queries used throughout). Overall security posture is reasonable but the Clerk vulnerabilities require immediate patching.

---

## Findings

### CRITICAL-1: Clerk Auth Middleware Bypass (GHSA-vqx2-fgx2-5wq9)
**Severity:** Critical  
**Package:** `@clerk/nextjs`, `@clerk/shared`  
**File:** `src/middleware.ts`, all `/api/user/*` routes

The installed version of `@clerk/nextjs` has a confirmed vulnerability where middleware-based route protection can be bypassed. Since the application relies on Clerk middleware (`clerkMiddleware`) in `src/middleware.ts` as the primary auth gate for all `/api/user/*` routes (delete account, export data, drafts, analytics, feed, saved, etc.), an attacker who can exploit this bypass could access any authenticated user's private data or delete accounts without credentials.

**CVE:** GHSA-vqx2-fgx2-5wq9 — "Official Clerk JavaScript SDKs: Middleware-based route protection bypass"  
**Recommendation:** Run `npm update @clerk/nextjs @clerk/backend @clerk/react @clerk/shared` immediately and verify the patched version resolves these CVEs.

---

### CRITICAL-2: Clerk Authorization Bypass for Combined Permission Checks (GHSA-w24r-5266-9c3c)
**Severity:** Critical  
**Package:** `@clerk/nextjs`, `@clerk/backend`, `@clerk/react`, `@clerk/shared`

A second Clerk CVE (GHSA-w24r-5266-9c3c) allows authorization bypass when combining organization, billing, or reverification checks. All four Clerk packages are affected. This is particularly relevant if any route combines Clerk auth with role/org checks.

**Recommendation:** Same fix as CRITICAL-1 — update all `@clerk/*` packages.

---

### CRITICAL-3: Arbitrary Code Execution in protobufjs (GHSA-xq3m-2v4x-88gg)
**Severity:** Critical  
**Package:** `protobufjs` (transitive dependency)

protobufjs has a known arbitrary code execution vulnerability via prototype pollution. This is a transitive dependency (likely pulled in by a monitoring or gRPC library). While exploitation requires attacker-controlled protobuf input, the severity is Critical.

**Recommendation:** Identify which direct dependency pulls in protobufjs (`npm ls protobufjs`) and update it.

---

### HIGH-1: Axios — Multiple CVEs including SSRF, Prototype Pollution, Header Injection
**Severity:** High  
**Package:** `axios` (direct dependency)  
**Files:** Any route using axios for outbound HTTP

The installed axios version has 14+ CVEs including:
- SSRF via NO_PROXY bypass (GHSA-3p68-rc4w-qgx5, GHSA-m7pr-hjqh-92cm)
- Prototype pollution gadgets enabling credential injection and request hijacking (GHSA-q8qp-cvcw-x6jj, GHSA-pf86-5x62-jrwf)
- CRLF injection in multipart/form-data (GHSA-445q-vr5w-6q77)
- Authentication bypass via prototype pollution (GHSA-w9j2-pvgh-6h63)
- Header injection via prototype pollution (GHSA-6chq-wfr3-2hj9)

**Recommendation:** `npm update axios` to latest patched version.

---

### HIGH-2: Next.js Denial of Service with Server Components (GHSA-q4gf-8mx6-v5v3)
**Severity:** High  
**Package:** `next` (direct dependency)

The installed Next.js version is vulnerable to DoS via specially crafted Server Component requests. On a Vercel Pro plan with build minute budgets, a sustained DoS attack could also exhaust serverless function invocations.

**Recommendation:** `npm update next` to the patched version.

---

### HIGH-3: Secret Exposed in URL Query Parameter — `/api/bot`
**Severity:** High  
**File:** `src/app/api/bot/route.ts`, line 35

```ts
const secret = request.nextUrl.searchParams.get("secret");
```

The bot endpoint authenticates callers by reading `CRON_SECRET` from the URL query string (`?secret=...`). Query parameters are logged in:
- Vercel access logs
- CDN/reverse proxy logs
- Browser history if ever triggered from a browser
- Any monitoring or observability tool that captures full URLs

This means the `CRON_SECRET` is effectively logged in plaintext.

**Recommendation:** Move the secret to the `Authorization: Bearer <secret>` header, consistent with how other cron routes (e.g., `/api/cron/daily-ops`) handle it via `isCronAuthorized()`.

---

### HIGH-4: Linear Webhook — No Signature Verification
**Severity:** High  
**File:** `src/app/api/webhooks/linear/route.ts`

The Linear webhook endpoint has no HMAC signature verification. Any actor who discovers the endpoint URL can send arbitrary webhook payloads, including spoofed `url_verification` challenges. Linear supports webhook signing via an `X-Linear-Signature` header using HMAC-SHA256.

```ts
// Current code — no signature check at all
export async function POST(request: Request) {
  const body = await request.json();
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }
  return NextResponse.json({ ok: true });
}
```

Although the current handler only does URL verification (no business logic), this is a security gap if the handler is ever extended.

**Recommendation:** Add HMAC-SHA256 verification using `LINEAR_WEBHOOK_SECRET` env var before processing any payload.

---

### HIGH-5: vite — Path Traversal and File Read CVEs (dev dependency)
**Severity:** High (dev-only risk)  
**Package:** `vite` (dev dependency)

Multiple vite CVEs: path traversal in optimized deps `.map` handling (GHSA-4w7w-66w2-5vf9), `server.fs.deny` bypass (GHSA-v2wj-q39q-566r), arbitrary file read via dev server WebSocket (GHSA-p9ff-h696-f583). These only apply to the local development server; production Vercel deployments are not affected.

**Recommendation:** `npm update vite` — low urgency for production, but high urgency for developer machines.

---

### MEDIUM-1: CSP Contains `unsafe-inline` and `unsafe-eval` in `script-src`
**Severity:** Medium  
**File:** `next.config.ts`, line 81

```
"script-src 'self' 'unsafe-inline' 'unsafe-eval' ..."
```

Both `'unsafe-inline'` and `'unsafe-eval'` are present in `script-src`, which significantly weakens the XSS protection provided by CSP. While `dangerouslySetInnerHTML` is used for the dark-mode init script in `layout.tsx` (which renders only static, hardcoded values from a predefined map), the presence of `'unsafe-eval'` allows any injected script to call `eval()`.

**Recommendation:** Replace `'unsafe-inline'` with a nonce-based or hash-based approach for the dark-mode init script. Remove `'unsafe-eval'` if not strictly required by Clerk/Sentry SDKs.

---

### MEDIUM-2: `Cross-Origin-Opener-Policy` Set to `unsafe-none`
**Severity:** Medium  
**File:** `next.config.ts`, line 61

```ts
key: "Cross-Origin-Opener-Policy",
value: "unsafe-none",  // Required for Clerk OAuth popups
```

`COOP: unsafe-none` disables cross-origin isolation, which enables Spectre-style side-channel attacks from other tabs and prevents use of `SharedArrayBuffer`. The comment correctly notes this is required for Clerk OAuth popups. However, this is a known trade-off worth documenting.

**Recommendation:** Track Clerk's roadmap for COOP-compatible OAuth flows. No immediate action needed, but document the risk.

---

### MEDIUM-3: `dangerouslySetInnerHTML` in JsonLd Component — Potential XSS if Input is User-Controlled
**Severity:** Medium  
**File:** `src/components/seo/JsonLd.tsx`

```tsx
dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
```

`JSON.stringify` does NOT escape HTML special characters by default. If any user-controlled string (e.g., `creatorName`, `tournamentName`, `teamSummary`) reaches this component and contains `</script>`, it can break out of the JSON-LD script block and execute arbitrary HTML/JS.

Example: a `creatorName` of `"</script><script>alert(1)</script>"` would produce:
```html
<script type="application/ld+json">{"creatorName":"</script><script>alert(1)</script>"}</script>
```

**Recommendation:** Use a JSON serializer that escapes `<`, `>`, and `&`:
```ts
const safe = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
```

---

### MEDIUM-4: fast-uri Path Traversal (GHSA-q3j6-qgpj-74h6)
**Severity:** Medium  
**Package:** `fast-uri` (likely transitive via Sentry or a validation library)

Vulnerable to path traversal via percent-encoded dot segments and host confusion via percent-encoded authority delimiters. Impact depends on whether this library is used to parse attacker-controlled URLs.

**Recommendation:** `npm update` to pull in a fixed transitive version.

---

### MEDIUM-5: dompurify — Moderate Vulnerability
**Severity:** Moderate  
**Package:** `dompurify` (direct dependency)

A moderate severity vulnerability exists in the installed dompurify version. DOMPurify is the primary XSS sanitizer — any weakness here directly increases XSS risk for any content it sanitizes.

**Recommendation:** `npm update dompurify` immediately, given its critical security role.

---

### LOW-1: Discord Public Key Hardcoded in Source
**Severity:** Low  
**File:** `src/app/api/discord/route.ts`, line 6

```ts
const DISCORD_PUBLIC_KEY = "44b2cb02932ad5b5eae681352246314ffb23ecd299c2490d7875d5883e5596ae";
```

The Discord application's Ed25519 public key is hardcoded directly in source. This is a public key (not a secret), so there's no direct security risk — it cannot be used to forge signatures. However, if the Discord app is ever re-created or the key rotated, this requires a code change and redeployment rather than an env var update.

**Recommendation:** Move to `process.env.DISCORD_PUBLIC_KEY` for operational flexibility. Low priority.

---

### LOW-2: follow-redirects — Moderate Vulnerability
**Severity:** Low (Moderate in npm)  
**Package:** `follow-redirects` (transitive)

Moderate vulnerability in follow-redirects. This library handles HTTP redirects for axios/node-fetch. The specific CVE details weren't fully resolved but this is patched in newer versions.

**Recommendation:** Updating axios (HIGH-1) should transitively fix this.

---

### LOW-3: postcss — Moderate Vulnerability
**Severity:** Low  
**Package:** `postcss` (dev dependency, build-time only)

Moderate vulnerability in postcss. This only affects the build pipeline, not the production runtime.

**Recommendation:** `npm update postcss` — low urgency.

---

## What Was Found to Be Good

- **Parameterized SQL queries throughout**: All DB queries use tagged template literals with the `postgres` library, which parameterizes inputs automatically. No SQL injection risk found.
- **Zod validation on most POST routes**: 19 of 48 API routes use Zod schema validation. All high-risk mutation routes were checked.
- **Rate limiting via `apiGuard`**: The `apiGuard` wrapper applies per-IP rate limiting (via Upstash) consistently across most public-facing endpoints.
- **CSRF double-submit cookie**: Middleware validates CSRF tokens for cross-origin state-changing requests.
- **CORS enforcement**: Unknown origins are blocked at the middleware level.
- **HSTS with preload**: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` correctly configured.
- **X-Frame-Options DENY + frame-ancestors none**: Double protection against clickjacking.
- **No hardcoded secrets in source**: All secrets (API keys, DB credentials) are properly read from `process.env`.
- **Discord webhook uses Ed25519 signature verification**: The Discord route correctly verifies cryptographic signatures using `tweetnacl`.
- **Bot detection and suspicious request filtering** in middleware.
- **Canonical redirect** prevents staging URL leakage.

---

## Prioritized Action List

| Priority | Finding | Action |
|----------|---------|--------|
| P0 | CRITICAL-1, CRITICAL-2 | `npm update @clerk/nextjs @clerk/backend @clerk/react @clerk/shared` |
| P0 | MEDIUM-3 | Fix JsonLd XSS — escape `<>& ` in JSON.stringify output |
| P1 | HIGH-3 | Move `/api/bot` secret from query param to Authorization header |
| P1 | HIGH-1 | `npm update axios` |
| P1 | MEDIUM-5 | `npm update dompurify` |
| P2 | HIGH-4 | Add HMAC-SHA256 verification to Linear webhook |
| P2 | CRITICAL-3 | Identify and update protobufjs parent dependency |
| P2 | HIGH-2 | `npm update next` |
| P3 | MEDIUM-1 | Replace `unsafe-inline`/`unsafe-eval` in CSP with nonces/hashes |
| P4 | HIGH-5, LOW-2, LOW-3 | `npm update vite postcss` (dev/transitive) |
| P4 | LOW-1 | Move Discord public key to env var |
