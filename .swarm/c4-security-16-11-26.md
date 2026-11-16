# C4 — Security Audit, 16 Nov 2026

Read-only audit on branch `swarm-nightly-2026-11-16` (HEAD `10dfd74`). No source file edited, no git state changed, nothing committed or pushed, no outbound sends. This file is the only write.

Scope: `npm audit --json` triage tied to **VGC-221** and **VGC-248**; working-tree + git-history secrets scan and an assessment of the `no-hardcoded-secrets` guard's coverage; OWASP pass over the 58 route handlers under `src/app/api/**` (57 `route.ts` + 1 `route.tsx`).

**Headline:** the October report's two HIGHs are half-closed. `team-graphic` is **fully fixed** (visibility gate *and* redaction). The `Content-Length` chunked bypass is **fully fixed**. The direct `zod` high is **fixed** (4.6.6). But the creator-profile takeover is **unchanged**, and the fork route opens a **new, one-click bypass of the same tiered-publishing redaction that `team-graphic` was just fixed to honour** — the control was repaired in one place and left open in another. Six exploitable-today findings; the top two share one root cause each with an existing ticket.

**Caveats:** PostHog credentials are absent from this container, so no finding is corroborated against production telemetry. The git history in this clone is **shallower than October's** — commits `5da513a` / `28f5b8b` (the VGC-305 webhook leak) are not valid objects here, so the history half of VGC-305 **could not be re-verified this run** (see §2).

---

## 1. npm audit triage — tied to VGC-221 / VGC-248

```
$ npm audit --json | jq .metadata.vulnerabilities
{ "info": 0, "low": 0, "moderate": 16, "high": 7, "critical": 0, "total": 23 }
```

Total has risen 9 → 23 since October, but **not one of the new entries is production-reachable**. Every added advisory is in the dev/lint/e2e toolchain.

| Package | Sev | Advisory | Dependency path | Reachable? | Fix breaking? | Ticket |
|---|---|---|---|---|---|---|
| `@opentelemetry/core` + 7 fan-out nodes | moderate ×8 | GHSA-8988-4f7v-96qf — unbounded alloc in W3C **Baggage** propagation (`<2.8.0`) | 3 direct deps (`exporter-logs-otlp-http`, `resources`, `sdk-logs`) + transitives | **Server, loaded, not invoked** — `src/instrumentation.ts` uses the SDK as a *log exporter only*; no inbound `baggage` header is parsed and no trace context is extracted from client requests | **Yes** — semver-major to `0.301.2` / `3.1.1` | **VGC-248** |
| `@typescript-eslint/*` ×5 + `typescript-eslint` + `eslint-config-next` + `minimatch` | moderate ×8 | GHSA-g3hv-75wg-m249 — minimatch globparts DoS, surfacing through the TS-ESLint chain | `eslint-config-next@16.1.6 → typescript-eslint@8.56.1 → …/minimatch@10.2.4`. `npm ls --omit=dev` → **empty** | **No — lint-time only.** CI runs eslint; no attacker input reaches a glob | **Yes** — npm's only offer is `eslint-config-next@15.5.29`, a **major downgrade** that would regress Next 16 lint rules. Do not take it | **VGC-248** |
| `zod@4.1.11` | **high** | GHSA-mrhx-c7xc-m3w5 — memory exhaustion validating oversized constrained collections | `@vercel/blob@2.8.2 → @vercel/oidc@3.8.10 → @vercel/cli-config@0.3.1 → zod@4.1.11` (**nested copy, in the prod tree**) | **Loaded, not invoked.** Empirically confirmed: `require('@vercel/blob')` eagerly pulls 13 `@vercel/oidc` / `cli-config` modules into `require.cache`, so the vulnerable zod ships in the share-route bundle (`src/lib/sharing/og-image.ts:1` → `src/app/api/share/route.ts:9`). But cli-config's schemas validate the **Vercel CLI's own global config files** (`~/.config/vercel/*`), never request data. No attacker-controlled value reaches it | **Yes, and backwards** — npm's offer is `@vercel/blob@2.4.0`, a major **downgrade** of a load-bearing prod dep | **VGC-248** |
| `@vercel/blob` / `@vercel/oidc` / `@vercel/cli-config` | high ×3 | No own advisory — all three are flagged purely as *effects* of the nested `zod` above | as above | as above | as above | **VGC-248** |
| `follow-redirects@1.16.1` | high | GHSA-mrwp-f3q8-3g9p — cross-realm `sensitiveHeaders` discarded, credentials follow redirects | `start-server-and-test@2.1.5 (dev) → wait-on@9.0.4 → axios@1.20.0 → follow-redirects`. `npm ls --omit=dev` → **empty** | **No — dev-only.** Reached only by `npm run test:e2e`, which CI does not run (`.github/workflows/ci.yml` = tsc + eslint + vitest) and which is disabled in this container (`CYPRESS_INSTALL_BINARY=0`) | **No** — `fixAvailable: true`, in-range patch | **VGC-248** (note as informational) |
| `joi@18.3.0` | high | GHSA-4528-x5fx-h6hg — quadratic split in `string().email({multiple:true})` | `start-server-and-test → wait-on → joi`. `--omit=dev` → **empty** | **No — dev-only.** Parses `wait-on`'s own option objects; never sees attacker input | **No** — in-range patch to 18.3.1 | **VGC-248** (informational) |
| `systeminformation@5.33.1` | high (aggregate) | GHSA-4vjg-vx72-qq4g (path traversal, CVSS 3.3 *low*) + prototype pollution in `networkStats()` | `cypress@15.18.0 (dev) → systeminformation`. `--omit=dev` → **empty** | **No — dev-only**, and Cypress is not even installed in this container | **No** — in-range patch | **VGC-248** (informational) |

