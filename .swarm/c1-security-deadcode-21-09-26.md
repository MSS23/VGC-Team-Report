# C1 — Consolidated Security / Dead-Code / TypeScript Audit

**Date:** 2026-09-21
**Scope:** `/home/user/VGC-Team-Report` — read-only. No tracked file modified, nothing committed or pushed.
**Baseline:** `npm run typecheck` and `npm run build` pass.

Already-filed and deliberately **not** re-reported: VGC-248, VGC-221, VGC-261, VGC-273, VGC-264, VGC-224.

---

## Summary

| Severity | Count |
|---|---|
| P0 | 0 |
| P1 | 3 (2 authz, 1 dependency) |
| P2 | 4 |
| P3 | 6 |

No hardcoded secrets exist in tracked source. No webhook signing-secret literal — the P0 that was specifically hunted for is **absent**. Every webhook verifies signatures, every SSRF-capable fetch is host-allowlisted, and every SQL statement is parameterised through Neon tagged templates. TypeScript hygiene is genuinely strong (zero `any` in production code).

The two authz findings are both **confirmed** and both are places where a single route diverges from a guarantee the rest of the codebase enforces correctly.

---

# P1 findings

## P1-1 — `/api/team-graphic` renders private reports to anyone (IDOR)

**File:** `src/app/api/team-graphic/route.tsx:96` (line number as of `HEAD`)
**Status:** Confirmed against `HEAD` — **and already remediated in the working tree while this audit was running.**

> **Concurrent fix, 2026-09-21.** A parallel agent landed an uncommitted fix to this exact route under **VGC-246**, plus a new regression test at `src/lib/security/__tests__/team-graphic-visibility.test.ts` (both untracked/unstaged at the time of writing). The fix adds the `is_public`/`is_unlisted` gate *and* applies `normalizePrivateFields` + `redactPasteFields`, which is precisely the remedy recommended below — including the tiered-publishing sub-finding. **No further work is needed on P1-1 beyond verifying that change through the normal gate and committing it.** The analysis below is retained as the rationale for that fix, since the diff was not yet committed and could otherwise be lost.

```ts
const rows = await sql`SELECT data FROM shares WHERE id = ${shareId} AND deleted_at IS NULL`;
```

This is the **only** share-reading route in the codebase with no `is_public = TRUE` filter and no auth check. Every sibling has one:

- `src/app/api/oembed/route.ts:23` — `AND is_public = TRUE`
- `src/app/api/views/[shareId]/route.ts:40,45` — `AND is_public = TRUE`
- `src/app/api/spotlight/route.ts:30`, `src/app/api/creator/[name]/route.ts:49,56`, `src/app/api/explore/route.ts:189,203,218` — all filtered.

And `src/app/api/share/[id]/route.ts:200-202` states the guarantee explicitly:

```ts
// Enforce real privacy (VGC: "Private = Only accessible to you"). ...
// a report that is neither public nor unlisted must not be viewable via the
// bare /s/{id} link — return 404.
if (!isPublic && !isUnlisted) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```

`/api/team-graphic` bypasses that check entirely. The route is unauthenticated (`apiGuard` at line 84 applies rate limiting only) and renders, as a PNG: `tournamentName`, `placement`, `creatorName`, `record`, plus per-Pokémon `species`, `item`, `ability`, `teraType` (`parseTeamForGraphic`, lines 18-51).

**Failure scenario:** A user marks a tournament team Private before their event; anyone who has the 8-character share id (from an earlier public state, a browser-history leak, or a link shared then revoked) fetches `GET /api/team-graphic?id=<id>` unauthenticated and receives a rendered image of the full team — species, items, abilities and Tera types — despite the UI promising "Only accessible to you".

**Secondary leak, same line:** the route never calls `applyPrivateFieldRedaction`. `src/lib/sharing/redact-paste.ts:21` defines `PrivateField = "evs" | "ivs" | "nature" | "item"`, and `src/app/api/share/[id]/route.ts:228` redacts those for non-owners under tiered publishing (VGC-142). `team-graphic` renders `item` straight from the raw paste, so a creator who hid their items on a *public* report still has them exposed through the graphic endpoint.

