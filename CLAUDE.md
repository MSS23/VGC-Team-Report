# VGC Team Report

Next.js 16, React 19, TypeScript, Tailwind CSS v4.
Deployed on Vercel (auto-deploy from `main`).

## Automation Pipelines

```mermaid
flowchart LR
  subgraph "Daily Flow (trunk-based)"
    W[Work on main] --> TC[tsc + build gate]
    TC --> P[Push to main]
    P --> V[Vercel auto-deploys]
  end

  subgraph "Linear Tickets"
    L[Linear: In Progress] --> C[Claude implements]
    C --> TC2[tsc + build gate]
    TC2 --> CM[Commit with VGC-XX prefix]
    CM --> P2[Push to main]
    P2 --> UL[Update Linear\ncommit link + files]
    UL --> D[Discord #builds]
    D --> V2[Vercel deploys]
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

## Git Strategy: Trunk-Based Development

This is a high-velocity solo project (50+ pushes/day). Use **trunk-based development**:

### Default: Push direct to main
- For routine work, fixes, tweaks, iterative changes — commit and push to `main`
- Vercel auto-deploys every push
- Always type-check and build before pushing: `npx tsc --noEmit && npm run build`

### Feature branches: Only when needed
Use a branch + PR **only** for:
- Large features that touch 10+ files
- Risky changes (DB migrations, auth changes, payment integrations)
- When the user explicitly asks for a PR
- Work you want a clean revert point for

Branch naming when used: `vgc-XX/brief-description`

## Linear Helper Script

All Linear/Discord API calls use `.claude/scripts/linear.sh`. Source it before running any workflow commands:

```bash
source .claude/scripts/linear.sh
```

This provides: `linear_query`, `linear_move_issue`, `linear_comment`, `linear_comment_with_changes`, `discord_notify_build`, and git helpers. See the script for full API.

## Linear Workflow

When asked to check Linear, implement tickets, or build In Progress issues, follow this workflow:

### 1. Check for In Progress issues

```bash
source .claude/scripts/linear.sh
linear_get_in_progress
```

### 2. Filter out `no-claude` issues

**IMPORTANT:** Check each issue's labels. If an issue has the `no-claude` label, **skip it entirely** — do not implement, modify, or touch it. These are reserved for manual work. Only process issues that do NOT have the `no-claude` label.

### 3. Process tickets: highest priority first, one at a time

Work through all In Progress issues sequentially (no need to ask between each):
1. List them to the user first (note any skipped `no-claude` issues)
2. Start with the **highest priority** ticket
3. For each: implement -> verify -> commit -> push -> update Linear -> Discord -> next ticket

### 4. After implementing a ticket

#### a. Verify the build

```bash
npx tsc --noEmit    # Fix any type errors before continuing
npm run build       # Must pass — never push broken code
```

#### b. Commit and push to main

```bash
git add <changed-files>
git commit -m "VGC-XX: brief description"
git push origin main
```

#### c. Update Linear with what changed

```bash
source .claude/scripts/linear.sh

# Post comment with commit link + changed files
COMMIT_SHORT=$(git_commit_short)
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

#### d. Notify Discord #builds

```bash
source .claude/scripts/linear.sh
discord_notify_build "VGC-XX" "Issue title"
```

#### e. Move to next ticket

Continue with the next highest-priority In Progress ticket. No need to ask the user between tickets unless something is unclear.

### Linear State IDs

Defined in `.claude/scripts/linear.sh`:
- In Progress: `STATE_IN_PROGRESS`
- In Review: `STATE_IN_REVIEW`

## Failure Handling

### Build fails (`tsc` or `npm run build`)
- Fix the errors and re-run. **Never push broken code.**
- If you cannot fix it after 2 attempts, stop and ask the user.

### Linear API fails
- Still commit and push — the code work is the priority
- Note to the user that the Linear update failed
- Do not block the workflow on a Linear outage

### Something breaks in production
- `git revert <commit> && git push origin main` to roll back
- Notify Discord that the change was reverted
- Move the Linear issue back to In Progress

## Mobile Quick-Add

The `/add` page on the site lets you create Linear issues from your phone. Bookmark it on your Pixel home screen.

After brainstorming in Claude mobile, open `/add`, paste the idea, pick type/priority, and submit. It creates the Linear issue and fires a Discord notification.

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

## Code Conventions

- Follow existing patterns in the codebase
- Keep changes focused — no drive-by refactors
- Type-check and build before pushing
- Commit messages: `VGC-XX: description` for Linear issues
- Push direct to main (trunk-based development)
- Feature branches only for large/risky changes when explicitly needed
