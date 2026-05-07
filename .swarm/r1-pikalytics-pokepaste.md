# Competitive Intelligence: Pikalytics & PokePaste Teardown

**Researched:** 2026-05-07  
**Analyst:** Claude Code (r1 swarm agent)  
**Scope:** pikalytics.com and pokepast.es — full feature, UX, monetization, and gap analysis vs VGC Team Report

---

## 1. Pikalytics (pikalytics.com)

### What It Is
Pikalytics is the dominant competitive Pokémon statistics platform, covering VGC, Smogon singles, Battle Stadium, Pokémon GO PvP, and now Pokémon Champions (2026). It is the go-to reference for usage rates, EV spreads, movesets, items, and teammate synergy data derived from Showdown ladder, PGL, and Pokémon HOME.

### Feature Inventory

| Feature | Description |
|---|---|
| **Pokédex / Usage Stats** | Per-Pokémon page: usage %, ability distribution, item distribution, top moves, EV spread clusters, common teammates, counters, and Tera type preferences. Filterable by regulation and format. |
| **Team Builder** | Build a team of 6 with suggested sets pulled from meta data. Includes Import/Export from Showdown paste. Share team via URL. Share team as image (screenshot). |
| **Meta Calcs (inline damage calc)** | "Meta Calcs" button inside Team Builder launches a live damage calculator. Change spreads/moves/items and see updated offensive and defensive calcs in real time. Pulls likely attackers/defenders from Champions ladder automatically. |
| **Standalone Damage Calculator** | `/calc` — full-featured calculator. Handles weather, terrain, screens, Helping Hand, Intimidate, spread-move penalties, and Mega options. Open-sourced at `github.com/pikalytics/pikalytics-calc` (forked from Smogon calc). |
| **Top Teams** | Showcase of standout tournament teams. Glanceable 6-mon cards, expandable to full moveset. Links out to Limitless VGC for source data. |
| **Champions Hub** | Dedicated section for Pokémon Champions format (2026): usage rankings, Pokédex, team builder entry point, top threats digest. |
| **Tournament Results** | Historical results viewer at `cdn.pikalytics.com/results`. |
| **Articles / Education** | Editorial section with beginner-to-advanced teambuilding guides (e.g., "Pokemon 101: Where Do I Start?", "Planning My Team"). |
| **Multi-language** | EN, JP, IT, FR, DE, ES, KO, ZH — significant for international competitive scene. |
| **Mobile App (iOS)** | Native iOS app. iOS App Store rating: available. Android app: **unpublished from Google Play in August 2024**, last updated July 2024. Reviews noted: "not updated regularly," "app and website DO NOT match." |

### Monetization
- **Ko-fi** (primary): Monthly membership tiers with member-only benefits and exclusive posts. URL: `ko-fi.com/pikalytics`. Self-described as "grassroots Pokemon fansite" — donations cover developer expenses and server costs.
- **No paywalled core features**: All usage stats, team builder, and damage calc are free.
- **iOS app**: Available on App Store; unclear if free or premium (Android was free).
- **No display advertising** visible on main site (community-funded model).

### UX Assessment
- **Strengths**: Dense, data-rich layout that power users love. Fast navigation between Pokédex → Team Builder → Calc. Meta Calcs integration is genuinely differentiated — live calc updates inside the team builder is a killer workflow. Multi-language support is rare and valuable. Regular format updates (monthly data refreshes).
- **Weaknesses**:
  - Data update lag: usage stats update monthly, not daily or live. MunchStats was literally created because "Pikalytics is taking a while to update its usage stats."
  - Mobile app is effectively dead (Android unpublished, iOS lagging behind website).
  - UX is tool-centric / data-first — no storytelling, no presentation layer, no narrative around a team.
  - No user accounts or team history on the web.
  - No community features (no comments, ratings, following).
  - Top Teams cards link out to Limitless rather than being self-contained — users leave the site.
  - Team sharing is URL-based with no descriptive context — paste your team, get a link, done. No matchup notes, no RPS plans, no tournament context.

### What Pikalytics Does Better Than VGC Team Report
1. **Usage statistics** — authoritative, deep, with historical data by format. VGC Team Report has none.
2. **Integrated damage calculator** — Meta Calcs inside the team builder is a seamless workflow that VGC Team Report lacks natively (external Calc link instead).
3. **Per-Pokémon pages** — finding the best EV spread or most common item for a specific Pokémon is instant on Pikalytics; VGC Team Report requires manual entry.
4. **Top Teams aggregation** — automated ingestion of tournament data. VGC Team Report relies on players self-publishing.
5. **Multi-language** — VGC Team Report appears English-only.
6. **Educational articles** — onboarding content that attracts beginners who then stay for tools.