**Minimal fix:** add the visibility filter to line 96 and apply the existing redaction helper to the paste before `parseTeamForGraphic`:

```ts
const rows = await sql`
  SELECT data FROM shares
  WHERE id = ${shareId} AND (is_public = TRUE OR is_unlisted = TRUE) AND deleted_at IS NULL
`;
```

then run `data` through the same `applyPrivateFieldRedaction` used by `share/[id]`. (Unlisted must stay readable — OG/thumbnail unfurls for unlisted links depend on it, and `share/[id]` already treats unlisted as link-viewable.)

**Regression test:** a private share must yield 404 from `/api/team-graphic`; a public share with `privateFields: ["item"]` must render no item text.

---

## P1-2 — Creator profiles are keyed by display name, so any user can overwrite another creator's profile

**Files:** `src/app/api/user/profile/route.ts:71-89`, schema at `src/lib/db.ts:74-75`, collateral at `src/app/api/user/delete/route.ts:81`
**Status:** Confirmed.

`creator_profiles` has no `user_id` column at all:

```
src/lib/db.ts:74  CREATE TABLE IF NOT EXISTS creator_profiles (
src/lib/db.ts:75    name TEXT PRIMARY KEY,
```

The PUT handler derives the row key purely from the caller's Clerk display name (`src/app/api/user/profile/route.ts:71-73`, identical logic at 36-38):

```ts
const creatorName = user.firstName
  ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
  : user.username || "Unknown";
```

and then upserts on that name (lines 84-89):

```ts
INSERT INTO creator_profiles (name, bio, twitter, discord, youtube, is_public, accent_theme, avatar_url, updated_at)
VALUES (${creatorName}, ...)
ON CONFLICT (name) DO UPDATE SET bio = ..., twitter = ..., ...
```

There is no check that the caller owns the name. Clerk lets a user set their own first/last name freely.

**Failure scenario:** An attacker changes their Clerk profile name to a well-known creator's name (whose reports appear on `/creator/<name>`), calls `PUT /api/user/profile`, and the `ON CONFLICT (name) DO UPDATE` overwrites that creator's public bio, Twitter/Discord/YouTube links and `avatarUrl` — all rendered on the victim's public creator page by `src/app/api/creator/[name]/route.ts:66`. Redirecting the victim's social links to attacker-controlled accounts is a working impersonation/phishing primitive against that creator's audience.

Three amplifications of the same root cause:
- **Read:** `GET /api/user/profile` (line 41) returns whatever row matches the attacker's chosen name, disclosing a victim profile whose `is_public` is `false`.
- **Visibility flip:** the attacker can set the victim's `is_public` to `false`, which makes `/creator/<name>` return `{ isPrivate: true, reports: [] }` (`creator/[name]/route.ts:73-77`) — a denial of the victim's public presence.
- **Delete:** `src/app/api/user/delete/route.ts:81` runs `DELETE FROM creator_profiles WHERE LOWER(name) = LOWER(${creatorName})`, so an attacker who adopts the name and then deletes their own account destroys the victim's profile row.

Note the `"Unknown"` fallback on line 73: every signed-in user with neither a first name nor a username collapses onto a single shared `"Unknown"` row today, which is the same bug showing up benignly.

**Minimal fix:** add an owner column and key on it rather than on the display name —
`ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS user_id TEXT UNIQUE;`, upsert with `ON CONFLICT (user_id)`, and resolve `/creator/[name]` reads by joining through `user_id`. If a schema change is too large for one pass, the interim mitigation is to refuse the write when the target row exists with a different `user_id`, which requires the column anyway — so the column is the minimal fix.

---

## P1-3 — `next@16.3.0`: critical RCE advisories, non-breaking patch available

**File:** `package.json:26` (`"next": "^16.3.0"`), installed 16.3.0
**Status:** Confirmed vulnerable version; exploitability in *this* deployment is low (reasoning below).

`npm audit` reports `next` as the single **critical** entry, and it is not covered by VGC-248 (12 moderate vulns needing breaking upgrades) or VGC-221 (Clerk/js-cookie):

