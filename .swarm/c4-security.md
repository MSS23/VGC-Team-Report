# C4 Security Audit — 2026-06-05

## npm audit

**Critical: 0 | High: 3 | Moderate: 10 | Low: 0**

Top 3 High:
1. `js-cookie <=3.0.5` — prototype hijack in `assign()`, cookie-attribute injection (GHSA-qjx8-664m-686j, CVSS 7.5). Transitive via `@clerk/shared`. `fixAvailable: true`.
2. `@clerk/shared` — high via js-cookie. Fix: bump `@clerk/nextjs`.
3. `tmp` — high (transitive). Fix available.

Moderate noteworthy: `postcss <8.5.10` XSS (via next), `brace-expansion` DoS, `@sentry/nextjs`, cypress chain. Next.js fix requires `@sentry/nextjs` semver-major upgrade.

## Hardcoded Secrets

**None found.** Scanned for `sk_live_`, `lin_api_`, `LINEAR_API_KEY=` literals, `DISCORD_WEBHOOK`, `DATABASE_URL=`, `SIGNING_SECRET = "..."`, `password/secret = "..."`.

- Only hit: `.env.example:15 LINEAR_API_KEY=lin_api_xxxx...` — placeholder, safe.
- Webhook signing secrets all properly read from `process.env.*_SIGNING_SECRET` (clerk:28, linear:33).
- `DISCORD_PUBLIC_KEY` hardcoded in `src/app/api/discord/route.ts:6` — Discord's app *public* key, intentionally public; not a finding.

**No P0 hardcoded secret.**

## OWASP — Top 5 Findings

1. **A01 Broken Access Control — `src/app/api/comments/flag/route.ts:24`** (Medium). `sessionId` taken from request body, not server-bound. A single attacker can submit 3 flags with different `sessionId`s and auto-delete any comment (FLAG_THRESHOLD=3 at line 7, auto-delete at line 44). **Fix:** key flags on Clerk `userId` (or hashed IP) server-side, not client-supplied sessionId.

2. **A03 Injection / Stored XSS — `src/app/api/user/profile/route.ts:79-95`** (Medium). `twitter`, `discord`, `youtube`, `avatarUrl` written to DB without HTML escape or URL scheme allowlist beyond `https://` prefix on avatar. If rendered as `href` elsewhere, `javascript:` payloads in social handles could fire. Only `bio` is escapeHtml'd. **Fix:** validate handles with strict regex; reject any non-http(s) avatar URL and hostname-allowlist it.

3. **A05 Misconfiguration — `src/app/api/webhooks/linear/route.ts:68-71`** (Low). `catch` swallows all errors and returns 200, hiding signature/parse failures from monitoring. **Fix:** log with `console.error`, still return 200.

4. **A09 Logging/Error Exposure — `src/app/api/feedback/route.ts:93`** (Low). Returns full Zod `error.flatten().fieldErrors` to client, revealing schema internals. **Fix:** return generic `"Invalid submission"`, log details server-side.

5. **A10 SSRF (mitigated, verify) — `src/app/api/pokepaste/route.ts:13-21`** (Info). Hostname allowlist only checks `=== "pokepast.es"`; no subdomain attack vector. OK; no fix needed, noted for completeness.

## Cross-reference with main-changed-files.md

Recently changed routes (`bot`, `cleanup`, `migrate`, `setup`, `share/[id]/collaborators`, `share`, `views`, all 3 webhooks) reviewed — none introduce new findings beyond above. `verify-bearer.ts` and `bot-detection.ts` look correct. `apiGuard` wraps most POST routes with rate-limit + body-size guards.

## RECOMMENDED IMPLEMENTATION TICKET (< 4h, highest impact)

**Title:** `VGC-SEC1: Server-bind comment flag throttling + validate profile social URLs`
**Why:** Two real authz/XSS issues, both small. Eliminates the only practical comment-takedown abuse vector and shuts off `javascript:`-URL XSS via profile handles.
**Scope:**
- `api/comments/flag/route.ts`: replace body `sessionId` with `auth().userId` (require login) or hashed IP. Add unique constraint `(comment_id, voter_id)`.
- `api/user/profile/route.ts`: regex-validate twitter/discord/youtube to handle chars only (`/^[A-Za-z0-9_.-]{1,50}$/`); reject avatarUrl unless scheme is `https:` *and* hostname matches allowlist (`img.clerk.com`, `cdn.discordapp.com`, `pbs.twimg.com`).
- Tests + build gate.
