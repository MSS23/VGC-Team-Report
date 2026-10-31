# C4 — Security Audit, 26 Oct 2026

Read-only audit. Branch `swarm-nightly-2026-10-26`, cut fresh from `origin/main` (`68796c5`). No source file was edited, nothing committed, no dependency touched. This file is the only write.

Scope: `npm audit` triage + the VGC-300 advisory job, repo-wide secrets scan including git history (VGC-305), and an OWASP pass over the 59 route handlers under `src/app/api/**` (57 `route.ts` + 2 `route.tsx`).

**PostHog credentials are absent from this container**, so no exception/error events could be cross-referenced. Every reachability claim below is from static reading of the code and the installed dependency tree, not from production telemetry. Where that limits confidence it is stated per finding.

**Headline:** VGC-300 is stale — none of the 13 advisories it describes exist in the current tree. The only real `npm audit` high is **zod**, which VGC-300 does not mention and which *is* production-reachable. VGC-305 is **real and still unrotated**. The API layer is otherwise in genuinely good shape: zero SQL injection surface, SSRF closed everywhere, consistent owner/collaborator authz. Two real code problems: `team-graphic` still skips the visibility check (fourth consecutive run to find it), and creator identity is keyed on a user-editable display name.

---

## 1. npm audit triage

```
$ npm audit --json | jq .metadata.vulnerabilities
{ "info": 0, "low": 0, "moderate": 8, "high": 1, "critical": 0, "total": 9 }
```

| Severity | Count | Packages |
|---|---|---|
| critical | 0 | — |
| high | **1** | `zod` |
| moderate | 8 | `@opentelemetry/*` (one advisory, 8 nodes) |
| low / info | 0 | — |

The 8 moderates are a single advisory — GHSA for *OpenTelemetry Core: unbounded memory allocation in W3C Baggage propagation* (`@opentelemetry/core <2.8.0`) — fanned out across `core`, `resources`, `sdk-logs`, `sdk-metrics`, `sdk-trace-base`, `otlp-exporter-base`, `otlp-transformer`, `exporter-logs-otlp-http`. Three are direct deps. Reachability: `src/instrumentation.ts` uses these for PostHog log export; the vulnerable path is W3C **Baggage header propagation**, which this app does not use (no inbound `baggage` parsing, no trace context extraction from client requests — the SDK is used as a log exporter only). **Not practically reachable.** The fix is a semver-major jump to `0.300.0` / `3.0.0`, which is not worth taking for an unreachable advisory. Leave it.

### The one real high — `zod`, and VGC-300 does not mention it

- **Installed:** `zod@4.3.6` (direct, `dependencies`). **Advisory:** GHSA-mrhx-c7xc-m3w5, *"Zod can exhaust memory while validating oversized constrained collections"*, CWE-770, CVSS 7.5 (`AV:N/AC:L/PR:N/UI:N/A:H`), range `<4.6.6`. **Patched release available, non-major:** `fixAvailable: true`.
- **Production-reachable: YES.** zod is the request-body validator for ~40 of the 59 routes. The concrete path is `POST /api/share`: `src/app/api/share/route.ts:18-21,57,66,73` declare `z.array(z.unknown())`, `z.record(z.string(), z.unknown())` and `z.array(z.string())` with **no `.max()` element cap**, and the body-size guard in front of them is header-only and bypassable (see MEDIUM-1). An authenticated caller sends a `Transfer-Encoding: chunked` body with a multi-hundred-thousand-element `matchupPlans` / `privateFields` array; `safeParse` allocates during validation and the lambda OOMs. Requires sign-in and is rate-limited to 20/min, which caps it to a nuisance rather than a trivial outage — but it is the live, reachable advisory in this repo.
- **Fix:** `npm i zod@^4.6.6` (minor, no breaking change in the 4.x validator API this repo uses) **and** put `.max()` caps on the collection schemas in `src/app/api/share/route.ts` so the cap does not depend on a patched zod. `conflict_risk: true` — `package.json` and `package-lock.json` are both on the 14-day main-changed list.

### VGC-300's four "high-severity transitive" advisories — verdict: all four are stale

**None of `axios`, `sharp`, `undici` or `joi` is flagged by the current `npm audit` at any severity.** Every one resolves to a version newer than its last advisory. VGC-300 was filed against an older lockfile; the lockfile has since moved. The reachability question it asks is still worth answering, because it determines what priority these would get if an advisory lands again:

| Package | Installed | Dependency path | Parent patched? | Prod-reachable? |
|---|---|---|---|---|
| `axios` | 1.20.0 | `start-server-and-test@2.1.5 → wait-on@9.0.4 → axios` | n/a (nothing to patch) | **No — dev/build-only** |
| `joi` | 18.3.0 | `start-server-and-test@2.1.5 → wait-on@9.0.4 → joi` | n/a | **No — dev/build-only** |
| `sharp` | 0.35.5 | `next@16.4.3 → sharp` (optionalDependency) | n/a | **In prod tree, but not invoked** |
| `undici` | 7.30.1 | `cheerio@1.2.0 → undici` (prod) **and** `jsdom@29.1.1 → undici` (dev, deduped) | n/a | **Loaded in prod, vulnerable path not called** |

