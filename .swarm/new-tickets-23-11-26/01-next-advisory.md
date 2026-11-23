## Source

`.swarm/c4-security-23-11-26.md` §2 and §4 (overnight swarm, 23 Nov 2026).

## Finding

`npm audit` reports **23 advisories (16 moderate, 7 high)**. The count matches the 16 Nov audit, but the **composition has changed**, and that changes the conclusion.

The 16 Nov audit concluded "none prod-reachable", and **VGC-351** proposes accepting and documenting them on that basis. That verdict **no longer holds**: `next@16.4.3` now carries 7 moderate advisories (affected range 16.0.0–16.4.4) that **postdate** the 16 Nov run.

Of those 7, one applies to this app:

* **GHSA-f3mh — HttpOnly cookie exposure on Edge runtime routes.** The repo has **6 routes declaring `runtime = "edge"`**, so the affected code path is present. (The other 6 advisories need `use cache` or `next/image`, neither of which this app uses.)

The remaining 22 advisories re-verify as dev-only or loaded-but-uninvoked, so the accept-and-document approach is still right **for those 22**.

## Why this is separate from VGC-351

VGC-351's reasoning is "chasing breaking upgrades for unreachable code is not a good trade". That reasoning is sound and still applies to the other 22. It does **not** apply here, for two reasons:

1. This one **is** reachable.
2. It is an **in-range patch**, not a breaking major — `next@^16.4.3` → `16.4.5+` satisfies the existing semver range. No breaking upgrade is involved.

So VGC-351 should be actioned with an explicit **carve-out for `next`**.

## Why the swarm did not do it

`package.json` and `package-lock.json` are **both** modified by unmerged PR #91. Bumping Next tonight would have put a lockfile conflict in front of the human on top of the three PRs already waiting — a lockfile conflict being the one conflict the merge-order plan confirms does **not** currently exist anywhere in the operation (`.swarm/merge-order-plan-23-11-26.md` §1).

Separately, `next build` in this repo now halts once per invocation with
`Error [SecurityFatalError]: Your version of Next.js is affected by a known security vulnerability`
and recommends `next upgrade --agent=security`. The swarm did **not** run it: it rewrites dependencies, and the Next CLI's own text asks for human confirmation. A plain re-run of `npm run build` proceeds, which is why the gate still passes.

## Suggested action

1. Merge PR #91 (which owns the lockfile).
2. Then `npm i next@^16.4.5` (or whatever the current in-range patch is), run the gate, and ship it on its own.
3. Then action VGC-351 for the remaining 22, with this carve-out noted.

Scope: S once #91 is merged.
