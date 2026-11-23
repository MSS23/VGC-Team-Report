## Source

Found while implementing the i18n portion of **VGC-347** in the nightly swarm run of 23-11-26 (commit `74e8f3c`).

## The finding

VGC-347 deleted 27 i18n keys covering the type-coverage charts and the comment section as "orphaned". They *are* unreferenced, so deleting them was correct hygiene — but they are **not** a removed feature. Both panels are live UI that **hardcodes English**:

* `OffensiveCoverageChart.tsx` and `DefensiveCoverageChart.tsx` call `useTranslation()` but consume only `language` — never a translated string.
* `CommentSection.tsx` never calls `useTranslation()` at all. `:271` hardcodes `"No comments yet. Be the first!"`.

So those two panels render in English for **es, fr, it, ja, ko and zh**. That predates the deletion — but the clean-up removed the only remaining evidence of it, which is why it needs its own ticket rather than living in VGC-347's history.

Keys removed (for reference when re-adding): `offensiveTypeCoverage`, `defensiveTypeCoverage`, `offensiveCoverageDesc`, `defensiveCoverageDesc`, `gaps`, `noSeCoverage`, `thin`, `onlyOneAnswer`, `covered`, `twoPlusAnswers`, `vulnerable`, `threePlusWeak`, `exposed`, `twoWeak`, `manageable`, `oneWeak`, `resistant`, `noWeakness`, `reactions`, `comments`, `addComment`, `commentPlaceholder`, `displayNameLabel`, `anonymous`, `deleteComment`, `noComments`, `loadMoreComments`.

## Fix

Wire both components to `useTranslation()` and re-add the keys they need, translated. Japan is explicitly called out in VGC-120 as a major VGC audience, so `ja` matters most.

Worth pairing with VGC-122 (Japanese translation pass), which the swarm's triage found is **not** 600 missing strings — `ja.ts` carries every key, and the real gap is 50 empty-string stubs masked by English fallback.

## Related content bug, out of scope here

`src/hooks/useWalkthrough.ts:115` still tells users *"Set a passcode to let trusted people edit and re-share."* Passcode sharing was removed — 9 of VGC-347's deleted keys were its UI strings. That is stale copy, not dead code.
