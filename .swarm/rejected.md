# Rejected / Deferred Changes — 2026-06-05

## Rejected at build gate
None — all 8 Wave 2 implementation agents reported `verified_passing: true` and
the central `npm run build` after integration passed cleanly.

## Deferred (intentional — not failed)

- **R6 #2 (add explicit H1 to /, /explore, /champions):** deferred because
  `src/app/page.tsx` is in `.swarm/main-changed-files.md` (high churn) and the
  change requires deciding sr-only vs visible H1, which is a UX call. Filed
  as Backlog item.
- **R8 QW2 (codemod text-[9-10px] → text-[11px]):** deferred because
  ShareModal.tsx and page.tsx are both in main-changed-files. Filed as
  Backlog item.
- **R5 #2 (thumb-zone toast on copy):** deferred for ShareModal conflict
  risk. Filed as Backlog item.
- **C3 (lazy-load moves.ts + pokemon.ts):** deferred because the codemod
  is non-trivial (~2h) and warrants careful testing. Filed as Backlog item.
- **C2 risky-but-worth-it items (i18n Proxy cast, dex-subset JSON cast,
  enable noUncheckedIndexedAccess):** deferred — would propagate type
  changes through many callers; not a 4-hour scope. Filed as Backlog item.

## Conflict warnings
- W6 (layout.tsx), W7 (PageNavbar.tsx + Toggle.tsx) all touched files in
  main-changed-files.md. Confirmed clean rebase before commit (branch was
  cut fresh from main and main did not move during run).
