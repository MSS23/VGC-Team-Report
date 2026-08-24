# C4 — Security Audit — 24-08-26

Read-only audit. No files outside `.swarm/` were modified. `npm audit fix`, `npm install`
and `npm run build` were **not** run.

**Integration note:** no PostHog credentials were available this run, so there is **no
exception or error-rate data** cross-referenced anywhere below. Every claim here comes from
static reading of the repo. No incident-frequency numbers are given because none could be
obtained. The **Linear MCP server is unauthorized** in this session, so the VGC-2xx tickets
in §4 were cross-checked against the code only — their current Linear status was not read
and none were updated.

---

## 0. Headline

**P0: NONE. No hardcoded secret was found anywhere in the repository.**

Every credential path resolves through `process.env` (webhook signing secrets included).
The one long hex literal that looks like a key — `src/app/api/discord/route.ts:7` — is a
Discord **application public key**, which is public by design and is only used as a
signature *verification* input. It is not a secret and needs no rotation. Details in §2.

Headline issue this run is a **NEW HIGH**: `/api/team-graphic` renders any report as a PNG
with no visibility check, which re-opens the exact hole VGC-246 was meant to close.

---

## 1. `npm audit --json` — severity summary

Totals: **8 moderate, 0 low, 0 high, 0 critical** (819 deps: 132 prod / 641 dev / 134 optional).

All 8 advisories are **one root cause**:

| Package | Path | Severity | Advisory |
|---|---|---|---|
| `@opentelemetry/core` | `node_modules/@opentelemetry/core` | moderate | GHSA-8988-4f7v-96qf — Unbounded memory allocation in W3C Baggage propagation (CWE-770, CVSS 5.3) |
| `@opentelemetry/exporter-logs-otlp-http` | direct dep | moderate | via `@opentelemetry/core` |
| `@opentelemetry/sdk-logs` | direct dep | moderate | via `@opentelemetry/core` |
| `@opentelemetry/resources` | direct dep | moderate | via `@opentelemetry/core` |
| `@opentelemetry/otlp-exporter-base` | transitive | moderate | via `@opentelemetry/core` |
| `@opentelemetry/otlp-transformer` | transitive | moderate | via `@opentelemetry/core` |
| `@opentelemetry/sdk-metrics` | transitive | moderate | via `@opentelemetry/core` |
| `@opentelemetry/sdk-trace-base` | transitive | moderate | via `@opentelemetry/core` |

### Production vs dev reachability

All eight sit in `dependencies` (not `devDependencies`), so they **ship to production**.
But the vulnerable *code path* is **not reachable**:

- The advisory is in the **W3C Baggage propagator**, which parses an inbound `baggage`
  HTTP header.
- `src/instrumentation.ts:9-39` only constructs a `LoggerProvider` + `OTLPLogExporter`
  pointed at PostHog. It registers **no propagator**, **no HTTP instrumentation**, and
  never parses an inbound trace/baggage header.
- The only other consumer is `src/app/api/views/[shareId]/route.ts:5` importing
  `SeverityNumber` (a constant enum) from `@opentelemetry/api-logs`.

**Verdict: prod-shipped, not exploitable in this codebase.** Treat as hygiene, not urgency.
The fix (`@opentelemetry/exporter-logs-otlp-http` + `@opentelemetry/sdk-logs` → 0.221.0) is
flagged `isSemVerMajor: true`, so it needs a real upgrade pass, not `npm audit fix`.

**No dev-only advisories at all this run.** Cypress, vitest, eslint, tailwind trees are clean.

---

## 2. Hardcoded secret scan

Scanned the working tree (excluding `node_modules`, `.next`, `package-lock.json`) plus git
history, for: `sk_live_`/`sk_test_`/`pk_live_`, `whsec_`, `lin_api_`, `phc_`/`phx_`,
`postgres://`/`postgresql://` with credentials, `AKIA…`, `ghp_`, `xoxb-`, `AIza…`,
`-----BEGIN … PRIVATE KEY`, Discord webhook URLs, `Bearer <token>` literals,
`SECRET|TOKEN|API_KEY|PASSWORD|SIGNING = "…"` assignments, `user:pass@host` URLs, and bare
40+ char hex strings.

