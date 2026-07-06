# C4 Security Audit

Date: 2026-07-06
Scope: Static audit of `src/**`, root config, `src/middleware.ts`, and all `src/app/api/**/route.ts`.

## P0 — hardcoded secrets

**Count: 0**

Grep for `SIGNING_SECRET|WEBHOOK_SECRET|API_KEY|PRIVATE_KEY|BEARER`, `sk_live_|sk_test_|pk_live_|whsec_`, and long base64/hex string literals turned up only:

- Environment-variable *references* (`process.env.LINEAR_API_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `POSTHOG_WEBHOOK_SECRET`, `LINEAR_WEBHOOK_SIGNING_SECRET`, `CRON_SECRET`, `CLEANUP_SECRET`, `MIGRATE_SECRET`, `DISCORD_BOT_TOKEN`). All server-side, no client leakage.
- Placeholder examples in `.env.example`, changelog copy, and `.swarm/r-clerk-webhook-*.md` docs (fake `whsec_xxxxxxxxxxxxxxxxxxxx`). Not real credentials.
- `src/app/api/discord/route.ts:7` — `const DISCORD_PUBLIC_KEY = "44b2cb02932ad5b5eae681352246314ffb23ecd299c2490d7875d5883e5596ae"`. This is Discord's **Application Public Key** (Ed25519), which is public by design and used only to verify inbound interaction signatures. Explicitly documented as intentional in `.env.example:86-87`. Not a secret.

No live `sk_`, `pk_`, `whsec_`, or bearer tokens present in source. Env-only.

## P1 — missing auth / method guards / rate limits

None found. Systematic checks:

- **Auth**: every state-changing route reads Clerk `auth()` at the top and returns 401 when `userId` is null. Enforced on `share/route.ts`, `share/[id]/collaborators`, `share/[id]/fork`, `share/[id]/versions`, `user/*`, `feedback`, `match-log`, `comments/[shareId] POST`, `reactions/[shareId] POST`, etc. Public read endpoints (`/api/explore`, `/api/spotlight`, `/api/creator/[name]`, `/api/share/[id] GET`, `/api/reactions GET`, `/api/comments/[shareId] GET`, `/api/champions/meta`, `/api/oembed`, `/api/pokepaste`, `/api/team-graphic`) are intentionally open per `src/middleware.ts:12-40`.
- **Method guards**: routes export only the HTTP verbs they support; Next.js returns 405 automatically for others. `webhooks/linear/route.ts:74-78` explicitly exports GET returning 405. No accidental multi-verb handlers.
- **Rate limits**: 37 route files call `apiGuard({ rateLimit: … })` (Upstash-backed) or `isRateLimitedAsync`. Covered public endpoints: `comments`, `reactions`, `views`, `feedback`, `share`, `pokepaste`, `creator`, `spotlight`, `explore`, `oembed`, `team-graphic`, `champions-meta`, `sync`.
- **Webhook signing**: `webhooks/clerk` uses `verifyWebhook`; `webhooks/linear/route.ts:49-59` uses HMAC-SHA256 + `timingSafeEqual`; `webhooks/posthog/route.ts:179-186` uses `timingSafeEqual`; `discord/route.ts:75-93` uses Ed25519 via `tweetnacl.sign.detached.verify`.
- **Bearer routes** (`cleanup DELETE`, `migrate POST`, `setup GET`, `bot GET`, `keep-alive GET`, all `/api/cron/*`): all go through `verifyBearer`/`isCronAuthorized`, which use `crypto.timingSafeEqual`.
- **Middleware** (`src/middleware.ts`): Clerk `clerkMiddleware`, bot detection, canonical-host redirect, CORS origin allowlist, CSRF double-submit for cross-origin state changes. `/api/sprite` and `/api/discord` are explicitly bypassed for cost/signature reasons — both are internally hardened.
- **Ownership checks** on ID-scoped mutations: verified in `share/[id]/collaborators` (owner-only for POST/PATCH/DELETE), `share/[id]/versions` (owner or collaborator), `user/reports/[shareId]` (owner-only), `user/collections/[id]` (ownership guard), `changelog/[shareId]` (owner or edit-key), `comments/[shareId]/[commentId] DELETE` (sessionId or editToken).
- `user/saved/route.ts:87-97` and `user/collections/route.ts:117-125` block adding private-share IDs to saves/collections — private-preview leak previously fixed.

## P2 — unsafe casts, error leaks, string SQL

- **SQL injection**: none. Every DB call uses the Neon-http tagged template `` sql`…${x}…` ``, which parameterises interpolations. No `sql.query(string)`, no `db.query(\`…\`)` string concatenation. The `${…}` occurrences in `match-log`, `changelog`, `share`, `explore`, `champions/meta`, etc. are all inside tagged templates.
- **Error leakage**: no `Response.json(err)`, no `err.stack`, no `error: e.message`. Every catch logs to `console.error` server-side and returns a generic `{ error: "Failed" }` (or similar) to the client. Grep for `\.stack|Response\.json\(err|new Response\(err` returned zero.
- **Constant-time comparison**: all secret compares use `crypto.timingSafeEqual` (`src/lib/cron-auth.ts:17`, `src/lib/auth/verify-bearer.ts:26`, `webhooks/posthog:183`, `webhooks/linear:56`). No `secret === expected` string compare of credentials.
- **Minor**: `src/app/api/user/collections/route.ts:149-154` (`action === "delete"`) reads `raw.collectionId` without Zod validation before the SQL DELETE. The tagged template still parameterises the value so it isn't an injection, and the `user_id = ${userId}` clause scopes deletion to the caller — no cross-tenant risk. Recommend adding a `CollectionIdSchema.safeParse` for consistency with the other actions.
- **Minor**: `share/[id]/fork/route.ts:129-132` fires a follow-up `INSERT INTO edit_changelog` without `await` — inherited pattern, low severity, but the swallowed rejection can hide bugs. Recommend `await` inside a try/catch.

## P3 — client XSS risk

`dangerouslySetInnerHTML` appears in three places, none exploitable:

- `src/components/seo/JsonLd.tsx:9` — wraps `JSON.stringify(data)` with an explicit `</script>` → `<\/script>` escape (line 5). JSON encoding neutralises HTML metacharacters; the extra escape covers the classic script-break attack. Safe.
- `src/app/layout.tsx:101` — inline theme-priming script built from a static string literal (no user input). Safe.
- `src/app/changelog/data.ts:156` — the string "dangerouslySetInnerHTML" only appears as text inside a changelog entry describing a past hardening change, not as JSX. Not a real occurrence.

No client-side `innerHTML =`, `document.write`, or user-controlled markdown-to-HTML render paths turned up in `src/components/**`.

## Overall

Codebase is well-hardened. Consistent use of `apiGuard`, `timingSafeEqual`, Zod input validation, Neon tagged-template SQL, and centralised CORS/CSRF/bot-detection in middleware. No P0 or P1 findings. Two P2 nits (collection delete missing schema check, unawaited follow-up insert in fork). No exploitable P3.
