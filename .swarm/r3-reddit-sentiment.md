# Reddit & Community Sentiment: VGC Team Sharing Tools
**Date:** 2026-05-27 | **Agent:** R3 UX Research
**Sources:** WebSearch (Google-indexed Reddit content, Smogon, GitHub, community tools, Chrome Web Store, App Store), pokepaste GitHub Issues
**Note:** Direct Reddit crawling blocked by reddit.com robots.txt. Findings derived from indexed content, Smogon cross-posts, GitHub issues, and community tool analysis.

---

## 1. Community Complaints About Existing Tools

**PokePaste (pokepast.es)** remains the default but is actively frustrating users:
- "No or Invalid Paste" creation failures persist (GitHub #313, Feb 2026 — same bug since #99, Dec 2019)
- Broken/missing sprites: Pokepastefix Chrome extension updated April 2026 to patch Champions + Legends ZA Mega sprites. A Smogon "Pokepaste image fix" thread exists solely for this.
- 155 open GitHub issues, 6 unmerged PRs, single maintainer, no roadmap
- June 2024 storage outage — no status page, players found out via social media
- Open team sheet pastes break due to spacing — PokeBin was forked specifically to fix this

**Pikalytics** mobile app draws App Store complaints: "not updated regularly," "just a few months behind." MunchStats was built because "Pikalytics is taking a while to update."

**VGC Helper** app abandoned (last update April 2024). Community explicitly says "not relevant to 2025."

## 2. Unmet Needs & Feature Requests

Strongest signals (ranked by how many independent tools were built to address them):
1. **Searchable team archive** by Pokemon, regulation, tournament result — Falinks, VGC.tools, Sandshrew Bot, VGenC all attempt partial solutions
2. **Context layer on raw pastes** — Reportworm, VS Recorder, MetaGame VGC all built to add "why" to "what"
3. **Rental/replica code + paste + report in one URL** — VGCPastes tracks this combination; PikaChampions now pairs replica codes with pastes
4. **Mobile-first experience** — Porygon Labs entered 2026 as mobile-first; VGC Helper's abandonment left a gap
5. **Structured report templates** for new players — Victory Road is gated by invite, Smogon has culture barriers

## 3. Mentions of VGC Team Report

pokemonvgcteamreport.com appears in:
- VGCpedia resources list, DevonCorp's resource page, Google search results for "VGC team report tool"
- Indexed with proper meta description for Champions content

**No organic Reddit or Discord user-generated discussion threads found.** The tool is known to resource curators but has not yet generated grassroots community conversation. This is the primary growth gap — distribution, not product quality.

## 4. PokePaste Downtime/Breakage

- June 2024: full storage outage, no warning
- Ongoing: "No or Invalid Paste" errors (#313, #99) — core function intermittently fails
- Pokepastefix extension (v1.1.1, April 2026) still actively maintained = pain is current
- crob.at positioned as the fastest-growing visual alternative (accepts pokepaste URLs, renders sprites)
- PokeBin fixes OTS spacing parsing that pokepaste breaks on

## 5. What Players Want for Team Sharing

| Feature | Evidence |
|---------|----------|
| Search by Pokemon + regulation + placement | 4+ community tools attempt this |
| Written matchup notes alongside paste | Reportworm, MetaGame VGC built for this |
| One link for paste + report + rental code | VGCPastes tracks this combo; no tool bundles all three |
| Visual sprites + clean sharing | crob.at growing fast on this alone |
| Private/password-protected pastes | VRPastes launched specifically for access control |
| Team version history | Implied by iterative teambuilding culture |
| View/copy analytics | No tool provides this |

## Key Takeaway

The Pokemon Champions format reset (Reg M-A, only 2,649 indexed tournament pastes) and mandatory open team lists create the highest-leverage adoption window. Players need structured documentation tools now. VGC Team Report's gap is not feature quality — it is community awareness. Reddit draft replies saved to `.swarm/drafts/r3-reddit-drafts.md`.

---

Sources:
- [PokePaste GitHub Issues](https://github.com/felixphew/pokepaste/issues)
- [PokePaste Issue #313](https://github.com/felixphew/pokepaste/issues/313)
- [PokeBin — Smogon Forums](https://www.smogon.com/forums/threads/pokebin.3736569/)
- [Pokepastefix Chrome Extension](https://chromewebstore.google.com/detail/pokepastefix/ekceaboabpgkgbpigacngnjagcdhdkmn)
- [Smogon Pokepaste Image Fix](https://www.smogon.com/forums/threads/pokepaste-image-fix.3733096/)
- [crob.at PokePaste Alternative](https://crob.at/pokepaste)
- [VGenC Top Teams](https://vgenc.net/top-teams)
- [Pikalytics Team Builder](https://www.pikalytics.com/team)
- [Porygon Labs](https://www.porygonlabs.com/)
- [VGC Team Report](https://pokemonvgcteamreport.com/)
- [Victory Road Reports](https://victoryroad.pro/sv-reports/)
- [Falinks VGC Pastes](https://www.falinks-teambuilder.com/pastes/vgc/)
- [Smogon PokePaste Thread](https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/)