### Result: clean. Zero hardcoded secrets.

Only matches, all benign:

| File:line | Match | Assessment |
|---|---|---|
| `.env.example:10` | `postgresql://user:password@host/database?sslmode=require` | Placeholder template. Fine. |
| `.env.example:34` | `phc_xxxx…` | Placeholder. Fine. |
| `src/app/api/discord/route.ts:7` | `DISCORD_PUBLIC_KEY = "44b2…"` | **Discord app public key — public by design.** Used only as the verify key in `nacl.sign.detached.verify`. Not a secret, do not rotate. See §3 finding N-8 for a hardening note. |
| `src/lib/__tests__/cron-auth.test.ts:24,32,38` | `CRON_SECRET = "my-secret"` | Test fixture. Fine. |
| `src/app/api/webhooks/posthog/route.ts:427-434` | `LABELS` UUIDs | Linear label IDs, not credentials. |
| `.claude/scripts/linear.sh:21,26,27` | Linear team/state UUIDs | Non-secret identifiers; `.claude/` is gitignored. |
| `scripts/generate-move-names.mjs:4`, `src/lib/data/__tests__/dex-subset.test.ts:38-42` | git SHA / content hashes | Fine. |

### Webhook signing secrets — specifically checked

All three signing paths read from env and **fail closed**:

- `src/app/api/webhooks/clerk/route.ts:28-32` — `CLERK_WEBHOOK_SIGNING_SECRET`; rejects 400 when unset.
- `src/app/api/webhooks/linear/route.ts:32-37` — `LINEAR_WEBHOOK_SIGNING_SECRET` (legacy
  `LINEAR_WEBHOOK_SECRET` fallback); 401 when unset. HMAC compared with `timingSafeEqual`
  after a length check (`:52-59`).
- `src/app/api/webhooks/posthog/route.ts:174-186` — `POSTHOG_WEBHOOK_SECRET`; 401 when
  unset, `timingSafeEqual` compare.
- `src/lib/auth/verify-bearer.ts:20-26` and `src/lib/cron-auth.ts:10-17` — same fail-closed
  + `timingSafeEqual` pattern for `MIGRATE_SECRET`, `CLEANUP_SECRET`, `CRON_SECRET`.

### Git history

`git log --all --name-only` shows only two secret-adjacent paths ever committed:
`.env.example` (placeholders) and `.swarm/drafts/infra-posthog-credentials.md` (commit
`7951ac9`). The latter was read in full — it is a **ticket draft asking someone to create a
PostHog key**; it contains `POSTHOG_API_KEY=<key>` as a literal placeholder and **no real
value**. No history rewrite needed.

---

## 3. OWASP Top-10 review of `src/app/api/**`

54 route files reviewed. Structural verdicts first, then findings.

### A03 Injection — clean

Every DB call goes through the `@neondatabase/serverless` tagged template (`getDb()` →
`neon(...)`, `src/lib/db.ts:4`). Repo-wide search for `sql.unsafe`, `sql.query(`,
`query(\``, `.raw(` returns **zero hits**. Dynamic fragments in
`src/app/api/explore/route.ts:95-156` are composed from nested `sql\`\`` templates, so every
user value is still a bound parameter. The `to_tsquery` input at `explore/route.ts:82-83`
is stripped to `\w` tokens before binding, so tsquery operators cannot be injected.
`creator/[name]/route.ts:49` uses `LOWER(...) = $1` rather than the old `ILIKE`, closing the
`/creator/%25` wildcard match noted in its own comment.

### A01/A04 — access control: strong on the account routes

