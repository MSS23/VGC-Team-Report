# C4 — Security Audit, 02 Nov 2026

Read-only audit. Branch `swarm-nightly-2026-11-02`, HEAD `10dfd74` (*"Merge claude-dev: VGC-230 webhook idempotency, VGC-231 List-Unsubscribe, VGC-233 OTS PDF, VGC-235 share test (#90)"*). No source file edited, nothing committed, no dependency touched. This file is the only write.

Scope: `npm audit` triage with prod-vs-dev reachability, repo-wide secrets scan, OWASP pass over the 58 route handlers under `src/app/api/**`, webhook signature verification, and `next.config.ts` / `vercel.json`.

**Container limits that bound confidence:**
- **The clone is shallow** (`.git/shallow` present, 55 commits, `origin/main` + two branches only). The commits that introduced and removed the VGC-305 Discord webhook literal (`5da513a`, `28f5b8b`) are **not present locally**, so the public-history leak could not be re-verified this run. It is carried forward on the prior run's evidence, not re-proven.
- No PostHog credentials and no egress beyond the npm registry, so no telemetry cross-reference and no `gh api` repo-visibility check. Every reachability claim is static.

**Headline:** three of the prior run's five code findings are **fixed** (team-graphic visibility + redaction, `apiGuard` chunked-body bypass, root `zod` bumped to 4.6.6). The new pre-rendered og:image feature (`e4d9354`, #89) introduced **one new privacy-control bypass**: flipping a report to private does not revoke its public Blob card. `npm audit` total jumped 9 → 30, but **all 21 of the new advisories are dev-only** (eslint/minimatch fanout, cypress, start-server-and-test); production-reachable advisory count is unchanged at one high + one moderate, neither of which takes attacker-controlled input.

---

## P0 — exploitable now

### P0-1 — Making a report private does not revoke its public og:image Blob card **(NEW)**

- **Where:** `src/app/api/user/reports/[shareId]/route.ts:84-96` (PATCH) vs `:132-140` (DELETE).
- `PATCH` is the dashboard visibility toggle. It writes `SET is_public = …, is_unlisted = …` and then invalidates only `cacheDel(CacheKeys.share(shareId))` and the explore prefix. **It never calls `removeShareOgImage`.** `DELETE` does (`:140`) — so the soft-delete path is correct and the flip-to-private path is not.
- The card is a **public, unauthenticated, deterministically-named Blob object**: `src/lib/sharing/og-image.ts:36` is `blobPath = og/${shareId}.png`, uploaded at `:100-106` with `access: "public"` and `addRandomSuffix: false`. The Redis pointer carries `OG_TTL_SECONDS = 90 days` (`:28`).
- **Exploit path (proven in code, unauthenticated):** creator publishes a report → `schedulePublishShareOgImage` renders the card and uploads it (`share/route.ts:418,577`) → the Blob URL is distributed in `og:image` on `/s/{id}` (`src/app/s/[id]/page.tsx:128-129`) and cached by every unfurler → creator flips the report to private in the dashboard → `/s/{id}` and `GET /api/share/{id}` now 404, and `/api/team-graphic` now 404s correctly (that gate was fixed this cycle) — **but the Blob PNG keeps serving**. It renders species, held items, abilities, tera types, tournament name, placement, creator name and record.
- **The Blob store prefix is public**, published in the `og:image` of every public share, and the path is `og/{shareId}.png` with no random suffix — so the URL for any report that ever had a card rendered is constructible, not just recoverable from a cached unfurl. Reports that were private from birth never get a card (`og-image.ts:88-92` and `s/[id]/page.tsx:126` both gate on `isPublic || isUnlisted`), so exposure is bounded to reports that were public or unlisted at some point. That is exactly the population the toggle exists to protect.
- **Second defect in the same helper:** `removeShareOgImage` (`og-image.ts:68-78`) reads the card pointer from Redis first and `return`s if it is absent. With Upstash unconfigured, or after the 90-day TTL, or if `cacheSet` failed, the pointer is gone but the Blob is not — so even the `DELETE` path orphans a public PNG. The Blob is the source of truth for exposure; Redis must not be the only index of it.
- **Credit where due:** creator field redaction *is* honoured in the card — `src/lib/sharing/team-graphic-image.tsx:85-94` runs `redactPasteFields` inside `renderTeamGraphic`, so both the route and the Blob path inherit it. That is the right place for it and it closes last run's HIGH-1 exploit path A properly.
- **Severity: HIGH.** Confidentiality of a user-facing privacy control, no auth bypass, no data loss. Same class as the HIGH-1 fixed this cycle, reintroduced through a new surface.
- **Fix (~20 min + a vitest case):** call `removeShareOgImage(shareId)` from the PATCH handler whenever the new state is `!is_public && !is_unlisted`, and re-publish the card when the flip goes the other way (public → the card should exist). Make `removeShareOgImage` delete `og/${shareId}.png` by constructed path even when the Redis pointer is missing, instead of early-returning. A regression test should assert PATCH-to-private issues the `del`.
- `CONFLICT-RISK` — **`src/app/api/user/reports/[shareId]/route.ts` and `src/lib/sharing/og-image.ts` are both on `.swarm/main-changed-files.md`.** Coordinate before touching either.