| Advisory | CVSS | Affected |
|---|---|---|
| GHSA-p293-qw3h-jr36 — Unauthenticated RCE on **Windows-hosted** servers | 9.0 | `>=16.0.0 <16.3.3` |
| GHSA-2xp9-vwfh-vxw4 — Unauthenticated RCE in **Image Optimization API** when AVIF files are used | — | `>=16.0.0 <16.3.3` |

`fixAvailable: true` and **not** semver-major — `16.3.0 → 16.3.3` is a patch bump.

**Exploitability here:** the Windows advisory does not apply (Vercel serves Linux). For the AVIF advisory, `next.config.ts:33` sets `remotePatterns: []`, there is **no `next/image` usage anywhere in `src`**, and `public/` contains only static first-party app assets (icons, `og-default.png`, svgs) — no user-uploaded image path reaches the optimizer. So the practical risk is bounded. It is listed at P1 rather than P0 for that reason, and because the remedy is a one-line patch upgrade rather than a migration.

**Failure scenario:** anyone who later adds a `remotePatterns` entry or a user-avatar upload path re-opens an unauthenticated RCE that a patch bump would already have closed.

**Minimal fix:** `npm install next@16.3.3` (patch range, no code change expected), then the standard gate: `npm run typecheck`, `vitest run`, `next build`.

---

# P2 findings

## P2-1 — Three **high**-severity advisories in the build/dev toolchain, all non-breaking

**File:** `package-lock.json` (transitive)
**Status:** Confirmed via `npm audit --json`.

| Package | Advisory | CVSS | Fix |
|---|---|---|---|
| `js-yaml` 4.0.0–4.3.1 | GHSA-2883-xcg3-v3hh — `maxTotalMergeKeys` does not bound CPU | 7.5 | non-breaking |
| `browserslist` ≤4.28.6 | GHSA-c83g-rgw3-j3cx (unbounded cache growth → OOM), GHSA-73wf-gq98-2v4g (prototype write via untrusted `browserslist-stats.json`) | 7.5 | non-breaking |
| `sharp` <0.35.4 | GHSA-rgj7-g3m4-5g8c — libheif vulns | — | non-breaking |

All three are reachable only from the build toolchain, and all three report `fixAvailable: true` with no major bump — distinct from VGC-248's 12 moderate vulns which *do* need breaking upgrades.

**Failure scenario:** a malicious or malformed YAML/stats file in a future dependency hangs or OOMs a Vercel build, burning Pro-plan build minutes on a job that never completes.

**Minimal fix:** `npm audit fix` (non-`--force`) resolves this set. Verify the lockfile diff touches only these transitive entries, then run the full gate. *(Not run here — audit-fix is out of scope for this read-only pass.)*

## P2-2 — CSRF token comparison is not constant-time

**File:** `src/lib/security/csrf.ts:44`
**Status:** Confirmed.

```ts
return cookieToken === headerToken;
```

Every other secret comparison in the repo uses `timingSafeEqual` (`src/lib/cron-auth.ts:17`, `src/lib/auth/verify-bearer.ts:26`, `src/app/api/webhooks/linear/route.ts:56`, `src/app/api/webhooks/posthog/route.ts:183`). This one is the outlier.

**Failure scenario:** low real risk — the token is a double-submit value the client already holds, `validateCsrf` only fires for true cross-origin requests (`src/proxy.ts:107-108`), and the length check on line 42 bounds the oracle. Flagged for consistency with the codebase's own standard.

**Minimal fix:** compare with `crypto.timingSafeEqual` over equal-length buffers, mirroring `verify-bearer.ts:23-26`.

## P2-3 — `creator_profiles` upsert key is case-sensitive but every read is case-insensitive

**Files:** `src/app/api/user/profile/route.ts:41` vs `:84-86`
**Status:** Confirmed (correctness bug; shares a root cause with P1-2).

Reads use `WHERE LOWER(name) = ${creatorName.toLowerCase()}` (also `creator/[name]/route.ts:66`, `user/analytics/route.ts:91`), but the write conflicts on the **exact** `name` primary key. `"john smith"` and `"John Smith"` therefore create two distinct rows, and the read returns whichever Postgres yields first — non-deterministic.

**Failure scenario:** a user changes the capitalisation of their Clerk name, saves their bio, and their public creator page keeps showing the stale profile from the old-cased row.

