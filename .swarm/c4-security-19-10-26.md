# C4 — Security Audit, 19 Oct 2026

Read-only audit. Branch `claude/loving-sagan-tv9kmf` @ `534a59b`, identical to `origin/main` (verified: `git rev-parse HEAD origin/main` match). No source files modified, nothing committed.

Scope: `npm audit` triage, repo-wide secrets scan (incl. git history), OWASP review of all 59 route handlers under `src/app/api/**`, and the three named known-area follow-ups (VGC-264, VGC-299, VGC-274).

**Headline:** the API layer is in good shape — repeated prior audits have clearly landed. SQL injection surface is empty, collaborator authz is consistent, SSRF is allowlisted everywhere. Two real problems: a never-rotated credential in public git history, and one route that skips the visibility check every other route applies.

---

## P0/P1 — act now

### P0-1 — Live Discord webhook token in PUBLIC git history, never rotated — CONFIRMED

- **Where:** `src/app/api/feedback/route.ts` as committed in `5da513a` ("Wire feedback to Discord webhook notifications"). Removed from the tracked tree in `28f5b8b`. Value redacted: `https://discord.com/api/webhooks/REDACTED`.
- **Working tree is clean.** Repo-wide grep over all tracked and untracked files (excluding `node_modules`, `.git`, `.next`) finds zero webhook URLs, zero real keys. Everything matching a secret shape in the tree is a placeholder (`.env.example:22` `https://xxxx.upstash.io`; `docs/STRIPE_PAID_REPORTS_ARCHITECTURE.md:335-338` `sk_test_...`/`whsec_...`; `.swarm/r-clerk-webhook-18-05-26.md:39` `whsec_xxxx...`). `.env*` and `.claude/` are gitignored and neither contains a tracked secret.
- **But the repo is public** — `gh api repos/MSS23/VGC-Team-Report` → `{"private": false, "visibility": "public"}` — so the blob in `5da513a` is still fetchable by anyone. Two occurrences across history; one distinct URL.
- **Exploit path:** attacker clones `github.com/MSS23/VGC-Team-Report`, runs `git log -p | grep -o 'discord.com/api/webhooks/[0-9]*/[A-Za-z0-9_-]*'`, and POSTs to the webhook. Result: arbitrary messages (including @everyone and impersonated build/deploy notices) posted into the private #builds channel, plus the ability to DELETE the webhook and silence all cron/deploy alerting. No authentication needed; a Discord webhook URL *is* the credential.
- **This is already known and still open.** Commit `f55725f` is literally titled "swarm: P0 — live Discord webhook token in public git history", and `1c82542`'s message states: *"dropped from the tree in 28f5b8b, and never rotated — so it is still extractable from history. Three separate nightly runs have now rediscovered it."* The `.swarm/P0-leaked-discord-webhook-*.md` files referenced in the brief are no longer in the tree; the finding is unresolved regardless.
- **Fix:** Discord → Server Settings → Integrations → Webhooks → delete the leaked webhook, create a new one, update `DISCORD_BUILDS_WEBHOOK` in Vercel env. **~5 minutes, no code change, no deploy.** Rotation alone fully closes it — rewriting history (`git filter-repo`) is strictly secondary and not worth the force-push on a public repo once the token is dead.
- **Do not re-file.** Rotation is an operator action; the only thing blocking it is that nobody has clicked the button.

### P1-2 — `/api/team-graphic` renders any report, ignoring both visibility flags and creator redaction — CONFIRMED

- **Where:** `src/app/api/team-graphic/route.tsx:96`

  ```ts
  const rows = await sql`SELECT data FROM shares WHERE id = ${shareId} AND deleted_at IS NULL`;
  ```

  No `is_public` / `is_unlisted` predicate, and no `applyPrivateFieldRedaction` / `redactPasteFields` call (imports at lines 1-6 are only `next/og`, `getDb`, `apiGuard`, `resolveSlug`, `POKEMON_TYPES_MAP`). Every sibling route gets this right: `src/app/api/share/[id]/route.ts:200-202` 404s when `!isPublic && !isUnlisted`, and `src/app/api/oembed/route.ts:23` filters `is_public = TRUE`. `team-graphic` is the **only** non-owner-scoped read of `shares` in the whole API without a visibility predicate.