---

## 2. PokePaste (pokepast.es)

### What It Is
PokePaste is a purpose-built pastebin for competitive Pokémon. It accepts Pokémon Showdown team export format and returns a permanent URL with syntax-highlighted display: Pokémon names colored by type, moves colored by type, item icons, and Pokémon sprites. No login required.

### Feature Inventory

| Feature | Description |
|---|---|
| **Paste creation** | Paste Showdown export → get a unique URL. Cryptographic ID (not guessable). Instant, no account. |
| **Syntax highlighting** | Pokémon names colored by type. Moves colored by type. Items highlighted (Z-crystals, type-enhance items, resist berries). |
| **Sprite / image display** | Pokémon sprites and item images shown per set. |
| **Notes field** | Freeform text notes on the paste. Limited (URLs not clickable in notes without developer tools). |
| **Mobile-friendly** | Described as "standards-compliant and mobile-friendly" by the developer. |
| **No accounts** | Intentional. Privacy-first design: no user profiles, no history, no search by author. |
| **No expiration** | Pastes are permanent once created (by design). |
| **Gen 9 / Tera support** | Tera types included in export format, displayed on paste. |
| **Open source** | GitHub: `felixphew/pokepaste`, written in Go (v3 rewrite). 121 stars, 27 forks. |

### Monetization
- **None detected**. Purely community-funded/hobby project. Developer noted "any and all support is greatly appreciated." No ads, no subscriptions, no Ko-fi found.
- Essentially a public good — no revenue model. This is both a strength (no friction) and a risk (maintainability).

### UX Assessment
- **Strengths**:
  - Frictionless: paste-in, get URL, share. Zero onboarding. The entire flow is ~10 seconds.
  - The URL is the product: copy it anywhere — Reddit, Discord, Twitter, tournament docs.
  - Universal adoption: nearly every VGC team shared publicly uses a pokepaste link. It is the de facto standard.
  - Works as an import source for other tools (Pikalytics, VGC Team Report, Showdown, etc.).
  - Intentional privacy (no search by content = no leaking your team pre-tournament).
- **Weaknesses**:
  - **Sprite/image rot**: The project has 155 open GitHub issues. A Chrome extension (pokepastefix) exists specifically to restore broken images — it's been maintained through April 2026 adding Pokémon Legends ZA Mega forms. This is a trust-eroding maintenance failure.
  - **No narrative layer**: A pokepaste shows you *what* a team is, not *why*. No matchup notes, no gameplan, no context around EV choices.
  - **No discovery**: Cannot browse by format, archetype, or usage. You only find a paste if you were given its link.
  - **No accounts/history**: Players cannot manage their own paste collection. No "my teams" view.
  - **Low maintenance**: Last major release unclear; issues average 66 days to close. Problems creating pastes reported as recently as February 2026.
  - **Notes UX is broken**: Cannot click URLs in the notes field without developer tools — a known unfixed bug.
  - **No calcs or analysis**: Pure display only. No damage calc, no speed tier, no meta context.
  - **Format coverage gaps**: Some Pokémon forms (Zygarde-10%, older special forms) historically fail to render sprites.

### What PokePaste Does Better Than VGC Team Report
1. **Zero friction sharing**: No login, no form — paste and go. VGC Team Report has more steps.
2. **Universal portability**: A pokepaste URL works everywhere. It is the format the community already speaks.
3. **Import pipeline**: Other tools import from pokepaste, making it a data source hub.
4. **Privacy by design**: Pre-tournament team security (no public search).
5. **Speed**: Instantaneous for anyone who knows Showdown export format.

---

## 3. Competitive Landscape Context

### Other Key Players Observed
- **Limitless VGC** (`limitlessvgc.com/teams`): Tournament database, top-placing teams by event, season, regulation. Strong data authority. Links between Pikalytics and Limitless are tight.
- **VGC.tools**: Community team library with public paste browsing, Showdown integration. More social/discovery-oriented than pokepaste.
- **Falinks Teambuilder** (`falinks-teambuilder.com/pastes/vgc/`): VGC paste repository with curated community teams by regulation.
- **Victory Road** (`victoryroad.pro`): Editorial team reports by players after strong tournament finishes. High quality but gatekept (only invited players submit).
- **MunchStats**: Created explicitly because Pikalytics updates too slowly. Faster data refresh cycle.
- **Porygon Labs**: Team builder with Champions format support, pulling real usage percentages.
- **VGC Pastes (@VGCPastes on X)**: Twitter-based curation account with 37K+ followers. Regulation-tagged team repositories in spreadsheets and Discord bots. 1150+ Reg H teams catalogued.

---

