# C4 — Security audit, 23 Nov 2026

Read-only run. No code edits, no commits, no git state changes.
Scope: working-tree + reachable-history secrets scan; `no-hardcoded-secrets` guard coverage; `npm audit` triage with reachability; OWASP pass over the 58 `route.ts` handlers under `src/app/api/**`; the Next.js CLI advisory.

**Headline.** No secret of any class is present in the working tree. The two HIGHs the 16 Nov run left open (creator-profile takeover, fork redaction bypass) are both **unchanged** — and both sit on PR-owned files, so neither can be touched tonight. The one genuinely new thing this run is that **the 16 Nov verdict "23 advisories, none prod-reachable" is now refuted**: `next@16.4.3` itself carries 7 moderate advisories that did not exist on 16 Nov, and the framework is prod-reachable by definition. Everything actionable tonight is small and lives on free files, the best of it being three empirically-confirmed holes in the secrets guard.

**Caveats.** The clone is **shallow** (`.git/shallow` present, 96 commits, earliest `8f7a266` 2026-09-21). This is the same limitation the 16 Nov run hit, and it again makes the history half of VGC-305 unanswerable here. No PostHog/Linear credentials in this container, so nothing is corroborated against production telemetry.

---

## 1. Hardcoded secrets

### (a) Working tree — **NO real secret present**

Scanned `src/`, `scripts/`, `.github/`, `vercel.json`, `next.config.ts`, `.env.example`, `cypress/`, `docs/`, all root config, across 22 secret classes: Discord webhook URLs and bot tokens, `lin_api_`/`lin_oauth_`, `sk_live`/`sk_test`/`pk_live`/`whsec_`, Postgres/Neon connection strings, `phc_`/`phx_`, VAPID, AWS (`AKIA`/`ASIA`/`ABIA`/`ACCA`), `gh[pousr]_`, `xox[baprs]-`, `AIza`, `sk-ant-`, PEM private-key blocks, JWTs, Upstash URLs, `vercel_blob_rw_`, plus a generic sweep for any ≥16-char literal assigned to a secret-shaped identifier.

Result: **zero findings.** Every hit was a placeholder or a pattern definition:

| Location | Why it is not a secret |
|---|---|
| `.env.example` (95 lines, all 40-odd values) | Every value is `<your-…>`, `your-…`, `xxxx`, `0000…`, or a documentation hostname. `VAPID_PUBLIC_KEY=` / `VAPID_PRIVATE_KEY=` are empty. |
| `src/lib/security/__tests__/no-hardcoded-secrets.test.ts` | The rule regexes and the `FAKE` fixtures, assembled from fragments at runtime so the file does not contain a credential-shaped literal. |

`.gitignore` correctly covers `.env*` with `!.env.example`, and `git ls-files | grep -i env` returns only `.env.example`. No `.env.local` exists in this container (expected per CLAUDE.md).

One informational note, not a finding: `src/app/api/discord/route.ts:7` hardcodes a 64-hex `DISCORD_PUBLIC_KEY`. That is Discord's Ed25519 **public** verification key — published by Discord, meant to be in source, not a credential. `.env.example:89-90` documents the choice deliberately. Leave it.

### (b) Guard-test coverage — `src/lib/security/__tests__/no-hardcoded-secrets.test.ts` (**FREE file**)

Currently green: 10/10 tests pass. Its design is good — tracked-tree only, findings report file+line and never the value, negative fixtures so a broken regex cannot pass silently, and a well-argued refusal to add a generic "long hex" rule.

**Covered (8 classes):** `discord-webhook-url` (17–20 digit id + 40+ char token), `linear-api-key` (`lin_api_`), `clerk-secret-key` (`sk_live`/`sk_test`), `aws-access-key-id` (`AKIA` only), `github-token` (`gh[pousr]_`, `github_pat_`), `jwt-literal`, `postgres-connection-string` (with a pure-alphabetic-password placeholder filter), and a generic `hardcoded-credential-literal`.

**Three gaps, all empirically confirmed against the real regexes (not inferred):**

