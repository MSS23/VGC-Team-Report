# Swarm Run Meta — 2026-08-02

## Branch

- **Branch used: `claude/gallant-bohr-nycyuh`** (not `swarm-nightly-2026-08-02`).
  The session harness explicitly designates this branch and forbids pushing to
  any other without explicit permission; that takes precedence over the
  routine's naming convention. Both satisfy the binding guardrail: **no pushes
  to `main`**.
- Cut fresh from `origin/main` @ `d962cc6`. `REMOTE_EXISTS=0`, ahead=0, behind=0.
- No existing open PR for this branch at run start.

## ⚠️ The headline finding: the PR backlog

**21 open draft PRs, none merged, dating back to 31 May 2026.** PRs #50–#70 are
all open drafts titled `swarm: nightly improvements <date>`, one per nightly run.

Corroborated from inside the repo:

- `.swarm/webhook-investigation.md` (28 May): *"This is the 8th consecutive
  nightly run proposing this fix. None of the previous PRs (35-48) have been merged."*
- `src/app/changelog/data.ts`, May 2026 v5.22: *"8th consecutive fix proposal —
  please merge!"*

**The bottleneck is review throughput, not code generation.** The swarm has been
re-proposing work nightly into a queue nobody drains. This is the single most
important thing for a human to act on — more nightly runs cannot help until the
queue moves.

Related repo-hygiene consequence: `.swarm/` is **tracked in git** and has
accumulated **172 files / 1.9MB** of machine-generated notes — roughly a quarter
of the 8MB working tree. It holds near-duplicate reports from every prior run
(8× `c1-dead-code*`, 7× `r8-accessibility*`, 5× `r6-seo*`, 10× `discord-failed*`).
Recommend `.gitignore`-ing `.swarm/` and pruning history. **Not done in this run**
— it is a 172-file deletion touching the user's own workflow artifacts, and it is
their call, not the swarm's.

## Environment capability assessment

Fresh clone, no `.env.local`, no injected secrets. This blocks most integrations:

| Capability | Status | Consequence |
|---|---|---|
| Linear MCP | ❌ requires OAuth, session non-interactive | Cannot read board, implement tickets, file tickets, or move statuses |
| `LINEAR_API_KEY` | ❌ unset — `.claude/scripts/linear.sh` reads it from `.env.local`, absent | No REST fallback either |
| Discord | ❌ `DISCORD_BUILDS_WEBHOOK` also from missing `.env.local`; `DISCORD_WEBHOOK_URL` / `DISCORD_BOT_TOKEN` unset | Mandatory notification cannot be sent → `.swarm/discord-failed.md` |
| PostHog | ❌ `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` unset | No error / rage-click / funnel data |
| Vercel MCP | ❌ not in this session's toolset | Cannot inspect prod env vars or logs |
| GitHub | ✅ via GitHub MCP (`gh` CLI absent) | PR operations work |

**GOAL A (drain the Linear board) and GOAL B (file Backlog tickets) are both
impossible this run** — there is no credentialed path to the board. Proposed
tickets are written to `.swarm/new-tickets-to-file-02-08-26.md` for a human to
file manually.

This is the **same wall every prior run hit** (see `.swarm/posthog-insights.md`,
`.swarm/discord-failed-*.md` ×10). It is a standing environment gap, not a
transient failure: the nightly container has never had these credentials.

## Build gate — SOLVED this run (worth keeping)

`npm install` failed four times with `ECONNRESET` before the cause was isolated:
the **Cypress postinstall binary download gets a 403 from the sandbox proxy** and
crashes the whole install. Packages themselves are fine.

Working command in this environment:

```bash
env -u HTTPS_PROXY -u https_proxy -u HTTP_PROXY -u http_proxy \
    -u npm_config_https_proxy -u npm_config_proxy \
    CYPRESS_INSTALL_BINARY=0 \
    npm install --no-audit --no-fund
```

→ 722 packages in 23s. With that, the full gate runs clean on a fresh `main`:

- `node node_modules/typescript/bin/tsc --noEmit` → **exit 0**
- `node node_modules/vitest/vitest.mjs run` → **263 passed / 29 files**
- `node node_modules/next/dist/bin/next build` → **exit 0**

So every change this run is verified against the real gate. Prior runs reported
this as a blocker; recording the fix here so future runs don't re-lose the hour.

## Linear webhook health check (Step 0C)

✅ **Healthy in code — no fix needed. The routine's P0 is stale.**

