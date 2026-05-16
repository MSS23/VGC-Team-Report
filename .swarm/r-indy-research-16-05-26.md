# Indianapolis Regionals 2026 VGC — Research Report
**Date:** 2026-05-16
**Researcher:** Claude (VGC data researcher)

## Event Status: UPCOMING — No Results Available

The 2026 Indianapolis Regional Championships is **scheduled for May 29–31, 2026** at the Indiana Convention Center in Indianapolis, IN. As of today (May 16, 2026), the event has **not yet taken place**. Top-cut data does not exist.

## Sources Checked

| Source | Result |
|--------|--------|
| Web search: "Indianapolis Regionals 2026 Pokemon VGC top cut results" | Event confirmed as upcoming; no results published |
| Web search: "Indy Regionals 2026 VGC Champions top 8" | No top-cut data found; event not yet occurred |
| Limitless TCG (limitlesstcg.com/tournaments) | HTTP 403 — could not retrieve; no indexed results in web search either |
| Victory Road (victoryroad.pro/2026-indianapolis/) | HTTP 403 — could not retrieve directly; web search confirms only pre-event coverage |
| RK9.gg tournament page | HTTP 403 — page exists (tournament registered) but no results data |
| Official Pokémon Championships site | HTTP 403 — no results data in web search snippets |

## Notable Context from Search Results

- The Indianapolis Regionals will be **the first live, official Pokémon Championship Series event to use Pokémon Champions** as its exclusive competitive platform (replacing Sword/Shield-era tooling).
- VGC gameplay at this event uses the new **Pokémon Champions** app, which launched April 8, 2026.
- Tournament is registered on RK9.gg under ID `IN02wbUMQOt2eNv12cgC`.
- Event runs: Masters VGC begins **May 30**, finals conclude **May 31**.

## Current Data File Status

`/home/user/VGC-Team-Report/src/data/indy-top-cut.ts` already correctly reflects this situation:
- All 8 entries have `player: "TBD"`
- The file header comment accurately notes these are "representative archetypes" and that "actual results will be published on Limitless TCG once the tournament concludes"
- Species data is placeholder meta-archetypes (Charizard, Kangaskhan, Salamence, Metagross + Incineroar/Amoonguss cores), **not real player teams**

## Recommendation

**Do not update the data file yet.** The TBD/placeholder structure is correct and honest. After May 31, 2026:

1. Check Limitless TCG: `https://play.limitlesstcg.com/tournaments` — results typically posted within hours of Top 8 concluding.
2. Check Victory Road: `https://victoryroad.pro/2026-indianapolis/` — usually posts full team sheets + player names within 24–48 hours.
3. Check RK9.gg: `https://rk9.gg/tournament/IN02wbUMQOt2eNv12cgC` — standings and rosters if published.
4. Update each `IndyTopCutEntry` with real `player`, `country`, `species[6]`, and `limitlessUrl` values.
5. Remove the "representative archetypes" disclaimer from the file header comment.

## Search Sources

- [2026 Indianapolis Regional Championships – Victory Road](https://victoryroad.pro/2026-indianapolis/)
- [Indianapolis Pokémon Regional Championships 2026 – Official](https://championships.pokemon.com/en-us/events/regionals/2026/indianapolis)
- [2026 Indianapolis Pokémon VGC Regional Championships – RK9.gg](https://rk9.gg/tournament/IN02wbUMQOt2eNv12cgC)
- [Calendar of Pokémon VGC events for the 2026 Season – Victory Road](https://victoryroad.pro/2026-season-calendar/)
- [Pokémon Reveals First VGC Events Using Pokémon Champions – Insider Gaming](https://insider-gaming.com/pokemon-reveals-first-vgc-events-using-pokemon-champions-ahead-of-worlds-2026/)
- [Play! Pokémon Competitions Transition to Pokémon Champions – Pokemon.com](https://www.pokemon.com/us/pokemon-news/play-pokemon-competitions-transition-to-pokemon-champions-on-april-and-may-2026)
