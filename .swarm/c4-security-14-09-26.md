# C4 security audit — 14 Sep 2026 — REPORT WITHHELD FROM THIS REPOSITORY

The full report is **deliberately not committed**. It is retained outside the
repo for this session only.

## Why

This repository is PUBLIC (verified via the GitHub API on 14-09-26:
`"visibility": "public"`, `"allow_forking": true`, `forks_count: 0`).

The audit located a **live, unrotated credential in reachable git history**.
The full report names the exact commit and file. Committing it here would
publish a step-by-step pointer to a working secret, to the whole internet,
while that secret is still valid — turning a latent leak into an advertised one.

The report contains no secret VALUES (the auditor redacted them correctly).
The risk is the location data, not the text.

## What the human needs to know — no exploit detail

1. **P0 — rotate a leaked Discord webhook token.** It was committed to a source
   file, later deleted from the working tree, and is still reachable in history.
   Deleting a secret from the tree does NOT revoke it.
   **Fix: delete the webhook in Discord → Server Settings → Integrations →
   Webhooks, create a replacement, and update the corresponding Vercel env var.**
   Rotation is the only step that actually closes this. The swarm did not do it:
   rotating is an outward-facing destructive action on a live Discord server and
   would break the feedback feature until the env var is re-pointed — not an
   appropriate unattended action.
   Could not be filed in Linear: the workspace is at its free-plan active-issue
   cap (`USAGE_LIMIT_EXCEEDED`). Surfaced in the PR body and Discord instead.

2. **P1 — `.swarm/` should not be git-tracked in a public repo.** ~145 files of
   nightly output, including prior security audits describing unfixed bugs, are
   published and forkable. Recommendation: keep research notes tracked, route
   security findings to a private channel. Needs an owner decision; the standing
   swarm prompt currently instructs the opposite.

3. **P1 — `next@16.3.0`** carries two critical advisories. One is Windows-only
   (N/A on Vercel); the other is mitigated by the existing `remotePatterns: []`
   and no reachable path was found. Fix is an in-range `npm update next`.
   Not applied tonight: a framework bump is not a safe unattended change and
   deserves its own PR.

4. **npm audit triage:** 19 vulnerabilities, only 12 reach production. The
   high-count drivers other than `sharp` are dev-only, verified with
   `npm ls --omit=dev`. VGC-248's framing is stale.

5. **Confirmed fixed since the Aug 10 audit:** XFF spoofing, CORS wildcard,
   private-report comments, Linear webhook replay protection, Allow-Credentials.
   The Linear webhook now verifies correctly (raw-body HMAC, length-guarded
   `timingSafeEqual`); the timestamp-omission bypass was checked and is not
   exploitable. **VGC-246 appears already fixed** across every read path —
   verify against the ticket text, then close.

6. **Still open (pre-existing, no new detail published here):** creator-profile
   takeover (P1) and `creatorName` spoofing (P2).

## Restoring the full report
It exists only in this session's scratchpad and will be lost when the container
is reclaimed. If you want it, ask for it in-session before that happens, or
re-run C4 once the credential is rotated and `.swarm/` publication is resolved.
