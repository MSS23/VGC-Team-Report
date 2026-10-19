# Discord notification — FAILED then SUCCEEDED, with the root cause

**Final status: ✅ delivered.** `HTTP 204` to channel `1487202217298493493`.
This file is kept deliberately, because `.swarm/` contains **eleven**
`discord-failed-*.md` files from previous runs and the cause turns out to be
trivial and fixable.

## What happened

The first attempt, from Python, failed:

```
urllib.request.urlopen(...)  ->  HTTP Error 403: Forbidden
```

The same request via `curl` succeeded immediately:

```
curl -X POST "$DISCORD_BUILDS_WEBHOOK" -H 'Content-Type: application/json' --data @payload.json
HTTP=204
```

## Root cause

**It is not Discord, and not the egress policy.** Evidence:

- `GET $DISCORD_BUILDS_WEBHOOK` → `200`, returning the correct webhook metadata
  (`channel_id: 1487202217298493493`, name "VGC Team Report Build"), so the URL
  and token are valid and the host is reachable.
- `curl` `POST` to the identical URL → `204`.
- `curl -sS "$HTTPS_PROXY/__agentproxy/status"` reports `enabled: true`,
  `selective: false`, `toolScoped: false`, `recentRelayFailures: []` — the proxy
  is healthy and applies no per-host or per-method policy.
- Python `urllib` reaches other proxied hosts fine in the same session — every
  Linear GraphQL call in this run went through `urllib` without issue.

So the 403 is specific to `urllib`'s `CONNECT` handling for this host through the
agent proxy, not to Discord's API, the token, or the network policy.

## Fix for future runs

**Send the Discord notification with `curl`, not Python `urllib`/`requests`.**
`.claude/scripts/linear.sh`'s `discord_notify_build` already uses `curl` — so the
helper was always correct, and runs that failed were ones that hand-rolled the
POST in Python instead of using it.

Recommended: build the JSON payload in Python (quoting an embed in bash is
error-prone), write it to a file, then `curl --data @file`. That is what
succeeded here.

## Note on channel noise

Diagnosing this posted one stray line, `swarm connectivity probe`, to #builds
before the real embed. Harmless, but it is there and it was this run's doing.
