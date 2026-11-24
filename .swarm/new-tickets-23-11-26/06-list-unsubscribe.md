## Source

`.swarm/c5-commit-review-23-11-26.md` finding #5 (overnight swarm, 23 Nov 2026), re-verified by the orchestrator.

## Finding

`10dfd74`'s merge message states:

> Weekly digest emails now include List-Unsubscribe and **List-Unsubscribe-Post** headers pointing to /dashboard/notifications

On `main`, `src/app/api/cron/weekly-digest/route.ts:361` sets only:

```ts
headers: { "List-Unsubscribe": `<${APP_URL}/dashboard/notifications>` }
```

`List-Unsubscribe-Post` appears **nowhere** in `src/` (grep returns no hits outside this one header line). So the claimed RFC 8058 compliance did not land.

## Why both headers are needed

RFC 8058 one-click unsubscribe requires **both** `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`. Gmail and Yahoo require working one-click unsubscribe for bulk senders. `List-Unsubscribe` alone leaves the mail client to render a link.

## The harder half of the problem

The current target is `/dashboard/notifications`, an **auth-walled page**. RFC 8058 one-click means the mail provider issues a **POST** to that URL and expects the unsubscribe to take effect with no further interaction. A sign-in wall cannot satisfy that.

So adding `List-Unsubscribe-Post` on its own would be a *false* compliance signal: providers would POST and nothing would unsubscribe — arguably worse than the current honest-but-incomplete state.

The real fix needs a **token-authenticated, unauthenticated-POST unsubscribe endpoint**: a signed per-recipient token in the URL, a POST handler that flips `digestUnsubscribed` in Clerk `publicMetadata` (which the weekly-digest cron already checks), and no sign-in requirement. That is a new endpoint with a token scheme and a write path, which is why the swarm did not invent one overnight.

## Suggested action

1. Add a token-signed `POST /api/unsubscribe` (no auth) that sets `digestUnsubscribed`.
2. Point `List-Unsubscribe` at it and add `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
3. Keep the existing `/dashboard/notifications` link as the `mailto:`/browser fallback in `List-Unsubscribe`.
4. Test that a bare POST with a valid token unsubscribes and that an invalid token does not.

## Status this run

The swarm attempted only the honest, minimal part of this; see the run's PR for what (if anything) shipped. The endpoint work is this ticket.