**GAP-1 — the generic rule requires the value to be *quoted*, so every `.env`-shaped assignment is invisible to it.** The pattern ends `[:=]\s*["'\`](…)["'\`]`. The test deliberately keeps `.env.example` in scope (`:30-34`: "exactly where a real value gets pasted by accident") — but an env file writes `NAME=value` with no quotes, so the one rule that could catch an unprefixed secret cannot fire there at all. Verified: all four of these return **no match**, even though every one of their names *does* contain a word the rule's alternation covers:

```
CLERK_WEBHOOK_SIGNING_SECRET=…   → no match   (name contains SECRET)
POSTHOG_PERSONAL_API_KEY=…       → no match   (name contains API_KEY)
UPSTASH_REDIS_REST_TOKEN=…       → no match   (name contains TOKEN)
RESEND_API_KEY=…                 → no match   (name contains API_KEY)
```

This is the root cause, and it is one character class wide — not six independent missing vendor rules. Fix: allow an optional-quote form (`["'\`]?(…)["'\`]?`) anchored to line end for env-shaped files, keeping `looksHighEntropy` as the gate so placeholders still fall out.

**GAP-2 — `VAPID_PRIVATE_KEY` is missed, confirming VGC-350, and for *two* independent reasons.** It is unquoted in `.env.example` (GAP-1), **and** `VAPID_PRIVATE_KEY` contains none of the words in the rule's alternation (`api_key|secret|token|password|passwd|bearer|credential`) — verified false. So fixing GAP-1 alone still would not catch it. Fix needs `private[_-]?key` added to the alternation as well. The key itself is handled correctly in code (`src/lib/web-push.ts:6-7`, read from `process.env`), so this is purely a guard gap.

**GAP-3 — the `PLACEHOLDER` filter's `abcdef` alternative is unanchored, so it whitelists real tokens that happen to contain that substring.** Verified: `lin_api_9f3c7d2e4b1a6058abcdef41c7e29d418ab35f6027d1a9b4c6e8` → `PLACEHOLDER.test()` returns **true**, i.e. a real Linear key would be silently skipped. `1234567890` has the same shape of problem. Low probability per token but a free fix: require word boundaries, or only apply the placeholder filter when the match contains no high-entropy run.

All three are one edit to one free file. Not urgent — the tree and the reachable history are clean — but cheap and worth taking tonight.

### (c) VGC-305 — **cannot be confirmed or refuted from this clone**

The ticket concerns a live Discord webhook token in this public repo's git history. Status here: **inconclusive, for a structural reason, not a clean bill of health.**

- The incident commits named in the guard test's own header comment, `5da513a` (added) and `28f5b8b` (removed), are **not valid objects in this clone** — `git log -1` on both returns `fatal: ambiguous argument … unknown revision`. The clone is shallow and its earliest commit is `8f7a266` (2026-09-21), well after the leak.
- I ran the reliable sweep the guard test's methodology note prescribes (enumerate every blob, not `git grep --all`, which produces false negatives for added-then-removed secrets): `git rev-list --objects --all --reflog | git cat-file --batch-check` → **1317 blobs scanned**. Zero hits for the Discord-webhook class.
- Nine blobs matched my deliberately-looser Postgres-URL pattern. All nine are the documented placeholder: applying the guard test's own `verify` predicate (reject pure-alphabetic passwords) classifies **all nine as placeholders**. Paths: `.env.example` (×2 versions), `src/lib/security/__tests__/no-hardcoded-secrets.test.ts` (×2 versions), and prior `.swarm/c4-security-*.md` reports quoting the same string. No real credential in reachable history.
- `git log --all -S'discord.com/api/webhooks'` returns 7 commits (`95fa4c6`, `95020a2`, `2f4ec31`, `d640f32`, `7b85e8f`, `637989f`, `8f7a266`) — all of which carry the pattern as prose in audit reports, the hardening commit, or the guard test, never as a value.

**So:** the leak is *not* reachable from anything this container can see, but this container cannot see the commits where it lived. The 16 Nov run reached the identical conclusion. This question is not answerable by any amount of further scanning from here.

**Rotation is a human dashboard action** and is the only thing that actually closes VGC-305: regenerate the `#builds` incoming webhook in Discord (Server Settings → Integrations → Webhooks), then update `DISCORD_BUILDS_WEBHOOK` in the Vercel project env and the swarm container's env. Rotation is also the *correct* close even if the blob were later proven unreachable, because a token that was once public in a public repo must be assumed captured. ~5 minutes. No agent can do it.

