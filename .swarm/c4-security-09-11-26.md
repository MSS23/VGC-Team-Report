# C4 — Security Audit, 09 Nov 2026

Read-only audit. Branch `swarm-nightly-2026-11-09`, `HEAD = 10dfd74` ("Merge claude-dev: VGC-230 webhook idempotency, VGC-231 List-Unsubscribe, VGC-233 OTS PDF, VGC-235 share test (#90)"). No source file edited, nothing committed, no dependency touched. This file is the only write.

Scope: `npm audit` triage with prod-vs-dev reachability, repo-wide + git-history secret scan, OWASP pass over the 58 route handlers under `src/app/api/**` (57 `route.ts` + 1 `route.tsx`), client-IP helper conformance, and security headers / CSP.

Baseline: `.swarm/c4-security-26-10-26.md` (branch `swarm-nightly-2026-10-26`, `origin/main` = `68796c5`). Every finding below is marked **ALREADY-REPORTED** or **NEW**.

**Two container limits, stated up front.** (1) **PostHog credentials are absent**, so no reachability or abuse claim is corroborated against production telemetry — everything is static reading of code and the installed tree. (2) **This clone is shallow** (`git rev-parse --is-shallow-repository` → true, 77 revisions). Commit `5da513a`, the VGC-305 blob, is **not present locally**, so the state of GitHub's full history could not be re-verified from here. See §2.

**Headline:** a good run. Three of last run's five code findings are genuinely fixed, including the HIGH that had survived four consecutive audits, and VGC-264 now has a repo-wide regression guard. `npm audit` total rose 9 → 23, but **no advisory is production-reachable**: the seven "high" rows collapse to four distinct advisories, three dev-only and one (zod, via `@vercel/blob`) in the prod tree but confined to local-CLI config parsing. The one real new code finding is the og:image Blob cache introduced by `e4d9354`: a public→private visibility flip through the dashboard does not revoke the public Blob card, and account deletion never does.

---

## 1. npm audit triage

```
$ npm audit --json | jq .metadata.vulnerabilities
{ "info": 0, "low": 0, "moderate": 16, "high": 7, "critical": 0, "total": 23 }
```

| Severity | Rows | Distinct advisories | Prod-reachable |
|---|---|---|---|
| critical | 0 | — | — |
| high | **7** | **4** (zod ×4 rows, joi, follow-redirects, systeminformation) | **0** |
| moderate | 16 | 2 (otel-core ×8 rows, minimatch ×8 rows) | 0 |
| low / info | 0 | — | — |

The row count overstates the problem badly: 15 of the 23 rows are two advisories fanned out across a dependency cluster. **Advisory count is 6; production-reachable count is 0.**

### HIGH — `zod` GHSA-mrhx-c7xc-m3w5, in the prod tree, **not reachable** — NEW (path is new; advisory is last run's, now fixed where it mattered)

- **Advisory:** *"Zod can exhaust memory while validating oversized constrained collections"*, CWE-770, CVSS 7.5, range `<4.6.6`.
- **Dependency path (the only vulnerable node):**
  `vgc-team-report → @vercel/blob@2.8.2 → @vercel/oidc@3.8.10 → @vercel/cli-config@0.3.1 → zod@4.1.11`
  installed at `node_modules/@vercel/cli-config/node_modules/zod`. Present in `npm ls zod --omit=dev`, so it **is** in the production install.
- **This accounts for four of the seven high rows** — `@vercel/blob`, `@vercel/oidc`, `@vercel/cli-config` and `zod` are all the same advisory propagated up the chain. There is only one vulnerable package.
- **Last run's real HIGH is FIXED.** The direct dependency is now `zod@4.6.6` (`package.json: "zod": "^4.6.6"`), above the advisory range. The bump landed *and* the defence-in-depth caps were added: `src/app/api/share/route.ts:37-44` now carries `.max(2)` on `leads`/`back` with a comment citing this exact GHSA. That was recommendation #3 from 26 Oct, done properly.
- **Not reachable in production, with a traced reason.** `@vercel/blob`'s OIDC path (`dist/chunk-XKVPKJPO.js:61,173-174`) calls `getVercelOidcToken()`, which reaches `@vercel/oidc/dist/token-util.js:51-52` — `getGlobalPathConfig()` + `tryReadAuthConfig(configDir)`. zod's only job in that chain is validating the **developer's own local `auth.json`** from the Vercel CLI config directory. On Vercel the token comes from `BLOB_READ_WRITE_TOKEN` (`src/lib/sharing/og-image.ts:38-40` gates the entire feature on it), so the CLI-config branch is not taken, and even when it is the input is a local file the attacker does not control. **No request data ever reaches this zod instance.**
- **Do NOT take npm's suggested fix.** `fixAvailable` proposes `@vercel/blob@2.4.0` — a **downgrade across a major**, which would regress the `e4d9354` og:image feature. The correct fix is a transitive pin.
- **Fix:** add `"zod": "^4.6.6"` to the existing `overrides` block in `package.json`. Same major as `4.1.11`, so no API break, and it dedupes the nested copy onto the already-installed `4.6.6` — closing all four high rows with a lockfile change and no code change.
- `conflict_risk: true` — `package.json` and `package-lock.json` are both high-traffic.

### HIGH — `joi` GHSA-4528-x5fx-h6hg, **dev-only** — NEW

- *"quadratic-time split in `string().email({ multiple: true })` allows denial of service"*, CVSS 7.5, range `>=18.0.0 <18.3.1`. Installed `joi@18.3.0`.
- **Path:** `start-server-and-test@2.1.5 (devDependencies) → wait-on@9.0.4 → joi@18.3.0`. `npm ls joi --omit=dev` → `(empty)`.
- **Dev/build-only, and not even build:** `start-server-and-test` is referenced only by the `test:e2e` / `test:e2e:open` scripts, and `.github/workflows/ci.yml` runs tsc + eslint + vitest only. joi here parses `wait-on`'s own option object — it never sees attacker input, let alone an email list. This is the package the 26 Oct report pre-classified as dev-only *before* an advisory existed; that classification now pays off.
- **Fix:** `npm audit fix` (`fixAvailable: true`, non-major — `joi@18.3.1`).

