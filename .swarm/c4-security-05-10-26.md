# C4 — Security Audit (read-only)

Date: 2026-10-05 · Repo: `/home/user/VGC-Team-Report` · Branch: `claude/loving-sagan-fxmby5`
Scope: `npm audit`, hardcoded-secret scan, OWASP review of 53 API route files, `src/lib/security/*` + `src/proxy.ts`.
Nothing in the repo was modified except this file. No outbound requests were made beyond `npm`/registry metadata.

## Headline

| | |
|---|---|
| Hardcoded secrets committed | **No** (every prefix hit is a placeholder or a test fixture) |
| `npm audit` totals | 1 critical · 12 high · 14 moderate · 1 low (28 total) |
| Confirmed app-logic findings | 1 × P0, 1 × P1, 1 × P2, 2 × P3, 4 × informational |
| Routes reviewed | 53 (`src/app/api/**/route.ts` + `route.tsx`) |

The codebase is, on the whole, **well hardened**. Cron routes, webhooks, `/api/migrate`, `/api/setup`, `/api/cleanup`, the whole `share/[id]/*` family, and every `user/*` route carry correct auth and ownership predicates. All SQL is parameterised. The findings below are the exceptions.

---

# P0 — `/api/team-graphic` serves private reports and bypasses tiered publishing

**Status: CONFIRMED** (traced end to end: route file, middleware, redaction module)
**File: `src/app/api/team-graphic/route.tsx:83-108`** (the query is line **96**)

```ts
export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "graphic", max: 10 } });
  if (guard) return guard;
  const shareId = url.searchParams.get("id");
  ...
  const rows = await sql`SELECT data FROM shares WHERE id = ${shareId} AND deleted_at IS NULL`;
```

No `auth()`. No `is_public` / `is_unlisted` predicate. No `privateFields` redaction. `grep -nE "is_public|is_unlisted|privateFields|auth\(\)|redact"` over the file returns **nothing**.

The route then renders into a PNG: full team paste (species, **item**, **ability**, **tera type**), `tournamentName`, `placement`, `record`, `creatorName` (lines 101-108, 232-242, 338-348, 394-422).

This is the same bug class as the private-report image leak fixed in PR #79, reoccurring in a sibling route.

### Exploit scenarios

**(a) Tiered-publishing bypass — needs no privileged knowledge.** VGC-142 ships a "Hide fields from public viewers" panel and the changelog promises *"server-side enforcement — bytes never leave the API for non-owners."* `src/lib/sharing/redact-paste.ts:21` defines the redactable set as `"evs" | "ivs" | "nature" | "item"`, and `src/app/api/share/[id]/route.ts:228` applies it for non-owners. `/api/team-graphic?id=<any public id>&style=wrapped` renders `item` and `ability` straight from the raw paste, so **any anonymous viewer can read the held items a creator marked private** on any public report. Share ids of public reports are listed by `/api/explore`.

**(b) Private-report disclosure.** A report flipped public → private (`is_public=false, is_unlisted=false`) returns 404 from `/api/share/[id]` (correctly, at line 200-202) but is still fully rendered by `/api/team-graphic?id=…`. The id was public while the report was listed (Explore, oembed, search-engine caches), so an attacker who noted it keeps read access to the team — *including edits made after it went private*, since the route reads live `data`. Unlisted reports are likewise exposed to anyone holding an old link, with `privateFields` stripped away.

### Mitigating factors (honest accounting)
- `proxy.ts` bot-detection applies to this path. `isSuspiciousRequest` (`src/lib/security/bot-detection.ts:105-125`) 403s an API request carrying none of `referer` / `origin` / `sec-fetch-mode`, and `isBlockedBot` blocks a `curl` UA. Both are trivially defeated by sending a browser UA plus `Referer: https://pokemonvgcteamreport.com/` — and they *must* stay defeatable, because `src/app/api/oembed/route.ts:41` advertises this URL as `thumbnail_url` to Discord/Slack unfurlers (which are in `ALLOWED_BOT_PATTERNS`).
- Rate limit is 10/min/IP, and ids are 8 chars from a 62-char alphabet (~2.2e14), so blind enumeration is not viable. Scenario (a) needs no enumeration at all; scenario (b) needs a previously-published id.

### Minimal fix
Mirror the `/api/share/[id]` logic. Add `is_public, is_unlisted` to the SELECT, resolve the caller, and for non-owners require visibility and apply redaction:

