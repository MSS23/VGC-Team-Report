# C4 — Security Audit (2026-07-06)

## Overall: CLEAN

- **Hardcoded secrets: 0.** Only hex literal is `DISCORD_PUBLIC_KEY` at `src/app/api/discord/route.ts:7` — Discord Ed25519 public key, safe by design.
- **All 27 state-changing routes** call Clerk `auth()` and 401 on null userId.
- **All 4 webhooks** verify signatures via `timingSafeEqual` / `verifyWebhook`.
- **All bearer routes** use `crypto.timingSafeEqual`.
- **37 routes** enforce rate limits via `apiGuard`.
- **Middleware** layers Clerk + bot-detection + CORS allowlist + CSRF double-submit.
- **Three `dangerouslySetInnerHTML` sites** all safe (JsonLd escapes `</script>`, static string in layout, false-positive in changelog copy).

## Minor P2 nits (optional)
- `user/collections/route.ts:149-154` — `action == "delete"` skips Zod on `collectionId` (safe due to tagged template + user_id scoping).
- `share/[id]/fork/route.ts:129-132` — unawaited follow-up INSERT.

## No security fixes needed in Wave 2.
