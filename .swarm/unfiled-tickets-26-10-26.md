# Tickets that could NOT be filed — Linear workspace is at its free issue cap

## What happened

Four research tickets were filed successfully this run:

| Ticket | Title |
|---|---|
| **VGC-315** | [A11y] Dark mode primary CTA fails WCAG AA — bg-accent/text-white at 1.40–1.89:1 across 67 instances |
| **VGC-316** | [A11y] globals.css declares no @custom-variant dark — 132 Tailwind dark: utilities desync from the app theme |
| **VGC-317** | [SEO] Homepage and navbar server-render nothing, while the homepage emits FAQPage JSON-LD for content that isn't there |
| **VGC-318** | [SEO] /s/[id] is a client-redirect shell — ~5,000 sitemapped share URLs have no crawlable content |

The fifth and every subsequent `issueCreate` was rejected:

```
"message": "usage limit exceeded",
"code": "USAGE_LIMIT_EXCEEDED",
"userPresentableMessage": "You've exceeded the free issue limit for this
    workspace. Please upgrade or contact sales@linear.app for a free trial.",
"meta": { "usageMetric": "activeIssueCount" }
```

The team's `issueCount` is **275**, against the Linear free plan's **250** limit. This
is a plan cap, not a rate limit — a retry loop with exponential backoff was attempted
and correctly abandoned once the error body was read, because no amount of waiting
clears it.

## Why this matters beyond tonight

**This is the actual root cause of the symptom VGC-265 describes.** That ticket blames
"~30 unmerged nightly branches and 10 tickets stuck In Review" on process drift. The
mechanical reason the board cannot move is that it is *full*: nothing new can be
created, so every run's findings pile up as unfiled work.

**146 issues are already in a completed or canceled state.** In Linear, Done and
Canceled issues still count toward `activeIssueCount` until they are **archived** —
marking them Done is not enough. Archiving those 146 would free the cap immediately
and cost nothing.

A good first move: this run verified that **6 open bug tickets are already fixed on
main** (VGC-251, VGC-243, VGC-242, VGC-245, VGC-267, VGC-260) and that **2 more are
stale** (VGC-289, Reg M-C is fully shipped; VGC-300, all four advisories are gone).
Closing and archiving those 8, plus the existing 146, takes the board from 275 to
roughly 121.

## The 7 tickets that still need filing

Full, ready-to-paste bodies are in this repo under `.swarm/unfiled-ticket-bodies/`.
Each is the exact description that would have been posted.

| # | Priority | Label(s) | Title |
|---|---|---|---|
| 1 | High (2) | auto-research, Performance | [Perf] /compare ships dex-subset.json + pokemon.ts + mega-pokemon.ts to the client — 83 KB gzip from one file |
| 2 | High (2) | auto-research, Bug | [Bug] Match-up game W/L never saves — onResultChange is passed but ignored in MatchupPlanSlide |
| 3 | High (2) | auto-research, Bug | [Bug] Paste template picker does nothing — selectedTemplate/onTemplateSelect ignored in PasteInput |
| 4 | Medium (3) | auto-research, Performance, Infrastructure | [Perf] Move @pkmn/dex to devDependencies — 52 MB per Vercel install, only used by a build script |
| 5 | Medium (3) | auto-research, Accessibility | [A11y] SlideNavControls display dialog has no focus trap, no focus return, and no aria-modal |
| 6 | Medium (3) | auto-research, Infrastructure | [CI] eslint runs with continue-on-error over 35 existing errors — lint is not actually a gate |
| 7 | Medium (3) | auto-research, Infrastructure | [TS] Enable noUncheckedIndexedAccess for src/lib — 33 conflict-free errors, catches a real latent crash |

## Further tickets this run would have filed, had there been room

These are described in `.swarm/late-findings-26-10-26.md` and
`.swarm/research-synthesis-26-10-26.md` rather than as standalone bodies:

- **[Bug] Wrong-stone Mega match: Kangaskhan @ Gengarite resolves to Mega Gengar.**
  `detectMegaFromItemDex` (`src/lib/data/pkmn-dex-fallback.ts:217`) takes
  `Object.values(itemEntry.megaStone)[0]` without checking the stone belongs to the
  pasted species — wrong types, ability, stats and legality verdict. Found by the
  VGC-293 agent.
- **[A11y] `bg-danger text-white` toast drops to 2.77:1 in dark mode**
  (`HomePageClient.tsx:1775`), and `src/lib/accent-themes.ts:52-56` carries the same
  inline-shadowing bug the dark-accent fix removed from `random-accent.ts`.
- **[Security] `ShareableStateSchema` in `src/lib/sharing/url-codec.schemas.ts` is
  still unbounded** — it mirrors the `/api/share` shape that was bounded this run.
- **[Product] Should the Compare page have a Mega toggle?** It resolves Megas with no
  user control, so base-form numbers are unreachable. Raised twice now.
- **[Bug] `TournamentMode` toggle still says "EVs" in Champions**, and
  `MatchupPlanSlide` shows opponent investment as raw `+{ev}` with an "EVs invested"
  aria-label. Both need i18n copy, deliberately left out of VGC-292.
- **[Infra] Still no PostHog credentials in the swarm container** (VGC-220, 5th run)
  and still no Vercel access, so no run can ground its priorities in real user
  behaviour.

---
*Written by the overnight swarm, run 26-10-26, because Linear would not accept them.*
