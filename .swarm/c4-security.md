# C4 — Security Findings

Audit run: Wave 2, security posture, Next.js 16 / Clerk / Neon / Upstash stack.
Read-only — no files were modified.

## P0 (fix immediately — must land this run)

### P0-1: `/embed/[id]` is rendered with X-Frame-Options: DENY → embeds are broken in production
- **File / line:** `next.config.ts:40-45` (global `X-Frame-Options: DENY`) and `next.config.ts:109-110` (global `frame-ancestors 'none'`). Source page: `src/app/embed/[id]/page.tsx`.
- **Problem:** The `/embed/[id]` route exists specifically to be iframed on third-party sites (Discord/Notion/blog posts — the oEmbed endpoint at `src/app/api/oembed/route.ts:37-38` returns an `<iframe src=".../embed/{id}">` payload). The next.config.ts headers apply `source: "/(.*)"` so every page including `/embed/*` gets `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'`. The two combine to make every embed render as `Blocked by X-Frame-Options policy` in third-party browsers — the feature is non-functional.
- **OWASP:** A05 Security Misconfiguration (clickjacking control overscoped).
- **Fix:** Override headers for `/embed/(.*)` in `next.config.ts` — set `X-Frame-Options: ALLOWALL` (or omit) and use a permissive CSP `frame-ancestors *` for that scope only. Keep DENY for everything else.

### P0-2: `comments/flag` accepts arbitrary `commentId` from the body with no ownership or share check → unauthenticated mass-deletion
- **File / line:** `src/app/api/comments/flag/route.ts:14-65`
- **Problem:** `POST /api/comments/flag` takes `{ commentId: number, sessionId: string }` from the body. There's no `auth()` check, no validation that `commentId` exists, no validation that it belongs to a public/commentable share, and no validation that the `sessionId` matches the caller's actual session. After **3 unique sessionIds** flag the same comment, the route hard-deletes it (line 42-45). Combined with the 10/min rate-limit-per-IP, an attacker rotating sessionIds (cheap, client-controlled string) from 3 IPs (or via the CSRF-exempt allowed-origin path) can wipe any comment on the site in <1 minute. The current flag-or-delete model is fully unauthenticated.
- **OWASP:** A01 Broken Access Control (mass-action without auth) + A04 Insecure Design (trust client-supplied sessionId for moderation decisions).
- **Fix:** (a) Require `await auth()` and use the Clerk userId as the dedup key for flags, not a client-supplied sessionId. (b) Verify the comment exists and belongs to a public share before recording the flag. (c) On threshold-reached, soft-hide (set a `hidden_at` column or status='hidden') instead of hard-DELETE — preserve evidence and allow undo. (d) Add a separate moderator-only DELETE route for the hard-delete.

### P0-3: `js-cookie` / `@clerk/shared` high-severity CVE still present (GHSA-qjx8-664m-686j)
- **File / line:** lockfile dep `node_modules/js-cookie` → `node_modules/@clerk/shared`. Reported by `npm audit`.
- **Problem:** `js-cookie <=3.0.5` has a CVSS-7.5 prototype-hijack-via-assign() bug enabling cookie-attribute injection (GHSA-qjx8-664m-686j). Clerk session cookies pass through this code path. `npm audit` says `fixAvailable: true` — Clerk has already shipped a fixed version in their canary chain (the affected range is `0.18.0-mytag.691991c - 3.47.5 || 4.0.0-canary.v20251209150846 - 4.13.1-canary.v20260522193509`).
- **OWASP:** A06 Vulnerable and Outdated Components.
- **Fix:** Run `npm update @clerk/nextjs @clerk/shared` to pick up the patched range; confirm `npm audit` no longer lists js-cookie. If the patch requires a Clerk major bump, branch+smoke-test before pushing (auth, webhook, middleware, OAuth popup flow). This has been flagged in the last 4 c4 audits — Wave 2 should land it.

## P1 (fix this week)

