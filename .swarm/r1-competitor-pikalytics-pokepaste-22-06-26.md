# R1 Competitor Teardown — Pikalytics vs PokePaste vs VGC Team Report

Author: subagent R1
Date: 2026-06-22
Scope: Read-only research. DRAFT only. Implementation deferred to Wave 2.

Note on methodology: Direct WebFetch to pikalytics.com and pokepast.es was blocked (HTTP 403 — both sites reject the harness UA). Findings below come from WebSearch result summaries against indexed snapshots and from secondary sources (Grokipedia, App Store listings, Smogon forum threads, mcp.directory write-ups, crob.at comparison page). Where a claim is from a secondary source I note it. Anything marked `[direct]` is from cached search snippets of the canonical site copy.

---

## 1. Pikalytics (pikalytics.com)

### What it is
The de facto VGC usage-stats and team-building hub. Aggregates Showdown + official Play! Pokemon tournament data into per-Pokemon Pokedex pages with usage %, win rate, common moves, items, abilities, natures, EV spreads, Tera types, teammates, and common cores. Pivoted hard into a full team builder + damage calculator over the past 18 months.

### Top 10 features
1. **Pokedex pages with usage stats** per format/regulation set — usage %, win rate, moves, items, abilities, natures, Tera, EV spreads. The flagship feature. `[direct]`
2. **Teammates / common cores explorer** — "Teammates" tab per Pokemon, plus aggregate 2-core and 3-core leaderboards ("Incineroar + Sinistcha appears on 140 teams, 16.5% of field"). `[direct]`
3. **Team Builder** at `/team` — drag in Pokemon, get auto-suggested moves/items/abilities/natures/EV spreads pulled from live tournament usage. Save in browser, export, share link, export team image. `[direct]`
4. **Damage Calculator** at `/damage-calculator` — exact rolls, EV testing, weather/terrain/Intimidate/spread move modeling, Mega Evolution support, mobile-friendly.
5. **Top Teams Gallery** — browse winning team comps from recent high-level tournaments, including W/L records and event rankings, with one-click copy.
6. **Format coverage** — VGC 2026 Reg M-A, Reg M-B, Reg I, Battle Stadium Singles, Smogon OU, Smogon Ubers. Refreshed per tournament cycle.
7. **Worlds 2026 hub** — dedicated landing page aggregating Worlds-specific team data.
8. **Mobile apps** (iOS + Android, paid, ~$3-5) with offline data, parity with web for builder + calc + speed tiers + type coverage matrix.
9. **Speed tier benchmarks + defensive type coverage** — visual comparison against the meta.
10. **i18n** — at minimum Italian (`?l=ita`), likely more.

### Share UX flow
Team Builder → "Share" produces a Pikalytics-hosted link. Recipient sees the team rendered with sprites, suggested moves/items/spreads inline, and is one click from opening the team in their own builder. Also exports as a team image for Discord/Twitter and exports raw Showdown text.

### Monetization
- Web: 100% ad-free, free. Donation via Ko-fi.
- Mobile: paid app (one-time, low single digits USD).
- No SaaS subscription tier as of this research.

### What Pikalytics does better than us
- **Live usage data** — they have the dataset; we don't. This is *why* serious VGC players visit daily.
- **Suggested sets at build time** — typing in "Incineroar" auto-fills the meta build. Massively reduces friction.
- **Damage calculator** built in. We don't have one.
- **Teammate recommender** — "people who ran X also ran Y." We have nothing equivalent.
- **Per-Pokemon SEO pages with usage** — each Pokemon ranks for "Incineroar VGC 2026 set" etc. We rank /champions/[mega] pages but only for Megas.
- **Worlds / format hub pages** — they get the traffic spike for "Worlds 2026 teams."

### What Pikalytics does worse than us
- **No team report / writeup format** — they give you the build, not the *story* behind the build. No matchup plans, no role notes, no key calcs documented per team.
- **No social layer** — no comments, no likes, no creator profiles, no following, no view counts.
- **No collaboration / co-authoring** on a team.
- **No versioning** — once a team is shared it's static.
- **No embeds** — can't drop a team into a blog post / Discord with rich rendering beyond an image.
- **No PWA** for the web app (mobile is App Store gated).
- **Generic share image** — single team-image style; no per-Pokemon OG variants like ours.
- **Aggregate data only** — they don't surface individual top players' actual matchup logic; they show what *most* people ran, not *why* a specific player won.

---

## 2. PokePaste (pokepast.es)

### What it is
The pastebin of competitive Pokemon. Paste Showdown export text → get a permanent URL with sprites and syntax highlighting. Open source (`felixphew/pokepaste` on GitHub). Default share format for VGC since ~2018. When a player says "drop the paste," they mean a PokePaste link.

