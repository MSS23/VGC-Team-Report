# VGC Team Report

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, vitest + Cypress. Vercel (Pro), Neon Postgres, Clerk auth, PostHog analytics.

Paste a Pokémon Showdown team → get a shareable VGC team report. Supports classic VGC formats and Pokémon Champions Reg M-A/M-B/M-C (nested supersets; M-C is current, Sep 9 – Dec 2 2026), which uses **SP (Stat Points: 66 total, max 32 per stat)** instead of EVs.

## Environment quirks (read first)

- The project path contains `&` (`Projects & Code`). This **breaks npx and npm cmd shims** on Windows — `npx tsc` resolves to a garbage path and dies. Always invoke binaries directly with node from Git Bash:

```bash
cd "/c/Users/msidh/Documents/Projects & Code/VGC Team Report"
node node_modules/typescript/bin/tsc --noEmit --incremental false   # type-check (COLD — see below)
node node_modules/vitest/vitest.mjs run           # unit tests
node node_modules/next/dist/bin/next build        # prod build
```

- **The type gate must run cold.** `tsconfig.json` keeps `incremental: true` so `next build` stays fast, but a warm root `tsconfig.tsbuildinfo` has previously masked real errors — a green warm `tsc` is not evidence. Always pass `--incremental false` (or run `npm run typecheck`, which is exactly `tsc --noEmit --incremental false` and is the same command CI runs). Never treat a bare `tsc --noEmit` as the pre-commit gate.

- If you must run npx (e.g. the Vercel CLI), `cd ~` first — any cwd without `&` works.
- **Overnight swarm container:** run `source scripts/swarm-setup.sh` FIRST, before `npm install`. It clears the proxy vars that cause npm ECONNRESET, sets `CYPRESS_INSTALL_BINARY=0` (the Cypress CDN 403s through the proxy), and runs the connection preflight. Credentials arrive as **env vars** (`LINEAR_API_KEY`, `DISCORD_BUILDS_WEBHOOK`) — there is no `.env.local` in the container; `linear.sh` resolves env-first. If the preflight reports an integration missing, **skip it for the whole run and say so in the report — do not retry it.** The Linear-webhook-fix P0 is stale: it has been merged on main since May; don't re-verify it.
- Vercel CLI is not installed globally, but CLI auth exists on this machine (`$APPDATA/com.vercel.cli/Data/auth.json`), so `cd ~ && npx -y vercel <cmd>` works.

## Architecture map

| Path | What lives there |
|------|------------------|
| `src/lib/parser/showdown-parser.ts` | Showdown paste → `ParsedTeam`. No EVs line ⇒ all-zero spread. |
| `src/lib/analysis/stat-calculator.ts` | Stat formulas + Champions SP: `convertToChampionsSp` (EV→SP, passthrough for SP-form pastes), budget constants. |
| `src/lib/validation/champions-legality.ts` | Reg M-A/M-B/M-C legality (`getChampionsDex(reg)`): dex, per-reg Mega Stones, restricted (max 2), item/species clauses, SP/EV budgets. |
| `src/lib/data/` | Champions dexes, mega list, natures, base stats. |
| `src/components/report/` | Report UI — `PokemonCard`, `PokemonDetailSlide` (via `pokemon-detail/`), `SpeedTierChart` all derive SP via `convertToChampionsSp`. |
| `src/components/report/PokemonSprite.tsx`, `FallbackSprite.tsx` | `PokemonSprite` follows the gen theme and print mode; `FallbackSprite` (own file, so it never loads `useTheme`) is the theme-independent sprite with the URL fallback chain (`proxied` for canvas capture). Use one of these, not a local `<img>` fallback copy. |
| `src/app/champions/[pokemon]/` | SSG mega guide pages (SEO-critical). |
| `src/app/api/cron/`, `src/app/api/cleanup/` | Crons in `vercel.json` (UTC): `cleanup` daily 03:00 (purge soft-deleted/stale shares), `daily-ops` daily 09:00 and `weekly-report` Fri 17:00 → Discord #builds, `posthog-errors` Mon 08:00 (PostHog errors → Linear tickets), `weekly-digest` Mon 09:00 (user emails via Resend). Keep crons daily/weekly max. |
| `src/lib/db.ts` | Neon client + the whole schema in `ensureTable()` (run by `GET /api/setup`). `src/lib/db/migrations/*.sql` are hand-applied; nothing runs them. |
| `src/lib/api/` | Shared route helpers — use instead of a local copy: `ids.ts` (share/collection ids, edit tokens, `STRICT_SHARE_ID_RE`/`ShareIdSchema`), `display-name.ts` (`clerkDisplayName`), `search-vector.ts` (`weightedSearchVector` for share INSERT/UPDATE), `json-body.ts` (`readJsonBody`: malformed JSON → 400), `report-summary.ts` (`reportSummaryFields` for `user/*` list rows). |
| `src/lib/collaboration-access.ts` | Editor checks: `hasEditorAccess` (owner or accepted collaborator), `isAcceptedCollaborator` (share row already loaded), `collaborationAccess(id)` (id + auth + editor check → 400/401/403 for collaboration routes). |
| `src/hooks/useRandomAccent.ts` | `useRandomAccent(...deps)` — the post-mount random accent palette for pages; use instead of an inline `applyRandomAccent()` effect. |
| `src/lib/utils/safe-storage.ts` | SSR-safe localStorage (`readStorage`/`writeStorage`/`readStorageJSON`/…) and every key in `STORAGE_KEYS`/`STORAGE_KEY_BUILDERS`. Use for all localStorage access; never rename a key. |
| `.claude/scripts/linear.sh` | All Linear/Discord API helpers. `source` it first. |

