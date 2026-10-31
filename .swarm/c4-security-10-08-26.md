# C4 — Security Audit (read-only)

**Date:** 2026-08-10 · **Agent:** C4 (overnight swarm) · **Commit:** `a70d924`
**Scope:** `npm audit`, repo-wide secret scan, OWASP review of 51 `src/app/api/**/route.ts` files, webhook signature verification.
**Nothing was modified.** No commits, no pushes.

---

## 0. P0 — Hardcoded secrets

**NONE FOUND.** This is a clean result, stated first as required.

What was scanned and what it turned up:

| Scan | Result |
|------|--------|
| Working tree (excl. `node_modules`, `.next`, `package-lock.json`) for `sk_live_/sk_test_/pk_*`, `whsec_`, `lin_api_`, `phc_/phx_`, `xoxb-`, `ghp_/github_pat_`, `AKIA…`, `AIza…`, `-----BEGIN … PRIVATE KEY-----`, `postgres(ql)://`, `redis(s)://`, `mongodb://`, Discord webhook URLs, JWT triplets, `Bearer <20+ chars>` | Only placeholders |
| `(api_key\|secret\|token\|password\|credential\|signing_secret\|bearer)\s*[:=]\s*"…"` with 8+ char literal | 3 hits, all test fixtures |
| High-entropy (32+ char) string literals in non-`.md` source | 1 hit, a **public** key (below) |
| **Full git history** (`git log --all -p`) for the same high-signal patterns | Only placeholders + prior `.swarm` audit prose |

Non-findings, explicitly cleared:

- `.env.example:10` `postgresql://user:password@host/database` — placeholder.
- `.env.example:34` `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_xxxx…` — placeholder, and a PostHog *project* token is public by design.
- `docs/STRIPE_PAID_REPORTS_ARCHITECTURE.md:335-338` — `sk_test_...` / `whsec_...` ellipses in a design doc.
- `src/lib/__tests__/cron-auth.test.ts:24,32,38` — `process.env.CRON_SECRET = "my-secret"` test fixture.
- `src/app/api/discord/route.ts:7` `DISCORD_PUBLIC_KEY = "44b2cb…"` — this is Discord's **Ed25519 verification public key**, which is published in the Discord developer portal and is *meant* to be distributed. Not a secret. See Finding 9 for the (minor) hygiene note.
- `.claude/scripts/linear.sh` — resolves `LINEAR_API_KEY` / `DISCORD_BUILDS_WEBHOOK` from env with an `.env.local` fallback; no literals. (`.claude/` is gitignored regardless.)

`.gitignore` correctly does `.env*` with a single `!.env.example` allowlist, plus `*.pem`. No `.env`/`.env.local` exists in the container.

---

## 1. `npm audit`

**19 vulnerabilities: 0 critical · 9 high · 10 moderate · 0 low.**
Production-only (`--omit=dev`): **14** — 4 high, 10 moderate. The other 5 (all high) are dev-only toolchain.

### 1a. Fixable with a non-breaking bump (`npm audit fix`) — 13 packages