```ts
const { userId } = await auth().catch(() => ({ userId: null }));
const rows = await sql`
  SELECT data, is_public, is_unlisted, owner_id
  FROM shares WHERE id = ${shareId} AND deleted_at IS NULL`;
if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
const isOwner = !!userId && rows[0].owner_id === userId;
if (!isOwner && !rows[0].is_public && !rows[0].is_unlisted) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
const data = isOwner
  ? (rows[0].data as Record<string, unknown>)
  : applyPrivateFieldRedaction(rows[0].data as Record<string, unknown>).data;
```

(`applyPrivateFieldRedaction` currently lives in `src/app/api/share/[id]/route.ts:18-30` — lift it into `src/lib/sharing/` so both routes share one implementation and the next route to render a paste cannot miss it. Add a vitest regression test named for this bug per the repo convention.)

---

# P1 — `next@16.3.0`: critical advisories, one of them reachable

**Status: CONFIRMED reachable surface · fix is non-breaking**
`package.json:` `"next": "^16.3.0"`; installed **16.3.0**; vulnerable range `16.0.0 - 16.3.5`. **Direct** dependency. `fixAvailable: true` (not a semver-major). Latest 16.x is **16.3.8**, inside the existing `^16.3.0` range — so `npm i next@16.3.8` is a lockfile-only change.

Three critical advisories apply. Reachability differs:

| Advisory | Reachable? |
|---|---|
| GHSA-vcvr-r3jv-pc5j — RCE in `next/og` `ImageResponse` | **YES.** `next/og` is used in 6 places, including the unauthenticated edge route `src/app/api/team-graphic/route.tsx:1,125,375` and 5 `opengraph-image.tsx` files. `team-graphic` renders attacker-influenceable text (any paste the attacker saves to their own report). This is the one that matters. |
| GHSA-2xp9-vwfh-vxw4 — RCE in Image Optimization API via AVIF | **Unlikely.** `next.config.ts` sets `images.remotePatterns: []` and no `formats`, and there are no `.avif` assets in `public/`. NEEDS-VERIFICATION against the advisory's exact trigger conditions. |
| GHSA-p293-qw3h-jr36 — unauthenticated RCE on **Windows-hosted** servers | **Not in production** (Vercel is Linux). Note it *is* reachable on the maintainer's Windows dev box while `next dev` is running — don't expose the dev server on a shared network until bumped. |

**Fix:** bump to `next@16.3.8`. Highest value-per-effort item in this report.

## Other HIGH advisories — all dev-only or not installed

Verified against `package-lock.json` (`dev` / `optional` flags):

| Package | Dir/Trans | Prod? | Reachable from the app? | Non-breaking fix? |
|---|---|---|---|---|
| `axios` 1.19.0 (12 advisories, incl. SSRF + ReDoS) | transitive | **dev only** | No — not in the serverless bundle | yes (`fixAvailable: true`) |
| `undici` 7.29.0 (10 advisories) | transitive | **dev only** | No | yes |
| `joi` 18.2.3 (ReDoS) | transitive | **dev only** | No | yes |
| `js-yaml` 4.3.1 (CPU DoS) | transitive | **dev only** | No | yes |
| `browserslist` 4.28.4 | transitive | **dev only** | No (build-time) | yes |
| `brace-expansion` | transitive | **dev only** | No | yes |
| `sharp` 0.35.3 (libheif heap overflow) | transitive, **optional** | nominally prod | **No — not installed** (`require('sharp')` fails); Vercel handles image optimization at the platform layer | yes |
| `braces` / `micromatch` / `fast-glob` / `@next/eslint-plugin-next` / `eslint-config-next` | transitive | **dev only** | No (lint-time) | **No** — npm proposes `eslint-config-next@14.2.35`, a *downgrade* from the pinned 16.1.6. Do not take it; wait for a 16.x patch. |

`dompurify` 3.4.13 (the single LOW, DOM XSS) is prod, via `jspdf` and `posthog-js`. The advisory requires `IN_PLACE` plus a node-removing `afterSanitize` hook; neither consumer configures that. Low and almost certainly unreachable. Non-breaking fix exists.

## Ticket mapping

