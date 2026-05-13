# Competitor Teardown: Pikalytics & PokePaste

**Produced:** 2026-05-13
**Scope:** Full feature, UX, monetisation, and gap analysis vs VGC Team Report (vgc-team-report.vercel.app)

---

## 1. Pikalytics (pikalytics.com)

### What It Is

Pikalytics is the dominant competitive Pokémon statistics platform. It aggregates usage data from millions of ranked battles on Showdown, Pokémon HOME, and Battle Stadium, and now covers Pokémon Champions (the 2026 official VGC format). It is the industry reference for usage rates, EV spreads, movesets, items, and teammate synergy across VGC, Smogon, and GO PvP formats.

### Feature Inventory

| Feature | Detail |
|---|---|
| **Pokédex / Usage Stats** | Per-Pokémon page: usage %, ability distribution, item distribution, top moves, EV spread clusters, common teammates, counters, Tera type preferences. Filterable by regulation and format. Updated monthly. |
| **Team Builder** | Build 6-mon teams with suggested sets from meta data. Import/Export Showdown paste. Share team via URL. Share team as image (screenshot). |
| **Meta Calcs (inline)** | "Meta Calcs" button inside Team Builder launches a live damage calculator. Spreads/moves/items update offensive and defensive calcs in real time. Pulls likely attackers/defenders from Champions ladder automatically. |
| **Standalone Damage Calculator** | `/calc` — full calc handling weather, terrain, screens, Helping Hand, Intimidate, spread-move penalties, Mega options. Forked from Smogon calc. |
| **Top Teams** | Glanceable 6-mon showcase cards from recent tournament results. Expandable to full moveset. Links out to Limitless VGC. |
| **Champions Hub** | Dedicated section for Pokémon Champions 2026: usage rankings, Pokédex, team builder entry, top threats digest. |
| **Tournament Results** | Historical results viewer. |
| **Speed Tiers** | `/speed-tiers` — full speed tier reference table for the current format. |
| **Gamification / Quizzes** | Three interactive learning tools: **Speed Quiz** (streak-based speed-tier guessing), **Calc Quiz** (guess damage bucket from full calc strings), **Type Quiz** (super-effective check with ability modifiers). All log session history. |
| **Articles / Education** | Editorial guides: "Pokemon 101: Where Do I Start?", "Planning My Team", metagame breakdowns. Beginner onboarding pipeline. |
| **Multi-language** | EN, JP, IT, FR, DE, ES, KO, ZH. |
| **iOS App** | Paid app (~$0.99). 100% ad-free, offline. Favourites, usage stats, meta data. **Android app unpublished from Google Play August 2024** — effectively dead. iOS reviews note app lags behind website features. |

### Monetisation

- **Ko-fi membership** (primary): Monthly tiers with member-only content and exclusive posts. Covers server costs and developer expenses.
- **No paywalled features**: All stats, team builder, and calc are free.
- **No display advertising** on the main site.
- **"Advertise on Pikalytics"** link in footer — suggests some ad partnerships exist or are offered but are not intrusive.
- iOS app is paid ($0.99 one-time); separate from website features.

### UX Notes

**Strengths:** Dense data-rich layout that power users love. Fast navigation Pokédex → Team Builder → Calc. Meta Calcs integration is the standout workflow: live calc inside team builder with meta-sourced attacker/defender suggestions is not matched by any other tool. Multi-language support. Regular monthly data refreshes keyed to regulations.

**Weaknesses:** No user accounts or team history on the web. No community layer (no comments, ratings, following). Top Teams link out to Limitless — users leave the site. Team share is a URL with zero narrative: no matchup notes, no roles, no story. Mobile app is dead on Android. Data updates lag the actual meta by weeks (MunchStats was created specifically because Pikalytics is too slow to refresh). UX is tool-centric — no presentation or storytelling layer.

### Top 3 Things Pikalytics Does Better Than VGC Team Report

1. **Meta Calcs inside the team builder.** Real-time damage calc with auto-populated meta threats, all within the team-building workflow. VGC Team Report links out to an external calc. This seamless loop — build team → verify spreads → adjust → re-check — keeps power users on Pikalytics for hours.
2. **Authoritative, aggregated usage statistics.** Millions of battles aggregated per regulation, per format, with historical archives back to VGC 2017. Usage percentage, item distribution, EV spread clusters — all on one page per Pokémon. VGC Team Report has no meta-data layer at all.
3. **Gamified learning (quizzes).** Speed Quiz, Calc Quiz, and Type Quiz are sticky engagement loops. Streak-based with session logs. These attract players who are practising, not just building, and create daily return visits. No other tool in the space has implemented this.

---

## 2. PokePaste (pokepast.es)

### What It Is

PokePaste is a purpose-built pastebin for competitive Pokémon. Accepts Pokémon Showdown export format and returns a permanent URL with syntax-highlighted team display: Pokémon names coloured by type, moves coloured by type, item icons, sprites. No login required. Written in Go, open-sourced at `github.com/felixphew/pokepaste`.

### Feature Inventory