### Tie-ins and verdicts

- **VGC-221 (Clerk / js-cookie advisories) — STALE. Close it.** `@clerk/nextjs@7.5.9 → @clerk/shared@4.22.0 → js-cookie@3.0.7` is in the prod tree, and **neither `js-cookie` nor any `@clerk/*` package appears in the current audit at any severity.** Both resolve above their last advisory. Nothing to do.
- **VGC-248 ("12 moderate vulns needing breaking upgrades") — still the right ticket, but the count and the framing have moved.** It is now **16 moderate + 7 high = 23**, and the correct disposition for every single one is **leave it**:
  - The 8 OpenTelemetry moderates are one advisory in an unused code path, priced at a semver-major.
  - The 8 TS-ESLint/minimatch moderates and all 3 `start-server-and-test`/Cypress highs are dev-only; the eslint chain's "fix" is a major *downgrade*.
  - The 4 Vercel highs are one nested `zod` reachable only from the CLI's own config loader, and the "fix" is a major downgrade of `@vercel/blob`.
  - **Recommend: re-scope VGC-248 to "accept and document", not "upgrade".** Record the reachability reasoning above in the ticket so the next audit does not re-litigate it, and add a note that the dev-only patches (`follow-redirects`, `joi`, `systeminformation`) are free and can ride along on any routine `npm update`.
