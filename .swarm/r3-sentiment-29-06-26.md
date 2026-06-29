# R3 Community Sentiment — June 29, 2026

**Agent:** R3 (community sentiment, narrow scope)
**Window:** Late May 2026 → June 29, 2026 (NEW patterns since `r3-community-sentiment-20-05-26.md`)
**Sources:** WebSearch (Smogon Forums Reg M-B Metagame Thread pp. 1–2, pokemon.com news, Game8 Reg M-B roster, StrataDex, ChampionsMeta, VGCPastes X feed, retrogems.fr explainer). Direct reddit.com fetches still blocked; signals inferred via Google-indexed posts + Smogon discussion threads + community curator output.
**Read-only — no posts/DMs sent. Drafts in `drafts/r3-posts-29-06-26.md`.**

---

## What changed since May 20

**Pokemon Champions flipped from Regulation M-A to Regulation M-B on June 17, 2026.** The pivot added 22 new Pokémon and **16 brand-new Mega Evolutions** (Mega Sceptile, Mega Blaziken, Mega Swampert, Mega Mawile, Mega Staraptor, Mega Malamar, etc.) while keeping every M-A mega legal. The community is now 12 days into the new format.

This invalidates the May 20 finding's relative weighting: pre-June 17, the dominant pain was *fragmented archives*. Post-June 17, the dominant pain is **legality whiplash** — published teams from the past two months are partially or fully illegal in M-B, and players don't know which.

---

## The ONE recurring complaint (new since late May)

### "Is this team still legal? I can't tell."

The Smogon Reg M-B Metagame thread (pp. 1–2, June 17–28) is dominated by replies of the form *"is X still legal in M-B?"* and *"this paste was from Reg M-A, I have no idea if it still works."* Confirmatory signals from elsewhere in the same window:

- **Smogon, Reg M-B Metagame thread:** Multiple posters in the first 48 hours after M-B drop asked whether their M-A teams were still tournament-legal. The Contrary-Staraptor / Contrary-Malamar discussion is the most visible example — both are M-B-only, so any "Contrary core" paste posted in the last week is by definition M-B-only and won't be obvious to a player browsing older archives.
- **VGCPastes (X / @VGCPastes):** Began re-tagging their pinned pastes with "Champions MB" on June 18 — explicit acknowledgement that the M-A vs. M-B distinction is the new top-of-feed metadata. Players replying to that feed routinely ask "is this legal in MB now?"
- **Game8 Reg M-B roster article** (game8.co/games/Pokemon-Champions/archives/605482) ranked top on Google for "Regulation M-B" — pure legality lookup intent. Game8 only ranks for queries with strong daily search volume.
- **StrataDex "All 22 New Pokémon in Regulation M-B (Day 1 Usage)"** went up day-of — confirms that *"what's new vs. what's the same"* is the top thing the community wants spelled out.
- **PokeMCP "Champions Meta Report — Reg M-A → M-B, June 2026"** publishes a transition-specific report — direct evidence that the transition itself is the content the audience wants right now.

> "Mega Staraptor has Contrary + Close Combat + Charm/Scary Face + Tailwind/Screens. Contrary is really powerful thanks to this Pokemon's high speed... While Mega Malamar was seen in some teams doing 'contrary shit', it was considered inferior to Mega Staraptor."
> — Smogon, Reg M-B Metagame Discussion Thread, late June 2026

The implication: every Contrary-mega paste being shared right now is **M-B-only**, but pastes from before June 17 (still circulating in Discords, X feeds, Pikalytics linkbacks) are mostly **M-A or earlier**. Players can't visually distinguish them at a glance. The legality cliff is hidden in a 6-mon paste.

### Why this is bigger than it looks
The format pivot is exactly the moment when "where do I get a team that *actually* works in the current ranked season?" search volume spikes — and the community's existing tooling (PokePaste, raw VGCPastes feed, Discord pastes) has no concept of regulation legality at all. Players are reading a paste and guessing.

---

## Why this matters to our codebase tonight

**We are uniquely positioned.** `src/lib/analysis/detect-regulation.ts` already detects Reg M-B via `CHAMPIONS_REG_MB_ONLY_MEGAS` (see lines 81–101 of `detect-regulation.ts`, plus the corresponding sets in `mega-pokemon.ts` lines 799–842). `src/lib/data/mega-pokemon.ts` already separates `CHAMPIONS_REG_MA_MEGAS` from `CHAMPIONS_REG_MB_ONLY_MEGAS`. **The legality data is already in our codebase — it just isn't surfaced as a public, badge-able answer on every published report.**

Competitors do not have this:
- PokePaste: no legality concept.
- VGCPastes: legality is a tweet caption ("MB!") — not machine-checked.
- Pikalytics, Limitless, Victory Road: no per-paste legality badge.
- crob.at: visual only.
- PokeMCP: a single transition article, not a per-team check.

A live "Legal in: Reg M-A, Reg M-B" badge on every shared report would be the *fastest* legality answer in the community, and we already have the detection.

---

## Proposed feature (ship-ready in 2–3 hours)

### "Format Legality Badge" — surface what we already detect

A regulation-legality badge on every team report (share page + dashboard + explore card), plus a single new endpoint that returns legality for any paste, so the community can deep-link to a check without signing in.