Reasoning per package:

- **`axios` — dev-only. VGC-300's guess is CORRECT.** Sole parent is `start-server-and-test`, which is in `devDependencies` (`package.json`). `npm ls axios --omit=dev` returns nothing. `start-server-and-test` is referenced only by the `test:e2e` / `test:e2e:open` scripts, and CI does not run them (`.github/workflows/ci.yml` runs tsc, eslint, vitest only — Cypress is skipped entirely in the swarm container via `CYPRESS_INSTALL_BINARY=0`). Nothing in `src/` imports it. An axios advisory here is a local-developer-machine concern, nothing more. **Drop to LOW/informational, as VGC-300 anticipated.**
- **`joi` — dev-only. VGC-300's guess is CORRECT.** Identical path and identical reasoning: `start-server-and-test → wait-on → joi`, absent from `npm ls joi --omit=dev`, used only to parse `wait-on`'s own option objects during an e2e run. Never sees attacker input. **Drop to LOW/informational.**
- **`sharp` — in the production tree but not invoked.** It is an *optionalDependency* of `next@16.4.3` (confirmed: `next/package.json` lists it under `optionalDependencies`, not `dependencies`), so it ships with the prod install. Next.js uses it for the `next/image` optimizer and build-time static image optimization. **This app uses neither:** `grep -rn 'next/image|<Image' src/` returns **zero** hits, and `next.config.ts:33-36` sets `images.remotePatterns: []`. The `opengraph-image.tsx` / `route.tsx` OG generators use `next/og`'s `ImageResponse` (resvg/satori), not sharp. On Vercel, image optimization is served by Vercel's own infrastructure regardless. So a sharp advisory would be **HIGH priority only if `next/image` were adopted** — today it is MEDIUM-at-most, build-surface-only. Worth a note in the ticket: adopting `next/image` later would silently promote sharp to a live attack surface for untrusted image bytes.
- **`undici` — the one with a real production footprint, but the vulnerable code is not called.** `cheerio` is a **production** dependency and `src/lib/import/limitless.ts:1` imports it (`import { load } from "cheerio"`), so undici is in the prod tree. Verified empirically that this is not a tree-only presence: `node_modules/cheerio/dist/commonjs/index.js:59` does a **top-level eager** `require("undici")`, and `node -e "require('cheerio')"` confirms `node_modules/undici` lands in `require.cache`. So undici **is loaded into the serverless bundle on every `/api/import/limitless` invocation.** However, undici is only *used* by cheerio's `fromURL()` (`index.js:201-247`, `undici.Client` + redirect interceptor), and the app calls only `load()` — plain in-memory HTML parsing. The HTTP fetch is done by the platform `fetch` in `src/app/api/import/limitless/route.ts:6`, not by undici. So: **loaded, not invoked.** An undici advisory would be MEDIUM (present in the bundle, so anything that later calls `cheerio.fromURL` or that is reachable via a transitive undici consumer becomes live) rather than the HIGH it would be if `fromURL` were in use. Switching the import to `cheerio/slim` would drop undici from the prod tree entirely and close this class of advisory permanently — a one-line, zero-risk hardening worth doing regardless.

### VGC-300's nine "build-time only" highs — **CONFIRMED, with one correction**

None of the nine is flagged by the current audit either. On the classification claim, VGC-300 is right about **eight of nine**:

| Package | In prod tree? | Verdict |
|---|---|---|
| `@next/eslint-plugin-next` | No | Build/lint-only — **confirmed** |
| `eslint-config-next` | No | Build/lint-only — **confirmed** (direct devDependency) |
| `fast-glob` | No | Build/lint-only — **confirmed** (via eslint-config-next) |
| `micromatch` | No | Build/lint-only — **confirmed** |
| `braces` | No | Build/lint-only — **confirmed** |
| `brace-expansion` | No | Build/lint-only — **confirmed** |
| `browserslist` | No | Build-only — **confirmed** |
| `js-yaml` | No | Build/lint-only — **confirmed** |
| `source-map-js` | **Yes** | **CORRECTION — see below** |

**Correction:** `source-map-js@1.2.2` **is** in the production dependency tree, via `next@16.4.3 → postcss@8.5.23 → source-map-js`. `npm ls source-map-js --omit=dev` resolves it. VGC-300's "build-time only" label is right in *effect* — postcss runs at build time to compile Tailwind, and nothing in `src/` invokes postcss or source-map parsing at request time — but it is wrong about the *mechanism*: the package ships in the prod install rather than being confined to `devDependencies`. The practical priority is unchanged (build-only), but the ticket should say "shipped in the prod tree, invoked only at build time" rather than "dev dependency", because the two have different blast radii if a future advisory covers a code path postcss touches at runtime.