| Package | Sev | Advisory | Reaches prod? |
|---|---|---|---|
| `undici` 7.28.0 | high | GHSA-8xcm-r25x-g524, -4cwx-7wf7-3272, -m8rv-5g2x-5cg5, -jr45-8vmc-qm54, -v3r7-h72x-cjcm | No — via `jsdom` (test) |
| `js-yaml` 4.3.0 | high | GHSA-5p4m-2wfm-xmqj (quadratic CPU, `!!omap`) | No — via `eslint` |
| `systeminformation` 5.31.6 | high | GHSA-5xpp-75jx-m839 (**OS command injection**, `networkInterfaces()`) | No — via `cypress` |
| `axios` 1.16.0 | high | 10 advisories incl. GHSA-mmx7-hfxf-jppx, -xj6q-8x83-jv6g (prototype-pollution → Basic-auth injection) | No — via `start-server-and-test` → `wait-on` |
| `brace-expansion` | high | GHSA-mh99-v99m-4gvg, -rgw5-rvv9-x895, -3jxr-9vmj-r5cp (DoS) | No — via `@typescript-eslint` |
| `nanoid` 3.3.15 | high | GHSA-28wg-ghj8-5hjv, -2v37-7h3g-55p8 (infinite loop) | **Yes** — via `postcss` ← `next`/`@tailwindcss/postcss` |
| `dompurify` 3.4.11 | mod | GHSA-c2j3-45gr-mqc4, **GHSA-55q2-fjhq-7xh7 (XSS)** | **Yes** — via `jspdf` + `posthog-js` |
| `protobufjs` 7.6.4 | mod | GHSA-j3f2-48v5-ccww (DoS in `.proto` parsing) | **Yes** — via `@opentelemetry/otlp-transformer` |
| `@opentelemetry/resources` | mod | (transitive of `core`) — `^2.6.1`, fix is 2.8.0, in-range minor | **Yes** |
| `@opentelemetry/sdk-metrics` | mod | ditto | **Yes** |
| `@opentelemetry/sdk-trace-base` | mod | ditto | **Yes** |
| `@opentelemetry/otlp-transformer` | mod | ditto | **Yes** |
| `@opentelemetry/otlp-exporter-base` | mod | ditto | **Yes** |

### 1b. Requires a version bump outside the stated range — 4 packages

| Package | Sev | What's needed | Notes |
|---|---|---|---|
| `next` 16.2.6 | high | → **16.3.0** | npm reports `isSemVerMajor: **false**`. It only reads as "breaking" because `package.json` pins `next` **exactly** (`"next": "16.2.6"`, no caret). Editing the pin is the whole fix. Clears **9 Next.js advisories** — middleware/proxy bypass (GHSA-6gpp-xcg3-4w24), SSRF in Server Actions (-89xv-2m56-2m9x), SSRF via rewrite destination (-p9j2-gv94-2wf4), 2× cache confusion (-68g3-v927-f742, -4633-3j49-mh5q), Server-Action DoS (-m99w-x7hq-7vfj), unbounded Edge payload (-4c39-4ccg-62r3), image-optimizer SVG DoS (-q8wf-6r8g-63ch), unauth disclosure of Server Function endpoints (-955p-x3mx-jcvp) — **plus** `postcss` (4 advisories incl. 2× arbitrary `.map` file read, CVSS 7.5) and `sharp` (4 libvips CVEs), both of which are pinned by `next`. |
| `postcss` ≤8.5.22 | high | via `next@16.3.0` | GHSA-fxqj-rqcc-2cmp, -r28c-9q8g-f849, -6g55-p6wh-862q, -qx2v-qp2m-jg93 |
| `sharp` <0.35.0 | high | via `next@16.3.0` | GHSA-f88m-g3jw-g9cj |
| `@opentelemetry/sdk-logs` + `@opentelemetry/exporter-logs-otlp-http` 0.214 | mod | → **0.221.0** — genuine `0.x` major | The only true breaking upgrade in the tree. Fixes GHSA-8988-4f7v-96qf in `@opentelemetry/core` (unbounded memory alloc in W3C Baggage propagation, CVSS 5.3) and transitively resolves the other 6 OTel moderates. Used only by `src/instrumentation.ts` for PostHog log export. |

### 1c. Ticket accuracy check

**VGC-248 — "12 moderate vulns needing breaking upgrades": STALE on both halves.**
- Count: there are **10** moderate, not 12.
- Framing: only **2** of them (`@opentelemetry/sdk-logs`, `@opentelemetry/exporter-logs-otlp-http`) actually need a breaking major. The other 8 moderates — 6 OTel transitives, `dompurify`, `protobufjs` — clear on a plain `npm audit fix`. Recommend re-scoping the ticket to "bump the two OTel `0.x` packages to 0.221.0" and splitting the plain `audit fix` out as a no-risk chore.

