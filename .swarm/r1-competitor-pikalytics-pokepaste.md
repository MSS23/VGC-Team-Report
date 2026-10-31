# Competitor Teardown: Pikalytics & PokePaste

**Produced:** 2026-05-25 (updated)
**Previous:** 2026-05-13
**Scope:** Full feature, UX, monetisation, and gap analysis vs VGC Team Report (pokemonvgcteamreport.com)

---

## 1. Pikalytics (pikalytics.com)

### What It Is

Pikalytics is the dominant competitive Pokemon statistics platform. It aggregates usage data from millions of ranked battles on Showdown, Pokemon HOME, and Battle Stadium, and now fully covers Pokemon Champions (the 2026 official VGC format with Mega Evolution). It is the industry reference for usage rates, EV spreads, movesets, items, and teammate synergy across VGC, Smogon, and multiple formats. Developed by Griffin Ledingham since late 2016, publicly launched November 2017.

### Core Features & UX Flow

| Feature | Detail |
|---|---|
| **Pokedex / Usage Stats** | Per-Pokemon page: usage %, ability distribution, item distribution, top moves, EV spread clusters, common teammates, counters, Tera type preferences. Filterable by regulation and format. Updated monthly. Currently covers VGC 2026 Regulation Set M-A and Regulation Set I. |
| **Team Builder** | Build 6-mon teams with suggested sets from meta data. Import/Export Showdown paste. Share team via URL. Share team as image. Speed & Defense analysis overlays comparing your team against current meta benchmarks. |
| **Meta Calcs (inline)** | "Meta Calcs" button inside Team Builder launches a live damage calculator. Spreads/moves/items update offensive and defensive calcs in real time. Auto-populates with likely attackers/defenders from Champions ladder. |
| **Standalone Damage Calculator** | `/calc` — full calc handling weather, terrain, screens, Helping Hand, Intimidate, spread-move penalties, Mega options, Stat Point investments. Champions ruleset toggle for 2026 damage model. |
| **Top Teams Gallery** | `/topteams` — browsable 6-mon showcase cards from recent high-level tournament results. Filter by Pokemon or archetype. Expandable to full moveset. Send to Team Builder or jump to Limitless source. Separate `/topteams/championstournaments` for Champions-format events. |
| **Champions Hub** | `/champions` — dedicated section: usage rankings, Pokedex, team builder entry, top threats digest for Pokemon Champions 2026. |
| **Tournament Results** | `/results` — historical results viewer with tournament-level stats. |
| **Speed Tiers** | `/speed-tiers` — full speed tier reference for every Pokemon and Mega in current format with base Speed, max Speed, neutral natures, and Choice Scarf calculations. |
| **Speed Quiz** | `/speed-quiz` — interactive streak-based quiz: guess which Pokemon is faster in head-to-head matchups using Champions meta data. |
| **Calc Quiz** | Guess damage buckets from full calc strings. |
| **Type Quiz** | Super-effective checks with ability modifiers. |
| **Articles / Education** | Editorial guides: "Pokemon 101: Where Do I Start?", "Planning My Team", metagame breakdowns. Beginner onboarding pipeline. |
| **Multi-language** | EN, JP, IT, FR, DE, ES, KO, ZH (8 languages). |
| **iOS App** | Paid app (~$0.99). 100% ad-free, fully offline. Usage data, team builder, meta calcs, deep search. Designed for live tournament use between rounds — works without venue Wi-Fi. |
| **Multi-format support** | VGC 2026 Reg M-A, Battle Stadium Singles, Smogon OU, Smogon Ubers, and more. |

### Share/Export UX

Pikalytics offers a comprehensive share/export workflow:
1. **Copy Team** — clipboard copy of the full team in Showdown format
2. **Share Team** — generates a shareable Pikalytics URL
3. **Share Image** — generates a visual team card image for social media
4. **Import from Showdown** — paste Showdown export directly into team builder
5. **Export to Showdown** — convert Pikalytics team back to Showdown format
6. **Share via PokePaste** — export directly to pokepast.es for universal sharing

The team builder also has "Create New Team" and "Saved Teams" management (browser-local, no account needed).

### Monetisation Model