Every `/api/user/**` route scopes its query by `owner_id = ${userId}` / `user_id = ${userId}`.
`/api/share/[id]/collaborators`, `/versions`, `/changelog`, `/sync` all verify **ownership or
accepted-collaborator**, not just authentication. `/api/share/route.ts:152-180` explicitly
demotes `edit_token` to "an internal update nonce, not an authorization credential" and
requires owner-or-collaborator on top. This is genuinely good.

### A10 SSRF — closed

- `src/app/api/sprite/route.ts:40-45` — host allowlist (`play.pokemonshowdown.com`) **plus**
  a `/sprites/` path prefix check, 3s abort.
- `src/app/api/pokepaste/route.ts:13-23` — hostname must equal `pokepast.es`/`www.pokepast.es`;
  the outbound URL is then **rebuilt** from the parsed pathname (`:53-55`) rather than
  forwarded, which also defeats redirect/userinfo tricks.
- `src/app/api/webhooks/posthog/route.ts:31-32` — `sessionId` UUID-validated before use.

No fetch-by-arbitrary-user-URL route exists.

### CORS — see VGC-274 verdict in §4

### Rate limiting — coverage gaps

`apiGuard` (`src/lib/security/api-guard.ts:27-63`) applies a keyed Upstash/in-memory limit.
Routes **without** any rate limit: `/api/discord` (also middleware-exempt — see N-3) and
`/api/sprite` (middleware-exempt by design, `src/proxy.ts:27-29`; SSRF is closed so impact is
bandwidth only). All secret-gated routes (`/api/migrate`, `/api/setup`, `/api/cleanup`,
`/api/keep-alive`, `/api/bot`, `/api/cron/*`) rely on the bearer check instead, which is
acceptable.

---

## NEW FINDINGS

### N-1 · HIGH · Private and unlisted reports leak in full via `/api/team-graphic`

**File:** `src/app/api/team-graphic/route.tsx:96`

```
const rows = await sql`SELECT data FROM shares WHERE id = ${shareId} AND deleted_at IS NULL`;
```

There is **no `is_public` check, no `is_unlisted` check, and no `auth()` call** — only a
rate limit (`:84`). `shareId` is taken raw from the query string (`:88`) with no format
validation. The handler then renders `paste`, `tournamentName`, `placement`, `creatorName`,
`record` and `tags` into a PNG (`:101-108`), including each Pokémon's **species, item,
ability and Tera type** (`parseTeamForGraphic`, `:18-45`).

**Exploit scenario.** A user marks a report Private (or Unlisted) — `/s/{id}`,
`/api/share/{id}`, `/api/oembed`, `/embed/{id}`, comments, sync and the JSON-LD block all
correctly 404 or hide it. But an attacker who has the 8-character id (from a shared link
later made private, browser history, a Discord unfurl, a referrer header, or brute force
against a 62^8 space with no id-format check and only a 10/min limit) fetches
`GET /api/team-graphic?id={id}&style=wrapped` and receives a 1080×1920 poster of the entire
team. Team compositions are the single most commercially sensitive artefact this product
handles — this is exactly the disclosure VGC-246 exists to prevent.

**Second, independent leak in the same line.** Tiered publishing (VGC-142) lets a creator
mark `item` private; `applyPrivateFieldRedaction` in `src/app/api/share/[id]/route.ts:18-30`
is the **only** place `redactPasteFields` is ever called (repo-wide search confirms).
`team-graphic` reads `data.paste` directly, so **hidden items are rendered into the PNG even
for public reports**, silently voiding the creator's redaction choice.

**Fix.**
1. Select the flags and gate the read:
   ```ts
   const rows = await sql`SELECT data, is_public, is_unlisted, owner_id
                          FROM shares WHERE id = ${shareId} AND deleted_at IS NULL`;
   ```
   Return 404 unless `is_public`, or `is_unlisted`, or the caller is the owner. Given this
   route is the `thumbnail_url` for oEmbed unfurls (`src/app/api/oembed/route.ts:41`, which
   is itself public-only), gating on `is_public = TRUE` alone is the simplest correct
   behaviour and matches oEmbed's contract.