- **VGC-221 (Clerk major bump / js-cookie)** — **no longer applicable from an advisory standpoint.** `@clerk/nextjs@^7.3.2` is installed and **no `js-cookie` advisory appears in this audit at all**. The ticket may still be wanted for other reasons, but it is not holding back a vulnerability fix.
- **VGC-248 (12 moderate vulns needing breaking upgrades)** — covers the **8-entry OpenTelemetry cluster** (`@opentelemetry/core`, `exporter-logs-otlp-http`, `otlp-exporter-base`, `otlp-transformer`, `resources`, `sdk-logs`, `sdk-metrics`, `sdk-trace-base`; GHSA-8988-4f7v-96qf, unbounded memory in W3C Baggage). These genuinely need majors (`→ 0.222.0`). All are server-only log export via `src/instrumentation.ts` and are in `serverExternalPackages`.
- **Genuinely new / not covered by either ticket:**
  - `next` **critical** (P1 above) — new, and a *non-breaking* fix. Does not belong to VGC-248.
  - Moderates with non-breaking fixes that VGC-248's "needs breaking upgrades" framing excludes: `vitest` + `@vitest/mocker` (path traversal, dev), `qs`, `fflate`, `baseline-browser-mapping`, `@humanfs/node`.
  - The dev-only HIGH cluster above (`axios`, `undici`, `joi`, `js-yaml`, `browserslist`, `brace-expansion`) — mostly non-breaking.

## `npm audit fix --dry-run` — no files written

Run as instructed. It **failed** before producing a plan:

```
npm error Cannot read properties of null (reading 'edgesOut')
```

(a known arborist crash on certain optional/peer lock shapes). **Verified it wrote nothing** — md5 of `package.json` and `package-lock.json` identical before and after:

```
442bdb26d1c4228c7d9595be055a6591  package.json        (unchanged)
0f39abde17caff9697af8b43b3c8fcc4  package-lock.json   (unchanged)
```

Because the dry run produced no plan, the "non-breaking fix?" column above is taken from each advisory's `fixAvailable.isSemVerMajor` field in `npm audit --json`, not from a resolved tree. Treat the per-package upgrade targets as NEEDS-VERIFICATION until a real `npm install` resolves them.

---

# P1 — `creator_profiles` is keyed on Clerk display name, not user id

**Status: CONFIRMED**
**File: `src/app/api/user/profile/route.ts:71-95`**

```ts
const creatorName = user.firstName
  ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
  : user.username || "Unknown";
...
INSERT INTO creator_profiles (name, bio, twitter, discord, youtube, is_public, accent_theme, avatar_url, updated_at)
VALUES (${creatorName}, ...)
ON CONFLICT (name) DO UPDATE SET bio = ..., twitter = ..., avatar_url = ...
```

The row identity is the **Clerk display name**, which the user controls and which is not unique. `GET` reads it back with `WHERE LOWER(name) = …` (line 41), and `src/app/api/creator/[name]/route.ts:66` serves the same row on the **public** creator page.

**Exploit:** attacker sets their Clerk first/last name to match a known creator (say `Wolfe Glick`), then `PUT /api/user/profile`. `ON CONFLICT (name) DO UPDATE` overwrites that creator's `bio`, `twitter`, `discord`, `youtube`, `avatar_url` and `is_public`. The public page at `/creator/Wolfe%20Glick` — which also carries the `verified_creators` badge from `creator/[name]/route.ts:65`, looked up by the same name string — then renders the attacker's content next to the victim's verified badge and real reports. Reputational impersonation, and the `avatar_url`/socials fields are an obvious phishing vector. Rate limit is 10/min, so it is also trivially repeatable after any remediation that does not change the key.

**Minimal fix:** add a `user_id` column to `creator_profiles`, make it the conflict target, and resolve the public creator page through `user_id` rather than a display-name string. As a stopgap, reject a `PUT` whose `creatorName` already has a row owned by a different Clerk id.

---

# P2 — An accepted collaborator can flip `is_unlisted` (owner-only control is only enforced for `is_public`)

**Status: CONFIRMED**
**File: `src/app/api/share/route.ts:286-303`**

```ts
// Only the owner can change visibility — collaborators keep the existing value
const effectiveIsPublic = isPublic ?? currentIsPublic;
const effectiveIsUnlisted = isUnlisted ?? currentIsUnlisted;
if (isPublic !== undefined) {
  if (isPublic !== currentIsPublic) {
    if (!isOwner) { return 403 "Only the report owner can change visibility." }
  }
}
```

The comment says "visibility"; the guard covers **only `isPublic`**. `effectiveIsUnlisted` flows unchecked into the `UPDATE` at line 331.