- **Production-reachable `zod` is now clean.** The direct dependency is `zod@4.6.6` (October's HIGH-3, fixed). October's companion recommendation also partly landed: `src/app/api/share/route.ts:44-45` now carries explicit `.max(2)` caps on `commonModes.combinations[].leads/back` with a comment naming GHSA-mrhx-c7xc-m3w5. Remaining uncapped collections (`matchupPlans`, `notes`, `calcs`, `roles`, `privateFields`, `hiddenSlides` — `:19-22,65,81`) are now bounded in practice by the **real** 512 KB body cap (§3, MEDIUM-1 fixed), so this is hygiene, not a live hole.
- **`cheerio/slim` swap still worth doing.** `cheerio` is a prod dep (`src/lib/import/limitless.ts:1`) and eagerly `require`s `undici`. No undici advisory today, but importing `cheerio/slim` drops it from the prod tree permanently. One line, zero risk.

---

## 2. Secrets scan

### Working tree and history: CLEAN

A repo-wide grep over all tracked and untracked files (excluding `node_modules`, `.next`, `.git`) for Discord webhook URLs, `lin_api_`, `lin_wh_`, `sk_live/test_`, `whsec_`, `phx_`, `re_`, `napi_`, `vercel_blob_rw_`, `AKIA`, `gh[pousr]_`, JWT literals, `postgres://user:pass@`, `BEGIN … PRIVATE KEY` and unquoted `Bearer <30+ chars>` returned exactly **one** hit, a placeholder:

- `.swarm/r-clerk-webhook-18-05-26.md:39` — kind: Clerk webhook signing secret, value is `whsec_xxxx…`. Not a credential.

A **blob-level** history sweep (`git rev-list --objects --all` → `git cat-file --batch`, 1270 blobs) found **no credential-shaped value of any kind** except 8 copies of the `.env.example` placeholder connection string (classified without printing: `user=user`, 8-char alpha-only password, 4-char host — i.e. `postgresql://user:password@host/database`).

Also checked: `.gitignore:34-35` covers `.env*` with `!.env.example`; `.gitignore:45` ignores `.claude/`, **but `.claude/scripts/linear.sh` is tracked anyway** (added before the ignore rule) — it is therefore inside the guard's scan scope, and it holds only Linear workflow-state UUIDs and the repo slug, no credentials. `src/app/api/user/push/route.ts:23` returns only `publicKey`; `VAPID_PRIVATE_KEY` never leaves `src/lib/web-push.ts:7`.

### VGC-305 — could NOT be re-verified this run

October proved a live Discord webhook token in public git history at `src/app/api/feedback/route.ts:10` in commit `5da513a` (removed in `28f5b8b`). **Both commits are absent from this clone** (`git cat-file -t` → `fatal: Not a valid object name`), and the blob sweep above covers only the 1270 objects reachable here. So this container cannot confirm or deny the leak. `git log --all -S 'discord.com/api/webhooks'` here returns only `.swarm` audit reports and the guard-test commit — all of which contain the pattern as a *description*, never a value.

**Action: do not re-file and do not re-audit. Confirm rotation out of band** (Discord → Server Settings → Integrations → Webhooks: is the old webhook id still listed?). If it is, delete it and reissue `DISCORD_BUILDS_WEBHOOK`. Five minutes, no code change, no deploy. Four prior runs have re-proven this; a fifth proof is worthless.

### The guard: `src/lib/security/__tests__/no-hardcoded-secrets.test.ts`

**It is merged (commit `7b85e8f`), it runs in CI via vitest, and it passes** (verified: 10/10 tests, 490 ms). October's LOW-10 is closed. The design is genuinely good: it scans the tracked tree via `git ls-files`, deliberately does **not** path-exclude `.env.example` or `.swarm/` (recognising placeholder *shapes* instead), reports `file:line [rule]` and never the matched value, and carries self-tests that plant a fake of each shape so a broken regex cannot make the gate silently green. It correctly refuses a generic "long hex" rule and correctly ignores public `phc_` PostHog project keys.

**Coverage against the kinds named in this task:**

| Kind | Covered? | By what |
|---|---|---|
| Discord webhook URL | **Yes** | dedicated rule `:59`, requires 17-20 literal digits — the incident shape exactly |
| Linear API key | **Yes** | `lin_api_` rule `:61` |
| Clerk secret key | **Yes** | `sk_(live\|test)_` rule `:62` |
| Neon connection string | **Yes** | `postgres(ql)?://user:pw@` rule `:72-77`, with an alpha-only-password filter that correctly spares `.env.example` |
| PostHog project key (`phc_`) | **Correctly excluded** | public by design, ships in `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` |
| Discord bot token, Upstash token, Blob RW token | **Yes, incidentally** | generic `hardcoded-credential-literal` rule `:85-88` — identifiers contain `token` |

**Four gaps, in priority order:**

1. **`VAPID_PRIVATE_KEY` is not covered at all — the clearest hole.** The generic rule's identifier alternation (`:87`) is `api[_-]?key|secret|token|password|passwd|bearer|credential`; a bare `key` is deliberately excluded (sensibly — it is an HTTP header name in `next.config.ts`). `VAPID_PRIVATE_KEY` matches **none** of those words, and a 43-char base64url VAPID private key has **no vendor prefix**, so no shape rule fires either. `VAPID_PRIVATE_KEY = "<43 chars>"` would commit completely silently. The repo uses web-push in production (`src/lib/web-push.ts`, `src/app/api/user/push/route.ts`), so this is a live kind. **Fix:** add `private[_-]?key` and `vapid` to the identifier alternation (~2 characters of regex).
2. **Vercel tokens, and any credential under 32 characters, are missed.** `looksHighEntropy` (`:110`) hard-rejects anything shorter than 32 chars. A Vercel API token is **24** characters; a Resend key (`re_` + 24) is ~27. Both are real secrets for this project (`RESEND_API_KEY` is in `.env.example`). **Fix:** add `re_[A-Za-z0-9]{20,}` as a shape rule, and lower the generic threshold to 24 while tightening the entropy floor to compensate.
3. **Prefixed secrets outside an assignment are missed.** There are no shape rules for `whsec_` (Clerk webhook), `phx_` (PostHog personal API key), `lin_wh_` (Linear webhook), or `napi_` (Neon API key). Inside a quoted assignment to a `*_SECRET` / `*_API_KEY` identifier the generic rule catches them; pasted bare into a `.md` note or a `curl -H "Authorization: Bearer …"` line, they are invisible — and the generic rule requires **quotes around the value**, so an unquoted `Authorization: Bearer <token>` never matches. Given that `.swarm/` is in scope precisely because it is where values get pasted by accident, this is the gap most likely to actually fire. **Fix:** four one-line prefix rules.
4. **History is out of scope by design** (documented at `:14-16`). Correct for a CI gate, but it means the guard cannot tell you whether VGC-305 is still extractable. That question needs rotation, not a test.

None of these is urgent — the tree and the reachable history are clean. They are cheap, and all four fit in one edit to one test file with no production risk.

---

## 3. OWASP pass over `src/app/api/**` (58 handlers)

### Verified as FIXED since October — do not re-report

- **`team-graphic` visibility + redaction — FULLY FIXED** (commit `0c6f94e`). `src/app/api/team-graphic/route.tsx:55-93` now selects `is_public, is_unlisted, owner_id`, serves public/unlisted by link, and for a private report resolves the Clerk `userId` and requires owner-or-accepted-collaborator, 404ing (never 403) so the endpoint cannot confirm a share id exists. It explicitly refuses to accept a legacy `?key=` edit token. **And the redaction half landed too**, one layer down: `src/lib/sharing/team-graphic-image.tsx:91-94` runs `normalizePrivateFields` + `redactPasteFields` before rendering, so October's exploit path A (hidden items leaking into every Discord/Slack unfurl via `oembed`'s `thumbnail_url`) is closed at the source. Four runs of reporting this, now genuinely done.
- **`apiGuard` `maxBodySize` chunked-encoding bypass — FULLY FIXED.** `src/lib/security/api-guard.ts:52-73` treats `Content-Length` as a cheap fast-reject only (`parseInt(… ?? "")` → `NaN` → `Number.isFinite` false → falls through, rather than October's `?? "0"` → `0` → pass), then enforces the cap on bytes actually drained off the wire via `readBodyWithLimit` (`:89-125`), and re-attaches the buffered body (`:131-141`) so downstream `request.json()` still works. The fix is better than what was recommended.
- **Production `zod` high — FIXED** (direct dep at 4.6.6; see §1).
- **Secrets regression guard — MERGED and passing** (§2).

### Clean areas (checked this run, nothing to report)

- **Unauthenticated destructive endpoints: all three are properly gated.** Checked first, as instructed.
  - `migrate/route.ts:26` — `verifyBearer(request, "MIGRATE_SECRET")` before any DB access; the handler is an idempotent normaliser with bound parameters and no delete path.
  - `setup/route.ts:8-19` — explicit "no secret configured ⇒ 401" pre-check, then `verifyBearer` against `MIGRATE_SECRET` **or** `CRON_SECRET`. Only calls `ensureTable()` (`CREATE TABLE IF NOT EXISTS` + `ADD COLUMN IF NOT EXISTS`).
  - `cleanup/route.ts:159` (GET, Vercel cron) — `isCronAuthorized`; `:181` (DELETE, manual) — `verifyBearer(… "CLEANUP_SECRET")`. The destructive statements are bounded (`MAX_DELETE_PER_RUN = 500`), run as one `sql.transaction`, exempt owned content (`owner_id IS NULL` on the stale purge, `:61-63`) and use `= ANY(${ids})` with a bound array.
  - `src/lib/auth/verify-bearer.ts:21-26` and `src/lib/cron-auth.ts:12-17` both **fail closed** when the env var is unset and both do an equal-length check *before* `timingSafeEqual` (necessary — it throws on length mismatch). `bot/route.ts:55` and all four `cron/*` routes use the same helpers.
- **SQL injection: zero surface, re-confirmed.** Every query across all 58 routes is a Neon tagged template with `${}` bound as a parameter. Targeted sweep for `sql.unsafe`, the `sql(...)` call form, `.query(`-with-a-built-string, and concatenated SQL returned **nothing** (the only hits were Linear-issue Markdown template literals in `cron/daily-ops/route.ts:270-288`). `explore/route.ts` remains the hardest case and still does it right: nested `sql`` ` fragments for filters, sort column chosen from a fixed pair, `limit` clamped, free-text `to_tsquery` input stripped to word chars + `:*`.
- **SSRF: closed on all three prime suspects.**
  - `sprite/route.ts:40-45` — host allowlist (`play.pokemonshowdown.com`) **plus** `/sprites/` path prefix, 3 s abort.
  - `pokepaste/route.ts:13-23,53-55` — hostname pinned to `pokepast.es`/`www.pokepast.es`, and the fetched URL is then **reconstructed** from a literal `https://pokepast.es` + the validated pathname, so even a validator bypass could not redirect the request off-host.
  - `import/limitless/route.ts:6` → `src/lib/import/limitless.ts:10-17` — `normalizeLimitlessUrl` requires `https:`, `hostname === "limitlessvgc.com"`, **no port, no username, no password**, and a strict `^/teams/\d+/?$`; the fetch uses `redirect: "error"`, an 8 s timeout and a streamed 2 MB cap. The second-hop tournament URL is re-normalised through the same function (`limitless.ts:42`) rather than trusted from the scraped page.
- **Webhook authenticity: all four verified, all fail closed.** Clerk svix `verifyWebhook`; Linear HMAC-SHA256 over the raw body with a length check then `timingSafeEqual`; PostHog `timingSafeEqual`; Discord Ed25519 via `nacl.sign.detached.verify` against the published `DISCORD_PUBLIC_KEY` (a *public* key, correctly inline in source). `discord/route.ts:54-65` additionally gates mutating slash commands behind `DISCORD_ADMIN_USER_IDS` / `DISCORD_ADMIN_ROLE_IDS` allowlists.
- **IDOR: closed on every owner-scoped resource.** Checked all 28 mutating routes. The pattern is the predicate itself (`AND owner_id = ${userId}` / `AND user_id = ${userId}`), not a post-fetch check, with owner-OR-accepted-collaborator where collaboration applies. Specifically confirmed clean this run:
  - `share/[id]/collaborators/route.ts:88-91,174-177,205-208` — owner-only on add, nonce-rotate and remove. **No collaborator-can-invite-collaborator escalation.**
  - `user/collaborations/route.ts:90-94` — accepting an invite requires a row with `user_id = ${userId} AND status = 'pending'`; a user cannot accept or decline on anyone else's behalf.
  - `share/[id]/versions/[version]/route.ts:41-58` — owner-or-accepted-collaborator before the snapshot is read; version snapshots are not reachable by outsiders.
  - `share/route.ts:166-194` — treats `edit_token` explicitly as *"an internal update nonce, not an authorization credential"* and requires owner-or-accepted-collaborator on top of it; also now requires authentication for **all** writes including create (`:131-141`).
  - `share/[id]/route.ts:140-211` — owner/collaborator path returns edit data; outsiders get 404 on `!isPublic && !isUnlisted`, and `applyPrivateFieldRedaction` on everything else.
  - `user/reports/[shareId]/route.ts:43,59+`, `user/drafts`, `user/saved`, `user/collections/[id]`, `user/notifications`, `user/follow`, `user/preferences`, `user/push`, `user/delete`, `match-log/route.ts:91`, `collaboration/[id]`, `changelog/[shareId]` — all owner-scoped in the predicate.
  - `quick-share/route.ts` + `quick-share/[id]/claim/route.ts:19-41` — guest links are bound to an httpOnly owner cookie hashed into `owner_hash`; the claim is a single atomic `WITH claimed AS (UPDATE … WHERE claimed_share_id IS NULL AND expires_at > NOW() AND owner_hash = …) INSERT …`, so only one caller can win and a failed insert rolls the claim back.
  - `user/delete/route.ts:105-134` — the cross-tenant profile-destruction bug (commit `66854cf`) is fixed with a `NOT EXISTS … owner_id IS DISTINCT FROM` guard, and the residual gap is documented in-code.
  - `share/[id]/fork/route.ts:45-51` — forking is restricted to **public** reports; unlisted/private cannot be forked. (The *data* it copies is the problem — see HIGH-2.)
- **Anonymous comment deletion is still not forgeable** — `comments/[shareId]/[commentId]/route.ts` authorizes a non-owner delete on a `crypto.randomUUID()` session id that `comments/[shareId]/route.ts:34-38` never returns to any caller. Correct as built.
- **Rate limiting is near-universal.** 52 of 58 routes call `apiGuard` with a `rateLimit`. The six that do not are all deliberate and all otherwise authenticated: `migrate`, `setup`, `cleanup`, `bot` and the four `cron/*` routes are bearer-gated; `feedback/route.ts:86` carries its own `isRateLimitedAsync('feedback:{userId}', 3, 60_000)` behind a Clerk check; the webhooks are signature-verified; `sprite` is a deliberate cost trade-off; **`user/export` is the one real gap** (LOW-1).
- **`getClientIp` header forgery (v5.26) and CORS credentials + preview-origin anchoring (v5.27)** remain fixed. Not re-reported.

---

## EXPLOITABLE TODAY

### HIGH-1 — Verified-creator profile takeover: `creator_profiles` is keyed on a user-editable display name

- **Where:** write `src/app/api/user/profile/route.ts:71-95`; public read `src/app/api/creator/[name]/route.ts:65-66`; schema `src/lib/db.ts:90-101` (`name TEXT PRIMARY KEY`, **no owner column**).
- **Unchanged since October.** This is the oldest open code finding in the API.
- The PUT handler derives the row key from Clerk profile fields the user controls:

  ```ts
  const creatorName = user.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user.username || "Unknown";
  ```

  then `INSERT INTO creator_profiles (name, …) VALUES (${creatorName}, …) ON CONFLICT (name) DO UPDATE SET bio=…, twitter=…, discord=…, youtube=…, is_public=…, avatar_url=…`. There is **no binding between the Clerk `user.id` and the `name` row**, and `firstName`/`lastName`/`username` are freely editable by any signed-in user through Clerk's own account UI.
- **Attack (authenticated, no special access, ~60 seconds):** attacker signs up → opens Clerk account settings → sets First name `Wolfe`, Last name `Glick` (target names are enumerable from `/api/explore` and `/api/creator/[name]`) → `PUT /api/user/profile` with their own `bio`, `twitter`, `discord`, `youtube`, `avatarUrl`. `ON CONFLICT (name) DO UPDATE` **overwrites the victim's row in place**. `GET /api/creator/{name}` then serves the attacker's bio and social links on the victim's public creator page — and `creator/[name]/route.ts:65,69` renders a **verified badge** whenever the name is in `verified_creators`, so for a verified creator the attacker's Discord and Twitter links appear **under a verified badge**. That is a working phishing primitive against a known community figure, hosted on the legitimate domain.
- **Case-collision variant needs no conflict at all.** The write stores `name = ${creatorName}` at the user's exact casing; all three reads use `WHERE LOWER(name) = …`. The UNIQUE constraint is on `name`, so `wolfe glick` and `Wolfe Glick` are two rows that both satisfy the read, and the read has **no `ORDER BY`** and takes `rows[0]` (`profile/route.ts:41,46`; `creator/[name]/route.ts:66`) — non-deterministic poisoning.
- **Amplifier:** `creator/[name]/route.ts:34,74,155` caches the rendered payload in Redis for 60 s under `creator:${creatorName}` and sets `s-maxage=60, stale-while-revalidate=300` CDN headers, so a poisoned profile is also served from the edge for up to 5 minutes after the row is corrected.
- **Severity: HIGH** — integrity + impersonation of identified third parties on a public site under a verified badge. No data loss, no DB privilege escalation.
- **Existing ticket: VGC-253.** `src/app/api/user/delete/route.ts:106-124` names it directly ("creator_profiles is keyed on that name alone, with no owner column (see VGC-253)") and records the residual gap its own guard cannot close. **Tie this to VGC-253, do not re-file.**
- **Fix:** add `user_id` to `creator_profiles`, make it the conflict target, reject a PUT whose `name` is bound to a different `user_id`. Without the migration: on PUT, look up by `LOWER(name)` and 409 unless the stored `user_id` matches, and normalise `name` to lower case on write so the read is single-valued.
- **Effort:** migration + route change + 2 vitest cases ≈ **2-3 h**. The no-migration stopgap is ~45 min but needs the column eventually.
- `conflict_risk: false` — neither file is on `.swarm/main-changed-files.md`.

### HIGH-2 — Tiered-publishing redaction bypass via `/api/share/{id}/fork` **(NEW this run)**

- **Where:** `src/app/api/share/[id]/fork/route.ts:87-92` (and `:117`).

  ```ts
  const sourceData = sourceRows[0].data as Record<string, unknown>;   // :87  raw, unredacted
  const forkedData: Record<string, unknown> = {
    ...sourceData,                                                     // :92  paste copied verbatim
    creatorName: "", tournamentName: "", placement: "", record: "", rentalCode: "", mvpIndex: null,
  };
  ```

  The spread clears event metadata but copies `paste` **and** `privateFields` verbatim. `grep -n 'redact'` over the whole file returns nothing.
- **This is the exact control that was just fixed in `team-graphic` and `share/[id]`, left open one route over.** `share/[id]/route.ts:237` and `team-graphic-image.tsx:91-94` both redact; fork does not.
- **Attack (authenticated, one click, no tooling):** a creator publishes a public report and uses tiered publishing to hide `item` / `evs` / `ivs` / `nature` before an event. Any signed-in viewer presses **Fork** in the share UI (`src/components/home/HomePageClient.tsx:741-766` → `POST /api/share/{id}/fork` → `window.location.href = '/s/{newId}'`). The fork is a new row with `owner_id = <attacker>` containing the **full unredacted paste**. The attacker is now the owner, so `GET /api/share/{forkId}` takes the owner branch at `share/[id]/route.ts:140-182` — which returns `normalizeReportData(data)` **without** `applyPrivateFieldRedaction`, plus `_editable: true`. The hidden EV spread and held items render in the editor immediately.
- Fork is public-reports-only, which bounds the target set — but tiered publishing exists *precisely* for public reports. In competitive VGC a concealed item or spread before an event is the entire value of the feature, and it is defeated by a button that ships in the UI.
- **Severity: HIGH.** Lower privilege bar than HIGH-1 (any signed-in account, one click, no Clerk-profile fiddling) but narrower impact (confidentiality of the creator's hidden fields rather than impersonation).
- **Fix — one focused diff:** run `sourceData` through the same `normalizePrivateFields` + `redactPasteFields` pair before building `forkedData`, and drop `privateFields` from the fork (a redacted paste has nothing left to hide). The helpers already exist at `src/lib/sharing/redact-paste.ts`; `share/[id]/route.ts:18-30` is the template. Better still, promote `applyPrivateFieldRedaction` out of `share/[id]/route.ts` into `src/lib/sharing/redact-paste.ts` so there is one call site shape and the next new reader cannot forget — `team-graphic` and fork both forgot independently.
- **Effort: ~30 min + one vitest regression test** naming the bug. `conflict_risk: false`.

### MEDIUM-1 — Free-text `creatorName` lets anyone publish under any creator's name, verified badge included

- **Where:** `src/app/api/share/route.ts:63,149-155` — `creatorName: z.string().optional()`, validated only as non-empty, with **no check against the authed user's Clerk identity**. Read back at `src/app/api/creator/[name]/route.ts:49` (`LOWER(data->>'creatorName') = …`) and badged at `:65,69`.
- **Attack:** sign in, publish a public report with `state.creatorName = "Wolfe Glick"`. It appears on `/creator/wolfe%20glick` alongside that creator's genuine reports, under their verified badge, and in `/api/explore` attributed to them. Combine with HIGH-1 and the attacker controls both the page's reports *and* its bio and social links.
- Same root cause as HIGH-1 (identity derived from free text rather than `owner_id`), same ticket (**VGC-253**).
- **Fix:** verify `state.creatorName` against the authed user's Clerk name on publish, or render the verified badge only for reports whose `owner_id` matches the verified creator's user id. **Effort ~1 h**, and it is the same code change that makes the HIGH-1 migration meaningful — do them together.

### MEDIUM-2 — View counts are inflatable; `sessionId` is unvalidated client input

- **Where:** `src/app/api/views/[shareId]/route.ts:12,37-47`. Unchanged since October.
- `ViewBody = { sessionId: z.string().min(1) }` — any non-empty string. Dedup is `cacheSetIfAbsent('view:{shareId}:{sessionId}', 600)`, so a **fresh `sessionId` per request is always a first view** and always increments.
- **Attack:** `for i in $(seq 1 60); do curl -X POST /api/views/<public-id> -d "{\"sessionId\":\"$i\"}"; done` — 60 increments/min/IP (the `views` limit is exactly 60), each a real `UPDATE shares SET view_count = view_count + 1`. From a handful of IPs this manufactures a top-of-Explore report, since `explore/route.ts:200-209` sorts on `view_count` and `spotlight` surfaces on the same signal.
- **Second-order cost:** each forged view is a Neon row write on the **512 MB free tier** plus a PostHog `captureServerEvent` and an OTel log emit (`:52-68`) — a write-amplification and billing vector too. Whether this is happening now is **unverified** (no PostHog credentials in this container); the code path is proven.
- **Fix:** key the dedup on something the caller does not choose — `getClientIp(request)` (trustworthy since v5.26) or the Clerk `userId` when present — keeping `sessionId` as secondary dedup within that. Tighten `SHARE_ID_RE` (`:11`, `^[a-zA-Z0-9_-]{6,16}$`) to the real `^[A-Za-z0-9]{8}$` that `share/[id]/route.ts:32` enforces. **Effort ~45 min + test.**

### MEDIUM-3 — Anonymous comments accept an arbitrary `displayName`

- **Where:** `src/app/api/comments/[shareId]/route.ts:15` (`displayName: z.string().max(50).optional()`), used at `:109,119`. No authentication is required to comment, and even when `auth()` resolves a `userId` (used at `:142` only to suppress self-notification) the display name is **never** reconciled against the Clerk identity.
- **Attack:** `POST /api/comments/{public-id}` with `displayName: "Wolfe Glick"` and an endorsement or a link. 5/min/IP. The name is HTML-escaped and word-filtered, so this is impersonation, not XSS.
- **Severity: MEDIUM** — integrity/impersonation on a public page; no data exposure.
- **Fix:** when `auth()` yields a `userId`, overwrite `displayName` with the Clerk name and mark the comment as account-backed; keep free text only for genuinely anonymous commenters and label them as such in the UI. **Effort ~1 h + UI.**

### MEDIUM-4 — `/api/user/export` has no rate limit when Upstash is unconfigured

- **Where:** `src/app/api/user/export/route.ts:6-21`. Unchanged since October. **The only authenticated route with no `apiGuard` call at all.**
- Its "one export per 24 h" limit is implemented purely as `cacheGet('export:{userId}')`, and `src/lib/cache.ts:29-42` returns `null` whenever `UPSTASH_REDIS_REST_URL`/`_TOKEN` are unset **or Redis throws**. In that state the limit silently vanishes and each call fans out **12 parallel queries at `LIMIT 1000` each** (`:24-40`).
- **Attack:** with Redis down or misconfigured, a single signed-in account loops `GET /api/user/export` and each request costs 12 wide Neon queries — a cheap self-inflicted DoS against the 512 MB free-tier database, with no 429 anywhere in the path.
- Note the contrast with `cacheSetIfAbsent` (`cache.ts:68+`), which documents its unconfigured behaviour deliberately; `cacheGet` has no such contract, so using it **as** a rate limiter is a fail-open.
- **Fix:** add `apiGuard(request, { rateLimit: { key: "export", max: 2 } })` as a floor that does not depend on Redis. **Effort: 5 minutes.** Cheapest win on this list.

---

## DEFENCE IN DEPTH

1. **`pokepaste` and `sprite` follow redirects.** `src/lib/fetch-with-timeout.ts:27` passes no `redirect` option (default `follow`), and `sprite/route.ts:51` likewise. Both pin the initial host, so this needs a redirect *from* `pokepast.es` or `play.pokemonshowdown.com` to an internal address to matter — not exploitable today, but `import/limitless` already sets `redirect: "error"` and these two should match. ~10 min.
2. **Mutating routes without a body cap.** Only 5 of ~20 mutating handlers pass `maxBodySize` (`share` 512 KB, `user/drafts` 512 KB, `quick-share` 20 KB, `user/preferences` 4 KB, `user/push` 4 KB, `collaboration/[id]` 12 KB). `comments` POST, `reactions` POST, `user/saved`, `user/collections`, `user/follow`, `user/notifications` PATCH, `share/[id]/versions` POST, `share/[id]/collaborators`, `user/reports/[shareId]` PATCH, `match-log` POST, `user/collaborations` POST and `pokepaste` POST rely on zod field caps plus Vercel's ~4.5 MB platform ceiling. The guard now enforces real byte counts, so adding `maxBodySize` is free — a shared `readBoundedJson(request, max)` helper would make it the default.
3. **`creator:${creatorName}` Redis key is built from raw path input** (`creator/[name]/route.ts:34`, after `decodeURIComponent`). Namespace-collision / key-stuffing surface on a shared Redis, not an injection. Hash or normalise it.
4. **`avatarUrl` is prefix-validated only** (`user/profile/route.ts:21-24`: `v.startsWith("https://")`), so any HTTPS host can be stored. Not currently exploitable: `next.config.ts:126` restricts `img-src` to `'self' data: blob:` plus Showdown, Clerk, `raw.githubusercontent.com` and Vercel, so an arbitrary host is CSP-blocked at render. **The CSP is doing load-bearing work for a validation gap** — if it is ever relaxed, this becomes a live tracking-pixel/deanonymisation finding. Allowlist on write so the two controls are independent.
5. **Webhooks have no pre-verification rate limit.** `webhooks/clerk`, `webhooks/linear`, `webhooks/posthog` and `discord` call no `apiGuard`, and `proxy.ts:33,90` exempts them from bot detection and the origin check (correctly — they are server-to-server). Authenticity is sound; an unauthenticated flood just forces one HMAC/Ed25519 verification per request. Noted for completeness.
6. **Clerk user enumeration for any signed-in caller.** `user/search/route.ts:23-34` proxies `clerkClient().users.getUserList({ query, limit: 8 })` and returns `id`, display name and `imageUrl` at a 2-character minimum, 20 req/min. Bounded and intended for collaborator invites, but it enumerates the directory given patience, and it returns the raw Clerk `id`, which the invite UI does not need.
7. **`/api/sprite` is an unauthenticated, unmetered open proxy.** `proxy.ts:27-28` early-returns and the matcher at `:157` excludes it, so no Clerk, no bot detection, no CORS, no CSRF — and the route calls no `apiGuard`. SSRF is genuinely closed; the honest cost is bandwidth amplification against Showdown's CDN on cache-cold paths, and the `Access-Control-Allow-Origin: *` means third-party sites can hotlink it as their own sprite CDN. A documented cost trade-off; leave it unless it shows up in Vercel bandwidth. `conflict_risk: true` for this area.
8. **Loose share-id regexes.** `views/[shareId]:11`, `reactions/[shareId]`, `comments/[shareId]:12` all use `^[a-zA-Z0-9_-]{6,16}$` against a real 8-char `[A-Za-z0-9]` id space. Parameterised, so harmless — it just widens the probe space for free.
9. **`isPreviewDeploy = host.includes('vercel.app')`** (`proxy.ts:62`) matches `vercel.app.attacker.com`. It only decides whether to 301, and the CORS allowlist is independently anchored, so no consequence — `endsWith` would be more accurate.
10. **`/api/sync` is CSRF-exempt** (`proxy.ts:103`). Harmless today — `sync/[id]/route.ts` exports GET only and `validateCsrf` is a no-op for GET — but it becomes load-bearing the moment a write method lands on that route.
11. **Secrets-guard regex gaps** — see §2: `VAPID_PRIVATE_KEY` (uncovered), sub-32-char credentials incl. Vercel and Resend tokens, missing `whsec_`/`phx_`/`lin_wh_`/`napi_` prefix rules, and the unquoted `Authorization: Bearer …` form. One edit to one test file, no production risk.

---

## Summary table — ranked by exploitability

| # | Severity | Finding | File:line | Proven? | Effort | Ticket |
|---|---|---|---|---|---|---|
| H1 | **HIGH** | Verified-creator profile takeover via editable Clerk display name | `src/app/api/user/profile/route.ts:71-95` | **Proven** | 2-3 h | **VGC-253** |
| H2 | **HIGH** | Tiered-publishing redaction bypass via fork (**new**) | `src/app/api/share/[id]/fork/route.ts:87-92` | **Proven** | **30 min** | new |
| M1 | MEDIUM | Free-text `creatorName` → publish under any creator + verified badge | `src/app/api/share/route.ts:63,149-155` | **Proven** | 1 h | **VGC-253** |
| M2 | MEDIUM | View counts inflatable via client-chosen `sessionId` | `src/app/api/views/[shareId]/route.ts:12,37` | Code proven; abuse unverified | 45 min | new |
| M3 | MEDIUM | Anonymous comments accept arbitrary `displayName` | `src/app/api/comments/[shareId]/route.ts:15,109` | **Proven** | 1 h | new |
| M4 | MEDIUM | `user/export` rate limit fails open without Upstash | `src/app/api/user/export/route.ts:6-21` | **Proven** | **5 min** | new |
| D1-D11 | LOW | Defence-in-depth items above | various | Proven | — | — |
| — | n/a | npm audit: 23 advisories, **none prod-reachable** | `package.json` | Verified | accept | **VGC-248** (re-scope), **VGC-221** (close as stale) |
| — | n/a | VGC-305 history leak: **not verifiable in this clone** | — | Inconclusive | 5 min rotation | **VGC-305** |

**Act in this order tonight:** H2 (30 min, one file, closes a live confidentiality bypass) → M4 (5 min, one line) → M1+H1 together (they are one change to one identity model) → M2 → M3.

**Verified-as-fixed, do not re-report:** `team-graphic` visibility *and* redaction, `apiGuard` `Content-Length` chunked bypass, direct `zod` high, `no-hardcoded-secrets` guard merged and green, `getClientIp` header forgery, CORS credentials + preview-origin anchoring, `creator/[name]` ILIKE-pattern bug, cross-tenant `creator_profiles` deletion on account delete, SQL injection (zero surface), SSRF on all three fetch routes, destructive-endpoint bearer gating.

**Caveats restated:** no PostHog telemetry available, so no finding is corroborated against production events (M2 especially). The git history in this clone does not contain October's VGC-305 commits, so that leak's status must be confirmed by checking Discord's webhook list directly.
