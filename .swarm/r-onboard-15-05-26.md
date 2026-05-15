# Onboarding & Empty State UX Analysis — 2026-05-15

## Context

VGC Team Report: new users land on `/`, see a textarea, and must know what Showdown export format is before getting value. The core UX challenge is the blank input — competitive Pokémon players know exactly what a Showdown export is, but casual or new-to-VGC visitors don't.

---

## Current State Audit

### Homepage Entry Point (`src/app/page.tsx`)

The homepage (`HomeContent`) orchestrates everything. It renders `PasteInput` when no `analysis` exists. It already has:
- `?sample=ID` URL param loading (`page.tsx:311–330`) that loads from `CHAMPIONS_SAMPLE_TEAMS`
- `isSampleTeam` flag to prevent auto-persisting sample data
- Draft loading via `?draft=ID`

### Input Component (`src/components/input/PasteInput.tsx`)

**Good:**
- `SAMPLE_PASTE` constant (lines 21–80): a full 6-Pokémon team already exists
- "Try a sample team" one-click button (lines 476–494): calls `onPasteChange(SAMPLE_PASTE); onAnalyze(SAMPLE_PASTE)` — loads instantly
- Placeholder text in the textarea (lines 401–403): shows a single Incineroar set
- "How it works" 3-step collapsible (lines 327–367): collapsed for returning users via `localStorage`
- `WhatsNewModal` (line 620): fires for new users with `WELCOME_FEATURES` list

**Gaps:**
1. The "Try a sample team" button exists but **shows only one sample** (a 2019 Worlds meta team — Kangaskhan-Mega, Salamence-Mega). No choice, no framing around _what_ you're about to see.
2. The `CHAMPIONS_SAMPLE_TEAMS` data (`src/data/champions-sample-teams.ts`) has 3 well-described archetypes (Primal Groudon Sun, etc.) accessible via `?sample=ID` from `/champions` — but these are **not surfaced on the homepage at all**.
3. The `WhatsNewModal` for new users (`src/components/ui/WhatsNewModal.tsx:111–119`) shows features but no interactive demo — it's a feature list, not a "try it" experience.
4. No contextual tooltip or callout pointing new users toward the textarea when it's empty (outside the static "How it works" cards).
5. The textarea placeholder is a **single Pokémon**, not a multi-mon snippet — new users may not realize the full 6-Pokémon format is expected.

### Explore Page (`src/app/explore/page.tsx` → `src/components/explore/ExploreContent.tsx`)

`ExploreInner` (ExploreContent.tsx:26) shows `ExploreEmpty` when `reports.length === 0`.

**`ExploreEmpty` (`src/components/explore/ExploreEmpty.tsx`):**
- Shows a Substitute sprite (opacity 30%) + heading + short text + "Build Your Own" CTA
- For search: shows "No results" + "Try different search" text
- **No suggestions, no example searches, no popular tag shortcuts, no "clear filters" shortcut**
- The Substitute sprite is thematically cute but carries zero information scent

**Explore filter state:**
- `ExploreContent.tsx:171–172`: empty check is only on `reports.length === 0` with `!!query` flag for search vs cold start
- No distinction between: first-time visitor (no content at all) vs filtered search that returned nothing vs following-only tab with no follows

---

## Research Synthesis

Key patterns from current UX literature (2025–2026):

1. **"Aha! moment first"** — show value before asking for commitment. Apps that let users feel the product before a paywall/registration convert significantly higher (RevenueCat data). For VGC Team Report: the "aha moment" is _seeing a rendered report_. The current "Try a sample team" button achieves this, but it's de-emphasized.

2. **Progressive disclosure** — don't explain everything upfront. The 3-step "How it works" cards are good but collapse for returning users only. New users on mobile get all 3 cards plus the textarea, which pushes the input below the fold on small screens.

3. **Empty states as onboarding** — empty states should never be dead ends. Best practice: explain _why_ it's empty, offer the "next best thing" (e.g. clear filters, try popular searches, see featured content), and include a CTA that creates engagement.

4. **Pre-filled sample data** — tool builders (Notion, Linear, Figma) all pre-load a sample workspace/project for new users. The pattern converts because users interact with real UI before committing to learning the import format.

5. **Social proof in empty states** — showing "X teams shared this week" or featured community members in an empty state makes the space feel alive, not abandoned.

---

## Top 3 Highest-Impact Onboarding Improvements

---

### #1 — Multi-Sample "Try it" Picker (replaces single sample button)

**Impact: HIGH | Effort: LOW-MEDIUM (~2–3h)**

**Problem:** The current one-click "Try a sample team" button loads the same 2019 Kangaskhan/Salamence team every time with no context. New users don't know what archetype they're about to see, and there's no choice — which reduces perceived control and curiosity.

**Recommendation:** Replace the single sample button with a 3-option "Try a sample team" picker that surfaces the existing `CHAMPIONS_SAMPLE_TEAMS` archetypes. Each option shows 6 sprite thumbnails + archetype name. Clicking one fires the existing `?sample=ID` flow or calls `onAnalyze(team.paste)` directly.

