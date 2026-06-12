# C4 Security Audit — 12 June 2026

Read-only. Scope: `npm audit`, hardcoded-secret grep across `src/**`, OWASP review of all `src/app/api/**/route.ts`, dangerouslySetInnerHTML/email templates, CORS/SSRF surface. Diffed against `c4-security-22-05-26.md`.

## Headline

- **Secret-scan: zero hits.** No Bearer tokens, JWTs, `sk-…`, `lin_api_…`, or DSN fragments in `src/**`. Only `process.env.*` references. P0 grep is clean.
- **npm audit: 0 critical / 3 high / 11 moderate.** Highs: `js-cookie ≤3.0.5` (via `@clerk/shared` — same Clerk chain as May 22, GHSA-qjx8-664m-686j); `@clerk/shared` (effect of above); **NEW `tmp <0.2.6`** path-traversal (GHSA-ph9p-34f9-6g65, dev-only — transitive through tooling, no runtime exposure). All highs report `fixAvailable: true`. New moderate: `joi <18.2.1` ReDoS (transitive, dev-only).
- **All four May-22 P1/P2 findings are CLOSED.** A new `src/lib/auth/verify-bearer.ts` helper (`timingSafeEqual` over equal-length Buffer compare, fail-closed on unset env) is now used by `/api/migrate` (POST), `/api/cleanup` (DELETE), `/api/setup` (GET), and `/api/bot` (GET). P2-D (Linear GraphQL `teamId` interpolation) is also closed — both `cron/daily-ops` and `cron/weekly-report` now use `$teamId` GraphQL variables.
- **No NEW P0/P1 findings in API routes.** Auth, SQL parameterization, SSRF allowlists, webhook signatures, JSON-LD `</script>` escaping, and email-template HTML-escaping all remain in the same good shape audited on May 22.
- Two NEW P2 findings worth flagging (one moderation-abuse, one cosmetic).

---

## P0 — Critical

_None._

## P1 — High

_None._ All May 22 P1 items (P1-B `/api/migrate`, P1-C `/api/cleanup` DELETE) shipped fixes via `verifyBearer`.

### Tracking only: P1-A Clerk chain still on vulnerable js-cookie (KNOWN, carry-over)
- `@clerk/nextjs` → `@clerk/shared` → `js-cookie ≤3.0.5` (GHSA-qjx8-664m-686j, CVSS 7.5).
- Unchanged since May 22. Auto-fix still requires a major Clerk bump; deferred to a planned upgrade ticket — do not rush tonight.

## P2 — Medium

### P2-NEW-A: `/api/comments/flag` lets a single attacker auto-delete any comment (NEW)
- **File:** `src/app/api/comments/flag/route.ts:14-65`
- **What:** Anonymous POST with `{ commentId, sessionId }`. Dedup is `ON CONFLICT (comment_id, session_id) DO NOTHING`, so 3 different sessionIds from one client clear the `FLAG_THRESHOLD = 3` gate and the route runs `DELETE FROM comments WHERE id = ${commentId}`. The route is per-IP rate-limited (10/min via `apiGuard`), but the IP gate is the only barrier — and a single attacker on residential IP rotation can wipe any comment in three requests.
- **Why it matters:** Moderation abuse / vandalism vector on a public UGC surface. Not data exfil, not auth bypass — but a public "nuke any comment" button is louder than the May 22 anonymous-posting nit (P2-C) and ranks above it.
- **Remediation:** (1) require Clerk `auth()` for the flag POST (matches the direction `/api/comments/[shareId]` POST is heading), or (2) tie the dedup key to client IP hash *as well as* sessionId, or (3) raise the threshold and add a moderator-review queue. Option 1 is the smallest diff and is consistent with the "feedback / write actions require sign-in" pattern already in place on `/api/feedback`, `/api/share`, `/api/reactions`.

### P2-NEW-B: `creator_profiles.avatar_url` accepts any HTTPS URL → stored SSRF target (NEW, low-impact)
- **File:** `src/app/api/user/profile/route.ts:21-24`
- **What:** `avatarUrl` zod refinement only checks `startsWith("https://")`. The URL is stored on `creator_profiles.avatar_url` and emitted to any consumer that renders it (creator card, OG image generator at `/api/team-graphic/route.tsx`). If that route ever does a server-side `fetch(avatarUrl)` to compose the OG image, it becomes a stored-SSRF source.
- **Why it matters:** Not exploitable today — I read `team-graphic/route.tsx` only at the directory level (file exists at .tsx, not .ts), and the explore card consumes the URL as a plain `<img src>`. But it's a latent footgun: a future "server-side avatar resize" or "OG composer that inlines the avatar" will land directly on it.
- **Remediation:** Add an allowlist refine (Clerk-hosted, Discord CDN, Gravatar, our own `/api/sprite`-style proxy) — same pattern already used in `/api/sprite` and `/api/pokepaste`. ~5 lines.