## Git & deploy policy

**Commit locally after every task. NEVER push without an explicit user signal** ("push", "deploy", "ship", "go live"). Ambiguous ⇒ ask. Work on `main`; feature branches only for large/risky changes (10+ files, migrations, auth, payments) or when asked.

Pre-commit gate — every commit, no exceptions (delegate to the `verification-gate` subagent to keep output out of context): tsc, vitest, build must all pass. Never commit broken code. Two failed fix attempts ⇒ stop and ask.

Commit messages: `VGC-XX: description` for Linear work, `fix:`/`chore:`/`ci:` otherwise.

**Deploy model (two steps — pushing is NOT going live):**

1. `git push origin main` → Vercel builds a **preview** deployment (`target: null`) and spends Pro-plan build minutes. Batch pushes: 1–3/day, many commits per push.
2. Production (`pokemonvgcteamreport.com`) updates only on **Promote**: dashboard → "Promote to Production", or `cd ~ && npx -y vercel promote <deployment-id> --scope mss23s-projects --yes`. Treat "promote"/"go live" as this signal.

**Ignored Build Step gotcha:** Vercel diffs only the push's TIP commit, excluding `*.md` and `.claude/`. If the tip commit is docs-only, the entire build cancels — even if earlier commits have real code. Order commits so the tip carries a code change, or expect state `CANCELED`.

Cost guardrails: no doc-only or speculative pushes (piggyback on the next real push); a revert is another full build — confirm before reverting unless prod is truly broken. Vercel usage is dashboard-only (vercel.com/dashboard → Usage); Claude can't query it. Neon is on the 512MB free tier — never add autosave/snapshot-style DB writes without checking storage impact (July 2026: `share_versions` snapshots consumed 447MB).

## CI

`.github/workflows/ci.yml` runs `npm run typecheck`, `npm run lint` (eslint; errors fail CI, warnings do not), and `npm test` (vitest) on every push to `main` and every PR. It deliberately does not run `next build` (needs prod secrets; Vercel builds on push) — the local build stays the pre-commit gate.

## Linear workflow

At session start: `source .claude/scripts/linear.sh && linear_get_in_progress`, list the tickets, then work through them without asking between each:

1. **Bugs always first** — the `no-claude` label never applies to bugs. Non-bug issues with `no-claude`: skip entirely.
2. Remaining tickets by priority.
3. Per ticket: implement → `verification-gate` → commit `VGC-XX: …` → next. Record each ticket's issue UUID + title + commit sha for later.
4. Nothing is pushed until the user says so.

On the push signal: `git push origin main` (once), then hand the recorded `VGC-XX | UUID | title | sha` lines to the `linear-discord-updater` subagent (posts commit comment, moves to In Review via `$STATE_IN_REVIEW`, notifies Discord #builds). If Linear/Discord fail, the push still stands — report which tickets need manual follow-up. Confirm: "Pushed N commits → Vercel building (preview) → Linear/Discord updated for X, Y, Z. Say promote to go live."

## Subagents (`.claude/agents/`, local-only — `.claude/` is gitignored)

| Agent | Use |
|-------|-----|
| `verification-gate` | After every code change, before committing. Returns PASS/FAIL + failing lines only. |
| `ui-checklist-reviewer` | After touching any `.tsx`/styles. Checks the diff against the UI standards below. |
| `linear-discord-updater` | Only after a push happened. Handles all Linear comments + Discord notifications. |

## UI standards

All UI work follows `.claude/skills/ui-ux-pro-max/SKILL.md`: contrast 4.5:1, focus rings, aria-labels, keyboard nav, 44×44px touch targets, SVG icons only, semantic color tokens, one primary CTA per screen, `max-w-5xl`, 4/8px spacing rhythm, 150–300ms transform/opacity animations, reduced-motion respected. Run `ui-checklist-reviewer` before shipping UI changes.

## Production breakage

For genuine prod breakage: `git revert <commit>`, treat the user's "revert it" as the push signal, and remember prod also needs the Promote step. After the revert lands: notify Discord, move the Linear issue back to In Progress (`$STATE_IN_PROGRESS`). Use `/incident` or `/hotfix` for the structured flow.

## Slash commands

`/plan-week` Monday planning · `/cancel-build` revert + ticket back to In Progress · `/hotfix` emergency fix + post-mortem · `/incident` structured incident response · `/doctor` local env health · `/security-audit` npm audit + secrets + OWASP · `/competitive-intel` VGC tool/competitor scan · `/dead-code` unused exports/routes · `/onboard` contributor guide · `/linear-add` create Linear issue from conversation

## Conventions

- Follow existing patterns; focused diffs; no drive-by refactors.
- VGC is always level 50 — ignore pasted Level lines.
- New logic in `src/lib/` gets a vitest test beside it (`__tests__/`); regressions get a test that names the bug.
- `AGENTS.md` (for Codex/other agents) is a pointer to this file — don't duplicate content there.

## Agent skills

### Issue tracker

Issues are tracked in this repo's GitHub Issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
