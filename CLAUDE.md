# VGC Team Report

Next.js 16, React 19, TypeScript, Tailwind CSS v4.
Deployed on Vercel. `main` is connected to production — **every push triggers a full build** and consumes build minutes from the Pro-plan budget. Claude must not push without explicit permission.

## Automation Pipelines

```mermaid
flowchart LR
  subgraph "Daily Flow (commit-batched)"
    W[Work on main] --> TC[tsc + build gate]
    TC --> CM0[Commit locally]
    CM0 --> WAIT[Wait for explicit\npush/deploy request]
    WAIT --> P[Push to main]
    P --> V[Vercel auto-deploys]
  end

  subgraph "Linear Tickets"
    L[Linear: In Progress] --> C[Claude implements]
    C --> TC2[tsc + build gate]
    TC2 --> CM[Commit with VGC-XX prefix]
    CM --> NEXT[Next ticket or\nwait for push signal]
    NEXT -.->|on user 'push'/'ship'| P2[Push all commits]
    P2 --> UL[Update Linear\ncommit links + files]
    UL --> D[Discord #builds]
    D --> V2[Vercel deploys once]
  end

  subgraph "Big Changes Only"
    BIG[Risky/large feature] --> BR[Feature branch + PR]
    BR --> REV[Review + merge]
  end

  subgraph "Feedback to Backlog"
    U[User submits feedback] --> API[API route]
    API --> AT[Auto-triage\npriority + labels]
    AT --> LB[Linear: Backlog]
    API --> DW[Discord #feedback]
  end

  subgraph "Weekly Rituals"
    MON[Monday /plan-week] --> WK[Work through tickets]
    WK --> FRI[Friday digest\n+ growth report]
  end

  subgraph "Emergency"
    BRK[Prod broken] --> INC[/incident or /hotfix]
    INC --> PM[Post-mortem ticket]
  end
```

## Git Strategy: Commit Locally, Push Explicitly

**Every push to `main` triggers a Vercel production build** (Next.js 16 SSG of champion pages + API routes — not cheap in build minutes). To keep spend inside the Vercel Pro plan, we batch work locally and push only when the user asks.

### Default: Commit after every task. DO NOT push.
- Work on `main` (still trunk-based conceptually — no feature branches for routine work)
- Type-check and build before committing: `npx tsc --noEmit && npm run build`
- Commit with a proper message (`VGC-XX: description` for Linear issues)
- **Stop there.** Do not run `git push`. Commits sit locally on `main` until the user explicitly asks to push/deploy.
- Multiple tasks can accumulate as multiple local commits — that's the whole point. One push → one build → one deploy for many tickets.

### When to push (explicit user signal required)
Push only when the user clearly says one of:
- "push" / "push it" / "push to main" / "push to prod"
- "deploy" / "ship" / "ship it" / "release" / "go live"
- Any other unambiguous deploy request

If it's ambiguous ("can you commit the fix?" is NOT a push request), **ask first**. Cost of asking: zero. Cost of a wrong push: ~2 build minutes + possible prod regression + user annoyance.

Treat a push as a production deploy, because it is one.

### What to do when the user does say push
1. `git push origin main` — one push, regardless of how many commits are queued
2. For every Linear ticket that had a commit in this push, run the Linear comment + Discord notification flow (see below). Multiple tickets may need updates in one go.
3. Confirm to the user: "Pushed N commits → Vercel building → Linear updated for tickets X, Y, Z."

### Feature branches: Only when needed
Use a branch + PR **only** for:
- Large features that touch 10+ files
- Risky changes (DB migrations, auth changes, payment integrations)
- When the user explicitly asks for a PR
- Work you want a clean revert point for

Branch naming when used: `vgc-XX/brief-description`. Same rule applies: push the branch only on explicit request.

## Vercel Cost Guardrails (Pro plan)

The goal is to stay inside the $20/month Pro plan without overages. The biggest cost lever is **build minutes per push**.

