## Source

`.swarm/c5-commit-review-23-11-26.md` finding #2 (overnight swarm, 23 Nov 2026), independently re-verified by the orchestrator against `main`.

## The bug

`sendEmail` in `src/lib/email.ts:32` returns `null` for **two conditions that are not alike**:

```ts
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.warn("RESEND_API_KEY not set, skipping email");
  return null;          // ← PERMANENT config state
}
...
if (!res.ok) {
  console.error("Resend error:", res.status, text);
  return null;          // ← TRANSIENT upstream failure
}
```

`src/app/api/webhooks/clerk/route.ts:78-85` treats them identically:

```ts
if (!result) {
  if (svixId) await cacheDel(`clerk:svix:${svixId}`);   // release the dedupe key
  return NextResponse.json({ error: "Email send failed" }, { status: 500 });  // ask Clerk to retry
}
```

So if `RESEND_API_KEY` is ever unset or removed in an environment, **every** `user.created` delivery returns 500, releases its own idempotency key, and asks Clerk to retry — forever. Retrying cannot help, because the condition is configuration, not transience.

## Why this matters more than it looks

**This is the exact failure mode that got the Linear webhook auto-disabled.** See the comment block at `src/app/api/webhooks/linear/route.ts:69-75`: answering a non-retryable condition with a retryable status drove the failure count up until Linear disabled the endpoint, and commit `13dcffc` fixed it there by answering 200 and dropping the event. The Clerk handler has the same shape and has not had the same fix.

Clerk also disables endpoints that fail persistently, and this handler's `user.created` branch is the only thing creating welcome emails.

## Fix

Distinguish the two cases. The handler needs to know *why* the send failed:

* **Missing API key (permanent)** → log once, return **200**, do **not** release the dedupe key. The email is genuinely unsendable; a retry cannot change that.
* **Resend returned an error (transient)** → current behaviour is correct: release the key, return 500 so Clerk retries.

The cleanest shape is for `sendEmail` to stop using `null` for both — e.g. return a discriminated result (`{ ok: true, data }` / `{ ok: false, reason: "unconfigured" | "upstream" }`), which also fixes this for the other callers that currently cannot tell the difference either.

No test shipped with `10dfd74` for this path; one should name this bug.

## Note on an adjacent claim in the same merge

`10dfd74`'s message states *"Export buildWelcomeEmailHtml for direct use without the error-swallowing wrapper."* On `main`, `buildWelcomeEmailHtml` is at `src/lib/email.ts:206` and is **not exported** (plain `function`). Worth confirming the intended refactor actually landed.

## Files

`src/lib/email.ts`, `src/app/api/webhooks/clerk/route.ts` — **both modified by unmerged PRs**, which is why the swarm filed this instead of fixing it. Do after the open PRs merge.