**Minimal fix:** folded into the P1-2 remedy — key on `user_id`. Standalone alternative: a unique index on `LOWER(name)` with `ON CONFLICT (LOWER(name))`.

## P2-4 — `/api/sprite` bypasses all middleware and sets a wildcard CORS header

**Files:** `src/proxy.ts:27-29`, `src/app/api/sprite/route.ts:72`
**Status:** Confirmed; deliberate, documented, and correctly bounded — recorded so the trade-off stays visible.

The route is excluded from Clerk, bot detection, CORS and CSRF for edge-invocation cost reasons, and returns `Access-Control-Allow-Origin: *`. This is safe as written because SSRF is closed by the host **and** path allowlist (`ALLOWED_HOSTS` line 5, `/sprites/` prefix check line 43) and the response body is a public third-party image. The exposure is that the endpoint carries no rate limit at all, so it can be used as an open image proxy for `play.pokemonshowdown.com`.

**Failure scenario:** a third party embeds `<img src="https://pokemonvgcteamreport.com/api/sprite?u=...">` across a high-traffic site and bills the cache misses to this project's Vercel account.

**Minimal fix:** none required for security. If cost becomes a concern, key a coarse `isRateLimitedAsync` bucket on `getClientIp` inside the route (middleware cannot be used without losing the invocation saving the exclusion exists to provide).

---

# P3 findings

## P3-1 — `asPokemonTypes` is dead code (only genuinely unreferenced export in `src/`)

**File:** `src/lib/data/dex-subset.ts:221`
**Status:** Confirmed — `git grep -w asPokemonTypes` over `src`, `cypress`, `scripts` returns only the declaration itself. Previously noted in `.swarm/c1-dead-code-10-08-26.md`, still present.
**Minimal fix:** delete the 4-line function. Piggyback on the next real push.

## P3-2 — Nine symbols are exported but used only inside their own file

**Status:** Confirmed by per-symbol grep.

| Symbol | File:line | Sole internal use |
|---|---|---|
| `REPORT_TEMPLATES` | `src/lib/templates.ts:13` | `:61` |
| `TYPE_CHART` | `src/lib/data/type-chart.ts:6` | `:180` |
| `migrateCalcEntries` | `src/lib/utils/normalize-report.ts:10` | `:103` |
| `replaceSpeciesInBlock` | `src/lib/utils/paste-edit.ts:59` | `:97` |
| `flushServerEvents` | `src/lib/posthog-server.ts:56` | `:44` |
| `WALKTHROUGH_STEPS` | `src/hooks/useWalkthrough.ts:16` | `:189` |
| `evictStoredDraft` | `src/hooks/useTeamReport.ts:31` | `:67`, `:166` |
| `generateCsrfToken` | `src/lib/security/csrf.ts:17` | `:49` |
| `SerializedGamePlanSchema` / `SerializedMatchupPlanSchema` | `src/lib/sharing/url-codec.schemas.ts` | composed locally |

Not dead code — dropping the `export` keyword narrows the public surface and lets the compiler catch future orphaning.

## P3-3 — ~34 type-only exports with no external consumer

Interfaces and type aliases exported but never imported elsewhere, e.g. `PdfExportProps` (`src/components/ui/PdfExport.tsx`), `HowToStep`/`SportsEventData`/`BreadcrumbItem`/`FAQItem` (`src/components/seo/JsonLd.tsx`), `MoveData`/`MoveCategory`/`MoveFlag` (`src/lib/data/moves.ts`), `NatureData`, `AccentTheme`, `NotificationType`, `LegalitySeverity`, `PrivateField`, `ChronologicalCursor`, `SpeedTierForm`, `ImportSource`, `GlobalFieldKey`, `SyncStatus`, `DamageCalcsMap`, `FilterState`, `GamePlanSlots`, `DraftSaveResult`, `ViewMode`. Zero runtime cost; cosmetic only. Low priority, and several are plausibly intended as public API for the module.

## P3-4 — Ten exported functions in `src/lib` without explicit return types

