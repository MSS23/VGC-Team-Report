# Swarm run meta — 2026-06-09

- Branch: `swarm-nightly-2026-06-09`
- Branch created fresh from `origin/main` (HEAD: 8eb39cc)
- UK local date: 2026-06-09 (Tuesday)
- Existing PR for branch: none

## Environment audit (run start)

- No `.env.local` file exists in this sandbox.
- `LINEAR_API_KEY` — **MISSING** → Linear MCP requires OAuth (can't authenticate unattended); Linear API script also can't read key. **All Linear API calls skipped this run.**
- `DISCORD_BUILDS_WEBHOOK` / `DISCORD_WEBHOOK_URL` / `DISCORD_BOT_TOKEN` — **MISSING** → Discord notification will be saved to `.swarm/discord-failed.md` per fallback in spec.
- `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` — **MISSING** → PostHog data pull skipped.
- Vercel MCP — not available in this session.

This matches the historical pattern (previous commits include `swarm: Discord notification payload (unsent — no .env.local)`). The swarm proceeds with code-side work and logs all external-API gaps.

## Step 0B — conflict prevention

- Branch cut fresh from `main` → 0 commits behind.
- Files changed on `main` in last 7 days (6 files in `.swarm/main-changed-files.md`).
- Working tree clean. No stash needed.
- Conflict risk for this run: **low**.

## Step 0C — Linear webhook health

Static audit of `src/app/api/webhooks/linear/route.ts`:
- ✅ Reads raw body via `await request.text()` before parsing.
- ✅ Uses `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` (with legacy `LINEAR_WEBHOOK_SECRET` fallback).
- ✅ Reads `linear-signature` header (and `x-linear-signature` fallback).
- ✅ HMAC-SHA256, hex-encoded, length-check + `timingSafeEqual`.
- ✅ Returns 200 for empty-body setup ping.
- ✅ Returns 200 in catch block to prevent auto-disable.
- ✅ `export const dynamic = "force-dynamic"` set.
- ✅ No hardcoded secrets.

**Handler code is correct.** Changelog v5.22 explicitly notes "8th consecutive fix proposal — please merge!" — confirming repeated swarm runs have already fixed and re-fixed this. If webhook delivery still fails in production, the root cause is **env-var configuration in Vercel** (`LINEAR_WEBHOOK_SIGNING_SECRET` missing, empty, or not matching the secret Linear uses to sign). That requires human action via the Vercel dashboard — the swarm never modifies Vercel env vars.

Status: ⚠️ **env-var issue — human action required**. Logged in PR body and final report.

## Updates page

This project's "Updates page" is `/changelog` (`src/app/changelog/data.ts`). It uses month-grouped entries (`date: "May 2026"`), versioned, with typed items. Latest entry is `5.22`. Tonight's run will append `5.23` under a new `"June 2026"` month section at the top of `ENTRIES`.

## PostHog insights

Skipped — no credentials in this sandbox. Logged in `.swarm/posthog-insights.md`.