---

## 2. `npm audit` — 23 advisories, and the "none prod-reachable" verdict no longer holds

```
{ "info": 0, "low": 0, "moderate": 16, "high": 7, "critical": 0, "total": 23 }
```

The **count** matches 16 Nov exactly (23; 16 moderate + 7 high). The **composition has changed**: the TS-ESLint chain contributes 7 entries now rather than 8, and `next` has entered the audit with 7 advisories of its own. So the total is stable by coincidence, and re-using the prior run's conclusion unchanged would have been wrong.

| Chain | Count / sev | Advisory | Reachability | Verdict |
|---|---|---|---|---|
| `next@16.4.3` | 1 entry, **7 moderate advisories** | GHSA-mfr8-8qww-v76h, GHSA-vc7v-qv4w-wrv8, GHSA-7qx7-33qx-rqx2, GHSA-f3mh-rxg3-f5g2, GHSA-pc58-hwjq-p385, GHSA-rhh4-g77r-r9qj, GHSA-vvgp-ww4w-46vf | **(i) client bundle + (ii) every server route** — it is the framework | **NEW. Prod-reachable. See §4** |
| `@opentelemetry/core` + 7 fan-out nodes | 8 moderate | GHSA-8988-4f7v-96qf — unbounded alloc in W3C **Baggage** propagation | **Server, loaded, not invoked.** Re-verified: `src/instrumentation.ts:21-37` registers a `LoggerProvider` + OTLP log exporter only. No propagator is registered, no `baggage` header is parsed, no trace context is extracted from inbound requests | Accept |
| `@typescript-eslint/*` ×5 + `typescript-eslint` + `minimatch@10.2.4` | 7 moderate | GHSA-g3hv-75wg-m249 — minimatch globparts DoS | **(iii) dev/lint only.** `devDependencies` → `eslint-config-next@16.1.6`. No attacker input reaches a glob | Accept — npm's only "fix" is `eslint-config-next@15.5.29`, a major **downgrade** that would regress Next 16 lint rules |
| `zod@4.1.11` + `@vercel/blob`/`oidc`/`cli-config` | 4 high | GHSA-mrhx-c7xc-m3w5 — memory exhaustion on oversized constrained collections | **Loaded, not invoked.** Confirmed nested copy only: `npm ls zod` shows `@vercel/blob@2.8.2 → @vercel/oidc@3.8.10 → @vercel/cli-config@0.3.1 → zod@4.1.11`, while the app's own direct `zod` is **4.6.6** (advisory range `<4.6.6`, so not affected). `@vercel/blob` is a real prod dep (`src/lib/sharing/og-image.ts:1`), but cli-config's schemas validate the Vercel CLI's own config files, never request data | Accept — npm's offer is `@vercel/blob@2.4.0`, a major downgrade of a load-bearing prod dep |
| `follow-redirects@1.16.1` | 1 high | GHSA-mrwp-f3q8-3g9p | **(iii) dev only** — `start-server-and-test@2.1.5 → wait-on → axios → follow-redirects`; reached only by `npm run test:e2e`, which CI does not run | Accept; free in-range patch can ride along |
| `joi@18.3.0` | 1 high | GHSA-4528-x5fx-h6hg — quadratic `string().email({multiple:true})` | **(iii) dev only** — same `start-server-and-test` chain; parses `wait-on`'s own options | Accept; free in-range patch |
| `systeminformation@5.33.1` | 1 high (aggregate) | GHSA-3f7j-7jwc-fxfj (Windows cmd injection), GHSA-7648-jmwf-vw7j, GHSA-4vjg-vx72-qq4g | **(iii) dev only** — `cypress@15.18.0`; Cypress is not even installed in this container (`CYPRESS_INSTALL_BINARY=0`) | Accept; free in-range patch |

**Verify-or-refute on the 16 Nov conclusion:**

