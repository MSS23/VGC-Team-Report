# C4 Security Audit — 29 June 2026

Scope: `npm audit`, hardcoded-secret grep across `src/**`, OWASP review of new/changed `src/app/api/**/route.ts` since `c4-security-22-05-26.md`, middleware consistency, SSRF/SQLi/SSRF/open-redirect coverage. Read-only; no code modified.

## Headline

- **No hardcoded secrets in `src/**`.** Every secret reference goes through `process.env.*`. Hex search caught only the Discord **public** key (which is safe to embed — Ed25519 verification key). One advisory note about this below.
- **All prior P1/P2 findings (P1-B, P1-C, P2-A, P2-B, P2-D) are fixed.** `verifyBearer` helper at `src/lib/auth/verify-bearer.ts:15-27` is now used in `/api/migrate`, `/api/cleanup` DELETE, `/api/setup`, `/api/bot`. `daily-ops` + `weekly-report` GraphQL queries now use bound `$teamId` variables. Nice work.
- **npm audit: 0 critical / 6 high / 23 moderate / 1 low (30 total).** Highs are: js-cookie (still — same Clerk dep chain), protobufjs (DoS via Any expansion, OTel transitive), tmp (path traversal, OTel transitive), vite (Windows path traversal, dev-only). All transitive — no direct fix without semver-major bumps on OTel/Sentry/Clerk.
- **Changed-files review (per `.swarm/main-changed-files.md`):** `/api/share` and `/api/share/[id]` were touched; both are tight (zod schemas with regex on IDs/keys, auth required for writes, ownership enforced on visibility change, parameterized Neon queries, `apiGuard` rate-limit + body-size). `/api/user/drafts` and `/api/user/reports/[shareId]` similarly clean. No new regressions introduced in this wave.

---

## P0 — Critical

_None._

## P1 — High

_None new._ Prior P1-A (Clerk → js-cookie chain) **still unresolved** — a major Clerk bump remains the only fix path. Track as a follow-up Linear ticket; do not rush tonight.

### P1-A (still open, carry-forward): protobufjs DoS via Any expansion (GHSA-wcpc-wj8m-hjx6)
- **What:** `protobufjs <=7.6.0` reachable transitively through OTel (`@opentelemetry/otlp-transformer` → `protobufjs`). DoS via unbounded Any expansion during JSON conversion (CVSS 7.5).
- **Why it matters:** OTel runs in our PostHog log path. Exploitable only if an attacker can make us decode attacker-controlled protobuf JSON — unlikely in our usage, but the advisory is High and `fixAvailable: true` (non-semver-major).
- **Remediation:** `npm update protobufjs` should resolve. Verify the OTel chain still imports the patched version after the update — there's a nested copy under `node_modules/@opentelemetry/.../node_modules/`.

## P2 — Medium

### P2-A: `/api/user/reports/[shareId]` PATCH/DELETE — no zod validation on `shareId` path param
- **File:** `src/app/api/user/reports/[shareId]/route.ts:29, 103`
- **What:** `const { shareId } = await params;` is fed directly into `UPDATE shares ... WHERE id = ${shareId}` with no shape check. Neon parameterizes the value, so this isn't SQLi — but a request to `/api/user/reports/<10MB-string>` walks a giant query plan and returns 404 only after the DB query.
- **Why it matters:** Mostly a defense-in-depth / 404-quality issue. Cheap fix: import the existing `IdSchema = z.string().regex(/^[A-Za-z0-9]{8}$/)` from `share/[id]/route.ts:32` and `safeParse` before the DB call.
- **Remediation:** ~3 lines per handler. Same fix applies to `views/[shareId]/route.ts:11` (which uses a different regex `^[a-zA-Z0-9_-]{6,16}$`, inconsistent with the canonical `^[A-Za-z0-9]{8}$`) — pick one.

