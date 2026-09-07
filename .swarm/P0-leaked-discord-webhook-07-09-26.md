# P0 (STILL LIVE) — Discord feedback webhook exposed in public git history

**Status: NOT remediated. First reported 24 Aug 2026 in PR #75. Still unfixed 14 days later
because PR #75 has never been merged.** Re-verified independently tonight, 07 Sep 2026.

## Verified facts

- Exactly **one** real Discord webhook URL exists in this repository's reachable git
  history: an 18-digit channel id + a 68-character token (standard Discord shape).
- Introduced in `5da513a` "Wire feedback to Discord webhook notifications".
- Removed from the working tree in `28f5b8b` "Move Discord webhook URL to env var,
  remove hardcoded secret" — **removal from the tree does not remove it from history.**
- It is reachable from current refs, and this repository is public and forkable. Anyone
  who clones it can extract the token and post arbitrary messages into the project's
  Discord **feedback** channel.
- Hash comparison confirms it is **NOT** the `DISCORD_BUILDS_WEBHOOK` used for build
  notifications — it is the separate feedback webhook. So rotating it will not break
  build notifications.
- The current working tree is clean; `.env.example` contains only `xxxx` placeholders.

## Verification note (methodology correction worth recording)

An initial scan using `git grep --all` reported "no token found". That was a false
negative: `git grep --all` searches the trees at each **ref tip**, not every historical
commit. The correct method — enumerating every blob via `git rev-list --objects --all`
and streaming them through `git cat-file --batch` — found it immediately. Any future
secret scan in this repo must use the blob-enumeration method.

## Why the swarm did not fix it (deliberate, and still correct)

Rotating a live credential is an outward-facing, irreversible action with a production
blast radius: if Vercel's `DISCORD_FEEDBACK_WEBHOOK` still holds this URL, revoking it
silently breaks the feedback pipeline. That trade is a human's to make, not an overnight
agent's. The token is not reproduced in this file, the PR, Discord, or the run report.

## Remediation (human, ~5 minutes)

1. Discord → Server Settings → Integrations → Webhooks → delete the feedback webhook and
   create a new one. This invalidates the leaked token immediately.
2. Vercel → Project → Settings → Environment Variables → update `DISCORD_FEEDBACK_WEBHOOK`
   (Production) to the new URL. Redeploy.
3. Optional, lower priority: the old token stays in history forever unless the history is
   rewritten (`git filter-repo`) and force-pushed. Once step 1 is done the token is dead,
   so rewriting public history is usually not worth the disruption. Rotation is the fix.
4. Merge PR #75 so the investigation notes land on main and this stops being rediscovered.

## Cost of the delay

This is the third independent rediscovery of the same issue across nightly runs. Each
rediscovery costs a full agent investigation. It stays open only because the PR that
documents it is unmerged.