**Recommended VGC-300 disposition:** close it as stale. Re-file one small ticket for the zod bump (the only live high) plus the `.max()` caps and the `cheerio/slim` swap.

---

## 2. Secrets scan

### P0 — VGC-305 **CONFIRMED REAL**: live Discord webhook token in public git history, still unrotated

- **Verified present.** `git log --all -S 'discord.com/api/webhooks'` returns 10 commits; only two touch application code, and both are the same file:
  - **`5da513a`** *"Wire feedback to Discord webhook notifications"* — **introduced** the literal at `src/app/api/feedback/route.ts:10`, as the fallback value of an `||` expression.
  - **`28f5b8b`** *"Move Discord webhook URL to env var, remove hardcoded secret"* — **removed** it from the tracked tree.
- **First 4 characters only, as instructed:** webhook id begins `1486`, token begins `c33x`. The full value is deliberately not recorded in this file.
- **Current tree is CLEAN.** `git grep -nE 'discord\.com/api/webhooks/[0-9]{5,}'` over tracked files returns nothing. A filesystem grep over all tracked *and* untracked files (excluding `node_modules`, `.next`, `.git`) finds only placeholders: `.env.example:10` (`postgresql://user:password@host/database`), `.swarm/r-clerk-webhook-18-05-26.md:39` (`whsec_xxxx…`), and prior audit reports describing the scan. No `lin_api_`, `lin_wh_`, `sk-`, `sk_live_`, `ghp_`, `xoxb-`, `AKIA`, `AIza`, `BEGIN … PRIVATE KEY`, or real connection string anywhere in the tree. `.gitignore:34` covers `.env*` with `!.env.example`; `.claude/` is ignored at `:45`.
- **Checked and clear:** the eight `.swarm/*.md` and planning commits that match the webhook *string* contain only the word `REDACTED` or the bare pattern in a scan description — **no `.swarm` document leaks the real value.** That hygiene has held across every prior run.
- **The repo is public.** `gh api repos/MSS23/VGC-Team-Report` → `{"private": false, "visibility": "public", "pushed_at": "2026-10-24T09:00:44Z"}`. The blob in `5da513a` is therefore fetchable by anyone, today.
- **Exploit path (proven, unauthenticated, no guessing):** clone `github.com/MSS23/VGC-Team-Report`; `git log -p --all | grep -oE 'discord\.com/api/webhooks/[0-9]+/[A-Za-z0-9_-]+'`; `POST` to that URL. A Discord webhook URL *is* the credential — no auth, no rate limit that matters. Result: arbitrary messages into the private #builds channel, including `@everyone` and forged deploy/build notices indistinguishable from the real cron output (`src/lib/discord-webhook.ts` posts the genuine ones), plus `DELETE` on the webhook to silence all cron and deploy alerting permanently.
- **Severity: CRITICAL** on exposure (a live credential in a public repo), **HIGH** on impact (channel is internal; no customer data, no prod write access).
- **Fix — ~5 minutes, no code change, no deploy, no build minutes:** Discord → Server Settings → Integrations → Webhooks → delete the leaked webhook → create a new one → update `DISCORD_BUILDS_WEBHOOK` in Vercel env (and the swarm container env var). **Rotation alone fully closes this.** History rewriting (`git filter-repo`) is strictly secondary and not worth a force-push on a public repo once the token is dead.
- **This is the fourth consecutive run to rediscover it.** `f55725f` is literally titled *"swarm: P0 — live Discord webhook token in public git history"*; `1c82542`'s message notes *"never rotated — so it is still extractable from history. Three separate nightly runs have now rediscovered it."* **Do not re-file.** Nothing is blocking this except an operator clicking the button. Every further audit cycle spent re-confirming it is wasted.

### LOW — the regression guard for this exists but was never merged

`src/lib/security/__tests__/no-hardcoded-secrets.test.ts` was added in commit `1c82542` (*"test: fail the build if a real credential reaches the tracked tree"*). It is **not in the current tree and not on `origin/main`** — `git merge-base --is-ancestor 1c82542 HEAD` returns false, and `git ls-tree -r origin/main` has no match. The guard that would stop a repeat of VGC-305 is sitting on an unmerged branch. Worth cherry-picking: it is a test-only file, zero production risk, and it is the one durable fix here (rotation closes the current leak; this test closes the *next* one).

---

## 3. OWASP pass over `src/app/api/**` (59 handlers)

### Verification of the fixes CLAUDE.md's changelog claims — both genuinely in place, not re-reported