- The *mechanism* of the prior triage is **verified**: the OTel, TS-ESLint, Vercel/`zod`, `follow-redirects`, `joi` and `systeminformation` reasoning all re-confirm against today's tree, chain for chain.
- The *conclusion* "none prod-reachable" is **refuted** — by one chain the prior run could not have seen, because the Next advisories postdate it. Of the 22 non-Next advisories, none is prod-reachable. Of the 23 total, the `next` entry is.

**On VGC-351 (accept and document rather than chase breaking upgrades): the evidence supports it, for 22 of 23 advisories.** Every one of those 22 is either dev-only or a loaded-but-uninvoked code path, and in three cases npm's proposed "fix" is a **major downgrade** of either a prod dep or the lint config. Accepting and recording the reachability reasoning is the right call, and will stop the next audit re-litigating it. **But VGC-351 must carve out `next`**, which is not in that category: it is prod-reachable and its fix is an in-range patch bump, not a breaking upgrade. Folding it into a blanket "accept" would be the one wrong outcome here.

---

## 3. OWASP review — `src/app/api/**` (58 handlers)

The security posture here is genuinely strong, and much of it is the result of earlier audits landing. Verified as properly handled, **do not re-report**:

- **SQL injection: zero surface.** Every query across all 58 routes uses `@neondatabase/serverless` tagged templates. No string concatenation into SQL anywhere.
- **Privileged endpoints all bearer-gated with timing-safe compare.** `cron/*` (×4), `cleanup`, `keep-alive` via `isCronAuthorized` (`src/lib/cron-auth.ts`, fails closed when `CRON_SECRET` unset, `timingSafeEqual`); `setup` and `migrate` via `verifyBearer` (same properties). All 7 call sites confirmed to actually invoke the check, not merely import it.
- **SSRF closed on all three outbound-fetch routes.** `sprite` — host + path allowlist (`play.pokemonshowdown.com`, `/sprites/`). `pokepaste` — host allowlist, then the URL is **rebuilt against a hardcoded `https://pokepast.es` base**, so even a bypassed allowlist cannot redirect the host; POST uses `redirect: "manual"`. `import/limitless` — `normalizeLimitlessUrl` checks protocol, hostname, port, userinfo and path shape, `fetchPage` uses `redirect: "error"` and a 2 MB stream cap, and the second-order `selected.tournamentUrl` parsed out of the fetched HTML is **re-normalised through the same validator** before being fetched. That last detail is the one most such routes get wrong.
- **IDOR: no exploitable instance found.** Every id-bearing route carries an ownership predicate in the SQL itself (`owner_id = ${userId}`, or an owner-or-accepted-collaborator `EXISTS`): `user/reports/[shareId]`, `changelog/[shareId]`, `user/collections/[id]`, `match-log`, `comments/[shareId]/[commentId]`, `share/[id]/versions/*`. `collaboration/[id]` delegates to `src/lib/collaboration-access.ts`, which validates the id shape, requires `auth()`, and checks owner-or-collaborator before returning a handle — a good pattern.
- **Anonymous comment deletion is *not* an IDOR.** It authorises on a client-supplied `sessionId`, which would be trivially exploitable if that value were readable — but the GET handler never returns `session_id`, mapping it to a boolean `isOwn` instead (`comments/[shareId]/route.ts:78`, documented at `:36`). Correctly built.
- **`getClientIp` header forgery is fixed** (`src/lib/security/input-validation.ts:75-103`): platform headers first, then the **right-most** `x-forwarded-for` entry only.
- **CORS** has no `Access-Control-Allow-Credentials` and anchors preview origins on the `-mss23s-projects` scope suffix, closing the attacker-registrable `*.vercel.app` hole.
- **Discord slash-command authz** gates mutating commands (`approve`/`reject`) on an explicit user/role allowlist that **fails closed** when unconfigured, on top of Ed25519 signature verification.
- **Rate limiting** is applied via `apiGuard` on 44 of 58 routes. The 14 without it are the secret-gated cron/webhook/privileged set plus `sprite` — defensible, with the caveats below.

### Findings

Ranked by real exploitability. Ownership checked against `.swarm/pr-owned-files.txt` (152 files) for every one.

