# P0 — live Discord webhook token exposed in public git history

Found at the very end of the 24-08-26 nightly run, while independently
re-verifying the C4 audit's "no hardcoded secrets" verdict after that agent
disclosed one of its scans had been killed before producing output.

**The current working tree is clean — C4's verdict was right about the tree and
wrong about history.** I had repeated "no hardcoded secrets anywhere in the
repo" in the PR body and the Discord summary. That was wrong, and both have
been corrected.

## What

A Discord webhook URL was hardcoded as a fallback in
`src/app/api/feedback/route.ts`:

- Introduced: `5da513a` "Wire feedback to Discord webhook notifications"
- Removed:    `28f5b8b` "Move Discord webhook URL to env var, remove hardcoded secret"

Removing it from the tree does **not** remove it from history. It is still
retrievable from any clone.

- Webhook ID: `1486366505959428187`
- Webhook name: **"VGC Team Report Feedback"**
- Channel: `1486366372727623811` · Guild: `1277312597422506056` (same guild as #builds)
- Token: **not reproduced here** — it is in the two commits above. Deliberately
  not copied into this file, the PR, or Discord, to avoid amplifying it further.

## Why it is P0

1. **The token is still live.** A `GET` on the webhook URL returns HTTP 200 with
   its metadata (a GET only reads; nothing was posted). It was removed from the
   code but **never rotated**.
2. **The repository is public.** `visibility: public`, `allow_forking: true`.
   Anyone who clones or forks can read it out of history, and forks keep their
   own copies of the objects.
3. **Impact:** anyone can post arbitrary messages into the project's Discord
   feedback channel — impersonating users, spamming, or phishing through a
   channel the team trusts.

## What the swarm deliberately did NOT do

**Did not revoke or rotate it.** Two reasons, and both matter:

- Deleting a webhook is destructive and outward-facing, on the user's own
  Discord, with no human available to confirm.
- The production feedback feature now reads this from an env var, and that env
  var may hold **this exact URL**. Revoking it could silently break feedback in
  production. There is no Vercel access this run to check.

Blindly deleting it would have traded a security problem for an availability
problem without anyone deciding that trade was worth making.

## What the human needs to do

1. **Create a new feedback webhook in Discord and delete the old one**
   (Server Settings → Integrations → Webhooks). Deleting is what actually
   invalidates the token — nothing in git can.
2. **Update the feedback webhook env var in Vercel Production** to the new URL,
   and redeploy. Do this in the same sitting as step 1, or feedback breaks.
3. Confirm nothing else consumes the old webhook.
4. Optional, and *not* a substitute for rotation: purging history
   (`git filter-repo`, or GitHub Support for cached views) rewrites published
   history and invalidates every clone and open PR. Rotate first; decide on a
   purge separately, and never treat a purge as the fix.

Note the repo's own `.env.example` is correct — it carries only the sanitized
placeholder `lin_api_xxxx…`. This was a single lapse in one route, already
caught and removed by whoever wrote `28f5b8b`; the only thing missed was the
rotation.

## Ticket

Cannot be filed: Linear is over its free-plan issue cap
(`USAGE_LIMIT_EXCEEDED`, 275 active vs 250). Queued at the top of
`.swarm/proposed-tickets-24-08-26.md` as **P0**.

## Scan coverage behind this finding

Scanned all 672 git-tracked files and the full `git log -p --all` history for:
`Bearer <20+>`, `sk-<20+>`, `lin_api_<20+>`, `discord.com/api/webhooks/<id>/`,
and `secret|token|apikey|api_key|password|signing = "<16+>"`.

- Current tree: **zero** matches.
- History: **one** match, the webhook above.

An earlier unbounded scan hung on a catastrophically-backtracking pattern (the
same hang the C4 agent hit and that cost it its original evidence); scoping to
`git ls-files` and dropping that pattern fixed it.
