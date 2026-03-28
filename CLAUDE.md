# VGC Team Report

Next.js 16, React 19, TypeScript, Tailwind CSS v4.
Deployed on Vercel (auto-deploy from `main` on PR merge).

## Automation Pipelines

```mermaid
flowchart LR
  subgraph "Ticket to Deploy"
    L[Linear: In Progress] --> C[Claude implements]
    C --> TC[tsc + build gate]
    TC --> BR[Feature branch + PR]
    BR --> PV[Preview deploy\nhealth + SEO check]
    PV --> LR[Linear: In Review\nwith commit + PR links]
    LR --> D[Discord #builds]
    D --> R[You review PR]
    R --> M[Merge to main]
    M --> V[Vercel deploys]
    V --> HC[Health check\nevery 15 min]
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
    BRK[Prod broken] --> INC[/incident]
    INC --> HF[/hotfix]
    HF --> PM[Post-mortem ticket]
  end
```

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

### 3. Sequential implementation

If there are multiple In Progress issues (after filtering out `no-claude`):
1. List them all to the user first (note any skipped `no-claude` issues)
2. Implement the **oldest first** (first in the list)
3. For each issue: implement -> verify -> branch -> PR -> update Linear -> notify Discord
4. Ask the user before starting the next issue

### 4. After implementing an issue

#### a. Verify the build

```bash
npx tsc --noEmit    # Fix any type errors before continuing
npm run build       # Must pass — never push broken code
```

#### b. Create a feature branch and commit

```bash
git checkout -b vgc-XX/brief-description
git add <changed-files>
git commit -m "VGC-XX: brief description"
git push -u origin vgc-XX/brief-description
```

Branch naming: `vgc-XX/brief-description` (lowercase, kebab-case).

#### c. Open a Pull Request

```bash
GH="/c/Users/msidh/gh/bin/gh.exe"
PR_URL=$($GH pr create \
  --title "VGC-XX: brief description" \
  --body "$(cat <<'EOF'
## Summary
- <what changed and why>

## Files changed
- `path/to/file.tsx` — <what was modified>

## Verification
- [x] `tsc --noEmit` passes
- [x] `npm run build` passes

Closes VGC-XX
EOF
)" \
  --base main \
  --head vgc-XX/brief-description)

echo "$PR_URL"
```

#### d. Validate preview deploy

After opening the PR, Vercel creates a preview deployment. Wait for it and validate:

```bash
GH="/c/Users/msidh/gh/bin/gh.exe"

# Get the preview URL from the PR checks (wait up to 3 min for Vercel)
sleep 30
PREVIEW_URL=$($GH pr checks --json "name,detailsUrl" 2>/dev/null | node -e "
const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
const v=d.find(c=>c.name.includes('Vercel')||c.name.includes('Preview'));
if(v) console.log(v.detailsUrl);
" 2>/dev/null)

if [ -n "$PREVIEW_URL" ]; then
  echo "Preview: $PREVIEW_URL"
  # Quick health check against preview
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PREVIEW_URL")
  if [ "$STATUS" -ge 400 ]; then
    echo "WARNING: Preview deploy returned HTTP $STATUS"
  fi
fi
```

If the preview returns errors, investigate before notifying the user to review.

#### e. Update Linear with review context

```bash
source .claude/scripts/linear.sh
linear_comment_with_changes "ISSUE_UUID" "$PR_URL"
linear_move_issue "ISSUE_UUID" "$STATE_IN_REVIEW"
```

This posts a comment on the Linear issue containing:
- Link to the GitHub commit
- Link to the PR for review
- List of all changed files

#### f. Bundle size check

Before notifying, compare the build output size against main:

