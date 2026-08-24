# R3 — Community Sentiment Research (assigned: r/VGC + r/stunfisk)

**Agent:** R3 (read-only UX research)
**Date:** 2026-08-24
**Repo:** /home/user/VGC-Team-Report
**Status:** Completed **with a substituted source set** — see the blocker section first.

---

## 0. SOURCE BLOCKER — READ BEFORE USING ANY FINDING

**The assigned primary source (Reddit) was unreachable this run. No Reddit data of any kind is in this report.**

Verified, not assumed. Four independent attempts:

| Attempt | Result |
|---|---|
| `WebSearch` with `allowed_domains: ["reddit.com"]` (4 separate queries) | Hard API error: `400 The following domains are not accessible to our user agent: ['reddit.com']` |
| Unrestricted `WebSearch` using the assigned terms + "reddit" / "r/stunfisk" / "r/VGC" | Returned **zero** reddit.com URLs across all attempts. Reddit appears filtered out of the result set entirely. Returns were SEO spam (sportskeeda, scratch.mit.edu, goodreads, an eBay storefront). |
| `WebFetch` `https://www.reddit.com/r/VGC/search.json?q=pokepaste` | `Claude Code is unable to fetch from www.reddit.com` |
| `WebFetch` `https://old.reddit.com/r/VGC/` | `Claude Code is unable to fetch from old.reddit.com` |

I did **not** attempt to route around the block via mirrors, proxies, or scraper front-ends. The block reflects Reddit's crawler policy; evading it is out of scope for a read-only research agent.

**Consequence:** every one of the five assigned search terms (`team builder`, `team report`, `sharing teams`, `pokepaste alternative`, `VGC team sharing`) was executed, but **against substituted sources**, not Reddit. Frequency counts below are therefore *cross-source recurrence*, **not** Reddit upvote/comment volume. Do not present any number in this report as a Reddit metric.

**Substituted sources actually used (all reachable, all verified):**
- **Smogon Forums** via domain-restricted `WebSearch` — reachable and content-rich. (Note: `WebFetch` to `www.smogon.com` is **EGRESS_BLOCKED**; only the search channel works, so quotes below are as surfaced by search summarisation, not read off the page. Treat wording as near-verbatim, not court-record verbatim.)
- **GitHub** — `felixphew/pokepaste` issue tracker, `smogon/pokemon-showdown` issues.
- **Open web** — competitor/tool landscape for Pokémon Champions.

**Also unavailable this run (per `run-meta-24-08-26.md`):**
- **PostHog: no credentials.** There is **no analytics data to cross-reference** against any finding here. Nothing in this report is validated against our own user behaviour. I have invented no numbers to fill the gap.
- **`pokemonvgcteamreport.com`: EGRESS_BLOCKED.** No live-site audit; I could not check how our product currently handles any pain point named below.

**Confidence posture:** this is a *directional* report built on public developer/forum discourse. It is weaker evidence than the Reddit study that was commissioned. The prior `.swarm/r3-community-sentiment-20-05-26.md` (May) hit the same Reddit wall — so this is a **standing, repeated infrastructure gap**, not a one-off. Recommend filing a ticket for a sanctioned Reddit data path (official API credentials) before commissioning this research a third time.

---

## 1. Themes, ranked by cross-source recurrence

Ranking = number of independent sources in which the theme surfaced, weighted by whether a tool was actually *built* to solve it (revealed preference beats stated preference).

---

### THEME 1 — "Sharing a team is solved; sharing the *reasoning* is not." (recurrence: highest)

The single most consistent signal across every source. The paste is a solved commodity; the narrative around it is not.

Evidence:
- The `teamsheet.gg` launch thread states its whole reason for existing: a team report builder to "remove a lot of the grunt work when it comes to making a team report, such as getting images and formatting," explicitly framed against the fact that **"it's currently very easy to share and spread teams with pokepaste, [but] team reports are a lot harder."**
- Existing venues are described as failing: **Smogon RMTs are "out of vogue"** and **Google Docs are "cumbersome."**
- Corroborated by the May run's tool census (Reportworm, VGC.tools, VS Recorder, MetaGame VGC) — four separate community tools built to bolt context onto pastes.