**VGC-221 — "Clerk major bump for js-cookie advisories": OBSOLETE, recommend close.**
- `@clerk/nextjs` is already at **7.5.9** (satisfying `^7.3.2`), pulling `@clerk/shared@4.22.0` → `js-cookie@3.0.7`.
- `js-cookie` appears **nowhere** in today's advisory set. There is no open js-cookie advisory against 3.0.7, and no Clerk major bump is required for it. Verify against the ticket's original advisory ID and close.

> Note: the two tickets were verified against `npm audit` output only. The Linear MCP server is unauthorized in this session, so ticket bodies could not be read directly and the tickets were **not** updated.

---

## 2. OWASP review — `src/app/api/**/route.ts` (51 routes)

### 2.0 What came back clean (the important negatives)

**SQL injection — none.** Every DB call in the repo goes through `getDb()` → `@neondatabase/serverless`'s tagged template. There is **no** `sql.query(...)`, no `sql.unsafe(...)`, no `sql(someString)`, and no string-concatenated query anywhere in `src/`. Every `${}` in a `sql` template is a bind parameter.

The one construct worth calling out is `src/app/api/explore/route.ts:94-120`, which composes `sql` fragments (`ftsCondition`, `speciesCondition`, `excludeSpeciesCondition`, `followingCondition`) into an outer template. I verified against the installed driver that this nests correctly rather than stringifying:

```
sql`SELECT 1 WHERE 1=1 ${sql`AND x = ${1}`}`
  → {"strings":["SELECT 1 WHERE 1=1 ",""],
     "values":[{"queryData":{"strings":["AND x = ",""],"values":[1]}}]}
```

The inner fragment stays a parameterised object. User input in that file is additionally hardened — the FTS query is stripped to `\w` before `to_tsquery` (`:82`), `sort` is checked against an allowlist (`:26`), `limit` is clamped 1–50 (`:23`). Clean.

**IDOR — none found.** I traced every route that takes a resource identifier. All of them scope to the caller. Representative:

| Route | Ownership predicate |
|---|---|
| `share/[id]` GET | owner/collaborator branch first; outsiders 404 unless `is_public` or `is_unlisted` (`:200`). Edit token only ever returned to owner/collaborator. |
| `share/route.ts` POST | requires auth (`:108`); `edit_token` is explicitly **not** authorization — owner/collaborator re-checked at `:151-166`; visibility change is owner-only (`:278`) |
| `share/[id]/versions` GET+POST | owner-or-accepted-collaborator (`:43-53`, `:122-132`) |
| `share/[id]/versions/[version]` GET | same (`:48-58`) |
| `share/[id]/collaborators` | GET owner-or-collab; POST/PATCH/DELETE owner-only (`:89`, `:175`, `:206`) |
| `user/collaborations` POST | accept/decline requires an existing **pending** row for `${userId}` (`:90-96`) — no self-grant |
| `user/reports/[shareId]` PATCH/DELETE | `AND owner_id = ${userId}` in the UPDATE/DELETE itself (`:42`, `:63`, `:109`) |
| `sync/[id]` SSE | owner-or-accepted-collaborator before the stream opens (`:79-93`) |
| `changelog/[shareId]` | owner-or-accepted-collaborator (`:27-41`) |
| `match-log` DELETE | `AND user_id = ${userId}` (`:91`) |
| `user/collections/[id]`, `/collections`, `/drafts`, `/saved`, `/notifications`, `/feed`, `/analytics`, `/export`, `/delete` | all `user_id`/`owner_id = ${userId}` scoped |

**SSRF — none.** Both user-URL-fetching routes are correctly allowlisted:
- `pokepaste/route.ts:13-22` — zod `.url()` + `new URL(val).hostname === "pokepast.es"`, then **rebuilds** the fetch target as `https://pokepast.es${basePath}` from the parsed `pathname` (`:52-54`), so even `https://pokepast.es//evil.com` cannot redirect the host. `redirect: "manual"` on the POST path (`:156`).
- `sprite/route.ts:40-45` — host allowlist (`play.pokemonshowdown.com`) **and** path prefix (`/sprites/`), 3 s abort.

