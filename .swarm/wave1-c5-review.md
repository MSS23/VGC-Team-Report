# Wave-1 C5 Commit Review (2026-06-07)

Scope: `8eb39cc` (most recent and largest) plus skim of the prior four commits (`1a30839`, `1d6c3de`, `484fa50`, `709ca2d`). Read-only.

8 highest-confidence findings, ranked by risk.

---

## 1. "Team" tab incorrectly disabled when only the first Pokémon is hidden

- **File / line / commit:** `/home/user/VGC-Team-Report/src/components/report/SlideNavControls.tsx:82-83, 101` (commit `8eb39cc`)
- **What looks off:**
  ```
  const poke = allSlideKeys.findIndex(
    (k, i) => i > 0 && !COVERAGE_KEYS.includes(k) && !k.startsWith("matchup-"),
  );
  ...
  const teamAvail = firstPokemonPhys >= 0 && visibleIndices.indexOf(firstPokemonPhys) >= 0;
  ```
  `firstPokemonPhys` is fixed to the *first* species key in the canonical layout (always physical index 1). If that one Pokémon slide is hidden by the creator (`isSlideHiddenAt`), `visibleIndices.indexOf(firstPokemonPhys)` returns `-1`, so `teamAvail` becomes `false` — even though pokemon #2…#6 and the coverage slides (speed-tiers, offensive-coverage, defensive-coverage) are all still visible and *are* in the Team section per `sectionOf`. The Team tab grays out (`opacity-40 pointer-events-none`) and the viewer cannot jump there. This directly contradicts the commit message's own claim that "Section jumps are key-based … so they survive slide reordering and skip hidden sections."
- **Concrete fix:** compute the section's *first visible physical index* instead of the first canonical one. E.g.
  ```ts
  const teamTarget = visibleIndices.find(
    (p) => p > 0 && !allSlideKeys[p]?.startsWith("matchup-") && sectionOf(p) === "team"
  ) ?? -1;
  ```
  Apply the same pattern to `overviewPhys` and `firstMatchupPhys` for symmetry; an `overview` slide hidden by the creator currently disables the Overview tab even when section logic still places index 0 there.
- **Risk if shipped as-is:** shared/`/s/` viewers of any team where the creator hid Pokémon #1 (or any single first-of-section slide) can't tap "Team" / "Overview" / "Matchups" — the headline feature of this redesign silently fails on real teams. No console error; user just sees a dead tab.

---

## 2. Dead code: `DisplayTogglePill` + `useGlobalDisplayPrefs` no longer used

- **File / line / commit:** `/home/user/VGC-Team-Report/src/components/display/DisplayTogglePill.tsx`, `/home/user/VGC-Team-Report/src/lib/hooks/useGlobalDisplayPrefs.ts` (commit `8eb39cc`)
- **What looks off:** the commit removes the only render site of `<DisplayTogglePill>` from `src/app/page.tsx` and folds the Mega toggle into `SlideNavControls`'s overflow sheet. `Grep DisplayTogglePill` returns only the component file itself; `Grep useGlobalDisplayPrefs` returns only its own definition. Both files (≈260 + ≈45 lines) are now zero-import dead code. `hasMegaOverrides` is still computed inside `useHomePage.ts` (lines 134–137, 790) and exported, but the only consumer (`DisplayTogglePill`'s "per-card overrides active" caption) is gone.
- **Concrete fix:** delete `src/components/display/DisplayTogglePill.tsx`, `src/lib/hooks/useGlobalDisplayPrefs.ts`, and the `hasMegaOverrides` computation/export in `useHomePage.ts`. Either (a) port the "per-card overrides active · tapping above resets all" caption into the new overflow sheet and keep `hasMegaOverrides`, or (b) drop it for now and let the per-card display rule speak for itself. Pick (a) if you care about the UX hint — the redesign currently has a small UX regression here.
- **Risk if shipped as-is:** ~300 lines of dead UI + a localStorage hook (`vgc-display-pill-seen`) still write/read on every report load, bloating client bundle. Matches the recurring "dead code" entries in `src/app/changelog/data.ts` (5.18 parsePikalyticsUrl/evsToSp, 5.20 useScrollHide+axios, 5.22 ReactionBar) — exactly the pattern previously flagged. UX regression: the overrides caption was a deliberate trust signal and is silently gone.

---

## 3. Inconsistent `--bottom-nav-height` fallback (3rem vs 3.5rem)