- **v5.26 header forgery — FIXED, verified.** `src/lib/security/input-validation.ts:75-103`. `getClientIp` prefers the platform-set `x-vercel-forwarded-for` / `x-real-ip`, then takes **only the right-most** `x-forwarded-for` entry (`parts[parts.length - 1]`, line 86) — it does not scan leftwards, which is the detail that matters, since scanning would let a caller reinstate the spoof by appending junk. The reasoning is documented in a 30-line comment at `:43-74`. This closes both documented consequences (rate-limit evasion via rotated identities, and `comment_flags` UNIQUE-dedupe evasion to force-delete comments). `src/app/api/comments/flag/route.ts:35-36` independently derives its flag identity from the Clerk `userId` and only falls back to `getClientIp`, so that path is double-covered.
- **v5.27 CORS — FIXED, verified.** `src/lib/security/cors.ts`. `Access-Control-Allow-Credentials` is **absent** from `getCorsHeaders` (deliberately, with a comment at `:53-58` explaining that no legitimate consumer needs it). The preview-origin regex at `:35-36` is anchored on the team-scope suffix — `^https://vgc-team-report-(?:[a-z0-9]+|git-[a-z0-9-]+)-mss23s-projects\.vercel\.app$` — so the attacker-registrable `vgc-team-report-evil.vercel.app` shape no longer matches. `Access-Control-Allow-Origin` is echoed only for an allowlisted origin, else empty string (`:47-50`). Both halves of the v5.27 fix hold.

### Clean areas (checked, nothing to report)

- **SQL injection: zero surface.** Every query in all 59 routes is a Neon tagged template with `${}` interpolations bound as parameters. No `sql(...)` call form, no `sql.unsafe`, no `.query(` with a built string, no concatenated SQL anywhere — a targeted sweep for all four patterns across `src/app/api` and `src/lib/db.ts` returned nothing. `src/app/api/explore/route.ts` is the hardest case (composed filters, dynamic sort, cursor pagination) and does it correctly: filters are **nested `sql`` ` fragments** (`:97-151`), the sort column is picked from a fixed pair of fragments (`:212`), and `limit` is clamped `Math.min(Math.max(…,1),50)` at `:24`. The free-text search builds its `to_tsquery` input by stripping non-word characters and appending `:*` (`:83`), so tsquery operator syntax cannot be injected. `src/app/api/cleanup/route.ts:33` uses `= ANY(${ids})` with a bound array.
- **SSRF: closed on all three candidates.**
  - `src/app/api/sprite/route.ts:40-45` — host allowlist (`play.pokemonshowdown.com` only) **plus** a `/sprites/` path prefix check, 3s abort.
  - `src/app/api/pokepaste/route.ts:13-23,50-55` — hostname pinned to `pokepast.es`/`www.pokepast.es`, and then, better still, the fetched URL is **reconstructed** from the literal `https://pokepast.es` + the validated pathname, so even a validator bypass could not redirect the request off-host.
  - `src/app/api/import/limitless/route.ts` → `src/lib/import/limitless.ts:10-17` — `normalizeLimitlessUrl` requires `protocol === "https:"`, `hostname === "limitlessvgc.com"`, **no port, no username, no password**, and a strict `^/teams/\d+/?$` path; the fetch uses `redirect: "error"` with an 8s timeout and a 2MB streamed body cap (`route.ts:6-23`). The second-hop tournament URL is re-normalised through the same function (`limitless.ts:42`) rather than trusted from the scraped page — exactly right.
- **Webhook authenticity: all four verified.** Clerk uses `verifyWebhook` (svix) at `webhooks/clerk/route.ts:38`; Linear uses HMAC-SHA256 over the raw body with a length check then `timingSafeEqual` (`webhooks/linear/route.ts:49-58`); PostHog uses `timingSafeEqual` (`:183`); Discord uses Ed25519 via `nacl.sign.detached.verify` (`discord/route.ts:85-92`). All fail closed on a missing secret.
- **Privileged / destructive endpoints: all secret-gated, timing-safe.** `setup` (`verifyBearer` ×2 with an explicit "no secret ⇒ 401" pre-check), `migrate` (`verifyBearer MIGRATE_SECRET`), `cleanup` (`verifyBearer` + `isCronAuthorized`), `bot` (`verifyBearer CRON_SECRET`), all four `cron/*` (`isCronAuthorized`). `src/lib/cron-auth.ts` and `src/lib/auth/verify-bearer.ts` both fail closed when the env var is unset and both use an equal-length check before `timingSafeEqual` — correct, since `timingSafeEqual` throws on length mismatch.
- **IDOR: consistently closed on every owner-scoped resource.** Spot-checked every route that reads or writes another user's data; the pattern is `AND owner_id = ${userId}` or `AND user_id = ${userId}` in the predicate itself (not a post-fetch check), with owner-OR-accepted-collaborator where collaboration applies. Confirmed clean: `user/collections/[id]:22` (ownership verified before items are fetched), `user/reports/[shareId]:42,59,86,132`, `user/drafts:51,70,127,171`, `user/saved:93`, `user/export:42,86,92`, `user/analytics:41,47`, `user/delete:22,78`, `changelog/[shareId]:27-38`, `share/[id]/collaborators:44`, `share/[id]/versions/[version]:42`, and `src/lib/collaboration-access.ts:10-13` (shared by both `collaboration/[id]` handlers, and it validates the id shape at `:6` before touching the DB). `share/route.ts:164-186` is the strongest one: it treats `edit_token` explicitly as *"an internal update nonce, not an authorization credential"* and requires owner-or-accepted-collaborator on top of it.
- **Anonymous comment deletion is not forgeable.** `comments/[shareId]/[commentId]/route.ts:63-69` authorizes a non-owner delete on the client-supplied `sessionId`, which looks alarming until you check the generator: `src/lib/utils/session-id.ts:7` is `crypto.randomUUID()`. 122 bits, and `comments/[shareId]/route.ts:34-38` deliberately never returns any comment's `session_id` to any caller (it computes `isOwn` server-side instead, with a comment explaining that the raw value *is* the credential). Correct as built.

