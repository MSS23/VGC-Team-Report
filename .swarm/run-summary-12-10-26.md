# Nightly swarm run summary — 12 Oct 2026

Branch `claude/loving-sagan-7q3dvw` · 10 commits · one draft PR → `main`

## Shipped (7 Linear tickets + 2 unticketed)

| Ticket | P | What landed |
|---|---|---|
| VGC-288 | P1 | Account deletion purges every satellite row; one shared `purgeSatellites` so `/api/cleanup` and `/api/user/delete` cannot drift. Plus the user's own `match_logs`. **Needs one DB run before merge.** |
| VGC-291 | P2 | Explicit `statForm: "ev" \| "sp"` on `ParsedPokemon`; four copies of the magnitude heuristic collapsed onto one; the 32 SP per-stat cap error is reachable for the first time |
| VGC-292 | P2 | `TeamStats` / `TournamentMode` / `MatchupPlanSlide` compute Champions stats with the SP formula — Dragapult no longer reads 182 Speed in one panel and 213 in another |
| VGC-295 | P3 | Explore keyset cursor describes its boundary row at microsecond precision; no more skipped/duplicated rows at page edges. **EXPLAIN not run — see commit.** |
| VGC-296 | P3 | 38.0 KB gz of motion runtime off 72 SSG champions pages, `/dashboard` and `/explore` |
| VGC-297 | P3 | Root `MotionConfig reducedMotion="user"`, plus SpeedTierChart/icons/PasteInput/Navbar/coverage-chart WCAG fixes |
| VGC-298 | P3 | `/faq` HowTo steps rendered (no more hidden structured data); both `llms*.txt` refreshed; drift guard extended to both files |
| VGC-299 | P4 | Both halves: webhook `catch` now logs before its 200, and the detect-archetype mixed-scale bug (fixed via VGC-291) |
| — | P0 | **Next.js 16.3.0 → 16.3.8**: three critical RCEs, one high SSRF, four moderates. Found by this run's own audit, not on the board. |

Tests: **501 → 572** (+71). Cold tsc clean, build passing.

## Beyond the ticket text

Four places where a ticket's own prescription was wrong or incomplete, and the
run corrected rather than followed it:

1. **VGC-298 asked for a wrong number.** It wanted the SP ladder pinned at
   "32 SP = 252 EVs". `evToChampionsSp` short-circuits at `ev >= 248`, so
   `championsSpToEv(32) === 248` and 248–252 EVs all map to 32 SP. The existing
   "248+" wording was already right. The drift guard now asserts the figure is
   **not** `8*32-4`, so nobody "fixes" it to 252.
2. **VGC-292 would have been inert.** `MatchupPlanSlide` had no `regulation`
   prop, so the SP fix could never fire. Threaded from both call sites.
3. **VGC-288 would have been partial.** The shared sequence only nulls
   `match_logs.share_id`; the deleting user's own match history survived. Added
   the `user_id` delete — that was the GDPR gap the ticket named.
4. **VGC-296 introduced a regression.** De-motioning `ReportCard` silently
   killed `/explore`'s card cascade, because motion variants only reach motion
   children. Moved that grid to the CSS utility, which also took motion off
   `/explore` entirely.

## Not done, and why

- **VGC-289 (Reg M-C unsupported) is already fixed on `main`** — `b71707a`, with
  the Mega list verified against Victory Road. Commented; a human closes it.
- **VGC-290** is titled "[Ruling needed]" and a contradiction surfaced tonight
  that sharpens it: `champions-legality.ts` enforces max 2 restricted Pokémon
  while `/faq` says restricted legendaries are banned in M-C. Needs a ruling,
  then one consistent statement in the checker, the FAQ and both `llms*.txt`.
- **Linear webhook**: handler code is healthy on `main` (full checklist in
  `webhook-investigation-12-10-26.md`). What is left is two human steps already
  tracked by VGC-213/222/236. No Vercel access this run to confirm the env var.
- **PostHog**: no credentials in the container (VGC-220, fourth run running
  blind). Zero `posthog-signal` tickets filed — no data, not no problems.
- **No new drafts written.** `.swarm/drafts/` already holds 40 un-actioned files;
  a 41st would be the same waste as a 59th `auto-research` ticket.

## The thing worth a human hour

**44 tickets sit In Review. 0 are In Progress. 9 draft swarm PRs are open, the
oldest since 3 August.** This run makes it 10.

VGC-265 called this on 10 Aug, when it was 10 In Review and ~30 branches. It has
got worse. Evidence it is costing real work: VGC-293's prescribed fix told tonight's
agent to reuse `resolveEffectiveTyping` from `src/lib/utils/effective-typing.ts` —
**that file does not exist on `main`**, only on unmerged PR #81. The constraint on
this project is merge throughput, not implementation capacity.
