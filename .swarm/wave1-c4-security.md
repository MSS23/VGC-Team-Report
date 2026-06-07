# Wave 1 — C4 Security Audit (read-only, 2026-06-07)

## npm audit summary
13 vulnerabilities total: 0 critical, **3 high**, 10 moderate.

- **high `js-cookie` ≤3.0.5** — GHSA-qjx8-664m-686j (prototype hijack in `assign()`, cookie-attribute injection). Reaches us via `@clerk/shared` → `@clerk/nextjs`. `fixAvailable: true` for the transitive dep.
- **high `@clerk/shared`** — same chain (`js-cookie`); `fixAvailable: true`.
- **high `tmp` <0.2.6** — GHSA-ph9p-34f9-6g65 (path traversal). Dev-only (cypress chain), no prod exposure.
- Moderate items: `brace-expansion 5.0.2-5.0.5` (ReDoS), `postcss <8.5.10` (XSS via `</style>`), `uuid <11.1.1` (OOB write in v3/v5/v6 with `buf`), plus `next`/`@sentry/nextjs`/`@clerk/nextjs`/`cypress` aggregators. None of these has a critical/RCE primitive against our usage.

## P0 (must fix tonight)
*None.* No hardcoded secret-format hits in `src/` (no `sk_`, `pk_test_`, `pk_live_`, `lin_api_`, `lin_wh_`, `phc_`, `xoxb/p-`, `AIza`). The single 32+ hex string in source is Discord's public verification key (intended public, see SKIP).

## HIGH
1. **`@clerk/shared` → `js-cookie` cookie-attribute injection (GHSA-qjx8-664m-686j).** package-lock.json (transitive). Fix: `npm audit fix` (it reports `fixAvailable: true` and is non-major for `js-cookie`/`@clerk/shared`).
2. **`/api/webhooks/clerk` returns HTTP 200 on internal handler errors** — `src/app/api/webhooks/clerk/route.ts:73`. The handler executes side-effects (`sendWelcomeEmail`) before the 200, but a thrown error inside the `try` is silently swallowed and acknowledged. Fix: keep the no-auto-disable behaviour but log to Sentry and only catch known classes (email-send failures), not parse/path errors.
3. **`/api/webhooks/linear` swallows all errors as 200 in the outer `catch`** — `src/app/api/webhooks/linear/route.ts:68-71`. A JSON.parse failure on a *valid-signature* payload returns 200 with no telemetry. Fix: differentiate signature/parse failures and emit a Sentry breadcrumb before returning 200.

## MEDIUM
4. **`postcss <8.5.10` XSS via unescaped `</style>` (GHSA-qx2v-qp2m-jg93)** — pulled via `next`. Only exploitable if user CSS is rendered through PostCSS, which we don't do at runtime, but bump on next dependency refresh. Fix: `npm audit fix` (non-major; Next will resolve a patched postcss).
5. **`uuid <11.1.1` OOB write (GHSA-w5hq-g745-h8pq)** in `@sentry/webpack-plugin` and `@cypress/request`. Build-time only, no runtime exposure. Fix: `npm audit fix`.
6. **`/api/share` body schema accepts unknown unbounded `state.notes`, `state.calcs`, `state.roles` as `z.record(z.string(), z.unknown())`** — `src/app/api/share/route.ts:17-19`. Combined with the 500KB body cap this is fine, but the JSON is later inlined into search-vector tsvector and stored in jsonb. Fix: cap each record's value-string length or total key count to prevent slow `to_tsvector` on a 500KB notes object.
7. **`/api/explore` `searchPattern` ILIKE built from raw user query (`%${q}%`)** — `src/app/api/explore/route.ts:72,99-102`. Parameters are bound by Neon's tagged-template driver, so this is not classical SQLi, but `q` is *not* length-limited (only `.trim()`). A 10KB `q` triggers a slow seq scan with ILIKE on a JSONB column. Fix: enforce `z.string().max(100)` on `q`.