**H-1 — Verified-creator profile takeover. `creator_profiles` has no owner column. — UNCHANGED, PR-OWNED**
`src/app/api/user/profile/route.ts:71-95` (write), `src/app/api/creator/[name]/route.ts` (read), `src/lib/db.ts:90-101` (schema). Re-verified today: `db.ts:91` is still `name TEXT PRIMARY KEY` with **no owner column**, and `profile/route.ts:86` still does `ON CONFLICT (name) DO UPDATE`, with the key derived at `:71-72` from `user.firstName`/`lastName`/`username` — fields any signed-in user edits freely in Clerk's own account UI. An attacker sets their Clerk name to a target creator's, PUTs their own bio and socials, and overwrites the victim's public creator page in place; `creator/[name]` renders a **verified badge** for names in `verified_creators`, so the attacker's Discord and Twitter links appear under that badge on the legitimate domain. A working phishing primitive against a named community figure. **Genuinely exploitable, authenticated, ~60 seconds.** Existing ticket **VGC-253** — tie to it, do not re-file. All three files are **PR-owned → cannot be fixed tonight.**

**H-2 — Tiered-publishing redaction bypass via fork. — UNCHANGED, PR-OWNED**
`src/app/api/share/[id]/fork/route.ts:87-92`. Re-verified today: `grep -c redact` over the file returns **0**, and `:92` still spreads `...sourceData` verbatim, clearing only event metadata while copying `paste` and `privateFields` intact. Any signed-in user presses Fork on a public report, becomes `owner_id` of the new row, and `GET /api/share/{forkId}` takes the owner branch — which does not redact — exposing the hidden item/EV/IV/nature fields the creator concealed before an event. **Genuinely exploitable, authenticated, one click, no tooling.** The same control is correctly applied in `share/[id]/route.ts` and `team-graphic`; fork is the third reader to forget it independently, which argues for promoting `applyPrivateFieldRedaction` into `src/lib/sharing/redact-paste.ts` as a single call site. **PR-owned → cannot be fixed tonight.**

**M-1 — PII in logs: a user's full email address is written to Vercel logs. — FREE-file logic, PR-OWNED file**
`src/app/api/webhooks/clerk/route.ts:83`: `console.error("Failed to send welcome email to", primaryEmail.email_address);`. Every welcome-email failure deposits a registered user's email in the platform log retention. Not attacker-triggerable and not a breach, but it is unnecessary PII in logs where `data.id` (the Clerk user ID, already used for exactly this purpose at `:68-70`) would serve identically. One-line change. **`src/app/api/webhooks/clerk/route.ts` is PR-owned → needs a ticket, cannot be fixed tonight.** No other route leaks secrets or PII in logs — the other 7 `console.*` calls with sensitive-looking context all log counts, user IDs, or the *absence* of a configured env var, never a value.

**M-2 — CSRF validation in `src/proxy.ts` is unreachable for every application route. — FREE**
`src/proxy.ts:103-116` enforces `validateCsrf` only when `isTrueCrossOrigin` — i.e. an `Origin` header is present and **not** in the allowlist. But `:90` already returns 403 for exactly that condition, before control reaches `:108`, for every path except `/api/discord` (bypassed at `:14`), `/api/webhooks/*` and `/api/setup`. So the CSRF check can only ever fire on three secret-authenticated server-to-server endpoints, and the "defense-in-depth for state-changing API requests" comment at `:97-102` does not describe what the code does. CORS *is* doing the job — modern browsers send `Origin` on all cross-site POSTs, so `isAllowedOrigin` returning `true` for a missing `Origin` (`cors.ts:65`) is not practically exploitable. **This is an assurance finding, not a live hole: the protection is theoretical today and would silently stay theoretical if the CORS block were ever narrowed.** Worth either making the layering real or correcting the comment to say CORS is the only control. Small, free file.

**L-1 — `match-log` POST accepts an arbitrary `shareId` with no ownership or format check. — FREE**
`src/app/api/match-log/route.ts:24,53`: `shareId: z.string().max(50).optional()` is inserted directly with no validation that the share exists or belongs to the caller. I traced every reader of `match_logs`: the GET handler filters on `user_id = ${userId}` (`:120`) and nothing else in the codebase reads the table by `share_id` (only `user/delete` purges it by `user_id`). So the write lands only in the attacker's own rows and is invisible to the referenced share's owner. **Theoretical** — self-only data pollution, no cross-user exposure. Worth a `SHARE_ID_RE` check for consistency with the other routes; it becomes real the moment anything aggregates match logs by `share_id`.