**Behavior:**
1. On every `s/[id]` share page, render a small chip near the existing regulation tag: `Legal in: Reg M-B` (green), `Reg M-A only` (amber with tooltip: "Includes a Mega introduced after Reg M-A; not legal in Reg M-B"), `Not Champions-legal` (red, with reason).
2. On every Explore `ReportCard`, render a tiny chip in the corner so browsers can pre-filter visually.
3. Add `GET /api/legality?paste=<urlencoded>` — accepts a raw paste or a paste URL, returns `{ regulation, legalIn: ["Reg M-B"], blockers: [] }`. Free, no auth.
4. Add an Explore filter pill *"Legal in current Reg (M-B)"* alongside the existing regulation pills (the filter UI already exists in `ExploreFilters.tsx`).

### Files to touch
- `src/lib/analysis/detect-regulation.ts` — add an exported `getLegalityFor(pokemon): { legalIn: string[]; blockers: string[] }` that returns the *set* of regulations a team is legal in, not just the first-match label. M-A megas → `["Reg M-A", "Reg M-B"]`; M-B-only megas → `["Reg M-B"]`. (~30 lines.)
- `src/components/report/TeamOverview.tsx` *(currently in main-changed-files — coordinate with C1/C2)* — render the badge next to the existing regulation tag.
- `src/app/s/[id]/page.tsx` *(currently in main-changed-files — coordinate)* — pass legality into the share page, include it in OpenGraph alt text so Discord embeds show "Legal in Reg M-B" inline.
- `src/components/explore/ReportCard.tsx` — small corner chip.
- `src/components/explore/ExploreFilters.tsx` — add the "Current Reg" pill (UI already supports filter pills).
- `src/app/api/legality/route.ts` *(new)* — public, GET, no auth, accepts paste body, returns legality JSON. Caches at the edge.
- Update `src/app/changelog/data.ts` with the new entry.

### Why this is the right "tonight" pick
- **Reuses code we already wrote.** Detection is done; we're just exposing it.
- **Single-purpose, low-blast-radius.** No DB migration, no auth changes, no risky cron.
- **Directly addresses the loudest 12-day-old pain.** Every paste shared in the next month will face this question.
- **Shareable hook.** A public `/api/legality` endpoint is something Discord bots and the VGCPastes Twitter community can call — that's distribution we don't currently have.
- **AEO/SEO bonus.** Indexed "Legal in Reg M-B" badges on share pages reinforce our authority for "is X legal in Reg M-B" queries — high June 2026 search volume per the Game8/StrataDex/PokeMCP signal.

---

## Conflict-risk check vs. `.swarm/main-changed-files.md`

Three of our proposed touch points overlap with files currently in the active changeset:

| File | In main-changed-files? | Risk | Mitigation |
|------|------------------------|------|------------|
| `src/lib/analysis/detect-regulation.ts` | **Yes** | Medium | Add a *new exported helper* (`getLegalityFor`) — do not modify existing `detectRegulation` / `detectRegulationWithSignals`. New code path; existing callers untouched. |
| `src/lib/data/mega-pokemon.ts` | **Yes** | Low | Read-only consumption of `CHAMPIONS_REG_MA_MEGAS` + `CHAMPIONS_REG_MB_ONLY_MEGAS`. No edits to this file required. |
| `src/components/report/TeamOverview.tsx` | **Yes** | Medium | Coordinate with whoever is editing this file (likely C1/C2). Add the badge as a sibling element — keep diff small and clearly delimited. |
| `src/app/s/[id]/page.tsx` | **Yes** | Medium | Same as above — coordinate, add a single prop, do not refactor. |
| `src/components/report/PokemonCard.tsx` / `PokemonDetailSlide.tsx` | Yes (likely sprite-related work) | Low | Not touched by this proposal. |
| `src/components/explore/ReportCard.tsx`, `ExploreFilters.tsx`, `src/app/api/legality/route.ts` | **No** | None | Clean adds. |

**Recommendation:** Sequence this *after* whichever C-agent finishes its in-flight edits on `TeamOverview.tsx` and `s/[id]/page.tsx`, or coordinate via the swarm-synthesis layer. The lib-side helper can land independently.

---

## Sources
- [Smogon Reg M-B Metagame Discussion Thread, pp. 1–2](https://www.smogon.com/forums/threads/vgc-reg-m-b-metagame-discussion-thread.3784070/)
- [Pokemon.com — Regulation Set M-B announcement](https://www.pokemon.com/us/pokemon-news/regulation-set-m-b-kicks-off-a-new-ranked-battles-season-and-battle-pass-in-pokemon-champions)
- [Game8 — Regulation M-B Complete Roster and Schedule](https://game8.co/games/Pokemon-Champions/archives/605482)
- [StrataDex — All 22 New Pokémon in Regulation M-B (Day 1 Usage)](https://stratadex.net/guides/m-b-new-pokemon)
- [PokeMCP — Champions Meta Report Reg M-A → M-B, June 2026](https://www.pokemcp.com/reports/champions)
- [Victory Road — Pokémon Champions Regulations](https://victoryroad.pro/champions-regulations/)
- [retrogems.fr — How to Master Reg M-B's 11 New Mega Evolutions](https://retrogems.fr/en/pokemon-champions-mega-evolutions-regulation-m-b/)
- [ChampionsMeta — Best Reg M-B Teams (updated daily)](https://championsmeta.io/teams)
- [VGCPastes (X) — "Champions MB" re-tag of pinned content](https://x.com/VGCPastes/status/2043019220095734204)

## Out of scope for this proposal (deliberately deferred)
- Rental code field (still valid May 20 finding — defer, not the *newest* pain)
- View analytics, source attribution, OTS export (all carry over from May 20 — defer)
- Damage calc embed (defer, multi-day scope)
