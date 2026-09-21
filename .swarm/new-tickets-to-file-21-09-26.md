# Tickets that could NOT be filed — Linear workspace is at its issue limit

**Run:** 21 Sep 2026, branch `claude/loving-sagan-sp9n85`.

Eight Backlog tickets were composed from this run's research. `issueCreate` was
rejected for every one of them:

```
USAGE_LIMIT_EXCEEDED — "You've exceeded the free issue limit for this workspace.
Please upgrade or contact sales@linear.app for a free trial."
meta.usageMetric: activeIssueCount
```

Comments posted fine (VGC-265, VGC-246, VGC-247, VGC-213 all succeeded), so the
API key and permissions are healthy — the workspace simply cannot accept new
issues.

**Active issue count at time of run: 108** — In Review 32, Backlog 62, Todo 12,
In Progress 1, Duplicate 1.

This turns the board reconciliation from hygiene into a prerequisite: **closing the
20 already-merged tickets listed on VGC-265 is what makes room for these.** Until
then no future swarm run can file anything either, so research findings will keep
being rediscovered and lost.

The eight specs are preserved below verbatim so they can be filed once capacity
exists (or pasted straight into Linear by hand).

---

## 1. [Champions] Regulation M-C is entirely unsupported — dex, megas, legality and SEO all stop at M-B

**Priority:** Urgent · **Labels:** auto-research, Web App

Reg M-C went live on 8 Sep 2026. This codebase has no notion of it.

**Verified this run:** `grep -rn "M-C"` across `src/` returns zero matches in
`src/lib/data` and `src/lib/validation`. The only regulation literals anywhere in
`src/lib` are `"M-A"` and `"M-B"` (`src/lib/data/mega-pokemon.ts:926-927`).

Consequences:
- `CHAMPIONS_DEX` and the mega list carry no M-C species or M-C megas, so
  `src/lib/validation/champions-legality.ts` cannot validate an M-C team. A legal
  M-C team will be reported as illegal.
- `/champions` and the SSG mega guide pages under `src/app/champions/[pokemon]/`
  have no M-C entries, so the sitemap and the format's landing pages stop at M-B.
- Both `public/llms.txt` and `public/llms-full.txt` describe Champions as
  "Regulation M-A/M-B".

Competitors already carry M-C in indexed page titles (Pikalytics, MetaVGC, Pokémon
Zone, crob.at), so this is a ranking gap as well as a correctness gap.

**Before implementing:** the exact M-C species and mega pool needs confirming
against a canonical source (Serebii / official). The swarm container cannot reach
most of those hosts, so this needs a human or a run with wider egress. Do not
derive the pool from an LLM's memory.

Source: `.swarm/r1-competitor-seo-21-09-26.md`.

---

## 2. [SEO] Standalone /speed-tiers page — the engine already exists but only renders inside a report

**Priority:** High · **Labels:** auto-research, SEO

`src/components/report/SpeedTierChart.tsx` computes speed tiers already, but only
ever inside a report. There is no standalone, indexable speed-tier page.

Multiple competitors rank on a `/speed-tiers` route. This is a
wrap-an-existing-component job rather than new logic, which makes it an unusually
cheap SEO surface. Pairs naturally with `/tools/ev-to-sp` as a small "/tools" cluster.

Source: `.swarm/r1-competitor-seo-21-09-26.md`.

---

## 3. [SEO] Comparison and guide pages — a competitor owns /pokepaste-alternative, which is our positioning

**Priority:** High · **Labels:** auto-research, SEO

Verified missing this run: zero hits for "pokepaste-alternative" in the repo, no
`/vs/` routes, no `/guides` route.

crob.at ranks on `/pokepaste-alternative` and `/guide/share-showdown-teams` — both
describe exactly what this product does. We currently get cited by AI assistants
only where a page title literally matches the query.

Suggested: 2–3 static pages. Content drafts stay in `.swarm/drafts/` for human
review before publishing — nothing gets posted by the swarm. **Check the existing
drafts first**: `.swarm/drafts/` already holds unshipped content from prior runs.

Source: `.swarm/r1-competitor-seo-21-09-26.md`.

---

## 4. [Feature] Replica-code → paste/report reverse import

**Priority:** Medium · **Labels:** auto-research, Feature