### P2-B: Inconsistent share-ID regex across routes
- **Files:**
  - `share/[id]/route.ts:32` — `^[A-Za-z0-9]{8}$` (canonical)
  - `sync/[id]/route.ts:6` — `^[A-Za-z0-9]{8}$` (matches)
  - `share/[id]/versions/route.ts:7` — `^[A-Za-z0-9]{8}$` (matches)
  - `share/[id]/fork/route.ts:9` — `^[A-Za-z0-9]{8}$` (matches)
  - `views/[shareId]/route.ts:11` — `^[a-zA-Z0-9_-]{6,16}$` (**differs** — allows hyphens, underscores, 6–16 char length)
  - `oembed/route.ts:15` — `/\/s\/([A-Za-z0-9]{6,12})/` (**differs** — 6–12 char length, no hyphens)
- **Why it matters:** Drift, not a vulnerability. All IDs are generated via `generateId()` (8 chars from `[A-Za-z0-9]`). The `views` regex would accept hyphens/underscores that the generator never produces and could theoretically match a SQL or filesystem-meaningful token — Neon parameterizes so no exploit, but it's a maintenance trap.
- **Remediation:** Factor a single `IdSchema` in `src/lib/validation/share-id.ts` and import everywhere. Same `verifyBearer` consolidation that worked for cron auth.

### P2-C: `/api/creator/[name]` — no length cap, ILIKE wildcards passable as-is
- **File:** `src/app/api/creator/[name]/route.ts:11-12, 22, 29`
- **What:** `creatorName` is `decodeURIComponent(name)` with no length cap and no ILIKE-wildcard escaping. A request to `/api/creator/%25` (`%` URL-encoded) makes `ILIKE '%'` match every row. The handler then runs three more lookups + a UNION over `shares ⋈ collaborators` per match.
- **Why it matters:** Already behind `apiGuard({ rateLimit: { key: "creator", max: 30 } })`, so 30 req/min/IP cap absorbs casual abuse. But a single request with `%` could return the entire public-creators set as a fishing tool. Not a data-exposure escalation (everything returned is already public) — a DoS / scrape-amplification vector.
- **Remediation:** (1) cap `creatorName.length ≤ 100`, (2) reject if it contains literal `%` or `_` before the query, (3) consider switching to `=` for exact match (the ILIKE was presumably for case-insensitivity — Postgres `LOWER(x) = LOWER(y)` would be safer).