- **Batch pushes.** Aim for 1–3 pushes/day, not 50. Multiple tickets → one push.
- **Avoid doc-only or trivial pushes.** If a change is CLAUDE.md-only, a comment tweak, or a typo in a non-rendered file, defer it and piggyback on the next real push.
- **No speculative pushes.** Don't push "just to see if the build passes on Vercel" — `npm run build` locally is the gate.
- **Reverts count as a push.** Factor that into the push decision — if a push introduces a regression, the revert is another full build.
- **Cron routes are already cost-aware** (daily + weekly, not more frequent). Don't add more cron routes without checking the quota impact.

If the user ever says "check Vercel usage" or similar, point them at vercel.com/dashboard → Usage. Claude cannot query Vercel usage programmatically from the CLI.

## Linear Helper Script

All Linear/Discord API calls use `.claude/scripts/linear.sh`. Source it before running any workflow commands:

```bash
source .claude/scripts/linear.sh
```

This provides: `linear_query`, `linear_move_issue`, `linear_comment`, `linear_comment_with_changes`, `discord_notify_build`, and git helpers. See the script for full API.

## Linear Workflow

**At the start of every conversation**, check Linear for In Progress issues and begin working through them automatically. Do not wait to be asked — if there are tickets In Progress, start implementing.

### 1. Check for In Progress issues

```bash
source .claude/scripts/linear.sh
linear_get_in_progress
```

### 2. Filter and prioritize

**Bug tickets are ALWAYS worked on — never skip bugs.** The `no-claude` label does NOT apply to bugs. If it has the Bug label, fix it regardless of other labels.

For non-bug issues: if an issue has the `no-claude` label, **skip it entirely** — do not implement, modify, or touch it. These are reserved for manual work.

### 3. Process tickets: bugs first, then by priority

Work through all In Progress issues sequentially without asking between each:
1. List them to the user briefly (note any skipped `no-claude` issues)
2. **Bugs first** — always fix bugs before anything else, regardless of priority number
3. Then remaining tickets by highest priority
4. For each: implement → verify → **commit locally** → next ticket. Push happens once at the end, on explicit user signal.
5. Continue until all In Progress tickets are done or the user interrupts

### 4. After implementing a ticket

#### a. Verify the build

```bash
npx tsc --noEmit    # Fix any type errors before continuing
npm run build       # Must pass — never commit broken code
```

#### b. Commit locally (DO NOT push)

```bash
git add <changed-files>
git commit -m "VGC-XX: brief description"
# NOTE: no git push here. Commits accumulate on main until the user says "push" or "deploy".
```

#### c. Move to the next ticket

Keep going until In Progress is empty or the user interrupts. Track pending Linear updates in memory: for each ticket you commit, remember its issue UUID and title so you can update Linear after the eventual push.

### 5. When the user says "push" / "deploy" / "ship"

Now — and only now — do the push and all deferred Linear/Discord work:

#### a. Push the accumulated commits

```bash
git push origin main
```

One push. All queued commits deploy in a single Vercel build.

#### b. Update Linear for every pushed ticket

For each ticket whose commit(s) were in this push:

```bash
source .claude/scripts/linear.sh

# Post comment with commit link + changed files (per commit or per ticket)
COMMIT_SHORT=$(git_commit_short)      # or a specific ticket commit sha
COMMIT_URL=$(git_commit_url)
FILE_COUNT=$(git_changed_files_count)

# Use GraphQL variables to avoid JSON escaping issues
AUTH=$(grep LINEAR_API_KEY "$PROJECT_ROOT/.env.local" | cut -d= -f2)
BODY="## Changes

[View commit ($COMMIT_SHORT)]($COMMIT_URL)

**${FILE_COUNT} files changed:**
$(git_changed_files | head -15 | sed 's/^/- /')"

curl -s -X POST 'https://api.linear.app/graphql' \
  -H 'Content-Type: application/json' \
  -H "Authorization: $AUTH" \
  -d "$(node -e "console.log(JSON.stringify({
    query: 'mutation(\$body: String!) { commentCreate(input: { issueId: \"ISSUE_UUID\", body: \$body }) { success } }',
    variables: { body: process.argv[1] }
  }, null, 0))" "$BODY")"

# Move to In Review
linear_move_issue "ISSUE_UUID" "$STATE_IN_REVIEW"
```