2. Validate the id: reuse `z.string().regex(/^[A-Za-z0-9]{8}$/)` as `/api/share/[id]` does
   (`route.ts:32`), so the route stops being a free existence oracle.
3. Route the paste through `applyPrivateFieldRedaction` / `redactPasteFields` before
   `parseTeamForGraphic`, so hidden items stay hidden.
4. Add a vitest beside it naming the bug (private id → 404; `privateFields:["item"]` →
   no item on the card).

Note the route is `runtime = "edge"` and returns an `ImageResponse`, so a leaked PNG is also
CDN-cacheable — fix before the next promote.

---

### N-2 · MEDIUM · A collaborator can flip a report to Unlisted; only `isPublic` is owner-gated

**Files:** `src/app/api/share/route.ts:288` and `:331` (guard that exists only for
`isPublic` is at `:289-303`)

```ts
const effectiveIsPublic   = isPublic   ?? currentIsPublic;
const effectiveIsUnlisted = isUnlisted ?? currentIsUnlisted;   // :288 — never owner-checked
if (isPublic !== undefined) {
  if (isPublic !== currentIsPublic) {
    if (!isOwner) return 403 …                                  // :292-301
  }
}
…
is_unlisted = ${effectiveIsUnlisted},                            // :331 — written unconditionally
```

`isUnlisted` is accepted from the request body (`ShareBodySchema`, `:75`) and written
straight to the row. The owner-only check covers `is_public` and nothing else.

**Exploit scenario.** An accepted collaborator on a **Private** report POSTs
`/api/share` with `{ existingId, editToken, isUnlisted: true, state }`. The report becomes
link-viewable by anyone holding the id — `src/app/api/share/[id]/route.ts:200-202` explicitly
allows unlisted reports through to non-owners, and `/s/{id}` metadata + JSON-LD switch on
(`src/app/s/[id]/page.tsx:35-37, 174`). The owner is never notified and the dashboard toggle
they set is silently overridden. The inverse also works: a collaborator can un-unlist a
report the owner deliberately shared by link.

This is squarely inside VGC-246's "visibility-toggle hardening" scope and is **still open**.

**Fix.** Mirror the `isPublic` guard:
```ts
if (isUnlisted !== undefined && isUnlisted !== currentIsUnlisted && !isOwner) {
  return NextResponse.json(
    { error: "Only the report owner can change visibility." }, { status: 403 });
}
```
The clean version is one check over `visibilityChanged` (already computed at `:324-325`)
placed before the UPDATE. The owner-scoped sibling route
`src/app/api/user/reports/[shareId]/route.ts:78-87` already does this correctly (`WHERE …
AND owner_id = ${userId}`) and is the pattern to copy.

---

### N-3 · MEDIUM · `/api/discord` has no replay protection and no rate limit, and is fully middleware-exempt

**Files:** `src/app/api/discord/route.ts:76-93`; exemption at `src/proxy.ts:13-16`

The Ed25519 verification signs `timestamp + rawBody` (`:85-89`) — but **`timestamp` is never
validated for freshness**. There is no age window, no nonce, and no delivery-id dedupe. The
route also has no `apiGuard` call, and `src/proxy.ts:13-16` returns `NextResponse.next()` for
`/api/discord` before bot detection, CORS, and CSRF ever run, so it is the least-protected
endpoint in the app.

**Exploit scenario.** Anyone who captures one valid interaction body + its signature headers
(a proxy log, an error report, a leaked HAR, a misconfigured egress logger) can replay it
verbatim **forever**. The high-value target is an admin's `/approve` — `MUTATING_COMMANDS`
(`:68`) is gated by `isAuthorizedInvoker` (`:49-66`), which reads the invoker id **out of the
replayed body itself**, so a replayed admin payload re-authorises itself perfectly. Each
replay also drives an unauthenticated, unmetered Linear GraphQL mutation
(`linearQuery`, `:23-33`) using the server's `LINEAR_API_KEY`.