**Where to change:**
- `src/components/input/PasteInput.tsx` lines 474–494 — replace the single `motion.button` block
- `src/data/champions-sample-teams.ts` already has the data (3 teams with `id`, `name`, `description`, `pokemon[]`, `paste`)
- Add a 3-card horizontal row (or vertical list on mobile) using the existing `PopularCardSprite` component (already in PasteInput.tsx:104–118)

**Design:**
```
┌─────────────────────────────────────────────────────────┐
│ ✦ Try a sample team — see the full report instantly      │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │
│ │ 🐉🦌🐆🦎🍄🌿  │ │ 🌊🏔️🐆🦎🍄🌿  │ │ 🕊️🌿🐆🦎🍄🌿  │  │
│ │ Primal Groudon│ │ Kyogre Rain   │ │ Trick Room    │  │
│ │ Sun           │ │               │ │ Bronzong      │  │
│ └───────────────┘ └───────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

The 3-card picker communicates:
- Multiple valid team archetypes exist (social proof of format depth)
- Users can pick a team that matches their interest
- Sprite previews make each team feel tangible before clicking

**Existing code to reuse:**
- `CHAMPIONS_SAMPLE_TEAMS` from `src/data/champions-sample-teams.ts`
- `PopularCardSprite` in `src/components/input/PasteInput.tsx:104`
- `onPasteChange` + `onAnalyze` already wired up

---

### #2 — Contextual "What to paste" tooltip on textarea focus (first-time users only)

**Impact: HIGH | Effort: LOW (~1–2h)**

**Problem:** The textarea placeholder shows a single Incineroar set (PasteInput.tsx:401–403) — one Pokémon, no framing. New users don't realize:
- The full 6-mon format is expected
- They can also paste a PokéPaste URL instead
- Ctrl+Enter submits

The "How it works" cards are above the fold but static and easy to skim past. There's no _contextual_ nudge when the user actually clicks into the textarea.

**Recommendation:** On first focus of the empty textarea (new users only, check `!isReturningUser`), show a small tooltip/popover anchored below the textarea left edge. It should:
1. Show a 2-line snippet of the expected format (header + moves for 2 mons)
2. Include a "or paste a PokéPaste URL" line
3. Auto-dismiss on the first keypress or after 4s
4. Never show again (`localStorage.setItem("vgc-paste-hint-seen", "1")`)

**Where to change:**
- `src/components/input/PasteInput.tsx` — add state `showPasteHint` (boolean), trigger on `onFocus` when `!isReturningUser && !hasContent && !hintSeen`
- Render a `motion.div` below the textarea (already used for error messages at lines 418–427)
- Use existing `isFocused` state (line 126) as the trigger gate

**Design:**
```
┌────────────────────────────────────────────────────┐
│ Paste your full Showdown export (all 6 Pokémon):   │
│                                                     │
│  Incineroar @ Assault Vest                          │
│  Ability: Intimidate                                │
│  EVs: 252 HP / 4 Atk / 252 Spe                     │
│  - Fake Out                                         │
│  ...                                                │
│                                                     │
│  Or paste a pokepast.es URL ↗                       │
└────────────────────────────────────────────────────┘
```

This solves the format ambiguity without adding permanent UI weight. It disappears the moment the user starts typing.

---

### #3 — Enriched Explore Empty State with Smart Suggestions

**Impact: MEDIUM-HIGH | Effort: LOW (~1h)**

**Problem:** `ExploreEmpty` (`src/components/explore/ExploreEmpty.tsx`) shows a Substitute sprite + generic text + one CTA. When a search/filter returns nothing:
- No "clear filters" button  
- No example searches to try
- No indication of _why_ there are no results (bad search vs genuinely no data)
- The Substitute icon is thematically appropriate but carries no action affordance

**Recommendation:** Two modes:

**Mode A — Search returned nothing (`hasSearch: true`):**
Add below the existing text:
1. "Clear search" button that resets the query (needs `onClearSearch` prop or use `window.history.replaceState`)
2. 3 quick-pick pill buttons for popular searches (e.g., "Incineroar", "Primal Groudon", "Trick Room") that fire the search filter
3. A "Browse all teams →" link

**Mode B — No public reports at all (`hasSearch: false`):**
Add:
1. Animated Pokémon sprite (replace static Substitute with an animated GIF from PS sprites URL) — shows the app is alive
2. Social proof line: "Be the first to share your team with the community"
3. Keep the existing "Build your own" CTA
4. Add a secondary "See how a report looks →" link that fires `/?sample=sample-groudon-sun` to demo without committing

**Where to change:**
- `src/components/explore/ExploreEmpty.tsx` — add `onClearSearch?: () => void` and `popularSuggestions?: string[]` props
- `src/components/explore/ExploreContent.tsx:171–172` — pass `onClearSearch={() => setQuery("")}` to `ExploreEmpty`
- Sprite URL pattern already used: `https://play.pokemonshowdown.com/sprites/ani/${slug}.gif`