**Cron/admin auth — all correct.** `cron-auth.ts` and `auth/verify-bearer.ts` both fail closed when the env var is unset and use `timingSafeEqual` behind a length check. Applied on `/api/cron/*` (4), `/api/keep-alive`, `/api/cleanup` (both handlers), `/api/setup`, `/api/migrate`, `/api/bot`. `/api/setup` and `/api/migrate` — the two routes that can rewrite the whole `shares` table — are both gated on `MIGRATE_SECRET`.

**Rate limiting — present on 44/51 routes.** The 7 without `apiGuard` are the 4 cron routes, `keep-alive`, `cleanup`, `setup`, `migrate`, `bot` and the 3 webhooks — all secret-authenticated, so a rate limit adds little. But see Finding 1: the limiter's *key* is spoofable.

---

### Finding 1 — HIGH — Spoofable client IP → any comment deletable by an unauthenticated attacker, and a global rate-limit bypass

**Where:** `src/lib/security/input-validation.ts:53-63` (root cause) · exploited at `src/app/api/comments/flag/route.ts:36` · amplifies `src/lib/security/api-guard.ts:32`

```ts
// input-validation.ts:54-60
const forwarded = request.headers.get("x-forwarded-for");
if (forwarded) {
  for (const part of forwarded.split(",")) {
    const ip = normalizeIp(part);
    if (ip && isValidIp(ip)) return ip;   // ← first (LEFT-most) wins
  }
}
const realIp = normalizeIp(request.headers.get("x-real-ip") ?? "");  // never reached if XFF present
```

`X-Forwarded-For` is append-only: a proxy appends the peer address to whatever the client sent. The **left-most** entry is therefore the least trustworthy value in the header — it is pure client input. Behind exactly one trusted proxy the correct pick is the **right-most** entry (or the platform header). Worse, the loop returns on the first *syntactically valid* IP, so `x-real-ip` at `:62` is dead whenever a spoofed XFF is present.

**Exploit A — delete any comment on any public report, unauthenticated.**
`comments/flag/route.ts:36` derives the anti-abuse identity as `ip:${getClientIp(request)}` for signed-out callers. `comment_flags` is `UNIQUE(comment_id, session_id)` (`src/lib/db.ts:63-69`), and `FLAG_THRESHOLD = 3` (`:9`) hard-deletes the comment (`:66-67`). So:

```
POST /api/comments/flag  {"commentId":123,"sessionId":"a"}   X-Forwarded-For: 1.1.1.1
POST /api/comments/flag  {"commentId":123,"sessionId":"b"}   X-Forwarded-For: 2.2.2.2
POST /api/comments/flag  {"commentId":123,"sessionId":"c"}   X-Forwarded-For: 3.3.3.3
→ DELETE FROM comments WHERE id = 123
```

Three requests, no account, arbitrary comment IDs enumerable from the public `GET /api/comments/{shareId}`. The `flag` rate limit (`max: 10`) is keyed on the *same* spoofed value, so it never engages. The code comment at `:30-36` states the intent — "derive the flag identity from an authenticated source, NOT the client-supplied sessionId" — but the IP fallback is equally client-supplied.

**Exploit B — total rate-limit bypass.** `apiGuard` keys every limiter as `${key}:${getClientIp(request)}`. Rotating XFF gives an attacker unlimited quota on every anonymous endpoint: `share` (20/min report writes), `pokepaste`/`pokepaste-create` (the outbound proxy to pokepast.es — an amplification/abuse vector against a third party), `comments` (5/min), `views`, `reactions`, `explore`. Rate limiting is the *only* abuse control on those routes.

**Minimal fix** — in `getClientIp`, prefer the platform-set header and take the right-most XFF entry:

```ts
export function getClientIp(request: Request): string {
  const vercel = normalizeIp(request.headers.get("x-vercel-forwarded-for") ?? "");
  if (vercel && isValidIp(vercel)) return vercel;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    for (let i = parts.length - 1; i >= 0; i--) {      // right-most = nearest trusted proxy
      const ip = normalizeIp(parts[i]);
      if (ip && isValidIp(ip)) return ip;
    }
  }
  // …x-real-ip / fingerprint fallback unchanged
}
```

