## Source

`.swarm/c4-security-23-11-26.md` §3, finding M-1 (overnight swarm, 23 Nov 2026).

## Finding

`src/app/api/webhooks/clerk/route.ts:83`:

```ts
console.error("Failed to send welcome email to", primaryEmail.email_address);
```

Every welcome-email failure writes a registered user's **email address** into platform log retention.

Not attacker-triggerable and not a breach. But it is avoidable PII in logs, and `data.id` — the Clerk user ID — is already used for exactly this purpose eleven lines earlier (`:68-70`) and identifies the user just as well for debugging.

Note this line fires on *every* retry of the loop described in the companion ticket about the Clerk retry loop, so a single misconfiguration writes the same address to the log repeatedly.

## Fix

One line: log `data.id` instead of the email address.

## Scope of the wider audit

The security audit checked the other 7 `console.*` calls that carry sensitive-looking context across all 58 API handlers. They log counts, user IDs, or the *absence* of a configured env var — never a value. This is the only PII-in-logs instance, and no route logs a secret.

## Files

`src/app/api/webhooks/clerk/route.ts` is modified by an unmerged PR, so the swarm filed this rather than fixing it. Trivial to fold into the retry-loop fix.
