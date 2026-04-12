# VGC-77: Pre-Built Champions Sample Teams (3-5 Archetypes)

**Status:** Backlog (P1)
**Goal:** Create 3-5 ready-made Champions team reports showcasing major archetypes so new visitors can instantly see the tool's value.

## Why This Matters

- New visitors land on `/champions` with nothing to paste — sample teams give them an instant "aha" moment
- Pre-built reports serve as templates for players building similar teams
- Feeds into VGC-87 (Twitter campaign) and VGC-85 (YouTube partnerships) as shareable content
- SEO value: each report is a shareable link with Mega Pokemon keywords

## Archetypes to Cover

### 1. Mega Rayquaza Hyper Offense

**Core:** Mega Rayquaza + fast support
**Why:** Rayquaza is the poster child of Champions. Delta Stream + Dragon Ascent is the format-defining threat.

**Sample Team:**
- Rayquaza-Mega @ (no item needed for Mega)
- Kyogre (Primal or regular) — rain mode / coverage
- Incineroar — Fake Out + Intimidate support
- Rillaboom — Grassy Terrain priority
- Whimsicott — Tailwind speed control
- Urshifu-Rapid-Strike — anti-Trick Room option

### 2. Primal Groudon Sun

**Core:** Primal Groudon + sun abusers
**Why:** Groudon defines sun teams in Champions with Desolate Land.

**Sample Team:**
- Groudon-Primal @ Red Orb
- Charizard-Mega-Y @ Charizardite Y (double sun)
- Venusaur — Chlorophyll sun sweeper
- Cresselia — Trick Room option
- Incineroar — Fake Out + Intimidate
- Tsareena — Queenly Majesty anti-priority

### 3. Xerneas + Mega Kangaskhan

**Core:** Xerneas Geomancy + Mega Kangaskhan Fake Out
**Why:** Classic power combo. Kangaskhan gives free turns for Geomancy setup.

**Sample Team:**
- Xerneas @ Power Herb
- Kangaskhan-Mega @ Kangaskhanite
- Groudon — restricted pair with Xerneas
- Amoonguss — redirection + Spore
- Incineroar — pivot
- Tornados (Incarnate) — Tailwind

### 4. Trick Room (Mega Mawile / Mega Camerupt)

**Core:** Slow Mega + Trick Room setter
**Why:** Represents the opposite speed spectrum, important for format diversity.

**Sample Team:**
- Mawile-Mega @ Mawilite
- Calyrex-Ice — Trick Room setter + restricted
- Porygon2 @ Eviolite — backup TR setter
- Amoonguss — redirection
- Incineroar — slow pivot
- Torkoal — Eruption under TR + sun option

### 5. Rain (Mega Swampert)

**Core:** Mega Swampert + Rain setter
**Why:** Swift Swim Mega Swampert is a unique Champions threat.

**Sample Team:**
- Swampert-Mega @ Swampertite
- Kyogre — Drizzle restricted
- Ferrothorn — rain wall
- Tornadus — Tailwind + rain abuser
- Rillaboom — Grassy Terrain support
- Incineroar — Fake Out pivot

## Implementation Options

### Option A: Pre-saved reports (recommended)
- Create each team as a saved report in the database
- Add a "Sample Teams" section on `/champions` that links to these reports
- Users can view, copy the paste, or fork into their own report

### Option B: Hardcoded showcase
- Add a carousel/grid on `/champions` with team previews
- Click to load the paste into the report builder
- Simpler but less shareable

### Option C: Both
- Saved reports for shareability + a showcase section on `/champions` for discoverability

## Tasks

- [ ] Validate team legality against Regulation M-A rules (cross-ref VGC-74)
- [ ] Build each team as a Showdown paste
- [ ] Generate reports through the tool
- [ ] Save/share each report to get permanent links
- [ ] Add "Sample Teams" section to `/champions` page
- [ ] Write a 2-3 sentence description for each archetype
- [ ] Test that all sprites load correctly (Mega forms, Primals)
- [ ] Verify speed tier charts render properly for each team

## Notes

- These teams don't need to be tournament-winning optimal — they need to be recognizable archetypes that showcase the tool's features
- Each team should use at least one Mega Evolution (the format's unique feature)
- Include at least one Trick Room team to show the speed tier chart handles both directions
- Update these when the meta shifts or after major tournaments
- Coordinate with VGC-87 and VGC-85 — these reports are content assets for the campaign