## 4. Gap Analysis: What VGC Team Report Can Exploit

### Gaps in Pikalytics
| Gap | VGC Team Report Opportunity |
|---|---|
| No narrative/context per team | Full report editor with per-Pokémon notes, matchup plans, gameplan section |
| No community/social layer | Public feed, following, upvotes, featured reports |
| Top Teams link out to Limitless | Self-contained team report pages with embedded context |
| Monthly data lag | Could integrate live data (Limitless, Showdown ladder API) for freshness |
| No tournament presentation mode | Slide-style report view for tournaments / streams |
| Dead mobile app | Mobile-first report view / share flow |
| No user accounts on web | Auth + saved team history + public profile |

### Gaps in PokePaste
| Gap | VGC Team Report Opportunity |
|---|---|
| Broken/missing sprites (no maintenance) | Always-current sprites with Mega form support |
| No narrative/writeup layer | Structured report template (roles, EVs rationale, matchup notes) |
| No discovery/browsing | Format, regulation, archetype-based browsing and search |
| Notes field is broken for URLs | Rich text notes with working links, images, video |
| No accounts/history | "My Teams" collection, version history, fork/clone a paste |
| No calcs integration | Inline damage calc on each Pokémon in the report |
| No social signal | View counts, likes, public profile, shareability with OG image |
| Format is static display only | Dynamic: speed tier overlay, type coverage matrix, synergy score |

### Phrasing the Positioning
- vs Pikalytics: "Pikalytics tells you the meta. VGC Team Report tells your story in it."
- vs PokePaste: "PokePaste shares your team. VGC Team Report explains your team."

---

## 5. Monetization Summary

| Tool | Model | Assessment |
|---|---|---|
| Pikalytics | Ko-fi donations, monthly membership tiers, iOS app | Sustainable grassroots. Ko-fi membership signals there is a paying user base willing to support quality VGC tools. |
| PokePaste | None | Zero revenue. Runs on goodwill. Maintenance debt is accumulating — image issues, 155 open issues, infrequent releases. Community workaround (browser extension) is a trust signal that the tool is underfunded. |
| VGC Team Report | TBD | Neither competitor has paywalled features. Premium could work for: report branding/themes, tournament presentation mode, team history beyond N pastes, bulk export. Freemium model is the right entry. |

---

## 6. Key Takeaways (Priority Order)

1. **Sprite/image quality is a live wedge vs PokePaste.** PokePaste's broken sprites have forced a third-party Chrome extension. VGC Team Report should guarantee correct, updated sprites for every Pokémon including Mega forms — and make this visible.

2. **The "report" layer is the entire differentiation.** Neither Pikalytics nor PokePaste gives players a way to explain *why* their team works: EV spread rationale, matchup gameplan, lead selection logic. This is the product.

3. **Discovery is broken in the ecosystem.** PokePaste is link-based (no browsing). Limitless only shows top finishers. VGC Pastes is a Twitter account. There is no well-designed, searchable library of community team reports. VGC Team Report can own this.

4. **Pikalytics' Meta Calcs integration is the most advanced feature in the space.** A seamless calc-inside-teambuilder workflow is table stakes if VGC Team Report wants to compete for team-building workflows, not just post-build reporting.

5. **Both competitors are free with no ad monetization.** The community expects free tools. Monetization must be additive (presentation mode, branding, history) not gated on core usage.

6. **Data freshness is Pikalytics' Achilles heel.** Monthly updates create windows where the meta has shifted. A tool that integrates more live or weekly data would gain credibility with high-level players.

7. **Mobile is a vacuum.** Pikalytics' Android app is dead. PokePaste has no app. VGC Team Report could own the mobile team-sharing experience.

---

## Sources Referenced
- https://www.pikalytics.com/
- https://www.pikalytics.com/champions
- https://www.pikalytics.com/team
- https://www.pikalytics.com/topteams
- https://www.pikalytics.com/calc
- https://www.pikalytics.com/articles
- https://github.com/pikalytics/pikalytics-calc
- https://ko-fi.com/pikalytics
- https://pokepast.es/
- https://github.com/felixphew/pokepaste
- https://github.com/felixphew/pokepaste/issues
- https://chromewebstore.google.com/detail/pokepastefix/ekceaboabpgkgbpigacngnjagcdhdkmn
- https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/
- https://www.appbrain.com/app/pikalytics-battle-strategy/com.pikalytics
- https://limitlessvgc.com/teams
- https://vgc.tools/
- https://www.falinks-teambuilder.com/pastes/vgc/
- https://victoryroad.pro/resources/
- https://munchstats.com/
- https://pokemonvgcteamreport.com/
- https://x.com/VGCPastes