## LOW / DEFENSE IN DEPTH
8. **`/api/discord` swallows `JSON.parse(rawBody)` in the same try block as the handler** — `src/app/api/discord/route.ts:55`. After signature passes, a malformed body falls into the generic 200-with-"Something went wrong" branch. Fix: validate `body.type` with Zod and return 400 on schema failure (signature already proves it's Discord).
9. **`/api/oembed` reflects user input in HTML iframe `src` without strict validation** — `src/app/api/oembed/route.ts:38`. `shareId` is regex-extracted (`/s/([A-Za-z0-9]{6,12})`) and `encodeURIComponent`'d, so injection is blocked. Defence-in-depth: assert `shareId` matches the canonical 8-char `IdSchema` used elsewhere.
10. **`Authorization: <linearApiKey>` is logged verbatim through `console.error(linearRes)` on failure** — `src/app/api/webhooks/posthog/route.ts:265`. `linearRes` only contains the response body, but if Linear ever echoes the request, the API key would land in Vercel logs. Fix: redact before logging, or log only `linearRes.errors`.

## SKIP (false positive — explain why safe)
- **`DISCORD_PUBLIC_KEY = "44b2cb02…596ae"`** at `src/app/api/discord/route.ts:6`. This is Discord's Ed25519 *public* verification key for the app — by design public and required client-side to verify interaction signatures. Not a secret.
- **`dangerouslySetInnerHTML` in `src/components/seo/JsonLd.tsx:9`** and `src/app/layout.tsx:101` — JsonLd `.replace(/<\/script>/gi, "<\\/script>")` is the standard JSON-LD injection guard; layout.tsx uses a static literal-only theme-init script (no user input). Safe.
- **`dangerouslySetInnerHTML` reference in `src/app/changelog/data.ts:120`** — appears inside a *string literal* describing a past changelog item; not actual JSX. Safe.
- **No `eval()` / `new Function()` / `Function()` hits anywhere in `src/`.**
- **`LINEAR_WEBHOOK_SIGNING_SECRET`** only appears as `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` (`src/app/api/webhooks/linear/route.ts:33`) and in docs/changelog strings. No hardcoded value.
- **`tsQuery` interpolation in `explore/route.ts:91-96`** is bound through Neon's tagged-template parameterizer (`sql\`… ${tsQuery}\``), and `tsQuery` itself is already stripped to `[A-Za-z0-9_]+:*` segments at line 77. Not SQLi.
- **`/api/cleanup`, `/api/migrate`, `/api/setup`, `/api/bot`** all gated by `verifyBearer` with `crypto.timingSafeEqual`. **`/api/share` writes, `/api/user/*` mutations, `/api/share/{id}/collaborators`, `/api/user/delete`** all check `auth()` from Clerk before any DB mutation. Rate limiting via `apiGuard` on every public-facing endpoint (`feedback`, `comments`, `views`, `reactions`, `pokepaste`, `share-get`, `explore`, `oembed`, `flag`, `user-search`). **`/api/sprite` is SSRF-safe** via host allowlist + path allowlist; **`/api/pokepaste` GET** restricts to `pokepast.es` only. No open redirects — no `Response.redirect(userInput)` anywhere.

## Summary (200 words)
The codebase is in good security shape. No leaked secrets in `src/` (the lone 32-hex string is Discord's intentionally-public Ed25519 verification key). No `eval`, no `new Function`, no `dangerouslySetInnerHTML` outside the trusted JSON-LD wrapper (which already escapes `</script>`) and a static layout theme-init script. All SQL goes through Neon's tagged-template driver — parameters are bound, not interpolated, so the `ILIKE %${q}%` and `to_tsquery(${tsQuery})` patterns are not injectable (though `q` should be length-capped). SSRF is well-guarded: `/api/sprite` allowlists `play.pokemonshowdown.com` + `/sprites/` path, `/api/pokepaste` restricts hostname to `pokepast.es`. All mutation endpoints (share writes, collaborators, deletes, profile, follow, collections, feedback) require Clerk `auth()`; admin/cron routes use timing-safe bearer compare. Rate limiting via `apiGuard` is consistent. Main work item is `npm audit fix` to clear 3 high (transitive `js-cookie` via Clerk; `tmp` is dev-only) and 10 moderate advisories — no critical CVEs. Secondary: webhooks (Clerk, Linear) silently swallow handler errors as 200 to avoid auto-disable; add Sentry breadcrumbs so failures are visible. Cap `q` and `state.notes/calcs/roles` payload size to prevent ReDoS-style DB load.
