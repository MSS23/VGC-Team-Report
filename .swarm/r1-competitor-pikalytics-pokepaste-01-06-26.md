# R1 Competitor Teardown — Pikalytics & PokePaste
**Date:** 2026-06-01
**Scope:** Pikalytics (pikalytics.com) and PokePaste (pokepast.es). How they work, where they're strong, and where VGC Team Report can drive a wedge with its paste-plus-structured-report angle.

> Note: direct WebFetch was 403'd on both root domains (Cloudflare / anti-bot). Findings below synthesized from WebSearch results, the public `llms-full.txt` reference page, Smogon Forum threads, the open-source `felixphew/pokepaste` repo, and App Store / Ko-fi listings.

---

## 1. Pikalytics — https://pikalytics.com

### Core flows
- **Usage stats / Pokedex** — `/pokedex/<format-slug>` (e.g. `/pokedex/homebsd` for VGC 2026 Reg Set I). The dominant entry point: usage %, common spreads, items, moves, teammates, pulled from ladder + tournament data.
- **Damage calculator** — `/damage-calculator`. Champions-aware, handles weather/terrain/Intimidate/spread-move halving and Mega forms. Mobile-friendly.
- **Team Builder** — `/team` and `/team/<format-slug>`. Suggests sets/spreads inline from live usage data. "My Teams" saved client-side (and in the iOS app to device storage). Actions: copy, share image, share PokePaste link, import/export Showdown.
- **Top Teams** — `/topteams` aggregates standout tournament rosters by archetype with a one-click "send to Team Builder" or "view original Limitless source."
- **Tournaments** — `/tournaments/rk9/<event-slug>` per-event Pokémon usage and team lists.
- **Speed Tiers** — separate page; ladder-aware speed breakpoints.

### Sticky UX patterns
- **No login required** for the core stats / damage calc / Top Teams browsing. "My Teams" is client-side; logged-out users still get full value.
- **Format-slugged URLs** are stable (`/pokedex/homebsd`, `/team/homebsd`) → bookmark-friendly, deep-linkable from Discord/Twitter.
- **Cross-tool routing**: every page has a "send to Team Builder" / "open in Damage Calc" button — the tools compound usage.
- **Mobile app on iOS/Android** (`id1511370166`). Paid (~$1 IAP); explicitly **ad-free**. Heavy live-event grinder use.

### What they do BETTER than us
- **Live usage stats moat** — we have no first-party usage data ingestion. Pikalytics is the canonical answer to "what's meta this week."
- **Damage calc as a workflow hub** — integrated with their dataset (Speed Tiers, common spreads). Ours doesn't exist.
- **Sets browser depth** — Pokedex with EV spreads, items, moves, teammates by usage %.
- **Native mobile app** — we are PWA-only.
- **Tournament event index** — direct mapping from RK9 event slug → team list.

### Gaps to exploit
- **No structured team-report writing** — Pikalytics is read-mostly for stats; users still need to paste teams and write up reports elsewhere (Smogon thread, Google Doc, Victory Road).
- **No long-form commentary attached to a team** — "My Teams" stores the build, not the *story* (matchups, leads, EV justification).
- **No public team-share permalinks with rich OG previews** — they punt that to PokePaste.
- **No login = no profile/portfolio** — players cannot build a body of work / reputation on Pikalytics.
- **No collaborative/review affordances** — no comments, no team versioning, no "fork this team."

### Monetisation
- **Ad-free website** (per `llms-full.txt`).
- **Paid iOS/Android app** ($1 one-time, IAP listed).
- **Ko-fi tip jar** (`ko-fi.com/pikalytics`).
- **No subscription / "Plus" tier** surfaced publicly — they keep the freemium gate low.

---

## 2. PokePaste — https://pokepast.es

### Core flows
- **Paste a Showdown export → get a permalink**. One screen. No login.
- **Permalink structure**: short cryptographic slug (`pokepast.es/<id>`). Mappings are intentionally cryptographic — pastes are effectively anonymous and unguessable.
- **Syntax highlighting** for Showdown-format exports (mons coloured by primary type, moves by type, items mapped to types). Image previews of mons and items from Pokémon Global Link art.
- **Raw view** for tooling / scripts (heavily relied on by Discord bots and third-party tools).
- **Syntax HOWTO** at `/syntax.html` — supports fields for **title**, **author**, and **notes** (per repo `database.go` schema in `felixphew/pokepaste`), though the public UI surfaces them minimally.

### Sticky UX patterns
- **Zero-friction**: no signup, no captcha, no email. Paste → share.
- **Pastes are immutable**: once created, the URL is canonical and stable. This is the *core* trust property — links in tournament writeups don't rot.
- **Mobile-friendly** simple layout; renders fast on poor convention-centre Wi-Fi.
- **Ubiquitous tooling integration**: Showdown, Pokémon Home converters, rental-code generators, Reportworm, crob.at, and dozens of Discord bots all consume `pokepast.es/<id>` URLs as the lingua franca.
- **Network effects via VGCPastes Twitter** (`@VGCPastes`) — the de-facto tournament results feed posts pokepast.es links daily.