- **Exploit path A — tiered-publishing redaction bypass (strongest; unauthenticated, no id guessing).** VGC-142 lets a creator mark `evs`/`ivs`/`nature`/`item` private (`src/lib/sharing/redact-paste.ts:21`); `/api/share/{id}` strips them and returns `_redactedFields` so the UI shows "Some fields hidden by creator". `team-graphic` parses the *raw* paste and renders `item` at lines 494-496. So for any **public** report where the creator hid their items, an attacker just loads `GET /api/team-graphic?id=<public-id>&style=wide` and reads the hidden tech items off the PNG. Worse, `src/app/api/oembed/route.ts:41` publishes exactly this URL as `thumbnail_url`, so Discord/Slack link unfurls render the creator's hidden items automatically. Impact: the privacy control silently does not work — in competitive VGC, a concealed item choice is the whole point of hiding it before an event.
- **Exploit path B — private-report IDOR.** A report with `is_public = FALSE AND is_unlisted = FALSE` is 404'd by `/api/share/{id}` but still rendered by `team-graphic`, leaking species, items, abilities, tera types, tournament name, placement, creator name and record. Share ids are 8 chars of `[A-Za-z0-9]` (~2.2e14), so blind brute force is not the path. The realistic path is a **public→private flip**: the id was already shared, cached, bookmarked or unfurled while public, and flipping to private does not revoke `team-graphic`. Same for unlisted→private. Confirmed as a privacy-control bypass; lower reach than path A, which needs nothing but a public id.
- **Not exploitable:** `shareId` is unvalidated here (no `IdSchema` regex, unlike `share/[id]/route.ts:32`), but it is a parameterised bind in the Neon tagged template, so there is no injection. Worth tightening for hygiene only.
- **Fix:** add `AND is_public = TRUE` to line 96 (matching `oembed`), or accept unlisted too and run the paste through `applyPrivateFieldRedaction` before `parseTeamForGraphic`. **~15 minutes + a vitest case.** The redaction call is the part that must not be skipped — adding only the visibility predicate leaves path A fully open.
- **`HIGH CONFLICT RISK`** — `src/app/api/team-graphic/route.tsx` is in the named unmerged-PR set. Coordinate; do not land this blind.

### P1-3 — `next@16.3.0`: critical advisories, production-reachable via `next/og` — CONFIRMED (dependency), exploit chain SPECULATIVE

- **Where:** `package.json` → `"next": "^16.3.0"`, resolved to **16.3.0**. 9 advisories, one rated critical. Minimum safe version **16.3.8**.
- **Reachable here:**
  - **`next/og` ImageResponse RCE** (range `>=16.2.0 <16.3.6`) — 16.3.0 is squarely in range, and `next/og` is used in 6 places, including the **publicly reachable, unauthenticated** `src/app/api/team-graphic/route.tsx:125,375`, plus `src/app/opengraph-image.tsx`, `src/app/champions/opengraph-image.tsx`, `src/app/champions/[pokemon]/opengraph-image.tsx`, `src/app/s/[id]/opengraph-image.tsx`. Attacker-influenced strings (paste contents, tournament/creator names) flow into `ImageResponse`. I did not reproduce the advisory's trigger, so the end-to-end chain is **speculative** — but this is the one advisory where untrusted input demonstrably reaches the vulnerable component on a public route, which is enough to justify the bump on its own.
  - **SSG/ISR cache poisoning → cross-user content substitution + persistent DoS** (`<16.3.8`, two advisories) — the `src/app/champions/[pokemon]/` pages are SSG and SEO-critical. Poisoning those is a direct hit on the thing the project cares most about.
  - **Image Optimization SSRF** (`<16.3.8`) and **AVIF RCE** (`<16.3.3`) — mounted at `/_next/image`, but `next/image` is used in **0** components and no `images` config exists in `next.config`/`vercel.json`, so there is no configured remote pattern to pivot through. **Lowered to speculative.**
  - **Windows-hosted RCE** (`<16.3.3`) — not applicable; prod is Vercel Linux.
  - **Draft Mode leak into persisted pages** (`>=16.3.0 <16.3.8`) — Draft Mode is not used. Not applicable.