This is the same class VGC-274 covers for the Linear webhook. Linear got its window
(`src/app/api/webhooks/linear/route.ts:68-73`); Discord got nothing.

**Fix.**
1. Reject stale timestamps before verifying (Discord sends Unix **seconds**):
   ```ts
   const ts = Number(timestamp);
   if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
     return NextResponse.json({ error: "Stale request" }, { status: 401 });
   }
   ```
2. Add `apiGuard(request, { rateLimit: { key: "discord", max: 30 } })` — the middleware
   exemption means this route must limit itself.
3. For `MUTATING_COMMANDS`, dedupe on `body.id` (the interaction id) in Upstash with a
   short TTL, closing the in-window replay the Linear handler also documents as open
   (`webhooks/linear/route.ts:66-67`).

---

### N-4 · MEDIUM · Creator profiles are keyed on Clerk display name, so any account can overwrite another creator's public profile

**File:** `src/app/api/user/profile/route.ts:71-95`

```ts
const creatorName = user.firstName ? `${user.firstName} …` : user.username || "Unknown";
…
INSERT INTO creator_profiles (name, bio, twitter, discord, youtube, …)
VALUES (${creatorName}, …)
ON CONFLICT (name) DO UPDATE SET bio = …, twitter = …, avatar_url = …
```

The row identity is the **Clerk display name**, not `user.id`. Clerk first/last names are
free text and not unique. The route never checks that the caller has any claim to the name.

**Exploit scenario.** An attacker sets their Clerk profile name to a well-known VGC
creator's name, then `PUT /api/user/profile`. The `ON CONFLICT (name) DO UPDATE` overwrites
that creator's bio, Twitter, Discord, YouTube and avatar. `src/app/api/creator/[name]/route.ts:66`
serves exactly this row on the public creator page, and the reports listed alongside it are
matched by the same `LOWER(data->>'creatorName')` (`:49`), so the hijacked profile appears
attached to the real creator's teams — including next to a `verified_creators` badge
(`:65,69`), since verification is also name-keyed. Setting `is_public: false` also lets an
attacker hide a real creator's page (`:72-76`). The attacker can further point
`avatarUrl` anywhere HTTPS (`:21-24` validates only the scheme) — currently blunted because
CSP `img-src` (`next.config.ts:126`) does not allow arbitrary hosts, but that is incidental
defence.

Note also the read/write key mismatch: reads use `LOWER(name) = …` (`:41`, and
`creator/[name]/route.ts:66`) while `ON CONFLICT` targets exact `name`, so `"wolfe glick"`
and `"Wolfe Glick"` are two rows that both satisfy the same read.

**Fix.** Add an owning `user_id` column to `creator_profiles`, make it the conflict target,
and claim a display name on first write (reject a `PUT` whose `creatorName` already belongs
to a different `user_id`). Short term, at minimum verify the caller owns at least one share
whose `data->>'creatorName'` matches, and normalise the key to `LOWER(name)` so reads and
writes agree. Migration touches a table + two routes — feature branch per CLAUDE.md.

---

### N-5 · LOW · Fork-source metadata survives the source going private

**File:** `src/app/api/share/[id]/route.ts:80-94` (`fetchForkedFromMeta`)

```ts
const rows = await sql`SELECT data, deleted_at FROM shares WHERE id = ${sourceId}`;
… creatorName, tournamentName, species: extractSpecies(data.paste)
```

No `is_public` / `is_unlisted` filter. Forking is correctly restricted to public sources
(`src/app/api/share/[id]/fork/route.ts:79-85`), so the source *was* public at fork time — but
if the owner later flips it to Private, every fork's `_forkedFrom` payload keeps publishing
its `creatorName`, `tournamentName` and full **species list** to anonymous viewers.

**Fix.** Add `AND is_public = TRUE AND deleted_at IS NULL` to the select and fall back to
the existing `{ deleted: true }` shape, which the client already renders.

