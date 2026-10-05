# R3–R5 UX Research — in-app feedback synthesis, ability-immunity audit, community scan

**Date:** 2026-10-05 · **Mode:** read-only research · **Analytics: no analytics available** (PostHog credentials
unavailable this run — every claim below is traceable to a Linear ticket, a file in this repo, or a cited public page).

---

## 0. Sampling caveat (read before acting on anything here)

Nine tickets, **but only three distinct people**:

| Submitter | Tickets |
|---|---|
| João Ludgero / LudgeroVGC (same email, `ludgero97@`) | VGC-238, 239, 240, 244, 249, 250 — **6 of 9** |
| Poke Peak (`pokepeakvgc@`) | VGC-252, 263 |
| Diggy Digg (`kevin.digiulio42607@`) | VGC-241 |

This is **depth, not breadth**. One engaged power user is effectively co-designing the roadmap. That is genuinely
valuable signal — he is the target persona and he is specific — but "users repeatedly ask for X" mostly means
"one excellent user asked for X repeatedly." Weight his *problem statements* heavily and his *solution designs*
moderately. Do not treat frequency counts here as demand estimates. No analytics available to check whether his
usage pattern (second-monitor, in-play) generalises.

Every submission is Windows + desktop, screens 1272×588 → 2549×1264. **Zero mobile feedback** — which says nothing
about mobile quality, only that this channel caught no mobile users. (The repo has had a large mobile overhaul;
`src/app/changelog/data.ts:199`.)

---

## 1. Themed synthesis of in-app feedback

### Theme A — "The team is the object; everything else is metadata" (information architecture)
**PRODUCT-DECISION.** The single most structural piece of feedback in the set.

- **VGC-240 #1:** tournament info should be *attached to* the team, not *lead* the report. His reasoning is the
  valuable part: leading with tournament results "immediately gives the report a retrospective focus
  ('where it was used') instead of a practical one ('how it works')", and it ignores that **one team is used across
  multiple tournaments**. Verdict: "The team should be the main object; tournament results should be metadata."
- **VGC-240 #2:** wants a "Common Modes" section **near the top**, with leads/modes/strengths/weaknesses/game plans.
- His acceptance test is quotable and should arguably become the product's north star:
  > "Could Aaron Zheng use this page while introducing a team on YouTube? If so, a beginner should be able to
  > quickly understand how to pilot the team."

This reframes the product from **archive** ("here is the team I used at X") to **playbook** ("here is how this team
is flown"). That is a positioning decision, not a layout tweak — it affects the slide order, the share preview, the
tagline, and what the first screen of a shared link shows a stranger. Note the one-to-many relationship he raises
(team → many tournaments) is a **data-model** implication, not just a visual reorder.

### Theme B — Modes are the product's centre of gravity, and they are an *in-play* surface
**PRODUCT-DECISION (hierarchy) + MEDIUM (lead visuals).**

Clean request → ship → praise → refine loop, all from one user:
- **VGC-239** requests a "Team Modes" system (which 2 lead / which 2 back) for *general, reusable* game plans,
  explicitly distinct from the existing matchup-specific planning, which he calls "excellent."
- **VGC-244** thanks the team for shipping it: "super useful!!"
- **VGC-250** refines it, with two distinct asks:
  1. **Conceptual hierarchy is inverted.** "The Mode is superior to the Lead, and so should be the first thing being
     shown. Afterwards, within each mode, there can be several leads." He then argues against himself — maybe just
     *collapse* Common Modes and Leads, since "the modes will already be somewhat evident in the different leads
     being proposed." Two viable designs, user is undecided → this is yours to decide, not his.
  2. **Lead presentation** should look like CybertronVGC's slide format (cited video, ts 08:00:
     `https://www.youtube.com/watch?v=JJhMx9ErPEs&t=5309s`), and he notes it is "super similar to what you already
     have in the Match-Ups section" — i.e. **reuse an existing component**, which lowers the cost.
  3. Explicitly scopes *out*: "The remaining of the Modes section (e.g., Weaknesses, Strengths) can remain as they are."

**The most commercially interesting sentence in the whole corpus:** "I find myself keeping it as second monitor as
I play!" That is a **live companion** use case, not a pre-tournament document. It implies a glanceable/low-chrome
reading mode (large type, no edit affordances, dense leads, dark). Nothing in the feedback asks for this directly —
it is an inference — but it would change what "done" means for Modes. No analytics available to size it.

