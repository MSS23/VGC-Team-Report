# R3 — Community Sentiment + Mobile Share UX (consolidated)

**Date:** 2026-09-21
**Agent:** R3 (community + mobile UX research)
**Scope:** (1) community sentiment/unmet needs, (2) creator/top-player stated needs, (3) mobile share-to-view patterns.

---

## 0. Method and evidence quality — READ THIS FIRST

The research constraints in this container were materially worse than the brief assumed. Being
explicit, because it changes how much weight each finding below can carry.

| Channel | Status | Consequence |
|---|---|---|
| `WebFetch` → github.com | ✅ works | Primary-source quality. Used heavily. |
| `WebFetch` → everything else tested | ❌ `EGRESS_BLOCKED` | reddit.com, old.reddit.com, smogon.com, victoryroadvgc.com, strava.com, en.wikipedia.org, medium.com, nngroup.com, developers.google.com, thegamer.com, game8.co, substack.com all refused by the egress proxy. |
| `curl` → reddit.com | ❌ `CONNECT tunnel failed, 403` | Confirms proxy-level block, not a UA block. |
| `WebSearch` | ⚠️ works, degraded | Returns titles + URLs + an LLM-written summary of page content. **reddit.com is hard-excluded from the search user agent** (`API Error: 400 ... domains are not accessible to our user agent: ['reddit.com']`). |
| Production site | ❌ blocked | Already tracked as VGC-255. |

**What this means concretely:**

- **Scope item 1 could not be executed as specified.** Direct r/VGC, r/stunfisk and r/pokemon
  reading was impossible by two independent routes (fetch and search). I did **not** substitute
  invented Reddit quotes. Where a prior swarm run also hit this wall it said so
  (`.swarm/r3-community-sentiment-20-05-26.md`: *"Direct Reddit fetching was blocked"*) — that has
  now been true for four months and should be treated as a permanent condition of this container,
  not a transient failure.
- Smogon forum content is available **only** as WebSearch summaries of thread pages. I cite the
  thread URL and mark the claim as *summary-derived* — I could not read the thread myself, so I
  cannot quote a user verbatim or verify tone/volume.
- I therefore leaned on **revealed preference** evidence, which survives the blocking: open GitHub
  issues on the tool the community actually uses, the set of tools the community has independently
  built, and public announcements by community infrastructure accounts. Revealed preference is in
  some ways *stronger* than forum sentiment — someone shipped a tool rather than just complained —
  but it tells you nothing about how *many* people feel the pain. I flag that limit per finding.

**Labelling convention used throughout:**
`[FOUND]` = I saw it, with a link. `[SUMMARY]` = came via a WebSearch summary of a page I could not
open. `[INFERENCE]` = my reasoning on top of `[FOUND]`/`[SUMMARY]` facts, explicitly not evidence.

---

## 1. Community sentiment and unmet needs

### 1.1 The community's default paste host is unmaintained and someone is publicly asking to take it over

`[FOUND]` pokepaste issue **#329, "The future of pokepast.es"**, opened by `CartmanDavis` on
**2026-09-14** — seven days before this run.
https://github.com/felixphew/pokepaste/issues/329

The issue states pokepaste "has not received updates for new art in quite some time. It looks like
this repo is inactive," and asks maintainer `@felixphew` three things: whether he intends to keep
supporting the repo and site; whether he would transfer the **domain and server** to someone else if
not; and offers to take over maintenance to preserve user data. As of reading: **no reply, no
labels, no linked PR.**

Corroborating decay signals `[FOUND]` from the same tracker:

- **#101 "Request: Rental Code"** — opened **2019-12-16**, still open. Nearly **seven years** with a
  rental-code field unimplemented on the tool the whole format uses to share teams.
  https://github.com/felixphew/pokepaste/issues/101
- **#52 "Allow editing of team?"** — opened **2018-03-28**, still open, 3 comments.
  https://github.com/felixphew/pokepaste/issues/52