---

### N-6 · LOW · `/api/reactions/[shareId]` POST is an existence oracle for private reports

**File:** `src/app/api/reactions/[shareId]/route.ts:77-80`

```ts
const ownerRows = await sql`SELECT owner_id FROM shares WHERE id = ${shareId} AND deleted_at IS NULL`;
if (ownerRows.length === 0) return 404;
```

No visibility filter, unlike the comments routes which correctly require `is_public = TRUE`
(`src/app/api/comments/[shareId]/route.ts:46,122`). An anonymous caller learns whether a
given id exists (404 vs 200) and can insert `reactions` rows against private reports,
inflating the owner's like count and firing a notification (`:112-114`).

**Fix.** Add `AND is_public = TRUE` to the existence check, matching the comments routes.
The GET handler at `:32-35` deserves the same treatment.

---

### N-7 · LOW · Account enumeration via `/api/user/search`

**File:** `src/app/api/user/search/route.ts:24` — `client.users.getUserList({ query: q, limit: 8 })`

Clerk's `query` matches **email addresses** as well as names. Any signed-in user can probe
whether a given address has an account (2-char minimum, 20 req/min). The response omits the
email itself (`:28-33`), which limits impact to a yes/no oracle plus `id` + display name.

**Fix.** This route exists to add collaborators by name — restrict matching to name/username
(filter results whose name doesn't contain `q`, or use a name-scoped Clerk query), and drop
the limit to ~10/min.

---

### N-8 · LOW · Malformed `x-signature-ed25519` throws outside the try block → unhandled 500

**File:** `src/app/api/discord/route.ts:85-89`, helper `hexToUint8` at `:364-370`

`hexToUint8` does no length or hex validation, and `nacl.sign.detached.verify` throws on a
signature that isn't 64 bytes. The verify call sits **above** the `try` (which starts at
`:121`), so a one-byte signature header yields an unhandled exception and a framework 500
instead of the intended 401. Combined with N-3 (no rate limit, middleware-exempt) it is a
cheap way to generate error noise and burn invocations.

**Fix.** Validate `/^[0-9a-f]{128}$/i` on the signature and `/^[0-9a-f]{64}$/i` on the key
before calling `verify`, or wrap the verify in its own try/catch returning 401.

---

## 4. Cross-check against open tickets

### VGC-264 — left-most `x-forwarded-for` parsing · **ALREADY FIXED**

`src/lib/security/input-validation.ts:75-103` now prefers the platform-set
`x-vercel-forwarded-for` / `x-real-ip` (`:77-80`), then takes **only the right-most**
`x-forwarded-for` entry (`:83-88`) with no leftward scan, then falls back to a header
fingerprint (`:93-100`). All call sites go through it: `src/app/api/explore/route.ts:21`,
`src/app/api/comments/flag/route.ts:36`, `src/app/api/share/[id]/fork/route.ts:139`,
`src/app/api/share/route.ts:100`, `src/lib/security/api-guard.ts:32`. A guard test —
`src/lib/security/__tests__/no-raw-forwarded-for.test.ts:19-22` — asserts **no route file
mentions the raw header at all**, so a regression fails CI. Nothing further to do.

Residual (documented, not a regression): the `"unknown"` fallback at `:102` is a single
shared rate-limit bucket; the function's own comment at `:70-73` says sensitive routes
should treat it as always-limited. No route does. Low.

### VGC-274 — CORS `Allow-Credentials` + replay protection · **CORS FIXED / REPLAY PARTIAL**

*CORS half — fixed.* `src/lib/security/cors.ts:53-59` deliberately omits
`Access-Control-Allow-Credentials`, with a comment explaining why. `Allow-Origin` is
reflected only for an allowlisted origin, empty otherwise (`:46-50`). The preview-deploy
regex is anchored on the `-mss23s-projects` scope suffix (`:35-36`), closing the
attacker-registrable `vgc-team-report-evil.vercel.app` match. `src/lib/security/__tests__/cors.test.ts:80-82`
asserts the credentials header is never emitted.