### P0-2 — Creator-profile takeover via editable Clerk display name **(KNOWN, unchanged)**

- **Where:** `src/app/api/user/profile/route.ts:71-95` (write), `src/app/api/creator/[name]/route.ts:66` (public read).
- Verified byte-for-byte unchanged from the 26 Oct report: `creatorName` is still derived from `user.firstName`/`lastName`/`username` (`:71-73`) — all user-editable in Clerk's own account UI — and still written with `ON CONFLICT (name) DO UPDATE SET bio/twitter/discord/youtube/is_public/avatar_url` (`:86-94`). No `user_id` binding anywhere in the statement.
- Exploit path, severity and fix are exactly as recorded on 26 Oct (set your Clerk name to the target's, `PUT /api/user/profile`, the victim's public creator page now serves your bio and social links — under a verified badge if the target is verified). The case-collision variant (`name` written at user casing, read via `LOWER(name)`, no `ORDER BY`, `rows[0]`) also persists.
- **Related, unchanged:** `creatorName` on `POST /api/share` is still `z.string().optional()` with no length cap and no check against the authed identity (`share/route.ts:63`), so public reports can still be published under any creator name.
- **Severity: HIGH** (integrity + impersonation of identified third parties on a public site).
- `conflict_risk: false` — neither file is on the main-changed list.

### P0-3 — VGC-305 Discord webhook token in public git history **(KNOWN, carried forward, NOT re-verified)**

- **Could not be re-verified from this container.** The clone is shallow; `git log --all -S 'discord.com/api/webhooks'` returns only 3 commits (`7b85e8f` the regression test, `637989f` the 26 Oct audit report, `8f7a266` VGC-48) and an extraction sweep over all 55 reachable commits yields **no webhook literal**. The introducing commit `5da513a` is outside the shallow boundary.
- **Working tree and all 55 reachable commits are clean.** See the secrets section.
- **Status:** this is the fifth consecutive run to carry it. The prior four proved it present in the public GitHub history and unrotated; nothing in this container can confirm or refute rotation. **Do not re-file.** It needs one operator action — Discord → Server Settings → Integrations → Webhooks → delete the leaked webhook, create a new one, update `DISCORD_BUILDS_WEBHOOK` in Vercel env and the swarm container env. Rotation alone fully closes it.
- **Verify-then-close:** if the owner has already rotated, say so in the ticket and close it, so run six does not spend budget here again.

---

## P1 — production-reachable dependency advisories

`npm audit --json` metadata: `{ info: 0, low: 0, moderate: 23, high: 7, critical: 0, total: 30 }`.

Classification by whether the vulnerable node is in the **production** tree (`npm ls <pkg> --omit=dev` resolves it):

| Class | critical | high | moderate | low | Distinct advisories |
|---|---|---|---|---|---|
| **Production tree** | 0 | **4 nodes / 1 advisory** | **8 nodes / 1 advisory** | 0 | **2** |
| Dev-only | 0 | 3 nodes / 3 advisories | 15 nodes / 1 advisory | 0 | 4 |

Both production-tree advisories need attacker-controlled input to the vulnerable code path, and **neither gets it**. Details:

### P1-1 — `zod@4.1.11` nested under `@vercel/blob` (HIGH, 4 audit nodes, 1 advisory)