### P1-1: Module-scope `setInterval` in `/api/sync/[id]` defeats serverless scale-to-zero (cost + correctness)
- **File / line:** `src/app/api/sync/[id]/route.ts:35-41`
- **Problem:** `setInterval(..., 60_000)` at module scope keeps the Lambda warm, which is exactly the pattern the May 2026 changelog (`src/app/changelog/data.ts:110`) called out as fixed for `/api/views`. The presence Map is also per-instance, so cold instances see no collaborators and the count is wrong. Cost-relevant on a Vercel Pro plan.
- **OWASP:** A04 Insecure Design (in-memory state in stateless functions); cost guardrail violation per CLAUDE.md.
- **Fix:** Move presence tracking to Upstash with a TTL key per `(shareId, sessionId)`, drop the setInterval. Mirror the `cacheSetIfAbsent` pattern used in `src/app/api/views/[shareId]/route.ts:37`.

### P1-2: `/api/migrate` POST runs unbounded UPDATE across all shares with no rate limit
- **File / line:** `src/app/api/migrate/route.ts:23-110`
- **Problem:** Auth is timing-safe bearer (good — `verifyBearer` is now used) but there's no `apiGuard` rate limit and no row-count cap. A leaked `MIGRATE_SECRET` lets an attacker hammer the route repeatedly, each call re-scanning every share and rewriting `data` JSONB and `search_vector`. The route also calls `JSON.stringify(normalized)` per row inside a `while(true)` loop with no abort signal — long-running on large datasets.
- **OWASP:** A04 Insecure Design (unbounded sensitive action).
- **Fix:** Wrap with `apiGuard({ rateLimit: { key: "migrate", max: 2, windowMs: 3_600_000 } })`. Add an explicit row-budget query param (default 10k) so a single invocation can't hot-loop the DB.

### P1-3: `comments/[shareId]` POST relies on client-supplied `sessionId` for delete authorization
- **File / line:** `src/app/api/comments/[shareId]/route.ts:14-18` (schema) and `src/app/api/comments/[shareId]/[commentId]/route.ts:42-48` (delete path)
- **Problem:** Comment authorship is keyed off `sessionId` from the request body. The same `sessionId` is later accepted as proof of authorship for DELETE. Any client can supply any sessionId on POST, and anyone who scrapes a comment's row (the GET route at line 38-52 returns `session_id` in the response payload) can replay it on DELETE to wipe the comment.
- **OWASP:** A01 Broken Access Control + A02 Cryptographic Failures (using a guessable/visible token as auth).
- **Fix:** Stop returning `session_id` from the GET response (line 60). For authenticated commenters, use Clerk userId as the authorship key instead of sessionId. For anonymous commenters, drop the "author can delete" path entirely — require the owner edit_token.

