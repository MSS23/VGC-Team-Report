## Source

`.swarm/c5-commit-review-23-11-26.md` finding #3 (overnight swarm, 23 Nov 2026).

## Finding

Commit `f223d3e` ("test: keep the 248-EV SP cap assertions and let the share fetch validation settle") is **test-only**. Separately from the EV-to-SP assertion revert — which is already tracked as **VGC-330** and is explicitly *not* re-filed here — it also swapped a `setTimeout(0)` for a `setTimeout(50)` in order to absorb the dynamic `import()` that `282dbed` introduced into the share-fetch validation path.

A fixed 50 ms sleep that waits for a dynamic import to resolve is a **timing assumption, not a synchronisation point**. It passes on a warm, fast machine and will flake on a loaded CI runner or a cold module cache — and when it flakes it will look like a product bug.

## Fix

Await the thing the test actually depends on rather than sleeping past it: await the dynamic import's promise, flush pending microtasks explicitly, or use the test runner's own wait-for-condition helper so the test is deterministic regardless of machine speed.

## Scope

XS. Low priority — it is latent flakiness, not a current failure; the suite is green today (795 passing).

The file is modified by an unmerged PR, so the swarm filed this rather than fixing it.
