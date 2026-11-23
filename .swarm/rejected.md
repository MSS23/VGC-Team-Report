# Rejected and declined — run 23-11-26

## Rejected at the verification gate: NONE

Every change committed tonight passed cold `tsc --noEmit --incremental false`,
the full `vitest` suite, `next build` and `eslint` before being committed.
Nothing was dropped for a red gate, and no commit was made from a red tree.

Final state: tsc exit 0, **803 tests passing across 84 files** (up from 795 at
run start), eslint 0 errors / 66 pre-existing warnings, build clean.

One test did fail mid-run — `no-hardcoded-secrets.test.ts`, while its agent was
still writing it. It was not committed in that state; the agent finished, the
cause turned out to be the guard correctly flagging a credential-shaped literal
in tonight's own audit report, and the fix landed green (see VGC-350 commit).

## Declined deliberately — judgement calls, not failures

**1. `List-Unsubscribe-Post` header.** A code review called this a one-line fix.
It was declined. RFC 8058 one-click means the provider POSTs the
List-Unsubscribe URL and the opt-out completes unattended; the target is
`/dashboard/notifications`, a Clerk-protected page, so an unauthenticated POST
cannot unsubscribe anyone. Shipping the header would report success to Gmail
while the digest kept arriving, and that user's next action is "report spam" —
worse for deliverability than the honest current state. What shipped instead is
a guard-rail test pinning the invariant, written to permit the header
automatically once the target stops being a `/dashboard/` page. Urgency is low:
the cron caps at `MAX_USERS=500`/week against Gmail's 5,000/day threshold.
Filed as a ticket (the real fix is a token-authenticated POST endpoint).

**2. Next.js upgrade.** `next build` halts once per invocation with
`SecurityFatalError`, and the audit confirmed one advisory plausibly reaches
this deployment (GHSA-f3mh, HttpOnly cookie exposure, 6 `runtime = "edge"`
routes carrying Clerk session cookies). The fix is an **in-range patch**
(`> 16.4.4`), not a breaking major — so this was genuinely tempting. Declined
because `package.json` AND `package-lock.json` are both owned by #91, and a
lockfile conflict is the single conflict the merge-order analysis confirms does
**not** exist anywhere in the current operation. Upgrading tonight would have
manufactured the worst conflict in the set. The Next CLI also asks for human
confirmation before `next upgrade`, and no human was awake. Filed as an urgent
ticket with a carve-out from VGC-351.

**3. VGC-347's ~47 LOC "mechanical batch".** All 20 items confirmed in PR-owned
files. Only the i18n portion was actionable; that shipped.

**4. VGC-330 and VGC-290 ("[Ruling needed]").** Both need a human ruling against
the official Champions ruleset, and no authoritative source is reachable from
this container (VGC-255). Three prior runs have flipped the 248-EV assertions
back and forth; a fourth flip would continue the loop rather than end it. Left
untouched, deliberately. A partial was available for VGC-330 (making
`llms-full.txt` self-consistent with shipped code without ruling anything) and
was not taken, to avoid muddying a ticket that needs one clean decision.

**5. VGC-289 (Reg M-C Megas).** Needs the canonical M-C Mega list, which is not
in the repo and not reachable here. Shipping a fabricated legality dex is worse
than shipping nothing when the product's credibility rests on its legality
checks.

## Blocked by PR ownership — assessed, correctly deferred

These were each examined and are implementable only after the open PRs merge.
Their own descriptions already say so; tonight's run confirmed it per file
rather than taking it on trust:

`VGC-344` (type-colour contrast — MegaLandingContent + ChampionsContent, both
owned) · `VGC-346` (/blog + /explore/spreads links — Navbar, PageFooter,
explore/** all owned; `/explore/spreads` does not exist on `main` at all) ·
`VGC-349` (SEO titles, stale /tools/ev-to-sp, homepage FAQ JSON-LD — all four
files owned) · `VGC-353` (SpeedTierChart harness — the component is modified by
all three PRs) · `VGC-345` (collaborator fork fidelity — fork route owned) ·
`VGC-318` (/s/[id] crawlability — **already implemented on #93**, so re-doing it
would be pure duplication) · `VGC-236` (drop legacy env name — needs human
Vercel verification first).

## Not attempted — out of scope by run policy

`VGC-60, 147, 148, 184` and the other marketing/outreach tickets: the run's
no-outbound-sending rule makes these drafts-only, and none had a draft worth
producing that prior runs have not already filed.
