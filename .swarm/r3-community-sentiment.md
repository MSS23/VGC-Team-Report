# R3 — VGC Community Sentiment (Team Sharing Tools)
**Agent:** R3 Community Sentiment Researcher
**Date:** 2026-05-24
**Method:** 7 WebSearch calls (Google web + site:reddit.com). Reddit direct fetching blocked; signals triangulated from Google-indexed Reddit content, Smogon Forums, GitHub Issues (felixphew/pokepaste), pokepastefix Chrome Store, CommunityOne (Pokemon Champions VGC forum), X/Twitter posts (VGCPastes), and the prior R3 report (r3-community-sentiment-20-05-26.md).
**Budget used:** 7/8 web calls.

---

## 1. Top 3 Pain Points

### P1 — PokePaste sprites and DLC Pokemon are broken; community had to ship its own Chrome extension to fix it
> "Long-standing issue where Zygarde-10%, Zygarde-Complete, Sirfetch'd and Ash-Greninja don't show up." The community-built **pokepastefix** extension (v1.1.2, April 16, 2026) exists *only* because pokepast.es never patched this. Safari port stalled on CSP — so iOS users still see broken images.
- Source: https://chromewebstore.google.com/detail/pokepastefix/ekceaboabpgkgbpigacngnjagcdhdkmn
- Source: https://github.com/felixphew/pokepaste/issues/141
- Source: https://www.smogon.com/forums/threads/pokepaste-image-fix.3733096/

### P2 — PokePaste paste creation breaks routinely from Showdown imports; maintainer effectively absent
> Issue #313 (Feb 2026) "Copy and pasting from Pokémon Showdown isn't working" — *same bug* originally filed as #99 in Dec 2019, never definitively resolved. 155 open issues, single dev, feature requests like a separate source-link field are rejected outright.
- Source: https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/
- Source: https://github.com/felixphew/pokepaste (issue tracker)

### P3 — Team sharing is fragmented across PokePaste + Twitter VGCPastes + rental code screenshots + Victory Road DMs, with nothing tying them together
> The VGCPastes X account literally exists to "collect *any* Pokepaste or Rental Code shared online by the community" — i.e. the community is manually scraping fragments because no single tool bundles paste + rental + report. CommunityOne's Pokemon Champions VGC forum thread "TR Team Discussion and Pokepaste Review" shows the same workflow: post paste, then post code, then discuss in replies, all decoupled.
- Source: https://x.com/VGCPastes/status/1501920960672272387
- Source: https://communityone.io/servers/1457350549216432295/pokemon-champions-vgc/forum/thread-1490712167228379297/

---

## 2. Top 3 Unmet Needs / Feature Requests

1. **One link = paste + rental code + matchup notes.** Players are reassembling these from three sources for every team. VGCPastes' entire raison d'être confirms the demand.
2. **Searchable archive across published team reports** ("show me every Calyrex-S + Incineroar team in Reg I"). Pikalytics indexes the *meta*, not narrative reports. Victory Road is curator-gated. Nothing fills this.
3. **Mobile-first viewer that doesn't show broken sprites.** Pokepastefix is desktop Chrome/Firefox only — the Safari port hit a CSP wall, so iOS users (now the majority of casual viewers per the prior R5 mobile report) are stuck with broken images on the dominant share format.

Secondary signals (each repeatedly surfaced):
- Source-link / attribution field separate from notes (currently requires inspect-element to grab URLs in notes)
- View / copy analytics on a published team (recognition is an unmet emotional need)
- Open Team Sheet generator now that VGC 2026 mandates them at tournaments

---

## 3. Concrete Ticket Ideas (each < 8 hours)

1. **VGC-XXX: Add "Rental Code" first-class field to team reports** — text input on report editor, prominent display + one-tap copy on report page, OG image overlay so the code is visible on social previews. Single highest-leverage shipping mechanic.
2. **VGC-XXX: Add "Source / Credit" field with auto-linkify** — separate `sourceUrl` + `creditPlayer` columns on report; renders as a "Based on [Player]'s team from [Event]" line. Solves the long-running PokePaste pain about un-selectable URLs in notes.
3. **VGC-XXX: Sprite-fallback CDN proxy on our team viewer** — wrap any `pokepast.es` embed or paste-derived render with our own sprite resolver; for any Pokemon/forme that 404s, fall back to a maintained Pokemon HOME / Showdown sprite. Effectively builds pokepastefix into our site so iOS Safari users see correct images.
4. **VGC-XXX: Public report search by Pokemon + regulation** — `/search?mon=calyrex-shadow&reg=I` filtering published reports. Index in Postgres (we already have the data). Even a basic facet UI beats every competitor today.
5. **VGC-XXX: Open Team Sheet (OTS) PDF export from a report** — generate a print-friendly, regulation-compliant team sheet (Pokemon, item, ability, moves, Tera type). One-click from any report page. Daily-use utility tied to mandatory tournament format.

---

## 4. Draft Reddit Reply

Draft (do not post) saved to: `/home/user/VGC-Team-Report/.swarm/drafts/r3-reddit-reply.md`.

Intended trigger: any r/VGC or r/stunfisk thread asking "best place to share my team / PokePaste alternatives / how do I post my regional team." Tone: helpful, low-promo, mentions feature only when relevant.