*Replay half — partial.* The Linear webhook now enforces a 60s `webhookTimestamp` window
(`src/app/api/webhooks/linear/route.ts:68-73`). Two gaps remain:
- **No delivery-id dedupe** — acknowledged in-code at `:66-67`; an in-window replay still lands.
- **`/api/discord` has no replay protection whatsoever** — see finding **N-3**, which is the
  more serious of the two because a replayed `/approve` re-authorises itself.

Recommend keeping VGC-274 open with N-3 folded in.

### VGC-246 — enforce true private reports + visibility-toggle hardening · **MOSTLY FIXED, TWO HOLES**

Fixed and verified:
- `src/app/api/share/[id]/route.ts:200-202` — non-owner, non-collaborator gets 404 unless public or unlisted.
- `:121-123` — legacy `?key=` is deliberately ignored; edit access is account-based only.
- `src/app/s/[id]/page.tsx:33-37` — private reports leak no title/description into `<head>`, and `robots: noindex`.
- `src/app/s/[id]/page.tsx:172-175` — JSON-LD skipped for private.
- `src/app/embed/[id]/page.tsx:13`, `src/app/api/oembed/route.ts:23`, `src/app/api/views/[shareId]/route.ts:40,45`, `src/app/api/comments/[shareId]/route.ts:46,122`, `src/app/sitemap.ts:42,55` — all filter `is_public = TRUE`.
- `src/app/api/sync/[id]/route.ts:80-94` and `src/app/api/changelog/[shareId]/route.ts:27-41` — owner-or-accepted-collaborator.
- Edge cache windows trimmed to 30s specifically so a public→private flip isn't masked (`share/[id]/route.ts:253-262`).

**Still broken:**
- **N-1** — `src/app/api/team-graphic/route.tsx:96` serves private and unlisted reports as a PNG. This is a full bypass of the above.
- **N-2** — `src/app/api/share/route.ts:288,331` lets a collaborator set `is_unlisted`, i.e. publish a private report by link.

VGC-246 should not be closed until both land.

### VGC-248 — 12 moderate npm vulns · **REDUCED 12 → 8, NOT CLOSED**

Current count is **8 moderate**, all tracing to the single `@opentelemetry/core`
advisory GHSA-8988-4f7v-96qf. See §1: prod-shipped but the vulnerable propagator path is
never registered (`src/instrumentation.ts` sets up log export only). The fix is a semver-major
bump to `0.221.0` on `@opentelemetry/exporter-logs-otlp-http` and `@opentelemetry/sdk-logs`,
so it needs a deliberate upgrade + `next build` verification, not `npm audit fix`.
Retitle the ticket to 8 and treat as low-urgency hygiene.

### VGC-221 — Clerk major bump / js-cookie advisories · **ADVISORIES RESOLVED**

`js-cookie` resolves to **3.0.7** and appears in **no** current advisory.
`@clerk/nextjs` resolves to **7.5.9** (manifest `^7.3.2`) with **no** advisory against it in
this audit. The security justification for VGC-221 no longer exists — if the ticket stays
open it should be re-scoped as a routine major-version upgrade, not a vulnerability fix.

---

## 5. Suggested order of work

1. **N-1** (HIGH) — one-file fix in `src/app/api/team-graphic/route.tsx`; add the vitest. Ship before the next promote.
2. **N-2** (MEDIUM) — five-line owner check in `src/app/api/share/route.ts`; same PR as N-1, both are VGC-246.
3. **N-3** (MEDIUM) — timestamp window + rate limit on `/api/discord`; fold into VGC-274.
4. **N-4** (MEDIUM) — `creator_profiles` re-key; needs a migration, so feature branch.
5. **N-5 / N-6 / N-7 / N-8** (LOW) — batch into one hygiene pass.
6. **VGC-248** — OTel major bump when there's build headroom.
