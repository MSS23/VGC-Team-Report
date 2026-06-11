# C4 Security Audit — 11-06-26

Scope: read-only audit of `/home/user/VGC-Team-Report` (Next.js 16, App Router). Conflict-risk files were not flagged. No code changes made.

## npm audit: 3 high, 0 critical (10 moderate)
Counts via `npm audit --json` parsed live. Top high-severity findings:

- `js-cookie` ≤3.0.5 — GHSA-qjx8-664m-686j — Per-instance prototype hijack in `assign()` enables cookie-attribute injection (CVSS 7.5). Reaches us via `@clerk/shared` → `@clerk/nextjs` (direct dep). `fixAvailable: true` — bump `@clerk/nextjs`.
- `@clerk/shared` (high, propagated from `js-cookie`). Same fix path as above.
- `tmp` — GHSA-ph9p-34f9-6g65 — Path traversal via unsanitized prefix/postfix. Transitive (dev-tool surface only); upgrade when convenient.
- Notable moderate worth tracking: `next` (postcss XSS GHSA-qx2v-qp2m-jg93) — semver-major fix gated by `@sentry/nextjs` major bump.

## Hardcoded secret scan: clean
Patterns checked (Grep, `--type ts --type tsx --type js --type json`): `sk_*`, `secret_*`, `api_key=`, `Bearer <20+ chars>`, AWS `AKIA…`, Slack `xox[baprs]-…`, GitHub `ghp_…`, Linear `lin_api_…` / `lin_oauth_…`, raw Discord webhook URLs.

- No matches in repo source.
- `LINEAR_WEBHOOK_SIGNING_SECRET` appears only as `process.env` reads / docs / changelog text — no hardcoded value. **No P0.**
- `.env.local` not present; `.env*` is gitignored (`.gitignore:34,47`). Only committed env file is `.env.example`.
- Discord Ed25519 **public** key is hardcoded in `src/app/api/discord/route.ts:6` — public keys are not secrets, this is fine.

## API route findings

### HIGH
None. All admin routes (`/api/migrate`, `/api/setup`, `/api/cleanup` DELETE, `/api/bot`, `/api/keep-alive`, `/api/cron/*`) require a Bearer token verified with `crypto.timingSafeEqual` via `src/lib/auth/verify-bearer.ts` / `src/lib/cron-auth.ts`. Webhook handlers (`/api/webhooks/linear`, `/api/webhooks/posthog`, `/api/webhooks/clerk`, `/api/discord`) verify HMAC/Ed25519 signatures with `timingSafeEqual` / `nacl.sign.detached.verify`. DB access is via Neon tagged-template `sql\`…${x}…\`` everywhere — parameters are bound, no `sql.unsafe`/string-concat queries found. SSRF surface (`/api/pokepaste`, `/api/sprite`, `/api/oembed`) is gated by host allowlists (`pokepast.es`, `play.pokemonshowdown.com`) plus path prefix check + `AbortController` timeouts.

### MEDIUM
- `src/app/api/comments/[shareId]/[commentId]/route.ts:42-48` — Comment delete by `sessionId` only: anyone who obtains another anon commenter's `sessionId` (stored client-side, sent in many GET/POST requests) can delete their comment. Authenticated-owner path is fine. Suggest moving to a server-issued, HttpOnly cookie session, or signing the sessionId.
- `src/app/api/changelog/[shareId]/route.ts:29-34` — `edit_token` is read from `?key=` query string. Query strings are routinely logged by CDNs/proxies and end up in browser history/Referer. Suggest accepting the token only via `Authorization` header or a POST body.
- `src/app/api/creator/[name]/route.ts:22,29` — Decoded `creatorName` flows straight into `ILIKE ${creatorName}`. Parameterized so no SQLi, but a caller can inject `%`/`_` to enumerate creators or force expensive scans. Suggest `replace(/[%_\\]/g, "\\$&")` before the bind.
- `src/app/api/webhooks/linear/route.ts:68-71` — Catch-all returns HTTP 200 on any exception (intentional, to keep Linear from disabling the hook) but this also swallows real signature/parser bugs. Suggest logging to Sentry with a synthetic `webhook_error` tag so it's visible without changing the response code.
- `src/app/api/comments/[shareId]/route.ts:97` — `containsBlockedWords(displayName)` is called on the *raw* `displayName` only when truthy; if `displayName` is omitted the default `"Anonymous"` skips the filter (fine), but the body filter at line 97 uses `sanitizedBody` (HTML-escaped). Escaping before the word filter means a slur containing `<` or `&` slips the check. Suggest run `containsBlockedWords` on the *raw* `body` before `escapeHtml`.

### LOW
- `/api/views`, `/api/reactions`, `/api/comments` POST use a client-supplied `sessionId` as the dedup/identity key. Acceptable for unauthenticated counters, but vote/like inflation is trivial (rotate sessionId). Authenticated-user path already blocks self-likes. Defence-in-depth: also key on IP hash.
- `/api/discord` route returns generic `"Something went wrong. Check the logs."` on exception (`route.ts:306`) — fine; no internal detail leaked.

## Email template findings
`src/lib/email.ts` is clean. Every user-controlled value (`commenterName`, `commentBody`, `reportTitle`, `firstName`, `weekLabel`, `recentItems.title/type/date`, `topRequests.title`, `reportUrl`) is passed through `escapeHtml()` before interpolation into the HTML string. Subject lines strip `\r\n` and `"` to prevent header injection (`email.ts:43,47,91`). Resend's `from` env value is also CRLF-stripped. No `dangerouslySetInnerHTML`-style risk.

## CSRF posture
Clerk-protected routes rely on Clerk's session cookie. Same-origin fetch is the dominant call pattern and Next.js App Router POST handlers reject cross-site form-encoded bodies for JSON-only endpoints (`apiGuard` can enforce `requireContentType` but is not used on all writes). Risk is low because mutating routes (`/api/share`, `/api/feedback`, `/api/user/*`, `/api/match-log`) require a JSON body and Clerk `auth()` — but turning on `requireContentType: true` for those would harden them at zero cost.

## Skipped (conflict-risk, per instructions)
- `public/sw.js`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/components/report/SlideNavControls.tsx`
- `src/components/ui/SwipeHint.tsx`
- `src/hooks/useHomePage.ts`
