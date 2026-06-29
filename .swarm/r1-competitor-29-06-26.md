# R1 Competitor Gap — 2026-06-29

**Scope:** ONE shippable-tonight (~2-3 hr) feature gap vs Pikalytics or PokePaste, NEW since the 20-05-26 teardown.
**Constraint:** Pikalytics + PokePaste both 403 to WebFetch from this env — analysis triangulates against changelog + repo state + prior teardown notes (`.swarm/r1-r2-competitor-teardown-20-05-26.md`).

---

## Problem statement (1 line)

Viewers of a public `/s/[id]` report cannot grab the team's Showdown paste in one click — they have to open the Share modal first — so we leak the "copy → import to Showdown" workflow back to PokePaste even though we already store the paste.

## Why now (not in the May teardown)

The May audit named "Zero-Friction Entry" (Gap 2) as a top-3 lever and proposed a guest paste-in flow (medium-large). That's still backlogged. **This is the symmetrical micro-gap on the read-side** — and it's the one PokePaste actually wins today.

Looking at the report viewer (`/s/[id]` → `TeamOverview` read-only branch), the only "take this team with you" surfaces are:

- The end-of-report `TeamCardCTA` (PNG poster, not a paste).
- `Share` → modal → "Copy Paste" button (Showdown text) — hidden behind a chrome step. `ShareModal` source: `showdownPaste` is passed in but the button only renders inside the modal (`ShareModal.tsx:583-609`).
- Builder-only "Create PokéPaste OTS/CTS" buttons (`app/page.tsx:432-463`) — not shown to viewers.

PokePaste's entire UX is "land on URL → copy → done." Pikalytics' team builder has an inline "Export Showdown" affordance on every team card. We have all the data and helpers; we just don't expose them on the viewer.

## Proposed feature: "Take this team" inline bar on the report viewer

A small, accessible action group rendered on the team overview (read-only path only), surfaced above-the-fold near the team sprite grid:

1. **Copy as Showdown paste** — calls `teamToShowdown(parsed)` (`src/lib/utils/export-paste.ts:77`), writes to clipboard, toast/inline "Copied" confirmation. Owners already have this in `ShareModal`; the move is to also surface it inline for viewers.
2. **Open in PokéPaste** — calls existing `createPokePaste()` (proxied via `/api/pokepaste`, see `src/lib/utils/pokepaste.ts` and `src/app/page.tsx:443-453`), opens result in new tab. CTS by default; an optional "Open Team Sheet" mini-toggle for tournament prep.
3. **Open Team Sheet** (existing) — keep current OTS button but co-locate it here for discoverability rather than burying it.

Acceptance:
- Renders only when `isReadOnly === true` and the report is public/unlisted (gate behind the same visibility check we already use; no leak for private-mode viewers who somehow rendered).
- Both buttons fire PostHog `team_paste_copied` / `team_pokepaste_opened` so we can measure the lift.
- i18n strings added to all 8 locales (mirror `shareModalCopyPaste` / `shareModalPasteCopied` keys already present in `src/lib/i18n/translations/*.ts`).
- WCAG 44×44 touch targets; copy-feedback within 100ms (already the modal pattern).

## Files to touch

| File | Change |
|---|---|
| `src/components/report/TeamOverview.tsx` | Add inline `<TakeTeamBar />` in the `isReadOnly` branch, just above or below the Pokémon grid. Pass `parsedPokemon`, `shareId`, `teamName`, `tournamentName`, `creatorName`. |
| `src/components/report/TakeTeamBar.tsx` *(new, ~120 lines)* | New component: Copy-Showdown button + Open-in-PokéPaste button. Reuses `teamToShowdown` (`src/lib/utils/export-paste.ts`) and `createPokePaste` (`src/lib/utils/pokepaste.ts`). |
| `src/lib/i18n/translations/en.ts` (+ es/fr/it/ja/ko/zh/de if present) | Add `takeTeamCopyPaste`, `takeTeamCopied`, `takeTeamOpenPokepaste`, `takeTeamOpening`, `takeTeamFailed`. |
| `src/components/providers/PostHogProvider` consumers | No file change — just emit the two new event names from `TakeTeamBar`. |

No DB, no API route, no auth changes. All wiring already exists.

## Effort estimate

~2-2.5 hr including i18n + the keep-it-simple PNG-less PostHog events.
- Component scaffolding + state: 45 min
- Hooking into existing helpers + clipboard + toast: 30 min
- i18n keys across 8 locales: 30 min
- Manual verify on `/s/[id]` (owner view + viewer view + private fallback): 20 min
- `npx tsc --noEmit && npm run build` gate: 15 min

## Conflict-risk check vs `.swarm/main-changed-files.md`

`src/components/report/TeamOverview.tsx` IS in the changed-files list. Risk is moderate — the file is being edited elsewhere in the swarm. Mitigations:

- Keep edits surgical: add the `<TakeTeamBar />` import + a single render line inside the `isReadOnly` branch near the Pokémon grid. No restructuring.
- Create the new component as its own file (`TakeTeamBar.tsx`) so a merge collision in `TeamOverview.tsx` is a one-line resolve.
- Skip the placement near the tournament header (where other swarm work appears to land per the file list) — render below the Pokémon grid where the diff surface is calmer.

`src/lib/utils/export-paste.ts` and `src/lib/utils/pokepaste.ts` are NOT in the changed-files list — safe to depend on as-is.

## Why this beats the obvious alternatives

- **Adding analytics/lead-pair stats à la Pikalytics:** correct long-term, blocked on a usage-data pipeline we don't have. Multi-week, not multi-hour.
- **Embedded damage calc à la Pikalytics Meta Calcs:** the marquee Pikalytics differentiator named in the May teardown — but explicitly "medium" effort there and gated on a Champions-aware calc fork. Not tonight.
- **Match Tracker premium:** `src/components/match-tracker/` already exists (the May teardown's Idea 3 partially shipped). Not new.
- **OTS QR / rental QR:** already shipped (`src/components/ui/OTSSheetModal.tsx:88-98`, `TeamOverview.tsx:376-384`).
- **Anonymous quick-share:** Gap 2 from May. Bigger than 2-3 hr — needs guest session + render-without-auth + post-share auth gate.

## One sentence to the user

"PokePaste's whole product is 'land on URL → copy paste → import to Showdown'; we host that paste already but bury it behind the Share modal — surface a Copy-Showdown + Open-in-PokéPaste pair directly on the report viewer in ~2 hr."