**Exploit:** user B, an accepted collaborator on owner A's **private** report, POSTs `{ existingId, editToken, isUnlisted: true }`. The report becomes link-viewable (`src/app/api/share/[id]/route.ts:200` lets unlisted reports through to any caller), and B can hand the link to anyone. A never consented. The reverse also works: B can un-list A's unlisted report and break every link A has published.

**Minimal fix:** extend the existing guard to the second flag:

```ts
if (isUnlisted !== undefined && isUnlisted !== currentIsUnlisted && !isOwner) {
  return NextResponse.json({ error: "Only the report owner can change visibility." }, { status: 403 });
}
```

The sibling route `src/app/api/user/reports/[shareId]/route.ts:81-88` is **not** affected — it scopes its `UPDATE` with `AND owner_id = ${userId}`.

---

# P3 — `_forkedFrom` discloses the source report's metadata with no visibility re-check

**Status: CONFIRMED** · **File: `src/app/api/share/[id]/route.ts:74-98`** (`fetchForkedFromMeta`)

```ts
const rows = await sql`SELECT data, deleted_at FROM shares WHERE id = ${sourceId}`;
...
return { id: sourceId, creatorName: …, tournamentName: …, species: extractSpecies(data.paste), deleted };
```

No `is_public` predicate. The result is attached as `_forkedFrom` to **both** the owner response (line 171) and the **public** non-owner response (line 237).

Forking itself is correctly gated to public sources (`share/[id]/fork/route.ts:79-85`), which bounds this. The residual leak: A publishes P → B forks it → A unpublishes P. Any anonymous viewer of B's public fork still receives P's **current** `creatorName`, `tournamentName` and species list, reading live `data` and so including edits A made after going private.

**Minimal fix:** add `AND is_public = TRUE` to the query (or carry the flag through and return `{ id, deleted: true }`-style minimal lineage when the source is no longer public).

---

# P3 — Reactions can be written against non-public reports

**Status: CONFIRMED** · **File: `src/app/api/reactions/[shareId]/route.ts:77, 32-35`**

`POST` checks only `deleted_at IS NULL`, so a caller holding an unlisted/private id can insert `reactions` rows and trigger an owner notification (`createNotification`, line 113). `GET` returns aggregate counts for any id with no visibility check. Low impact — no report content is disclosed, and the rows are cleaned up by `/api/cleanup` — but it lets an outsider ping a private report's owner. Add `AND is_public = TRUE` to the existence check, matching `comments/[shareId]/route.ts:46`.

---

# Informational

**1. CSP allows `'unsafe-inline'` in `script-src` in production.** `next.config.ts:5-15` — `scriptSources` includes `'unsafe-inline'` unconditionally; only `'unsafe-eval'` is dev-gated. This substantially negates CSP's XSS value. The rest of the policy is strong (`object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`, HSTS 2y + preload, `X-Content-Type-Options`, `Referrer-Policy`, a tight `Permissions-Policy`). Moving to a nonce- or hash-based `script-src` is the single biggest header improvement available. `Cross-Origin-Opener-Policy: unsafe-none` and `Cross-Origin-Resource-Policy: cross-origin` are both documented in-file as Clerk-OAuth / Showdown-sprite requirements — accepted, not findings.

**2. CORS posture is good.** `src/lib/security/cors.ts` — static allowlist plus a preview regex anchored on the `-mss23s-projects` scope suffix (with a thorough comment explaining why a `vgc-team-report*` prefix wildcard was attacker-registrable), and **no `Access-Control-Allow-Credentials`** (VGC-274), so even a widened allowlist can only leak anonymous responses. `isAllowedOrigin` returns `true` for a missing `Origin` (line 65) — correct for same-origin and non-browser callers, but it does mean the `proxy.ts:90` origin block is not a control against direct HTTP clients. That is exactly why the P0 above needs an in-route check rather than relying on middleware.