### P2-C (carry-over, KNOWN): `/api/comments/[shareId]` POST allows anonymous posting
- File: `src/app/api/comments/[shareId]/route.ts:75-117`
- Unchanged from May 22 — still rate-limited 5/min, HTML-escaped, word-filtered, gated on `allowComments`. Intentional design; document and move on, or flip to require auth (same one-line fix as P2-NEW-A above).

## P3 — Low / Informational

### P3-NEW: `tmp <0.2.6` path traversal (GHSA-ph9p-34f9-6g65, dev-only)
- Transitive through tooling (`node_modules/tmp`), not in any runtime path. `fixAvailable: true`. Bundle into the next `npm update` pass.

### P3-A — P3-D (carry-over, all KNOWN)
- P3-A pokepaste title regex — unchanged, still fine (React auto-escape downstream).
- P3-B user/profile auth via `currentUser()` not `auth()` — unchanged, still a consistency nit.
- P3-C moderate npm advisories — unchanged set + new `joi` ReDoS (transitive, dev-only). All `fixAvailable: true`.
- P3-D Open-redirect / SSRF surface — unchanged. Two outbound user-controlled fetches (`/api/sprite`, `/api/pokepaste`) both still strict-allowlisted. No new `dangerouslySetInnerHTML` usage with user content (the three occurrences remain JSON-LD with `</script>` escape, the layout theme bootstrap inline literal, and the changelog `data.ts` literal text).

---

## Webhook / Cron Signature Coverage Matrix (delta from May 22)

| Route | Auth method | Timing-safe | Fails closed | Δ vs May 22 |
|-------|-------------|-------------|--------------|-------------|
| `webhooks/linear` | HMAC-SHA256 of raw body | yes | yes | unchanged |
| `webhooks/clerk` | `verifyWebhook` (Svix) | yes (library) | yes | unchanged |
| `webhooks/posthog` | shared secret in header | yes | yes | unchanged |
| `discord` (interactions) | Ed25519 (tweetnacl) | yes (library) | yes | unchanged |
| `cron/daily-ops` | Bearer + `isCronAuthorized` | yes | yes | **GraphQL `teamId` now parameterized (P2-D closed)** |
| `cron/weekly-report` | same | yes | yes | **GraphQL `teamId` now parameterized (P2-D closed)** |
| `cron/weekly-digest` | same | yes | yes | unchanged |
| `cron/posthog-errors` | same | yes | yes | unchanged |
| `keep-alive` | same | yes | yes | unchanged |
| `bot` | `verifyBearer("CRON_SECRET")` | yes | yes | **fixed (P2-B closed)** |
| `migrate` | `verifyBearer("MIGRATE_SECRET")` (header) | yes | yes | **fixed (P1-B closed)** |
| `cleanup` GET | `isCronAuthorized` | yes | yes | unchanged |
| `cleanup` DELETE | `verifyBearer("CLEANUP_SECRET")` | yes | yes | **fixed (P1-C closed)** |
| `setup` | `verifyBearer("MIGRATE_SECRET" \|\| "CRON_SECRET")` | yes | yes | **fixed (P2-A closed)** |

---

## Diff vs May 22

**Closed (5 findings):** P1-B, P1-C, P2-A, P2-B → all replaced with one shared `verifyBearer` helper at `src/lib/auth/verify-bearer.ts`. P2-D → GraphQL `teamId` is now a bound `$teamId` variable in both cron routes.

**New (2 findings, both P2):** comment auto-flag abuse (P2-NEW-A); avatar_url latent SSRF (P2-NEW-B).

**Carry-over (still open):** P1-A Clerk major bump (scheduled work); P2-C anonymous comments (intentional, document); P3-A/B/C/D nits.

**Out of scope:** Vercel/Resend/Neon spend; runtime behaviour of `/api/team-graphic` (file is .tsx and I didn't read its full implementation — flagging it as the consumer of P2-NEW-B in case anyone touches that path next).

## Recommended Tonight

1. **P2-NEW-A** — require Clerk `auth()` on `/api/comments/flag` POST. One import, one early `return 401`. Closes the moderation-abuse vector tonight.
2. **P2-NEW-B** — add a host allowlist refine to `avatarUrl` in `ProfileBody` (Clerk + Discord CDN + our `/api/sprite` proxy). ~5 lines, defence-in-depth before anyone ships a server-side avatar consumer.
3. **`tmp <0.2.6`** + the moderate cleanup — `npm update` pass, batch into the next push (no isolated push).
4. **DO NOT** touch the Clerk major bump tonight — keep it on the planned ticket with smoke-test budget.