- **Overlap:** **not covered by any existing ticket.** VGC-300 is axios/sharp/undici/joi, VGC-248 is moderates, VGC-221 is Clerk/js-cookie. The `next` critical is a genuinely new item and currently the highest-ranked dependency risk in the tree.
- **Fix:** `npm i next@^16.3.8` (patch-level within 16.3.x, no breaking changes expected), then the full gate: `npm run typecheck`, `node node_modules/vitest/vitest.mjs run`, `node node_modules/next/dist/bin/next build`. **~30 minutes including the build.**
- **`HIGH CONFLICT RISK`** — touches `package.json` (and `package-lock.json`), named in the unmerged-PR set.

---

## npm audit triage

29 advisories: **1 critical, 13 high, 14 moderate, 1 low**. Full `npm audit --json` output retained at `/tmp/claude-0/-home-user-VGC-Team-Report/45bf5381-e44d-5b18-a9dc-6887f06a9c00/scratchpad/audit.json`.

Classification is from `package-lock.json` `dev`/`optional` flags plus the actual import graph — not from the package name.

### Production-reachable

| Package | Installed | Sev | Realistic path in THIS app |
|---|---|---|---|
| `next` | 16.3.0 | critical | **Yes — see P1-3.** `next/og` on a public route; SSG cache poisoning on the champions pages. |
| `undici` | 7.29.0 | high | **No reachable path.** Prod dep, but only via `cheerio@1.2.0`. `src/lib/import/limitless.ts:1` imports `{ load }` only — string parsing. `cheerio.fromURL` (the sole undici consumer) is never called; the app fetches with the platform `fetch`. The other parent, `jsdom`, is dev-only. Patch opportunistically; no exploit path. |
| `sharp` | 0.35.3 | high | **No reachable path.** An *optional* dep of `next`, not a direct dep. The libheif/librsvg CVEs need a crafted HEIF/SVG through image optimization — `next/image` has **0** usages and no `images.remotePatterns` is configured. Nothing in app code hands bytes to sharp. |
| `dompurify` | 3.4.13 | low | Via `posthog-js` + `jspdf`, both client-side. The DOM-XSS advisories require `IN_PLACE` sanitization of attacker HTML; neither library calls DOMPurify on attacker-controlled markup in this app. No path. |
| `fflate` | 0.8.2 | moderate | Via `posthog-js` + `jspdf`. Infinite loop on malformed ZIP64 — nothing unzips attacker archives. No path. |
| `@opentelemetry/*` (7 pkgs) | 0.214.x / 2.6.1 | moderate | Direct deps; the app emits OTel logs to PostHog (`src/instrumentation.ts`, used in `views/[shareId]`). The advisory is unbounded memory in **W3C Baggage propagation**, which is not configured — no inbound `baggage` header is parsed. **Speculative**, low value. Overlaps VGC-248. |

### Dev/build-only — not production-reachable

`axios@1.19.0` (**high, 12 advisories**) and `joi@18.2.3` (**high**) are **both `dev=true`**, reached only via `wait-on` ← `start-server-and-test` (the Cypress harness). They never ship and never see untrusted input — `wait-on` polls `localhost` during CI. Same for `qs` (`@cypress/request`), `vitest`/`@vitest/mocker` (path traversal via mock redirect — needs a malicious test file, i.e. you already lost), `js-yaml` (`@eslint/eslintrc`), `braces`/`micromatch`/`fast-glob`/`@next/eslint-plugin-next`/`eslint-config-next`, `browserslist` (`@babel/helper-compilation-targets`), `brace-expansion`, `source-map-js` (postcss/tailwind), `@humanfs/node`, `baseline-browser-mapping`.