**L-2 — `/api/sprite` is exempt from all middleware and has no rate limit. — FREE**
`src/proxy.ts:27-29` early-returns before bot detection, CORS and CSRF, and `src/app/api/sprite/route.ts` does not call `apiGuard`. The exemption is well-justified in the comment (dozens of hits per page view; edge invocations were the top cost driver) and SSRF is closed by the host+path allowlist, so this is **theoretical as a security matter**. Two notes: the upstream `fetch` at `:51` follows redirects by default, so a compromised `play.pokemonshowdown.com` could redirect the proxy anywhere — `redirect: "manual"` would close that for one line; and the route is an unmetered bandwidth amplifier bounded only by Vercel's CDN. Cost guardrail more than a vulnerability.

**L-3 — Discord interaction timestamp is verified but not checked for freshness. — FREE**
`src/app/api/discord/route.ts:80-93` verifies the Ed25519 signature over `timestamp + rawBody` but never compares `timestamp` against now, so a captured valid interaction can be replayed indefinitely. Replaying `approve`/`reject` would re-drive the build pipeline. Requires first capturing a signed admin interaction, which is a high bar — **theoretical.** A ±5-minute window check is ~3 lines.

**L-4 — `getClientIp` fingerprint fallback is attacker-rotatable. — FREE**
`src/lib/security/input-validation.ts:93-100`: when no platform header and no valid `x-forwarded-for` is present, the rate-limit key falls back to a `user-agent | accept-language | sec-ch-ua` fingerprint, which a caller can rotate freely to mint unlimited buckets. On Vercel `x-vercel-forwarded-for` is always set, so this is unreachable in production — **theoretical**, and the function's own docstring already flags the related `"unknown"` collapse. Noted only so it is not mistaken for spoof-proof.

**L-5 — Anonymous comments accept an arbitrary `displayName`. — FREE**
`src/app/api/comments/[shareId]/route.ts:109-110`: free-text, `escapeHtml`'d (so **no XSS**) and word-filtered, but nothing stops posting as a known creator's name. Rate-limited to 5/min. Impersonation/trust issue rather than a technical vulnerability; carried over from 16 Nov (MEDIUM-3) and still accurate.

**L-6 — View counts are inflatable via unvalidated `sessionId`. — PR-OWNED**
`src/app/api/views/[shareId]/route.ts:12,37`: the dedup key is client-supplied, so rotating it inflates `view_count`, bounded by the 60/min IP rate limit. Metric integrity, not a security boundary. `src/app/api/views/[shareId]/route.ts` is **PR-owned**.

**L-7 — `/api/user/export` has no rate limit. — PR-OWNED**
`src/app/api/user/export/route.ts` is the only `user/*` route without `apiGuard`. Clerk-authenticated, so it is self-service data export abuse at worst; when Upstash is unconfigured the in-memory limiter is per-instance anyway. **PR-owned.** Carried over from 16 Nov (MEDIUM-4).

---

## 4. The Next.js advisory

**Installed resolved version: `next@16.4.3`** (`npm ls next` → `next@16.4.3`, and `@clerk/nextjs@7.5.9 → next@16.4.3 deduped`; `package.json` declares `^16.4.3`).

**`npm audit` corroborates it.** The advisory range is `16.0.0 - 16.4.4`, so 16.4.3 is affected, and the audit attributes **7 moderate advisories** to it — this is the same thing the `next build` CLI banner is reporting, not a separate issue. `fixAvailable: true`, i.e. an in-range patch.

Per instruction I ran no `next upgrade` and changed no dependency. Assessing which of the seven actually apply here:

