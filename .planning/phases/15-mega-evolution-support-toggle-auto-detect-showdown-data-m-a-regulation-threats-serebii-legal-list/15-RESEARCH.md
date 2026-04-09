# Phase 15: Mega Evolution Support — Research

**Researched:** 2026-04-09
**Domain:** Pokemon form-swap UI, data model extension, VGC regulation gating
**Confidence:** HIGH (all conclusions verified against live codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Toggle appears on PokemonCard header next to species name
- Auto-switch to mega form when mega stone is detected in item field
- Sprite switches to mega form, types/ability/stats update inline — full form swap showing real Mega data
- Toggle state is persistent — stored in report data, not just cosmetic
- Use existing POKEMON_DATA entries (already has ~30 megas) — supplement from Showdown if gaps found
- Use existing CHAMPIONS_DEX (already sourced from Serebii, includes megas) — verify completeness, add any missing entries
- Add top Mega threats to SpeedTierChart meta threats — critical for M-A format analysis
- Show both Charizard X and Y options when respective Charizardite is detected — item determines which mega
- Show the mega state the creator set in Explore/read-only view — viewers see the team as intended
- Paste import auto-detects megas — "Kangaskhan-Mega @ Kangaskhanite" already parses, wire up display
- Primal forms deferred to separate phase
- Only show mega toggle when regulation is set to M-A or unset

### Claude's Discretion
- Implementation details for the toggle component (icon choice, animation, positioning fine-tuning)
- How to store mega state in the report data model (new field on ParsedPokemon or derived from item)
- Exact list of top Mega threats for speed tiers (competitive relevance ordering)

### Deferred Ideas (OUT OF SCOPE)
- Primal Reversion forms (Groudon-Primal, Kyogre-Primal) — different trigger mechanic, separate phase
- Ultra Burst (Ultra Necrozma) — different mechanic entirely
- Mega Evolution animation/transition effect on toggle
</user_constraints>

---

## Summary

The codebase has excellent foundational Mega Evolution infrastructure already in place: 31 entries in `MEGA_POKEMON_LIST` with full metadata, ~50 mega entries in `POKEMON_DATA` with verified base stats, mega sprite slug overrides in `sprite-url.ts`, and CHAMPIONS_DEX already containing 30 mega form keys. The core implementation gap is wiring these existing data assets into a stateful UI toggle on PokemonCard.

The primary design challenge is state storage: mega state needs to travel with the team through `useTeamMeta` (localStorage + shared state) so it survives paste reloads, sharing, and read-only views. The current `AnalyzedPokemon` data model is derived from `ParsedPokemon` on every parse; a separate `megaStates` map (species index -> boolean) stored in `useTeamMeta` is the cleanest pattern that avoids mutating parsed team data or re-architecting the analysis pipeline.

Auto-detection from item field is straightforward: every `MegaPokemonEntry` has a `megaStone` field; when `parsed.item` matches any `megaStone`, the display should resolve to that mega form. The toggle then becomes an override layer on top of auto-detection, allowing the user to manually flip back to base form.

**Primary recommendation:** Store mega override states as `megaStates: Record<number, boolean>` in `useTeamMeta` keyed by pokemon index. Auto-detect from item on render; the toggle writes an explicit override. PokemonCard receives `isMega` + `onToggleMega` props and swaps data from `MEGA_BY_KEY` when true.

---

## Standard Stack

No new npm dependencies are required. This phase is entirely internal data wiring and UI.

### Core Assets Already in Codebase

| Asset | Path | What It Provides |
|-------|------|-----------------|
| `MEGA_POKEMON_LIST` | `src/lib/data/mega-pokemon.ts` | 31 entries: slug, dataKey, displayName, baseName, types, ability, megaStone |
| `MEGA_BY_KEY` | `src/lib/data/mega-pokemon.ts` | Lookup map: `"kangaskhan-mega"` -> MegaPokemonEntry |
| `MEGA_BY_SLUG` | `src/lib/data/mega-pokemon.ts` | Lookup map: `"mega-kangaskhan"` -> MegaPokemonEntry |
| `POKEMON_DATA` mega entries | `src/lib/data/pokemon.ts` L1793+ | ~50 mega keys with full PokemonData (types, baseStats, abilities) |
| `CHAMPIONS_DEX` mega entries | `src/lib/data/champions-dex.ts` L180-210 | 30 mega form keys already in the set |
| `SLUG_OVERRIDES` mega entries | `src/lib/utils/sprite-url.ts` L72-75 | `charizard-mega-x -> charizard-megax`, `mewtwo-mega-x -> mewtwo-megax` |
| `useTeamMeta` | `src/hooks/useTeamMeta.ts` | Persists report state to localStorage and travels through ShareableState |
| `ShareableState` | `src/lib/sharing/url-codec.ts` | Shared report schema — needs `megaStates` field added |

---

## Architecture Patterns

### Recommended State Storage: `megaStates` in `useTeamMeta`

**What:** Add `megaStates?: Record<number, boolean>` to the `TeamMeta` interface and `ShareableState`. Key is pokemon index (0-5), value is `true` for mega form, `false` for explicit base form override, absent for "auto-detect from item."

**Why not on `ParsedPokemon`:** The paste parser stores canonical Showdown data. Mutating it on toggle would break round-trips and confuse paste export. Keeping mega state as a separate overlay follows the existing pattern of roles, notes, and mvpIndex being separate from parsed data.

**Why not derived-only:** Auto-detect alone cannot satisfy "toggle state is persistent." A user might want to display the base form even when holding a Mega Stone (e.g., showing the pre-mega set). Persistent override is required.

**The three states for a given Pokemon index:**
```
megaStates[i] === undefined  → auto mode: mega if item is a mega stone, else base
megaStates[i] === true       → forced mega (even if no stone)
megaStates[i] === false      → forced base (even if stone equipped)
```
For display purposes, "auto" with a mega stone = show mega. "auto" without stone = show base.

### Recommended Project Structure Changes

```
src/
├── hooks/
│   └── useTeamMeta.ts          — add megaStates field + setMegaState() + setMegaStatesFull()
├── lib/
│   └── sharing/
│       └── url-codec.ts        — add megaStates?: Record<number, boolean> to ShareableState
├── lib/utils/
│   └── mega-resolver.ts        — NEW: resolveMegaForm(species, item, megaStates, index)
├── components/report/
│   ├── PokemonCard.tsx         — add isMega + onToggleMega props, swap data when mega
│   └── SpeedTierChart.tsx      — add top Mega threats to META_THREATS array
└── app/
    └── page.tsx / useHomePage  — pass megaStates down; handle setMegaState
```

### Pattern 1: Mega Resolver Utility

**What:** A pure function that determines the effective `PokemonData`, `species` display name, and sprite key for a given Pokemon given its item, parsed species, and explicit mega state override.

```typescript
// src/lib/utils/mega-resolver.ts
import { MEGA_BY_KEY } from "@/lib/data/mega-pokemon";
import { POKEMON_DATA } from "@/lib/data/pokemon";

export interface MegaResolution {
  isMega: boolean;
  displaySpecies: string;       // for sprite lookup
  effectiveData: PokemonData;   // types/stats/ability to render
  megaEntry: MegaPokemonEntry | null;
  canToggle: boolean;           // true when a mega form exists for this pokemon
}

export function resolveMegaForm(
  parsed: ParsedPokemon,
  megaStateOverride: boolean | undefined,
  regulation: string | undefined,
): MegaResolution {
  // Only show mega capability for Reg M-A or unset regulation
  const regAllowed = !regulation || regulation === "Reg M-A";

  // Determine which mega form applies (item-based lookup)
  const itemLower = parsed.item?.toLowerCase() ?? "";
  const megaEntry = findMegaByItem(parsed.species, itemLower);

  const canToggle = regAllowed && megaEntry !== null;

  // Resolve effective state
  let isMega: boolean;
  if (!canToggle) {
    isMega = false;
  } else if (megaStateOverride !== undefined) {
    isMega = megaStateOverride;
  } else {
    // Auto-detect: mega stone equipped = show mega form
    isMega = megaEntry !== null;
  }

  if (isMega && megaEntry) {
    const effectiveData = POKEMON_DATA[megaEntry.dataKey] ?? parsedBaseData;
    return { isMega: true, displaySpecies: megaEntry.dataKey, effectiveData, megaEntry, canToggle };
  }

  return { isMega: false, displaySpecies: parsed.species, effectiveData: parsedBaseData, megaEntry, canToggle };
}

function findMegaByItem(species: string, itemLower: string): MegaPokemonEntry | null {
  // Special case: Charizard has two megas — resolve by item
  for (const entry of MEGA_POKEMON_LIST) {
    if (
      entry.baseName.toLowerCase() === species.toLowerCase() &&
      entry.megaStone.toLowerCase() === itemLower
    ) {
      return entry;
    }
  }
  return null;
}
```

### Pattern 2: PokemonCard Toggle Button

**What:** Small button placed in the header flex row, after species name. Only rendered when `canToggle` is true. Follows the existing MVP star button pattern (same styling class structure).

```typescript
// Inside PokemonCard header, after species name h3
{canToggle && !isReadOnly && onToggleMega && (
  <button
    type="button"
    onClick={onToggleMega}
    className={`p-1.5 rounded-lg transition-all duration-200 text-xs font-extrabold ${
      isMega
        ? "text-violet-400 bg-violet-400/10"
        : "text-text-tertiary/40 hover:text-violet-400 hover:bg-violet-400/5"
    }`}
    title={isMega ? "Show base form" : "Show Mega form"}
    aria-label={isMega ? `Show base ${parsed.species}` : `Show Mega ${parsed.species}`}
  >
    M
  </button>
)}
{/* Read-only: show M badge when mega is active */}
{canToggle && (isReadOnly || !onToggleMega) && isMega && (
  <span className="text-[9px] font-extrabold text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded">
    MEGA
  </span>
)}
```

**Key UX note:** In read-only/shared view, the toggle is hidden but the active mega form still displays (per locked decision: "show the mega state the creator set").

### Pattern 3: Sprite Resolution

`PokemonSprite` already accepts any species string and resolves via `resolveSlug` -> `SLUG_OVERRIDES`. Passing the `megaEntry.dataKey` (e.g., `"kangaskhan-mega"`) to `PokemonSprite` as `species` already works for all megas. The SLUG_OVERRIDES already handle the two special cases (`charizard-mega-x`, `mewtwo-mega-x`).

**No new sprite infrastructure needed.** Just pass `megaResolution.displaySpecies` to PokemonSprite instead of `parsed.species` when mega is active.

### Anti-Patterns to Avoid

- **Mutating `ParsedPokemon` to embed mega state:** This would corrupt paste re-export and break the parser round-trip.
- **Deriving mega state purely from item on every render without persistence:** Violates the "toggle state is persistent" locked decision.
- **Putting mega state in `AnalyzedPokemon`:** This is a derived type built in `useTeamReport.ts`; it does not persist or travel through sharing.
- **Triggering a new paste parse on mega toggle:** Toggle is a display-layer override, not a re-parse. Stats are recomputed inline from `POKEMON_DATA[megaEntry.dataKey]`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mega form data | Custom mega data table | `MEGA_BY_KEY` + `POKEMON_DATA` mega entries | Already in codebase with verified stats |
| Sprite resolution | Custom URL builder for mega slugs | `PokemonSprite` with `megaEntry.dataKey` | `sprite-url.ts` SLUG_OVERRIDES already handle charizard-megax/mewtwo-megax |
| Mega stone lookup | String matching against static list | `MEGA_POKEMON_LIST` `.megaStone` field | Every mega stone already mapped |
| State persistence | New localStorage key | Extend `useTeamMeta` `TeamMeta` interface | Pattern already established for roles/notes/mvpIndex |
| Sharing | New ShareableState encoding | Add `megaStates` field to existing `ShareableState` | Compression + serialization already handled |

---

## Data Gaps: MEGA_POKEMON_LIST vs POKEMON_DATA vs CHAMPIONS_DEX

This was verified programmatically against the live codebase:

### MEGA_POKEMON_LIST entries missing from CHAMPIONS_DEX (2 items)

These megas appear in the MEGA_POKEMON_LIST competitive list but are NOT currently in CHAMPIONS_DEX:

| Mega | Verdict |
|------|---------|
| `salamence-mega` | Must add to CHAMPIONS_DEX — Salamence is in the dex, its mega should be too |
| `mawile-mega` | Must add to CHAMPIONS_DEX — Mawile's base form is absent; both need adding if legal |

**Action:** Verify Salamence-Mega and Mawile/Mawile-Mega against official Serebii Reg M-A list before adding. If legal, add both base + mega key to CHAMPIONS_DEX.

### POKEMON_DATA mega entries NOT in MEGA_POKEMON_LIST (non-Champions megas)

These exist in `POKEMON_DATA` but are not in the competitive MEGA_POKEMON_LIST. They represent megas that may not be in Reg M-A or were added as data completeness entries:

`blaziken-mega`, `medicham-mega`, `manectric-mega`, `diancie-mega`, `banette-mega`, `glalie-mega`, `latias-mega`, `latios-mega`, `swampert-mega`, `sceptile-mega`, `sharpedo-mega`, `camerupt-mega`, `pidgeot-mega`

**These megas will still display correctly** if a user pastes them (lookup goes through `POKEMON_DATA` directly), but they won't appear as toggle targets unless their `baseName` is present in `MEGA_POKEMON_LIST`. For Phase 15, the priority is M-A competitive megas — these are lower priority.

### CHAMPIONS_DEX mega keys present (30 confirmed)

All 30 megas currently in CHAMPIONS_DEX have corresponding `POKEMON_DATA` entries. No data mismatches found.

---

## Reg M-A Regulation Gating

The regulation check is already in `useTeamMeta` via `tags.regulation`. The `REGULATIONS` array in `tags.ts` includes `"Reg M-A"`.

**Gating logic** (from locked decision): Show mega toggle only when:
```typescript
const reg = tags?.regulation;
const megaAllowed = !reg || reg === "Reg M-A";
```

This means:
- No regulation set → show toggle (user might be testing M-A)
- Reg M-A → show toggle
- Any other regulation (Reg G, H, etc.) → hide toggle entirely, always show base form

The `tags` object travels through `useHomePage` -> all slide components -> PokemonCard. The regulation must be passed down to PokemonCard (currently it does not receive it). **This requires adding `regulation?: string` to PokemonCardProps** or resolving it upstream before passing `isMega`/`canToggle`.

**Recommended approach:** Resolve mega state in `useHomePage` or the parent slide component, where `tags` is available. Pass resolved `isMega: boolean` and `canToggle: boolean` down to PokemonCard. This avoids threading `tags` deep into the card.

---

## Meta Threats for SpeedTierChart

Current `META_THREATS` array contains 20 modern-format threats (flutter-mane, iron-bundle, etc.) — none are Megas.

For Reg M-A, the top speed-relevant Mega threats to add (ordered by competitive speed importance):

| Mega | Base Spe | Max Speed | Why Include |
|------|----------|-----------|-------------|
| `lopunny-mega` | 135 | 200 | Fastest common mega, speed reference point |
| `aerodactyl-mega` | 150 | 222 | Fastest mega overall |
| `alakazam-mega` | 150 | 222 | Tied fastest, special attacker |
| `salamence-mega` | 120 | 178 | Top-tier sweeper |
| `gengar-mega` | 130 | 193 | Fast special attacker with Shadow Tag |
| `kangaskhan-mega` | 100 | 149 | Most common M-A mega, speed benchmark |
| `metagross-mega` | 110 | 163 | Bulky fast physical attacker |
| `lucario-mega` | 112 | 166 | Common priority user |
| `garchomp-mega` | 92 | 136 | Speed drops from base — notable creep zone |
| `beedrill-mega` | 145 | 215 | Extremely fast glass cannon |

**Implementation:** Add these 10 keys to `META_THREATS` constant in `SpeedTierChart.tsx`. The POKEMON_DATA lookups for these keys already exist. The existing `maxSpeed`/`minSpeed` functions will compute ranges correctly.

**Note:** META_THREATS currently shows current-format VGC threats. For a shared chart used across regulations, consider filtering threats by regulation rather than mixing Reg H/I threats with Reg M-A threats. But this is Claude's discretion territory — the locked decision only says "add Mega threats."

---

## Common Pitfalls

### Pitfall 1: Charizard Dual Mega — Two Items, Two Different Megas

**What goes wrong:** Treating Charizard as having one mega form. Charizard has Charizardite X (Fire/Dragon, Tough Claws) and Charizardite Y (Fire/Flying, Drought) — completely different Pokemon.

**Why it happens:** Most lookup patterns match species -> mega. Charizard breaks the 1:1 species-to-mega assumption.

**How to avoid:** The `findMegaByItem` lookup in the mega resolver must match on BOTH `baseName` AND `megaStone`. This is already correct in the MEGA_POKEMON_LIST structure. Never key the lookup solely on species name.

**Warning signs:** If Charizard with Charizardite X shows Drought instead of Tough Claws, the lookup is wrong.

### Pitfall 2: Stats Not Recalculated for Mega Form

**What goes wrong:** Showing mega types/ability but still using base form stats for the speed tier and stat bar display.

**Why it happens:** `AnalyzedPokemon.calculatedStats` is computed once in `useTeamReport` from `parsed.species` -> `lookupPokemon`. The mega toggle happens at render time, after analysis is built.

**How to avoid:** When rendering PokemonCard in mega mode, use `POKEMON_DATA[megaEntry.dataKey].baseStats` as the base for stat display (or re-derive `calculatedStats` in the mega resolver). The `calculateAllStats` function takes base stats as input — call it again with mega base stats and the same IVs/EVs/nature/level.

**Warning signs:** Kangaskhan showing 95 base Speed (base form) in the speed tier instead of 100 (mega form).

### Pitfall 3: Mega State Lost on Paste Re-parse

**What goes wrong:** User sets a Pokemon to mega form, then edits the paste — mega states reset to auto-detect.

**Why it happens:** `useTeamReport.parseTeam()` rebuilds `parsedTeam` from scratch, but mega states are stored separately in `useTeamMeta`. If mega states are indexed by pokemon position (0-5), a re-order or paste edit can misalign them.

**How to avoid:** Key mega states by species string (or species + index combo), not just index. When the team changes, validate that stored mega states match current team species. Alternative: always auto-detect from item on parse (which is the primary signal) and only store the manual override separately.

### Pitfall 4: Toggle Appears in Non-Mega Regulations

**What goes wrong:** User on a Reg G team (Scarlet/Violet) sees Mega toggle buttons, tries to click them, gets confused.

**Why it happens:** `canToggle` check forgets to gate on regulation.

**How to avoid:** The `megaAllowed` gate (`!regulation || regulation === "Reg M-A"`) must be applied in the resolver before `canToggle` can ever be true. Test with a Reg G team that has a Kangaskhan — toggle must be invisible.

### Pitfall 5: Sprite Slug for `charizard-mega-y` / `charizard-mega-x`

**What goes wrong:** Passing `"charizard-mega-x"` directly to PokemonSprite generates URL `/gen5ani/charizard-mega-x.gif` which 404s on Showdown.

**Why it happens:** Showdown uses `charizard-megax` (no hyphen before x/y).

**How to avoid:** `sprite-url.ts` SLUG_OVERRIDES already maps `"charizard-mega-x" -> "charizard-megax"`. This works because `resolveSlug` calls `toSlug` (which produces `"charizard-mega-x"`) then checks SLUG_OVERRIDES. No additional code needed — just pass the `dataKey` string directly.

### Pitfall 6: Shared View Doesn't Show Mega State

**What goes wrong:** Creator sets Kangaskhan to mega; viewer opens shared link and sees base Kangaskhan.

**Why it happens:** `megaStates` wasn't added to `ShareableState` or wasn't included in `buildShareState()`.

**How to avoid:** Add `megaStates?: Record<number, boolean>` to `ShareableState` interface AND add it to the `buildShareState` call in `useHomePage.ts`. Also hydrate it in `handleRemoteUpdate` and the shared state effect.

---

## Code Examples

### Extending useTeamMeta for megaStates

```typescript
// In src/hooks/useTeamMeta.ts

interface TeamMeta {
  roles: Record<string, string>;
  summary: string;
  // ... existing fields ...
  megaStates?: Record<number, boolean>;  // ADD THIS
}

// New setter (follows existing pattern):
const setMegaState = useCallback((index: number, isMega: boolean | undefined) => {
  setMeta((prev) => {
    const next = { ...prev.megaStates };
    if (isMega === undefined) {
      delete next[index];
    } else {
      next[index] = isMega;
    }
    return { ...prev, megaStates: next };
  });
}, []);

const setMegaStatesFull = useCallback((states: Record<number, boolean>) => {
  setMeta((prev) => ({ ...prev, megaStates: states }));
}, []);
```

### Auto-detection in the analysis / render pipeline

```typescript
// In useHomePage or the slide component that builds PokemonCard props:
import { MEGA_POKEMON_LIST } from "@/lib/data/mega-pokemon";

function isMegaActive(
  parsedPokemon: ParsedPokemon,
  index: number,
  megaStates: Record<number, boolean> | undefined,
  regulation: string | undefined,
): boolean {
  const regAllowed = !regulation || regulation === "Reg M-A";
  if (!regAllowed) return false;

  const explicitOverride = megaStates?.[index];
  if (explicitOverride !== undefined) return explicitOverride;

  // Auto-detect: item must match a mega stone for the correct base species
  const item = parsedPokemon.item?.toLowerCase() ?? "";
  return MEGA_POKEMON_LIST.some(
    (m) =>
      m.baseName.toLowerCase() === parsedPokemon.species.toLowerCase() &&
      m.megaStone.toLowerCase() === item
  );
}
```

### SpeedTierChart META_THREATS addition

```typescript
// src/components/report/SpeedTierChart.tsx
const META_THREATS = [
  // Existing modern-format threats:
  "flutter-mane", "iron-bundle", "raging-bolt", "calyrex-shadow",
  "urshifu", "urshifu-rapid-strike", "tornadus", "landorus",
  "incineroar", "rillaboom", "amoonguss", "iron-hands",
  "chien-pao", "ogerpon", "kingambit", "archaludon",
  "pelipper", "torkoal", "porygon2", "dusclops",
  // M-A Mega threats:
  "aerodactyl-mega", "alakazam-mega", "beedrill-mega",
  "lopunny-mega", "gengar-mega", "lucario-mega",
  "metagross-mega", "salamence-mega", "kangaskhan-mega", "garchomp-mega",
] as const;
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Mega as separate paste species "Kangaskhan-Mega @ Kangaskhanite" | Same paste format, toggle layer on top | No paste format changes needed |
| Sprite slugs hardcoded | SLUG_OVERRIDES table in sprite-url.ts | New megas need an entry if Showdown slug differs |

---

## Open Questions

1. **Are Salamence-Mega and Mawile/Mawile-Mega actually legal in Reg M-A?**
   - What we know: `salamence-mega` and `mawile-mega` are in `MEGA_POKEMON_LIST` but not in `CHAMPIONS_DEX`. Salamence (base) IS in CHAMPIONS_DEX; Mawile (base) is NOT.
   - What's unclear: Whether Serebii lists these as legal. Champions is a special format and may not include all Gen 6 megas.
   - Recommendation: Check https://www.serebii.net/pokemonchampions/pokemon.shtml before adding. The planner should include a task to verify and patch CHAMPIONS_DEX if needed.

2. **Should META_THREATS filter by regulation in the UI?**
   - What we know: Current META_THREATS shows Reg H/I/G threats that are irrelevant for M-A games.
   - What's unclear: Whether the user wants a single combined list or a regulation-aware filtered list.
   - Recommendation: Locked decision only says "add Mega threats." Add them unconditionally for now; regulation-aware filtering is a future enhancement. The planner does not need to scope this in Phase 15.

3. **Does `AnalyzedPokemon.calculatedStats` need to reflect mega stats for speed tier calculation?**
   - What we know: `calculatedStats` is used both in PokemonCard stat bars AND implicitly in SpeedTierChart's `baseSpe` for your team members (`mon.calculatedStats.spe`).
   - What's unclear: Whether SpeedTierChart should use mega speed when a Pokemon is toggled to mega form.
   - Recommendation: YES — if a Pokemon is showing in mega form, its speed tier display should use mega stats. This means either re-computing `calculatedStats` with mega base stats, or passing an `effectiveCalculatedStats` override. The planner should scope this as part of the mega resolver output.

---

## Environment Availability

Step 2.6: SKIPPED — this is a pure code/data change, no external dependencies beyond the existing project stack.

---

## Project Constraints (from CLAUDE.md)

- TypeScript strict: run `npx tsc --noEmit && npm run build` before every push
- Commit message prefix: `VGC-XX: description` (check Linear for ticket number)
- Push direct to main (trunk-based)
- UI changes must follow `.claude/skills/ui-ux-pro-max/SKILL.md` — accessibility, 44x44 touch targets, aria-labels on toggle button, respect prefers-reduced-motion
- SVG icons only (no emoji as UI icons in production components)
- Semantic color tokens, not raw hex
- Mobile-first layout (`max-w-5xl` consistent)
- No drive-by refactors — keep changes focused on mega feature

---

## Sources

### Primary (HIGH confidence — live codebase inspection)

- `src/lib/data/mega-pokemon.ts` — 31 MegaPokemonEntry records, MEGA_BY_KEY/MEGA_BY_SLUG maps
- `src/lib/data/pokemon.ts` L1793-2145 — ~50 mega PokemonData entries with verified base stats
- `src/lib/data/champions-dex.ts` L180-211 — 30 mega form keys in CHAMPIONS_DEX
- `src/lib/utils/sprite-url.ts` L72-75 — SLUG_OVERRIDES for charizard/mewtwo mega X/Y
- `src/components/report/PokemonCard.tsx` — full component structure, existing prop patterns
- `src/components/report/SpeedTierChart.tsx` — META_THREATS array, speed computation functions
- `src/hooks/useTeamMeta.ts` — TeamMeta interface, localStorage persistence pattern
- `src/hooks/useTeamReport.ts` — AnalyzedPokemon construction, `lookupPokemon` usage
- `src/lib/sharing/url-codec.ts` — ShareableState interface for persistent sharing
- `src/lib/parser/showdown-parser.ts` — paste parsing: species comes through as-written (e.g., "Kangaskhan-Mega")
- `src/lib/data/tags.ts` — REGULATIONS array confirms "Reg M-A" is valid regulation value

### Secondary (MEDIUM confidence)

- Programmatic gap analysis (node -e) run against live file contents — confirmed MEGA_POKEMON_LIST vs POKEMON_DATA vs CHAMPIONS_DEX discrepancies

---

## Metadata

**Confidence breakdown:**
- Data completeness: HIGH — verified programmatically
- State architecture: HIGH — pattern derived directly from existing hooks (useTeamMeta, ShareableState)
- UI component approach: HIGH — follows existing PokemonCard MVP star button pattern exactly
- Sprite resolution: HIGH — SLUG_OVERRIDES already handles all edge cases
- Regulation gating: HIGH — REGULATIONS includes "Reg M-A", tags flow is clear
- Serebii/Showdown data: MEDIUM — CHAMPIONS_DEX header says "Source: serebii.net" but Salamence-Mega/Mawile-Mega gap needs manual verification

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable domain — Pokemon Champions format doesn't change frequently)
