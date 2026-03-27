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

### Sequential implementation

If there are multiple In Progress issues:
1. List them all to the user first
2. Implement the **oldest first** (first in the list)
3. For each issue: implement → type-check → build → commit → push → update Linear → notify Discord
4. Then move to the next issue
5. Ask the user before starting the next one

### After implementing an issue

1. Run `npx tsc --noEmit` and fix errors
2. Run `npm run build` to verify
3. Commit: `git commit -m "VGC-XX: brief description"`
4. Push: `git push origin main`
5. Move issue to "In Review" in Linear:
```bash
curl -s -X POST 'https://api.linear.app/graphql' \
  -H 'Content-Type: application/json' \
  -H "Authorization: $(grep LINEAR_API_KEY .env.local | cut -d= -f2)" \
  -d '{"query":"mutation { issueUpdate(id: \"ISSUE_UUID\", input: { stateId: \"89e58e68-05e3-4dc9-a0e8-20344f1b1a00\" }) { success } }"}'
```
6. Notify Discord #builds:
```bash
curl -s -X POST "$(grep DISCORD_BUILDS_WEBHOOK .env.local | cut -d= -f2)" \
  -H 'Content-Type: application/json' \
  -d '{"embeds":[{"title":"✅ Build Complete","description":"**VGC-XX: Title**\nPushed to main. Auto-deploying via Vercel.","color":5763719,"footer":{"text":"VGC Team Report Builder"}}]}'
```

### Linear State IDs
- In Progress: `0cbef347-0afb-4fa1-8dc2-79e9e04d1abe`
- In Review: `89e58e68-05e3-4dc9-a0e8-20344f1b1a00`

## Code Conventions

- Follow existing patterns in the codebase
- Keep changes focused — no drive-by refactors
- Type-check and build before committing
- Commit messages: `VGC-XX: description` for Linear issues