### Conclusion, and a correction to VGC-300

> **VGC-300 ("axios, sharp, undici, joi highs") is materially overstated and should be de-prioritised, not worked as filed.** Of its four packages: **axios and joi are dev-only** (`wait-on` ← `start-server-and-test`); **sharp and undici are prod-tree but have no reachable path** (no `next/image`, no `cheerio.fromURL`). Zero of the four warrant urgency. VGC-248 (moderates) is likewise all dev-only plus the unreachable OTel Baggage issue. **VGC-221** (Clerk/js-cookie) no longer appears in audit output at all — `@clerk/nextjs@7.3.2` is clean here; worth closing after a confirming check.
>
> **The single dependency action worth taking is `next` → `>=16.3.8`** (P1-3), which no ticket currently covers. The remaining 28 advisories are dev/build-only or unreachable; batch them into the next routine `npm update` rather than a security push. Recommend amending VGC-300 with this triage instead of filing anything new.

---

## OWASP review — `src/app/api/**` (59 handlers)

Only P1-2 above is a confirmed defect. The rest of the surface verified clean:

**SQL injection — clean.** Zero occurrences of `sql.query`, `sql.unsafe`, or `.unsafe(` anywhere in `src/`. Every `ORDER BY` is a literal; `LIMIT`/`OFFSET` are bind params (`user/notifications/route.ts:44`, `cron/weekly-digest/route.ts:255`). No string interpolation reaches SQL. Nothing to flag.

**Authn/authz & IDOR — clean, with real ownership checks (not just "logged in").** Spot-verified `share/[id]` (`:143-153` owner-or-accepted-collaborator, 404 for private at `:200`), `share/[id]/versions` (`:43-51`, `:122-130`), `share/[id]/versions/[version]` (`:48-56`), `share/[id]/collaborators` (`:46-51` read; POST/DELETE owner-only), `share/[id]/fork` (`:67-83`), `share/route.ts` (`:171-184` owner-or-collaborator; `:297-310` visibility changes owner-only), `sync/[id]` (`:49-63`, **plus re-check inside the poll loop at `:92-95` so revocation terminates a live SSE stream** — notably careful), `changelog/[shareId]` (`:28-40`), `collaboration/[id]` via `src/lib/collaboration-access.ts:10-13`, `comments/[shareId]/[commentId]` (`:43-53`), `user/collections/[id]` (`:22`), `user/reports/[shareId]` (owner-scoped `WHERE` on every mutation), `quick-share/[id]/claim` (`:16-23`, browser-token bound). Every one is an id-scoped `WHERE … AND owner_id = ${userId}` or an explicit 403, not a bare `auth()` check.

**Collaborator status predicate — consistent.** All 11 authorization reads of `collaborators` carry `COALESCE(status,'accepted') = 'accepted'`, so a *pending* invitee gets nothing. `user/collaborations/route.ts:28-36` deliberately omits it to list pending invites, and correctly returns only preview metadata (species, tournament, placement) — never the full paste. The remaining status-less queries are deletes (`user/delete:57`, `cleanup`, `user/reports/[shareId]:146`) where status is irrelevant.

**SSRF — allowlisted on all three fetching routes.** `sprite/route.ts:40-45` host allowlist (`play.pokemonshowdown.com`) **and** `/sprites/` path prefix. `pokepaste/route.ts:13-23` host allowlist, then — good practice — **rebuilds** the URL from the literal `https://pokepast.es` + normalized `pathname` (`:53-55`) rather than fetching the user's string. `import/limitless/route.ts` is host-locked on **both** hops: `normalizeLimitlessUrl` (`src/lib/import/limitless.ts:13`) pins `https:` + `limitlessvgc.com` and rejects port/username/password, and the second-order fetch of `tournamentUrl` scraped out of the page is re-normalized through the same function (`:42`) — the obvious second-order SSRF is closed. `fetchPage` also sets `redirect: "error"` and a 2 MB cap. No findings.