| Feature | Detail |
|---|---|
| **Paste creation** | Paste Showdown export → unique cryptographic URL in seconds. No account. |
| **Syntax highlighting** | Pokémon names and moves coloured by type. Items highlighted. |
| **Sprite/image display** | Pokémon sprites and item images per set. Broken for many forms (see weaknesses). |
| **Notes field** | Freeform text per paste. URLs not clickable without dev tools (known unfixed bug). |
| **Mobile-friendly** | Developer-described as standards-compliant. Functional but minimal. |
| **Privacy by design** | No public search or browsing by author. URL-only discovery — intentional pre-tournament security. |
| **No expiry** | Pastes are permanent. |
| **VGC-aware defaults** | Assumes Level 50 when no level is specified — format-correct out of the box. |
| **Open source** | GitHub: 121 stars, 27 forks. 155+ open issues. Last major release date unclear. |

### Monetisation

**None.** Purely a hobby/community project. No ads, no donations page, no subscriptions. Entirely reliant on maintainer goodwill. This creates acute sustainability risk: the project shows clear maintenance debt (155 open issues, a Chrome extension built specifically to fix broken sprites, creation failures reported in February 2026).

### UX Notes

**Strengths:** Frictionless to the point of being invisible. Paste → URL in ~10 seconds with zero cognitive load. The URL *is* the product — share it anywhere. Universal adoption: every VGC team shared publicly on Reddit, Discord, Smogon, and tournament systems uses a pokepaste link. De facto community standard. Works as an import source for Pikalytics, VGC Team Report, Showdown, and a dozen other tools.

**Weaknesses:** Sprite rot is the most visible failure — broken images for Zygarde-10%, special Galarian forms, newer Mega forms. A community Chrome extension (pokepastefix, maintained through April 2026) exists solely to work around this. No narrative layer — shows *what* a team is, not *why*. No discovery or browsing at all. Notes field has a broken URL bug that has gone unfixed for years. No calcs, no speed tiers, no meta context. No accounts means no team management, history, or "my pastes" view.

### Top 3 Things PokePaste Does Better Than VGC Team Report

1. **Zero-friction sharing: paste-to-URL in under 10 seconds.** No login, no form fields, no decisions. Anyone who can copy-paste a Showdown export can create and share a team instantly. VGC Team Report requires more steps and auth — the activation energy is measurably higher for first-time users.
2. **Universal portability and community standardisation.** A pokepaste URL is understood everywhere — it is the lingua franca of competitive Pokémon sharing. Every downstream tool (Pikalytics import, Showdown, tournament systems) accepts it. This network-effect moat means players default to pokepaste even when better alternatives exist.
3. **Privacy-safe design for pre-tournament use.** The cryptographic URL with no public search means players can safely share their team with teammates without it being discoverable by opponents. VGC Team Report's public-by-default model is a barrier for players preparing for a tournament who don't want their team indexed.

---

## 3. Three-Column Comparison Table

| Feature | Pikalytics | PokePaste | VGC Team Report |
|---|---|---|---|
| **Core purpose** | Meta analytics + tools | Team paste sharing | Team report creation + sharing |
| **Usage stats (meta data)** | Yes — monthly, authoritative | No | No |
| **Damage calculator** | Yes — advanced, inline Meta Calcs | No | No (external link) |
| **Speed tiers reference** | Yes — `/speed-tiers` page | No | Yes |
| **Team builder** | Yes — meta-informed suggested sets | No | Yes — Showdown import |
| **Sprite display** | Yes — reliable | Yes — broken for many forms | TBD / needs parity |
| **Tournament top teams** | Yes — auto-aggregated from Limitless | No | Yes — champion pages |
| **Player-authored narrative** | No | No (notes only, broken URLs) | Yes — core product |
| **Matchup plans / gameplan** | No | No | Yes |
| **EV spread rationale** | No | No | Yes |
| **Team discovery / browsing** | No | No | Yes — public feed |
| **User accounts** | No | No | Yes (Clerk auth) |
| **Social: likes/comments/follow** | No | No | Partial (fork/like/comment) |
| **Fork / clone a team** | No | No | Yes |
| **Mobile app** | iOS only (Android dead) | No app | PWA |
| **Mobile web** | Poor (app was the solution) | Functional but minimal | Responsive / PWA |
| **Multi-language** | Yes — 8 languages | No | No |
| **Gamification / quizzes** | Yes — Speed Quiz, Calc Quiz, Type Quiz | No | No |
| **Educational articles** | Yes | No | No |
| **Wrapped / shareable cards** | No | No | Yes |
| **Tiered publishing** | No | No | Yes |
| **Monetisation** | Ko-fi donations + iOS app | None | TBD |
| **Open source** | Calc only | Yes (full project) | No |
| **Privacy / pre-tournament** | No — public teams | Yes — URL-only, no search | Public by default |
| **Import from Showdown paste** | Yes | N/A (is the paste) | Yes |
| **Data freshness** | Monthly | Immediate (static) | Real-time (player-authored) |
| **Maintenance health** | Active | Degrading (155+ open issues) | Active |

---

## 4. Top 5 Features / Gaps VGC Team Report Can Close