### Theme C — Every UI element must declare its own meaning, or be removed; and let experts dismiss it once learned
**Mostly CHEAP-CODE-FIX.** This is the most *repeated* theme and the cheapest to act on.

The same complaint shape recurs four times across two users:
- **VGC-249 #1 — stat bar colours:** "I can not understand why some stat bars are green, others orange... Is it based
  on percentiles? Needs to be made explicit or removed **to avoid engaging us cognitively without need**." That last
  clause is the whole theme in one phrase.
- **VGC-252 — the fix created a second-order problem:** once you *have* understood the caption, it is noise.
  "Can we get a setting to hide the note about bar color not equaling quality?" Teaching UI must be dismissible.
- **VGC-249 #2b — speed tiers provenance:** "which is the 'meta' being pulled? Automatically links with the teams'
  regulation, I assume? Even if so, should be made explicit as a sort of asterisk in the speed tiers display."
  Users will not trust a number whose source is invisible.
- **VGC-240 #3 — replay uploads:** "If the goal is not to provide functionality comparable to VS Recorder, I'd
  consider removing them, as replays are not central to a team report." A feature with an unclear job is a *cost*.
  (PRODUCT-DECISION: commit to replay analysis or cut it. Half-presence is the worst option.)

**Generalisable rule for this product:** it is an analysis tool, so any pixel that *looks* like it encodes
information must either encode it legibly and cite its source, or go. Ambiguous encoding is worse than no encoding,
because it burns the user's attention and their trust at once.

### Theme D — Correctness details are trust infrastructure
**CHEAP-CODE-FIX.** Two concrete bug reports, both from the "is this tool accurate?" instinct:
- **VGC-263:** "Levitate should show a ground immunity on the type chart." (§2 — **already fixed**.)
- **VGC-249 #2a:** "The mega speed tiers button remain without effect (Charizard and Floette continue with the same
  speed after hitting the mega button)." (**Already fixed** — `cfcbd2f` "VGC-243: sync Mega selection with speed
  tiers", 2026-07-17, after the ticket was filed 2026-06-30.)

In a tool whose output is a *claim about the game*, one wrong cell is disproportionately expensive: it invites the
user to doubt every other cell. Both of these were reported by users, not caught by tests — which argues for
widening the ability/form test surface (§2.4) rather than fixing case-by-case.

