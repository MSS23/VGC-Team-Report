# VGC Team Report

Next.js 16, React 19, TypeScript, Tailwind CSS v4.
Deployed on Vercel (auto-deploy from `main`).

## Linear Workflow

When asked to check Linear, implement tickets, or build In Progress issues, follow this workflow:

### Check for In Progress issues

```bash
curl -s -X POST 'https://api.linear.app/graphql' \
  -H 'Content-Type: application/json' \
  -H "Authorization: $(grep LINEAR_API_KEY .env.local | cut -d= -f2)" \
  -d '{"query":"{ team(id: \"06531926-0387-4a3e-8325-8b7be754ced5\") { issues(filter: { state: { name: { eq: \"In Progress\" } } }, orderBy: updatedAt, first: 10) { nodes { id identifier title description labels { nodes { name } } } } } }"}'
```

### Filtering: `no-claude` label

**IMPORTANT:** After fetching issues, check each issue's labels. If an issue has the `no-claude` label, **skip it entirely** — do not implement, modify, or touch it. These are reserved for manual work by the user. Only process issues that do NOT have the `no-claude` label.

### Sequential implementation

If there are multiple In Progress issues (after filtering out `no-claude`):
1. List them all to the user first (note any skipped `no-claude` issues)
2. Implement the **oldest first** (first in the list)
3. For each issue: implement → type-check → build → commit → push → update Linear → notify Discord
4. Then move to the next issue
5. Ask the user before starting the next one

### After implementing an issue

1. Run `npx tsc --noEmit` and fix errors
2. Run `npm run build` to verify
3. Commit: `git commit -m "VGC-XX: brief description"`
4. Push: `git push origin main`
5. Capture commit info for review context:
```bash
# Get commit hash and changed files
COMMIT_HASH=$(git rev-parse HEAD)
COMMIT_SHORT=$(git rev-parse --short HEAD)
CHANGED_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD | head -20)
COMMIT_URL="https://github.com/MSS23/VGC-Team-Report/commit/$COMMIT_HASH"
```
6. Add a comment on the Linear issue with what changed:
```bash
# Build file list for comment (newlines escaped for JSON)
FILE_LIST=$(git diff-tree --no-commit-id --name-only -r HEAD | sed 's/^/- /' | paste -sd'\\n' -)
curl -s -X POST 'https://api.linear.app/graphql' \
  -H 'Content-Type: application/json' \
  -H "Authorization: $(grep LINEAR_API_KEY .env.local | cut -d= -f2)" \
  -d "{\"query\":\"mutation { commentCreate(input: { issueId: \\\"ISSUE_UUID\\\", body: \\\"## Changes\\n\\n[View commit ($COMMIT_SHORT)]($COMMIT_URL)\\n\\n**Files changed:**\\n$FILE_LIST\\\" }) { success } }\"}"
```
7. Move issue to "In Review" in Linear:
```bash
curl -s -X POST 'https://api.linear.app/graphql' \
  -H 'Content-Type: application/json' \
  -H "Authorization: $(grep LINEAR_API_KEY .env.local | cut -d= -f2)" \
  -d '{"query":"mutation { issueUpdate(id: \"ISSUE_UUID\", input: { stateId: \"89e58e68-05e3-4dc9-a0e8-20344f1b1a00\" }) { success } }"}'
```
8. Notify Discord #builds (with commit link and changed files):
```bash
# Build file list for Discord (max 10 files shown)
DISCORD_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD | head -10 | sed 's/^/`/' | sed 's/$/`/' | paste -sd'\\n' -)
FILE_COUNT=$(git diff-tree --no-commit-id --name-only -r HEAD | wc -l | tr -d ' ')
curl -s -X POST "$(grep DISCORD_BUILDS_WEBHOOK .env.local | cut -d= -f2)" \
  -H 'Content-Type: application/json' \
  -d "{\"embeds\":[{\"title\":\"✅ Build Complete\",\"description\":\"**VGC-XX: Title**\\n\\n[View commit \`$COMMIT_SHORT\`]($COMMIT_URL)\\n\\n**Files changed ($FILE_COUNT):**\\n$DISCORD_FILES\\n\\nAuto-deploying via Vercel.\",\"color\":5763719,\"footer\":{\"text\":\"VGC Team Report Builder\"}}]}"
```

### Linear State IDs
- In Progress: `0cbef347-0afb-4fa1-8dc2-79e9e04d1abe`
- In Review: `89e58e68-05e3-4dc9-a0e8-20344f1b1a00`

## Code Conventions

- Follow existing patterns in the codebase
- Keep changes focused — no drive-by refactors
- Type-check and build before committing
- Commit messages: `VGC-XX: description` for Linear issues
