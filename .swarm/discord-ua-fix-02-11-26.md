# Discord notifications were failing on User-Agent, not on the webhook

Found 02-11-26 while sending this run's build summary.

## Symptom

POSTing the embed via Python `urllib` returned:

```
HTTP 403
error code: 1010
```

Cloudflare's **1010** is *"the owner of this website has banned your access based
on your browser's signature"* — i.e. it is a **User-Agent rejection at the edge**,
before Discord's API ever sees the request. It is NOT:

- an egress/proxy block — `https://discord.com/` and
  `https://discord.com/api/v10/gateway` both return 200 from this container, and
  the proxy's `recentRelayFailures` has no discord entry;
- a bad or rotated webhook — that returns 401/404, not 403/1010;
- a malformed payload — that returns 400 with a JSON error body.

## Fix

Send a real User-Agent. Discord's API documents a UA requirement, and curl's
default UA is acceptable where `python-urllib/3.x` is not:

```bash
curl -s -X POST "$DISCORD_BUILDS_WEBHOOK" \
  -H "Content-Type: application/json" \
  -H "User-Agent: vgc-overnight-swarm (https://github.com/MSS23/VGC-Team-Report, 1.0)" \
  --data-binary "@payload.json"
```

Identical payload, same webhook, same container: **HTTP 204**.

## Why this matters beyond tonight

`.swarm/` carries `discord-failed-*.md` reports from **seven** previous runs
(12-05, 15-05, 17-05, 18-05, 19-05, 20-05, 21-05). Those runs all recorded the
Discord notification as failed and saved the payload instead. If any of them
posted via a Python HTTP client, they hit this exact wall — which means the
nightly Discord notification has plausibly been broken for months for a
one-header reason, and each run diagnosed it as "Discord unavailable" rather
than as a client problem.

## Recommended follow-up

`discord_notify_build()` in `.claude/scripts/linear.sh` already uses `curl`, so
the shell path is fine. The fix belongs wherever a run sends the embed directly:
always set an explicit `User-Agent`, and treat a 403 with `error code: 1010` as
"wrong client headers", never as "Discord is down". Worth asserting in the
helper so a future run cannot regress it.

(Could not be filed as a Linear ticket — the workspace is at its free-plan
`activeIssueCount` cap this run. See `linear-issue-limit-02-11-26.md`.)
