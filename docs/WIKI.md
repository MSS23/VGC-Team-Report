---
tags: [project]
type: web app
status: active
---

# VGC Team Report

**Type:** web app
**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4; Neon Postgres (@neondatabase/serverless), Clerk auth, Upstash (Redis + ratelimit), @pkmn/dex, PostHog/Clarity analytics; deployed on Vercel
**Status:** active

## What it does
A web app for Pokémon VGC (Video Game Championships) players that analyzes and presents competitive team reports. Users input teams (e.g. PokePaste) and the app produces shareable analyses — type coverage, champions data, matchup comparisons, tournament data, and exportable team graphics/PDFs. It includes social/sharing features, embeddable widgets, a feedback-to-Linear pipeline, and a Discord integration.

## How it works
Next.js App Router with route segments under `src/app` (champions, compare, dashboard, explore, tournaments, embed, creator, feedback, notifications, plus an `api/` surface). The `api/` directory holds many route handlers: `pokepaste`, `team-graphic`, `champions`, `explore`, `share`, `sprite`, `sync`, `discord`, `webhooks`, `cron`, `feedback`, etc. Pokémon data comes from `@pkmn/dex` with curated fallbacks/subsets in `src/lib/data` (moves, natures, type-chart, mega-pokemon, regulation signals). Persistence is Neon Postgres; the schema is created and updated by `ensureTable()` in `src/lib/db.ts` (run on a fresh database via `GET /api/setup`). `src/lib/db/migrations/*.sql` are one-off SQL files applied by hand; no code runs them. Auth via Clerk; rate-limiting via Upstash. PDF/graphic export uses jspdf + html2canvas-pro + qrcode. Run with `npm run dev` (port 3000); `npm run build`/`start` for production; tests via Vitest (`npm test`) and Cypress E2E (`npm run cy:run`).

## How it's developed
CLAUDE.md documents the workflow: trunk-based on `main`, commit-locally / push-explicitly, Linear ticket integration (VGC-XX commit prefixes), and Discord #builds notifications. A push to `main` builds a Vercel preview deployment; production changes only when that deployment is promoted.

## Key files
- `CLAUDE.md` — development workflow, automation pipelines, git strategy
- `src/app/` — route segments (champions, compare, explore, tournaments, dashboard, embed, api)
- `src/app/api/` — route handlers (pokepaste, team-graphic, champions, discord, webhooks, cron, feedback)
- `src/lib/data/` — Pokémon dex data + fallbacks (moves, natures, type-chart, mega-pokemon)
- `src/lib/db.ts` — Neon connection and the schema (`ensureTable()`)
- `src/lib/analysis/` — team analysis logic
- `next.config.ts`, `vercel.json` — build/deploy config
- `package.json` — scripts and dependency stack

## Notes
Every push to `main` spends Vercel Pro-plan build minutes, so pushes are batched and require explicit permission.