### What they do BETTER than us
- **Universal compatibility** — every VGC tool already speaks the pokepast.es URL format. We import from it; we cannot replace it as the standard.
- **Latency to share** — one paste, one click, one URL. Nothing faster exists.
- **Trust / immutability** — URLs created in 2019 still resolve. That archival quality is hard to beat as a newcomer.
- **Anonymity by default** — players sharing testing builds appreciate the no-account flow.

### Gaps to exploit
- **Bare-bones OG previews** — link unfurls on Discord/Twitter are weak; usually just title text, no team sprite collage. (Multiple Smogon threads + extensions like "Three Island" and crob.at exist specifically because the OG card is poor.) **This is our single biggest visual differentiator.**
- **No structured report fields** — the `notes` field is a single freeform block; there is no schema for matchups / leads / EV justification / strengths-weaknesses.
- **No edit / versioning** — once published, you cannot iterate. Players publish a new paste and lose comment history.
- **No author identity / portfolio** — anonymous slugs mean a creator cannot build a follower base on the platform.
- **No discovery** — no browse, no search, no tags, no format filter. You can only find a paste if someone links it to you.
- **No interaction** — no comments, no likes, no forks.
- **No mobile-native creation flow** — paste UX assumes desktop copy from Showdown.

### Monetisation
- **None** — fully free, donation-supported (open-source, run by the author).
- No ads, no subscription, no API key gating. Their cost surface is tiny (text storage), so the lack of a model is sustainable.

---

## 3. VGC Team Report — Strategic Position

Our wedge is **"paste a team, write the report, share a rich link."** Pikalytics owns *data*; PokePaste owns *the URL*. Neither owns *the narrative around a team* — and that narrative is exactly what tournament players, content creators, and coaches actually produce in Google Docs, Smogon threads, and Victory Road articles today. Victory Road proves the *demand* exists (curated team reports get heavy traffic); nothing serves that demand at the speed of a pastebin.

### Direct URLs we should compete with on OG previews
- `https://pokepast.es/<id>` (the de-facto sharing standard — we must out-unfurl it)
- `https://www.pikalytics.com/team/<format>` (their share endpoint)
- `https://victoryroad.pro/sv-reports/` (the long-form benchmark)

---

## 4. Five Concrete Differentiation Opportunities

1. **Structured Team Report editor** — first-class fields for *Team Goal*, *Lead Matrix*, *Win Conditions*, *EV Justification per mon*, *Tough Matchups*, *Replay Links*. Replaces the Google Doc that every serious VGC player currently writes. PokePaste has a single freeform `notes` blob; Pikalytics has nothing.
2. **Best-in-class OG image generator** — auto-rendered 1200×630 card showing the six-sprite team, tera types, item icons, author, and report headline. This is the single highest-leverage thing we can build: every Discord/Twitter share becomes an ad for VGC Team Report. Both competitors are visibly weak here (Smogon threads + crob.at exist specifically to patch it).
3. **One-click PokePaste import + co-publish** — accept any `pokepast.es/<id>` URL as the build seed, then upgrade it into a full report. Use PokePaste's network effect rather than fight it; offer a "publish PokePaste mirror" toggle so the paste-faithful crowd still gets their canonical URL.
4. **Author profiles + portfolios** — public slug like `pokemonvgcteamreport.com/u/<handle>` aggregating every report a player has shipped, with regional/result tags. Pikalytics has no identity layer; PokePaste is deliberately anonymous. Coaches, content creators, and top-cut players will want a portfolio URL for their bio.
5. **Mobile-first report capture** — quick-add flow that lets a player tap-and-dictate matchup notes from the venue floor (PWA + voice-to-text + photo of the score sheet → auto-attached). Pikalytics's app is read-only stats; PokePaste has no creation UX on mobile. The convention-centre moment is unowned.

Bonus / lower-tier:
- **Format-aware report templates** (Reg I / Champions Reg M-A) with prefilled lead-matrix rows for top 10 meta archetypes pulled from Pikalytics-style usage data we re-host.
- **Embeddable team-card widget** for Victory Road / Smogon / personal blogs (iframe or script tag rendering the team + first 280 chars of the report).
- **Comment threads / "ask the author" Q&A** on each published report — neither competitor allows interaction.

---

## Sources
- https://www.pikalytics.com/
- https://www.pikalytics.com/team
- https://www.pikalytics.com/team/homebsd
- https://www.pikalytics.com/pokedex/homebsd
- https://www.pikalytics.com/damage-calculator
- https://www.pikalytics.com/topteams
- https://www.pikalytics.com/tournaments/rk9/2026-indianapolis-pok-mon-vgc-regional-championships-v12cgc
- https://www.pikalytics.com/llms-full.txt
- https://apps.apple.com/us/app/pikalytics-battle-strategy/id1511370166
- https://ko-fi.com/pikalytics
- https://pokepast.es/
- https://pokepast.es/syntax.html
- https://github.com/felixphew/pokepaste
- https://github.com/felixphew/pokepaste/blob/v3/database.go
- https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/
- https://x.com/VGCPastes
- https://crob.at/pokepaste
- https://victoryroad.pro/sv-reports/
- https://reportworm.com/
- https://pokemonvgcteamreport.com/