**Current ExploreEmpty.tsx key lines:**
- Line 9: `{ hasSearch }` prop — needs extending to `{ hasSearch, onClearSearch?, popularSuggestions? }`  
- Line 35–44: The `!hasSearch` block — add demo team link here
- Line 27–33: Heading/text — change "No results" to "No teams match those filters" + "Try removing a filter"

---

## "Try It" Sample Team Feature — Full Design

### Current state
The `?sample=ID` mechanism exists (`page.tsx:311–330`) and is used by `/champions`. The homepage has a single "Try a sample team" button (`PasteInput.tsx:479`) that loads `SAMPLE_PASTE` (the Kangaskhan/Salamence 2019 team).

### Recommended design

**Phase 1 (low effort):** Replace the single button with the 3-card picker described in Improvement #1. No new data needed — `CHAMPIONS_SAMPLE_TEAMS` already has 3 teams.

**Phase 2 (medium effort):** Add a 4th "classic" team card using the existing `SAMPLE_PASTE` constant in `PasteInput.tsx:21–80` (Kangaskhan/Salamence/Incineroar/Tapu Fini/Landorus/Amoonguss). Label it "2019 Worlds Meta". This is already the default and needs only wrapping in the picker UI.

**Phase 3 (future):** Source 2–3 featured community reports from the API on homepage load and surface them as "Try a real team" suggestions (with `creatorName` attribution) alongside the static archetypes. This bridges the gap between sample content and real community content.

### "Try it" CTA copy variants (A/B test candidates)
- "Try a sample team → see the report instantly" (current, action-first)
- "See what a report looks like →" (outcome-first, lower friction language)
- "Not sure what to paste? Try one of these →" (problem-aware framing)

Research suggests **problem-aware framing** converts better for users who land without intent (organic search, social share) because it meets them where they are.

---

## Secondary Findings

### WhatsNewModal new-user flow (`src/components/ui/WhatsNewModal.tsx`)
- Lines 111–119: `isNewUser` correctly detects first visit
- `WELCOME_FEATURES` (lines 10–31): good feature list but purely informational
- **Gap:** The "Get Started" CTA (`line 193`) dismisses the modal and returns to a blank textarea. A higher-converting CTA would be "Get Started with a sample team →" that dismisses AND fires `onAnalyze(SAMPLE_PASTE)`.
- This requires lifting `onAnalyze` into the modal or using a shared event bus. Medium effort but high impact for new-user first-session conversion.

### How it works cards (`PasteInput.tsx:346–366`)
- Mobile: shown for new users only, hidden for returning users behind a "How it works" toggle
- Issue: on small phones (375px), 3 cards + textarea means the input is below fold. Consider collapsing to a single "How it works ▾" row for ALL users on mobile (new and returning), and only expanding on tap. The "Try a sample team" button is the better primary onboarding CTA.

### Placeholder text (`PasteInput.tsx:401–403`)
Single Incineroar is better than nothing but undersells the format. Recommend changing to a 2-Pokémon snippet that shows the line break between mons:
```
Incineroar @ Assault Vest
...
- Parting Shot

Rillaboom @ Sitrus Berry
...
```
This immediately communicates "blank line between each Pokémon" — the most common paste format error.

---

## File Reference Summary

| File | Lines | Topic |
|------|-------|-------|
| `src/components/input/PasteInput.tsx` | 21–80 | `SAMPLE_PASTE` constant |
| `src/components/input/PasteInput.tsx` | 104–118 | `PopularCardSprite` — reuse for picker |
| `src/components/input/PasteInput.tsx` | 131–141 | `isReturningUser` detection via localStorage |
| `src/components/input/PasteInput.tsx` | 391–416 | Textarea + placeholder |
| `src/components/input/PasteInput.tsx` | 474–494 | "Try a sample team" button — replace with picker |
| `src/components/explore/ExploreEmpty.tsx` | 9, 35–44 | Empty state — extend props, add suggestions |
| `src/components/explore/ExploreContent.tsx` | 171–172 | `ExploreEmpty` call — pass `onClearSearch` |
| `src/components/ui/WhatsNewModal.tsx` | 111–119 | New user detection |
| `src/components/ui/WhatsNewModal.tsx` | 189–207 | CTAs — add sample team shortcut |
| `src/data/champions-sample-teams.ts` | 16+ | 3 sample teams — use in picker |
| `src/app/page.tsx` | 311–330 | `?sample=ID` loading mechanism |

---

## Effort Estimates

| Improvement | Effort | Impact | Priority |
|-------------|--------|--------|----------|
| Multi-sample picker (3 cards) | 2–3h | High | P0 |
| Contextual paste hint tooltip | 1–2h | High | P0 |
| Enriched ExploreEmpty | 1h | Medium-High | P1 |
| WhatsNewModal "sample team" CTA | 1h | Medium | P1 |
| Placeholder multi-mon snippet | 15min | Low-Medium | P2 |
| HowItWorks collapse on mobile | 1h | Medium | P2 |