**Read:** this is our product's core thesis, and it is now externally validated *and* externally contested. See Theme 2.

---

### THEME 2 — A direct competitor now exists in our exact category (recurrence: high; **newest and most urgent**)

**`teamsheet.gg`** is a team-report builder, Smogon-announced, covering **Smogon formats, VGC, and Draft Leagues**. Feature set as described:
- Auto-handles images and formatting (the "grunt work")
- **Social graph**: follows, likes, comments, shares, view counts
- **Unique shareable link with rich preview when posted to Discord or Twitter**
- Roadmap: **collaborative team reports** — "many team reports are built by groups rather than one person"
- Uses the **like system to stop high-quality reports getting buried**

This is not adjacent. This is the same product. Two of its features are ones we do not obviously have: a social/discovery layer, and multi-author collaboration.

---

### THEME 3 — PokePaste is structurally wobbling, and Showdown's replacement is disliked (recurrence: high; **strategic window**)

- Showdown is **replacing pokepast.es with an in-house `teams.pokemonshowdown` database**, reportedly over **moderation issues**.
- Community reaction is negative and specific: the in-house DB is **"extremely clunky compared to the minimalist pokepast.es,"** which by contrast **"has no validation rules so you can just backup/restore all teams and upload with zero hassle."**
- Predicted outcome from users: **"serious tournament players [will] rarely if ever [use] the new client or the teams.ps functionality."**
- Process complaint: **no public announcement** was made explaining the migration — flagged as a transparency failure toward "the people who would be impacted most."
- Reliability complaints independently present: 404s on paste links; missing images for DLC/Galarian forms (a community-built "Pokepaste image fix" thread exists); link rot in curated team dumps where original blog links are dead and only the paste backup survives.

**Read:** the community's default sharing primitive is mid-migration to something its power users say they will not use. That is a rare acquisition window — but only for a tool that is *frictionless*, because frictionlessness is the exact axis on which the incumbent replacement is being rejected.

---

### THEME 4 — Ingestion friction: import-by-URL is a long-standing, repeatedly-refused request (recurrence: high)

The same request appears in two separate trackers, years apart:
- `felixphew/pokepaste` **#94** — "Feature Request: Import through PokePaste Link": paste a *link* into the builder rather than copying the whole team, and have it auto-generate.
- `smogon/pokemon-showdown` **#5758** — "Feature Request: Import team directly from PokePaste URL."
- Smogon: **"Add ability to import bulk-formatted teams from pokepaste"** — marked **Rejected / Inactive**.
- Smogon: **"Add pokepaste support for backing up teams"** — still **Pending**.
- Smogon: **"When uploading a team to pokepaste, copy the resulting URL to clipboard"** — still **Pending**. (A one-line clipboard convenience, unshipped.)
- `pokepaste` **#128** — CORS blocked on `/create`, preventing Showdown from POSTing directly; form submissions only.

**Read:** users have asked for URL-in / one-click-out for years and been declined or ignored by both incumbents. Low-effort, high-salience, uncontested.

---

### THEME 5 — Privacy and scouting exposure (recurrence: medium, but severity high)

- `pokepaste` **#20 — "Pastes are publicly accessible"**: pastes **appear in search-engine results, allowing teams to be stolen.**
- `pokepaste` **#124 — "Report Paste"**: a moderation-reporting request (offensive nicknames) — the same moderation gap Showdown cites as its reason for abandoning PokePaste.

Competitive Pokémon has a real pre-tournament secrecy norm; a share tool that is silently SEO-indexed is a live hazard. Note the direct tension with our own SEO strategy (`src/app/champions/[pokemon]/` is flagged SEO-critical in CLAUDE.md): **indexability is a feature for our guide pages and a liability for user team reports.** These must not share a default.

I could not corroborate the scouting-anxiety angle in player-voice form — the targeted search returned unrelated esports-phishing content. Treat severity as inferred, frequency as unmeasured.

