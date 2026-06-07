# Wave 1 Research Synthesis — 2026-06-07

## Wave 1 subagents

- C1 dead code, C2 typescript, C4 security, C5 recent-commit review, R8 accessibility.
- Five dispatched in parallel, all completed successfully.
- No research subagents (R1–R7) dispatched: this run is constrained (no Linear API, no PostHog credentials, no Discord webhook). Budget redirected to code-quality + a11y, where findings are immediately actionable inline.

## Top 5 highest-leverage opportunities surfaced

1. **Bottom-nav redesign has a real "Team tab disabled" bug.** `firstPokemonPhys` is keyed off the canonical first species, so hiding the lead Pokémon kills the entire Team tab. — Fixed this run (commit 1793e0b).
2. **Bottom-nav overflow sheet ships without dialog hardening.** No `aria-modal`, no focus trap, no focus restore — re-introduces the bug class v5.22 just claimed to close. — Fixed this run (commit 1793e0b).
3. **Mega toggle silently destroys auto-state on agreement taps.** First tap on the currently-active mode overwrites `globalMegaDefault: null` with a hard boolean. — Fixed this run (commit 1793e0b).
4. **Delete-account confirmation modal is the most dangerous modal and the least accessible.** No `role="dialog"`, no `aria-modal`, no focus management, placeholder-only input. — Fixed this run (commit 65af8b7).
5. **DisplayTogglePill + useGlobalDisplayPrefs are orphan dead code.** 328 lines, no importers after the v5.22 nav fold-in. — Removed this run.

## Top 5 quick-win bugs/issues addressed

1. Linear webhook handler `catch {}` swallowed all errors silently → now `console.error` before returning 200.
2. `/api/explore` `q` length unbounded → capped at 100 chars to prevent ILIKE seq-scan amplification.
3. ExploreFilters clear-search button was 24×24, well under WCAG 2.5.5 → bumped to 44×44.
4. SwipeHint nudge used hardcoded `bottom-24` instead of `var(--bottom-nav-height)` → derived now.
5. Three modals (InlinePokemonEditor, VersionHistoryPanel, WalkthroughOverlay) had `role="dialog"` but no `aria-modal="true"` → swept in.

## Blockers

- **Linear API key absent** in this execution environment (no `.env.local`). All ticket triage, ticket updates, and ticket creation were skipped. The webhook handler in `src/app/api/webhooks/linear/route.ts` is healthy in code; the env-var config in Vercel still requires human verification (see prior run notes).
- **PostHog credentials absent** — no error / rage-click / drop-off data could be pulled. C5 review surfaced concrete bugs without needing PostHog data.
- **Discord webhook credentials absent** — Step 5 Discord notification falls back to `.swarm/discord-failed-07-06-26.md` per the standing fallback protocol.

## Conflict-risk files flagged

`.swarm/main-changed-files.md` was empty (this branch was cut fresh from `main` with zero divergence at run start). None of the files we touched overlapped with files changed on `main` in the past 7 days, so no conflict-risk warnings.

## Remaining a11y work for next runs

Not landed this run (out of scope for one night):

- R8 #2: `InstallPrompt.tsx` and `ShortcutHintOverlay.tsx` need full dialog semantics + focus management.
- R8 #5: ~10 freeform content textareas (PasteInput, TeamOverview, CalcInput, etc.) need `aria-label`.
- R8 #6: `Toggle.tsx` switch is 24×42; needs a 44×44 hitbox expansion.
- R8 #8: Heading hierarchy on Dashboard / Compare / Profile skips h2.
- R8 #9: Explore + Dashboard report grids use `<motion.div>` containers, should be `<ul>` / `<li>`.

All five are good candidates for the next swarm run's Wave 2 budget.
