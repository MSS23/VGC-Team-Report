# Swarm Run — 22 May 2026

Branch: swarm-nightly-2026-05-22
Run started: 22 May 2026 00:07 BST
Container: fresh clone, no .env.local (no Linear/Discord/PostHog creds in env)

Behind/ahead at start: 0 ahead, 0 behind origin/main (fresh branch)

## Step 0C — Linear webhook investigation
- Handler at src/app/api/webhooks/linear/route.ts had two real bugs:
  1. Read x-linear-signature header but Linear sends linear-signature
  2. Returned 500 on unknown event types and 500 on empty bodies
- Fixed in commit f2121c3 as VGC-WEBHOOK (first commit of run, before any Wave 2 work).
- Env var name: code now accepts both LINEAR_WEBHOOK_SIGNING_SECRET (canonical) and LINEAR_WEBHOOK_SECRET (legacy) so it works against the existing Vercel env config without manual rename.

## Subagent budget
- Wave 1: 7 dispatches (C1, C2, C3, C4, C5, R6, R8). All returned.
- Wave 2: 4 dispatches (W1 touch targets, W2 a11y labels, W3 Save dedup, W4 type fixes). All returned.
- Total: 11 of 25 cap.

## Commits this run (in order)
1. f2121c3 VGC-WEBHOOK Linear webhook signature header
2. c4dcdce VGC-208 rental code in ShareModal
3. da4ab79 VGC-211 Pikalytics dead code
4. 03eac97 swarm: dead exports (C1)
5. 5bb4668 swarm: noindex collab URLs (R6)
6. 5e5ce29 swarm: weekly digest cross-product fix (C5)
7. b9ad0fd swarm: type-soundness (C2)
8. f5c69f5 swarm: 44px touch targets (R8)
9. 540812c swarm: a11y labels (R8)
10. 9b63c8f swarm: Save toggle dedup (C5)
11. 14b249c swarm: GraphQL teamId binding (C4)
12. 0fded52 swarm: Updates page v5.20