```bash
# Record build size from the branch build (already ran in step a)
BRANCH_SIZE=$(du -sb .next/ 2>/dev/null | cut -f1)

# Compare against main (approximate — check if size grew significantly)
git stash
git checkout main
npm run build --quiet 2>/dev/null
MAIN_SIZE=$(du -sb .next/ 2>/dev/null | cut -f1)
git checkout -
git stash pop 2>/dev/null

if [ -n "$BRANCH_SIZE" ] && [ -n "$MAIN_SIZE" ]; then
  DIFF=$((BRANCH_SIZE - MAIN_SIZE))
  PERCENT=$(( (DIFF * 100) / MAIN_SIZE ))
  if [ "$PERCENT" -gt 5 ]; then
    echo "WARNING: Bundle size increased by ${PERCENT}% (+${DIFF} bytes)"
    # Include in PR comment
  fi
fi
```

If bundle size increases >5%, add a warning to the PR description.

#### g. Notify Discord #builds

```bash
source .claude/scripts/linear.sh
discord_notify_build "VGC-XX" "Issue title" "$PR_URL"
```

#### h. Return to main

```bash
git checkout main
```

### Linear State IDs

Defined in `.claude/scripts/linear.sh`:
- In Progress: `STATE_IN_PROGRESS`
- In Review: `STATE_IN_REVIEW`

## Failure Handling

### Build fails (`tsc` or `npm run build`)
- Fix the errors and re-run. **Never push or open a PR with a broken build.**
- If you cannot fix it after 2 attempts, stop and ask the user.

### PR creation fails
- Ensure the branch was pushed (`git push -u origin <branch>`)
- Check `gh auth status` — re-auth if needed
- Fall back to providing the user a manual PR link: `https://github.com/MSS23/VGC-Team-Report/compare/main...<branch>`

### Linear API fails
- Still commit, push, and open the PR — the code work is the priority
- Note to the user that the Linear update failed and they should move the issue manually
- Do not block the workflow on a Linear outage

### Something breaks in production after merge
- `git revert <commit> && git push origin main` to roll back
- Notify Discord that the change was reverted
- Move the Linear issue back to In Progress

## Deploy Window

**Safe deploy hours:** Monday-Friday, 9am-9pm UK time.

Before merging a PR or suggesting the user merge:
- Check the current time. If it's after 9pm or a weekend, warn: "This would deploy outside safe hours. Merge tomorrow morning instead?"
- Exception: `/hotfix` overrides the deploy window for emergencies.
- Rationale: if a deploy breaks something at midnight or on Saturday, nobody's watching.

## Visual Regression (PR Review Aid)

When a PR changes UI components (`.tsx` files in `src/components/` or `src/app/`), note which pages are likely affected in the PR description. The user should check these pages on the Vercel preview URL before merging.

Key pages to visually check after UI changes:
- Homepage (`/`)
- Explore (`/explore`)
- Dashboard (`/dashboard`)
- Report view (`/s/[id]`)
- Changelog (`/changelog`)

For major UI changes, suggest the user open both the preview URL and production side-by-side.

## Why One Ticket at a Time

Always process Linear tickets **sequentially, not in parallel**:
- Smaller PRs are easier to review as a solo dev
- If something breaks, you know exactly which ticket caused it
- No merge conflicts between parallel branches
- You can course-correct between tickets

## After a PR is Merged

### Changelog update

After the user merges a PR, update the changelog data in `src/app/changelog/ChangelogContent.tsx`:
- Add the new feature/fix to the current version's `items` array
- Use the correct type: `"new"`, `"improved"`, or `"fixed"`
- Keep descriptions concise and user-facing (not developer-facing)

Only update the changelog when asked, or when a significant user-facing feature ships.

## Automated Monitoring (Vercel Cron)

Designed for Vercel Hobby (free tier) — all crons run once daily or weekly max.

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
| `/cancel-build` | Close a PR, delete branch, revert if merged, move Linear ticket back |
| `/hotfix` | Emergency direct-to-main push with post-mortem ticket generation |
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
- Type-check and build before committing
- Branch names: `vgc-XX/brief-description`
- Commit messages: `VGC-XX: description` for Linear issues
- PRs: always target `main`, include changed files list and verification checklist