---

### THEME 6 — Readers want spreads *justified*, not just listed (recurrence: medium)

Consistent across Smogon's EV/speed-tier literature: readers want the **"why."** Specifically —
- **"Ideal Speed Numbers"**: benchmarks to hit so you outspeed a named threat while reserving EVs elsewhere.
- Good analyses explain **"exactly why specific EV allocations are used and the specific threats that this EV allotment allows the Pokémon to handle"** — with damage calcs, defensive calcs, speed tiers, and item/utility all covered.
- Established presentation convention: key speeds **bold+red** for benchmarks to beat, relevant target Pokémon **bold+blue**.

**Read:** direct design guidance for `SpeedTierChart` — the community already has a colour grammar for this. A chart that plots speeds without naming *what each line lets you outspeed* only does half the job readers want.

---

### THEME 7 — Mobile breakage in the incumbent tooling (recurrence: low-medium)

Showdown bug reports: users **cannot click certain tabs or bring up Pokémon data on mobile**, including the forfeit button and the teambuilder home button. Given VGC reports are consumed largely via Discord/Twitter links on phones, incumbent mobile failure is a soft opportunity. Weakest-evidenced theme here; the May run's `r5-mobile-*` files cover this space better.

---

### THEME 8 — Champions/SP: mechanics well-documented, format crowded, reports absent (recurrence: medium; **most decision-relevant**)

Sentiment on the **SP system itself is positive** — "largely positive," fans had "long since expressed concerns about how EVs work," and SP reads as "a first step in the right direction."

Mechanics are now thoroughly covered by third parties, and our numbers check out against them: **66 SP total, cap 32 per stat, 1 SP ≈ 8 EVs, level 50 fixed, ~528 EV-equivalent**; the common build shape is **32/32 + 2 spare**. This matches `convertToChampionsSp` and the budget constants in `src/lib/analysis/stat-calculator.ts`.

**But the competitive landscape has filled fast.** Champions builders/calculators found live: **ChampTeams.gg** (builder + damage calc + speed tiers + type coverage + Showdown import/export + community teams), **Porygon Labs**, **ChampionsBuilder.com**, **PokeSynergy**, **Pokebase**, **Game8**, **op.gg**, **Pikalytics**, plus content sites **ChampDex** and **ChampsDex**.

**The critical observation:** every one of those is a **builder / calculator / dex**. Not one is a **report** tool. The crowding is in front of our lane, not in it. Our SP-native *report* position is still open — but the "explain SP mechanics" content lane is already lost, so we should not spend effort there.

---

## 2. Recurrence table

| # | Theme | Independent sources | Tool built to solve it? | Confidence |
|---|---|---|---|---|
| 1 | Reasoning/context is unshareable; paste is not | 5+ | Yes — 5 tools | High |
| 2 | Direct competitor `teamsheet.gg` in our category | 2 | **Is** the tool | High |
| 3 | PokePaste destabilising; PS replacement rejected | 4 | — | High |
| 4 | Import-by-URL / one-click share refused for years | 6 issues | No — repeatedly declined | High |
| 5 | Pastes SEO-indexed → teams stolen | 2 | No | Med (severity high) |
| 6 | Spreads must be justified, not listed | 4 | Partially | Med |
| 7 | Mobile breakage in incumbents | 2 | No | Low-Med |
| 8 | Champions builder space crowded; report space empty | 10+ tools | Builders only | High |

---

## 3. Five product opportunities

Effort estimates are **relative sizing from repo structure only** — I did not build, install, or run anything (per constraints), and had no live-site access. Treat as order-of-magnitude.

### OPP-1 — Paste-URL import (`?from=<pokepaste-url>`) — **S**
Accept a PokePaste/Showdown URL, fetch, parse through the existing `showdown-parser.ts`, render the report. Directly serves Theme 4 — the request both incumbents have declined for years. Cheapest credible wedge in this report: the parser already exists, so this is fetch + normalise + an entry point. Watch the SSRF surface (allowlist paste hosts; no arbitrary fetch).