| Stream | Detail |
|---|---|
| **Ko-fi membership** | Monthly tiers with member-only content and exclusive posts. Primary funding source. |
| **iOS App** | $0.99 one-time purchase. Separate from website features. |
| **Advertising partnerships** | "Advertise on Pikalytics" link in footer — non-intrusive, partnership model. |
| **No paywalled features** | All stats, team builder, and calc are free on the website. Premium is patronage, not access. |

**Key insight:** Pikalytics proves that VGC players will pay for tools through patronage even when the tool is free. The Ko-fi model works because the community values the data enough to fund it voluntarily.

### UX Strengths

- Dense data-rich layout that power users love
- Fast navigation flow: Pokedex → Team Builder → Calc (all interconnected)
- Meta Calcs integration is the standout: live calc inside team builder with meta-sourced attacker/defender suggestions — unmatched by any competitor
- Multi-language support reaches global VGC community
- Regular monthly data refreshes keyed to regulation changes
- Offline mobile app solves the "between rounds at a tournament" use case
- Gamified quizzes create daily return visits beyond team-building sessions

### UX Weaknesses

- No user accounts or team history on the web (browser-local only)
- No community layer (no comments, ratings, following, social features)
- Top Teams links out to Limitless — users leave the site for source data
- Team share is a URL with zero narrative: no matchup notes, no roles, no story
- Mobile app dead on Android (unpublished August 2024) — iOS only
- Data updates lag actual meta by weeks (competitor MunchStats was created specifically because Pikalytics refreshes too slowly)
- UX is tool-centric with no presentation or storytelling layer
- No team report / writeup capability

### What Pikalytics Does Better Than VGC Team Report

1. **Meta Calcs inside the team builder.** Real-time damage calc with auto-populated meta threats, all within the team-building workflow. VGC Team Report links out to an external calc. This seamless build → verify → adjust → re-check loop keeps power users on Pikalytics for hours.
2. **Authoritative, aggregated usage statistics.** Millions of battles aggregated per regulation, per format, with historical archives back to VGC 2017. Usage percentage, item distribution, EV spread clusters — all on one page per Pokemon. VGC Team Report has no meta-data layer.
3. **Gamified learning (quizzes).** Speed Quiz, Calc Quiz, and Type Quiz are sticky engagement loops with streak tracking. These attract players who are practising, not just building, and create daily return visits with zero content moderation overhead.
4. **Multi-format, multi-language reach.** 8 languages and coverage of Smogon/BSS/VGC simultaneously gives Pikalytics a much larger addressable audience.

### What VGC Team Report Does Better Than Pikalytics

1. **Player-authored narrative and storytelling.** VGC Team Report lets players explain *why* — matchup plans, spread rationale, lead decisions. Pikalytics shows raw data but has no way to communicate strategy or intent.
2. **Team discovery and community feed.** Browsable public reports with likes/comments/forks create a community layer. Pikalytics has no social dimension.
3. **Rich Discord embeds and social sharing.** Reports generate proper OG images and Discord embeds. Pikalytics share URLs are plain links.
4. **User accounts with team history.** Authenticated users can manage, version, and track their team reports over time.

---

## 2. PokePaste (pokepast.es)

### What It Is

PokePaste is a purpose-built pastebin for competitive Pokemon. Accepts Pokemon Showdown export format and returns a permanent URL with syntax-highlighted team display: Pokemon names coloured by type, moves coloured by type, item icons, sprites. No login required. Written in Go (v3 rewrite from the ground up), open-sourced under 3-clause BSD licence at `github.com/felixphew/pokepaste`. Created by felixphew, described on Smogon as "probably the single most influential independent project" on the simulator ecosystem.

### Core Features & UX Flow