`src/lib/posthog-server.ts:31` `captureServerEvent` · `src/lib/discord-bot.ts:60` `postFeedbackEmbed` · `src/lib/notifications.ts:9` `createNotification`, `:30` `notifyFollowers` · `src/lib/email.ts:32` `sendEmail`, `:79` `sendCommentNotificationEmail`, `:181` `sendWelcomeEmail`, `:321` `buildWeeklySummaryHtml` · `src/lib/i18n/index.ts:47` `I18nProvider`, `:97` `useTranslation`.

All infer correctly today. Annotating them stops an inferred return type from silently widening on a future edit.

## P3-5 — `/api/oembed` has no discovery mechanism (suspicion, functional not security)

**File:** `src/app/api/oembed/route.ts`
`git grep -rn oembed -- src public` matches only the route file itself. There is no `<link rel="alternate" type="application/json+oembed">` tag on `/s/[id]`, and no provider registration in the repo. Unfurlers discover oEmbed endpoints one of those two ways, so the route is likely unreachable in practice.

*Do not delete it* — the correct read is that the discovery tag is missing, not that the route is dead. Worth a separate ticket to confirm whether Discord/Slack unfurls actually work today.

## P3-6 — Discord public key is a source literal

**File:** `src/app/api/discord/route.ts:7` — `DISCORD_PUBLIC_KEY`, 64-char hex.

**This is not a secret.** It is the Ed25519 *verification* key Discord publishes for the application, used correctly as the third argument to `nacl.sign.detached.verify` (line 85-88). Recorded only so a future secret sweep does not re-flag it as a leak. Moving it to an env var would ease rotation and multi-environment use; there is no confidentiality issue.

---

# Areas verified clean

Recorded so the next audit does not re-derive them.

**Secrets.** No live credential in any tracked file. Scans for `sk_live`/`sk_test`/`pk_live`/`whsec_`/`xoxb-`/`ghp_`/`github_pat_`/`lin_api_`/`AKIA…`/`AIza…`/`phc_…`/Discord webhook URLs/PEM private keys matched only documentation placeholders (`docs/STRIPE_PAID_REPORTS_ARCHITECTURE.md:335-338`, `.swarm/*.md`). No `SECRET|TOKEN|API_KEY|PASSWORD = "<literal>"` assignment in `src`. Only `.env.example` is tracked; `.gitignore:34` covers `.env*`. **No webhook signing-secret literal — the specific P0 searched for does not exist.**

**Webhook signature verification — all four verified:**
- `src/app/api/webhooks/linear/route.ts:49-58` — HMAC-SHA256 over the raw body, `timingSafeEqual`, plus a staleness check at `:71`.
- `src/app/api/webhooks/posthog/route.ts:175-185` — shared-secret header, `timingSafeEqual`, fails closed when unset.
- `src/app/api/webhooks/clerk/route.ts:28-42` — `verifyWebhook` from `@clerk/nextjs/webhooks`, rejects when the signing secret is unset.
- `src/app/api/discord/route.ts:76-92` — Ed25519 via `tweetnacl`, rejects missing signature/timestamp.

**SSRF — every user-influenced fetch is allowlisted:**
- `src/app/api/sprite/route.ts:40-45` — host allowlist (`play.pokemonshowdown.com`) **and** `/sprites/` path prefix, 3s abort.
- `src/app/api/pokepaste/route.ts:13-23` — Zod refine pinning hostname to `pokepast.es`/`www.pokepast.es`; the fetched URL is then *rebuilt* from a literal origin at `:54-55` rather than reusing user input, which also closes redirect-based bypass. 5s/8s timeouts.
- `src/app/api/oembed/route.ts:15-19` — no fetch at all; a regex extracts the share id and everything else is a literal.

**SQL injection.** Every statement uses Neon tagged templates. No `sql.unsafe`, no string-concatenated SQL. The one dynamic `ORDER BY` (`src/app/api/explore/route.ts:227`) interpolates `col`, which is a `sql` fragment chosen from a two-value ternary at `:212` (`s.updated_at` / `s.created_at`) — not user data. `to_tsquery` input at `:81-83` is sanitised by `split(/[^\w]+/)` before parameterisation.

**Authorization on share-scoped routes — all correct except P1-1:** `share/[id]/versions` (`:43-51`), `share/[id]/versions/[version]` (`:48-56`), `share/[id]/collaborators`, `changelog/[shareId]` (`:31-40`), `sync/[id]` (`:84-93` — with an explicit "URL tokens are never authorization" comment), `user/collections/[id]` (`:22-23`), `user/reports/[shareId]`, `match-log` (`:91` scopes DELETE by `user_id`) all verify owner-or-accepted-collaborator before returning or mutating data.

