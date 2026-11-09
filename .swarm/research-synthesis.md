# Wave 1 synthesis — run 09-11-26

## What ran, and what did not

**Dispatched (7):** C1 dead code, C2 TypeScript strictness, C3 bundle/perf, C4 security,
C5 commit review, R8 accessibility, R6 SEO (repository-only).

**NOT dispatched (6): R1, R2, R3, R4, R5, R7.** All six depend on external web access.
Egress was tested before Wave 1 and every research host returned `000` — no response at
all — including the project's own production site. Full results in
`.swarm/egress-check-09-11-26.md`. Dispatching them would have spent 6 of the 25
subagent slots to produce competitor teardowns and community-sentiment reports with no
reachable sources. Prior runs recorded exactly that (VGC-255 notes R1's
"community-sentiment half is low-confidence as a result"), and the failure mode is worse
than waste: unsourced competitor or sentiment claims filed as Linear tickets would
pollute an already-crowded board with fabricated findings.

**PostHog: skipped for the whole run.** `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are
unset (VGC-220). No error-event, rage-click or funnel data informed any ranking below,
and no `posthog-signal` tickets could be filed. Every ticket considered tonight therefore
has `posthog_signal: false` — absence of evidence, not evidence of absence.

**No drafts were produced.** The no-send guardrail routes marketing/outreach output to
`.swarm/drafts/`. Since R3, R4 and R7 did not run, there was no sourced research to draft
from, and inventing marketing copy from nothing would be worse than producing none.
`.swarm/drafts/` therefore contains no new files this run.

---

## The one finding that dominates all others

**Review throughput is the binding constraint, and it is now measurable.**

VGC-265 argued this in August. Tonight it is confirmed with hard numbers, and the
specifics in that ticket are stale (it says "~30 unmerged nightly branches"; there are
two branches and 22 commits).

| Measurement | Value |
|---|---|
| Open issues on the board | 130 |
| Issues sitting in **In Review** | 61 |
| ...of those, already merged into `main` | **38** |
| Unmerged branches | 2 (22 commits) |
| ...with an open PR | 1 (PR #91, draft, unreviewed 7 days) |
| ...with **no PR at all** | 1 (`ccr-643ddaf1-yj2dyf`, security hardening) |
| Tickets dispatched for implementation tonight | 4 |
| ...that turned out to be **already complete** | **3** (VGC-226, VGC-260, VGC-261) |

Four independent pieces of tonight's work collided with already-finished code:

1. **VGC-226** (rental code) — fully built on `main`: editor input, copy button, QR code,
   schema field, 58 references. Agent stood down; zero lines changed.
2. **VGC-260** (version-diff key mismatch) — fixed with tests in `8f7a266` (21 Sep),
   including a `describe` block named for the bug. 26/26 pass.
3. **VGC-261** (strict flags) — all four enabled since August, plus a fifth; the
   `sprite-url` bug it names already fixed with a regression test.
4. **C4's top new security finding** (og:image Blob not revoked when a report goes
   private) — already fixed by `d0b0ac9` on unmerged PR #91.
   **C3's top perf deferral** (CookieBanner off the shared chunk) — already done by
   `5859aff` on the same unmerged PR.

So the swarm spent a meaningful fraction of tonight rediscovering work that exists but
has not been merged. Adding implementation capacity cannot fix that.

---

## Top 5 highest-leverage opportunities

1. **Merge the queue, in this order: `ccr-643ddaf1-yj2dyf`, then PR #91, then this
   branch.** Nothing else on this list competes. The first branch has one commit and no
   PR, which makes it the most likely work in the repo to be lost outright.
2. **Reconcile the 38 In Review tickets to Done.** A bulk, low-risk board action with
   per-ticket commit evidence in `.swarm/linear-pending-09-11-26.md`. This is what makes
   the board visibly move.
3. **Resolve VGC-330 (248 EVs = 31 or 32 SP).** C5 narrowed this from "needs a game-rules
   ruling" to a concrete defect: `b14c717` was an **incomplete cherry-pick**. Its message
   leads with "deleting the guard is the whole fix", but the diff contains no change to
   `evToChampionsSp` — `stat-calculator.ts:141` still hard-clamps `if (ev >= 248) return
   32`, contradicting the `ceil(EV/8)` rule documented three lines above. Only the test
   half landed, so `f223d3e` flipped the assertions back. `sp-docs-drift.test.ts` cannot
   catch it because it derives the cap from the code and its loop stops at `sp < 32`.
   A product ruling is still needed on the boundary, but the code change is then
   mechanical and the loop stops.
4. **Server-render `/s/[id]`.** ~5,000 sitemapped share URLs render only JSON-LD, an
   sr-only `h1` and a spinner before a client redirect to `/?s=<id>`, which canonicalises
   to the homepage. The renderable URL self-denies and the indexable one is empty
   (VGC-275/318, confirmed and worse than filed).
5. **Remove FAQPage JSON-LD from the 82 pages that do not render an FAQ.** Filed as
   VGC-317 for the homepage; the audit found it on all 81 Mega guide pages too, where
   `faqItems` is never passed to `MegaLandingContent`. Structured data claiming absent
   content carries manual-action risk on the SEO-critical cluster.

## Top 5 quick-win issues

1. **12 dead-code deletions** (~50 LOC, 14 files), re-confirmed from the October report
   where none were acted on. Applied tonight, minus two deliberate exclusions.
2. **`removeShareOgImage` fail-opens on Redis**, so a Blob can outlive its 90-day key
   (C4, new medium — distinct from the privacy bypass already fixed on PR #91).
3. **`/compare` lazy-load `effective-form`** — 81.1 KB gz, the biggest single-route win,
   and invisible to the existing bundle tripwire.
4. **Mechanical a11y fixes** — aria-labels, alt text, heading levels, reduced-motion
   guards (R8).
5. **Correct the "restricted legendaries are banned" claim** in homepage JSON-LD
   (`JsonLd.tsx:212`) and `/faq` (`faq/page.tsx:98`), which contradicts
   `champions-legality.ts:224-235` (max 2). Blocked on VGC-290's open ruling.

## Blockers that stopped work tonight

| Blocker | Effect | Ticket |
|---|---|---|
| No Linear write path | Steps 6/6B could not run; all board updates are manual | new, §4.1 of linear-pending |
| Egress blocked (`000` on every host) | R1-R5, R7 not dispatched | VGC-255 |
| PostHog creds unset | No telemetry cross-referencing or signal tickets | VGC-220 |
| No Vercel token or MCP | Could not verify env vars or pull webhook logs; VGC-236 unsafe to action | — |
| VGC-330 needs a product ruling | The EV-to-SP boundary stays contradictory | VGC-330 |
| VGC-290 needs a rules ruling | Restricted-legendary claims stay contradictory | VGC-290 |

## High-conflict-risk files

`.swarm/main-changed-files.md` is **empty** — `main` has had no commits in 7 days, so
there is no conflict risk from main moving. Risk comes instead from the two unmerged
branches. One file collides: `src/app/changelog/data.ts`, where PR #91 and this run both
insert a November 2026 section at the same line. It is a pure insertion collision;
resolution is "keep both, v5.31 above v5.30". Detail in `.swarm/conflicts.md`.

Deliberately avoided tonight to prevent further collisions: `src/lib/sharing/url-codec.ts`
(PR #91 deletes `toBase64Url`), the og:image revocation path, and the CookieBanner
deferral.

## A divergence worth catching before PR #91 merges

Three different EV-vs-SP unit heuristics are live, and they are **diverging**:
`isSpFormSpread` (per-Pokemon, ignores total), `CompareContent.tsx:133` (team-wide, also
rejects total > 66), `detect-archetype.ts:87` (total only, no per-stat cap). Commit
`8ea894b` on PR #91 widens only the first, so after that merge `/compare` will show EV
maths where the report page is correct. VGC-291's new `statForm` field (commit `75dbf32`,
tonight) is the foundation for collapsing these deliberately — but it must be a decision
per call site, not a blind dedupe, because the three rules genuinely differ.