### Theme E — Positioning, first impression, and continuity anxiety
**PRODUCT-DECISION, cheap to execute.**
- **VGC-241:** likes the tagline ("Build, share, and discover competitive Pokémon team reports" — called "concise
  and works well"), and asks for **a short introduction / mission statement expanding on it**, so new visitors
  "immediately understand the purpose of the site, what makes it unique, and why they should stick around."
  Note: he is *not* asking to change the tagline; he is asking for the second sentence that the tagline implies.
- **VGC-238** tells you what the tool is *for*, by naming what it replaced: "Came right on the day I was starting to
  build an Excel spreadsheet for this." **The competitor is a personal spreadsheet.** That is the positioning:
  the structured, shareable replacement for the spreadsheet every serious player builds and abandons.
- **VGC-244** names the job-to-be-done: "a key enabler of the systematic improvement plan I am conjuring"
  → users are hiring this for *deliberate practice*, not record-keeping. Reinforces Theme A (playbook, not archive).
- Both VGC-238 ("please do not let this die out") and VGC-244 ("find another skilled developer to split the
  workload — this needs continuity!") express **abandonment fear**. Power users are investing their prep in this and
  are worried it vanishes. A visible changelog, a roadmap, and an answered feedback inbox are retention features
  here, not vanity. (A changelog already exists at `src/app/changelog/`; it may simply need surfacing.)

### Theme F (process, not product) — Shipped work is invisible to the people who asked for it
**CHEAP — no code.** All nine tickets are still in **Backlog**, but at least four are **already implemented**:

| Ticket | Asked | Status in code |
|---|---|---|
| VGC-263 Levitate | Ground immunity | **Shipped** 2026-08-11 (`80d232a`, `9829faf`, `1b14f3b`) |
| VGC-252 hide bar-colour note | dismissible caption | **Shipped** 2026-08-01 (`7fe21cd`), `StatColorNote.tsx` |
| VGC-249 #2a mega speed tiers | toggle should work | **Shipped** 2026-07-17 (`cfcbd2f`, VGC-243) |
| VGC-239 Team Modes | modes system | **Shipped** (acknowledged by the same user in VGC-244) |

Two users are sitting on four granted requests and have probably not been told. Closing these with a one-line reply
is the highest-return, zero-risk action in this document — it costs no engineering, directly addresses the
continuity anxiety in Theme E, and turns your most prolific reporter into a louder advocate. **A draft reply is at
`.swarm/drafts/feedback-replies.md` — it is a draft only and was NOT sent anywhere.**

---

## 2. VGC-263 / ability-immunity code investigation

### 2.1 Verdict: **the reported bug is REAL but ALREADY FIXED.** Do not re-fix it.

Ticket filed **2026-08-09**; fixed **2026-08-11**, two days later, by three commits:
- `80d232a` *fix: Levitate shows Ground immunity on defensive type chart* — introduced `ABILITY_IMMUNITIES` **and**
  added the `ability` argument at the call sites (same commit).
- `9829faf` *fix: defensive coverage respects ability immunities (Levitate, Flash Fire, absorb abilities)*
- `1b14f3b` *fix: domain correctness — type chart, parser headers, archetypes, legality*

### 2.2 What the code does today

`src/lib/data/type-chart.ts`
- `TYPE_CHART` (l.6) — attacker → defender multipliers, sparse, missing = 1×.
- `getEffectiveness(attackType, defenderTypes)` (l.173) — pure typing product. **No ability awareness** (by design).
  It has no callers outside this module.
- `ABILITY_IMMUNITIES` (l.190) — ability → one fully-immune type. Keys are normalised
  `ability.toLowerCase().replace(/[^a-z]/g, "")`, so "Lightning Rod" / "Lightningrod" / "LIGHTNINGROD" all match.
- `getDefensiveProfile(types, ability?)` (l.215) — builds the 18-type profile, then `if (immuneType) profile[immuneType] = 0;`

**Handled (11):** Levitate→Ground, Earth Eater→Ground, Flash Fire→Fire, Well-Baked Body→Fire, Volt Absorb→Electric,
Lightning Rod→Electric, Motor Drive→Electric, Water Absorb→Water, Storm Drain→Water, Dry Skin→Water, Sap Sipper→Grass.
That is **all 10 abilities named in the brief except Thick Fat**, plus Well-Baked Body and Motor Drive.

**Both production call sites correctly pass the ability:**
- `src/components/report/DefensiveCoverageChart.tsx:48` — `getDefensiveProfile(types, mon.parsed.ability)`
- `src/components/compare/CompareContent.tsx:191` — same

**Tests pass** — `src/lib/data/__tests__/type-chart.test.ts`, 4/4 green (verified by running vitest). Covers Levitate
on Gengar (2×→0), Flash Fire on Heatran (0.5×→0), Volt Absorb, Storm Drain + the "Stormdrain" spacing variant,
Sap Sipper, and the negative cases (`"Cursed Body"` and `null` leave Ground at 2×).

No other component computes effectiveness. `CommonModesSlide.tsx` and `useTeamMeta.ts` match `/weakness/` only
because **Strengths/Weaknesses there are free-text user fields**, not computed — so there is no second, stale code
path to fix. Good.

### 2.3 Two genuine remaining gaps in the same family (these ARE live)

**GAP A — the coverage charts ignore Mega Evolution entirely. Highest-value finding in this section.**

`SpeedTierChart` is mega-aware (`megaStates` prop, `resolveSpeedTierForm`, `TeamReport.tsx:333`). The coverage charts
are not — they are rendered with **only** `pokemon={analysis.pokemon}`:
- `src/components/report/TeamReport.tsx:341` → `<OffensiveCoverageChart pokemon={analysis.pokemon} />`
- `src/components/report/TeamReport.tsx:350` → `<DefensiveCoverageChart pokemon={analysis.pokemon} />`

`DefensiveCoverageChart` then reads base-form data: `mon.data?.types` and `mon.parsed.ability` (l.44–48). So with a
Mega toggled **on**, the defensive chart still shows the **base form's types and ability**. Two concrete, checkable
wrong outputs (from `src/lib/data/mega-pokemon.ts`):
- **Mega Charizard X** (l.49–53) is `["Fire","Dragon"]` with Tough Claws, but the chart renders Charizard's
  Fire/Flying — so it shows a **4× Rock weakness that the Mega does not have**, and hides the Dragon weaknesses.
  (Same class of error: Mega Gyarados l.149–153 Water/**Dark**; Mega Ampharos l.299–303 Electric/**Dragon**.)
- **Mega Gengar** (l.59–65) has **Shadow Tag**, not Levitate — but the chart applies base Gengar's Levitate and shows
  a **Ground immunity Mega Gengar genuinely does not have.** This is *literally VGC-263 again*, inverted, and
  reachable in the product's flagship format (Reg M-A). `src/lib/data/pokemon.ts:1918–1923` confirms
  `gengar-mega.abilities === ["Shadow Tag"]`, so the correct data is already present and unused.

This is the real bug the Levitate ticket points at today. **CHEAP-CODE-FIX** — the pattern to copy already exists.

**GAP B — a paste with no `Ability:` line silently loses its immunity.**
`src/lib/parser/showdown-parser.ts` sets `ability = null` (l.94) and pushes a warning
`"${species}: No ability specified"` (l.144–145). `getDefensiveProfile(types, null)` then applies nothing — which is
correct-by-contract but wrong-in-practice for a Hydreigon or Flutter Mane paste that omits the line. The dex already
knows: `src/lib/data/pokemon.ts` has `abilities: ["Levitate"]` for those species.

### 2.4 Minimal correct fixes

**GAP A (do this one):**
1. Thread `megaStates` into both coverage charts in `TeamReport.tsx:341,350`, exactly as `SpeedTierChart` receives it
   at l.333 (and `PdfExport.tsx:135` for parity).
2. In `DefensiveCoverageChart`, resolve the active form before building the profile — reuse the existing
   `detectMegaFromItem` / `BASE_KEY_TO_MEGA_KEYS` / `resolveSpeedTierForm` machinery in `SpeedTierChart.tsx:12–21,179`
   rather than writing new lookup code, then pass the **mega's** `types` and `ability` to `getDefensiveProfile`.
3. Regression tests named for the bug, per CLAUDE.md: Mega Charizard X is not 4× Rock; **Mega Gengar is 2× Ground,
   not immune**; Mega Gyarados/Ampharos typings.

**GAP B:** in the chart (not the parser — keep the parser honest about what the paste said), fall back to the dex
ability only when it is unambiguous:
`const ability = mon.parsed.ability ?? (mon.data?.abilities?.length === 1 ? mon.data.abilities[0] : null);`
The `length === 1` guard is what makes this safe — it never guesses between Flash Fire and Flame Body.

**Thick Fat and friends (optional, slightly larger):** `ABILITY_IMMUNITIES` models only 0×, so **Thick Fat
(Fire/Ice 0.5×) is unmodeled**, as are Heatproof, Water Bubble, Purifying Salt, Fluffy, and Dry Skin's extra Fire
weakness — the last is a known, documented omission in the comment at `type-chart.ts:189`. Also unmodeled: the
**Air Balloon** item (no occurrences anywhere in `src/`), and Wonder Guard. The minimal shape is a sibling
`ABILITY_MULTIPLIERS: Record<string, Partial<Record<PokemonType, number>>>` applied multiplicatively after the
immunity pass — which also makes Dry Skin fully correct in the same stroke. Do this **after** GAP A; a 0.5× that is
rendered as 1× is a smaller lie than a 0× that should be 2×.

*Incidental:* `type-chart.ts:189` begins `// ponytail: Dry Skin's extra Fire weakness isn't modeled` — "ponytail"
appears to be a stray/leftover token in an otherwise accurate comment. Harmless, but worth deleting when that line
is next touched.

---

## 3. Community findings — and an honest account of what could not be obtained

### 3.1 Confidence: NONE — public community *sentiment* could not be gathered this run

I could not retrieve a single real r/VGC, r/stunfisk, r/pokemon or Twitter/X thread. This is a tooling limitation,
stated plainly rather than papered over:

- `WebFetch` on `old.reddit.com`, `www.reddit.com` and `reddit.com/r/VGC/search.json` → **"unable to fetch"** (blocked).
- `WebFetch` on `crob.at` → **`EGRESS_BLOCKED` by the network egress proxy.**
- `WebSearch` for the brief's exact phrases ("team report", "sharing teams", "pokepaste alternative", "rental code",
  "VGC team sheet") returned SEO filler, an unrelated Wikipedia article on the Reddit API controversy, and
  **eBay listings for Stunfisk trading cards** — i.e. the keyword "stunfisk" matched merchandise, not the subreddit.

**I am therefore reporting no community sentiment at all rather than dressing up a handful of search-snippet
paraphrases as a trend.** Per the brief: a handful of anecdotes is not a trend, and these are not even anecdotes.
**No analytics available** to triangulate either. If this half of the brief matters, it needs either an unblocked
network path, a Reddit API credential, or a human spending 30 minutes in the subreddits — and it should be re-run
before anyone makes a roadmap decision on "the community wants X."

### 3.2 Confidence: LOW–MEDIUM — competitive landscape (vendor self-description only)

These exist and are positioned adjacently. **All claims are the vendors' own marketing copy**, read via search
results; none is independently verified, none is user sentiment:

- **Pikalytics team builder** (`pikalytics.com/team`, `/champions`, `/topteams`) — usage-stat-driven suggestions for
  moves/items/abilities/natures/**SP spreads**, plus save, **share by link, and export a team image**; free.
  The closest functional overlap, and it is backed by usage data this project does not have.
- **retreatcost.com** — "VGC Team List Builder — Pokémon Champions (2026+)", i.e. the paper team-sheet job.
- **github.com/felipesuarez-dev/VGC-Reporter** — self-described "simple Vibe-coded app" for reporting/tracking/
  analysing Champions 2026 matches. Low threat; signals the match-logging niche is being probed by others.
- **crob.at** — markets itself as "Best PokePaste Alternative: Visual Team Sharing" (sprites, item icons, auto social
  preview image, imports pokepast.es links, no login). **Could not be fetched** (egress-blocked); its critique of
  PokePaste is self-serving competitor copy and should not be cited as a user complaint.
- **victoryroad.pro/resources** — the community's link hub. Being listed there is plausibly a distribution lever;
  current listing status unverified.
- `pokemonvgcteamreport.com` and its `/faq` both rank for these queries already.

**The one cross-cutting signal:** two independent competitors lead with *visual, image-based* sharing (Pikalytics
"export a team image"; crob.at "auto social preview image"). Shareable-image-first is table stakes in this niche,
not a differentiator.

### 3.3 Share-flow patterns (Strava / Pinterest / Behance / Figma Community)

**Confidence: NONE from research this run** — the targeted search returned only generic Open Graph validator tools
and a Pinterest timeline, nothing about those products' mobile share-to-view funnels. I will not reconstruct their
funnels from memory and present it as research.

**What I can say with HIGH confidence, because I verified it in this repo:** the "add a rich share preview" advice
those case studies would have produced is **already implemented here.** There are five `opengraph-image.tsx` route
handlers — including a per-shared-report one at `src/app/s/[id]/opengraph-image.tsx` — plus `openGraph` metadata
across ~10 route segments, an `api/team-graphic` endpoint, and an `api/oembed` endpoint. Shared links therefore
already unfurl with a generated image and support oEmbed embedding. **Do not spend effort "adding OG previews."**
The open question is not whether previews exist but whether the *landed* mobile page converts a stranger into a
builder — and that is a question only analytics can answer. **No analytics available.**

---

## 4. Ranked opportunities

Ranked by (user-evidence strength × confidence) ÷ cost. Tags: **CHEAP-CODE-FIX** / **MEDIUM** / **PRODUCT-DECISION**.

| # | Opportunity | Tag | Evidence | Notes |
|---|---|---|---|---|
| 1 | **Close the 4 already-shipped tickets and reply to the 2 users** | CHEAP (no code) | VGC-263, 252, 249#2a, 239 vs git log | Zero risk, directly answers the continuity fear (VGC-238/244). Draft: `.swarm/drafts/feedback-replies.md` (NOT sent) |
| 2 | **Mega-aware coverage charts** (GAP A) | CHEAP-CODE-FIX | §2.3; `TeamReport.tsx:341,350` | Fixes a *wrong* Ground immunity on Mega Gengar and a phantom 4× Rock on Mega Charizard X. Pattern already exists in `SpeedTierChart`. **The live form of VGC-263.** |
| 3 | **Speed-tier provenance asterisk** — name the meta/regulation and its date | CHEAP-CODE-FIX | VGC-249 #2b (verbatim ask) | Pure trust win; user told you the exact remedy ("a sort of asterisk") |
| 4 | **Ability fallback when the paste omits `Ability:`** (GAP B) | CHEAP-CODE-FIX | §2.3 | One line + the `length === 1` safety guard |
| 5 | **Mission statement under the tagline** (keep the tagline) | CHEAP-CODE-FIX | VGC-241 | Use VGC-238's framing: the shareable replacement for the spreadsheet you were about to build |
| 6 | **Surface the changelog / roadmap prominently** | CHEAP-CODE-FIX | VGC-238, VGC-244 | `src/app/changelog/` already exists; this is a retention feature, not vanity |
| 7 | **Audit-and-label every ambient visual encoding** (bar colours were one instance; make dismissal a real preference, not just per-browser `localStorage`) | MEDIUM | VGC-249 #1, VGC-252 | `StatColorNote.tsx` persists to `localStorage` only, so it returns on every new device/browser — VGC-252 asked for a *setting* |
| 8 | **Modes → Leads hierarchy** (mode as parent, leads nested; or collapse the two) | PRODUCT-DECISION | VGC-250 | User proposed both options and did not pick. Yours to decide. |
| 9 | **CybertronVGC-style lead visuals** | MEDIUM | VGC-250 + cited video | He notes it mirrors the Match-Ups component → reuse, don't rebuild |
| 10 | **Demote tournament info to team metadata; model team→many tournaments** | PRODUCT-DECISION | VGC-240 #1 | Highest-leverage *and* highest-cost: touches data model, slide order, share preview. Test: "could Aaron Zheng present from this page?" |
| 11 | **Decide replays: commit or cut** | PRODUCT-DECISION | VGC-240 #3 | A feature with no legible job is a maintenance tax. No analytics available to check usage — this needs data before cutting |
| 12 | **Second-monitor / live companion reading mode** | MEDIUM–PRODUCT-DECISION | VGC-250 ("second monitor as I play") | Inferred, not requested. n=1. Validate before building. |
| 13 | **`ABILITY_MULTIPLIERS` for Thick Fat / Heatproof / Dry Skin's Fire / Air Balloon** | MEDIUM | §2.4 | Correctness completeness; strictly after #2 |
| 14 | **Re-run the community research with an unblocked path** | CHEAP (research) | §3.1 | Do not make roadmap calls on "the community wants X" until this exists |

### Ordering note
Items 1–6 are a single cheap, low-risk batch and should ship together — but **#2 is the only one of them that fixes a
factually wrong output**, so it carries the most trust value per line changed. Items 8, 10 and 11 should not be
started until someone makes the Theme A positioning call, because all three are downstream of it: if the report is a
*playbook*, tournament data demotes and replays probably cut; if it is an *archive*, the current order is already
right and VGC-240 is a decline-with-thanks. **No analytics available** to break that tie, so it is a judgement call —
which is exactly why these tickets carry `no-claude`.

---

## Provenance

- **Feedback:** Linear GraphQL, `issue(id:)` for VGC-238/239/240/241/244/249/250/252/263 — full descriptions read.
  All nine are in **Backlog** and labelled `no-claude`.
- **Code:** read-only inspection of `src/lib/data/type-chart.ts`, `src/components/report/DefensiveCoverageChart.tsx`,
  `CompareContent.tsx`, `TeamReport.tsx`, `SpeedTierChart.tsx`, `StatColorNote.tsx`, `CommonModesSlide.tsx`,
  `showdown-parser.ts`, `mega-pokemon.ts`, `pokemon.ts`; plus `git log` history.
  One test run (`vitest run src/lib/data/__tests__/type-chart.test.ts`, 4/4 pass) — **no files modified.**
- **Web:** 5 `WebSearch` queries, 3 `WebFetch` attempts (all 3 blocked). Sources in §3.2.
- **Not done, by instruction:** nothing sent, posted, emailed or submitted anywhere. No git state changed.
  No analytics consulted — **no analytics available this run.**