| Feature | Detail |
|---|---|
| **Paste creation** | Paste Showdown export → unique cryptographic URL in seconds. No account required. |
| **Syntax highlighting** | Pokemon names coloured by primary type. Moves coloured by move type. Items highlighted by associated type (Z-crystals, type-enhancing items, resist berries). |
| **Sprite/image display** | Pokemon sprites and item images per set using Pokemon Global Link art. Broken for many newer forms (Mega evolutions, Zygarde-10%, Galarian forms). |
| **Title & Author fields** | Optional metadata — no registration needed. |
| **Notes field** | Freeform text per paste. URLs within notes not clickable (known unfixed bug). |
| **Mobile-friendly** | Standards-compliant responsive design. Functional but minimal. |
| **Privacy by design** | No public search, no browsing by author. URL-only discovery via cryptographic mapping. Intentional pre-tournament security. |
| **No expiry** | Pastes are permanent once created. |
| **VGC-aware defaults** | Assumes Level 50 when no level specified — format-correct for VGC. |
| **Open source** | GitHub: 121+ stars, 27+ forks. 155+ open issues. Maintenance debt visible. |

### Share/Export UX

PokePaste's share flow is the gold standard for frictionless team sharing:

1. User copies team from Pokemon Showdown teambuilder (Ctrl+C the export)
2. Pastes into the single text field on pokepast.es
3. Optionally adds title, author, and notes
4. Clicks "Submit"
5. Receives a permanent URL (e.g., `pokepast.es/abc123def456`)
6. Shares the URL anywhere — Discord, Reddit, Twitter, DMs, tournament chats

**Total time:** Under 10 seconds. Zero cognitive load. No decisions beyond paste and submit.

The URL itself is the entire product. It renders a styled view of the team that anyone can read. To import into Showdown, users simply copy the text from the rendered page.

**Ecosystem integrations:**
- Pikalytics "Import from PokePaste" accepts any pokepast.es URL
- PokePaste Exporter browser extension (Chrome/Firefox) adds export buttons to Showdown and Limitless
- crob.at can import any pokepaste URL and render it with better sprites and social embeds
- VGC Team Report accepts PokePaste import
- Tournament systems and team sheets reference pokepaste URLs

### Monetisation Model

**None.** Zero revenue streams:
- No ads
- No donations page
- No subscriptions
- No Ko-fi or Patreon
- No premium features

Purely a hobby/community project reliant on maintainer goodwill. This creates significant sustainability risk: 155+ open issues, broken sprites requiring community Chrome extensions to fix, creation failures reported in early 2026. The project shows clear maintenance debt with no funding path.

### UX Strengths

- Frictionless to the point of being invisible — paste → URL in ~10 seconds
- Universal adoption: de facto community standard for VGC team sharing (Reddit, Discord, Smogon, tournament systems)
- Privacy-safe for pre-tournament use — URL-only discovery, no search/index
- The URL *is* the product — share anywhere with zero formatting concerns
- Works as import source for every other tool in the ecosystem
- No login, no account, no decisions — lowest possible activation energy
- Permanent links that never expire

### UX Weaknesses

- **Sprite rot** — broken images for Zygarde-10%, Galarian forms, newer Mega forms. Community Chrome extension (pokepastefix) exists solely as a workaround
- **No narrative layer** — shows *what* a team is, never *why*
- **No discovery or browsing** — no way to find teams, no public feed, no search
- **Broken URL bug in notes** — URLs in notes field not clickable, unfixed for years
- **No calcs, no speed tiers, no meta context** — purely display
- **No accounts** — no team management, history, or "my pastes" view
- **No social embeds** — links shared on Discord/Twitter show plain text, no preview image
- **No mobile app** — web only
- **Degrading maintenance** — open issues accumulating, no clear development roadmap

### What PokePaste Does Better Than VGC Team Report

1. **Zero-friction sharing: paste-to-URL in under 10 seconds.** No login, no form fields, no decisions beyond paste and submit. VGC Team Report requires authentication and more steps — measurably higher activation energy for first-time users.
2. **Universal portability and community standardisation.** A pokepaste URL is understood everywhere — it is the lingua franca of competitive Pokemon sharing. Every downstream tool accepts it. This network-effect moat means players default to pokepaste even when better alternatives exist.
3. **Privacy-safe design for pre-tournament use.** Cryptographic URL with no public search means players can share with teammates without opponent discovery. VGC Team Report's public-by-default model is a barrier for tournament preparation.

### What VGC Team Report Does Better Than PokePaste

