## Source
`.swarm/c5-commit-review-26-10-26.md`.

## Finding
`.github/workflows/ci.yml:22` runs eslint with `continue-on-error: true`, and there are currently **35 lint errors** in the repo. CLAUDE.md documents CI as running `tsc --noEmit`, `eslint` and `vitest` on every push and PR — but because of that flag, the eslint step cannot fail the build. Lint is reported, not enforced.

This is a self-declared shortcut: C5 found it alongside 3 `// ponytail:` known-limitation markers in `src/` (`useTeamReport.ts:25`, `api/webhooks/linear/route.ts:66`, `lib/data/type-chart.ts:189`), and counted this one as a fourth.

## Fix — two steps, in order
1. Clear the 35 existing errors (or explicitly disable the ones judged acceptable, with a reason).
2. Remove `continue-on-error: true` so the step gates.

Doing step 2 first would turn CI red on every push, so they have to go in that order — which is presumably why the flag was added in the first place.

## Worth deciding at the same time
CI deliberately does not run `next build` (it needs production secrets; Vercel builds on push), so the local build is the real pre-commit gate per CLAUDE.md. That is a reasonable trade, but it means lint is the only check CI could enforce that local discipline might miss — which makes the `continue-on-error` more costly than it looks.

---
*Filed automatically by the overnight swarm, run 26-10-26.*
