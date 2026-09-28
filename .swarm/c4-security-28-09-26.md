# C4 Security Audit — VGC Team Report — 2026-09-28

Read-only authorised defensive audit. Excludes work already In Review:
**VGC-264** (x-forwarded-for left-most), **VGC-246** (private report enforcement —
this is why `/api/team-graphic`'s missing `is_public` filter is NOT reported below;
the open PR carries `src/lib/security/__tests__/team-graphic-visibility.test.ts`),
**VGC-274** (CORS Allow-Credentials + webhook replay).

`CONFLICT-RISK` is against `.swarm/open-pr-conflict-risk.md` (7 open PRs).
Zero-conflict findings first within each severity band.

---

## 1. Exploitable findings

### F1 — HIGH — Any account can permanently destroy any creator's profile
`src/app/api/user/delete/route.ts:25`, `:79-82` · `src/app/api/share/route.ts:54`
**CONFLICT-RISK: no** (`user/delete/route.ts` is in no open PR)

`creatorName` on a share is unvalidated free text (`creatorName: z.string().optional()`,
no identity binding, no `.max()`). The account-deletion route reads that free text back
out of the attacker's *own* share and uses it as a delete key:

```
25:  SELECT id, data->>'creatorName' as creator_name FROM shares WHERE owner_id = ${userId}
81:  DELETE FROM creator_profiles WHERE LOWER(name) = LOWER(${creatorName})
```

**Exploit (2 requests, free account):**
1. `POST /api/share` — `{"state":{"paste":"Pikachu","creatorName":"<victim display name>","tags":{...}}}`
2. `DELETE /api/user/delete`

Step 2 runs `DELETE FROM creator_profiles WHERE LOWER(name) = LOWER('<victim>')` inside
`sql.transaction(...)`. The victim's `bio`, `twitter`, `discord`, `youtube`, `avatar_url`
and `accent_theme` are gone. Irreversible, no audit row, no notification. The attacker
destroys their own account in the process, which is a rounding error for a throwaway.

**Fix.** Stop keying the purge on report JSON. Minimal: derive the name from Clerk
(`currentUser()`, the same expression `profile/route.ts:71-73` uses) instead of
`data->>'creatorName'`, and only delete when no other live share claims that name.
Correct: add `owner_id` to `creator_profiles` (see F2) and delete by `owner_id = ${userId}`.
**Diff:** ~10 lines (minimal) / ~25 lines + 1 `ensureTable` migration (correct).

---

### F2 — HIGH — Creator profile takeover via Clerk display-name collision
`src/app/api/user/profile/route.ts:71-95` (PUT), `:36-41` (GET) · schema `src/lib/db.ts:74-76`
**CONFLICT-RISK: yes** — `user/profile/route.ts` is touched by 2 open PRs

`creator_profiles` is keyed `name TEXT PRIMARY KEY` with **no owner column**. The PUT
handler derives the row key from the caller's Clerk display name and upserts:

```
71:  const creatorName = user.firstName ? `${user.firstName}${...lastName...}` : user.username || "Unknown";
86:  ON CONFLICT (name) DO UPDATE SET bio = ..., twitter = ..., avatar_url = ..., is_public = ...
```

Clerk lets a user edit their own `firstName`/`lastName` freely, with no verification.

**Exploit:** attacker renames their Clerk profile to a target creator's display name, then
`PUT /api/user/profile` with
`{"bio":"...","twitter":"attacker","avatarUrl":"https://attacker/x.png","isPublic":false}`.
`ON CONFLICT (name) DO UPDATE` overwrites the victim's row; `/creator/<name>` and
`/api/creator/[name]/route.ts:66` then serve the attacker's bio, social links and avatar
under the victim's name — or, with `isPublic:false`, hide the real creator's profile
entirely. The same rename also makes `GET /api/user/profile` disclose a profile whose
owner set `is_public = false`.

Secondary: `avatarUrl` is validated only by `.startsWith("https://")`
(`route.ts:21-24`) — any host, rendered on a public page.

**Fix.** `ALTER TABLE creator_profiles ADD COLUMN owner_id TEXT` + `UNIQUE(owner_id)`;
make `owner_id` the conflict target and reject a write whose `name` is already held by a
different `owner_id`. **Diff:** ~20 lines + 1 migration.

---

### F3 — MEDIUM — Verified-badge spoofing and follower-feed hijack
`src/app/api/explore/route.ts:270`, `:323` · `src/app/api/creator/[name]/route.ts:65`
`src/app/api/spotlight/route.ts:51` · `src/app/api/share/route.ts:54`, `:532`
**CONFLICT-RISK: yes** — `share/route.ts`, `explore/route.ts`, `creator/[name]/route.ts` all in open PRs

`isVerified` is a lowercased string match against `verified_creators` on the
client-supplied JSON field, with nothing tying it to `shares.owner_id`:

```
270:  SELECT name FROM verified_creators WHERE LOWER(name) = ANY(${creatorNames.map(n => n.toLowerCase())})
323:  isVerified: creatorNameStr ? verifiedSet.has(creatorNameStr.toLowerCase()) : false
```

**Exploit:** `POST /api/share` with `creatorName: "<a verified creator>"` and
`isPublic: true`. The attacker's report renders with the verified badge on `/explore`,
and `/api/creator/<name>` UNIONs it onto the real creator's page
(`creator/[name]/route.ts:49` matches on `data->>'creatorName'`). `share/route.ts:532`
then calls `notifyFollowers(state.creatorName, id, ...)`, which
(`src/lib/notifications.ts:41-47`) inserts a `new_report` notification for **every**
follower of that creator, pointing at the attacker's share.

**Fix.** Resolve the badge and the follower notification from `shares.owner_id` via an
owner-bound profile row (F2's `owner_id`), not from the JSON blob. Interim: gate both on
`owner_id IS NOT NULL` **and** the name being one the owner actually owns.
**Diff:** ~15 lines across 4 routes.

---

### F4 — MEDIUM — Unmetered edge-invocation amplification on /api/sprite (billing DoS)
`src/app/api/sprite/route.ts:25-58` · `src/proxy.ts:27-29`
**CONFLICT-RISK: yes** — `sprite/route.ts` in 1 open PR (small, localised change)

Middleware early-returns for `/api/sprite`, so there is no bot detection, no CORS/CSRF
**and no rate limit** — and the route never calls `apiGuard` either. The allowlist checks
only `hostname` and `pathname`; the query string rides along in `target.href`:

```
40:  if (!ALLOWED_HOSTS.has(target.hostname)) ...
43:  if (!target.pathname.startsWith("/sprites/")) ...
51:  const upstream = await fetch(target.href, ...)
```

**Exploit:** `GET /api/sprite?u=https://play.pokemonshowdown.com/sprites/gen5/pikachu.png?c=<random>`
— every distinct `c` is a distinct CDN cache key, so every request is a fresh edge
invocation plus an upstream fetch. Unauthenticated, unbounded, and aimed squarely at the
Vercel Pro invocation budget the repo guardrails exist to protect. `Cache-Control: immutable`
does nothing because the key is never repeated.

SSRF itself is closed (host + path allowlist) — this is purely cost/availability.

**Fix.** `target.search = ""; target.hash = "";` before the fetch; add an extension
allowlist (`/\.(png|gif|webp|jpe?g)$/.test(target.pathname)`); call `apiGuard` inside the
route (middleware must stay skipped for the documented cost reason).
**Diff:** ~8 lines.

---

### F5 — MEDIUM — Three rotating IPs hard-delete any comment on any public report
`src/app/api/comments/flag/route.ts:36`, `:64-67`
**CONFLICT-RISK: no**

```
36:  const flagKey = userId ? `user:${userId}` : `ip:${getClientIp(request)}`;
64:  if (count >= FLAG_THRESHOLD) {              // FLAG_THRESHOLD = 3
66:    await sql`DELETE FROM comments WHERE id = ${commentId}`;
67:    await sql`DELETE FROM comment_flags WHERE comment_id = ${commentId}`;
```

VGC-264 fixed the *spoofed-header* path, but the unauthenticated `ip:` fallback still
means three distinct source addresses are enough — and the action is a **hard DELETE**,
not a hide. IPv6 source rotation inside a single /64 is free on most mobile and VPS
networks; three free Clerk signups work too.

**Exploit:** `GET /api/comments/<shareId>` to enumerate `commentId` (a plain serial), then
`POST /api/comments/flag {"commentId":N,"sessionId":"anything"}` from 3 addresses. The
comment is gone, and so are its flag rows — no trace, no owner notification, no undo.
Works on any public report, including reports the attacker has no relationship to.

**Fix.** Require `userId` to flag (drop the `ip:` fallback), and make the threshold set
`hidden = TRUE` rather than `DELETE`, so moderation is reversible.
**Diff:** ~12 lines + 1 column.

---

### F6 — LOW — View-count inflation via client-chosen dedupe key
`src/app/api/views/[shareId]/route.ts:37`
**CONFLICT-RISK: no**

`cacheSetIfAbsent(`view:${shareId}:${parsed.data.sessionId}`, 600)` dedupes on a
**client-supplied** `sessionId`. Rotate it and every request increments `view_count`
(capped only by `apiGuard`'s 60/min/IP ≈ 86k/day/IP). Distorts the `views` sort on
`/explore` and adds Neon writes on a 512MB free tier.
**Fix:** key the dedupe on `getClientIp(request)` + `shareId`, keep `sessionId` for
analytics only. **Diff:** ~3 lines.

### F7 — LOW — /api/pokepaste POST is an unauthenticated third-party write relay
`src/app/api/pokepaste/route.ts:115-158`
**CONFLICT-RISK: yes** (`pokepaste/route.ts` in 1 open PR)

No `auth()` — anyone can push up to 50KB of arbitrary text to `pokepast.es/create` from
the app's server IP at 20/min/IP, with no paste-shape validation. Abuse lands on our IP's
reputation with a third party.
**Fix:** require `auth()`, or validate the body parses as a Showdown paste.
**Diff:** ~5 lines.

---

## 2. Hardcoded secrets

**No live credential is committed.** `.gitignore` covers `.env*` (with `!.env.example`);
`git ls-files` tracks only `.env.example`; `git log --all --diff-filter=AD` over
`*.env`, `*.env.local`, `*.pem`, `*.key` returns nothing. `public/` is clean (only a
comment in `public/sw.js:233` mentions the word "token").

**There is no literal webhook signing secret in the repo — the P0 does not exist here.**
The only hardcoded high-entropy literal is:

| Location | Shape | Verdict |
|---|---|---|
| `src/app/api/discord/route.ts:7` `DISCORD_PUBLIC_KEY` | 64 lowercase hex chars | **Not a secret.** Ed25519 *verification* public key from the Discord dev portal — it verifies signatures, it cannot produce them, and Discord publishes it in its own UI. Nothing is exposed. |

Config hygiene only: pinning it in source means a Discord app key rotation requires a code
deploy, and the route has no fail-closed path if the key is ever wrong. Recommend moving
it to a `DISCORD_PUBLIC_KEY` env var and 401-ing when unset — a ~4-line change, **not** a
P0 and **not** an incident. Every other webhook/cron secret is correctly read from
`process.env` with no literal fallback (the only `env ?? "literal"` fallbacks in the repo
are PostHog *hostnames* and the canonical app URL — see `cron/posthog-errors/route.ts:63`,
`webhooks/posthog/route.ts:26`, `lib/posthog-server.ts:12`, `s/[id]/opengraph-image.tsx:68`).

Placeholders only, no action: `.env.example`, and
`docs/STRIPE_PAID_REPORTS_ARCHITECTURE.md:335-338` (`sk_test_...`, `whsec_...` ellipses).
Other long literals are Linear label/team UUIDs (`cron/posthog-errors/route.ts:25-27`,
`webhooks/posthog/route.ts:428-433`) and base62 ID alphabets — non-sensitive.

---

## 3. `src/lib/security/` helpers — are they actually used?

| Helper | Verdict |
|---|---|
| `api-guard.ts` `apiGuard` | Used by 30+ routes. Genuinely missing on **`/api/sprite`** (F4) — and there middleware is skipped too, so that route has *zero* protection. Absent-but-fine elsewhere: `bot`, `setup`, `migrate`, `cleanup`, all `cron/*`, all `webhooks/*`, `discord` (bearer/HMAC/Ed25519 instead); `user/export` and `feedback` roll their own per-user limit. |
| `input-validation.ts` `getClientIp` | Right-most XFF, platform headers first — correct post-VGC-264, with regression tests. Residual: the `fp:<user-agent>|...` fallback (`:93-100`) is attacker-controlled. Unreachable behind Vercel (`x-vercel-forwarded-for` is always set), but it is the identity F5 leans on, so F5's fix should not depend on it. |
| `cors.ts` | Scope-anchored preview regex, no `Allow-Credentials` (VGC-274). Correct. |
| `csrf.ts` | Enforced only for *true* cross-origin requests (`src/proxy.ts:107`), i.e. never for same-origin or allowlisted origins — so CSRF is effectively off and CORS + Clerk's SameSite cookie are the real defence. Defensible as documented; noting it so it isn't mistaken for active protection. |
| `bot-detection.ts` | Applied in middleware; deliberately skipped for `/api/sprite`, `/api/discord`, cron and webhooks. |
| `verify-bearer.ts` (`src/lib/auth/`) | `timingSafeEqual`, length-checked, fails closed when the env var is unset. Correctly gates `bot`, `setup`, `migrate`, `cleanup` (GET + DELETE), `keep-alive` and all 5 cron routes. No gap found. |

**Injection:** every DB call goes through `@neondatabase/serverless` tagged templates. The
only dynamic fragments — `explore/route.ts:212` `col`, and the filter/cursor conditions —
are `sql`` ` fragments chosen from a 3-value allowlist (`explore/route.ts:27`). No
`sql.unsafe`, no string concatenation into SQL, no `eval`/`new Function`. `to_tsquery`
input is stripped to `\w` + `:*` (`:83`). **No SQL injection found.**

**SSRF:** `/api/sprite` (host + path allowlist) and `/api/pokepaste` GET (URL rebuilt from
the validated pathname, `:53-55`) are both closed. Only F4's query-string cost issue remains.

**XSS:** the one meaningful `dangerouslySetInnerHTML` sink, `src/components/seo/JsonLd.tsx:5`,
escapes `<` → `<` before injection — safe. `src/app/layout.tsx:100` is a static literal.
Comment bodies and profile bios are `escapeHtml`-ed on write and React-escaped on render.

**Authz:** ownership enforcement is otherwise strong. `share/route.ts:157-179` correctly
treats `edit_token` as a nonce and *also* requires owner-or-accepted-collaborator;
`:289-303` restricts visibility changes to the owner; `share/[id]/route.ts:196-202` 404s
truly-private reports for outsiders; `collaborators`, `versions`, `sync`, `changelog`,
`collections`, `saved`, `drafts`, `match-log` and `user/reports/[shareId]` all scope on
`owner_id`/`user_id`. The gap is not per-report authz — it is that **creator identity is a
display-name string with no owner binding** (F1/F2/F3 share that single root cause).

Minor, not written up: `reactions/[shareId]/route.ts:77` and `team-graphic` omit
`is_public`, letting a share-ID holder like / confirm the existence of a non-public report.
The `team-graphic` half is VGC-246's territory.

---

## 4. `npm audit` triage — 19 findings, 1 real action

Totals: 1 critical, 3 high, 14 moderate, 1 low / 819 deps (132 prod).
Prod-tree membership verified with `npm ls --omit=dev`.

### Dev-only — noise, do not act
`js-yaml` HIGH, `browserslist` HIGH, `qs` MOD, `baseline-browser-mapping` MOD,
`@humanfs/node` MOD, `vitest` + `@vitest/mocker` MOD, `joi` LOW.
All confirmed **absent from the production tree** (`npm ls --omit=dev` → empty) — they come
in via `cypress`, `start-server-and-test` and `eslint`. The `@vitest/mocker` path traversal
needs a malicious test file, i.e. it presupposes repo write access.

### Prod tree — present but not reachable
- **`next` 16.3.0 — CRITICAL ×2.** GHSA-p293-qw3h-jr36 is Windows-hosted-server RCE;
  deployment is Vercel/Linux → not reachable. GHSA-2xp9-vwfh-vxw4 is RCE in the Image
  Optimization API via attacker-supplied AVIF, which needs a remote image URL —
  `next.config.ts:33` sets `remotePatterns: []`, so `/_next/image` serves local
  `public/*` assets only → not reachable.
- **`sharp` 0.35.3 — HIGH** (libheif, via `next`). Same reasoning: no user-uploaded or
  remote images anywhere; `ImageResponse` in `team-graphic`/`opengraph-image` pulls PNGs
  from the Showdown allowlist. Not reachable.
- **`fflate` 0.4.8 — MOD** (via `posthog-js`). Infinite loop on malformed ZIP64;
  `posthog-js` never parses attacker ZIPs. Noise.
- **`@opentelemetry/*` 2.6.1 — MOD.** Unbounded allocation in W3C Baggage propagation.
  `src/instrumentation.ts` does not propagate client `baggage` headers, so it is not
  reachable today; the published fix is a semver-major bump of `sdk-logs`/`exporter-logs-otlp-http`
  and is not worth taking for an unreachable moderate.

### The one action
`npm i next@^16.3.3` — clears the critical pair and pulls the patched `sharp` transitively.
Defence-in-depth rather than an active exposure, so **piggyback it on the next real push**
(per the repo's no-speculative-push cost guardrail), and make sure the tip commit carries
code so Vercel's Ignored Build Step does not cancel the build.

---

## 5. Suggested order

| # | Severity | Finding | CONFLICT-RISK | Diff |
|---|---|---|---|---|
| F1 | HIGH | Cross-account `creator_profiles` destruction via `/api/user/delete` | **no** | ~10 lines |
| F5 | MED | 3 rotating IPs hard-delete any public comment | **no** | ~12 lines + column |
| F6 | LOW | View-count inflation | **no** | ~3 lines |
| F2 | HIGH | Creator profile takeover via Clerk display name | yes | ~20 lines + migration |
| F3 | MED | Verified-badge spoof + follower-feed hijack | yes | ~15 lines |
| F4 | MED | `/api/sprite` unmetered invocation amplification | yes | ~8 lines |
| F7 | LOW | `/api/pokepaste` POST open write relay | yes | ~5 lines |
| — | — | `npm i next@^16.3.3` (unreachable, defence-in-depth) | no | lockfile |

F1, F2 and F3 are one root cause: **creator identity is an unbound display-name string.**
Adding `owner_id` to `creator_profiles` and resolving creator identity from `shares.owner_id`
closes all three; F1 alone is worth shipping first because it is zero-conflict, two requests,
and irreversible.