### HIGH — `follow-redirects` GHSA-mrwp-f3q8-3g9p, **dev-only** — NEW

- *"Cross-realm sensitiveHeaders arrays are discarded and custom credentials can follow redirects"*, CVSS 5.9, range `>=1.16.0 <=1.16.1`. Installed `1.16.1`.
- **Path:** `start-server-and-test@2.1.5 → wait-on@9.0.4 → axios@1.20.0 → follow-redirects@1.16.1`. `npm ls follow-redirects --omit=dev` → `(empty)`.
- Same reasoning as joi — this is the axios sub-tree VGC-300 asked about, reachable only from a local `test:e2e` run against `localhost`.
- **Fix:** `npm audit fix` (`fixAvailable: true`, non-major).

### HIGH — `systeminformation`, **dev-only and Windows-only for the high limb** — NEW

- Three stacked advisories on `systeminformation@5.33.1`: GHSA-3f7j-7jwc-fxfj (**high**, CVSS 7.8, *Windows command injection in `services()` via Unicode quotation marks*, `<5.33.16`); GHSA-7648-jmwf-vw7j (moderate, prototype pollution in `networkStats()`, `<5.33.13`); GHSA-4vjg-vx72-qq4g (low, Linux path traversal in `networkStats()`, `<5.33.14`).
- **Path:** `cypress@15.18.0 (devDependencies) → systeminformation@5.33.1`. `npm ls systeminformation --omit=dev` → `(empty)`.
- Cypress calls this for machine-info telemetry during a local interactive run. The high limb needs Windows **and** attacker control of a service name. In the swarm container Cypress's binary is not even installed (`CYPRESS_INSTALL_BINARY=0`). Note that the owner's dev machine *is* Windows, which is why this is worth patching rather than ignoring — but it is still a developer-machine concern with no path to production.
- **Fix:** `npm audit fix` (`fixAvailable: true`, non-major).

### MODERATE — `@opentelemetry/core` GHSA-8988-4f7v-96qf, prod tree, not reachable — ALREADY-REPORTED (unchanged)

- *Unbounded memory allocation in W3C Baggage propagation*, CVSS 5.3, `<2.8.0`. Installed `2.6.1`, fanned across **8 rows**: `core`, `resources`, `sdk-logs`, `sdk-metrics`, `sdk-trace-base`, `otlp-exporter-base`, `otlp-transformer`, `exporter-logs-otlp-http` (three of them direct deps).
- In the prod tree via `src/instrumentation.ts` (PostHog log export), and `next.config.ts:26-31` keeps them `serverExternalPackages` so they are `require()`'d at runtime. But the vulnerable code is **W3C Baggage header propagation**, and this app parses no inbound `baggage` header and extracts no trace context from client requests — the SDK is a log exporter only.
- `fixAvailable` is a semver-major jump to `0.301.0` / `3.1.0`. **Verdict unchanged from 26 Oct: leave it.** Not worth a major for an unreachable advisory.

### MODERATE — `minimatch` GHSA-g3hv-75wg-m249, **lint-only** — NEW

- *Potential denial of service via globparts amplification*, range `>=7.0.0 <11.0.1`. Installed `minimatch@10.2.4` at `node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch`.
- **Path:** `eslint-config-next@16.1.6 (devDependencies) → typescript-eslint@8.56.1 → @typescript-eslint/typescript-estree@8.56.1 → minimatch@10.2.4`. `npm ls minimatch --omit=dev` → `(empty)`.
- This advisory plus the `typescript-eslint` cluster it feeds (`eslint-plugin`, `parser`, `type-utils`, `typescript-estree`, `utils`, `typescript-eslint`, `eslint-config-next`) is the **other 8 moderate rows**. One advisory, eight rows.
- **Do NOT take npm's suggested fix:** `eslint-config-next@15.5.29` is a **major downgrade** that would desync eslint from `next@16.4.3`. Leave it; it only runs in `npm run lint` and CI over this repo's own source.

### VGC-300 — current status

The 26 Oct run recommended closing VGC-300 as stale, because none of the 13 advisories it listed existed. That recommendation is now **partly overtaken by events**: three of the packages VGC-300 named (`axios`→`follow-redirects`, `joi`, and the eslint cluster) have live advisories again, and all three land exactly where VGC-300 predicted — **dev/build-only**. `sharp` and `undici` remain unflagged at any severity.

**Recommended disposition (revised):** VGC-300's *classification work* is validated and worth keeping; its *advisory list* is stale. Close it and re-file one small ticket: `npm audit fix` (clears joi + follow-redirects + systeminformation, all non-major, all dev-only) plus the `zod` override. Add to the ticket, as VGC-300 should have said: `source-map-js` ships in the prod tree via `next → postcss` but is invoked only at build time, and adopting `next/image` later would promote `sharp` from "present but never invoked" to a live surface for untrusted image bytes.

### New prod dependency worth noting

`@vercel/blob@2.8.2` (added by `e4d9354`) pulls **`undici@^6.23.0`** into the production tree, alongside the `undici@7.30.1` that `cheerio` already contributed. Neither is flagged today. The 26 Oct recommendation to switch `src/lib/import/limitless.ts:1` to `cheerio/slim` is now **less valuable** — it would no longer drop undici from the prod tree, since `@vercel/blob` needs it independently. Deprioritise that suggestion.

---

## 2. Secrets scan

### Current tree: CLEAN — verified