### OPP-2 — Per-report visibility control with `noindex` default for user reports — **S/M**
Theme 5. Three states: public+indexed / unlisted (link-only, `noindex`) / private. **Unlisted must be the default for user-generated reports.** Keep `src/app/champions/[pokemon]/` fully indexed — the guide pages are the SEO asset, user teams are not. S if a column + a meta-tag branch; M if auth/ownership plumbing is needed (Clerk is already in the stack, which helps).

### OPP-3 — "What this spread beats" annotations on `SpeedTierChart` — **M**
Theme 6. Don't just plot speed — for each Pokémon, name the benchmark it clears and the threats it outspeeds, adopting the community's existing bold-red-benchmark / bold-blue-target grammar. This is the highest-value *differentiating* feature: it is precisely the "why" that pastes cannot carry and that the crowded Champions builder field (Theme 8) does not attempt. Needs a speed-tier reference dataset per regulation — that dataset is the real cost, not the UI.

### OPP-4 — Rich share-link previews (OG/Twitter card) for Discord and Twitter — **S/M**
Theme 1 + Theme 2. `teamsheet.gg` ships this and calls it out as a headline feature; VGC distribution runs through Discord and Twitter. A dynamic OG image showing the six sprites, format, and regulation converts every pasted link into an ad. S if a static/templated OG route; M for per-team dynamic image generation. Verify current state first — I could not check the live site.

### OPP-5 — Champions SP-native report as the explicit position; do NOT build another builder — **M** (mostly positioning)
Theme 8. Ten-plus tools already own Champions building, calculating, and dex content; none own the *report*. Concretely: make SP a first-class citizen of the report surface (SP shown as SP, budget 66/32 legality visible via `champions-legality.ts`, EV→SP conversion transparent for imported pastes), and rely on OPP-1 to ingest from whichever builder the user already prefers. **Interoperate with the builders; do not compete with them.** The M is mostly report-surface polish plus a deliberate decision to *stop* investing in SP-explainer content, which is a lost lane.

**Sequencing:** OPP-1 → OPP-4 → OPP-2 → OPP-3 → OPP-5. OPP-1 and OPP-4 compound (easy in, shareable out); OPP-3 is the moat but wants the speed-tier dataset first.

---

## 4. Caveats

1. **Zero Reddit data.** The commissioned source was unreachable. Anything framed as "the subreddit thinks" would be fabrication; nothing here is so framed.
2. **Zero analytics.** No PostHog credentials — no finding is cross-referenced against our own funnel. No figure in this report is a product metric.
3. **No live-site check.** `pokemonvgcteamreport.com` is egress-blocked; I could not confirm which opportunities are already partly shipped. **Validate current state before acting on OPP-2 and OPP-4 especially.**
4. **Quote fidelity.** Smogon `WebFetch` is egress-blocked; quoted wording arrived via search summarisation. Near-verbatim. Re-verify before any external use.
5. **Sample skew.** Smogon and GitHub skew toward singles players and developers. r/VGC and r/stunfisk would have skewed toward doubles players and casual laddering — a materially different population. The gap matters most for Themes 6 and 7.
6. **Recurrence ≠ demand volume.** Rankings are source-count and revealed-preference, not user counts.
7. Nothing was posted anywhere; no forms were filled or submitted; no files outside `.swarm/` were touched. No drafts were written — nothing in this run warranted a Reddit post, and posting was prohibited regardless.

## 5. Recommended follow-up tickets

- **P1 — Sanctioned Reddit data path.** Reddit has now blocked this research twice (May and August 2026). Either provision official Reddit API credentials or formally drop Reddit from the R3 brief. Re-running the same prompt a third time will fail identically.
- **P2 — Competitive watch on `teamsheet.gg`.** New direct competitor in our exact category, with a social layer and collaborative reports on its roadmap. Warrants a proper R1/R2-style teardown.
- **P3 — Track the Showdown → `teams.pokemonshowdown` migration.** If power users reject it as predicted, the displaced-user window is real but time-boxed.