1. **Rich team reports with narrative.** Matchup plans, spread rationale, strategy notes, lead decisions — VGC Team Report explains a team, not just displays it.
2. **Visual presentation with social embeds.** Proper OG images, Discord embeds, shareable cards vs. PokePaste's plain text rendering with no preview.
3. **Community discovery and browsing.** Public feed of reports to explore, learn from, and build upon. PokePaste has zero discovery.
4. **Active maintenance and development.** VGC Team Report is actively developed with new features shipping regularly. PokePaste is effectively in maintenance-only mode with growing technical debt.
5. **Full sprite coverage.** Working sprites for all Pokemon forms including Mega Evolutions in Champions format — something PokePaste has failed to maintain.

---

## 3. Key Differentiators Summary

| Dimension | Pikalytics | PokePaste | VGC Team Report |
|---|---|---|---|
| **Core purpose** | Meta analytics + competitive tools | Frictionless team paste sharing | Team report creation + community sharing |
| **Target user** | Power players researching the meta | Anyone sharing a team quickly | Players explaining & showcasing their teams |
| **Usage stats** | Yes — monthly, authoritative | No | No |
| **Damage calculator** | Yes — advanced, inline Meta Calcs | No | No (external link) |
| **Speed tiers** | Yes — full reference + quiz | No | Yes — in reports |
| **Team builder** | Yes — meta-informed with suggestions | No | Yes — Showdown/PokePaste import |
| **Sprite quality** | Reliable, current | Broken for many forms | Full coverage including Megas |
| **Tournament top teams** | Yes — auto-aggregated from Limitless | No | Yes — champion report pages |
| **Player-authored narrative** | No | No (notes only, broken) | Yes — core product |
| **Matchup plans / gameplan** | No | No | Yes |
| **EV spread rationale** | No | No | Yes |
| **Team discovery / browsing** | Limited (Top Teams only) | None — URL-only | Yes — public feed |
| **User accounts** | No (web) | No | Yes (Clerk auth) |
| **Social features** | No | No | Yes (likes/comments/forks) |
| **Discord/social embeds** | Plain link | Plain text, no preview | Rich OG images + embeds |
| **Mobile experience** | iOS app (Android dead) | Minimal responsive web | Responsive PWA |
| **Multi-language** | 8 languages | No | No |
| **Gamification / quizzes** | 3 quiz types (Speed/Calc/Type) | No | No |
| **Educational content** | Yes — articles | No | No |
| **Privacy / unlisted mode** | Public teams | Yes — URL-only, no search | Public by default (unlisted exists) |
| **Import from Showdown** | Yes | N/A (is the paste) | Yes |
| **Export to PokePaste** | Yes | N/A | TBD |
| **Monetisation** | Ko-fi + iOS app | None | TBD (freemium) |
| **Open source** | Calc only | Yes (full project, BSD) | No |
| **Maintenance health** | Active, monthly updates | Degrading (155+ issues, sprite rot) | Active, shipping weekly |

---

## 4. Strategic Gaps VGC Team Report Can Close

### Gap 1 — Native Inline Damage Calculator (Pikalytics' Biggest Weapon)

Pikalytics' Meta Calcs integration — live calc with meta-sourced threats inside the team builder — is the feature that locks power users in. VGC Team Report currently links out. Build an embedded calc on each Pokemon's report card so users can verify calcs without leaving the report.

**Impact:** Every serious player runs calcs. The tool that hosts the calc owns the session.

### Gap 2 — Frictionless Share Entry Point (PokePaste's Biggest Moat)

PokePaste's share flow has zero activation energy. Adding a **guest/anonymous quick-share mode** — paste a Showdown export and get a shareable URL with basic report rendering, no login required — would capture the pokepaste use case while surfacing the richer report product. Auth prompts appear post-share ("save to your account to add matchup notes").

**Impact:** The first 10 seconds of a new user's experience determine whether they share with friends.

### Gap 3 — Gamified Practice Tools (Pikalytics' Engagement Loop)

Pikalytics has three streak-based quizzes that bring players back daily for practice, not just building. A **Speed Tier Quiz seeded from teams in the database** would create an organic loop: build report → quiz yourself on it → share with teammates.

**Impact:** Daily active users beat monthly visitors for SEO, retention, and virality.

### Gap 4 — Pre-Tournament Private Share Mode (PokePaste's Privacy Moat)