---

### HIGH-1 — `/api/team-graphic` renders any report, ignoring visibility flags **and** creator redaction

- **Where:** `src/app/api/team-graphic/route.tsx:96`

  ```ts
  const rows = await sql`SELECT data FROM shares WHERE id = ${shareId} AND deleted_at IS NULL`;
  ```

  No `is_public` / `is_unlisted` predicate, and no redaction: `grep -n 'redact|is_public|is_unlisted|applyPrivate'` over the whole file returns **nothing**. The raw `data.paste` goes straight into `parseTeamForGraphic` at `:108`, which extracts `item` at `:27-29` and renders it.
- **This is the only non-owner-scoped read of `shares` in the entire API without a visibility predicate.** Every sibling gets it right: `share/[id]/route.ts:141-143` 404s when `!isPublic && !isUnlisted`, and `oembed/route.ts:23` filters `is_public = TRUE` in the query itself.
- **Exploit path A — redaction bypass (strongest: unauthenticated, no id guessing, PROVEN).** The tiered-publishing feature lets a creator mark `evs`/`ivs`/`nature`/`item` private; `share/[id]/route.ts:18-30,169` strips them via `applyPrivateFieldRedaction` and returns `_redactedFields` so the UI can show "Some fields hidden by creator". `team-graphic` parses the **unredacted** paste. So for any **public** report whose creator hid their items, `GET /api/team-graphic?id=<public-id>&style=wide` renders the hidden items into the PNG. **It is worse than a manual request:** `oembed/route.ts:41` publishes exactly that URL as `thumbnail_url`, so every Discord/Slack/Twitter unfurl of a `/s/{id}` link renders the creator's hidden items automatically, to everyone in the channel. In competitive VGC a concealed item choice before an event is the entire point of the privacy control — and the control silently does not work.
- **Exploit path B — private-report read (proven as a control bypass, narrower reach).** A report with `is_public = FALSE AND is_unlisted = FALSE` is 404'd by `/api/share/{id}` but still rendered here, leaking species, items, abilities, tera types, tournament name, placement, creator name and record. Share ids are 8 chars of `[A-Za-z0-9]` (~2.2 × 10^14), so blind enumeration is not the path; the realistic path is a **public→private flip** — the id was shared, bookmarked, cached or unfurled while public, and flipping it to private does not revoke `team-graphic`. Same for unlisted→private.
- **Not exploitable, but worth fixing while you are in the file:** `shareId` is used with no format validation here (no `IdSchema` regex, unlike `share/[id]/route.ts:32`). It is a bound parameter in the Neon template, so there is **no injection** — hygiene only.
- **Fix (~15 min + a vitest case):** add `AND is_public = TRUE` to `:96` (matching `oembed`), **and** run the paste through `applyPrivateFieldRedaction` before `parseTeamForGraphic`. If unlisted reports should keep working for link-unfurls, accept `is_unlisted` too — but the redaction call is the part that must not be skipped: adding only the visibility predicate leaves path A fully open, since path A targets *public* reports.
- `conflict_risk: false` — `src/app/api/team-graphic/route.tsx` is not on `.swarm/main-changed-files.md`.
- **Note:** this was reported as P1-2 on 19 Oct and is unchanged. It is the oldest unfixed code finding in this area.

### HIGH-2 — creator-profile takeover: `creator_profiles` is keyed on a user-editable display name, not a user id

- **Where:** `src/app/api/user/profile/route.ts:71-95` (write) and `src/app/api/creator/[name]/route.ts:66` (public read).
- The PUT handler derives the row key from Clerk profile fields the user controls:

  ```ts
  const creatorName = user.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user.username || "Unknown";
  ```

  and then writes `INSERT INTO creator_profiles (name, …) VALUES (${creatorName}, …) ON CONFLICT (name) DO UPDATE SET bio = …, twitter = …, discord = …, youtube = …, is_public = …, avatar_url = …` (`:83-95`). **There is no binding between the Clerk `user.id` and the `name` row.** `firstName`/`lastName`/`username` are freely editable by any signed-in user through Clerk's standard account UI.
