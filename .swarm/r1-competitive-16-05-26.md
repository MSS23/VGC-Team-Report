# Competitive Intelligence Refresh: May 16, 2026

**Produced:** 2026-05-16
**Basis:** Builds on r1-competitor-pikalytics-pokepaste.md (May 13) and r2-competitor-vgcpastes-limitless.md (May 13)
**Scope:** Changes since last teardown + new entrants launched in 2026

---

## 1. Pikalytics — May 2026 Changes

**Desktop Team Builder Redesign (confirmed, active)**
Pikalytics shipped a visual redesign of the desktop Champions Team Builder: simplified and streamlined card UIs to match mobile, improved set readability. Source: @Pikalytics on X (`x.com/Pikalytics/status/2054762973403754941`).

**No new sharing features.** The share surface remains: Copy Team, Share URL, Share Image, Share Pokepaste — same four options as at last teardown. No narrative layer, no matchup notes, no player-authored context.

**No structural product changes.** Champions Hub, Meta Calcs, quizzes, Top Teams, Speed Tiers, and Pokédex are all unchanged in feature scope. Data is refreshed with Regulation M-A (Pokémon Champions). Mobile app remains iOS-only; Android is still unpublished.

**Assessment:** Iterative UI polish, not a feature launch. The gap identified in the May 13 teardown — no player voice, no authored report layer — remains fully open.

---

## 2. PokePaste (pokepast.es) — May 2026 Changes

**Version 1.1.1 shipped April 12, 2026 (confirmed)**
The only notable update: added support for all new Pokémon Legends Z-A Mega Pokémon alongside the Pokémon Champions launch. This is a compatibility patch, not a feature expansion.

**PokePaste Exporter Chrome extension v1.4.0** also added Legends Z-A Mega support.

**pokepastefix Chrome extension** — the community workaround for broken sprites — is confirmed still active and being maintained as of May 2026. The underlying sprite rot in pokepast.es is unfixed.

**No new features.** Notes field bug (URLs not clickable) remains unfixed. No accounts, no narrative layer, no discovery improvements. 155+ open GitHub issues. Maintenance posture is still "compatibility patches only."

**Assessment:** Status quo. PokePaste's sustained maintenance debt is a persistent opportunity: it remains the community standard for paste sharing while offering nothing beyond the bare paste.

---

## 3. VGCpastes — May 2026 Changes

**Pokémon Champions Replica Repository launched**
VGCpastes launched a dedicated Replica (rental code) repository for Pokémon Champions Regulation M-A, starting with 47 teams at launch and growing. This is consistent with their operational model — community-submitted paste + rental code pairs per new regulation.

**No new features.** Sandshrew Bot was updated for Pokémon Champions Regulation M-A (expected). The spreadsheet/Falinks Teambuilder web layer is unchanged structurally.

**Assessment:** VGCpastes executed their standard regulation-launch playbook cleanly and quickly. No new feature surface; still entirely paste + rental code storage with no narrative layer.

---

## 4. Limitless VGC — May 2026 Changes

**No significant new sharing or report features identified.** The platform appears to have updated with Pokémon Champions tournament data (expected — automatic pipeline from rk9.gg). No evidence of player notes, write-up fields, or any authored content features being added.

**Assessment:** The scenario to monitor (Limitless adding a "player write-up" field to team pages) has not materialised as of May 16, 2026. The gap remains open.

---

## 5. NEW Tools Launched in 2026 — Competitive Threat Assessment

The Pokémon Champions launch (April 8, 2026) triggered a wave of new third-party tools. The following are confirmed new or significantly relaunched in 2026:

### Champions Builder (championsbuilder.com)
**Beta launched: April 8, 2026**
Features confirmed: SP calculator, damage calc, Mega Evolution support, Showdown export. A clean free tool timed exactly to the Champions launch. No sharing narrative, no accounts, no report layer.
**Threat level: Low.** Utility tools only; no report authoring.

### Champions Lab (championslab.xyz)
**Active, last updated May 13, 2026**
Features: Pokédex, Team Builder (moves/nature/items/EVs), 2,000,000-battle simulation engine, Meta dashboard ("PokeSchool"), Share and Save team URLs. Open source, free, no paywall.
**Notable:** Battle simulator with 2M-battle engine is the standout differentiator — no other free tool has this. Team sharing is URL-based with Save/Load/Import/Export but no player narrative.
**Threat level: Medium.** If Champions Lab adds a structured write-up section alongside their battle sim results, they could attract the analytical community. Current product has no authored content layer.

### PikaChampions (pikachampions.com)
Features: 263 Pokémon with Mega Evolutions, type coverage checking, SP training planning, 6-pick-4 doubles format support. Free.
**Threat level: Low.** Type/coverage calculator with no sharing or report features.