**Input validation.** zod on all mutating user-facing routes (`share` 49 refs, `feedback` 11, `match-log` 9, `user/profile` 9, `user/collections` 9). Share ids validated against `/^[A-Za-z0-9]{8}$/` before use. `team-graphic` is the one route with no id validation — harmless given parameterisation, noted for hygiene.

**Rate limiting.** `apiGuard` (`src/lib/security/api-guard.ts:31-39`) on every public route except: the four crons, `cleanup`, `migrate`, `setup`, `bot`, `discord`, `keep-alive` and the three webhooks — all secret-gated, so appropriate. Two genuine gaps: `sprite` (P2-4) and `user/export` (P3-6).

**Secrets handling in admin routes — correct, fail-closed.** `src/lib/cron-auth.ts:8-17` and `src/lib/auth/verify-bearer.ts` both use `timingSafeEqual` with a length pre-check, and **return false when the env var is unset** (so a missing `CRON_SECRET` locks the route rather than opening it). All four crons call `isCronAuthorized` (`daily-ops:299`, `posthog-errors:205`, `weekly-digest:215`, `weekly-report:139`). `migrate:26` and `setup:14-19` require `MIGRATE_SECRET`/`CRON_SECRET` bearer.

**Webhooks.** `clerk` → `verifyWebhook` + rejects when `CLERK_WEBHOOK_SIGNING_SECRET` unset (`:28-31`). `posthog` → `timingSafeEqual` on `x-posthog-token` (`:174-186`), and the HogQL query uses server-side bound `values` (`:53-54`) rather than interpolation. `linear` → HMAC-SHA256 over the raw body + `timingSafeEqual` + a 60s `webhookTimestamp` replay window (`:49-73`). `discord` → `tweetnacl` signature verify **plus** an invoker allowlist for mutating commands that **fails closed when unconfigured** (`:57-58`). All four solid.

**Not a secret:** `DISCORD_PUBLIC_KEY` hardcoded at `src/app/api/discord/route.ts:7`, and the Linear label UUIDs at `webhooks/posthog/route.ts:427-434` / `cron/posthog-errors/route.ts:24-28`. A Discord application public key is published by design — it verifies inbound signatures and grants nothing. Correctly in source; flagging it would be noise.

**Error responses — no internal leakage.** No route returns a stack trace or raw driver error. The two routes that echo `error.message` (`quick-share/route.ts:18`, `import/limitless/route.ts:45`) only surface app-authored strings (`validateQuickPaste`, `fetchPage`: "Limitless returned 404…", "Paste is too large."). Everything else logs server-side and returns a generic message. No finding.

---

## Known-area follow-ups

### VGC-264 — `x-forwarded-for` left-most parsing → **ALREADY FIXED. Recommend closing.**

The ticket's claim that three routes still take the left-most value is **stale**. A hardened trusted-proxy helper exists and is used consistently:

- `src/lib/security/input-validation.ts:75-103` prefers platform-set `x-vercel-forwarded-for` / `x-real-ip`, then takes **only the right-most** `x-forwarded-for` entry — and deliberately does *not* scan leftwards for the first parseable address (`:62-66` explains why: that would let a caller reinstate the spoof by appending junk).
- All 5 call sites go through it: `share/route.ts:106`, `share/[id]/fork/route.ts:139`, `quick-share/route.ts:12`, `comments/flag/route.ts:36`, `explore/route.ts:21`, plus `api-guard.ts:32` which covers every rate-limited route.
- **Zero** route files contain the raw header, enforced in CI by `src/lib/security/__tests__/no-raw-forwarded-for.test.ts:19-24`, which walks every `route.ts(x)` under `src/app/api` and asserts no file matches `/x-forwarded-for/i`. Behaviour is pinned by 9 cases in `input-validation.test.ts`.