#### c. Notify Discord #builds for every pushed ticket

```bash
source .claude/scripts/linear.sh
discord_notify_build "VGC-XX" "Issue title"
```

#### d. Confirm to the user

Tell the user: "Pushed N commits → Vercel deploying → Linear + Discord updated for tickets X, Y, Z."

### Linear State IDs

Defined in `.claude/scripts/linear.sh`:
- In Progress: `STATE_IN_PROGRESS`
- In Review: `STATE_IN_REVIEW`

## Failure Handling

### Build fails (`tsc` or `npm run build`)
- Fix the errors and re-run. **Never commit broken code** — every commit is a candidate for the next push, and we don't want broken commits sitting in the queue.
- If you cannot fix it after 2 attempts, stop and ask the user.

### Linear API fails (during a push-triggered update)
- The code is already pushed — that's the priority
- Note to the user that the Linear update failed and which ticket(s) need manual updates
- Do not block the workflow on a Linear outage

### Something breaks in production
- Treat a revert as a real push — it costs another build, so confirm with the user before reverting if the issue is minor
- For genuine prod breakage: `git revert <commit>` (still don't push automatically — ask, or treat the user's "revert it" as the push signal)
- After pushing the revert: notify Discord, move the Linear issue back to In Progress

## Automated Monitoring (Vercel Cron)

Designed for Vercel Hobby (free tier) — all crons run once daily or weekly max.
Real-time uptime monitoring handled by UptimeRobot (free, 5-min pings).

| Route | Schedule | What it does |
|-------|----------|-------------|
| `/api/cron/daily-ops` | Daily 9am | Combined: site health check, stale ticket scan, SEO audit, DB health |
| `/api/cron/weekly-report` | Friday 5pm | Combined: Linear progress digest, user growth vs last week, dependency updates |

Both routes post results to Discord #builds. Only alerts on problems for daily ops; always posts the weekly summary.

All cron routes require Vercel cron user-agent or `CRON_SECRET` bearer token.

## Slash Commands

| Command | What it does |
|---------|-------------|
| `/plan-week` | Monday sprint planning — review backlog, pick tickets, post plan to Discord |
| `/cancel-build` | Revert a commit, move Linear ticket back to In Progress |
| `/hotfix` | Emergency fix with post-mortem ticket generation |
| `/incident` | Structured incident response — Linear ticket, Discord alert, post-mortem template |
| `/doctor` | Health check local dev env (Node, env vars, DB, ports, TypeScript, gh CLI) |
| `/security-audit` | npm audit, secret scanning, CVE check, OWASP code patterns |
| `/competitive-intel` | Search for new VGC tools and competitor updates |
| `/dead-code` | Scan for unused exports, orphaned components, dead routes |
| `/onboard` | Generate contributor setup guide from current project state |
| `/linear-add` | Create a Linear issue from conversation |

## UI/UX Standards

All UI work must follow `.claude/skills/ui-ux-pro-max/SKILL.md` — a comprehensive design intelligence guide covering:
- Accessibility (CRITICAL): contrast 4.5:1, focus rings, aria-labels, keyboard nav
- Touch targets: min 44x44px, 8px spacing, press feedback within 100ms
- Performance: lazy loading, skeleton screens, CLS < 0.1
- Consistent styling: SVG icons only, semantic color tokens, one primary CTA per screen
- Layout: mobile-first, consistent max-width (`max-w-5xl`), 4/8px spacing rhythm
- Animation: 150-300ms, transform/opacity only, respect reduced-motion

Run through the pre-delivery checklist before pushing UI changes.

## Code Conventions

- Follow existing patterns in the codebase
- Keep changes focused — no drive-by refactors
- Type-check and build before **committing**
- Commit messages: `VGC-XX: description` for Linear issues
- Commit to `main` locally; **never push without explicit user signal** (see Git Strategy above)
- Feature branches only for large/risky changes when explicitly needed