- `git grep -nE 'discord(app)?\.com/api/webhooks/[0-9]{5,}'` over tracked files → **nothing**. A filesystem grep over tracked *and* untracked files (excluding `node_modules`, `.next`, `.git`) → **nothing**.
- High-confidence sweep for `lin_api_`, `lin_wh_`, `sk_live_`, `sk_test_`, `sk-…`, `ghp_`/`gho_`/`ghu_`/`ghs_`/`ghr_`/`github_pat_`, `xox[baprs]-`, `AKIA…`, `AIza…`, `whsec_`, `phc_`, `npm_`, `BEGIN … PRIVATE KEY`, and real `postgres(ql)://` / `redis(s)://` / `mongodb://` connection strings across `src/`, `scripts/`, `public/`, config files and docs: **only placeholders and scanner patterns.** Specifically `src/lib/security/__tests__/no-hardcoded-secrets.test.ts:61,64` (the detector's own regexes), `docs/STRIPE_PAID_REPORTS_ARCHITECTURE.md:335` (`sk_test_...` ellipsis in a design doc), `.swarm/r-clerk-webhook-18-05-26.md:39` (`whsec_xxxxxxxxxxxxxxxxxxxx`).
- **`.env.example` verified placeholder-only**, all 95 lines. `DATABASE_URL` is `postgresql://user:password@host/database?sslmode=require`; both Discord webhooks are `https://discord.com/api/webhooks/xxxx/xxxx`; Clerk/Resend/Linear/PostHog keys are `<your-…>` angle-bracket placeholders; `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` are empty. No real value anywhere.
- `scripts/` and `public/` clean. The only long literal in `src/` that looks like a credential is `src/app/api/discord/route.ts:7` `DISCORD_PUBLIC_KEY` — a 64-hex **Ed25519 verification public key**, which is public by design (it is used at `:85-92` to verify Discord's signature, never to sign). Not a secret; no action.

### Git history

A content-level `git grep` across all 77 revisions in this clone, for the same high-confidence patterns, returns exactly one hit: the `whsec_xxxx…` placeholder in `.swarm/r-clerk-webhook-18-05-26.md:39`. **No `.swarm` document leaks a real value** — hygiene has held across every run.

The earlier pickaxe counts (`git log --all -S 'lin_api_'` → 5 commits, etc.) are **false positives**: they match the scanner test file and the audit documents that enumerate these patterns, not credentials. Noted so a future run does not re-chase them.

### VGC-305 — status changed: credential appears ROTATED; severity drops CRITICAL → LOW (residual)

- **New evidence:** commit `2f4ec31` *"fix: harden Discord webhook handling after a compromised webhook"* (06 Nov 2026) states in its message: *"Full-history blob sweep: the one webhook ever committed (`5da513a`, removed in `28f5b8b`) is **confirmed deleted on Discord's side**; no other credential shape exists anywhere in history."* Deleting the webhook on Discord is exactly the fix the last four audits asked for, and it fully closes the exposure — a Discord webhook URL *is* the credential, so a deleted webhook is a dead credential.
- **Unverifiable from this container, and deliberately not pursued.** This clone is shallow and does not contain `5da513a`, so the blob could not be re-read; and re-reading it would mean handling the live-or-dead token, which this audit does not do. **Residual risk, for the operator to confirm once:** the repo is still public (`gh api repos/MSS23/VGC-Team-Report` → `{"private": false, "visibility": "public", "pushed_at": "2026-11-06T22:35:08Z"}`), so if the blob is still in GitHub's history the *string* remains fetchable — harmless if the webhook is deleted, critical if it is not. One check in Discord → Server Settings → Integrations → Webhooks settles it.
- **Do not re-file, and do not re-derive.** Five runs have now touched this. The action item is reduced to a single confirmation.

### NEW — LOW: the webhook hardening is written but **not merged**, so the token can still reach Vercel logs on `main`

- `2f4ec31` is on `origin/ccr-643ddaf1-yj2dyf` only. `git merge-base --is-ancestor 2f4ec31 HEAD` → **false**; `git branch -a --contains 2f4ec31` lists just that one remote branch. Confirmed absent from `HEAD`: `.env.example` has no `DISCORD_WEBHOOKS_DISABLED`, and `src/lib/discord-webhook.ts` has no `resolveDiscordWebhook`.
- **What `main` still does.** Three un-centralised raw `fetch(webhookUrl)` call sites:
  - `src/lib/discord-webhook.ts:22-33` — no timeout, no `try`/`catch`; a network throw propagates to the caller (a cron route), which logs it.
  - `src/app/api/feedback/route.ts:63-75` — `.catch((e) => console.error("Discord webhook error:", e))`, logging the raw error object.
  - `src/app/api/webhooks/posthog/route.ts:278` — its own raw `fetch(discordWebhook, …)`.
- **Exploit scenario (log disclosure, not remote attack).** On a DNS/TLS/socket failure, the thrown error's `cause` can carry the request URL, and the webhook **token is a path segment of that URL**. Printing the error object therefore risks writing a live credential into Vercel's log stream, where it is visible to anyone with project log access and to any log drain. The commit author hit this concretely — *"the reason text of network errors, which undici fills with the request URL"*. I could not reproduce the exact error shape from this container, so treat the mechanism as **asserted by the fix author and plausible, not independently proven**; the *pattern* (logging an error object built from a secret-bearing URL) is unambiguous either way.
- **Severity: LOW.** Needs an operator-visible log and a transient network failure; discloses a webhook, not user data.
- **Fix: cherry-pick `2f4ec31` onto `main`.** It is already written, already reviewed, and ships 22 unit tests plus a `DISCORD_WEBHOOKS_DISABLED` kill switch. No new work. This is the single highest value-per-minute item in this report.

### FIXED — the secrets regression guard is now on `main`

26 Oct LOW-10 reported that `src/lib/security/__tests__/no-hardcoded-secrets.test.ts` existed only on an unmerged branch. It is now **tracked and on `origin/main`** (`git ls-tree -r origin/main` matches), 216 lines, and passes. The durable fix for "a credential reaches the tracked tree" is in place.

---

## 3. OWASP pass over `src/app/api/**` (58 handlers)

### 3a. Client-IP handling (VGC-264) — CLOSED, with a repo-wide guard. ALREADY-REPORTED as fixed; now also enforced.

- **The hardened helper:** `src/lib/security/getClientIp` at `src/lib/security/input-validation.ts:75-103`, with a 35-line rationale at `:40-74`. It prefers the platform-set `x-vercel-forwarded-for` / `x-real-ip` (`:77-80`), then takes **only the right-most** `x-forwarded-for` entry (`parts[parts.length - 1]`, `:86`) — explicitly refusing to scan leftwards, which is the detail that matters.
- **Every route conforms.** `grep -rn 'x-forwarded-for\|x-real-ip\|x-vercel-forwarded-for' src/` returns **zero** hits outside `input-validation.ts` itself and its tests. All consumers go through the helper: `src/lib/security/api-guard.ts:32` (so every `apiGuard` rate limit inherits it), `comments/flag/route.ts`, `explore/route.ts`, `quick-share/route.ts`, `share/[id]/fork/route.ts`, `share/route.ts`.
- **NEW since 26 Oct — a structural guard.** `src/lib/security/__tests__/no-raw-forwarded-for.test.ts` walks every `route.ts(x)` under `src/app/api` and fails if any file so much as mentions `x-forwarded-for`. This is the right shape of fix: it makes the next regression impossible rather than merely absent. **VGC-264 can be closed.**
- One documented sharp edge, unchanged and correctly commented at `:72-74`: the helper still returns the literal `"unknown"` as a last resort, collapsing all header-less clients into one bucket. The comment tells callers to treat `"unknown"` as always-rate-limited; no caller currently does, but no sensitive route depends on it either.
- Verified by running the suite: `src/lib/security` + `src/app/api/team-graphic` → **6 files, 73 tests, all passing**.

### 3b. Fixed since 26 Oct — verified, not re-reported

- **HIGH-1 `team-graphic` visibility + redaction — FIXED, both limbs.** `src/app/api/team-graphic/route.tsx:55-91` now selects `is_public, is_unlisted, owner_id` and gates: public or unlisted renders by link; private renders only for `owner_id = userId` or an accepted collaborator; blocked requests get **404, never 403**, so the endpoint is not an id-existence oracle. The redaction limb — the stronger exploit path, which the visibility predicate alone would *not* have closed — is fixed at the shared renderer instead of the route: `src/lib/sharing/team-graphic-image.tsx:91-95` runs `normalizePrivateFields` + `redactPasteFields` before parsing, **for every viewer including the owner**, with a comment explaining that a viewer-dependent body must not be edge-cached. 327 lines of new route tests. This was the oldest unfixed finding in the area (first reported 19 Oct); it is properly closed.
- **MEDIUM-1 `maxBodySize` chunked-encoding bypass — FIXED.** `src/lib/security/api-guard.ts:52-73` now treats `Content-Length` as a cheap fast-reject only (`parseInt(… ?? "")` → `NaN` → `Number.isFinite` false → no longer a free pass at `0`) and enforces the real cap by **draining the body stream with a running byte count** (`readBodyWithLimit`, `:89-125`), cancelling the reader the moment the cap is blown. `attachBufferedBody` (`:131-141`) re-attaches the consumed bytes so `request.json()` still works downstream — which is why the six call sites needed no changes. The shared-helper fix the last report asked for, done better than asked.
- **HIGH-3 `zod` — FIXED.** See §1: direct dep on `4.6.6`, plus the `.max(2)` collection caps at `share/route.ts:37-44`.
- **LOW-10 secrets guard test — FIXED.** See §2.

### 3c. Also hardened since 26 Oct (not previously findings — noted so they are not mistaken for regressions)

- `explore/route.ts:266` — fork-lineage join now requires `src.is_public = true`, so unpublishing a source stops the Explore card crediting (and thereby disclosing) its creator.
- `share/[id]/route.ts:87-94` — `fetchForkedFromMeta` returns `null` once the source is no longer public, closing the same side channel on the report page (creator, event, full species list, and the source's existence).
- `share/route.ts:308-324` — `isUnlisted` is now behind the **same owner-only gate** as `isPublic`; previously a collaborator could flip unlisted.
- `comments/flag/route.ts:59-79` — auto-removal now counts **signed-in flaggers only** (`session_id LIKE 'user:%'`), with the reasoning spelled out: an anonymous flagger's identity is the IP, and a `/64` IPv6 allocation made three cheap requests enough to hard-delete any comment on any public report.
- `cleanup/route.ts` + `user/delete/route.ts` now build their satellite purge from one module, `src/lib/db/purge-satellites.ts`, run inside `sql.transaction([...])`. Every statement is parameter-scoped to a caller-supplied `shareIds` or `userId`; there is deliberately no unscoped `DELETE` in the file. This closes the VGC-288 drift that produced the 447MB `share_versions` incident.
- `webhooks/clerk/route.ts:49-56` — svix-id idempotency via `cacheSetIfAbsent`, correctly placed **after** signature verification, with the dedupe key released (`cacheDel`) before returning 500 so a retry is not swallowed.
- `webhooks/linear/route.ts:78-85` — a signed-but-stale payload is now **dropped but acknowledged 200** instead of 401. Reviewed: replay protection is enforced by dropping the event, not by the status code, and the handler returns before any state change. Correct, and it fixes a real availability bug (retries carry the original timestamp, so 401 made every retry fail permanently until Linear auto-disabled the webhook).

### 3d. Clean areas — re-checked this run, nothing to report

- **SQL injection: still zero surface.** Targeted sweep for `sql.unsafe`, the `sql(...)` call form, `.query(`, and any `${}` landing in an `ORDER BY` / `LIMIT` / identifier position across `src/app/api` and `src/lib` → **no hits**. Every query is a Neon tagged template with bound interpolations. `explore/route.ts` remains the hardest case and still does it right (nested `` sql`` `` fragments for filters, sort column chosen from a fixed pair, `limit` clamped). `purge-satellites.ts` uses `= ANY(${shareIds}::text[])` with a bound array throughout.
- **SSRF: closed on all three user-supplied-URL fetches.** Every outbound `fetch` in `src/` was re-enumerated; all targets are env-derived constants except: `sprite/route.ts:40-51` (host allowlist `play.pokemonshowdown.com` + `/sprites/` path prefix + 3s abort), `pokepaste/route.ts:13-23,50-55` (hostname pinned, and the request URL **reconstructed** from a literal origin + validated pathname, so even a validator bypass cannot redirect off-host), and `import/limitless/route.ts:6` → `src/lib/import/limitless.ts:10-17` (`https:` only, `hostname === "limitlessvgc.com"`, no port/username/password, strict `^/teams/\d+/?$`, `redirect: "error"`, 8s timeout, 2MB streamed cap, and the second-hop URL re-normalised rather than trusted).
- **Mass assignment: none.** `grep -rnE 'Object\.assign|\.\.\.(raw|body|parsed\.data|json)\b' src/app/api` → **no hits**. Every handler destructures named fields off a zod-parsed object.
- **Input validation: zod on every body-reading route**, with `.max()` on every string and now on the `share` collections.
- **Error responses leak nothing.** Sweep for `e.message` / `String(e)` / `err.message` / `${e}` inside any `NextResponse.json(…, { status: 500 })` → **no hits**. Every catch logs server-side and returns a fixed string. The one route that returns structured detail, `feedback/route.ts:93`, returns `parsed.error.flatten().fieldErrors` on a **400** — zod field names for a schema the client already knows. Fine.
- **Webhook authenticity: all four still verified and fail-closed.** Clerk `verifyWebhook` (svix); Linear HMAC-SHA256 over the raw body with a length check then `timingSafeEqual`; PostHog `timingSafeEqual`; Discord Ed25519 via `nacl.sign.detached.verify`.
- **Privileged endpoints: all secret-gated, timing-safe, fail-closed.** `setup`, `migrate`, `cleanup`, `bot`, all four `cron/*` — `verifyBearer` / `isCronAuthorized`, both with an equal-length check before `timingSafeEqual`.
- **IDOR / ownership: ownership is genuinely checked, not merely authentication.** Re-spot-checked this run across `match-log` (`WHERE id = ${id} AND user_id = ${userId}`), `sync/[id]` (owner OR accepted collaborator, in the predicate), `changelog/[shareId]`, `share/[id]/versions`, `share/[id]/fork` (and it enforces `is_public` on the source), `user/feed`, `user/notifications`, `user/collections`, `user/follow`, `quick-share/[id]/claim` (409s when `claimed_by` is another account), `reactions/[shareId]` (fetches `owner_id` to block self-likes). The pattern is consistently `AND owner_id = ${userId}` / `AND user_id = ${userId}` **inside the predicate**, never a post-fetch comparison.
- **Private-report metadata does not leak.** `src/app/s/[id]/page.tsx:34-40` returns a bare `{ title: "VGC Team Report", robots: { index: false } }` for a report that is neither public nor unlisted, *before* composing any title, description or og:image. Checked specifically because `generateMetadata` runs for unauthenticated requests.

---

### NEW — MEDIUM-1: the og:image Blob card is not revoked when a report is made private, and never on account deletion

- **Where:** `src/lib/sharing/og-image.ts:68-78` (`removeShareOgImage`), `src/app/api/user/reports/[shareId]/route.ts:83-101` (the PATCH visibility toggle), `src/app/api/user/delete/route.ts:104`, `src/app/api/cleanup/route.ts`.
- **Background.** `e4d9354` pre-renders each share's unfurl card and stores it in Vercel Blob with `access: "public"`, `addRandomSuffix: false`, path `og/{shareId}.png` (`og-image.ts:36,99-107`). The design handles revocation correctly in *one* place: `publishShareOgImage:88-92` calls `removeShareOgImage` when a report is neither public nor unlisted, and `share/route.ts:417-421,577-581` schedules it with the post-update visibility. `user/reports/[shareId]` DELETE also calls it (`:140`).
- **Three paths bypass that.**
  1. **`PATCH /api/user/reports/[shareId]` — the dashboard visibility toggle.** `:83-101` runs `UPDATE shares SET is_public = …, is_unlisted = …` and then invalidates only `cacheDel(CacheKeys.share(shareId))` and `cacheInvalidatePrefix("explore:")`. **`removeShareOgImage` is not called.** Flipping a report public → private through the dashboard leaves the rendered card live in a public Blob.
  2. **`DELETE /api/user/delete` — GDPR account erasure.** `:104` hard-deletes every share the user owns and `buildAccountSatellitePurge` clears nine satellite tables, but nothing touches Blob. The card survives the account, and it renders `creatorName` — personal data the erasure request was about.
  3. **`cleanup` cron** — same omission on the trash-TTL / stale-sweep path.
- **Exploit scenario (concrete).** The Blob URL is deterministic: `https://{storeId}.public.blob.vercel-storage.com/og/{shareId}.png`, with `addRandomSuffix: false` guaranteeing the path. `{storeId}` is not secret — it is published as `og:image` in the `<head>` of **every** public share page (`src/app/s/[id]/page.tsx:128-129`), so one fetch of any public report yields the prefix. An attacker who knows a share id — from when it was public, from a Discord unfurl, from `/api/explore`, from a bookmark — then fetches `og/{id}.png` directly and gets the card: all six species, items (correctly redacted per `privateFields`), abilities, tera types, tournament name, placement, creator name and record. `/api/team-graphic` and `/s/{id}` both 404 that same report. **This is the exact control bypass HIGH-1 was about, reintroduced one layer out:** the report API was hardened, and the artifact cache was not.
  The same predictable path is also an existence oracle for unlisted reports (200 vs 404 on `og/{id}.png`).
- **Severity: MEDIUM.** Confidentiality of content the creator deliberately unpublished, plus a GDPR-erasure gap. Requires knowing a share id, which bounds reach; ids are 8 chars of `[A-Za-z0-9]` so enumeration is not the path — the public→private flip is.
- **Fix (~20 min + a vitest case):** call `removeShareOgImage(shareId)` from the PATCH visibility path whenever the resulting state is neither public nor unlisted (mirroring `publishShareOgImage:88-92`, which already encodes the intended rule), and add it to the account-delete and cleanup purges. The `share/route.ts` path already proves the pattern.
- `conflict_risk: false` — none of these files is on `.swarm/main-changed-files.md`.

### NEW — MEDIUM-2: `removeShareOgImage` is Redis-dependent, so revocation silently no-ops and orphans the Blob

- **Where:** `src/lib/sharing/og-image.ts:68-78`.

  ```ts
  const card = await getShareOgCard(shareId);
  if (!card) return;              // ← silent no-op
  await del(card.url.split("?")[0]);
  ```

- `getShareOgCard` → `cacheGet`, and `src/lib/cache.ts:29-42` returns `null` **whenever Upstash is unconfigured or Redis throws** (documented fail-open). So every revocation path — including the DELETE path that *does* call it — quietly does nothing in those states.
- **Worse, this is guaranteed to happen eventually.** The Redis entry carries a 90-day TTL (`OG_TTL_SECONDS`, `:29`); the Blob has **no expiry**. Once the key expires, `removeShareOgImage` can never find the URL again, and the public card becomes permanently undeletable by any code path — an orphan that outlives the report, the account and the TTL, while still costing Blob storage.
- **Severity: MEDIUM** — it defeats a control that is believed to be in force, and it compounds MEDIUM-1 (even fixing the missing call sites leaves revocation conditional on Redis).
- **Fix (~10 min):** derive the target from `blobPath(shareId)` and call `del` unconditionally, using the cached URL only as an optimisation. The pathname is deterministic by construction (`addRandomSuffix: false`), so nothing needs to be looked up. Belt-and-braces: set a Blob lifecycle expiry so an orphan cannot be permanent.
- `conflict_risk: false`.

### NEW — LOW-1: production CSP keeps `script-src 'unsafe-inline'`

- **Where:** `next.config.ts:3-17` (`scriptSources`) and `:122`. `'unsafe-eval'` is correctly dev-only (`:8`), but **`'unsafe-inline'` is unconditional** and ships to production.
- **Consequence.** `'unsafe-inline'` is the clause that makes CSP a real mitigation rather than a header. With it present, any injected `<script>` or inline event handler executes, so CSP provides **no XSS containment** — it is reduced to an exfiltration limiter via `connect-src`. No injection point is known today (React escapes by default, `escapeHtml` is applied to `bio`, `title` and `description` on write), so this is defence-in-depth that is currently switched off, not a live vulnerability.
- **Worth recording that one control is already load-bearing because of its absence.** `user/profile/route.ts:21-24` validates `avatarUrl` only as `v.startsWith("https://")`, so any HTTPS host can be stored; the sole reason that is not a tracking-pixel/SSRF-adjacent issue is that `img-src` (`next.config.ts:126`) does not allow arbitrary hosts. The CSP is doing real work in this codebase — which is the argument for making `script-src` do the same.
- **Severity: LOW.** No exploit without a separate injection bug; this is the control that would blunt one.
- **Fix:** the standard Next.js App Router nonce migration — generate a per-request nonce in `src/proxy.ts`, pass it via a request header, set `script-src 'self' 'nonce-…' 'strict-dynamic'`, and drop `'unsafe-inline'`. **Not a tonight job:** it touches every inline script including Clerk, PostHog and Vercel Toolbar bootstraps, and a mistake is a blank-page outage. Worth a dedicated ticket with a preview-deploy verification pass.

### NEW — Informational

- **`img-src` does not allow the Blob host.** `next.config.ts:126` lists Showdown, Clerk, `raw.githubusercontent.com`, `vercel.live`, `vercel.com`, `data:` and `blob:` — but not `*.public.blob.vercel-storage.com`. Harmless today, because the og:image card is consumed by off-site unfurlers, not rendered in-page. It becomes a silently-broken image the first time anyone displays the card inside the app. Add the host when that happens, not before.
- **`attachBufferedBody` covers three accessors, not all.** `src/lib/security/api-guard.ts:131-141` redefines `text`, `json` and `arrayBuffer`, but not `formData()`, `clone()` or the `body` stream. Every current caller uses `json()`, so this is correct as built; a future route that reads `formData()` after `apiGuard` with a `maxBodySize` would get an already-consumed stream. One line of comment would prevent that discovery-by-outage.

---

### Still present from 26 Oct — ALREADY-REPORTED, re-verified unchanged

- **HIGH — creator-profile takeover via a user-editable display name.** `src/app/api/user/profile/route.ts:71-95` (write), `src/app/api/creator/[name]/route.ts:66` (public read). **Verbatim unchanged.** `creatorName` is still derived from Clerk `firstName`/`lastName`/`username` (`:71-74`) and written with `ON CONFLICT (name) DO UPDATE` (`:83-95`) — no `user_id` binding anywhere, so any signed-in user can edit their Clerk name to a target's, PUT their own `bio`/`twitter`/`discord`/`youtube`/`avatarUrl`, and overwrite the victim's row in place; for a creator in `verified_creators` the attacker's links then render under a **verified badge**. The case-collision variant also still holds: the write binds `name` at the user's exact casing while all reads use `WHERE LOWER(name) = …` and take `rows[0]` with **no `ORDER BY`** (`:41,46`; `creator/[name]/route.ts:66`). Same root cause still visible at `share/route.ts` (`state.creatorName` is free text, unverified against the authed identity), `comments/[shareId]/route.ts:15,109` (free-text `displayName`), and `user/follow/route.ts:52` (follows an unvalidated creator name). **This is now the oldest unfixed code finding.** Fix unchanged: add `user_id` to `creator_profiles`, make it the conflict target, reject a PUT whose `name` is bound to a different `user_id`, and normalise `name` to lower case on write. Needs a migration ⇒ human decision, not tonight.
- **MEDIUM — view counts inflatable via a client-chosen `sessionId`.** `src/app/api/views/[shareId]/route.ts:12,37` unchanged: `ViewBody` is `{ sessionId: z.string().min(1) }`, and dedupe is `cacheSetIfAbsent('view:{shareId}:{sessionId}', 600)`, so a fresh `sessionId` per request is always a first view. 60 increments/min/IP, each a real `UPDATE shares SET view_count = view_count + 1` on the 512MB Neon free tier, plus a PostHog event and an OTel emit — a write-amplification vector as well as a ranking one, since `explore` sorts on `view_count`. `SHARE_ID_RE = /^[a-zA-Z0-9_-]{6,16}$/` (`:11`) is still looser than the real 8-char `[A-Za-z0-9]` format. Abuse remains **unverified** — no PostHog access. Fix: key dedupe on `getClientIp(request)` (trustworthy now) or the Clerk `userId`, keeping `sessionId` as secondary.
- **LOW — `/api/user/export` has no rate limit when Upstash is down.** `src/app/api/user/export/route.ts:6-21` unchanged, and still the **only authenticated route with no `apiGuard` call at all** (confirmed by sweeping all 58 handlers: the others without a guard are `discord`, `sprite` and the three `webhooks/*`, all intentional). Its "one export per 24h" limit is `cacheGet('export:{userId}')`, and `cache.ts:29-42` fail-opens to `null` whenever Redis is unset or throws — at which point each call fans out 12 parallel queries at `LIMIT 1001`. Fix: add `apiGuard` with a low `max` as a floor that does not depend on Redis.
- **LOW — `/api/sprite` unauthenticated and unmetered** (`src/proxy.ts:27-29` early-return, matcher exclusion at `:157`, no `apiGuard` in the route). SSRF genuinely closed; cost is bandwidth, and `Access-Control-Allow-Origin: *` lets third parties hotlink it as their own sprite CDN. Deliberate trade-off — leave it.
- **LOW — signature-verified webhooks have no pre-verification rate limit** (`webhooks/clerk`, `webhooks/linear`, `webhooks/posthog`, `discord`). Noted for completeness; no change recommended.
- **LOW — Clerk user enumeration for any signed-in caller.** `src/app/api/user/search/route.ts:23-34`, 8 results at 20 req/min with a 2-character minimum, returning the raw Clerk `id`. Acceptable for collaborator invites.
- **Informational, unchanged:** `avatarUrl` prefix-only validation (see LOW-1 above — the coupling is now explicit); CSRF is origin-conditional by design (`proxy.ts:103-116`) and correct for a browser threat model; `/api/setup` exempt from origin+CSRF but `verifyBearer`-gated; `/api/sync` CSRF-exempt and GET-only (load-bearing the moment a write method is added); `isPreviewDeploy = host.includes('vercel.app')` (`proxy.ts:62`) should be `endsWith` — no security consequence, it only decides whether to 301.

---

## 4. Security headers / CSP

`next.config.ts:76-153` applies to `/(.*)`. Present and correct: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a tight `Permissions-Policy` (camera/mic/geolocation/payment/usb/sensors all `()`), `X-Permitted-Cross-Domain-Policies: none`, and `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (2 years, preload-eligible).

Two relaxations, both annotated with the reason, both reviewed as justified: `Cross-Origin-Opener-Policy: unsafe-none` (Clerk OAuth popups would break under `same-origin`) and `Cross-Origin-Resource-Policy: cross-origin` (Showdown sprites). No `Cross-Origin-Embedder-Policy` — correct, it would be incompatible with both.

CSP: `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `form-action` restricted to self + Clerk, `upgrade-insecure-requests`, `worker-src 'self' blob:`, `media-src 'self'`. Every allowlist entry is an explicit host — no wildcard origins, no `https:` catch-all. **One finding: `script-src 'unsafe-inline'` in production (LOW-1 above).** One informational gap: the Blob host is absent from `img-src`.

Middleware (`src/proxy.ts`) is **unchanged since the 26 Oct baseline** and was re-read in full. Bot detection, canonical-host redirect, CORS preflight + origin block, and conditional CSRF are all as previously assessed. `src/lib/security/cors.ts` still omits `Access-Control-Allow-Credentials` and still anchors the preview-origin regex on the team-scope suffix — both halves of the v5.27 fix hold.

---

## Fix tonight

Small, safe, no human decision required. All read-only-audit recommendations — nothing below was applied.

1. **Cherry-pick `2f4ec31` onto `main`** (`fix: harden Discord webhook handling after a compromised webhook`). Already written, already tested (22 unit tests), closes §2's LOW, centralises the three raw webhook `fetch` call sites, adds the `DISCORD_WEBHOOKS_DISABLED` kill switch. Highest value per minute in this report. Note its `.env.example` change is docs-only — order it so the push tip carries code (Ignored Build Step gotcha).
2. **`npm audit fix`** (no `--force`). Clears three of the four high advisories — `joi@18.3.1`, `follow-redirects`, `systeminformation` — all `fixAvailable: true`, all non-major, all dev-only. Verify afterwards that no `@vercel/blob` or `eslint-config-next` downgrade was taken.
3. **Add `"zod": "^4.6.6"` to the existing `overrides` block in `package.json`.** Dedupes the nested `zod@4.1.11` under `@vercel/cli-config` onto the already-installed `4.6.6`; closes the remaining four high rows with a lockfile change and no code change. Same major, no API break. (`conflict_risk: true` on `package.json` / `package-lock.json` — rebase before committing.)
4. **`removeShareOgImage`: delete by deterministic pathname** (`og-image.ts:68-78`). Use `blobPath(shareId)` rather than depending on the cached URL, so revocation stops silently no-opping when Redis is unconfigured, erroring, or past the 90-day TTL. Fixes MEDIUM-2.
5. **Call `removeShareOgImage` from the PATCH visibility path** (`user/reports/[shareId]/route.ts:97-101`) when the resulting state is neither public nor unlisted, and add it to the account-delete and cleanup purges. ~3 lines each; mirrors the rule `publishShareOgImage:88-92` already encodes, so no new policy is being invented. Fixes MEDIUM-1. Add a vitest case that names the bug.
6. **`apiGuard` on `/api/user/export`** with a low `max`, as a floor under the Redis-dependent 24h limit. One line. Closes the standing LOW.
7. **Tighten `SHARE_ID_RE`** in `views/[shareId]/route.ts:11` to `^[A-Za-z0-9]{8}$` to match the real id format. Hygiene; does not close the view-inflation finding.
8. **`endsWith` instead of `includes`** for `isPreviewDeploy` (`proxy.ts:62`). No security consequence; one character of accuracy.

**Needs a human decision — do NOT do tonight:** the `creator_profiles` `user_id` migration (HIGH, schema change); changing the view-count dedupe key (MEDIUM, alters a public metric's history); the CSP nonce migration (LOW-1, outage risk across Clerk/PostHog/Vercel bootstraps); confirming in the Discord UI that the VGC-305 webhook is deleted (one click, but only the operator can see it).

---

## Summary table

| # | Severity | Finding | File:line | Status | Proven? | conflict_risk |
|---|---|---|---|---|---|---|
| 1 | **MEDIUM** | og:image Blob card not revoked on private-flip / account delete / cleanup | `user/reports/[shareId]/route.ts:83-101`; `user/delete/route.ts:104` | **NEW** | **Proven** (predictable path; store prefix published in every public `<head>`) | false |
| 2 | **MEDIUM** | `removeShareOgImage` fail-opens on Redis; Blob outlives the 90-day key | `src/lib/sharing/og-image.ts:68-78` | **NEW** | **Proven** | false |
| 3 | **MEDIUM** | Creator-profile takeover via editable Clerk display name | `user/profile/route.ts:71-95`; `creator/[name]/route.ts:66` | ALREADY-REPORTED, **unchanged** | **Proven** | false |
| 4 | **MEDIUM** | View counts inflatable via client-chosen `sessionId` | `views/[shareId]/route.ts:12,37` | ALREADY-REPORTED, **unchanged** | Proven in code; abuse unverified (no PostHog) | false |
| 5 | LOW | Discord webhook token can reach Vercel logs; hardening commit unmerged | `discord-webhook.ts:22-33`; `feedback/route.ts:75`; `webhooks/posthog/route.ts:278` | **NEW** | Pattern proven; exact undici error shape asserted by `2f4ec31`, not reproduced here | false |
| 6 | LOW | `script-src 'unsafe-inline'` in production CSP | `next.config.ts:5,122` | **NEW** | Proven (no containment); no injection point known | false |
| 7 | LOW | `user/export` rate limit fails open without Upstash; no `apiGuard` | `user/export/route.ts:6-21` | ALREADY-REPORTED, **unchanged** | Proven | false |
| 8 | LOW | `/api/sprite` unauthenticated + unmetered (bandwidth; `ACAO: *`) | `proxy.ts:27`; `sprite/route.ts` | ALREADY-REPORTED, **unchanged** | Proven | **true** |
| 9 | LOW | Webhooks have no pre-verification rate limit | `api/webhooks/*`, `api/discord` | ALREADY-REPORTED, **unchanged** | Proven | false |
| 10 | LOW | Clerk user enumeration for signed-in callers | `user/search/route.ts:23-34` | ALREADY-REPORTED, **unchanged** | Proven | false |
| 11 | LOW (dep) | `joi` 18.3.0 quadratic-time email split — **dev-only** | `start-server-and-test → wait-on → joi` | **NEW** | Advisory; unreachable path | **true** |
| 12 | LOW (dep) | `follow-redirects` 1.16.1 credential leak on redirect — **dev-only** | `start-server-and-test → wait-on → axios → follow-redirects` | **NEW** | Advisory; unreachable path | **true** |
| 13 | LOW (dep) | `systeminformation` 5.33.1 — **dev-only**, high limb Windows-only | `cypress → systeminformation` | **NEW** | Advisory; unreachable path | **true** |
| 14 | LOW (dep) | `zod` 4.1.11 nested under `@vercel/blob` — prod tree, **not reachable** | `@vercel/blob → @vercel/oidc → @vercel/cli-config → zod` | **NEW** (path) | Advisory; reachability traced to local-CLI config only | **true** |
| 15 | INFO (dep) | `@opentelemetry/core` 2.6.1 Baggage advisory — prod tree, not reachable | 8 nodes under `exporter-logs-otlp-http` | ALREADY-REPORTED, **unchanged** | Advisory; Baggage unused | false |
| 16 | INFO (dep) | `minimatch` 10.2.4 globparts — **lint-only** | `eslint-config-next → typescript-eslint → typescript-estree → minimatch` | **NEW** | Advisory; unreachable path | false |
| 17 | INFO | VGC-305 webhook: deleted per `2f4ec31`; repo still public; blob unverifiable here | `5da513a` (absent from this shallow clone) | ALREADY-REPORTED, **likely closed** | Asserted by commit; **not re-verified** | false |
| 18 | INFO | `img-src` lacks the Blob host; `attachBufferedBody` omits `formData`/`clone` | `next.config.ts:126`; `api-guard.ts:131-141` | **NEW** | Proven | false |

**Fixed since 26 Oct — do not re-report:** `team-graphic` visibility **and** redaction (`route.tsx:55-91` + `team-graphic-image.tsx:91-95`, 327 new tests — the four-run finding, properly closed); `apiGuard` body-size chunked bypass (`api-guard.ts:52-125`, real streaming cap); direct `zod` → 4.6.6 plus `.max(2)` caps (`share/route.ts:37-44`); secrets regression guard merged to `main`; **VGC-264 closed and now structurally enforced** by `no-raw-forwarded-for.test.ts`.

**Verified-as-still-fixed:** v5.26 header forgery (`input-validation.ts:75-103`), v5.27 CORS credentials + preview-origin anchoring (`cors.ts`), `comment_flags` identity derivation, `/api/builder/` exemption removal, SQL injection (zero surface), SSRF (all three fetch routes), mass assignment (none), error-response leakage (none).

**Ticket dispositions:** VGC-264 → **close** (fixed + guarded). VGC-300 → **close as stale**, re-file the `npm audit fix` + `zod` override ticket (§1). VGC-305 → **close after one operator confirmation** in the Discord webhook UI; file the `2f4ec31` cherry-pick separately.

**Caveats restated:** PostHog credentials absent — no finding corroborated against production telemetry, and #4 in particular is a proven code path with unverified real-world abuse. This clone is shallow (77 revisions) — #17's git-history limb could not be re-verified, and the secret-history sweep covers only the revisions present locally.