PokePaste's URL-only discovery lets players share without being Googled by opponents. Make the **unlisted/private tier front-and-centre** in the share flow, not buried. High-level players preparing for regionals need confidence their team won't be indexed.

**Impact:** High-level players are the community's influencers. Win them → win casual players.

### Gap 5 — Multi-Language Support (Pikalytics' Global Reach)

Pikalytics serves 8 languages. The VGC community is deeply international (Japan, Korea, Europe). Even partial i18n (Japanese + Spanish + Korean) would unlock significant underserved traffic.

**Impact:** Non-English VGC players currently have no narrative team-sharing tool in their language.

---

## 5. Positioning Statements

- **vs Pikalytics:** "Pikalytics tells you the meta. VGC Team Report tells your story in it."
- **vs PokePaste:** "PokePaste shares your team. VGC Team Report explains your team."

---

## 6. Threat Assessment

### Pikalytics — High Threat (Indirect)

Pikalytics is not a direct competitor (analytics vs. reports) but its team builder is expanding toward report-like features. If they add a narrative/notes layer to saved teams, they could absorb VGC Team Report's use case while retaining their data advantage. **Moat defence:** Our community/social layer (likes, comments, discovery feed) and rich narrative tools are hard for a data-first platform to replicate.

### PokePaste — Low Threat (Declining)

PokePaste is in maintenance-mode decline. It won't add features. The threat is not PokePaste improving — it's PokePaste's network effect keeping users in a worse tool by default. **Strategy:** Don't fight the standard — integrate with it. Import PokePaste URLs seamlessly, export to PokePaste format, and position VGC Team Report as "PokePaste with context."

### Emerging Competitors

- **crob.at** — PokePaste alternative with visual sprites, OG images, multi-team links. Addresses PokePaste's sprite/embed weaknesses. Growing in Discord sharing. Not a direct threat to reports but could erode PokePaste's position before we do.
- **PokeStats.gg** — Team builder with defensive/offensive coverage analysis. Closer to Pikalytics than to us.
- **VR Pastes (vrpastes.com)** — PokePaste alternative with password-protected pastes and Open Team Lists (hide EVs/IVs). Targeting the privacy use case we should own.
- **Reportworm** — VGC replay analysis tool. Complementary, not competitive.

---

## 7. Monetisation Context

| Tool | Model | Insight |
|---|---|---|
| Pikalytics | Ko-fi memberships + iOS app ($0.99) | Community-funded patronage model. No paywalled features. Proves VGC players will voluntarily pay for tools they rely on. |
| PokePaste | None | Zero revenue. Unsustainable. Maintenance debt accumulating. Chrome extension workarounds signal the tool is under-resourced. |
| VGC Team Report | TBD (freemium) | Neither competitor paywalls core features. Premium should be additive: report themes/branding, tournament presentation mode, private team vault beyond free quota, bulk export, advanced analytics on report views. Freemium is the only credible entry given community expectations. |

---

## Sources

- https://www.pikalytics.com/
- https://www.pikalytics.com/champions
- https://www.pikalytics.com/team
- https://www.pikalytics.com/topteams
- https://www.pikalytics.com/topteams/championstournaments
- https://www.pikalytics.com/calc
- https://www.pikalytics.com/damage-calculator
- https://www.pikalytics.com/speed-tiers
- https://www.pikalytics.com/speed-quiz
- https://www.pikalytics.com/pokedex
- https://www.pikalytics.com/pokedex/homebsd
- https://www.pikalytics.com/results
- https://apps.apple.com/us/app/pikalytics-battle-strategy/id1511370166
- https://mwm.ai/apps/pikalytics-battle-strategy/1511370166
- https://grokipedia.com/page/Pikalytics
- https://pokepast.es/
- https://pokepast.es/syntax.html
- https://github.com/felixphew/pokepaste
- https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/
- https://crob.at/pokepaste
- https://www.vrpastes.com/
- https://pokestats.gg/team-builder
- https://pokemonvgcteamreport.com/
- https://pokemonvgcteamreport.com/champions
- https://reportworm.com/
- https://chromewebstore.google.com/detail/pokepaste-exporter/eehioifimidcjcdlaehajhdeaekmmdne
