# VGC Team Report

**Live:** https://pokemonvgcteamreport.com (the `vgc-team-report.vercel.app` alias 308-redirects there)

Paste a Pokémon Showdown team and get a shareable, slide-style **VGC team report**: per-Pokémon sets and notes, speed tiers, offensive and defensive type coverage, damage calcs, a threat matrix, matchup plans, and a tournament-mode view. It is built for competitive VGC players who want to write up a team for teammates, a stream, or a tournament recap, or to browse other people's write-ups on `/explore`.

It supports the mainline VGC regulations and **Pokémon Champions Reg M-A / M-B / M-C**. Champions uses Stat Points (SP: 66 total, max 32 per stat) instead of EVs, and the app converts between the two (`/tools/ev-to-sp`).

## Main features

- **Report builder** (`/`): paste or import from pokepast.es or a Limitless tournament, edit inline, then share at `/s/<id>`. Reports can be public, unlisted, or private. Signed-out users get an expiring guest link at `/q/<id>`.
- **Analysis** (`src/lib/analysis/`): stat math for EVs and SP, speed tiers with Tailwind, paralysis, Icy Wind, Scarf and Booster modifiers, `@smogon/calc` damage benchmarks, a spread builder, archetype and regulation detection, and Champions legality checks.
- **Social**: comments, reactions, saves, collections, follows, real-time collaborators with version history, and a creator page at `/creator/<name>`.
- **SEO pages**: `/champions` and SSG pages for each Mega at `/champions/mega-<name>`, plus `/explore`, `/tournaments`, `/faq`, `/changelog` and `llms.txt`.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Neon Postgres (`@neondatabase/serverless`) · Clerk auth · Upstash Redis (rate limiting and cache) · PostHog and Clarity · Resend email · Web Push · Vercel (hosting and crons) · vitest and Cypress.

## Run locally

```bash
cp .env.example .env.local     # fill in at least DATABASE_URL + Clerk keys
npm ci                         # set CYPRESS_INSTALL_BINARY=0 to skip the Cypress download
npm run dev                    # http://localhost:3000
```

Minimum env vars to boot: `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`. The Clerk middleware returns a 500 on every route without them. Upstash, PostHog, Resend, Discord, Linear and VAPID are optional, and their features degrade or turn off without them. `.env.example` documents every variable.

To create the database schema on a fresh database, call `GET /api/setup` with `Authorization: Bearer $MIGRATE_SECRET` (or `$CRON_SECRET`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / serve the build |
| `npm run typecheck` | `tsc --noEmit --incremental false` (cold, the same check CI runs) |
| `npm run lint` | ESLint. There are about 36 known react-hooks errors, so CI treats lint as non-blocking |
| `npm test` | vitest unit tests (`src/**/__tests__`) |
| `npm run test:e2e` | Cypress against `next dev` |
| `npm run generate:move-names` | Regenerate `src/lib/data/move-names.ts` |

**Windows note:** if the checkout path contains `&`, npm and npx shims break. Run binaries with node directly, for example `node node_modules/vitest/vitest.mjs run`. CLAUDE.md has the details.

## Deploy

Vercel builds every push to `main` as a **preview**. Production updates only when that deployment is **promoted** (dashboard or `vercel promote`). The crons are defined in `vercel.json` and authenticate with `CRON_SECRET`. CI (`.github/workflows/ci.yml`) runs typecheck, lint (non-blocking) and tests on every push and PR. It does not run `next build`.

## Docs

- `CLAUDE.md`: architecture map, conventions, and the git/deploy policy for agents
- `IMPROVEMENTS.md`: the July 2026 full review and its execution status
- `docs/REVIEW-2026-10-10.md`: the latest review pass
- `docs/WIKI.md`, `docs/STRIPE_PAID_REPORTS_ARCHITECTURE.md`