Additionally harden `comments/flag`: require `userId` for a flag to count toward the threshold (keep IP flags as report-only), or raise the threshold to something an IP-rotating attacker can't reach cheaply. Regression test should name the bug: forged left-most XFF must not change the derived identity.

---

### Finding 2 — MEDIUM/HIGH — Creator-profile takeover via display-name collision

**Where:** `src/app/api/user/profile/route.ts:71-95` · read back at `src/app/api/creator/[name]/route.ts:62`

```ts
// :71-73 — identity is a DISPLAY NAME, not the Clerk user id
const creatorName = user.firstName
  ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
  : user.username || "Unknown";
// :84-94
INSERT INTO creator_profiles (name, bio, twitter, discord, youtube, is_public, accent_theme, avatar_url, …)
VALUES (${creatorName}, …)
ON CONFLICT (name) DO UPDATE SET bio = …, twitter = …, discord = …, youtube = …, avatar_url = …
```

`creator_profiles.name` is the PRIMARY KEY (`src/lib/db.ts:74-82`) and there is no `user_id` column and no ownership check. Clerk first/last name is freely user-editable.

**Exploit:** attacker sets their Clerk profile name to a well-known player's name, calls `PUT /api/user/profile` once, and **overwrites that creator's public bio, Twitter, Discord, YouTube and avatar URL**. `/creator/[name]` serves the hijacked profile to everyone (`creator/[name]/route.ts:74-80`), and it is served next to the `verified_creators` badge computed at `:61-65` — a verified creator's page can display attacker-supplied links. Setting `isPublic: false` also lets an attacker blank out a real creator's page entirely (`creator/[name]/route.ts:68-72`). The response is then cached for 60 s at the edge and in Redis, so it sticks.

Related asymmetry: the write matches on exact `name` (PK) while every read matches `LOWER(name) = …`, so `wolfe glick` and `Wolfe Glick` are separate rows on write but collide on read — non-deterministic which one a reader gets.

**Minimal fix:** add `owner_user_id TEXT` to `creator_profiles`, set it on first insert, and make the upsert `ON CONFLICT (name) DO UPDATE … WHERE creator_profiles.owner_user_id = ${user.id}` — a colliding name then no-ops instead of overwriting. Backfill existing rows from the owning share's `owner_id`. Longer term, key profiles on the Clerk user id and treat the display name as a label.

---

### Finding 3 — MEDIUM — CORS allowlist admits attacker-registrable `*.vercel.app`, with `Allow-Credentials: true`

**Where:** `src/lib/security/cors.ts:20-24, 33` · consumed at `src/proxy.ts:87, 104, 119`

```ts
// cors.ts:22
if (/^https:\/\/vgc-team-report[a-z0-9-]*\.vercel\.app$/.test(origin)) return true;
// cors.ts:33
"Access-Control-Allow-Credentials": "true",
```

The `[a-z0-9-]*` wildcard matches `https://vgc-team-report-anything.vercel.app`. Vercel project subdomains are first-come globally — any Vercel user can claim `vgc-team-report-evil` and obtain a matching origin. That origin then gets:

1. Its `Origin` echoed into `Access-Control-Allow-Origin` alongside `Allow-Credentials: true` (`proxy.ts:119`) → credentialed cross-origin **reads** of every API response.
2. A pass on the origin block at `proxy.ts:87`.
3. A pass on CSRF, because `isTrueCrossOrigin` at `proxy.ts:104` is `origin && !isAllowedOrigin(request)` — an allowlisted attacker origin is treated as first-party and `validateCsrf` never runs.

**Severity caveat, stated honestly:** exploitability of (1) and (3) depends on the Clerk session cookie's `SameSite`. With Clerk's default `Lax` (no satellite/`cookieDomain` config exists in this repo), a cross-site `fetch(…, {credentials:'include'})` will not attach `__session`, which blunts the credentialed-read and CSRF paths to *unauthenticated* API access. That is why this is Medium and not High. It becomes **High** the moment Clerk is configured with satellite domains or `SameSite=None` — the regex is a latent trapdoor either way, and it currently also defeats the anti-scraping intent of the origin block.