- **File / line / commit:** `/home/user/VGC-Team-Report/src/components/display/DisplayTogglePill.tsx:143-144` (commit `8eb39cc` changed the value elsewhere but did not touch this file)
- **What looks off:** the commit bumps the bar height to `3.5rem` everywhere — `globals.css:12`, `globals.css:156`, `page.tsx:1120` (`var(--bottom-nav-height,3.5rem)`), and `SlideNavControls.tsx:422`. But `DisplayTogglePill.tsx:143-144` still uses `var(--bottom-nav-height, 3rem)` as the fallback. Two consequences: (a) if the CSS var ever fails to load, the pill sits 0.5rem too low, overlapping the new taller bar; (b) it's a "find the inconsistency" trap for the next reader.
- **Concrete fix:** either bump the two `3rem` strings in `DisplayTogglePill.tsx` to `3.5rem`, or — since finding 2 covers it — delete the file entirely.
- **Risk if shipped as-is:** low while the component is unmounted, but it's a stale magic number waiting to bite when someone re-mounts the pill or copy-pastes the calc into a new floating dock. Same class of cross-component drift seen in the prior `--nav-height` history.

---

## 4. Mega toggle drops the "auto" (null) tri-state

- **File / line / commit:** `/home/user/VGC-Team-Report/src/app/page.tsx:1508-1514` and `SlideNavControls.tsx:132-136, 462-491` (commit `8eb39cc`)
- **What looks off:** the new wire is
  ```tsx
  mode: (globalMegaDefault ?? true) ? "mega" : "base",
  onChange: (m) => setGlobalMegaDefaultAndReset(m === "mega"),
  ```
  `globalMegaDefault` is `boolean | null` (null = "auto, detect from item"). The new overflow sheet has only Base/Mega radio buttons — no way back to `null`. So the *first* tap on either Base or Mega permanently destroys the "auto" state for the team and writes a hard boolean. Previously `DisplayTogglePill`'s aria-checked logic still ran against `globalMegaDefault ?? true`, but users at least never had auto silently overwritten until they made a choice. Now any tap, even one that "agrees" with the current visual (Mega tapped while already Mega), overwrites `null` → `true`. Persistence side-effect.
- **Concrete fix:** either (a) when the user taps the currently-active radio, no-op (`if ((globalMegaDefault ?? true) === (m === "mega")) return;`), or (b) keep "auto" reachable — add a third "Auto" pill, or surface it implicitly by detecting that all per-card megas match the item-detect default. Document whichever you pick in the comment block above `displayToggle=`.
- **Risk if shipped as-is:** "auto" state is unreachable from the UI after the first tap on any team. The setting is per-team-localStorage, so users who liked the auto-detect heuristic (`detectMegaFromItem` in `page.tsx:48` import) now have it overridden the first time they open the new overflow sheet on any device.

---

## 5. Mobile overflow sheet is missing dialog semantics (focus trap, `aria-modal`, inert backdrop)

- **File / line / commit:** `/home/user/VGC-Team-Report/src/components/report/SlideNavControls.tsx:411-425` (commit `8eb39cc`)
- **What looks off:** the sheet renders `role="dialog" aria-label="Slide options"` with a `bg-black/30` backdrop on mobile, but: (a) no `aria-modal="true"` — assistive tech doesn't know to ignore the rest of the page; (b) focus is never moved into the sheet on open, and never restored to the overflow trigger on close; (c) tab focus can escape into the now-visually-overlaid report content below. The 5.22 changelog explicitly lists this exact fix for OTSSheetModal: "role='dialog', aria-modal, aria-labelledby, focus trap, Escape-to-close, and focus-restore-on-close." This commit ships a new dialog without that hardening even though Escape-to-close is already wired (line 148-152).
- **Concrete fix:** on open, store `document.activeElement`, focus the first interactive control in `overflowBody`, set `aria-modal="true"`, and on close restore focus to the overflow trigger ref. Reuse the focus-trap util pattern from OTSSheetModal so the codebase stays consistent.
- **Risk if shipped as-is:** WCAG 2.4.3 / 2.1.2 regression — screen reader and keyboard users open the sheet and find their focus still in the report behind it. Re-introduces the bug class the 5.22 entry just claimed to have closed.

---

## 6. Sheet auto-close effect depends on `showOverflow`, which changes during a tap → race

- **File / line / commit:** `/home/user/VGC-Team-Report/src/components/report/SlideNavControls.tsx:157-159` (commit `8eb39cc`)
- **What looks off:**
  ```tsx
  useEffect(() => {
    if (sheetOpen && !showOverflow) setSheetOpen(false);
  }, [sheetOpen, showOverflow]);
  ```
  Reasonable, but `showOverflow = hasCreatorTools || hasDisplay || (hasShortcuts on desktop only)` flips to false the instant the parent drops `onToggleHide` (creator mode exit) — which can happen during a click *inside* the sheet that toggles creator mode via the keyboard shortcut. The `useEffect` then closes the sheet on the same render the click handler tried to navigate. Practical effect: rapid creator-toggle clicks can close the sheet before the click on the inner control registers. The comment claims this is intentional but the dep array does not include the original trigger, so it can fire on unrelated parent re-renders too.