### P2-D: `/api/explore` — same ILIKE wildcard passthrough on `q` search param
- **File:** `src/app/api/explore/route.ts:72, 99-102, 110, 114`
- **What:** `searchPattern = ` `%${q}%`` with no `%`/`_` escape. For `q.length < 3` the route falls back to ILIKE (line 98); for ≥3 it uses tsquery (line 76 strips non-word chars, so that path is safe).
- **Why it matters:** Same class as P2-C. Capped at rate-limit + 2-char `q`. A single `%%` (URL-encoded) request scans every public share — but the path is rate-limited and the data returned is already public.
- **Remediation:** Either reject `%`/`_` in short queries, or escape them with backslash before forming the LIKE pattern.

## P3 — Low / Informational

### P3-A: Discord `DISCORD_PUBLIC_KEY` is hardcoded
- **File:** `src/app/api/discord/route.ts:6`
- **What:** Ed25519 public key embedded as `const DISCORD_PUBLIC_KEY = "44b2cb...".`. Public keys are by design publishable — this is **not** a secret leak.
- **Why it matters:** Only relevant if we ever rotate Discord apps; right now it ties code changes to a Discord-side rotation. Best practice: read from `process.env.DISCORD_PUBLIC_KEY`. Low priority.

### P3-B: Anonymous comment-delete relies on `sessionId` opacity
- **File:** `src/app/api/comments/[shareId]/[commentId]/route.ts:42-48`
- **What:** Comment authors prove ownership with the same `sessionId` they used to post. The sessionId is a free-form client string (presumably localStorage). Anyone who learns a victim's sessionId can delete their comments.
- **Why it matters:** This is intentional (anonymous comments are the design — see P2-C in the prior report) and the blast radius is small (delete one user's comments). No fix unless we lock comments behind Clerk auth.

### P3-C: `/api/sync/[id]` keeps lambda warm via module-scope `setInterval`
- **File:** `src/app/api/sync/[id]/route.ts:35-41`
- **What:** Top-level `setInterval(..., 60_000)` runs the presence-cleanup pass every minute, preventing Vercel scale-to-zero (same anti-pattern that was fixed in `views`).
- **Why it matters:** Cost, not security. Worth flagging to C3 (perf) so it doesn't quietly chew billable Lambda time. The in-memory presence map is also per-instance — multi-lambda presence counts are already wrong, so the interval isn't actually doing anything useful in production.

### P3-D: `feedback` `contact` field flows to Discord embed unescaped
- **File:** `src/app/api/feedback/route.ts:57` — `fields.push({ name: "Contact", value: data.contact, inline: true })`
- **What:** `data.contact` is zod-validated to ≤200 chars but not HTML/markdown-escaped before going to Discord. Discord renders markdown — a malicious submitter could put `[click](https://evil.example)` in their contact and the embed renders a clickable link.
- **Why it matters:** Low. Discord's embed renderer is sandboxed, no XSS into our origin. The field reaches Discord-staff eyes only. Worth a markdown-escape pass on user-provided embed fields as defense-in-depth.

### P3-E: Other moderate npm advisories — bundle into next `npm update`
- `js-yaml <=4.1.1` (GHSA-h67p-54hq-rp68, ReDoS via merge keys, transitive)
- `qs 6.11.1–6.15.1` (GHSA-q8mj-m7cp-5q26, DoS, dev-only via cypress)
- `uuid <11.1.1` (GHSA-w5hq-g745-h8pq, bounds check, dev-only)
- `postcss <8.5.10` (GHSA-qx2v-qp2m-jg93, XSS in stringify output, transitive via next)
- `@babel/core <=7.29.0` (GHSA-4x5r-pxfx-6jf8, low-severity arbitrary file read in sourceMappingURL handling)
- All have `fixAvailable: true`. Most fix without breaking changes.

---

## What's Changed Since Last Audit (delta only)

- ✅ `verifyBearer` helper added — `migrate`, `cleanup` DELETE, `setup`, `bot` all migrated. Last audit's P1-B, P1-C, P2-A, P2-B all resolved.
- ✅ `daily-ops` + `weekly-report` GraphQL queries now use `$teamId` variable binding. Last audit's P2-D resolved.
- ⚠️ Clerk → js-cookie chain still High (P1-A from last audit, still open).
- ⚠️ New OTel-chain protobufjs High advisory (this audit's P1-A).

## Webhook / Cron Signature Coverage Matrix (delta)

No regressions vs last audit. All bearer routes now use `verifyBearer` / `isCronAuthorized` (both `timingSafeEqual`).

## Recommended Tonight (small, contained, low risk)

1. **P2-A** — Add `IdSchema.safeParse(shareId)` to `/api/user/reports/[shareId]` PATCH + DELETE before the DB call. ~6 lines.
2. **P2-C + P2-D** — Cap `creatorName` length to 100 and reject `%`/`_` in `creator/[name]` + short-q `explore` ILIKE branches. ~8 lines net across two files.
3. **P3-A** — Move `DISCORD_PUBLIC_KEY` to env. ~2 lines.

Defer:
- **P2-B** ID-regex consolidation — touches 6 files, low ROI, schedule alongside any other shared-validation refactor.
- **P1-A (carry-forward Clerk bump)** — still needs scheduled major upgrade with smoke testing.
- **New P1-A (protobufjs)** — try `npm update protobufjs` first; if the nested OTel copy doesn't pick it up, defer to the OTel semver-major bump alongside Sentry.

## Out of Scope / Confirmed Clean

- Hardcoded-secret grep across `src/**`: clean (only env-var references + the safe-to-embed Ed25519 public key).
- SQLi: all `sql\`…\`` interpolations bind parameters. No raw concatenation, no `sql.unsafe()`. ILIKE wildcard escaping is a feature gap (P2-C, P2-D), not an injection.
- SSRF: only `/api/sprite` (host+path allowlist) and `/api/pokepaste` (host allowlist) take user URLs. Both checked.
- Open redirect: no `redirect()` calls take user input in `src/app/api/**`.
