# Proposed Linear tickets — 2026-09-07 swarm

**BLOCKED: the Linear workspace is at its issue cap.** Every `issueCreate` this run returned
`USAGE_LIMIT_EXCEEDED`. Goal B ("compound the board") is structurally impossible until issues
are closed or the plan is upgraded — this is the second consecutive run to hit it (24-08-26
recorded the same).

The swarm deliberately did **not** free capacity by closing or cancelling existing issues:
deciding an issue is finished is a human call, and the run's own rules forbid moving tickets
to Done.

**Unblock:** close the ~32 In Review tickets after merging the open PRs (that alone frees
plenty), or upgrade the Linear plan. Then these can be filed.

Priority key: 1 = Urgent, 2 = High, 3 = Medium, 4 = Low.

---

## 1. [P0][SECURITY] Rotate the leaked Discord feedback webhook — live token in public git history
**Priority 1 · Infrastructure · auto-research**

Full write-up: `.swarm/P0-leaked-discord-webhook-07-09-26.md`. A real 68-character Discord
webhook token is in reachable git history of a public repo (added `5da513a`, dropped from the
tree in `28f5b8b`, never rotated). Verified by hash comparison to be the **feedback** webhook,
not `DISCORD_BUILDS_WEBHOOK`, so rotating it will not break build notifications.

Human action, ~5 min: delete + recreate the webhook in Discord, update `DISCORD_FEEDBACK_WEBHOOK`
in Vercel Production, redeploy. The swarm did not rotate it — revoking a live credential blind
could silently break production feedback, which is a human's call.

*Filed as a comment on VGC-164 this run, since it could not be created as its own issue.*

---

## 2. [PROCESS] Merge the 4 open swarm PRs — the board cannot move until they land
**Priority 1 · Infrastructure**

Supersedes / updates VGC-265 with exact numbers. See `.swarm/pr-backlog-analysis-07-09-26.md`.

`origin/main` has had **no commit since 24 August**. Four draft PRs hold ~57 substantive
commits. 32 Linear tickets sit In Review describing code that is not on main.

Merge order, cheapest first (conflict markers measured against current main):

| PR | Branch | Age | Conflicts | Contains |
|----|--------|-----|-----------|----------|
| #76 | claude/loving-sagan-ib785e | 1 wk | **0** | WCAG fixes, VGC-270, paste header bug, team-graphic visibility |
| #75 | claude/loving-sagan-zs6xpl | 2 wk | 1 | P0 credential note, VGC-275 SSR, VGC-257, flaky-test fix, private-report PNG leak |
| #74 | claude/loving-sagan-853anq | 3 wk | 4 | VGC-269, VGC-232, VGC-225, VGC-273, VGC-271, VGC-268 |
| #72 | claude/loving-sagan-t7immy | 5 wk | **58** | ILIKE injection, consent gating, VGC-251, VGC-245, VGC-181, VGC-224 |

PR #72 is rotting badly — cherry-pick its security commits rather than merging it whole.

---

## 3. [DATA] Reg M-C roster — dex, megas and legality once the official list publishes
**Priority 2 · Feature · auto-research**

Tonight shipped the M-C **format gate** (`isChampionsFormat` now recognises Reg M-C, so M-C
pastes get SP, no Tera, and Champions speed tiers instead of rendering as classic EV teams).

Deliberately **not** shipped: the M-C species and mega rosters. The official list was not
verifiable at run time and fabricating it would make the legality validator confidently wrong —
worse than having no data. M-C teams currently skip the roster check rather than being
mislabelled illegal.

Follow-up when the official roster publishes: populate `champions-dex.ts` / `mega-pokemon.ts`,
re-enable the roster check for M-C, add `/champions` guide pages for the new Megas (including
the Z-Megas), and extend the legality tests.

---

## 4. [SEO] `/s/[id]` still serves a client redirect instead of the report
**Priority 1 · SEO** — *already implemented in PR #75 (`b7000d7`), just unmerged.*

`src/app/s/[id]/page.tsx:229` renders only `<ShareRedirectClient>`; `redirect.tsx:9-11` is a
`useEffect` `router.replace()`. `sitemap.ts:40-47` emits ~5,000 such URLs, so every shared
report is an empty shell to crawlers. Duplicate of VGC-275 — **do not re-implement, merge #75.**

---

## 5. [SHARE] Finished OG card is unreachable — `images: []` overrides the file convention
**Priority 2 · SEO**

`src/app/s/[id]/opengraph-image.tsx` is a complete 174-line OG image generator that builds and
deploys, but `images: []` at `page.tsx:131,140` overrides the Next.js file convention, so every
shared link unfurls as a small text-only `summary` card. The original "broken unfurl" reasoning
no longer applies — `public/og-default.png` exists. Small fix, large payoff on every share.

*Note: `/s/[id]/page.tsx` is rewritten by PR #75 — land this on top of #75, not before it.*

---

## 6. [MOBILE] InstallPrompt covers the share-view CTA for first-time viewers
**Priority 2 · Mobile**

