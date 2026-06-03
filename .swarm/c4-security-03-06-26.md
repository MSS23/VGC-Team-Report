# C4 Security Audit — 03-06-26

Run: swarm-nightly-2026-06-03
Method: ripgrep + `npm audit --json` + targeted handler reads
Mode: read-only (no code edits)

## Headlines
- **Hardcoded secrets:** 0 found (no `lin_api_`, `whsec_`, `sk_`, etc. in source — all via `process.env`)
- **SQL injection:** 0 found (all queries use parameterised neon `sql` template literals)
- **CSRF:** Adequate (Clerk `auth()` on state-changing routes, CSRF middleware in `src/middleware.ts`)
- **npm audit:** 0 critical, 3 high (transitive), 10 moderate

## Rate limiting — routes WITHOUT `apiGuard` (all guarded by other auth)

| Route | Method | Guard | Risk |
| --- | --- | --- | --- |
| `/api/bot/route.ts` | GET | CRON_SECRET bearer | low |
| `/api/cleanup/route.ts` | GET/DELETE | bearer | low |
| `/api/migrate/route.ts` | POST | bearer | low |
| `/api/setup/route.ts` | GET | bearer | low |
| `/api/keep-alive/route.ts` | GET | cron | low |
| `/api/webhooks/clerk/route.ts` | POST | HMAC | low |
| `/api/webhooks/linear/route.ts` | POST | HMAC (timing-safe) | low |
| `/api/webhooks/posthog/route.ts` | POST | HMAC (timing-safe) | low |
| `/api/cron/*` | GET | bearer | low |
| `/api/discord/route.ts` | POST | Ed25519 (nacl) | low |
| `/api/sprite/route.ts` | GET | host allowlist + 3s timeout, NO IP rate limit | **medium** — proxy can be abused |

## npm audit — high severity (all transitive, all need package upgrades not code)

1. **tmp < 0.2.6** (CVSS 7.5, path traversal) — pulled by cypress (devDep). Upgrade `tmp` or `cypress`.
2. **js-cookie ≤ 3.0.5** (CVSS 7.5, cookie-attribute injection) — pulled via `@clerk/shared`. Wait for Clerk patch or `npm overrides`.
3. **@clerk/shared** — transitive via js-cookie above.

## Actionable findings (top 3)

1. **HIGH** — `package.json`: Add `npm overrides` to pin `js-cookie >= 3.0.6` until Clerk publishes a clean release.
2. **MEDIUM** — `src/app/api/sprite/route.ts:72`: Add IP-based rate limit. Currently only host allowlist + 3s timeout protects against abuse.
3. **MEDIUM** — `/api/webhooks/clerk` and `/api/webhooks/linear`: No request deduplication on retries. PostHog handler already dedupes by fingerprint; consider matching pattern.

## What was confirmed already in place

- ✅ Timing-safe HMAC compare in Linear webhook (PR #49)
- ✅ apiGuard rate-limit on `/api/share/[id]/collaborators` GET (PR #52)
- ✅ console.error in webhook catch blocks (PR #52)
- ✅ Email XSS + GraphQL injection fixes (PR #49)
- ✅ Zod validation on user input before SQL queries

## No new P0 / P1 code-level findings this run

All actionable items above are either package upgrades or refinements. Nothing requires emergency action.
