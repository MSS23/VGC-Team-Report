# Rejected / deferred — run 19-10-26

## Rejected at the build gate

**None.** Every change committed this run passed `tsc --noEmit --incremental false`,
the full `vitest` suite and `next build` before being committed. Nothing was
dropped for a failing gate.

## Deliberately NOT implemented, with reasons

These are judgement calls, not failures. The common thread: ten unmerged PRs
mean the cheapest way to destroy value tonight is to re-implement work that
already exists on a branch, or to edit a file five open PRs are holding.

| Item | Why not |
|---|---|
| **VGC-293** Compare page shows base-form ability for Megas | Its prescribed fix is "reuse `resolveEffectiveTyping` from `src/lib/utils/effective-typing.ts`" — that file **does not exist on main**, only on unmerged PR #81. Implementing it would mean re-creating #81's helper, guaranteeing a conflict. Blocked on #81 merging, not on effort. |
| **VGC-301** Pass regulation into `parseShowdownPaste` so `statForm` stops being inferred | `grep -rn "statForm" src/` returns **nothing** on main. The field it builds on exists only on an unmerged branch. The ticket's premise is false against main — amend before implementing. |
| **VGC-303 win 1** `/compare` lazy-load (70.3 KB gz, the larger half) | `src/components/compare/CompareContent.tsx` is modified by **5 of the 10 open PRs**. The ticket calls the file "low churn", which is true of main's history but false of the open queue. Win 3 was shipped instead; win 1 should land after the queue drains. |
| **VGC-300** axios / sharp / undici / joi highs | The security audit found the ticket **materially overstated**: `axios` and `joi` are `dev=true` (via `wait-on` ← `start-server-and-test`), and `sharp`/`undici` are in the prod tree but unreachable (zero `next/image` usages; `cheerio` imports only `load`, never `fromURL`). The only advisory worth acting on was `next`, which was done. Ticket amended rather than implemented. |
| **VGC-292** Three components compute Champions stats with the EV formula | Confirmed **live on main** (`analyze-team.ts:21` → Dragapult shows 182 vs 213 Speed). But the ticket is already **In Review**, i.e. a fix exists on an unmerged branch. Re-fixing it is exactly the waste VGC-265 describes. Merge the branch. |
| **a11y F-1: the `dark:` Tailwind variant is not wired to the dark-mode toggle** | A genuine one-line bug — `globals.css` declares `@custom-variant` for `creator` and `presenting` but not `dark`, while the toggle flips `data-dark-mode`, so all **132** `dark:` utilities follow the OS preference instead of the app. The fix is one line; its blast radius is 132 utilities changing appearance at once, and there is no browser in this container to verify the result. That belongs in front of a human with eyes on it, not landed unreviewed overnight. Filed at High instead. |
| **Type-badge and button contrast failures** (9 of 19 badges below 4.5:1; primary buttons 2.69:1 in dark mode) | Real and measured, but they are a **design decision about brand hues**, not a mechanical fix — and they are downstream of F-1 above. VGC-297 already exists for the light-mode half and says a design call is needed. |
| **Rotating the leaked Discord webhook token** | Cannot be done from here, and must not be: the token is in **git history of a public repo**, and removing it would require rewriting pushed history, which is forbidden. Rotation is a 5-minute action in Discord's UI. Surfaced as P0 everywhere. |
| **Linear webhook** | No code fix exists to make. The handler passes every audit check; the webhook is simply `enabled: false` in Linear's own settings (confirmed live via the Linear API this run). Re-enabling is a human click. VGC-213/222 already track it. |
| **Running `vgc195-db-repair.sql` / adding the `shares.created_at` index to the live DB** | No database access from this container, and production writes are never performed from a swarm run. VGC-302 shipped the migration file for a human to apply. |
