# Competitor Intel: Pikalytics & PokePaste

**Date:** 2026-05-27

---

## Pikalytics (pikalytics.com)

### Features
- **Usage stats engine:** Per-Pokemon usage %, abilities, items, moves, EV spreads, teammates, counters, and Tera type preferences. Covers VGC 2026 Champions, Battle Stadium, Smogon formats.
- **Team Builder:** Data-driven builder with meta suggestions. Inline damage calculator ("Meta Calcs") pulls likely opponents from ladder data automatically.
- **Top Teams Gallery:** Browse tournament-winning teams, filter by Pokemon/archetype, inspect full builds, link to original Limitless source.
- **Mobile app:** iOS/Android, ad-free, mirrors web features for on-the-go reference.
- **Articles section:** Strategy content and meta analysis.

### Share/Export UX
Copy Team, Share Team (URL), Share Image (screenshot), Import/Export Showdown paste, and Share as PokePaste. Multiple export paths from one builder.

### Monetization
Free website with no paywall. Mobile app is free and ad-free. No visible Patreon or premium tier. Revenue model unclear -- likely sponsorships or donation-based.

### Strengths Over Team Report Builders
- Real-time meta data baked into the builder (usage %, winrates, counters).
- Damage calculator integrated directly into team building flow.
- Tournament results database with team inspection.
- Established brand -- the default VGC stats reference.

### Known Issues
- Data refresh lag (monthly updates can miss rapid meta shifts).
- No narrative layer -- pure stats, no team explanations or strategy writeups.
- No social features (comments, likes, follows).

---

## PokePaste (pokepast.es)

### Features
- **Pastebin for teams:** Paste Showdown export, get a permanent shareable URL. Displays species, items, abilities, EVs, natures, Tera types, movesets with sprites.
- **No login required.** No accounts, no tracking. URLs are cryptographically determined.
- **Syntax page** for manual team formatting.

### Share/Export UX
Paste text, click submit, get URL. Minimal and instant. No image export, no analytics, no team browsing.

### Monetization
Fully free, open-source (GitHub: felixphew/pokepaste). No ads. Community-maintained.

### Strengths Over Team Report Builders
- Frictionless: zero sign-up, instant share. The universal VGC team-sharing standard.
- Deep ecosystem integration: Showdown, Smogon, Discord, Reddit all link PokePastes natively.

### Known Issues & Complaints (2025-2026)
- **Broken images:** Missing sprites for DLC Pokemon, special forms (Zygarde-10%, Sirfetch'd). Community built a Chrome extension ("pokepastefix") as workaround.
- **Showdown import bugs:** Copy-paste from Showdown intermittently fails (GitHub #311, Feb 2026).
- **Display errors:** Column mode rendering issues (#307).
- **No maintenance velocity:** Open issues on GitHub go months without response. The project appears lightly maintained.
- **Zero analytics or discovery:** No way to browse, search, or find popular teams.

---

## Opportunities for VGC Team Report

1. **Narrative gap:** Neither competitor supports written strategy/team explanations alongside the paste. This is our core differentiator.
2. **Discovery/social:** PokePaste has no browsing; Pikalytics shows tournament teams but no community layer. A feed of shareable team reports with likes/comments fills this gap.
3. **Image sharing:** Pikalytics does this; PokePaste does not. Shareable team images for Twitter/Discord are high-value.
4. **Reliability:** PokePaste's broken images and stale maintenance create an opening for a more polished paste experience.
