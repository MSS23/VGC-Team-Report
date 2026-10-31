## Source
`.swarm/c3-perf-26-10-26.md` #2. Rated **very low risk** and the cheapest win in the report.

## Finding
`@pkmn/dex` occupies **52 MB** in `node_modules` and sits in `dependencies` in `package.json`, but the only importer anywhere in the repo is `scripts/build-dex-subset.mjs` — a build-time generator. Nothing in `src/` imports it; the app reads the generated `src/lib/data/dex-subset.json` instead.

## Fix
Move it to `devDependencies`. Saves 52 MB on every Vercel install and every CI run.

## Verify before shipping
Confirm the dex-subset generation script still runs (it is not part of `next build`, so a devDependency is fine), and that no Vercel build step invokes it in a production-only install. `npm ls @pkmn/dex` plus a grep for the import across `src/`, `scripts/` and `cypress/` is the whole check.

---
*Filed automatically by the overnight swarm, run 26-10-26.*