### Top 10 features
1. **Paste → URL** in one step. No account, no login, no expiry. `[direct]`
2. **Showdown text format** — full team data: species, nickname, item, ability, EVs, nature, Tera type, moves. `[direct]`
3. **Sprite rendering** of each Pokemon next to the text.
4. **Syntax highlighting** for the text block.
5. **Persistent URLs** — old links still resolve, including importers in tooling.
6. **Anonymous by design** — URL mapping is cryptographic; intentionally no analytics, no usage tracking, no leaderboards. `[direct, from Smogon thread]`
7. **Open source** — community can self-host, fork, audit.
8. **No ads, no paywall, no JS-heavy UX**.
9. **Showdown import** — drag a Showdown export → instant paste.
10. **Lightweight** — loads in <100KB, works on garbage connections at tournaments.

### Share UX flow
1. User exports team text from Showdown.
2. Pastes into a single textarea on pokepast.es.
3. Clicks Create. Gets a `pokepast.es/abc123` URL.
4. Drops link in Discord/Twitter/email. Recipient opens → sees sprites + Showdown text, can copy-paste back into their own Showdown teambuilder.

That's it. No edit. No comment. No view count. No notification. No image preview on Twitter (a known complaint).

### Monetization
None. Free, ad-free, donation-supported (Patreon link on the site). Community-run, occasional downtime.

### What PokePaste does better than us
- **Universal trust + ubiquity** — every VGC player already has the muscle memory. It's the lingua franca.
- **One-textarea-one-button simplicity** — no analyze step, no signup nag, no skeleton screens.
- **Cryptographic anonymity** — players who don't want their tech tracked use it specifically because nothing about them is stored.
- **Open source** — institutional trust.
- **Persistent forever** — never deletes, never paywalls existing links.
- **Sub-100KB page weight** — instant load on convention center wifi.
- **Showdown import is the only import** — and it's the import everyone already uses.

