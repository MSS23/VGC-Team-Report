# Phase 15: Mega Evolution Support — Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Add full Mega Evolution support to the team report: a visible toggle on PokemonCard to switch between base and Mega forms, auto-detection when a Mega Stone item is equipped, updated stats/types/ability display for the Mega form, Mega threats in M-A speed tiers, and verified CHAMPIONS_DEX completeness against Serebii's Reg M-A legal list.

</domain>

<decisions>
## Implementation Decisions

### Mega Toggle UI & Behavior
- Toggle appears on PokemonCard header next to species name — natural location, visible without extra clicks
- Auto-switch to mega form when mega stone is detected in item field — seamless UX, matches game behavior
- Sprite switches to mega form, types/ability/stats update inline — full form swap showing real Mega data
- Toggle state is persistent — stored in report data, not just cosmetic

### Data & Regulation
- Use existing POKEMON_DATA entries (already has ~30 megas) — supplement from Showdown if gaps found
- Use existing CHAMPIONS_DEX (already sourced from Serebii, includes megas) — verify completeness, add any missing entries
- Add top Mega threats to SpeedTierChart meta threats — critical for M-A format analysis
- Show both Charizard X and Y options when respective Charizardite is detected — item determines which mega

### Scope & Edge Cases
- Show the mega state the creator set in Explore/read-only view — viewers see the team as intended
- Paste import auto-detects megas — "Kangaskhan-Mega @ Kangaskhanite" already parses, wire up display
- Primal forms (Groudon/Kyogre) deferred to separate phase — different mechanics, scope creep risk
- Only show mega toggle when regulation is set to M-A or unset — prevents confusion in non-mega regulations

### Claude's Discretion
- Implementation details for the toggle component (icon choice, animation, positioning fine-tuning)
- How to store mega state in the report data model (new field on ParsedPokemon or derived from item)
- Exact list of top Mega threats for speed tiers (competitive relevance ordering)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/data/mega-pokemon.ts` — Full MegaPokemonEntry list with slug, dataKey, displayName, baseName, types, ability, megaStone, description. MEGA_BY_SLUG and MEGA_BY_KEY lookup maps.
- `src/lib/data/pokemon.ts` — POKEMON_DATA already has ~30 mega entries (kangaskhan-mega, salamence-mega, etc.) with full base stats
- `src/lib/data/champions-dex.ts` — CHAMPIONS_DEX Set includes mega form keys (venusaur-mega, charizard-mega-x, etc.)
- `src/lib/utils/sprite-url.ts` — Already handles mega sprite slugs with SLUG_OVERRIDES for charizard-mega-x/y
- `src/lib/data/tags.ts` — REGULATIONS array includes "Reg M-A"

### Established Patterns
- PokemonCard component at `src/components/report/PokemonCard.tsx` — receives AnalyzedPokemon, uses parsed.species for sprite, data.types for TypeBadge
- ParsedPokemon type at `src/lib/types/pokemon.ts` — has species, item, ability fields
- AnalyzedPokemon at `src/lib/types/analysis.ts` — wraps ParsedPokemon with calculated data
- PasteInput at `src/components/input/PasteInput.tsx` — already has SAMPLE_PASTE with "Kangaskhan-Mega @ Kangaskhanite"

### Integration Points
- PokemonCard header section (line ~64) — where toggle needs to appear
- SpeedTierChart at `src/components/report/SpeedTierChart.tsx` — needs mega threats added
- Paste parser — verify mega form detection works end-to-end
- Report data model — may need isMega or megaForm field

</code_context>

<specifics>
## Specific Ideas

- Auto-detect: when item field matches a megaStone from MEGA_POKEMON_LIST, automatically resolve the mega form
- Toggle should visually indicate mega state (e.g., a small mega evolution icon or "M" badge)
- Pull any missing mega data from Showdown's data files if POKEMON_DATA has gaps
- Verify CHAMPIONS_DEX against Serebii's official Regulation M-A Pokemon list for completeness

</specifics>

<deferred>
## Deferred Ideas

- Primal Reversion forms (Groudon-Primal, Kyogre-Primal) — different trigger mechanic, separate phase
- Ultra Burst (Ultra Necrozma) — different mechanic entirely
- Mega Evolution animation/transition effect on toggle

</deferred>