- **Exploit path (concrete, authenticated, no special access):** attacker signs up, opens their Clerk account settings, sets First name = `Wolfe`, Last name = `Glick` (or whatever `creatorName` a target's public reports carry — these are enumerable from `/api/explore` and `/api/creator/[name]`), then `PUT /api/user/profile` with their own `bio`, `twitter`, `discord`, `youtube`, `avatarUrl`. `ON CONFLICT (name) DO UPDATE` **overwrites the victim's profile row in place.** `GET /api/creator/{name}` then serves the attacker's bio and social links on the victim's public creator page (`creator/[name]/route.ts:66` selects `bio, twitter, discord, youtube, is_public, avatar_url` by `LOWER(name)`), and that page shows a verified badge when the name is in `verified_creators` (`:65,69`) — so for a verified creator, the attacker's links render **under a verified badge**. That is a credible phishing primitive (attacker-controlled Discord/Twitter links presented as a known verified creator's).
- **A case-collision variant needs no conflict race at all.** The write binds `name = ${creatorName}` at the user's exact casing, while all three reads use `WHERE LOWER(name) = …`. The UNIQUE constraint is on `name`, so `wolfe glick` and `Wolfe Glick` are two rows that both satisfy the read. The read has **no `ORDER BY`** and takes `rows[0]` (`profile/route.ts:41,46`; `creator/[name]/route.ts:66`), so which profile the public page renders is left to Postgres' row order — non-deterministic poisoning, no conflict needed.
- **Related, same root cause (lower severity, same fix direction):** `state.creatorName` on `POST /api/share` is free text validated only as non-empty (`share/route.ts:55,141-148`) with no check against the authed user's identity, so anyone can publish a public report attributed to any creator name — and `creator/[name]/route.ts:46-61` will list it on that creator's page, under the verified badge if they are verified. Likewise `comments/[shareId]/route.ts:15,109` takes a free-text `displayName` (max 50) with no fallback to the Clerk name even when the commenter is signed in.
- **Severity: HIGH** (integrity + impersonation of identified third parties on a public site; no data loss, no privilege escalation into the DB).
- **Fix:** add a `user_id` column to `creator_profiles`, make it the conflict target, and reject a PUT whose `name` is already bound to a different `user_id`. Short of the migration: on PUT, look up the existing row by `LOWER(name)` and 409 unless the stored `user_id` matches (plus normalise `name` to lower case on write so the read is single-valued). For the attribution side, verify `state.creatorName` against the authed user's Clerk name on publish, or drop the verified badge for reports whose `owner_id` is not the verified creator's.
- `conflict_risk: false` — neither `src/app/api/user/profile/route.ts` nor `src/app/api/creator/[name]/route.ts` is on the main-changed list (the list contains `src/app/dashboard/profile/page.tsx`, a different file).

### MEDIUM-1 — `apiGuard`'s `maxBodySize` trusts `Content-Length` and is bypassable with chunked encoding

- **Where:** `src/lib/security/api-guard.ts:53-61`

  ```ts
  const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
  if (contentLength > maxBodySize) { return 413; }
  ```

  With `Transfer-Encoding: chunked` (or any request where the header is simply absent), `request.headers.get("content-length")` is `null`, `parseInt("0")` is `0`, and the check passes for a body of any size.
- **Four of six callers defend themselves; two do not.** `quick-share/route.ts:16`, `collaboration/[id]/route.ts:41`, `user/preferences/route.ts:33` and `user/push/route.ts:35` all re-check the **actual** `(await request.text()).length` after the guard — correct. **`share/route.ts:103` (`MAX_BODY_SIZE = 512_000`) and `user/drafts/route.ts:98` (512 KB) rely on the header alone** and go straight to `await request.json()`.
- **Exploit path:** an authenticated user POSTs to `/api/share` with chunked encoding and a body far above 500 KB. Vercel's own ~4.5 MB serverless body cap is the only remaining limit, so each write can be ~9× the intended ceiling, at 20 writes/min. Two consequences: (a) it is the delivery vehicle for the zod advisory above; (b) Neon is on the **512 MB free tier**, and oversized JSONB blobs landing in `shares` plus coalesced snapshots in `share_versions` is precisely the shape of the July 2026 incident that consumed 447 MB.
- **Severity: MEDIUM** — requires sign-in, rate-limited, bounded by the platform cap, but it defeats a control that is believed to be in force and it has a known-expensive blast radius on this database tier.
- **Fix:** in `apiGuard`, treat a missing/unparseable `Content-Length` as unknown rather than `0` and have the two unprotected callers re-check the real length after reading, exactly as the other four already do. The cheapest version is a shared `readBoundedJson(request, max)` helper so no future route can forget.
- `conflict_risk: false` — none of `api-guard.ts`, `share/route.ts`, `user/drafts/route.ts` is on the main-changed list.

### MEDIUM-2 — view counts are inflatable; `sessionId` is unvalidated client input