| Advisory | Applies to this codebase? |
|---|---|
| GHSA-f3mh-rxg3-f5g2 — HttpOnly cookie exposure via internal response header on **Edge runtime** routes | **Yes — the one that matters.** The repo has 6 `runtime = "edge"` routes (`api/sprite`, `api/team-graphic`, and 4 `opengraph-image.tsx`) and Clerk session cookies are HttpOnly |
| GHSA-mfr8-8qww-v76h, GHSA-vc7v-qv4w-wrv8, GHSA-rhh4-g77r-r9qj, GHSA-vvgp-ww4w-46vf — `use cache` / `unstable_cache` / Cache Components leaks | **No.** `grep` for `"use cache"`, `unstable_cache`, `cacheComponents`, `dynamicIO` across `src/` and `next.config.ts` returns **zero hits** |
| GHSA-7qx7-33qx-rqx2 — SVG rejection bypass in image optimization | **No.** `next.config.ts:32-35` sets `images.remotePatterns: []` and nothing imports `next/image` |
| GHSA-pc58-hwjq-p385 — cross-client response injection in **self-hosted** apps forwarding fetched responses | **Unlikely.** The app forwards fetched responses (`api/sprite`, `api/pokepaste`) but runs on Vercel, not self-hosted |

So: one of seven plausibly reaches this deployment, and it is a confidentiality issue on the Edge routes. **Recommendation: a patch bump to `next > 16.4.4`, as its own ticket** — in-range, non-breaking, and explicitly *not* part of VGC-351's blanket accept. `package.json` is **PR-owned**, so this cannot be done tonight regardless.

---

## 5. Disposition

### Fix tonight — free file, small
1. **Guard-test gaps GAP-1/2/3** — `src/lib/security/__tests__/no-hardcoded-secrets.test.ts` (**FREE**). Optional-quote form for env-shaped assignments, add `private[_-]?key` to the alternation, word-boundary the `abcdef`/`1234567890` placeholder alternatives. One file, all three empirically reproduced above, add a negative fixture per gap. ~45 min.
2. **L-1** `SHARE_ID_RE` check on `match-log` POST `shareId` — `src/app/api/match-log/route.ts` (**FREE**). ~10 min + 1 test.
3. **L-2** `redirect: "manual"` on the sprite upstream fetch — `src/app/api/sprite/route.ts` (**FREE**). ~5 min.
4. **L-3** ±5-minute timestamp freshness check on Discord interactions — `src/app/api/discord/route.ts` (**FREE**). ~15 min + 1 test.
5. **M-2** either make the CSRF layering real or correct the misleading comment — `src/proxy.ts` (**FREE**). ~20 min; prefer correcting the comment unless the layering is genuinely wanted.

### Needs a ticket — PR-owned file, or not a code change
| Item | Why it waits | Ticket |
|---|---|---|
| **H-1** creator-profile takeover | `user/profile/route.ts`, `creator/[name]/route.ts`, `db.ts` all **PR-owned** | **VGC-253** — do not re-file |
| **H-2** fork redaction bypass | `share/[id]/fork/route.ts` **PR-owned** | New ticket; ~30 min once free, + regression test naming the bug |
| **§4** `next` patch bump > 16.4.4 | `package.json` **PR-owned** | New ticket; carve out of VGC-351 |
| **M-1** email address in Clerk webhook logs | `webhooks/clerk/route.ts` **PR-owned** | New ticket; one line |
| **L-6** view-count inflation | `views/[shareId]/route.ts` **PR-owned** | Low priority |
| **L-7** `user/export` rate limit | `user/export/route.ts` **PR-owned** | Low priority |
| **VGC-305** webhook rotation | Human dashboard action; no agent can do it, and this shallow clone cannot answer the history question | **VGC-305** — rotate, ~5 min |
| **VGC-351** accept-and-document | Evidence supports it for 22 of 23 advisories; record the per-chain reachability reasoning from §2 so the next audit does not re-litigate it. **Must exclude `next`** | **VGC-351** |
| **VGC-350** VAPID guard gap | Confirmed, with the extra detail that the name itself matches no covered word — see GAP-2 | **VGC-350** |

### Verified fixed, do not re-report
SQL injection (zero surface), SSRF on all three fetch routes including the second-order Limitless case, `getClientIp` header forgery, CORS credentials + preview-origin anchoring, `apiGuard` Content-Length chunked bypass, direct `zod` high (4.6.6), cron/privileged bearer gating across all 7 call sites, anonymous-comment `session_id` non-disclosure, `collaboration/[id]` ownership gating, Discord mutating-command allowlist, `team-graphic` visibility and redaction.
