# Backlog ticket that could NOT be filed — Linear free-tier limit reached

## ⚠️ The Linear workspace is at its issue cap and will accept no new tickets

During Step 6 of the 12-10-26 nightly run, `issueCreate` began returning:

```
USAGE_LIMIT_EXCEEDED — "You've exceeded the free issue limit for this
workspace. Please upgrade or contact sales@linear.app for a free trial."
  meta.usageMetric: activeIssueCount
```

State of the board at that moment — exactly **250** issues:

| State | Count |
|---|---|
| Done | 130 |
| Backlog | 64 |
| In Review | 49 |
| Canceled | 4 |
| Won't Do | 2 |
| Todo | 1 |
| **Total** | **250** |

**Four tickets were filed before the cap hit** (VGC-300, VGC-301, VGC-302, VGC-303).
The fifth, below, was rejected and is preserved here so the content is not lost.

### The cheap fix: archive the closed issues

**136 of the 250 are closed** (130 Done + 4 Canceled + 2 Won't Do) and are still
counting against the cap because they have never been archived. Archiving them in
Linear (Settings → or bulk-select → Archive) frees the capacity immediately, with
no upgrade and no data loss — archived issues stay searchable.

This is also a second-order symptom of VGC-265: 49 issues sit In Review because
the PRs are unmerged, so they can never be moved to Done and archived, which
means the queue consumes cap that would otherwise recycle.

---

# UNFILED TICKET — file this once there is capacity

**Title:** Four deferred follow-ups: VGC-293's missing helper, Stellar Tera, dead BreadcrumbJsonLd, EV/SP copy
**Priority:** 3 (Medium) · **Label:** Improvement · **State:** Backlog

## Source

Follow-ups from VGC-293, VGC-294 and VGC-298, all deferred by the 12-10-26 nightly swarm for the reasons below. Grouped to keep the board tidy; each is independent.

## 1. VGC-293's prescribed fix references a file that doesn't exist on `main`

VGC-293 (compare page shows the base-form ability for Mega Evolutions) says to *"reuse the new `resolveEffectiveTyping` from `src/lib/utils/effective-typing.ts`"*. **That file exists only on unmerged draft PR #81.** So either:

- merge PR #81 first, then VGC-293 is the small change it claims to be; or
- implement the ability resolution directly in `CompareContent.tsx` from the Mega data it already loads (it resolves Megas unconditionally at ~lines 151-162 and already uses the Mega typing; only the ability at ~line 191 is still `mon.parsed.ability`).

Flagging the dependency explicitly because it is a live instance of VGC-265: a ticket whose instructions are only valid against an unmerged branch.

`CompareContent.tsx` was also owned by the VGC-291 agent on 12-10-26, so VGC-293 was serialised out of that run on file-ownership grounds regardless.

## 2. `Tera Type: Stellar` (VGC-294) still drops silently

`src/lib/parser/showdown-parser.ts:112` returns `null` for `Stellar` because the `PokemonType` union has no `Stellar` member. Deferred because `src/lib/types/pokemon.ts` was owned by the VGC-291 agent that night.

Still needs the deliberate decision the ticket calls for: Stellar behaves unlike the 18 standard types defensively, so the type chart needs a considered answer rather than a row copied from the others. Touches the union, the type chart, `TypeBadge`, `type-colors` and the share schema.

## 3. Delete the zero-caller `BreadcrumbJsonLd` duplicate

`src/components/seo/JsonLd.tsx` has two near-identical breadcrumb components. VGC-298 moved the last caller (`src/app/creator/[name]/page.tsx`) onto `BreadcrumbListJsonLd`, so `BreadcrumbJsonLd` now has **zero callers in `src/`**. It was marked `@deprecated` rather than deleted, so the removal could be its own reviewable commit. That is this item: delete it and its JSDoc.

## 4. `MatchupPlanSlide` EV-vs-SP copy

VGC-292 fixed the computed numbers in `MatchupPlanSlide`, but its aria-labels and EV-view copy still say `"+N"` / `"N EVs invested"` for Champions spreads, where the values are SP. `TournamentMode`'s toggle is likewise still labelled "EVs". Cosmetic — no computed number is wrong — but it is the same EV/SP confusion the stat work has been unpicking all month.

---

*Filed by the nightly swarm, 12 Oct 2026.*