- **Where:** `src/app/api/views/[shareId]/route.ts:12,37-47`. `ViewBody` is `{ sessionId: z.string().min(1) }` — any non-empty string. Dedup is `cacheSetIfAbsent('view:{shareId}:{sessionId}', 600)`, so a **new** `sessionId` on each request is always a first view and always increments.
- **Exploit path:** `for i in $(seq 1 60); do curl -X POST /api/views/<public-id> -d "{\"sessionId\":\"$i\"}"; done` — 60 increments per minute per IP (the `views` rate limit is `max: 60`), each one a real `UPDATE shares SET view_count = view_count + 1`. From a handful of IPs this trivially manufactures a top-of-Explore report, since `explore/route.ts:200-209` sorts by `view_count`, and `spotlight` surfaces on the same signal.
- **Second-order cost:** each forged view is a row write on the 512 MB Neon free tier plus a PostHog `captureServerEvent` and an OTel log emit (`:52-60`), so this is also a write-amplification and billing vector, not only a vanity-metric one. **I could not check whether this is already happening** — PostHog credentials are absent from this container, so the `report_viewed` event volume could not be compared against distinct-IP counts. The code path is proven; actual abuse is unverified.
- **Also here:** `SHARE_ID_RE = /^[a-zA-Z0-9_-]{6,16}$/` (`:11`) is looser than the real 8-char `[A-Za-z0-9]` id format that `share/[id]/route.ts:32` enforces. Harmless (parameterised), but it widens the probe space for free.
- **Severity: MEDIUM** — integrity of a public ranking signal plus DB-write cost; no confidentiality impact.
- **Fix:** bind the dedup key to something the caller does not choose — `getClientIp(request)` (now trustworthy post-v5.26), or the Clerk `userId` when present — and keep `sessionId` only as a secondary dedup within that. Tighten the regex to `^[A-Za-z0-9]{8}$`.
- `conflict_risk: false`.

### LOW-1 — `/api/user/export` has no effective rate limit when Upstash is unconfigured

`src/app/api/user/export/route.ts:6-21` is the only authenticated route with **no `apiGuard` call at all**. Its "one export per 24 hours" limit is implemented purely as `cacheGet('export:{userId}')`, and `src/lib/cache.ts:29-42` returns `null` whenever `UPSTASH_REDIS_REST_URL`/`_TOKEN` are unset or Redis throws. In that state the limit silently vanishes and each call fans out **12 parallel queries at `LIMIT 1001` each**. Note the contrast with `cacheSetIfAbsent` (`cache.ts:68`+), which documents its unconfigured behaviour deliberately — `cacheGet` has no such contract, so using it *as* a rate limiter is a fail-open. Fix: add `apiGuard` with a low `max` as a floor that does not depend on Redis being up.

### LOW-2 — `/api/sprite` is an unauthenticated, unmetered open proxy (bandwidth only)

`src/proxy.ts:27-29` early-returns for `/api/sprite` (and the matcher at `:157` excludes it), so it runs with **no Clerk, no bot detection, no CORS, no CSRF** — and the route itself calls **no `apiGuard`**, so no rate limit either. The SSRF surface is genuinely closed (host + path allowlist, `sprite/route.ts:40-45`), and responses are edge-cached `immutable` for a year with `Access-Control-Allow-Origin: *`, so the honest cost is bandwidth amplification against Showdown's CDN on cache-cold paths, absorbed by Vercel's CDN after the first hit per sprite. The exemption is a deliberate, documented cost trade-off and I would leave it; flagging only so the reasoning is on the record, and because the `*` CORS header means third-party sites can hotlink this as their own sprite CDN. If it ever shows up in bandwidth usage, an `apiGuard` with a high `max` is the cheap mitigation. `conflict_risk: true` for any change in this area — `src/lib/utils/sprite-url.ts` and `src/lib/utils/__tests__/sprite-url.test.ts` are both on the main-changed list.

### LOW-3 — signature-verified webhooks have no pre-verification rate limit

`webhooks/clerk`, `webhooks/linear`, `webhooks/posthog` and `discord` all call no `apiGuard`, and `proxy.ts:33,90` exempts them from bot detection and the origin check (correctly — they are server-to-server). Authenticity is sound in every case, but an unauthenticated flood still forces an HMAC/Ed25519 verification per request, and `/api/discord` bypasses middleware entirely. Low impact (cheap crypto, Vercel absorbs the invocations) — noting it for completeness rather than recommending a change.

### LOW-4 — Clerk user enumeration for any signed-in account

`src/app/api/user/search/route.ts:23-34` proxies `clerkClient().users.getUserList({ query: q, limit: 8 })` to any authenticated caller, returning `id`, display name and `imageUrl`. Intended for collaborator invites and bounded to 8 results at 20 req/min, but with a 2-character minimum (`:19`) it enumerates the user directory given patience. Acceptable for the feature; worth knowing it exists. Note it also returns the raw Clerk `id`, which is more than the invite UI needs.