### What PokePaste does worse than us
- **No editing** — typos and post-tournament tweaks require a new URL. Huge friction. (Existing complaint on GitHub issues.)
- **No analytics / view counts / engagement signal** — creator has zero idea if anyone looked at their team.
- **No social embeds** — Twitter shows a plaintext URL, no card, no preview image. crob.at exists specifically to solve this.
- **Missing sprites** for newer Pokemon forms (Zygarde-10%, Sirfetch'd, Ash Greninja per GitHub issues). Pokemon HOME renders not integrated.
- **No matchup plans, role notes, calcs, speed tiers, type coverage** — text-only.
- **No versioning** — can't track how a team evolved over a season.
- **No discovery surface** — no Explore page, no top creators, no tournament filter.
- **No comments / Q&A on a team** — community discussion happens elsewhere (Discord, Smogon threads), never on the paste.
- **Single-team focus** — no concept of "this creator's other teams."
- **Emoji nickname bugs** and other edge-case parsing failures.

---

## 3. VGC Team Report (us) — Feature inventory

Pulled from `/src/app` and `/src/components`:

**Routes**: `/` (analyze paste), `/champions` + `/champions/[pokemon]` (Mega format hub), `/explore`, `/compare`, `/creator/[name]`, `/dashboard` (+ profile, notifications, privacy), `/report`, `/s/[id]` (share link), `/embed/[id]`, `/tournaments`, `/changelog`, `/faq`, `/feedback`, `/notifications`.

**Report features** (`components/report`): TeamReport, TeamOverview, TeamStats, PokemonCard, PokemonDetailSlide, CalcInput (damage calcs), SpeedTierChart, DefensiveCoverageChart, OffensiveCoverageChart, MatchupSheet, MatchupPlanSlide, CommonModesSlide, TournamentMode, AddOpponentInput, InlinePokemonEditor, TypeBadge, ItemIcon.

**Social features** (`components/social`): CollaboratorPanel, CommentSection, CreatorLink, CreatorProfile, DoubleTapLikeOverlay, EditChangelog, FollowButton, VersionHistoryPanel, ViewCount.

**Sharing**: ShareModal, share links via `/s/[id]`, embeds via `/embed/[id]`, OG images per route, PDF export, OTS sheet export, Showdown export, PokePaste creation helper.

**Other**: PWA, swipe navigation, walkthrough overlay, presentation mode, dark mode, theme system, version diff, i18n provider, MatchTracker.

---

## 4. Feature Matrix

| Feature | Pikalytics | PokePaste | VGC Team Report |
|---|---|---|---|
| Paste-to-URL share | yes (via team builder) | yes (core) | **yes** |
| Showdown import | yes | yes | **yes** |
| Sprite rendering | yes | yes | **yes** |
| Per-Pokemon usage stats | **yes (live)** | no | no |
| Common teammates / cores | **yes** | no | no (we have OffensiveCoverageChart but not teammate stats) |
| Suggested sets at build time | **yes** | no | no |
| Damage calculator | **yes (built-in)** | no | partial (CalcInput captures, doesn't compute) |
| Speed tier chart | yes (mobile) | no | **yes** |
| Defensive type coverage | yes (mobile) | no | **yes** |
| Offensive coverage | partial | no | **yes** |
| Matchup plans per opponent | no | no | **yes** |
| Role notes / writeup | no | no | **yes** |
| Tournament mode (live use) | no | no | **yes** |
| Match tracker | no | no | **yes** |
| Versioning / edit history | no | no | **yes** |
| Collaborators / co-authoring | no | no | **yes** |
| Comments | no | no | **yes** |
| Likes / view counts | no | no | **yes** |
| Creator profiles + follow | no | no | **yes** |
| Explore / discovery feed | partial (Top Teams) | no | **yes** |
| Compare two teams | no | no | **yes** |
| PDF export | image only | no | **yes** |
| OTS (Open Team Sheet) export | no | no | **yes** |
| Embed in blog/Discord | image only | no | **yes (/embed/[id])** |
| OG images (per Pokemon) | generic | no | **yes** |
| PWA / installable | mobile app paid | no | **yes (web PWA, free)** |
| Format hub pages | **yes (per format)** | no | partial (only Champions/Mega) |
| Live tournament usage data | **yes** | no | no |
| Anonymous / no-account share | yes | **yes** | partial (share works anon, social needs Clerk) |
| Open source | no | **yes** | no |
| Ads | none | none | none |
| Premium tier | mobile app paid | none | none |

---

## 5. Top 3 Feature Gaps to Close (ranked)

### #1 — Usage stats + suggested sets at the point of paste/build (HIGHEST PRIORITY)
**Gap**: Pikalytics owns the daily-driver loop because every VGC player checks "what's the current Incineroar set?" before locking a team. We have no equivalent. We render a paste; we don't *enrich* it with "this Pokemon is on 18% of Worlds teams, here's the most common spread vs yours."

**Rationale**:
- Pulls Pikalytics users into our funnel. If we show usage % + "you're running 3 of the top 10 Pokemon" inline in the report, we become the place to *validate* a build, not just document it.
- High SEO leverage: per-Pokemon usage pages compound the /champions/[pokemon] strategy across the entire dex, not just Megas.
- Defensible: we layer this *on top of* a paste and matchup plan, which Pikalytics structurally can't replicate without rebuilding our report format.

**Implementation hint for Wave 2**: don't try to outscrape Pikalytics. Either (a) ingest Pokemon Showdown's monthly usage dumps directly (public, machine-readable), or (b) bootstrap from our own /explore teams once we have ≥500 published reports, then blend.

### #2 — Built-in damage calculator inside the report
**Gap**: We have CalcInput where users *write down* a calc result. We don't *compute* it. Pikalytics computes; Trainer Tower has the dominant standalone calc; we sit between them adding manual friction.

**Rationale**:
- Killing the "switch to another tab, run the calc, copy the result back" workflow is the single biggest UX upgrade we can ship.
- Auto-populated calcs against the current meta's top 20 attackers/defenders would be the headline feature ("we did the calcs for you"). No competitor does this.
- Unlocks a "key calcs" section in the report that's both human-curated *and* machine-suggested, which is a category none of the three competitors occupies.

**Implementation hint**: don't reinvent the calc engine — fork or wrap `@smogon/calc` (the same engine Trainer Tower uses). Surface results inline in PokemonDetailSlide and seed CalcInput defaults from it.

### #3 — Lightweight "instant paste" mode that competes with PokePaste's UX on its own turf
**Gap**: PokePaste wins because it's 1 textarea + 1 button + 1 URL in under 5 seconds, anonymous. Our paste flow is heavier — analyze step, skeleton, suggestion to sign up, OG image generation. Many players default to PokePaste for the throwaway share *because* of that weight, then never come to us.

**Rationale**:
- A `/paste` mode (or homepage A/B) that gives a PokePaste-equivalent URL in one click, *and then progressively discloses* "want the full report? add notes, matchups, calcs" turns PokePaste's strength into our funnel.
- Costs almost nothing technically — we already have all the sharing infra (`/s/[id]`, OG images, embed). We just need a no-friction entry path that doesn't force the report editor.
- Anonymous share is critical here — Clerk gating is fine for `/dashboard`, but the throwaway-paste path must work signed-out.

**Implementation hint**: route `/paste` → instant share URL, OG image, "edit & expand into report" CTA. Bonus: redirect a PokePaste URL we receive into a one-click "view as report" flow (we already accept PokePaste URLs per `createPokePaste` util) — give PokePaste users a frictionless taste of what they're missing.

---

## 6. Honorable mentions (not in top 3 but worth noting)

- **Format hub pages** beyond just Mega — `/format/reg-m-a`, `/format/reg-i`, `/worlds-2026`. Easy SEO win once usage data exists.
- **Better Twitter/Discord cards** — we already do OG images well, but PokePaste's *lack* of them is exploitable in marketing copy.
- **Mobile app or paid tier** is NOT recommended yet — our PWA is the right answer until we have >5k MAU.
- **Open source the report renderer** — institutional trust play against PokePaste's open-source halo, without giving up the data layer.

---

## 7. Confidence + caveats

- All competitor data is from indexed snapshots, not live fetches (403'd). Treat exact numbers ("140 teams", "16.5%") as Pikalytics's own copy verbatim.
- Mobile app pricing for Pikalytics may have changed; verify in App Store before any marketing comparison.
- PokePaste analytics policy is from a Smogon forum statement by the maintainer; behavior matches but no recent re-confirmation.
- This is a draft. Wave 2 should sanity-check by visiting both sites in a real browser before scoping any of the three recommendations.