**Admin/destructive routes.** `/api/migrate` (`MIGRATE_SECRET`), `/api/setup` (`MIGRATE_SECRET` or `CRON_SECRET`), `/api/cleanup` GET (`CRON_SECRET`) and DELETE (`CLEANUP_SECRET`), `/api/bot` (`CRON_SECRET`), and all five `/api/cron/*` routes are bearer-gated with `timingSafeEqual` and fail closed when the env var is unset. The `CRON_SECRET ?? LINEAR_API_KEY` credential-domain mixing recorded in `.planning/codebase/CONCERNS.md:26` has been **fixed** — `src/app/api/bot/route.ts:55` now uses `verifyBearer(request, "CRON_SECRET")` only.

**CORS.** `src/lib/security/cors.ts` — static allowlist plus a preview-origin regex anchored on the `-mss23s-projects` scope suffix, and `Access-Control-Allow-Credentials` is deliberately absent (VGC-274). No wildcard reflection. The wildcard on `/api/sprite` covers public third-party images only (P2-4).

**Rate limiting.** Present on every public mutating route. `/api/user/export` initially looked unguarded but is limited to one export per 24h via a Redis marker (`src/app/api/user/export/route.ts:13-21`); `/api/feedback` uses a direct `isRateLimitedAsync` per-user bucket (`:86`) behind mandatory auth (`:81-84`). The only route with no limiter is `/api/sprite` (P2-4, deliberate).

**XSS.** Three `dangerouslySetInnerHTML` sites, all safe: `src/app/layout.tsx:100` (static inline theme script, no interpolation), `src/components/seo/JsonLd.tsx:9` (escapes `<` to `<` before injection), and a changelog string that merely *mentions* the API. User-controlled strings are run through `escapeHtml` at every DB-write and email-template boundary (`comments/[shareId]/route.ts:109-110`, `feedback/route.ts:98-99`, `user/profile/route.ts:85,87`, `lib/email.ts`, `cron/weekly-digest/route.ts`).

**Client IP parsing.** `src/lib/security/input-validation.ts:40-75` correctly prefers `x-vercel-forwarded-for`/`x-real-ip` and takes only the right-most `x-forwarded-for` entry, with regression tests in `__tests__/no-raw-forwarded-for.test.ts`. (VGC-264, already fixed on main — confirmed present, not re-reported.)

**TypeScript.** Zero `any` — no explicit annotation, no `as any`, no `any[]`/`Promise<any>`/`Record<string, any>` anywhere in `src`. Zero `@ts-ignore`/`@ts-expect-error`. `strict: true` plus five additional flags enabled and documented in `tsconfig.json`. Only six `as unknown as` casts, five of them justified (Clerk event narrowing, i18n dictionary indexing, a packed-JSON data import, a test polyfill). The `eslint-disable` comments are all `@next/next/no-img-element` in Satori/OG contexts where `next/image` is unavailable, plus a handful of `react-hooks/exhaustive-deps`.

**No orphaned files, no unreferenced routes.** `src/lib/i18n/index.ts` initially appeared orphaned but is imported as the directory specifier `@/lib/i18n` by nine call sites — false positive, verified and discarded. All five `vercel.json` cron paths resolve to real routes. `/api/bot`, `/api/oembed` and the three `/api/webhooks/*` routes have zero internal callers by design (external entry points) and must not be deleted.

---

## Recommended order

0. **P1-1** — already fixed in the working tree by a concurrent agent (VGC-246). Just run the gate and commit it.
1. **P1-3** — `next@16.3.3` patch bump. Smallest change, closes the only critical advisory.
2. **P1-2** — `creator_profiles.user_id`. Needs a migration, so it belongs on its own branch per the repo's feature-branch rule; P2-3 resolves with it.
4. P2-1 `npm audit fix`, P2-2 constant-time CSRF compare.
5. P3 items as piggyback commits — never their own push (Ignored Build Step would cancel a docs/cleanup-only tip commit).