**Minimal fix:** anchor the preview pattern to Vercel's actual deployment-URL shape, which includes the team scope:

```ts
if (/^https:\/\/vgc-team-report-[a-z0-9]+-mss23s-projects\.vercel\.app$/.test(origin)) return true;
```

Or drop dynamic previews from the allowlist and enumerate them explicitly. Independently, do not send `Access-Control-Allow-Credentials: true` on routes that don't need it.

---

### Finding 4 — MEDIUM — `creatorName` is unauthenticated free text: follower-notification spoofing and creator-page injection

**Where:** `src/app/api/share/route.ts:517-519` → `src/lib/notifications.ts:41-47` · surfaced at `src/app/api/creator/[name]/route.ts:46`

`state.creatorName` is a plain `z.string().optional()` (`share/route.ts:40`) supplied by the client, never checked against the caller's identity. On publish:

```ts
// share/route.ts:517
if (isPublic && !isUnlisted && state.creatorName) {
  notifyFollowers(state.creatorName as string, id, ownerId ?? undefined);
}
// notifications.ts:42-47
INSERT INTO notifications (user_id, type, source_share_id, source_user_name, message)
SELECT user_id, 'new_report', ${shareId}, ${creatorName}, ${message}
FROM follows WHERE creator_name = ${creatorName} …
```

**Exploit:** publish a report with `creatorName: "<popular player>"`. Every follower of that player receives an in-app notification reading *"\<popular player\> published a new team report"* linking to the attacker's report. The report simultaneously appears on `/creator/<popular player>` because the creator query matches on `data->>'creatorName' ILIKE ${creatorName}` — next to that creator's verified badge. Rate limit is 20 `share` writes/min, and Finding 1 removes even that.

**Minimal fix:** on publish, only call `notifyFollowers` when `creatorName` case-insensitively equals the caller's own Clerk display name (or, better, resolve followers by `owner_id` rather than by name). Gate the creator-page listing the same way, or render an "unverified attribution" marker when `data->>'creatorName'` doesn't match the share's `owner_id` display name.

---

### Finding 5 — LOW/MEDIUM — Production CSP allows `script-src 'unsafe-inline'`

**Where:** `next.config.ts:3-17, 116`

```ts
const scriptSources = ["'self'", "'unsafe-inline'", …].join(" ");
```