One residual, **by design and documented** at `:70-73`: the final fallback returns the literal `"unknown"`, collapsing all header-less clients into one bucket. The code itself says sensitive routes should treat `"unknown"` as always-rate-limited. No route does. P3 at most, and the fingerprint fallback (`:93-100`) makes it hard to reach in practice. Not worth a ticket.

### VGC-299 — Linear webhook catch-all `return 200` → **CONFIRMED, P3, no security impact.**

`src/app/api/webhooks/linear/route.ts:80-83` swallows every exception and returns `{ok: true}` 200. Real, and it does hide crashes from Linear's delivery log. But: the handler is a **no-op** — it verifies the signature, answers `url_verification`, and returns. It performs no DB write, no Linear mutation, no Discord post (`:61-79`). So there is no state to corrupt and nothing an attacker gains; a swallowed error means at most a lost webhook that was going to be discarded anyway. Signature verification, timing-safe compare and the replay window all sit *before* the catch and return their own 401/400. **Observability debt, not a vulnerability** — fix by logging before the 200 (`console.error` + keep the 200 so Linear doesn't auto-disable). ~5 minutes. Rank it below the P2.

### VGC-274 — CORS `Access-Control-Allow-Credentials` → **ALREADY FIXED. Recommend closing.**

`src/lib/security/cors.ts:53-58` omits the header deliberately, with a comment naming VGC-274 and the reasoning (the app only calls `/api` same-origin; omitting it means even a widened allowlist can only leak anonymous responses). Origin reflection is tight too: `:35-36` anchors preview deployments on the `-mss23s-projects` scope suffix rather than a `vgc-team-report*` prefix, which closes the attacker-registrable `*.vercel.app` hole described at `:25-33`. `getCorsHeaders` returns an **empty** `Allow-Origin` for a non-allowlisted origin rather than `*`. Pinned by `src/lib/security/__tests__/cors.test.ts`. No finding.

---

## P2 / P3

### P2-4 — `/api/sprite` has no rate limit and its cache key is attacker-chosen — CONFIRMED

- **Where:** `src/app/api/sprite/route.ts:25-58`. The only unauthenticated route in the API with **no** `apiGuard` call.
- **Exploit path:** the inner URL's query string survives into `target.href` at `:51`, and the host/path allowlist (`:40-45`) does not constrain it. So `GET /api/sprite?u=https://play.pokemonshowdown.com/sprites/gen5/pikachu.png?cb=<N>` is a *distinct* edge-cache key for every `N` while still passing validation. Looping `N` defeats the `immutable` caching at `:71` entirely and yields one Vercel edge invocation plus one upstream fetch per request. Impact is twofold: unmetered burn of Pro-plan edge invocations and egress (directly against the cost guardrails in CLAUDE.md, where Vercel usage is dashboard-only and cannot be queried), and the app becomes an open reflector for hammering Showdown's CDN from Vercel IPs — a plausible route to getting the sprite CDN to block us.
- **Fix:** add `const guard = await apiGuard(request, { rateLimit: { key: "sprite", max: 120 } }); if (guard) return guard;` and strip the query before fetching (`target.search = ""`) so the cache key is canonical. **~10 minutes + a test.** The `target.search = ""` line is the part that actually restores the cache; the rate limit alone just raises the cost of the same attack.
- Not in the conflict set.

### P3-5 — the hardcoded-credential CI guard exists only on an unmerged branch — CONFIRMED