VGCPastes publicly credits a volunteer for "all the help converting replicas to
pastes" across Reg M-A, M-B and M-C — i.e. this conversion is currently done by
hand, at volume, every regulation.
Source: https://x.com/VGCPastes/status/2043019220095734204

Opposite direction to VGC-226 (rental-code field on the editor): that stores a code
on a report, this turns a code into a report. The reverse direction is the one with
demonstrated manual labour behind it.

Feasibility unclear — depends whether replica/rental codes can be resolved
programmatically at all. Worth a spike before committing.

Source: `.swarm/r3-community-mobile-21-09-26.md`.

---

## 5. [Feature] Official Play! Pokémon team-list (team sheet) PDF export

**Priority:** Medium · **Labels:** auto-research, Feature

At least eight independent tools exist purely to generate the official Play!
Pokémon team list from a paste — one (teamsheet.gg) brands itself "Pokemon Team
Reports", which is our name. Source: https://teamsheet.gg/generator

We already have `convertToChampionsSp` and a working jsPDF export path — precisely
the piece that forced retreatcost to build a separate Champions-specific generator.

Source: `.swarm/r3-community-mobile-21-09-26.md`.

---

## 6. [Security] Clear the two dev-only high-severity advisories (browserslist, js-yaml) via npm overrides

**Priority:** Medium · **Labels:** auto-research, Infrastructure

After this run's Next.js 16.3.5 bump, `npm audit` is at 17 findings: **0 critical**,
2 high, 14 moderate, 1 low.

The two remaining highs are dev-only and never ship to production:
- `browserslist <=4.28.6` — via `eslint-config-next > eslint-plugin-react-hooks > @babel/core > @babel/helper-compilation-targets`
- `js-yaml 4.0.0 - 4.3.1` — via `eslint > @eslint/eslintrc`

Both need an `overrides` block in package.json, since no direct dependency bump
reaches them. That is a deliberate decision (overrides can silently diverge from
what the upstream tool expects), so it was not applied unattended.

Also worth recording: `npm audit fix` currently aborts on this tree with an npm bug
— `Cannot read properties of null (reading 'edgesOut')` — so fixes must be applied
as explicit installs.

Distinct from VGC-248 (12 moderate vulns needing breaking upgrades) and VGC-221
(Clerk major bump).

Source: `.swarm/c1-security-deadcode-21-09-26.md`.

---

## 7. [Process] .swarm/ is tracked in git — 184 files and 2.2 MB of agent scratch notes in the repo

**Priority:** Medium · **Labels:** auto-research, Infrastructure

`.swarm/` is committed: **184 tracked files, 2.2 MB**, against a total tracked size
of 7.9 MB excluding node_modules/.git/.next. Roughly 28% of the repo is nightly
agent scratch output, growing every run. `.planning/` adds another 784 KB across 72
files.

`.gitignore` already excludes the equivalent local-only tool directories —
`.claude/`, `.agents/`, `.codex/` — so `.swarm/` being tracked looks like an
oversight rather than a decision.

Concretely, `.swarm/drafts/` holds **9 near-duplicate Reddit outreach drafts**, 7
SEO draft sets and 5 AEO/citation drafts, regenerated by successive runs and never
sent.

Options:
1. Gitignore `.swarm/` and `git rm -r --cached` it.
2. Keep only the latest run's notes, prune each run.
3. Move nightly notes out of the repo entirely; keep a short summary.

Needs a human decision: removing 184 tracked files is not the swarm's call, and the
routine that drives these runs currently *instructs* the swarm to commit `.swarm/`,
so the routine needs updating alongside whichever option is chosen.

---

## 8. [Chore] llms.txt says the EV budget is 510, llms-full.txt says 508

**Priority:** Low · **Labels:** auto-research, SEO

Both files are published, both are read by AI crawlers, and they disagree:
- `public/llms.txt:29` — "the 510-EV / 252-per-stat budget of standard VGC formats"
- `public/llms-full.txt:88` — "a maximum of 508 total EVs, with a cap of 252 in any single stat"

Both are defensible (510 is the hard cap, 508 the most usefully allocated as
252/252/4), but serving two different numbers from one domain is the kind of
inconsistency that makes an assistant distrust the source.

Pick one, state the other parenthetically, and pin it in
`src/lib/analysis/__tests__/sp-docs-drift.test.ts` beside the SP assertions added
this run.

Deliberately left out of this run's llms-full.txt fix to keep that change scoped to
the SP definition.
