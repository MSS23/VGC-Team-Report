# C4 Security Audit — 20-07-26

## Top 5 findings

1. **HIGH — `/api/team-graphic` renders private-report data** — `src/app/api/team-graphic/route.tsx:96`. SELECT lacks `is_public/is_unlisted` filter. Anyone with a share ID can pull full private team via OG-image endpoint. Fix (1 line): add `AND (is_public = TRUE OR is_unlisted = TRUE)` to SELECT, tighten `shareId` regex to `/^[A-Za-z0-9]{8}$/`. **CONFLICT-RISK** — file on main-changed-files.md.
2. **HIGH — Anon comment DELETE trusts request-body `sessionId`** — `src/app/api/comments/[shareId]/[commentId]/route.ts:63-69`. Only client-supplied `sessionId` gates deletion for anon comments. **CONFLICT-RISK**. Fix: store HMAC(sessionId, SERVER_SECRET) and `timingSafeEqual`.
3. **MEDIUM — `avatar_url` unrestricted** — `src/app/api/user/profile/route.ts:21-24,85-93`. Only `startsWith("https://")` check; enables tracking pixels and Referer leaks on public profiles. Fix: allowlist hosts (`img.clerk.com`, `i.imgur.com`, `avatars.githubusercontent.com`) — matches CSP img-src.
4. **MEDIUM — `twitter`/`youtube` unvalidated** — `src/app/api/user/profile/route.ts:79-95` and `src/components/social/CreatorProfile.tsx:142,252,263`. Handle can inject query strings or path traversal into href. Fix: Zod `/^[A-Za-z0-9_.-]{1,30}$/`.
5. **MEDIUM — CORS wildcard on `/api/sprite`** — `src/app/api/sprite/route.ts:72`. Same-origin `<img>` consumer doesn't need it. Fix: echo request origin or drop header.

## P0 — None found

- `.env.example` only placeholders.
- No committed `.env` files, no `sk-`/`re_`/`pk_live_`/`Bearer <realtoken>`.
- `DISCORD_PUBLIC_KEY` in code is Discord's *public* ed25519 verification key (safe to publish).

## HIGH — OWASP Top 10

- A01 Broken Access Control: findings #1, #2.
- A05 CORS wildcard: finding #5.
- A08 hardcoded IDs: `DISCORD_PUBLIC_KEY`, `SPOTLIGHT_ID` — low risk but rotation needs deploy.

## MEDIUM — Defense-in-depth

- `/api/user/profile` PUT — social fields (findings #3, #4).
- `/api/pokepaste` POST — no auth, 50 KB text forwarded to pokepast.es. Consider auth.
- `/api/user/reports/[shareId]` PATCH — no Zod `.strict()`.
- Linear/PostHog webhooks return 200 on error — deliberate, but silences monitoring.

## LOW

- Move `DISCORD_PUBLIC_KEY` to env for rotation.
- `src/lib/security/csrf.ts:44` — replace `===` with `timingSafeEqual`.
- `dangerouslySetInnerHTML` audit clean.
- CSP nonce-based upgrade possible future pass.

## npm audit summary

12 vulnerabilities (11 moderate, 1 high dev-only). All non-critical:
- `next` 16.2.6 + `@clerk/nextjs` + transitive `postcss` — moderate XSS in postcss-string transformation, build-time only.
- 7 `@opentelemetry/*` packages — moderate memory allocation via untrusted `baggage` header (not exploitable inbound, PostHog exporter is outbound).
- `systeminformation` transitive of cypress — high but dev-only, skip.

Recommend a maintenance PR to bump OTel packages (low blast radius — internal log exporter only).

## Conflict-risk overlaps

- `src/app/api/team-graphic/route.tsx` — HIGH CONFLICT. Coordinate merge order.
- `src/app/api/comments/[shareId]/[commentId]/route.ts` — HIGH CONFLICT.
- `src/proxy.ts`, `src/app/api/sync/[id]/route.ts` — no fix touches them.
- `src/app/api/sprite/route.ts`, `src/app/api/user/profile/route.ts`, `src/lib/security/csrf.ts` — NOT on main-changed-files, safe to touch.

## Recommended landing order

1. Team-graphic gate (HIGH #1) — despite conflict risk, this is a real leak.
2. Profile-route hardening (MEDIUM #3, #4).
3. Sprite CORS narrowing, CSRF `timingSafeEqual` (LOW).
4. OTel semver bump (LOW).

## Actionable this run

- Team-graphic gate — cherry-pick or re-implement (need to check if file has diverged).
- Profile hardening — safe, no conflict.
- Sprite CORS — safe, no conflict.
- CSRF timingSafeEqual — safe, no conflict.