- **Advisory:** GHSA-mrhx-c7xc-m3w5, *"Zod can exhaust memory while validating oversized constrained collections"*, CWE-770, CVSS 7.5, range `<4.6.6`. The 4 high nodes (`@vercel/blob`, `@vercel/oidc`, `@vercel/cli-config`, `zod`) are all this one advisory fanned out along the path.
- **Dependency path (production):** `@vercel/blob@2.8.2 → @vercel/oidc@3.8.10 → @vercel/cli-config@0.3.1 → zod@4.1.11`. `@vercel/blob` is a direct `dependencies` entry and is genuinely used at runtime — `src/lib/sharing/og-image.ts:1` imports `put`/`del` and the og-card pipeline calls them on every publish.
- **Root `zod` is now patched: 4.6.6.** That is the single biggest change since 26 Oct — last run's only live high was root `zod@4.3.6` feeding ~40 route validators, and it is gone. `@vercel/cli-config` hard-pins `"zod": "4.1.11"` in its own `package.json`, so npm installs a **nested** copy at `node_modules/@vercel/cli-config/node_modules/zod`. That nested copy is what the audit now flags.
- **Reachability: in the prod tree, but no untrusted input reaches it.** `@vercel/cli-config` exists to read the **local Vercel CLI global config** — `@vercel/oidc/dist/token-util.js:51-52` calls `getGlobalPathConfig()` then `tryReadAuthConfig(configDir)`, i.e. it zod-parses `auth.json` off the developer's filesystem. On a Vercel Function that file does not exist, and nothing on that path ever sees an HTTP request body. The advisory needs an attacker-supplied oversized collection; the only input here is a local config file. **Classify as prod-tree, not attacker-reachable.**
- Note on ordering: `resolveBlobAuth` (`@vercel/blob/dist/chunk-XKVPKJPO.js:161-205`) tries OIDC **before** `BLOB_READ_WRITE_TOKEN`, so the `@vercel/oidc` import is loaded and called on every `put`/`del` even though this app authenticates with the read-write token. That is why the package is live in the bundle rather than tree-only — it still does not make the zod schemas attacker-fed.
- **Fix path — non-breaking, but NOT `npm audit fix`.** npm's `fixAvailable` for this chain is `{"name": "@vercel/blob", "version": "2.4.0", "isSemVerMajor": true}`, which is a **downgrade** from the installed 2.8.2 — a bogus suggestion; do not take it. The correct non-breaking fix is to dedupe the nested copy onto the already-installed patched version by extending the existing `overrides` block in `package.json`:

  ```jsonc
  "overrides": {
    "eslint-plugin-react-hooks": "7.0.1",
    "zod": "^4.6.6"          // add — hoists cli-config's pinned 4.1.11 to the patched line
  }
  ```

  zod 4.1 → 4.6 is semver-minor, so `@vercel/cli-config`'s schemas keep working. Verify with `npm ls zod` (expect a single 4.6.6, no nested copy), then the full gate: `npm run typecheck`, `node node_modules/vitest/vitest.mjs run`, `node node_modules/next/dist/bin/next build`. The alternative is to wait for `@vercel/cli-config` to bump its own pin — defensible given the path is not attacker-reachable.
- **Defence in depth is already in place regardless.** `apiGuard` now enforces the real byte cap (see "Fixed since 26-10-26"), so `POST /api/share` can no longer be fed an unbounded body, and `share/route.ts:44-45` added explicit `.max(2)` bounds on the `commonModes.combinations` arrays with a comment naming this exact GHSA. `matchupPlans`, `privateFields`, `hiddenSlides` and `tags.archetype` still have no `.max()` (`share/route.ts:19,81,65,74`) — worth adding so the bound never depends on a patched zod, but with the 500 KB real-body cap enforced the amplification ceiling is now low.
- `CONFLICT-RISK` — `package.json` and `package-lock.json` are both on `.swarm/main-changed-files.md`.

### P1-2 — `@opentelemetry/core <2.8.0` (MODERATE, 8 audit nodes, 1 advisory) — **unchanged, still leave it**

- **Advisory:** GHSA-8988-4f7v-96qf, *"OpenTelemetry Core: Unbounded memory allocation in W3C Baggage propagation"*, range `<2.8.0`. The 8 nodes (`core`, `resources`, `sdk-logs`, `sdk-metrics`, `sdk-trace-base`, `otlp-exporter-base`, `otlp-transformer`, `exporter-logs-otlp-http`) are one advisory fanned out; three are direct `dependencies`.
- **Reachability: prod tree, vulnerable path not used.** The SDK is a log exporter only (`src/instrumentation.ts`, declared in `next.config.ts:26-31` as `serverExternalPackages`). The vulnerable code is W3C **Baggage header propagation**; this app parses no inbound `baggage` header and extracts no trace context from client requests.
- **Fix path: breaking.** `fixAvailable` is `@opentelemetry/exporter-logs-otlp-http@0.300.0` / `@opentelemetry/sdk-logs@3.0.0`, both semver-major. Not worth a major bump for an unreachable advisory. **Leave it** — same verdict as 26 Oct.