- The tracker has ~165 open issues and the most recent page is dominated by titles that are
  *literally team names* — "Trick Room Sand Team" (#323), "Snow team" (#321), "Meowstic Psyspam"
  (#318), "duo duelers" (#317), "Mega elektross" (#326), "M-B" (#327). Users are filing Pokémon
  teams into a GitHub issue tracker.

`[INFERENCE]` Two readings of the team-name issues, and I want to be honest that I cannot
distinguish them: either the site's only visible contact surface routes confused users to GitHub, or
people are using the tracker as an ad-hoc team board. Either way it is consistent with *no active
moderation*. I asked the fetch tool to explain #323 and it produced a confident narrative about
pokepaste being "a collaborative platform for sharing and discussing team builds" — that is a
hallucination by the summarising model, not a finding, and I am recording it here so nobody
downstream mistakes it for evidence.

**Why this matters and what is not already ticketed:** VGC-225 (PokePaste URL import) treats
pokepaste as a healthy upstream to read from. #329 says the upstream may be *ending*. The unmet need
is not import — it is **durable custody**: a shared report that keeps working when the host it was
imported from goes away, plus bulk migration for people who have years of pastes. Nobody in the
ecosystem is offering that today.

**Limit:** one issue by one person with zero comments. It is a real, dated, public signal about
maintainer status; it is *not* evidence of widespread community panic. I found no thread where the
community discusses pokepaste dying.

### 1.2 Shared teams are immutable, and people have been asking for editing since 2018

`[FOUND]` pokepaste #52 "Allow editing of team?" (2018-03-28, open, 3 comments) —
https://github.com/felixphew/pokepaste/issues/52

Pastes are write-once. A VGC team is not: it changes between a local, a regional and a major, and
the change *is* the interesting content.

**Not covered by existing tickets.** VGC-153 is tiered publishing (who sees what), VGC-228 is
server-rendering `/s/[id]`. Neither gives a report **a stable URL whose contents can change, with a
visible history of what changed and why.** That is the "I ran this at Toronto, then swapped Tera and
ran it at Worlds" artifact the format produces constantly and has no home for.

**Limit:** 8.5-year-old issue, 3 comments, no reaction data. Low-volume evidence; the strength is its
persistence and the obviousness of the underlying behaviour, not a crowd.

### 1.3 Champions replica codes → pastes is currently done by hand, by one volunteer

This is the strongest *fresh* finding in the report.

`[FOUND]` VGCPastes, the community's main team repository account, has publicly thanked the same
individual for manual conversion work across three consecutive regulations:

- Reg **M-C**: *"Champions is now live on Showdown and our Repository is updated with both Pokepastes
  and Replica Codes to try out! ... Huge thanks to @CastorbrownVGC for all the help converting
  replicas to pastes 👏"* — https://x.com/VGCPastes/status/2043019220095734204
- Reg **M-B**: *"Champions Regulation MB is now available in our Repository with both Pokepastes and
  Replica Codes to try out! ... Thank you to @CastorbrownVGC for the massive help converting replicas
  to pastes 🫡"* — https://x.com/VGCPastes/status/2068475718003310968
- Reg **M-A** replica repository launch — https://x.com/VGCPastes/status/2042106878751338822, and a
  follow-up at 135 replica teams — https://x.com/VGCPastes/status/2042695109754654984

Three separate public acknowledgements of *manual* conversion labour, by name, over months. When the
community's central infrastructure is thanking one person for transcription, the transcription is
not automated and is a bottleneck.

Precedent that this class of tool gets built when the pain is felt `[SUMMARY]`: Smogon has a
"Global Link Rental Team to Showdown Converter" thread from the Gen-7 era —
https://www.smogon.com/forums/threads/global-link-rental-team-to-showdown-converter.3614770/

**Relation to VGC-226:** VGC-226 is a rental-code *field plus copy button* — it carries a code the
author already has, paste → code direction. The unmet need here is the **opposite direction**:
code → structured team → report. That is the direction that turns "I saw a 10-character string in
Discord" into a viewer of your product.

**Limit:** I could not open x.com; these are WebSearch-surfaced post texts with full status URLs. The
quoted strings are consistent across three independent search results, which is why I am willing to
rely on them, but I did not read the posts in a browser.

### 1.4 Six-plus independent tools exist to turn a paste into an official team-list PDF

`[FOUND]` (tool existence, via search result titles/URLs) — independent implementations of the *same*
job:

| Tool | URL |
|---|---|
| teamsheet.gg — brands itself **"Pokemon Team Reports"** | https://teamsheet.gg/ , https://teamsheet.gg/generator |
| DraftCentral team sheet generator | https://www.draftcentral.gg/tools/pokemon-team-sheet-generator |
| The Frontier | https://thefrontiervgc.com/teamsheet |
| retreatcost — **Champions-specific** team list generator | https://retreatcost.com/Pokemon-VGC-Champions-Team-List-Generator/ |
| dhsufi PokemonTeamListCreator | https://dhsufi.github.io/PokemonTeamListCreator/ |
| Chrome ext: Showdown VGC Team Sheet | https://chromewebstore.google.com/detail/showdown-vgc-team-sheet-e/hhmgmifkiefbakippglilgcfnndlkbab |
| Chrome ext: VGC OTS | https://chromewebstore.google.com/detail/vgc-ots/codeajknmgnkbobmhjeenehcmfhmegkf |
| Chrome ext: Teamsheet Graphic | https://chromewebstore.google.com/detail/teamsheet-graphic/iojdhogpjfkegdomgbnegegfbcbfehij |

`[SUMMARY]` The stated function: import a Showdown paste / PokéPaste and "download a teamlist to use
at locals," with entries going onto the **unmodified official Play! Pokémon team list PDF**; some
also emit broadcast graphics and seven-language open-team-sheet layouts.

`[INFERENCE]` Eight independent builds of one workflow is about as strong a revealed-demand signal as
this ecosystem produces. It is also a workflow this codebase is already 90% of the way to: the report
already holds the exact fields a team list needs, and `convertToChampionsSp` already produces the SP
values a Champions team list requires — note that `retreatcost` had to build a *separate*
Champions-specific generator, which is precisely the gap this project's SP support closes.

Direct competitive note: **teamsheet.gg's tagline is literally "Pokemon Team Reports."** Name
collision with this product's core positioning.

**Limit:** I verified these tools exist and what they claim to do. I did **not** find a single user
saying "I wish X had a team sheet export." The evidence is revealed preference only.

### 1.5 A Champions replica code does not grant you the team — you must already own it

`[SUMMARY]`, corroborated across several independent pages:

- *"You need to own the actual Pokémon and held items in your account before a Replica Team becomes
  playable... unlike traditional rental teams in other Pokémon games, you cannot simply borrow a
  complete team with code alone."* Missing a Pokémon means **Recruit pulls** or a Pokémon HOME
  transfer; a missing item must be **bought separately**.
  https://www.thegamer.com/pokemon-champions-replica-rental-teams-guide/ ,
  https://games.gg/news/pokemon-champions-replica-team-codes/ ,
  https://gamerant.com/pokemon-champions-replica-teams-explained-team-codes/ ,
  https://www.serebii.net/pokemonchampions/replicateams.shtml
- A second constraint: *"if your Pokémon's stats, moves or abilities are different from the Pokémon
  in the replicated team, you will have to train them... otherwise you will not be able to use them
  in battles."* https://game8.co/games/Pokemon-Champions/archives/594181

Mechanics baseline `[SUMMARY]`: the code is a **10-character alphanumeric Team ID**, entered at
Train → Replica Teams → Build a Team Using an ID Code → pick a slot. It copies the six Pokémon with
Held Items, Abilities, Natures and Movesets.
https://champdex.com/guides/getting-started , https://op.gg/pokemon-champions/replica-teams

`[INFERENCE]` This is the hardest, least-served friction point in the entire share funnel, and it is
new with Champions. Every existing tool — including this one, and including VGC-226 — implicitly
assumes "code applied = team playable." It is not. Between "I opened your shared report" and "I am
playing your team" sits an unpriced shopping list: which of these six do I not own, which items must
I buy, and what SP retraining is needed to match. Nothing in the ecosystem computes that.

**Limit:** pure inference about product opportunity. The *mechanic* is well-corroborated; I found no
player complaining about it in a source I could open.

### 1.6 Incumbent distribution is actively mobile-hostile

`[FOUND]` VGCPastes, distributing Champions replica teams via a Google Sheet:
*"Some mobile users are having trouble opening the sheet, our Discord's 'submit-reg-ma-teams' channel
has links to the replicas as well."* — https://x.com/VGCPastes/status/2042695109754654984

The community's primary team repository publicly conceding that its distribution surface fails on
mobile, and routing people to Discord as a workaround.

This is load-bearing when combined with §3.1: Champions is *itself* a phone game.

### 1.7 The Champions calculator/companion space is already crowded

`[FOUND]` (existence) — Champions-specific tooling shipped in 2026:

- Pikalytics damage calculator w/ SP investment testing — https://www.pikalytics.com/damage-calculator
- champions.pythonanywhere.com — `[SUMMARY]` "mathematically distribute stat points to maximise bulk,
  find the minimum SPs to hit speed tiers and calculate damage breakpoints" — https://champions.pythonanywhere.com/
- championscalc.com — https://championscalc.com/en/pokemon-champions-speed-calculator/
- PokéChampions Coach — https://www.pokechampionscoach.com/calculator
- PokeSynergy speed tiers, *updated 2026-09-20* (one day before this run) — https://pokesynergy.app/speed-tiers
- PikaChampions speed tiers — https://www.pikachampions.com/guides/pokemon-champions-speed-tiers
- OP.GG Champions calculator — https://op.gg/pokemon-champions/calculator
- gamewith.ai speed calculator — https://gamewith.ai/pokemon-champions/en/speed-calculator
- Champions Companion — https://championscompanion.app/ (+ `/team-codes/`, `/cheatsheet/`)
- PokeComp — https://www.pokecomp.app/ ; PokeChampsCompanion — https://pokechampscompanion.com/
- PokeReplicas (Android) — https://play.google.com/store/apps/details?id=com.jordansco.replica_hub
- crob.at — https://crob.at/ , https://crob.at/pokepaste-alternative

`[INFERENCE]` **This is a caution about VGC-79, not a new proposal.** An inline damage calculator is
now table stakes — at least eight free ones exist, one updated yesterday. Building it will not
differentiate; *not* building it may cost credibility. Scope it as parity, not as a bet.

Also note `[SUMMARY]` Champions Companion monetises **team-preview screenshot scanning** ("scan the
enemy team at preview... first scan of the day free," premium for unlimited + in-game overlay) —
https://championscompanion.app/cheatsheet/ — and VGC Helper offers "take a photo of the opponent team
during team preview" — https://vgchelper.com/ . Image→team OCR is a live, *monetised* adjacent
market.

### 1.8 crob.at is the closest direct competitor and has taken the "PokePaste alternative" SEO position

`[SUMMARY]` crob.at positions as *"the best free PokePaste alternative: free, no login, Showdown
import, plus visual sprites, social preview images, multi-team support, and a public team gallery,"*
supports Champions Reg M-C, and **auto-imports any pokepast.es URL**.
https://crob.at/pokepaste-alternative , https://crob.at/pokepaste , https://crob.at/guide/share-showdown-teams

Overlaps VGC-225 (PokePaste import), VGC-207 (no-login share) and VGC-228 (OG preview images) —
i.e. three of the seven existing tickets are already shipped features of a live competitor. Speed
matters more than novelty on those three.

---

## 2. What creators and top players say they need

**I largely failed to execute this scope item, and I am not going to pad it.**

x.com and all creator blog/newsletter hosts (Substack, Medium) are egress-blocked; Reddit is blocked
twice over. Searches aimed at named creators (Wolfe Glick, Aaron "Cybertron" Zheng) returned
biography pages, a 2022 VGC-guide launch tweet and podcast listings — nothing where a creator states
what they need when sharing a team. The one search that targeted this directly returned, in the
search engine's own words, *"the search results don't contain specific information about them sharing
team pastes or team reports."* I am recording that as a null result rather than inventing quotes.

What I can defend, as **norms** rather than creator statements:

### 2.1 Smogon's Champions-era analysis format mandates spread justification

`[SUMMARY]` — Smogon, **"Resource - Champions VGC Analyses Formats"**:
https://www.smogon.com/forums/threads/champions-vgc-analyses-formats.3782773/
(see also the general format discussion https://www.smogon.com/forums/threads/vgc-analysis-format-discussion.3761710/)

A conforming analysis requires: Overview (set's purpose/role), Key Moves, Item Differences (slashed
items across matchups), Tera Type Considerations, and an **EV/SP Spread section explaining the
reasoning with key survival benchmarks and the threats it outspeeds.** The standard as summarised:
*"if a Pokémon has a rather non-obvious stat point spread, explaining it is generally worth it,"* with
non-252/252 spreads, non-obvious moves and item choices all requiring explicit justification.

Note the wording "**stat point** spread" — the community's written standard has already been updated
for Champions SP.

`[SUMMARY]` The Smogon Team Reports forum itself is deliberately unstructured — *"threads do not
typically require moderator approval, giving you a lot of freedom in how you want to present your
team"* — https://www.smogon.com/forums/forums/team-reports.680/ — with the informal expectation that
each Pokémon gets at least ~3 lines explaining how it functions with the rest.

`[INFERENCE]` Combine those two: the community has a **precise, published spec for what a spread
explanation must contain** (survival benchmarks, speed thresholds, item/Tera rationale) and **no
tooling that produces it** — the optimizers at champions.pythonanywhere.com compute the benchmarks in
a separate tab, and the report tool gives you an empty textarea. The gap is the join.

### 2.2 The paste+code pairing is now the community standard artifact

`[FOUND]` VGCPastes ships *"both Pokepastes and Replica Codes"* for every Champions regulation
(§1.3 citations). `[SUMMARY]` Smogon RMT/sample-team threads carry rental codes alongside spreads and
Tera-type matchup notes —
https://www.smogon.com/forums/threads/rmt-regulation-h-doubles-scarf-baxcalibur-hyper-offense-trick-room-counter.3750520/ ,
https://www.smogon.com/forums/threads/vgc-25-regulation-g-sample-teams-thread.3747193/

This validates VGC-226's premise. Already ticketed; noted for completeness, not re-proposed.

---

## 3. Mobile share-to-view patterns

### 3.1 The structural fact that reframes this entire section

`[SUMMARY]` **Pokémon Champions launched on iOS and Android on 2026-06-17** (Switch 2026-04-08), is
free-to-play, and supports cross-platform play.
https://www.pokemon.com/us/news/pokemon-champions-is-available-now-on-ios-and-android-devices ,
https://press.pokemon.com/en/releases/Pokemon-Champions-Launches-June-17-on-iOS-and-Android-Devices-The-Poke
`[SUMMARY]` **Worlds 2026 uses Champions for VGC.** https://en.wikipedia.org/wiki/Pok%C3%A9mon_Champions

`[INFERENCE]` The competitive game is now a phone app. A shared report is therefore frequently opened
**on the same device that is running the game**, with no second monitor and no easy alt-tab. That
changes the ranking of every pattern below: the highest-value mobile action is not "sign up," it is
**get the 10-character Team ID onto the clipboard in one tap so the player can switch apps and paste
it.** Everything else is secondary.

### 3.2 Never full-page-gate a shared link (hard numbers)

`[SUMMARY]` Google's own app-download-interstitial case study (Google+ mobile web):
**69% of visits to the interstitial page abandoned**; only **9% pressed "Get App."** Replacing the
interstitial with a Smart App Banner produced a **+17% increase in 1-day active users** on the mobile
site. https://developers.google.com/search/blog/2015/07/google-case-study-on-app-download-interstitials
(secondary coverage: http://www.thesempost.com/google-app-interstitials-result-in-huge-abandonment-rate/ ,
https://gizmodo.com/new-study-shows-how-deeply-awful-those-get-the-app-web-1720324285)

Transferable rule: any modal, login wall or install prompt that stands between the tap and the team
costs roughly two-thirds of first-time viewers. This is the quantitative backing for VGC-207
(anonymous quick-share) and VGC-228 (SSR `/s/[id]`) — both already ticketed, both correct.

### 3.3 Gate the *fork*, not the *view* (Figma Community)

`[SUMMARY]` Figma Community projects are viewable by anyone; the **"Duplicate"** button — which
behaves like a GitHub fork and drops a private, editable copy into your drafts — requires an account.
https://help.figma.com/hc/en-us/articles/360038510873-Duplicate-Community-files ,
https://help.figma.com/hc/en-us/articles/360038510693-Guide-to-the-Figma-Community

The account request lands at the exact moment the viewer has decided they want the thing. Transferable
verbatim: the signup moment on a shared VGC report is **"Copy this team to my account / remix this
report,"** not page load.

Worth knowing `[SUMMARY]`: duplicated Community files are *snapshots* — no version history, no
comments, no upstream updates — and there is a standing feature request for true remix/fork-with-
upstream. https://forum.figma.com/suggest-a-feature-11/figma-community-file-remix-like-github-forking-41089
That is the same complaint as pokepaste #52 (§1.2) in a different industry, which is mild
cross-domain support for the versioning finding.

### 3.4 Give partial value before the wall (Spotify)

`[SUMMARY]` A Spotify link sent to a non-account-holder plays a **30-second preview in the browser**,
with the signup prompt appearing only when the listener wants the full track; free logged-in users
then get on-demand play on web but **shuffle-only on mobile** — i.e. the restriction tightens in
stages rather than all at once. https://www.artist.tools/post/how-to-share-spotify-music-like-a-pro-in-2026 ,
https://linke.ro/blog/share-spotify-playlists-ultimate-guide-music-curation

This is the pattern VGC-153 (public overview / private spreads) already encodes. Noted as
confirmation, not a new proposal. The transferable detail worth stealing is the *staging*: preview →
prompt → free tier → paid tier, four steps, never one wall.

### 3.5 Deep links, and what happens when the artifact is private (Strava)

`[SUMMARY]` Strava share links use a Branch-style deep-link domain, `https://strava.app.link/[code]`,
which routes to the app when installed and the web when not; Strava explicitly restored link support
across both mobile and web. Activities with restricted privacy **cannot be viewed by non-users
without logging in**, and a profile shows only the few latest activities to logged-out visitors.
https://support.strava.com/hc/en-us/articles/4418607378189-How-to-Get-and-Share-Links-From-Strava ,
https://support.strava.com/en-us/articles/15401938-links-on-strava ,
https://support.strava.com/en-us/articles/15401987-activity-privacy-controls

`[INFERENCE]` Strava is the cautionary half of the set: a shared link that lands on a login wall
converts nothing and burns the sharer's social capital, because the *sharer* looks bad to their
audience. If VGC-153 ships tiering, the **default for a link the author deliberately shared must be
publicly viewable**, with privacy as an opt-in the author is warned about at share time.

### 3.6 Logged-out viewing is the norm at the portfolio end too (Behance)

`[SUMMARY]` *"Both registered and unregistered users can view any particular project on Behance,"*
alongside an explicit **Link Only Sharing** mode for unlisted work.
https://help.behance.net/hc/en-us/articles/19288565618971-Guide-Sharing-and-Embedding-Behance-Content ,
https://help.behance.net/hc/en-us/articles/23707509178011-Guide-Advanced-Project-Settings

The two-mode model — public-and-indexed vs. unlisted-link-only, both viewable without an account — is
a cleaner primitive than a login gate, and is what VGC-153/VGC-207 should converge on.

### 3.7 Use the OS share sheet, with a copy-link fallback

`[SUMMARY]` Web Share API (`navigator.share`) is a W3C spec — https://www.w3.org/TR/web-share/ —
widely available on mobile Safari and Chrome and since extended to desktop Chrome/Edge. Consensus
implementation guidance: **feature-detect, use the native sheet when present, fall back to an explicit
link row plus a copy-link button.** https://css-tricks.com/how-to-use-the-web-share-api/ ,
https://www.danielworsnup.com/blog/why-you-should-be-using-the-web-share-api-in-your-pwa/

`[INFERENCE]` Cheap and high-leverage here specifically, because the dominant destination for a VGC
share is Discord or X on a phone, and the native sheet is the shortest path to both. Pair it with
§3.1: the share sheet shares the *report*, a separate one-tap control copies the *Team ID*. Two
distinct affordances; conflating them into one "share" button would be the mistake.

### 3.8 Pattern summary

| Source | Pattern | Transferable rule |
|---|---|---|
| Google interstitial study | 69% abandon a full-page gate | No modal/login/install wall before the team is visible |
| Figma Community | View free, Duplicate needs an account | Signup prompt fires on "copy/remix this team" |
| Spotify | 30s preview → prompt → free tier → paid | Stage the restriction in 3–4 steps, never one wall |
| Strava | Deep links + private activities blocked for non-users | Author-shared links default to publicly viewable |
| Behance | Public *and* unlisted, both viewable logged-out | Two share modes, neither requiring an account to view |
| Web Share API | Native sheet + copy fallback | Share-the-report and copy-the-code are separate buttons |
| Champions on mobile | Game and report on the same phone | One-tap Team ID to clipboard outranks every other CTA |

---

## 4. Mapping to existing tickets

Already covered — referenced, not re-proposed:

| Ticket | Corroborating evidence found |
|---|---|
| VGC-226 rental-code field + copy | §2.2 paste+code is the community standard artifact |
| VGC-225 PokePaste URL import | §1.8 crob.at already ships it (and auto-imports pokepast.es URLs) |
| VGC-207 anonymous quick-share | §3.2 69% interstitial abandonment; §3.6 Behance logged-out norm |
| VGC-228 server-render `/s/[id]` | §1.8 crob.at's headline differentiator is social preview images |
| VGC-153 tiered publishing | §3.4 Spotify staging; §3.5 Strava caution on private-by-default |
| VGC-82 team builder wizard | No new evidence either way this run |
| VGC-79 inline damage calculator | §1.7 — **caution**: ≥8 free Champions calculators exist; parity not differentiation |

---

## 5. The five best-evidenced unmet needs *not* already ticketed

Ranked by evidence strength, not by build cost.

1. **Automated Replica-code → team → report conversion (reverse import).**
   Strongest citation: https://x.com/VGCPastes/status/2043019220095734204 — VGCPastes thanking
   `@CastorbrownVGC` for *"all the help converting replicas to pastes"*; repeated for M-B
   (https://x.com/VGCPastes/status/2068475718003310968). Manual labour, publicly credited, three
   regulations running. Opposite direction to VGC-226.

2. **Official Play! Pokémon team-list PDF export.**
   Strongest citation: https://teamsheet.gg/generator — one of **eight** independent implementations
   (§1.4), and its site brands itself "Pokemon Team Reports." This codebase already holds every
   required field and already computes Champions SP via `convertToChampionsSp`, which is exactly what
   forced `retreatcost` to build a separate Champions generator.

3. **Editable, versioned share links — stable URL, visible change history.**
   Strongest citation: https://github.com/felixphew/pokepaste/issues/52 — "Allow editing of team?",
   open since 2018-03-28. Cross-domain echo at Figma
   (https://forum.figma.com/suggest-a-feature-11/figma-community-file-remix-like-github-forking-41089).

4. **Auto-generated SP/EV spread rationale from benchmarks, not an empty notes box.**
   Strongest citation: https://www.smogon.com/forums/threads/champions-vgc-analyses-formats.3782773/ —
   the Champions analysis format *requires* a spread section with survival benchmarks and speed
   thresholds, and says non-obvious **stat point** spreads must be explained. Benchmarks are computed
   today only in separate tools (https://champions.pythonanywhere.com/). Distinct from VGC-79: a
   calculator is a tool the reader operates; this is prose the report emits.

5. **"Can I actually run this team?" — ownership/acquisition checklist for Champions.**
   Strongest citation: https://www.serebii.net/pokemonchampions/replicateams.shtml and
   https://www.thegamer.com/pokemon-champions-replica-rental-teams-guide/ — a replica code does not
   grant the Pokémon or items; missing ones require Recruit pulls, HOME transfers or purchases, and
   mismatched stats block battle use entirely
   (https://game8.co/games/Pokemon-Champions/archives/594181). No tool surfaces this from a shared
   team. Note this one is the most inference-heavy of the five: the mechanic is solidly sourced, the
   product gap is my reading.

**Runners-up** (real but thinner): durable custody / bulk migration off pokepaste in light of
https://github.com/felixphew/pokepaste/issues/329; and team-preview screenshot OCR, already monetised
by https://championscompanion.app/cheatsheet/ and https://vgchelper.com/.

---

## 6. What I could not establish

Listing these so nobody re-runs the same dead ends, and so no downstream reader assumes silence means
absence:

- **Any verbatim Reddit sentiment.** r/VGC, r/stunfisk, r/pokemon — blocked to both fetch and search.
  Every quantitative claim about "what the community repeatedly asks for" in this report rests on
  revealed preference or Smogon summaries instead. Treat this scope item as unexecuted.
- **Any first-person creator or top-player statement** about what they need when sharing teams (§2).
  Null result, not a negative finding.
- **Volume or intensity** for any complaint. Revealed-preference evidence shows a need exists and
  someone cared enough to build for it; it cannot tell you how many people want it or what they would
  pay.
- **Whether pokepaste's maintainer has since responded** to #329 — unanswered as of 2026-09-21.
- **Live production behaviour** of this site's own share flow — pokemonvgcteamreport.com is
  egress-blocked (VGC-255), so none of the mobile recommendations in §3 have been checked against
  what the product already does. Someone with browser access should confirm §3.7 and §3.2 are not
  already satisfied before any of it is ticketed.

## 7. Outreach drafts

None produced. Nothing was posted, commented, DM'd, submitted, tweeted or sent; all research was
read-only. No file was written to `.swarm/drafts/` because this run surfaced no outreach worth
drafting — the findings are product-direction, not community-engagement. No tracked source file was
modified.