### vgc.tools
**Active for Champions format**
Features: Team builder, **strategy notes per team**, community public library, team search by Pokémon/moves/abilities, educational guides on mechanics. Clean shareable URLs.
**This is the most direct new competitor to VGC Team Report.** vgc.tools offers player-authored strategy notes + community team library — the closest feature overlap with VGC Team Report's core value proposition. No structured report template (concept → sets → matchups), no damage calc embeds, no tiered privacy, no player profile pages.
**Threat level: Medium-High.** Positioned in the same "share team + write notes" space. Still lacks structured authoring depth.

### Game8 Team Sharing Board (game8.co/games/Pokemon-Champions)
Features: Community team submissions with upvoting, featured team showcase, Team Builder with type checker, export image + URL, Replica Team ID import. Ran a Best Team Contest (April 11 – May 4, 2026).
**Threat level: Low-Medium.** Game8 is a large gaming wiki with significant organic traffic. Their Team Sharing Board is shallow (community bulletin board style) with no structured report format. High discovery surface but low depth.

---

## 6. Feature Gap Matrix (Updated)

| Gap | Previous Status | May 16 Status |
|---|---|---|
| Player-authored narrative (team concept, set rationale, matchup plans) | Only VGC Team Report has this | Still only VGC Team Report — vgc.tools has lightweight strategy notes but no structured template |
| Inline damage calculator | Pikalytics only | Champions Builder + Champions Lab added standalone calcs; still no inline calc in a report context |
| Anonymous/guest quick-share | Open gap | vgc.tools closes this partially — clean URL sharing without friction |
| Pre-tournament private/unlisted mode | Open gap | Still open across all competitors |
| Battle simulation | Pikalytics (meta calcs) | Champions Lab's 2M-battle engine is new and notable |
| Sprite quality for Mega forms | PokePaste broken; others variable | PokePaste patched (v1.1.1); VGC Team Report should confirm parity |

---

## 7. #1 Feature Gap to Close in the Next 2 Weeks

### Structured "Private / Unlisted" Share Mode

**The gap:** Every new 2026 tool defaults to public sharing or URL-only (no accounts, no control). VGC Team Report is uniquely positioned to offer a three-tier publishing model: Draft → Unlisted (link-only, no indexing) → Public. No competitor offers this.

**Why this is the right 2-week target:**
1. It is a small, focused backend + UI change: add an `unlisted` visibility state alongside existing `draft` and `public` states. The report rendering is already built. The privacy toggle is a form field + DB column + middleware check on the public feed/search.
2. It directly addresses the highest-friction objection from high-level competitive players: "I don't want my team indexed before a tournament." This is the single clearest objection heard from the target audience.
3. vgc.tools does not have this. Pikalytics does not have this. PokePaste has it by design (URL-only, no search) but without accounts, players can't manage their paste history.
4. It turns VGC Team Report into the only tool where a player can build a full structured report, share it privately with their team coach or practice partners, and then flip it public after the event — a complete tournament lifecycle workflow no other tool covers.

**Implementation sketch:**
- Add `unlisted` enum value to team visibility field (alongside `draft` / `public`)
- Unlisted teams: accessible via direct URL, excluded from public feed, search, and sitemap
- Share modal: clearly labelled "Unlisted — only people with this link can view" with one-click copy
- Post-event: player can toggle Unlisted → Public from their dashboard

**Estimated scope:** 1–2 Linear tickets, ~1 day implementation + testing.

---

## 8. Positioning Update

The competitive landscape as of May 2026 confirms VGC Team Report's differentiation is holding:
- Pikalytics: meta analytics tool, no authored content
- PokePaste: paste storage, no authored content, decaying maintenance
- VGCpastes: paste repository, no authored content
- Limitless VGC: tournament database, no authored content
- **vgc.tools (NEW threat):** strategy notes + community library — lightweight overlap, no structured depth
- **Champions Lab (NEW):** battle simulation + team builder — no report authoring

The "player voice" layer remains uncontested at depth. The risk is vgc.tools iterating toward a structured report template. Getting unlisted sharing live and visible will strengthen the product for high-level player adoption before that window closes.

---

## Sources

- https://x.com/Pikalytics/status/2054762973403754941 (desktop builder redesign announcement)
- https://www.pikalytics.com/champions
- https://www.pikalytics.com/team
- https://pokepast.es/
- https://github.com/felixphew/pokepaste
- https://chromewebstore.google.com/detail/pokepastefix/ekceaboabpgkgbpigacngnjagcdhdkmn
- https://x.com/VGCPastes/status/2042106878751338822 (Champions Replica Repository launch)
- https://x.com/VGCPastes (VGCpastes account)
- https://limitlessvgc.com/
- https://www.championsbuilder.com/
- https://championslab.xyz/
- https://pikachampions.com/
- https://vgc.tools/
- https://game8.co/games/Pokemon-Champions/archives/Team-Share
- https://game8.co/games/Pokemon-Champions/archives/Builder
