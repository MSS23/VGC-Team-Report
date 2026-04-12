# VGC-74: Champions Format Team Legality Validator

**Status:** Backlog (P1)
**Goal:** Validate that a team is legal under Champions format Regulation M-A rules before/during report creation.

## Regulation M-A Rules

### Pokemon Legality
- **National Dex:** All Pokemon from Gens 1-9 are usable (with exceptions below)
- **Banned Pokemon:** Mythicals are banned (Mew, Celebi, Jirachi, Deoxys, Phione, Manaphy, Darkrai, Shaymin, Arceus, Victini, Keldeo, Meloetta, Genesect, Diancie, Hoopa, Volcanion, Magearna, Marshadow, Zeraora, Meltan, Melmetal, Zarude, Pecharunt)
- **Restricted Pokemon:** 2 allowed per team (box legendaries, ultra beasts, etc.)
- **Mega Evolution:** Allowed (one per team — the Pokemon must hold its Mega Stone)
- **Primal Reversion:** Allowed (Red Orb / Blue Orb — counts toward Mega limit? TBD — verify rules)
- **Z-Moves:** NOT allowed in Champions
- **Dynamax:** NOT allowed in Champions
- **Tera:** NOT allowed in Champions (Reg M-A is pre-Gen 9 mechanics)

### Team Composition Rules
- Exactly 6 Pokemon per team (for team sheet / report purposes)
- Bring 4 to each battle
- No duplicate Pokemon (Species Clause)
- No duplicate items (Item Clause)
- All Pokemon must be level 50 (auto-leveled)

### Move Legality
- Moves must be learnable by the Pokemon in its legal movepool
- Transfer-only moves may apply (depends on generation legality)
- Sketched moves follow Smeargle rules

## Validation Checks to Implement

### Priority 1 — Must Have
| Check | Rule | Error Message |
|-------|------|--------------|
| Team size | Exactly 6 Pokemon | "Team must have exactly 6 Pokemon" |
| Species clause | No duplicate species | "[Pokemon] appears more than once" |
| Item clause | No duplicate items | "[Item] is held by multiple Pokemon" |
| Restricted count | Max 2 restricted Pokemon | "Team has [N] restricted Pokemon (max 2): [list]" |
| Banned Pokemon | No mythicals or banned mons | "[Pokemon] is banned in Champions format" |
| Mega limit | Max 1 Mega Stone on team | "Only 1 Mega Evolution allowed per team" |

### Priority 2 — Important
| Check | Rule | Error Message |
|-------|------|--------------|
| Move legality | Pokemon can learn its moves | "[Pokemon] cannot learn [Move]" |
| Ability legality | Pokemon has a legal ability | "[Pokemon] cannot have [Ability]" |
| Item legality | No Z-Crystals | "Z-Crystals are not allowed in Champions format" |
| EV total | Max 510 EVs per Pokemon | "[Pokemon] has [N] total EVs (max 510)" |
| EV per stat | Max 252 per stat | "[Pokemon] has [N] [Stat] EVs (max 252)" |

### Priority 3 — Nice to Have
| Check | Rule | Error Message |
|-------|------|--------------|
| IV range | 0-31 per stat | "[Pokemon] has invalid [Stat] IV" |
| Nature validity | Valid nature name | "[Nature] is not a valid nature" |
| Level | Must be 50 | Auto-correct to 50, show info message |

## Where to Validate

### Option A: Client-side validation during paste input
- Run checks as soon as the team is parsed from Showdown paste
- Show warnings/errors inline before generating the report
- Fastest feedback, no server round-trip
- Best UX: user sees issues immediately

### Option B: Validation badge on the report
- After report is generated, show a "Legal" / "Issues Found" badge
- Click to see details
- Less intrusive, works for shared reports too

### Option C: Both (recommended)
- Validate on paste (Option A) with inline warnings
- Show validation badge on generated report (Option B)
- Shared reports show legality status to viewers

## Data Sources

- **Restricted list:** `src/lib/data/champions-dex.ts` (check what's already defined)
- **Banned list:** Needs to be created or extended
- **Move learnsets:** Can use PokeAPI or a bundled dataset
- **Mega Stones:** Map of Pokemon -> Mega Stone name

## Existing Code to Check

- `src/lib/parser/showdown-parser.ts` — where team paste is parsed
- `src/lib/data/champions-dex.ts` — Champions-specific Pokemon data
- `src/lib/data/pokemon.ts` — general Pokemon data
- `src/lib/data/mega-pokemon.ts` — Mega Evolution data
- `src/lib/analysis/stat-calculator.ts` — EV/stat validation helpers may exist

## UI/UX

- Validation errors: red badge with count, expandable list
- Validation warnings: yellow badge (e.g., "no item on a Pokemon")
- Legal team: green checkmark badge
- On `/champions` page, show format rules summary
- Consider a "Fix" button that suggests corrections (e.g., "Remove 3rd restricted Pokemon")

## Tasks

- [ ] Audit `champions-dex.ts` for existing restricted/banned lists
- [ ] Create `src/lib/validation/champions-legality.ts` with all check functions
- [ ] Integrate validation into the paste input flow
- [ ] Add validation badge component to report view
- [ ] Add Champions format rules reference section to `/champions`
- [ ] Write unit tests for each validation rule
- [ ] Test with known legal and illegal teams

## Dependencies

- VGC-77 (sample teams) — sample teams must pass validation
- Champions data files must be accurate and complete