`1c82542` added `src/lib/security/__tests__/no-hardcoded-secrets.test.ts` (216 lines; scans tracked non-binary files for Discord webhooks, Linear/Clerk/GitHub/AWS keys, JWTs and Postgres URLs with a real password, reporting file:line and never the value). It is **absent from the working tree**, and `git merge-base --is-ancestor 1c82542 HEAD` returns false — the commit lives only on `origin/claude/loving-sagan-12996k`. So `main` has no CI guard, and the nightly rediscovery loop the commit message complains about is still unbroken.

**Fix: merge that existing branch — do not rewrite the test.** It is likely one of the ten open PRs. `HIGH CONFLICT RISK` by association (it adds a file under `src/lib/security/__tests__/`, which no other named file touches, so the conflict risk is actually low — but confirm it is not already in review before touching it).

### P3-6 — `/api/user/export` has no rate limit — CONFIRMED, low impact

`src/app/api/user/export/route.ts` is `auth()`-gated but has no `apiGuard`, and fires **13** sequential queries per call (`:43-93`). A single signed-in account can loop it to generate sustained Neon load. Bounded by `LIMIT + 1` per query and requires authentication, so this is cost/availability only, no data exposure. Fix: add `apiGuard(request, { rateLimit: { key: "export", max: 3, windowMs: 3_600_000 } })`. ~5 minutes.

### P3-7 — `team-graphic` share id is unvalidated — hygiene

`src/app/api/team-graphic/route.tsx:88-96` takes `id` straight from the query string with no `IdSchema` check, unlike every other id route. Parameterised, so **not** exploitable. Fold the regex in alongside the P1-2 fix; no separate work.

---

## Explicitly checked and clean (no action)

Recording these so the next run does not re-derive them:

- **Secrets in the working tree:** none. Full-repo scan for `sk_live_`/`sk_test_`/`pk_live_`/`whsec_`/`xoxb-`/`ghp_`/`github_pat_`/AWS/Google/`lin_api_`/`phc_`/Postgres and Redis connection strings with credentials/Upstash URLs → only placeholders (listed under P0-1). Git **history** scan for the same patterns → only `lin_api_xxxx` and `whsec_xxxx` placeholders. The Discord webhook in P0-1 is the sole real credential ever committed.
- **`src/app/api/share/route.ts`**, **`src/app/api/explore/route.ts`**, **`src/app/page.tsx`**, **`package.json`** — reviewed; no findings beyond the `next` bump. All `HIGH CONFLICT RISK` if touched.
- **Sibling-agent files ignored as instructed:** `src/lib/db.ts`, `src/lib/types/pokemon.ts`, `src/lib/parser/showdown-parser.ts`, `src/lib/data/move-names.ts`, `src/lib/utils/translate-move.ts`.
- `spotlight` (`:29-31` `is_public = TRUE`), `user/drafts` (`:69-72` owner-scoped), `views/[shareId]` (`:40,45` `is_public = TRUE`), `oembed` (`:23` `is_public = TRUE`) — all correctly gated.
- `vercel.json` crons are daily/weekly only, per policy.

---

## Recommended order

| # | Action | Effort | Conflict |
|---|---|---|---|
| 1 | **Rotate the leaked Discord webhook** (P0-1) | 5 min, no deploy | none |
| 2 | Add visibility predicate **+ `privateFields` redaction** to `team-graphic` (P1-2, P3-7) | ~15 min + test | **HIGH** |
| 3 | `next` → `>=16.3.8` (P1-3) | ~30 min incl. build | **HIGH** |
| 4 | Rate-limit `/api/sprite` + canonicalize its cache key (P2-4) | ~10 min + test | none |
| 5 | Merge the existing `no-hardcoded-secrets` test branch (P3-5) | review only | low |
| 6 | Rate-limit `/api/user/export` (P3-6); log before the Linear 200 (VGC-299) | ~10 min | none |
| 7 | Amend VGC-300/VGC-248 with the triage above; verify and close VGC-221, VGC-264, VGC-274 | ticket hygiene | none |

Items 2 and 3 must be coordinated against the ten open PRs before any code is written.