### Gap 1 — Native inline damage calculator (Pikalytics' biggest weapon)
Pikalytics' Meta Calcs integration — live calc with meta-sourced threats inside the team builder — is the feature that locks power users in. VGC Team Report currently links out. The gap: build an embedded calc on each Pokémon's report card so users can verify calcs without leaving the report. Even a read-only calc view embedded in the matchup section would close the biggest workflow friction point.

**Why it matters:** Every serious player runs calcs. The tool that hosts the calc owns the session.

### Gap 2 — Sprite quality and Mega form parity (PokePaste's active failure)
PokePaste has a Chrome extension maintained by a community volunteer specifically to fix its broken sprites. Mega Evolution forms (Charizard-X/Y, Rayquaza, etc.) and newer special forms are broken on pokepaste. VGC Team Report should guarantee full, current sprite coverage for every Pokémon and Mega form in Pokémon Champions, and make this visible ("always-current sprites" as a copyable differentiator).

**Why it matters:** Sprite rot is visible to every user. Players notice immediately and share screenshots of broken pastes. Fixing what pokepaste can't is a free credibility win.

### Gap 3 — Frictionless share entry point (PokePaste's biggest moat)
PokePaste's share flow has zero activation energy. VGC Team Report requires auth and more steps. Adding a **guest/anonymous quick-share mode** — paste a Showdown export and get a shareable URL with basic report rendering, no login required — would capture the pokepaste use case while surfacing the richer report product. Auth prompts can appear post-share ("save this to your account to add matchup notes").

**Why it matters:** The first 10 seconds of a new user's experience determine whether they share with friends. Removing the login gate for basic sharing converts more word-of-mouth.

### Gap 4 — Gamified practice tools (Pikalytics' engagement loop nobody else copies)
Pikalytics has three streak-based quizzes (Speed Quiz, Calc Quiz, Type Quiz) that bring players back daily for practice sessions, not just when they're building a team. These create sustained engagement with zero content moderation overhead. VGC Team Report has no equivalent retention mechanism. Adding a **Speed Tier Quiz seeded from teams in the database** would create an organic loop: users build a report → quiz themselves on it → share the quiz with teammates.

**Why it matters:** Daily active users beat monthly visitors for SEO, ad inventory, and virality.

### Gap 5 — Pre-tournament private share mode (PokePaste's privacy moat)
PokePaste's URL-only discovery model lets players share with their team without being Googled by opponents. VGC Team Report's public-by-default model is a dealbreaker for competitive players near a major event. Adding a **private/unlisted tier** — full report visible to anyone with the link, not indexed or browseable — removes the biggest objection high-level players have to switching. This is already partially in scope (tiered publishing exists), but it needs to be front-and-centre in the share flow, not buried.

**Why it matters:** High-level players are the community's influencers. If they won't use the tool for tournament prep, casual players won't hear about it either.

---

## 5. Positioning Statements

- vs Pikalytics: "Pikalytics tells you the meta. VGC Team Report tells your story in it."
- vs PokePaste: "PokePaste shares your team. VGC Team Report explains your team."

---

## 6. Monetisation Context

| Tool | Model | Notes |
|---|---|---|
| Pikalytics | Ko-fi memberships + iOS app ($0.99) | Community-funded grassroots model. Membership tiers signal paying VGC users exist. No paywalled features — premium is patronage, not access. |
| PokePaste | None | Zero revenue. Maintenance debt accumulating. Community workarounds (Chrome extension) signal the tool is under-resourced. |
| VGC Team Report | TBD (freemium) | Neither competitor paywalls core features. Premium should be additive: report branding/themes, tournament presentation mode, private team history beyond free quota, bulk export. Freemium is the only credible entry. |

---

## Sources

- https://www.pikalytics.com/
- https://www.pikalytics.com/champions
- https://www.pikalytics.com/team
- https://www.pikalytics.com/topteams
- https://www.pikalytics.com/calc
- https://www.pikalytics.com/speed-tiers
- https://www.pikalytics.com/speed-quiz
- https://www.pikalytics.com/calc-quiz
- https://www.pikalytics.com/type-quiz
- https://www.pikalytics.com/articles
- https://www.pikalytics.com/results
- https://ko-fi.com/pikalytics
- https://apps.apple.com/us/app/pikalytics-battle-strategy/id1511370166
- https://www.appbrain.com/app/pikalytics-battle-strategy/com.pikalytics
- https://pokepast.es/
- https://pokepast.es/syntax.html
- https://github.com/felixphew/pokepaste
- https://github.com/felixphew/pokepaste/issues
- https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/
- https://www.smogon.com/forums/threads/pokepaste-image-fix.3733096/
- https://chrome-stats.com/d/ekceaboabpgkgbpigacngnjagcdhdkmn
- https://crob.at/pokepaste
- https://victoryroad.pro/sv-reports/
- https://limitlessvgc.com/teams
- https://pokemonvgcteamreport.com/
- https://porygonlabs.com/
- https://www.vgcpedia.com/website/pikalytics/
- https://mwm.ai/apps/pikalytics-battle-strategy/1511370166