`InstallPrompt.tsx:53-64` fires at 60s + 200px scroll with a z-61 scrim, covering `ShareViewCTA`
at z-30 (`ShareViewCTA.tsx:32`). A first-time viewer arriving from a shared link is asked to
install an app before being asked to make an account. Suppress the install prompt on `/s/[id]`,
or gate it behind the CTA being dismissed.

---

## 7. [MOBILE] Team card PNG export can't reach the native share sheet
**Priority 3 · Mobile**

`TeamCardExport.tsx:39-46` offers the PNG only as `<a download>`. On iOS that is close to
unusable for Instagram Stories or Discord. Add `navigator.share({ files })` with the existing
download as fallback.

---

## 8. [PERF/COST] Share view does 4 uncached Neon reads, querying the same rows twice
**Priority 2 · Performance**

`src/app/s/[id]/page.tsx:26-27` and `:167-168` query the same rows twice per view, with no
`revalidate`. Neon is on the 512MB free tier and this is the hottest public route in the app,
so this is a cost and latency issue, not just tidiness.

---

## 9. [SECURITY] PostHog webhook has no replay protection
**Priority 3 · Infrastructure**

`src/app/api/webhooks/posthog/route.ts:170-188` verifies a static bearer with no timestamp
window, so a captured request stays valid forever. Mirror the ~5-line timestamp check already
used in the Linear webhook handler (`webhooks/linear/route.ts:63-73`).

Also `:265` logs the full Linear API response, which is needless log surface. One-line fix.

---

## 10. [SEO] `public/llms-full.txt` still teaches AI crawlers "1 SP = 1 EV"
**Priority 1 · SEO** — *already fixed in PR #75 (`7c226a6`), just unmerged.*

Line 91 states SP and EVs are "interchangeable" and that "252 SP Atk" means 252 EVs. Every
clause contradicts `stat-calculator.ts` (66 total / 32 cap / first SP = 4 EVs then 8) — the
product's core differentiator, taught backwards to the crawlers most likely to cite it.

The guard test `sp-docs-drift.test.ts:14` reads only `llms.txt`, so CI stays green while the
long-form file is wrong. **Extend the guard to `llms-full.txt`** even after merging #75 —
otherwise this can silently regress again.

---

## 11. [CHORE] Dead code: 5 stock create-next-app SVGs, `asPokemonTypes`, 28 lines of dead CSS
**Priority 4 · Improvement**

From `.swarm/c1-dead-code-07-09-26.md` (HIGH confidence, zero-importer verified):
- `public/{file,globe,next,vercel,window}.svg` — 3,314 B, no references anywhere
- `asPokemonTypes` at `src/lib/data/dex-subset.ts:220-223` — also drop the now-unused
  `import type { PokemonType }` on line 38 or eslint fails CI
- `src/app/globals.css` lines 391-394, 443-445, 451-455, 457-459, 935-948

Deferred here rather than shipped: `globals.css` and `dex-subset.ts` are both touched by open
PRs, and ~4 KB is not worth adding conflict to a queue that is already 4 PRs deep.

---

## 12. [SEO] `/vs/pokepaste` and `/vs/pikalytics` comparison pages
**Priority 3 · SEO · Content**

Competitors own these high-intent queries (PokeSynergy has `/vs/pikalytics`, crob.at has
`/pokepaste-alternative`); we have no `/vs` route. Deliberately not auto-shipped — pages making
claims about named competitors are marketing copy and need human sign-off before publishing.

---

## 13. [BUG] `/tournaments` advertises past events as upcoming
**Priority 2 · Bug · SEO**

`TOURNAMENTS[]` is entirely 2025. `UPCOMING_TOURNAMENTS[]` still lists Indianapolis (May 2026)
and Worlds (Aug 2026) as upcoming — both now past — and emits `SportsEventJsonLd` for them, so
an indexed page is publishing structured data announcing events that already happened.

*Partially addressed by PR #75 (`8a2ed26`, Worlds dates). Re-check after merging.*

---

## 14. [UX] Champions converter leaves SP unspent with no guidance
**Priority 3 · Improvement**

Community norm is to spend all 66 SP. A `252 HP / 4 Def` paste converts to `32 HP / 1 Def`,
leaving 33 SP idle; we correctly refuse to pad but only flag the shortfall. Offer a one-tap
suggested allocation for the remainder in `/tools/ev-to-sp` and the editor.

---

## 15. [UX] Replica codes fail silently when the viewer lacks the Pokémon
**Priority 3 · Improvement**

Replica codes only apply if the viewer already owns every Pokémon and item, and no tool
surfaces that. Render an ownership checklist beside any replica code on a report.

---

## 16. [INFRA] Narrow VGC-255 — container egress is blocked, but the web tools are not
**Priority 3 · Infrastructure**

VGC-255 says the container "blocks every external data source". Half right, and the distinction
matters for every future run: container `curl` to any external host fails (verified: reddit,
pikalytics, google, the live site all return 000), but the **server-side `WebSearch` / `WebFetch`
tools work fine** and carried all research this run. Future swarm prompts should tell agents to
use those tools and never `curl`. `WebFetch` is separately blocked for `pikalytics.com` and
`pokepast.es` specifically.