`src/app/api/webhooks/linear/route.ts` on `origin/main` already reads the secret
from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` (legacy `LINEAR_WEBHOOK_SECRET`
fallback, no hardcoded secret), reads the raw body via `await request.text()`
before `JSON.parse` so the HMAC covers raw bytes, verifies `linear-signature`
with `createHmac('sha256', …)` + `timingSafeEqual` behind a length check, sets
`dynamic = "force-dynamic"` and `runtime = "nodejs"`, and returns 200 on valid
signatures and unknown event types, 400 on missing signature, 401 on invalid
signature or missing secret, 200 for the empty-body setup ping, and 200 from the
catch block so transient errors don't trigger auto-disable.

Landed on main in `1a30839 Merge swarm-nightly PRs #48/#49 + repair corrupted main`.
The independent security audit this run separately confirmed all three webhook
handlers (Clerk, Linear, PostHog) verify correctly and fail closed.

If Linear delivery is still failing in production, the remaining cause is an
env-var mismatch between Vercel Production `LINEAR_WEBHOOK_SIGNING_SECRET` and
Linear's webhook config. That needs human action in the Vercel dashboard and is
out of scope for the swarm. No Vercel MCP in this session, so it could not be
confirmed either way.

Repo-wide secret scan found **no hardcoded secrets** — only `.env.example` and
docs placeholders, and no `.env*` in git history.

## Wave 1 — read-only audits (5 agents)

| Agent | Report |
|---|---|
| Security / OWASP | `.swarm/security-audit.md` |
| TypeScript strictness | `.swarm/ts-strictness.md` |
| Dead code | `.swarm/dead-code.md` |
| Accessibility (WCAG 2.1 AA) | `.swarm/a11y-audit.md` |
| Recent-commit review | `.swarm/code-review.md` |

Research agents (competitor teardowns, Reddit/Twitter sentiment, SEO, AEO) were
**deliberately not dispatched**. The repo already holds 4–5 near-identical prior
copies of each, none of which has been acted on, and none of that output can
become a Linear ticket this run. Spending the budget on code audits against
current `main` — which produce verifiable fixes — was the better use.

## Wave 2 — implementation (6 agents)

Dispatched with strict file-overlap control; no two agents share a file. Agents
run `tsc` + `vitest` only — `next build` is run centrally in the commit loop,
because parallel builds would fight over `.next/`.

**All six passed the gate. Nothing rejected — no `rejected-02-08-26.md` written.**

| Fix | Files | Commit |
|---|---|---|
| `/api/team-graphic` private-report leak (security P1) | route + new test | `847e160` |
| Phantom Pokémon from blank lines / `=== Team ===` header | parser + tests | `0021e4e` |
| `MissingNo.` "Bird" type white-screening the report | dex fallback, `TypeBadge`, test | `c41d42c` |
| Champions SP conversion / 0-SP dot / silent validator | 4 src + 2 test files | `dea5803` |
| Game-plan delete keyboard-inaccessible (WCAG 2.1.1 / 4.1.2) | `MatchupPlanSlide` | `e2ab391` |
| Stat-caption dismiss button swallowing taps | `StatColorNote` | `4be024e` |

Integrated gate, run centrally after all six were applied together:

- `tsc --noEmit` → exit 0
- `vitest run` → **279 passed / 31 files** (263 baseline + 16 new tests)
- `next build` → exit 0

## ⚠️ Deliberate behaviour change a reviewer must weigh

The `/api/team-graphic` fix closes the leak but the route is **unauthenticated**
(`runtime = "edge"`, no Clerk), so it cannot tell an owner from an outsider. The
"Download card" CTA (`TeamCardCTA`, rendered unconditionally at
`src/app/page.tsx:1408`) will now fail with the generic "Couldn't generate the
team card" alert **when an owner views their own Private report**. Public and
Unlisted reports are unaffected.

Fixing that properly needs either an owner/edit-token check inside the route or
hiding the CTA when `!isPublic && !isUnlisted` — both outside the single-file
scope the fix was given, and both wanting a human decision. Filed as a ticket in
`.swarm/new-tickets-to-file-02-08-26.md`. **Closing a private-data leak was
judged to outweigh a broken button on your own private report**, but that
trade-off is the reviewer's to confirm.

Second flag: id validation now requires exactly 8 alphanumeric characters, to
match `/api/share/[id]`. A legacy share id of another length would 404 here —
but it already 404s at the main share API, so such reports are not viewable
anyway.

## Not sent / not filed

- **Discord:** ❌ could not send — see `.swarm/discord-failed-02-08-26.md` for
  the full payload and the reason. Tenth consecutive run with this gap.
- **Linear:** ❌ could not file — 16 proposed tickets written to
  `.swarm/new-tickets-to-file-02-08-26.md`, ranked P0 → Low, each citing its
  source audit report.
- **Drafts:** none. No marketing, outreach or content agents were dispatched, so
  `.swarm/drafts/` is empty. Nothing was sent anywhere.