---

## Sources

- [Resource - teamsheet.gg | Smogon Forums](https://www.smogon.com/forums/threads/teamsheet-gg.3784020/)
- [In Progress - Improve interface usability for teams.pokemonshowdown & /view-teams-view | Smogon Forums](https://www.smogon.com/forums/threads/improve-interface-usability-for-teams-pokemonshowdown-view-teams-view.3785347/)
- [Programming - PokePaste: a Pokemon Pastebin (Page 2) | Smogon Forums](https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/page-2)
- [Rules - Team Reports Rules and Expectations | Smogon Forums](https://www.smogon.com/forums/threads/team-reports-rules-and-expectations.3682323/)
- [Rejected - Inactive - Add ability to import bulk-formatted teams from pokepaste | Smogon Forums](https://www.smogon.com/forums/threads/add-ability-to-import-bulk-formatted-teams-from-pokepaste.3671004/)
- [Pending - Add pokepaste support for backing up teams | Smogon Forums](https://www.smogon.com/forums/threads/add-pokepaste-support-for-backing-up-teams.3687425/)
- [Pending - When uploading a team to pokepaste, copy the resulting URL to clipboard | Smogon Forums](https://www.smogon.com/forums/threads/when-uploading-a-team-to-pokepaste-copy-the-resulting-url-to-clipboard.3717720/)
- [Programming - Pokepaste image fix | Smogon Forums](https://www.smogon.com/forums/threads/pokepaste-image-fix.3733096/)
- [Team Reports forum | Smogon Forums](https://www.smogon.com/forums/forums/team-reports.680/)
- [Resource - VGC 2022 Speed Tiers | Smogon Forums](https://www.smogon.com/forums/threads/vgc-2022-speed-tiers.3702513/)
- [A Beginner's Guide to Distributing EVs — Smogon University](https://www.smogon.com/dp/articles/ev_distribution)
- [Needs Triage - Bug Report - Teambuilder | Smogon Forums](https://www.smogon.com/forums/threads/bug-report-teambuilder.3785138/)
- [Feature Request: Import through PokePaste Link · Issue #94 · felixphew/pokepaste](https://github.com/felixphew/pokepaste/issues/94)
- [Pastes are publicly accessible · Issue #20 · felixphew/pokepaste](https://github.com/felixphew/pokepaste/issues/20)
- [Report Paste · Issue #124 · felixphew/pokepaste](https://github.com/felixphew/pokepaste/issues/124)
- [Request: Rental Code · Issue #101 · felixphew/pokepaste](https://github.com/felixphew/pokepaste/issues/101)
- [Allow CORS requests on /create from Pokémon Showdown · Issue #128 · felixphew/pokepaste](https://github.com/felixphew/pokepaste/issues/128)
- [Feature Request: Import team directly from PokePaste URL · Issue #5758 · smogon/pokemon-showdown](https://github.com/smogon/pokemon-showdown/issues/5758)
- [Pokémon Champions Will Make One Major Change To The Pokémon Competitive Scene — ScreenRant](https://screenrant.com/pokemon-champions-ev-iv-explanation-info/)
- [Pokemon Champions SP System Explained — Switchblade Gaming](https://www.switchbladegaming.com/pokemon-champions/sp-system-explained/)
- [Pokemon Champions Stat Points & EVs Explained — ChampDex](https://champdex.com/guides/stat-points)
- [Pokemon Champions Reg M-B Team Builder & Damage Calculator — ChampTeams.gg](https://champteams.gg/landing)
- [Porygon Labs — Pokémon Champions VGC Damage Calculator & Team Builder](https://www.porygonlabs.com/)
- [Champions Builder — Pokémon Team Builder for Pokémon Champions VGC](https://www.championsbuilder.com/)
- [Pokemon Champions Damage Calculator — PokeSynergy](https://pokesynergy.app/damage-calculator)
- [Pokemon Champions Damage Calculator VGC 2026 — Pikalytics](https://www.pikalytics.com/damage-calculator)