`'unsafe-eval'` is correctly dev-only, but `'unsafe-inline'` ships to production, so CSP provides no defence-in-depth against injected inline script. Everything else in the header block is strong — `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, HSTS with preload, `X-Content-Type-Options: nosniff`, a tight `Permissions-Policy`. No stored-XSS sink is currently reachable (only 3 `dangerouslySetInnerHTML` uses: a static theme bootstrap in `layout.tsx:102`, changelog copy, and `JsonLd.tsx:5` which escapes `</script>`; comment and profile text is `escapeHtml`'d at write time), so this is hardening rather than an active hole.

**Minimal fix:** the inline script at `layout.tsx:102` is the only real blocker — give it a per-request nonce and replace `'unsafe-inline'` with `'nonce-…' 'strict-dynamic'`.

---

### Finding 6 — LOW — Comments are readable on non-public reports

**Where:** `src/app/api/comments/[shareId]/route.ts:42-58`

`GET /api/comments/{shareId}` selects straight from `comments` with no visibility check. The POST handler does check `is_public = TRUE AND deleted_at IS NULL` (`:111`), so comments can only be *created* on public reports — but a report later flipped to private/unlisted, or soft-deleted, keeps serving its comment thread (author display names and bodies) to anyone who knows the 8-char share id.

**Minimal fix:** join `shares` in the GET and require `is_public = TRUE AND deleted_at IS NULL`, mirroring the POST.

---

### Finding 7 — LOW — The CSRF middleware branch is unreachable

**Where:** `src/proxy.ts:100-113` vs `:87`

`:87` already 403s any API request whose origin fails `isAllowedOrigin`, for everything except `/api/discord` (early-returned at `:14`), `/api/webhooks/*`, `/api/builder/*` and `/api/setup`. `:104` then computes `isTrueCrossOrigin = origin && !isAllowedOrigin(request)` — which can only be true for those same exempt paths, and `/api/sync` + `/api/keep-alive` are excluded at `:100`. So `validateCsrf` effectively never executes for any real user route; CORS origin-blocking is the sole CSRF control. That is defensible on its own, but the code reads as though there were two layers when there is one — and Finding 3 punches through the one.

**Minimal fix:** either delete the dead branch and document CORS as the CSRF control, or invert it to enforce the double-submit token on all state-changing API requests that carry an `Origin` header.

---

### Finding 8 — LOW — Client-supplied `sessionId` makes views and reactions trivially inflatable

**Where:** `src/app/api/views/[shareId]/route.ts:12, 37` · `src/app/api/reactions/[shareId]/route.ts:14, 87-101`

Both dedupe on a `sessionId` the client picks (`z.string().min(1)`). Rotating it inflates `view_count` and like counts without limit, which drives the Explore "popular" sort and the spotlight/creator stats. The owner self-like guard (`reactions:80`) is bypassed simply by signing out. Combined with Finding 1's rate-limit bypass there is no ceiling.

**Minimal fix:** dedupe on `hash(clientIp + shareId)` once Finding 1 makes the IP trustworthy, or require auth for reactions.

---

### Finding 9 — LOW / informational — `/api/discord`

**Where:** `src/app/api/discord/route.ts:7, 85-89, 364-370`

- `DISCORD_PUBLIC_KEY` is hardcoded. Not a secret (it is Discord's published Ed25519 verification key), but moving it to an env var would avoid a code change + redeploy if the Discord app is ever recreated.
- `hexToUint8` (`:364`) does not validate that `signature` is well-formed hex of the right length. A malformed `x-signature-ed25519` yields a wrong-sized array and `nacl.sign.detached.verify` throws, escaping the try block that starts at `:124` → uncaught 500 instead of a clean 401. Cosmetic, but it turns a probe into an error-log spike.

Positives worth recording: signature verification runs before any body handling (`:85`), and mutating commands (`approve`/`reject`) are gated on an explicit admin allowlist that **fails closed** when unconfigured (`:58`) — correctly recognising that a valid Discord signature proves origin, not identity.

---

### Finding 10 — Informational — `parseInt` of an untrusted cursor reaches the DB as `NaN`

**Where:** `src/app/api/comments/[shareId]/route.ts:46` — `id < ${parseInt(cursor, 10)}`. A non-numeric `?cursor=` binds `NaN`, which Postgres rejects → 500 rather than 400. Same shape at `user/notifications/route.ts:35-36` (`Number(...)` on `limit`/`offset`; `limit` is clamped by `Math.min` but `offset` is not, and neither rejects `NaN`). No injection — purely parameter binding — but worth a guard.

---

## 3. Webhook signature verification

| Webhook | Verdict |
|---|---|
| **Clerk** — `src/app/api/webhooks/clerk/route.ts` | **Correct.** Delegates to Clerk's own `verifyWebhook(request)` (`:38`), which does Svix HMAC + timestamp tolerance over the raw body. Fails closed when `CLERK_WEBHOOK_SIGNING_SECRET` is unset (`:29-32`), and returns 400 on verification failure. The deliberate `status: 200` at `:73` is *after* verification and only covers handler errors (so Clerk doesn't disable the endpoint / resend welcome emails) — correctly scoped, and documented in-line. |
| **Linear** — `src/app/api/webhooks/linear/route.ts` | **Correct.** HMAC-SHA256 over the **raw** body (`:25, 49-51`), equal-length check then `timingSafeEqual` (`:54-57`), fails closed with 401 when the secret is unset (`:35-37`), 400 on missing signature, 401 on mismatch. Accepts both `LINEAR_WEBHOOK_SIGNING_SECRET` and the legacy `LINEAR_WEBHOOK_SECRET`. **One gap (low):** no replay protection — Linear ships a `webhookTimestamp` in the payload and recommends rejecting anything older than ~60 s. A captured valid request can be replayed indefinitely. Currently harmless (the handler only echoes `url_verification` challenges and returns `{ok:true}`), but it should be added before this webhook is given side effects. |
| **PostHog** — `src/app/api/webhooks/posthog/route.ts:170-186` | **Weakest of the three, though acceptable given PostHog's capabilities.** It is a **static shared bearer token** (`x-posthog-token` vs `POSTHOG_WEBHOOK_SECRET`), not a signature over the body — PostHog webhook destinations don't sign, so this is the available option. Comparison is length-checked + `timingSafeEqual` (`:180-185`) and fails closed when the secret is unset (`:175-178`). Consequences of the weaker scheme: (a) the token is replayable and body-independent, so anyone who obtains it can forge arbitrary Linear issues and Discord posts (`:255-296`) — note the handler pushes `LINEAR_API_KEY`-authenticated `issueCreate` mutations; (b) the length pre-check leaks the secret's length; (c) no timestamp binding. The dedup map at `:144-168` is per-Lambda-instance and explicitly best-effort, so it is not an abuse control. **Recommended:** configure PostHog to send a long random token (≥32 bytes), rotate it, and rate-limit the route — it is one of the few unauthenticated-by-Clerk endpoints with no `apiGuard`. |

All three correctly read the raw body before parsing, and none parse-then-verify.

---

## 4. Summary table

| # | Sev | Finding | File:line |
|---|---|---|---|
| — | **P0** | **Hardcoded secrets — NONE FOUND** (working tree + full git history) | — |
| 1 | High | Spoofable left-most XFF → any comment deletable in 3 unauth requests; global rate-limit bypass | `src/lib/security/input-validation.ts:53-63`; `src/app/api/comments/flag/route.ts:36` |
| 2 | Med/High | Creator-profile takeover via Clerk display-name collision | `src/app/api/user/profile/route.ts:71-95` |
| 3 | Medium | CORS regex admits attacker-registrable `*.vercel.app` + `Allow-Credentials: true`; also bypasses CSRF | `src/lib/security/cors.ts:22,33`; `src/proxy.ts:87,104` |
| 4 | Medium | Unauthenticated `creatorName` → follower-notification spoofing + creator-page injection | `src/app/api/share/route.ts:517`; `src/lib/notifications.ts:42` |
| 5 | Low/Med | `script-src 'unsafe-inline'` in production CSP | `next.config.ts:5,116` |
| 6 | Low | Comments readable on private/unlisted/deleted reports | `src/app/api/comments/[shareId]/route.ts:42-58` |
| 7 | Low | CSRF middleware branch unreachable (dead defence) | `src/proxy.ts:100-113` |
| 8 | Low | Client-chosen `sessionId` → view/like stuffing | `views/[shareId]:37`; `reactions/[shareId]:87` |
| 9 | Low | Discord public key hardcoded; unvalidated hex → 500 not 401 | `src/app/api/discord/route.ts:7,364` |
| 10 | Info | `parseInt`/`Number` of untrusted cursor/offset binds `NaN` → 500 | `comments/[shareId]:46`; `user/notifications:35-36` |
| 11 | Low | Linear webhook has no replay/timestamp check | `webhooks/linear/route.ts:49-59` |
| 12 | Low | PostHog webhook uses a static bearer token, not a body signature; no rate limit | `webhooks/posthog/route.ts:170-186` |

**Suggested order of work:** Finding 1 (one function, closes an unauthenticated destructive action) → `next` pin 16.2.6 → 16.3.0 (clears 11 high advisories in one line) → plain `npm audit fix` → Finding 2 → Finding 3 → Finding 4.

---

*Integration note: the Linear MCP server is unauthorized in this session, so no tickets were read, created or updated. VGC-248 and VGC-221 were assessed from `npm audit` evidence alone and need manual follow-up in Linear.*
