# VGC-137 Analysis: Show Both Team Pokemon and Meta Threat in Speed Chart

**Date:** 2026-05-15
**File:** `src/components/report/SpeedTierChart.tsx`

---

## Finding: No Deduplication Actually Exists Anymore

After a full read of the component, **the deduplication bug described in the ticket has already been removed**. The comment block at lines 244-248 explicitly documents this intent:

```
// Build meta threat entries. We intentionally do NOT filter out Pokemon
// already on the user's team — a player running a bulky/mid-speed variant
// wants to compare it against the standard max-speed meta build of the
// same species. Duplicates are visually disambiguated by a "META" badge
// on the meta entry (see render below).
```

The `metaEntries` useMemo (lines 253-278) computes `isDuplicateOfTeam` via `teamSpeciesSet.has(key)` but does **not filter them out** — it just flags them. All meta threats pass through to `allEntries`.

The visual disambiguation is already implemented at lines 538-545:

```tsx
{!entry.isYours && entry.isDuplicateOfTeam && (
  <span
    className="text-[8px] sm:text-[9px] font-extrabold text-slate-500 bg-slate-500/10 border border-slate-500/20 px-1 sm:px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
    title="Standard meta variant (max speed)"
  >
    Meta
  </span>
)}
```

---

## Root Cause Assessment

The issue as written may be based on an **older version** of the file that did have a `.filter()` call removing duplicates. The current codebase has already resolved that first-order problem.

However, two **genuine UX gaps remain** that still cause the confusion described in VGC-137:

### Gap 1: The "Meta" badge is too subtle for duplicate entries

The badge is `text-slate-500` on `bg-slate-500/10` — nearly invisible against both light and dark themes. A user glancing at the chart sees two "Garchomp" rows and can't quickly tell which is their own build vs the benchmark without squinting at the tiny badge.

### Gap 2: `isDuplicateOfTeam` uses a naive species-key match that misses Mega forms

`teamSpeciesSet` is built from:
```ts
new Set(pokemon.map(p => p.parsed.species.toLowerCase().replace(/\s+/g, "-")))
```

Meta threats include keys like `"garchomp-mega"`. A user with Garchomp (base form) whose `speciesKey` is `"garchomp"` will NOT match against the meta entry `"garchomp-mega"`. This means the "Meta" badge never fires for Mega vs base-form pairings — the user sees an unexplained second Garchomp-Mega row with no label.

### Gap 3: No labeling on the team entry side to indicate it's "your build"

When duplicates appear, the meta entry gets the "Meta" badge, but the user's own entry has nothing to distinguish it as "yours" beyond the bar color. In presentation mode or on small screens, bar color differences are easy to miss.

---

## Proposed Fix

### Change 1: Make the "Meta" badge more visible (lines 538-545)

Replace the low-contrast slate styling with a blue accent that matches the "Meta Threats" toggle button:

```tsx
// BEFORE
className="text-[8px] sm:text-[9px] font-extrabold text-slate-500 bg-slate-500/10 border border-slate-500/20 px-1 sm:px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"

// AFTER
className="text-[8px] sm:text-[9px] font-extrabold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-1 sm:px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
```

This matches the blue used by the "Meta Threats" toggle button (lines 463-471: `bg-blue-500/15 text-blue-500 border-blue-500/30`) and creates a consistent visual language: blue = meta benchmark.

### Change 2: Add a reciprocal "Yours" badge on team entries when a duplicate meta entry exists (after line 525)

When a user's Pokemon appears alongside its meta benchmark, add a complementary badge on the team entry so both sides are labeled:

First, compute which team species have a meta counterpart — add to the `metaEntries` useMemo result or derive a separate set:

```ts
// After metaEntries useMemo, or inside allEntries useMemo:
const metaSpeciesSet = useMemo(
  () => new Set(metaEntries.map(e => e.speciesKey)),
  [metaEntries]
);
```

Then in the render, after the existing "Mega" badge block (line 534), add:

```tsx
{entry.isYours && !entry.isMega && metaSpeciesSet.has(entry.speciesKey) && (
  <span
    className="text-[8px] sm:text-[9px] font-extrabold text-[color:var(--stat-spe)] bg-[color:var(--stat-spe)]/10 border border-[color:var(--stat-spe)]/30 px-1 sm:px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
    title="Your actual build (EVs/nature from paste)"
  >
    Yours
  </span>
)}
```

### Change 3: Fix Mega-vs-base isDuplicateOfTeam matching (lines 249-252)

Expand `teamSpeciesSet` to also include the base-form keys for all Mega entries in `META_THREATS`:

```ts
// BEFORE
const teamSpeciesSet = useMemo(
  () => new Set(pokemon.map(p => p.parsed.species.toLowerCase().replace(/\s+/g, "-"))),
  [pokemon],
);

// AFTER — also capture base forms so "garchomp" matches "garchomp-mega"
const teamSpeciesSet = useMemo(() => {
  const set = new Set(pokemon.map(p => p.parsed.species.toLowerCase().replace(/\s+/g, "-")));
  // Also add mega-base mappings so a team Garchomp matches meta "garchomp-mega"
  for (const key of set) {
    const megaKeys = BASE_KEY_TO_MEGA_KEYS.get(key) ?? [];
    for (const mk of megaKeys) set.add(mk);
  }
  return set;
}, [pokemon]);
```

This ensures the `isDuplicateOfTeam` flag fires correctly for Mega meta entries whose base form is on the team.

### Change 4: Update the min/max range indicator for meta entries (optional enhancement)

The `metaEntries` already computes both `baseSpe` (max speed) and `minSpe` (min speed). This range could be rendered as a faint underlay behind the meta bar to show the full speed range, not just max:

```tsx
// Inside the bar column, for !entry.isYours entries with minSpe:
{!entry.isYours && entry.minSpe !== undefined && (
  <div
    className="absolute inset-y-0 left-0 rounded-lg bg-slate-500/10"
    style={{ width: `${(entry.minSpe / maxDisplaySpeed) * 100}%` }}
    aria-hidden="true"
  />
)}
```

The min-speed bar renders behind the max-speed bar, giving the user a visual "range" band. This is optional and should be gated behind the same `showMetaThreats` guard (already implicitly handled since these entries only appear when that toggle is on).

---

## Edge Cases

### Mega Evolution speed changes
The `teamMegaEntries` logic (lines 205-242) correctly gates on `detectMegaFromItem` — a Mega entry only appears if the Pokemon holds the correct Mega Stone. A user who has Kangaskhan without Kangaskhanite will not see a Mega Kangaskhan tier row from the team side. The `isDuplicateOfTeam` fix (Change 3) must only add Mega keys when the base form is present, not blindly expand — the proposed code does this correctly (it iterates `set` which only has confirmed team members).

### Users with Mega on team + meta Mega entry
If a user has Kangaskhan with Kangaskhanite, they get:
1. A team "Kangaskhan" row (base form, pre-Mega speed)
2. A team "Kangaskhan-Mega" row (from `teamMegaEntries`, purple "Mega" badge)
3. A meta "Kangaskhan-Mega" row (from `META_THREATS_CHAMPIONS`, with "Meta" badge)

After Change 3, row 3's `isDuplicateOfTeam` will correctly be `true`, and it will receive the "Meta" badge. Row 2 already has the purple "Mega" badge. No double-badging conflict.

### Position change keys for duplicate species
The `positionChanges` map uses `${e.speciesKey}-${e.isYours ? "yours" : "opponent"}` as its key (lines 334, 349). With two Garchomp entries (one `"garchomp-yours"`, one `"garchomp-opponent"`), these are distinct keys and position tracking works correctly with no change needed.

### `speedTieGroups` behavior with duplicate species
The tie-group logic groups by `displaySpeed` and accumulates `species` (the display name string). If the user's Garchomp and the meta Garchomp happen to tie, both will be in the same tie group under the same `species` string "Garchomp". The `tiePartners` filter `tieGroup.filter(s => s !== entry.species)` will therefore produce an empty array for both — making the TIE tooltip misleading ("tied with..." followed by nothing). 

**Fix:** Use the entry's key (species + side) rather than just species name in the tie group. This is a separate micro-bug but surfaced by duplicate species:

```ts
// In speedTieGroups useMemo, use a compound label:
const label = e.isYours ? e.species : `${e.species} (meta)`;
existing.species.push(label);
```

---

## Summary of Lines to Change

| Location | Lines | Change |
|----------|-------|--------|
| `teamSpeciesSet` useMemo | 249-252 | Expand set to include Mega keys for team base forms |
| Meta "Meta" badge | 538-545 | Change slate styling to blue (matches toggle button) |
| After "Mega" badge block | ~534 | Add reciprocal "Yours" badge when meta duplicate exists |
| New `metaSpeciesSet` | After line 278 | Derive set of meta species keys for "Yours" badge check |
| `speedTieGroups` species labels | ~383 | Use `species (meta)` label to disambiguate tie partners |
| Min-speed range bar | ~550 (bar div) | Optional: render faint underlay for meta min-speed |

The most impactful changes are the badge visibility fix (Change 1) and the reciprocal "Yours" badge (Change 2). The Mega matching fix (Change 3) is a correctness bug. The rest are polish.