### Informational — observations, not findings

- **`avatarUrl` is only prefix-validated** (`user/profile/route.ts:21-24`: `v.startsWith("https://")`), so any HTTPS host can be stored. It is **not** currently exploitable for SSRF or tracking-pixel abuse, because `next.config.ts` restricts `img-src` to `'self' data: blob:` plus Showdown, Clerk, `raw.githubusercontent.com` and Vercel — an arbitrary host is CSP-blocked at render. The CSP is doing load-bearing work here; if it is ever relaxed, this becomes a live finding. Worth an allowlist on write so the two controls are not coupled.
- **CSRF is origin-conditional by design** (`proxy.ts:103-116`: enforced only when an `Origin` header is present *and* not allowlisted). Correct for a browser threat model — a same-origin `fetch` sends no `Origin`, and a cross-origin attacker page always does. Non-browser clients can omit `Origin` and skip both the origin block and CSRF, which is expected: CORS is not an authorization mechanism, and every sensitive route independently checks Clerk auth or a bearer secret. Not a finding.
- **`/api/setup` is exempt from both the origin check and CSRF** (`proxy.ts:90`). Safe as built, because the handler requires `verifyBearer` against `MIGRATE_SECRET`/`CRON_SECRET` and fails closed with no secret set. Flagging only because a route-specific middleware exemption is the kind of thing that outlives the reason for it — the same lesson the removed `/api/builder/` exemption comment at `proxy.ts:86-89` already records.
- **`/api/sync` is CSRF-exempt** (`proxy.ts:103`). Harmless today: `sync/[id]/route.ts` exports **`GET` only**, and `validateCsrf` is a no-op for GET regardless. It would become load-bearing the moment a write method is added to that route.
- **`isPreviewDeploy = host.includes('vercel.app')`** (`proxy.ts:62`) skips the canonical-host redirect for any host containing that substring, including e.g. `vercel.app.attacker.com`. No security consequence — it only decides whether to 301, and the CORS allowlist is independent and correctly anchored — but `endsWith` would be more accurate.

---

## Summary table

| # | Severity | Finding | File:line | Proven? | conflict_risk |
|---|---|---|---|---|---|
| P0 | **CRITICAL** | Discord webhook token live in public git history, unrotated (VGC-305) | `src/app/api/feedback/route.ts:10` @ `5da513a` | **Proven** | false |
| 1 | **HIGH** | `team-graphic` ignores visibility flags + creator redaction | `src/app/api/team-graphic/route.tsx:96` | **Proven** | false |
| 2 | **HIGH** | Creator-profile takeover via editable Clerk display name | `src/app/api/user/profile/route.ts:71-95` | **Proven** | false |
| 3 | **HIGH (dep)** | `zod@4.3.6` memory exhaustion, production-reachable | `package.json`; `src/app/api/share/route.ts:18-21` | Advisory + reachable path | **true** |
| 4 | MEDIUM | `maxBodySize` trusts `Content-Length`; chunked bypass | `src/lib/security/api-guard.ts:53-61` | **Proven** | false |
| 5 | MEDIUM | View counts inflatable via client-chosen `sessionId` | `src/app/api/views/[shareId]/route.ts:12,37` | Proven in code; abuse unverified (no PostHog) | false |
| 6 | LOW | `user/export` rate limit fails open without Upstash | `src/app/api/user/export/route.ts:13-21` | Proven | false |
| 7 | LOW | `/api/sprite` unauthenticated + unmetered (bandwidth) | `src/proxy.ts:27`; `src/app/api/sprite/route.ts` | Proven | **true** |
| 8 | LOW | Webhooks have no pre-verification rate limit | `src/app/api/webhooks/*` | Proven | false |
| 9 | LOW | Clerk user enumeration for signed-in callers | `src/app/api/user/search/route.ts:23` | Proven | false |
| 10 | LOW | Secrets regression-guard test never merged to main | `1c82542` (absent from tree) | Proven | false |

**Act in this order:** rotate the webhook (5 min, no deploy, closes a CRITICAL) → `team-graphic` visibility + redaction (15 min + test) → zod bump with `.max()` caps → `creator_profiles` keyed on `user_id`.

**Verified-as-fixed, do not re-report:** v5.26 header forgery (`input-validation.ts:75-103`), v5.27 CORS credentials + preview-origin anchoring (`cors.ts:35-60`), `comment_flags` identity derivation (`comments/flag/route.ts:35-36`), the `/api/builder/` middleware exemption removal (`proxy.ts:86-89`), `creator/[name]` ILIKE-pattern bug (`creator/[name]/route.ts:44-49`), SQL injection (zero surface), SSRF on all three fetch routes.

**Caveat restated:** PostHog credentials are absent from this container. No finding above was corroborated against production exception or event data, and MEDIUM-2 in particular is a proven code path with unverified real-world abuse.