- **Concrete fix:** either guard with a frame delay (`requestAnimationFrame`) or make the rule "close if no panels render" by counting visible sections inside the rendered body instead of duplicating availability flags. A simpler fix: collapse `hasSheetMobile`/`hasSheetDesktop`/`showOverflow` into a single derived `sheetHasContent` boolean computed inside `overflowBody`.
- **Risk if shipped as-is:** minor — manifests only when creator-toggle keyboard shortcut fires while the sheet is open; users will see the sheet flicker closed without their action taking effect. Hard to repro but annoying when it hits.

---

## 7. Magic numbers and inline z-index / dimension literals not lifted to constants

- **File / line / commit:** `/home/user/VGC-Team-Report/src/components/report/SlideNavControls.tsx:411 (z-[55]), 414 (z-[60]), 422 (sm:w-72, bottom-[calc(var(--bottom-nav-height,3.5rem)+0.75rem)])`, plus `SwipeHint.tsx` `bottom-24` swap from `bottom-20` (commit `8eb39cc`)
- **What looks off:** the redesign hardcodes a stack of z-indices and offsets that need to stay coordinated with the rest of the app: `z-50` (navbar itself), `z-[55]` (backdrop), `z-[60]` (sheet), plus a magic `bottom-24` in `SwipeHint.tsx` that has to track the nav's actual height (`3.5rem + safe-area`). The codebase already has z-layer comments scattered around (e.g. DisplayTogglePill uses `z-[39]` and `z-40`); the new values were picked ad hoc. The `bottom-24` (6rem) doesn't even match the new `--bottom-nav-height` math — should be derived from the CSS var like `bottom-[calc(var(--bottom-nav-height,3.5rem)+1rem)]`.
- **Concrete fix:** define a tiny `LAYER` constant block at the top of the file (`LAYER_NAV = 50`, `LAYER_SHEET_BACKDROP = 55`, `LAYER_SHEET = 60`) and use them. Switch `SwipeHint` `bottom-24` to `bottom-[calc(var(--bottom-nav-height,3.5rem)+1rem)]` so it tracks the nav automatically — the commit message even says "nudge SwipeHint above the taller bar," which is exactly the case where a derived value beats a hard literal.
- **Risk if shipped as-is:** the next nav-height change will silently put SwipeHint on top of (or under) the bar again, exactly the regression this commit is fixing. Low-confidence but high-value cleanup.

---

## 8. No tests added or updated for any of the changed slide-navigation logic

- **File / line / commit:** entire commit `8eb39cc`, especially `SlideNavControls.tsx` and `useHomePage.ts` (commit `8eb39cc`)
- **What looks off:** glob for `**/SlideNavControls.test.*` returns zero. Glob for `**/*.test.*` shows tests exist for many modules (`useExploreUrlSync`, `cron-auth`, `rate-limit`, `showdown-parser`, `redact-paste`, `url-codec`, etc.) but nothing under `src/components/report` or for the slide system. The new `SlideNavControls` adds non-trivial logic — `firstPokemonPhys`/`sectionOf`/`sectionPos` math, key-based section availability, `secTotal <= 1` progress-fill edge case — and none of it is covered. The same is true of `useSlideSystem` (which provides `allSlideKeys` / `visibleIndices`). Project does have tests for similarly-sized pure logic modules.
- **Concrete fix:** add `src/components/report/__tests__/SlideNavControls-sections.test.ts` covering pure section math (extract `sectionOf` / `findSectionTargets` to a sibling module first), with cases: (a) all-visible team, expect `(overview/team/matchups)` available; (b) first pokemon hidden → Team tab must still be available, jumping to the first *visible* species (this is finding #1's test); (c) no plans, only `matchup-sheet` → matchup target resolves to the sheet; (d) creator-mode `visibleIndices = all` → unchanged behavior. These are pure-function tests, no DOM needed.
- **Risk if shipped as-is:** the bug in finding #1 would have failed an obvious 5-line test. Future refactors of section logic (and the codebase keeps reordering slides per the commit msg) are one-shot rewrites with no safety net.

---

## Summary (200 words)

The 8eb39cc redesign is mostly clean: it removes the cluttered scrub-bar and the floating Display pill in favor of a segmented section nav with an overflow sheet — UX is consistent with the project's "no floating docks" rule and the keyboard-nav path moved cleanly to `useSlideNavigation`. CSS-var work (`--bottom-nav-height: 3.5rem`) is coherent inside this commit. PWA cache bump is correct.

But the redesign undermines its own headline claim of "section jumps survive reordering and skip hidden sections": `firstPokemonPhys` is the canonical first species, not the first *visible* one (finding #1) — a hidden lead Pokémon disables the entire Team tab. The Mega toggle silently destroys the `null`-auto tri-state on the first tap (#4). The new sheet ships as `role="dialog"` without `aria-modal` / focus trap / focus restore (#5), which is the exact hardening the 5.22 changelog just bragged about. The old `DisplayTogglePill` + `useGlobalDisplayPrefs` are now dead code (#2), and one stale `3rem` fallback inside that dead file is the only inconsistent magic number left (#3). No tests were added (#8). Findings #6, #7 are quality polish.

Recommend fixing #1, #4, #5 before any push.