### P1-4: PostHog timeline fetcher passes an unvalidated `beforeTimestamp` to a HogQL query
- **File / line:** `src/app/api/webhooks/posthog/route.ts:18-73`, called with `body.timestamp` (line 194 + 208).
- **Problem:** `fetchSessionTimeline(sessionId, beforeTimestamp)` validates `sessionId` is a UUID (good) but the `beforeTimestamp` flows straight through into the `values: { before_ts: beforeTimestamp }` HogQL parameter without ISO-format validation. PostHog binds it server-side so this isn't classical injection, but a malformed value triggers HogQL parse errors that go silent. After the auth check, the route trusts the entire JSON body shape blindly — no Zod schema for the PostHog payload.
- **OWASP:** A04 Insecure Design (no schema on signed-but-untrusted external input).
- **Fix:** Add a Zod schema for `{ event, person, properties, timestamp }`; coerce `timestamp` to `z.string().datetime()`; reject on parse failure (still HTTP 200 so PostHog doesn't auto-disable).

### P1-5: `feedback` route forwards user-controlled `description` to Discord + Linear without scrubbing mentions/markdown
- **File / line:** `src/app/api/feedback/route.ts:97-99,123-134,153-167`
- **Problem:** `escapeHtml(rawDescription)` is applied to the DB row but **`rawDescription`** (unescaped) is then passed to `createLinearIssue` (line 125) and `postFeedbackEmbed` (line 156) and `sendDiscordNotification` (line 147 receives `parsed.data.description` — the unescaped original via `parsed.data`). Linear renders markdown — a malicious description with `[click](javascript:...)` or HTML embeds could land in moderator dashboards. Discord renders limited markdown but `@everyone`/`@here` mentions could fire and ping the whole server.
- **OWASP:** A03 Injection (stored XSS / markdown injection downstream).
- **Fix:** Strip Discord mention sequences (`@everyone`, `@here`, `<@&...>`) and reject `javascript:`/`data:` URIs in description before forwarding to Linear/Discord. The DB-side escapeHtml is fine.

### P1-6: `/api/bot` not in the cron-or-webhook bypass list → bot-detection can block legitimate cron triggers
- **File / line:** `src/middleware.ts:65` (`isCronOrWebhook` set) and `src/app/api/bot/route.ts:54-61` (uses verifyBearer CRON_SECRET).
- **Problem:** `/api/bot` is authenticated identically to a cron route (timing-safe bearer on `CRON_SECRET`) but middleware runs the bot-UA blocklist (`isBlockedBot`) before allowing it through. If a Vercel cron's UA or a manual curl test ever contains a blocked substring (`/curl/i`, `/python-requests/i`), the route becomes silently unreachable. The route also calls Discord+Email APIs at length — a 403 from middleware would mask any deploy that flips the UA string.
- **OWASP:** A05 Security Misconfiguration.
- **Fix:** Add `/api/bot` to the `isCronOrWebhook` bypass in middleware. Alternatively, gate the bot blocklist on absence of `Authorization: Bearer` headers so any properly-authenticated request bypasses the UA check.

## P2 (worth a ticket)

### P2-1: `verifyBearer` allocates `Buffer.from(authHeader)` before the length check → cheap DoS
- **File / line:** `src/lib/auth/verify-bearer.ts:23-26`
- **Problem:** Not an exploitable auth bug — the timing-safe compare is correct. But `Buffer.from(authHeader)` allocates whatever the attacker sends in the Authorization header (10 MB if they want). Cheap DoS amplification.
- **Fix:** Add `if (authHeader.length > 256) return false;` before the Buffer allocation.

### P2-2: `dangerouslySetInnerHTML` in `JsonLd` and root layout (verified safe but worth a comment)
- **File / line:** `src/components/seo/JsonLd.tsx:9` and `src/app/layout.tsx:101`.
- **Problem:** Both call sites are safe today — `JsonLd` JSON-stringifies and escapes `</script>`; the layout script is static with no user input. Worth a comment in the file so a future contributor doesn't drop user data in.
- **Fix:** Add `// SAFETY: no user input flows here` above each.

### P2-3: `sprite` route returns `Access-Control-Allow-Origin: *` (intentional, but document)
- **File / line:** `src/app/api/sprite/route.ts:72`
- **Problem:** Wildcard CORS is correct for a public sprite proxy with no credentials, and the SSRF allowlist on host+path (line 5, 40-45) is correctly closed. Worth a comment so it doesn't get flagged in every future audit.
- **Fix:** Add explanatory comment.

### P2-4: `oembed` endpoint string-interpolates `creatorName` / `tournamentName` into `title` JSON field
- **File / line:** `src/app/api/oembed/route.ts:37`
- **Problem:** `title: creatorName ? \`${tournamentName} by ${creatorName}\` : tournamentName` — values come straight out of `shares.data` JSONB. No HTML escaping needed because it's JSON, but if a consumer (Slack, Discord) renders the title as HTML it could echo a malicious name. The `html` field at line 38 correctly uses `encodeURIComponent(shareId)` (per the May 2026 changelog fix). Low risk because creatorName is escaped at write time in profile and comments routes, but `data.creatorName` on shares is not guaranteed-clean — the share POST route does not escape creatorName before storing.
- **Fix:** Apply `escapeHtml` to creatorName/tournamentName before string concat, even though the output is JSON.

### P2-5: Discord public key hardcoded in `src/app/api/discord/route.ts:6`
- **File / line:** `src/app/api/discord/route.ts:6` — `const DISCORD_PUBLIC_KEY = "44b2cb02..."`.
- **Problem:** This is the bot's Ed25519 *public* key (signature verification target), not a secret. Hardcoding is acceptable but inconsistent with every other secret going through `process.env`. If the bot's public key ever rotates (Discord re-issues), a deploy is required.
- **Fix:** Move to `DISCORD_INTERACTION_PUBLIC_KEY` env var with the hardcoded value as the fallback.

### P2-6: COOP set to `unsafe-none` (necessary for Clerk OAuth popups but degrades isolation)
- **File / line:** `next.config.ts:64-66`
- **Problem:** Documented and intentional (Clerk OAuth popups need it). Worth tracking that this disables some Spectre-class isolation. Not actionable without Clerk-side changes.
- **Fix:** None — note for future review when Clerk supports stricter isolation modes.

## npm audit summary
- **Critical: 0**
- **High: 3** — `js-cookie` (CVSS 7.5, prototype hijack, GHSA-qjx8-664m-686j), `@clerk/shared` (downstream of js-cookie), `tmp` <0.2.6 (path traversal, GHSA-ph9p-34f9-6g65).
- **Moderate: 10** — `next` (postcss XSS chain, no fix available), `@clerk/nextjs` (via next, no fix available), `@sentry/nextjs` (via next), `postcss` <8.5.10 (CVSS 6.1 XSS, no fix available without next major), `brace-expansion` <5.0.6 (DoS, fix available), `qs` (DoS, fix available), `uuid` (buffer bounds, fix available), `cypress` + `@cypress/request` + `@sentry/webpack-plugin` (transitive via qs/uuid).
- **Patched paths available:** `js-cookie` → update `@clerk/nextjs`/`@clerk/shared`; `tmp` → update transitively (dev dep chain); `brace-expansion`, `qs`, `uuid`, `cypress`, `@cypress/request`, `@sentry/webpack-plugin` → `npm update` resolves. The 4 moderate `next`/`postcss`/`@clerk/nextjs`/`@sentry/nextjs` items require waiting for upstream — track but do not push a forced major bump tonight.
- **Total:** 13 vulnerabilities.

## Verified secure (no findings — call out so they don't get re-audited)
- **No hardcoded secrets** in `src/**`. Every `LINEAR_*`, `DISCORD_*`, `CLERK_*`, `UPSTASH_*`, `DATABASE_URL`, `RESEND_*` reference goes through `process.env`. Grep across the regex `(api[_-]?key|secret|token|password)\s*=\s*['\"][a-zA-Z0-9_/+=]{16,}['\"]` returns zero matches.
- **Webhook signature verification** is in good shape: Linear (HMAC-SHA256 + `timingSafeEqual` + length-check), Clerk (`verifyWebhook`), Discord (Ed25519 via `tweetnacl`), PostHog (timing-safe shared secret). All four fail closed when the signing-secret env var is absent.
- **CSP** is comprehensive: `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`. `unsafe-inline` for scripts/styles is required by Clerk + Tailwind and is documented.
- **SQL injection:** `neon` tagged template binds every `${...}` parameter. No `sql.unsafe` / `sql.raw` / string concatenation in any of 24 route.ts files using `sql\`\``.
- **Cron auth:** every cron route uses `isCronAuthorized` or `verifyBearer` — both timing-safe via `crypto.timingSafeEqual`. No spoofable User-Agent auth remains (changelog confirms v4.11 fix).
- **Open redirect:** the only `NextResponse.redirect` in src/ is the canonical-host redirect in `src/middleware.ts:98-101` — fully server-controlled, no user input flows into the target URL.
- **Rate limiting:** 27 mutating API routes use `apiGuard` with `rateLimit`. Webhook routes intentionally skip (signature-verified); cleanup/migrate/setup use bearer auth instead.
- **Input validation:** 35 routes with user input use Zod `safeParse`. The 3 routes without explicit Zod (`discord`, `linear-webhook`, `clerk-webhook`) all use signature verification + structural checks on a known schema.
- **CORS:** allowlist-based (`src/lib/security/cors.ts`), webhook and Discord interaction routes exempted, dynamic Vercel preview match restricted to `vgc-team-report*.vercel.app`.
- **Auth bypass:** middleware uses `createRouteMatcher` for the public allowlist; mutating routes in the public list (`/api/comments`, `/api/reactions`, `/api/views`, `/api/feedback`) each enforce their own `await auth()` or session checks where needed.