---

## P2 — hardening

Ordered by value. Items 1–4 are carried forward unchanged from 26 Oct and verified still present; item 5 is new.

1. **`POST /api/views/[shareId]` — view counts inflatable via client-chosen `sessionId` (KNOWN, unchanged).** `views/[shareId]/route.ts:12` is still `ViewBody = z.object({ sessionId: z.string().min(1) })`, and dedup is still `cacheSetIfAbsent('view:{shareId}:{sessionId}', 600)` (`:40`) — a fresh `sessionId` per request is always a first view and always increments. 60/min/IP, each a real `UPDATE shares SET view_count = view_count + 1` plus a PostHog event and an OTel log emit. `explore/route.ts:208-209` sorts on `view_count`, and `spotlight` uses the same signal, so this manufactures ranking position; it is also write amplification on a 512 MB Neon tier. **Fix:** bind the dedup key to `getClientIp(request)` (trustworthy since the v5.26 fix) or the Clerk `userId`, keeping `sessionId` only as a secondary discriminator; tighten `SHARE_ID_RE` from `/^[a-zA-Z0-9_-]{6,16}$/` (`:11`) to the real `^[A-Za-z0-9]{8}$`. Abuse remains **unverified** — no PostHog access in this container. `conflict_risk: false`.
2. **`GET /api/user/export` — fail-open rate limit (KNOWN, unchanged).** Still the only authenticated route with **no `apiGuard` call at all** (`user/export/route.ts:6-21`). Its "one export per 24 h" is implemented purely as `cacheGet('export:{userId}')`, and `src/lib/cache.ts:29-42` returns `null` whenever Upstash is unset or Redis throws — in that state the limit silently vanishes and each call fans out 12 parallel queries at `LIMIT 1001`. **Fix:** add `apiGuard` with a low `max` as a floor that does not depend on Redis. `conflict_risk: false`.
3. **CSP keeps `'unsafe-inline'` in `script-src` in production.** `next.config.ts:5` — `'unsafe-eval'` is correctly dev-only (`:8`), but `'unsafe-inline'` is unconditional, which removes most of what the CSP would buy against an XSS. Everything else in that header block is strong (HSTS `max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `Referrer-Policy: strict-origin-when-cross-origin`, a real `Permissions-Policy`). **Fix is real work, not a one-liner:** nonce-based `script-src` via middleware, which Next's inline bootstrap makes fiddly. Worth a ticket, not a nightly fix. `conflict_risk: false`.
4. **`avatarUrl` is only prefix-validated and the CSP is the only thing stopping it (KNOWN).** `user/profile/route.ts:21-24` accepts any `https://` string. Not exploitable today because `img-src` (`next.config.ts:126`) allowlists specific hosts, so an arbitrary host is blocked at render — but two controls are coupled, and item 3 above is a live proposal to change that header. **Fix:** allowlist on write so the CSP is not load-bearing for this. `conflict_risk: false`.
5. **`/api/explore` cache keys have unbounded cardinality (NEW, low).** `explore/route.ts:43` builds the Upstash key from eight raw query params concatenated verbatim — including `q`, which has **no length cap** (`:24` is `get("q")?.trim() ?? ""`). At 30 req/min/IP an attacker mints a distinct 60-second Redis entry per request, each holding a full page of report JSON. That is Redis key-space and memory growth on the Upstash tier, plus a guaranteed cache miss (full DB query) every time. **Fix:** hash the composed param string into the key and cap `q` length in the parse (e.g. `.slice(0, 100)`). `CONFLICT-RISK` — `src/app/api/explore/route.ts` is on `.swarm/main-changed-files.md`.
6. **Carried forward, informational only — no change recommended.** All verified still accurate: `/api/sprite` is an unauthenticated unmetered proxy with SSRF closed but `ACAO: *` (bandwidth only; `src/proxy.ts:27-29` exempts it deliberately); the four signature-verified webhooks have no pre-verification rate limit (cheap crypto, correctly exempt from bot detection); `/api/user/search` enumerates the Clerk directory 8 at a time for any signed-in caller; CSRF is origin-conditional by design; `/api/setup` is middleware-exempt but `verifyBearer`-gated and fails closed; `isPreviewDeploy = host.includes('vercel.app')` (`proxy.ts:62`) should be `endsWith` for accuracy, no security consequence.

### Clean areas — re-verified this run, nothing to report

- **SQL injection: zero surface.** Swept all 58 handlers plus `src/lib/` for `sql.unsafe`, the `sql(...)` call form, `.query(` with a built string, and concatenated SQL — **no hits**. Every query is a Neon tagged template with `${}` bound as parameters. The two hardest cases are correct: `explore/route.ts:212,227` picks its sort column from a fixed pair of nested `sql` fragments (`sort === "updated" ? sql\`s.updated_at\` : sql\`s.created_at\``) with `sort` itself allowlisted at `:26`, `limit` clamped `Math.min(Math.max(…,1),50)` at `:24`, and the `to_tsquery` input built by stripping non-word characters and appending `:*` (`:83`) so tsquery operators cannot be injected. `quick-share/[id]/claim/route.ts:34-40` does claim-and-insert as one atomic CTE with all five values bound.
- **SSRF: closed on all three candidates**, unchanged and re-read: `sprite/route.ts:40-45` (host allowlist + `/sprites/` path prefix + 3 s abort), `pokepaste/route.ts:13-23,50-55` (hostname pinned, then the URL **reconstructed** from the literal origin + validated pathname), `import/limitless/route.ts:6` → `src/lib/import/limitless.ts:10-17` (https + exact hostname + no port/user/password + `^/teams/\d+/?$`, `redirect: "error"`, 8 s timeout, 2 MB streamed cap, and the second-hop tournament URL re-normalised rather than trusted).
- **Webhook authenticity: all four verified, all constant-time, all fail closed** (task item 4). `webhooks/clerk/route.ts:32-47` pre-checks `CLERK_WEBHOOK_SIGNING_SECRET` and rejects before anything else, then `verifyWebhook` (svix) inside a try/catch returning 400 — and it captures `svix-id` at `:39` *before* `verifyWebhook` consumes the body, with Redis dedup at `:51-57` gated on successful verification (correct order: no dedup slot is burned by an unverified request). `webhooks/linear/route.ts:50-61` computes HMAC-SHA256 over the **raw** body, then `expectedBuf.length !== signatureBuf.length || !timingSafeEqual(...)` — the length pre-check is required because `timingSafeEqual` throws on mismatched lengths, and it is present. `webhooks/posthog/route.ts:182-183` has the identical length-check-then-`timingSafeEqual` shape. `discord/route.ts:85-92` uses Ed25519 via `nacl.sign.detached.verify`. No secret-equality comparison anywhere uses `===`.
- **Privileged / destructive endpoints: all secret-gated, timing-safe, fail closed.** `setup`, `migrate`, `cleanup`, `bot` and all five `cron/*` routes. `src/lib/cron-auth.ts` and `src/lib/auth/verify-bearer.ts` both treat an unset env var as a hard deny.
- **Authentication coverage: no gap.** Every handler exporting `POST`/`PUT`/`PATCH`/`DELETE` either calls Clerk `auth()`/`currentUser()`, verifies a bearer secret, or verifies a webhook signature. The seven mutating routes with no `apiGuard` are the four signature-verified webhooks plus `discord` (Ed25519), `migrate` and `cleanup` (both bearer-gated) — all expected, see P2-6. `feedback/route.ts` has no `apiGuard` but calls `isRateLimitedAsync` directly.
- **IDOR: consistently closed.** Re-spot-checked the owner-scoped routes, including all the ones changed since 26 Oct. The pattern is the ownership predicate inside the query, not a post-fetch check: `user/collections/route.ts:110,143,152` (`AND user_id = ${userId}` on every read *and* write), `user/reports/[shareId]:84-88`, `user/delete`, `changelog/[shareId]`, `share/[id]/collaborators`, `share/[id]/versions/[version]`, and `src/lib/collaboration-access.ts`. `comments/flag/route.ts:32-47` is a good example of the fixed shape: flag identity derived from the Clerk `userId` with an IP fallback and **never** from the client `sessionId`, plus the comment validated as belonging to a live public share before the flag is accepted. `quick-share/[id]/claim` requires both a Clerk session and the browser-held owner token (`:11-21`).
- **Verbose errors: two routes echo an exception message, both benign.** `quick-share/route.ts:18` and `import/limitless/route.ts:45` return `error.message` — these are parser/validation messages, not stack traces or internals, and every other handler returns a fixed string with the detail going to `console.error`. `share/route.ts:120` returns `parsed.error.flatten().fieldErrors`, which echoes the caller's own input shape. No stack trace, DSN, connection string or internal path is reachable in any response body.
- **`next.config.ts` / `vercel.json`: no dangerous config** (task item 5). No `dangerouslyAllowSVG`. `images.remotePatterns: []` (`:33`) — fully closed, and nothing in `src/` uses `next/image`. No `typescript.ignoreBuildErrors`, no `eslint.ignoreDuringBuilds` — the type gate and lint gate are both real. `vercel.json` is five cron entries, all daily or weekly as policy requires, no header or route overrides. The og-card Blob host is deliberately **absent** from CSP `img-src` and does not need to be: the card URL is only emitted in `og:image` metadata (`s/[id]/page.tsx:128-129`), never rendered in an `<img>` by the app.

---

## Dev-only advisory noise (counts only)

21 of the 30 audit nodes, and 4 of the 6 distinct advisories, are dev-only. **Not production-reachable in any sense** — none resolves under `npm ls --omit=dev`, none is imported by `src/`, and CI runs only tsc + eslint + vitest (Cypress is skipped entirely in this container via `CYPRESS_INSTALL_BINARY=0`). Counts, not findings:

| Severity | Nodes | Advisories | Root cause |
|---|---|---|---|
| high | 3 | 3 | `follow-redirects@1.16.1` (GHSA-mrwp-f3q8-3g9p) and `joi@18.3.0` (GHSA-4528-x5fx-h6hg), both via `start-server-and-test → wait-on`; `systeminformation@5.33.1` (GHSA-3f7j-7jwc-fxfj, Windows-only command injection) via `cypress@15.18.0` |
| moderate | 15 | 1 | `minimatch <11.0.1` (GHSA-g3hv-75wg-m249) fanned out across `eslint@9.39.3`, `eslint-config-next@16.1.6` and the whole `@typescript-eslint` / `eslint-plugin-*` tree |
| low | — | 2 | Bundled inside the `systeminformation` node above (GHSA-7648-jmwf-vw7j moderate, GHSA-4vjg-vx72-qq4g low); the node is reported at its highest severity, so these add no rows |

**All three dev highs have non-breaking fixes** — `follow-redirects`, `joi` and `systeminformation` each report `fixAvailable: true`, so a plain `npm audit fix` (no `--force`) clears them. Cheap and worth doing on the next lockfile touch, but it is hygiene, not risk. `CONFLICT-RISK` — it rewrites `package-lock.json`, which is on the main-changed list, so batch it with the P1-1 `overrides` change rather than as a separate commit.

**Do not `npm audit fix --force`.** It would take the eslint chain to `eslint@4.0.0` and `eslint-config-next@12.0.4` — both catastrophic downgrades — and `@vercel/blob` to 2.4.0, a downgrade from the installed 2.8.2.

---

## Secrets scan result

**No live secret is present in the working tree or in any of the 55 reachable commits. Nothing secret is tracked by git.**

- **Pattern sweep over the tracked tree** (`git grep -nIE`) for `lin_api_`, `lin_wh_`, `discord.com/api/webhooks/<digits>`, `sk_live_`, `sk_test_`, `pk_live_`, `AKIA[0-9A-Z]{16}`, `ghp_`, `xoxb-`, `AIza`, `whsec_`, `sk-`, `postgres://`, `postgresql://`, `-----BEGIN … PRIVATE KEY-----`: **only placeholders and self-references.** Every hit is one of (a) `.env.example` placeholders, (b) prior `.swarm` audit reports *describing* the scan, (c) `docs/STRIPE_PAID_REPORTS_ARCHITECTURE.md:335` (`sk_test_...` — a literal ellipsis in a design doc), or (d) the regex literals inside `src/lib/security/__tests__/no-hardcoded-secrets.test.ts`. No real credential anywhere.
- **Filesystem sweep including untracked files** (excluding `node_modules`, `.next`, `.git`) for the same patterns at realistic token lengths: **zero files matched.** No `.env.local` exists in this container — credentials arrive as env vars, as CLAUDE.md documents.
- **`*_SECRET` / `*_TOKEN` / `*_KEY` assigned to a string literal:** every hit is a `localStorage`/cache key constant (`vgc-dark-mode`, `chunk-reload`, `champions:meta:snapshot:v2`, …). One deliberate exception: `src/app/api/discord/route.ts:7` holds `DISCORD_PUBLIC_KEY` as a hardcoded 64-hex constant. **This is correct and not a finding** — a Discord interaction *public* key is public by definition, it is used only as the Ed25519 verification key, and `.env.example` documents the choice explicitly ("the Discord interaction public key is currently a hardcoded constant … so it is intentionally omitted"). No corresponding private key or bot token is in the tree.
- **`.env.example` contains only placeholders**, re-read in full: angle-bracket placeholders (`<your-clerk-secret-key>`), `xxxx`-style stubs, `postgresql://user:password@host/database?sslmode=require`, `your-*-here` strings, and two empty VAPID values. Nothing real, and the header warns against committing secrets and against putting secrets in `NEXT_PUBLIC_*`.
- **Gitignore is correct.** `.gitignore:34-35` is `.env*` with `!.env.example`; `:51` adds `.env*.local`; `.claude/` is ignored at `:45` and other agent tooling at `:47-49`.
- **`git ls-files | grep -i env` returns exactly one path: `.env.example`.** No `.env`, `.env.local`, `.env.production` or similar has ever been tracked in the reachable history.
- **The regression guard is now on `main`** — `src/lib/security/__tests__/no-hardcoded-secrets.test.ts`, commit `7b85e8f` *"test: fail the build if a real credential reaches the tracked tree"*, confirmed in `git ls-tree -r HEAD`. Last run flagged as LOW that this file existed only on an unmerged branch; it has since landed. This is the durable fix for the VGC-305 class and it is now a CI gate.
- **VGC-305 itself could not be re-verified** — see P0-3. The shallow clone does not reach the introducing commit.

---

## Changed since 26-10-26

### Fixed — three of five prior code findings, plus the only live dependency high

- **HIGH-1 `team-graphic` visibility + redaction — FIXED, both halves, verified.** `src/app/api/team-graphic/route.tsx` is rewritten. The query now selects `is_public, is_unlisted, owner_id` (`:55-58`); public and unlisted render by link; a private report resolves the Clerk `userId` and requires owner **or** accepted collaborator (`:71-91`) and otherwise returns **404, never 403**, so the endpoint cannot confirm that a share id exists. The prior finding warned that adding only the visibility predicate would leave exploit path A (redaction bypass on *public* reports) fully open — and the fix did not make that mistake: redaction moved **into** `renderTeamGraphic` (`src/lib/sharing/team-graphic-image.tsx:85-94`, `redactPasteFields` under a comment naming VGC-142), so the route *and* the new Blob card both inherit it. `graphicCacheControl` (`:22-28`) is a thoughtful extra: private reports get `private, no-store` so a PNG never lands in a shared cache, and unlisted gets a 30 s window because `cacheDel` cannot purge Vercel's CDN. **Closed properly after four consecutive runs.** Also fixes the "legacy `?key=` edit token must not unlock a graphic" concern explicitly (`:66-69`).
- **MEDIUM-1 `apiGuard` chunked-body bypass — FIXED, verified.** `src/lib/security/api-guard.ts:52-73` now treats `Content-Length` as a cheap fast-reject only (`parseInt(… ?? "", 10)` + `Number.isFinite`, so a missing header is *unknown* rather than `0`), then **measures the body for real** via `readBodyWithLimit` (`:89-116`), which streams and aborts the moment the byte count exceeds the cap, and buffers the bytes back onto the request (`attachBufferedBody`) so callers keep using `request.text()`/`request.json()` unchanged. This fixes the cap for every caller at once — including the two routes (`share`, `user/drafts`) that previously relied on the header alone. The comment at `:52-58` records the reasoning.
- **Root `zod` bumped 4.3.6 → 4.6.6 — the prior run's only production-reachable high is gone.** `package.json` now declares `"zod": "^4.6.6"`, past GHSA-mrhx-c7xc-m3w5's `<4.6.6` range. The ~40 route validators are patched. `share/route.ts:44-45` additionally added `.max(2)` bounds on `commonModes.combinations[].leads`/`back` with a comment citing the GHSA as defence in depth. Only the nested `@vercel/cli-config` copy remains (P1-1).
- **The hardcoded-secrets regression test landed on `main`** (`7b85e8f`), closing last run's LOW.

### Still open — unchanged, re-verified byte-for-byte

- **HIGH-2 creator-profile takeover** → now P0-2.
- **MEDIUM-2 view-count inflation via client-chosen `sessionId`** → now P2-1.
- **LOW-1 `/api/user/export` fail-open rate limit** → now P2-2.
- **P0 VGC-305 Discord webhook rotation** → P0-3, operator action, not re-verifiable here.
- All informational items from 26 Oct re-read and still accurate (P2-6).

### New

- **P0-1 — og:image Blob card is not revoked on flip-to-private.** Introduced by `e4d9354` *"feat: pre-render the shared-report og:image card to Vercel Blob (#89)"*. The feature is otherwise well built — it honours `privateFields`, it refuses to publish a card for a private report, it fingerprints the card so no-op autosaves skip the render, it locks the backfill so a crawler burst renders once, and it deletes the card on soft-delete. The gap is exactly one call site: the PATCH visibility toggle.
- **P2-5 — unbounded `/api/explore` cache-key cardinality.**
- **Audit volume 9 → 30 nodes, entirely dev-side.** The lockfile moved (`package.json`/`package-lock.json` are both on the main-changed list): `eslint-config-next` is now 16.1.6 and `cypress` 15.18.0, which pulled in the 15-node `minimatch` fanout and the `systeminformation` advisories, while `start-server-and-test → wait-on → axios` surfaced `follow-redirects` and `joi` — the last two being the same dev-only paths VGC-300 described, now actually flagged. **Production-reachable advisory count did not change: one high plus one moderate, both unreachable with attacker-controlled input.** The headline number is 3.3× worse and the real risk is slightly better.
- **VGC-300 disposition unchanged from 26 Oct: close it as stale.** Its `axios`/`joi` "dev-only" guesses are now confirmed by live advisories on exactly the paths it predicted. `sharp@0.35.5` is still an unused `next` optionalDependency (no `next/image` anywhere, `remotePatterns: []`); `undici` is still loaded-not-invoked via `cheerio`'s eager require, and switching `src/lib/import/limitless.ts:1` to `cheerio/slim` would drop it from the prod tree entirely — a one-line, zero-risk hardening still worth doing.

### Conflict-risk summary

Files recommended for change that appear on `.swarm/main-changed-files.md`:

| File | Finding |
|---|---|
| `src/app/api/user/reports/[shareId]/route.ts` | **P0-1** |
| `src/lib/sharing/og-image.ts` | **P0-1** |
| `package.json`, `package-lock.json` | **P1-1**, dev-only `npm audit fix` |
| `src/app/api/explore/route.ts` | P2-5 |

Not on the list (safe to change): `src/app/api/user/profile/route.ts`, `src/app/api/creator/[name]/route.ts`, `src/app/api/views/[shareId]/route.ts`, `src/app/api/user/export/route.ts`, `next.config.ts`, `src/lib/import/limitless.ts`.

---

## Summary table

| # | Severity | Finding | File:line | Status | Proven? | conflict_risk |
|---|---|---|---|---|---|---|
| P0-1 | **HIGH** | Flip-to-private does not revoke the public og:image Blob card | `user/reports/[shareId]/route.ts:84-96`; `lib/sharing/og-image.ts:68-78,100-106` | **NEW** | Proven in code | **true** |
| P0-2 | **HIGH** | Creator-profile takeover via editable Clerk display name | `user/profile/route.ts:71-95` | KNOWN, unchanged | Proven | false |
| P0-3 | **CRITICAL (exposure)** | VGC-305 Discord webhook token in public git history | `feedback/route.ts:10` @ `5da513a` (outside shallow clone) | KNOWN, **not re-verified** | Prior runs only | false |
| P1-1 | HIGH (dep) | `zod@4.1.11` nested under `@vercel/blob`; prod tree, input not attacker-controlled | `package.json` `overrides` | **NEW node**, root zod fixed | Advisory + path traced | **true** |
| P1-2 | MODERATE (dep) | `@opentelemetry/core <2.8.0`; prod tree, Baggage path unused | `package.json` | KNOWN, unchanged | Advisory; unreachable | false |
| P2-1 | MEDIUM | View counts inflatable via client-chosen `sessionId` | `views/[shareId]/route.ts:12,40` | KNOWN, unchanged | Proven in code; abuse unverified | false |
| P2-2 | LOW | `/api/user/export` rate limit fails open without Upstash | `user/export/route.ts:6-21` | KNOWN, unchanged | Proven | false |
| P2-3 | LOW | CSP keeps `'unsafe-inline'` in `script-src` in production | `next.config.ts:5` | KNOWN | N/A | false |
| P2-5 | LOW | Unbounded `/api/explore` cache-key cardinality | `explore/route.ts:24,43` | **NEW** | Proven in code | **true** |