**3. `DISCORD_PUBLIC_KEY` is hardcoded — not a secret.** `src/app/api/discord/route.ts:7`. This is the Discord **application public key** (the Ed25519 *verification* key, published in Discord's developer portal) used by `nacl.sign.detached.verify` at line 85. Committing it leaks nothing. Flagging only as hygiene: rotation currently requires a code deploy, so an env var would be preferable. **Not a P0.** Every secret the app actually uses is read from `process.env` (`LINEAR_API_KEY`, `CRON_SECRET`, `MIGRATE_SECRET`, `CLEANUP_SECRET`, `CLERK_WEBHOOK_SIGNING_SECRET`, `LINEAR_WEBHOOK_SIGNING_SECRET`, `DATABASE_URL`).

**4. `/api/user/export` has no `apiGuard`.** `src/app/api/user/export/route.ts:6` — but it implements its own stricter control (one export per 24h per user via Redis, lines 13-21) and every one of its 12 queries is scoped to `userId`. Not a finding; noted only because it is the one route missing the shared guard.

**5. `getClientIp` "unknown" bucket.** `src/lib/security/input-validation.ts:70-73,102` documents that callers presenting no usable header all collapse into one rate-limit bucket. The module already says sensitive routes should treat `"unknown"` as always-limited; none currently do. Consider acting on the module's own advice for the mutating routes.

---

## Verified-clean (checked, no finding)

- **`/api/migrate`** (`route.ts:26`) — `verifyBearer(request, "MIGRATE_SECRET")`, timing-safe, fails closed when the env var is unset.
- **`/api/setup`** (`route.ts:8-19`) — requires `MIGRATE_SECRET` **or** `CRON_SECRET`; also pre-checks that a secret is configured at all. Its `proxy.ts:33,90` exemptions skip bot-detection and the origin block, not the bearer check.
- **`/api/cleanup`** — `GET` via `isCronAuthorized`, `DELETE` via `verifyBearer("CLEANUP_SECRET")` (`route.ts:168,192`). Both hard-capped at `MAX_DELETE_PER_RUN = 500`; the stale purge exempts owned content (`owner_id IS NULL`).
- **All 4 `/api/cron/*` routes + `/api/keep-alive`** — every one gated by `isCronAuthorized` (`src/lib/cron-auth.ts`, `timingSafeEqual`, fails closed). `/api/bot` uses `verifyBearer("CRON_SECRET")`. All 5 `vercel.json` crons map to a guarded path.
- **All 3 webhooks** — Clerk via `verifyWebhook` + configured-secret precheck; Linear via HMAC-SHA256 `timingSafeEqual` **plus `webhookTimestamp` replay protection**; PostHog via `timingSafeEqual`. `/api/discord` via `nacl.sign.detached.verify`.
- **IDOR surface specifically probed and found correct:** `share/[id]` GET (owner/collaborator branch then `!isPublic && !isUnlisted → 404`, and it deliberately ignores legacy `?key=`), `share/[id]/versions` GET+POST, `versions/[version]` GET, `share/[id]/collaborators` (all 4 methods owner-gated; GET owner-or-collaborator), `share/[id]/fork` (public-only), `changelog/[shareId]`, `sync/[id]` (SSE, owner-or-accepted-collaborator), `user/collections/[id]`, `user/reports/[shareId]`, `user/collaborations` (accept requires a *pending* row for the caller), `comments/[shareId]/[commentId]`, `user/saved` (POST re-checks `is_public OR owner_id`, with an in-code comment naming the exact leak it prevents), `user/{drafts,follow,notifications,analytics,feed,delete,export}`, `match-log`. Every mutation carries `AND owner_id/user_id = ${userId}`.
- **`share/route.ts` POST** — auth required for *all* writes; `edit_token` explicitly treated as an update nonce rather than a credential, with an ownership/collaborator check layered on top (lines 158-180).
- **SQL injection: none.** `git grep` for `sql.unsafe`, `.unsafe(`, `sql("…")`, string-concatenated SQL and `sql.raw` returns no hits in `src/`. All queries are `@neondatabase/serverless` tagged templates with `${}` parameter binding. The two dynamic-looking spots are safe: `explore/route.ts:212,227` builds `ORDER BY ${col}` from a fixed two-branch `sql\`\`` fragment with `sort` allowlisted at line 27; `creator/[name]/route.ts:49` uses exact `LOWER(...) = ` after an in-code note that a previous `ILIKE` let `/creator/%25` match every public report.
- **Input validation** — zod `safeParse` on every mutating body I read; share ids regex-validated (`/^[A-Za-z0-9]{8}$/` or `/^[a-zA-Z0-9_-]{6,16}$/`); comment bodies run through `escapeHtml` + a word filter.
- **Rate limiting** — `apiGuard` on 44 of 53 routes. The 9 without it are the secret-authenticated cron/webhook/admin routes plus `/api/user/export` (own 24h limit) and `/api/sprite` (middleware-exempt by design, host+path allowlisted, edge-cached immutable).
- **SSRF** — `/api/sprite` (`route.ts:40-45`) allowlists host `play.pokemonshowdown.com` **and** path prefix `/sprites/`, with a 3s abort. `/api/pokepaste` allowlists `pokepast.es` / `www.pokepast.es` via zod and rebuilds the path server-side rather than reusing caller input. Both correct.
- **PII in responses** — `/api/user/search` returns only `{id, name, imageUrl}` from Clerk, never emails. Emails are fetched server-side only to *send* mail (`comments/[shareId]/route.ts:155`, `feedback/route.ts:110`) and are not echoed. `comments/[shareId]` GET deliberately never returns the raw `session_id` (the DELETE credential) and computes `isOwn` server-side instead — a good pattern. `collaborators` GET returns `ownerId`, but only to an owner/collaborator.
- **`.env` hygiene** — `.gitignore` has `.env*` with `!.env.example`; `git ls-files | grep -iE '(^|/)\.env'` returns **only `.env.example`**, whose values are all `<your-…>` / `postgresql://…` placeholders. No `.env.local` exists in this container (credentials arrive as env vars, per CLAUDE.md).
- **`.github/workflows/ci.yml`** — no `secrets.*` references, no `env:` block, nothing to leak. Runs `npm run typecheck` (cold `--incremental false`), `npm run lint` (non-blocking), `npm test`.

## Secret-scan detail (values never printed)

Searched tracked files for `lin_api_`, `sk_live_`, `sk_test_`, `pk_live_`, `pk_test_`, `whsec_`, `rk_live_`, `ghp_`, `github_pat_`, `xoxb-`, `AKIA…`, `AIza…`, `-----BEGIN * PRIVATE KEY`, `postgres(ql)://`, `discord(app).com/api/webhooks/`, `Bearer <12+>`, JWT triplets (`eyJ….eyJ`), and quoted base64/hex runs of 32+ and 40+ chars across `src/`, `scripts/`, `public/`, `.github/`, and root config. Every hit classified:

| Location | Classification |
|---|---|
| `.env.example:10` + Clerk/Upstash/Resend lines | Placeholders (`postgresql://…`, `<your-…>`) |
| `docs/STRIPE_PAID_REPORTS_ARCHITECTURE.md:335-338` | Truncated `sk_test_…` / `whsec_…` ellipses in a design doc for an unbuilt feature — no real material |
| `.swarm/*.md` (prior audit + webhook notes) | Prefix *patterns* quoted in earlier reports, not values |
| `src/lib/__tests__/cron-auth.test.ts:40`, `src/lib/auth/__tests__/verify-bearer.test.ts:29,71` | Test fixtures |
| `src/lib/data/__tests__/dex-subset.test.ts:38-42` | SHA-256 dex checksums |
| `scripts/generate-move-names.mjs:4` | Pinned PokeAPI git commit sha |
| `src/app/api/discord/route.ts:7` | Discord application **public** key — see Informational #3 |
| `share/route.ts:82`, `fork/route.ts:14`, `collections/route.ts:30`, `drafts/route.ts:20` | Base62 alphabet constants for id generation |

**No committed secret. Nothing requires rotation.**

---

## Recommended order of work

1. **P0** — gate `/api/team-graphic` on visibility + apply `privateFields` redaction; lift the redaction helper into `src/lib/sharing/` and add a regression test naming the bug.
2. **P1** — `npm i next@16.3.8` (lockfile-only, closes the reachable `next/og` RCE).
3. **P1** — re-key `creator_profiles` on Clerk user id.
4. **P2** — extend the owner-only visibility guard in `share/route.ts` to `isUnlisted`.
5. **P3** — `is_public` predicate in `fetchForkedFromMeta`; `is_public` check on reactions POST.
6. Then the dependency sweep: non-breaking moderates (`vitest`, `qs`, `fflate`, `baseline-browser-mapping`, `@humanfs/node`) and the dev-only HIGH cluster. **Do not** accept npm's `eslint-config-next@14.2.35` downgrade. Keep the OpenTelemetry majors on VGC-248.
7. Longer term: nonce-based `script-src` to drop `'unsafe-inline'`.

Note for whoever picks these up: a fix here touches `src/app/api/**` plus a new `src/lib/sharing/` export — per CLAUDE.md, run the `verification-gate` subagent (tsc cold, vitest, build) before committing, and nothing is pushed without an explicit signal.
