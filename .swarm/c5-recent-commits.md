# C5 — Recent Commits Review

_Reviewed: last 20 commits on origin/main (8eb39cc back through 8021723). All
substantive commits inspected with `git show --stat`; commits with <5 file
deltas reviewed end-to-end. No TODO/FIXME/HACK/XXX markers found in any
.ts/.tsx/.js/.mjs source file (clean — that's the bar holding)._

---

## Concrete follow-ups (Wave 2 candidates)

- `8eb39cc` orphaned **DisplayTogglePill + useGlobalDisplayPrefs**.
  - `src/components/display/DisplayTogglePill.tsx` (entire file) and
    `src/lib/hooks/useGlobalDisplayPrefs.ts` (entire file) — both have **zero
    remaining importers** after the bottom-nav redesign removed the pill from
    `src/app/page.tsx` (the only consumer).
  - `grep` confirms: no `import.*DisplayTogglePill` matches anywhere in
    `src/`; `useGlobalDisplayPrefs` is only referenced by its own definition
    file. Together that's ~250 lines + a localStorage key
    (`vgc.display.pillSeen`) that will stay set on returning users' browsers
    forever.
  - **Suggested fix:** delete both files in the next Wave (high-confidence
    dead code; mirrors the pattern of 850e91c which deleted ShareDock +
    useTouchIdleHide when those overlays were removed). The deletion was
    *implied* by the 8eb39cc commit body ("Mega toggle now lives in the nav
    overflow") but the files were left behind.

- `8eb39cc` `src/components/report/SlideNavControls.tsx:78-89` — **section
  detection is fragile to slide insertions.**
  ```ts
  const poke = allSlideKeys.findIndex(
    (k, i) => i > 0 && !COVERAGE_KEYS.includes(k) && !k.startsWith("matchup-"),
  );
  ```
  This silently assumes the physical order
  `[overview, ...speciesKeys, speed-tiers, coverage, ...matchups, matchup-sheet]`
  defined in `useSlideSystem.ts:42`. Any future slide kind inserted between
  overview and species — or any new section key that isn't `matchup-*` or in
  `COVERAGE_KEYS` — will be misclassified as "Team" and the Team tab will
  jump to it. There is no console warning or fallback.
  - **Suggested fix:** define `SECTION_KEYS` explicitly on `useSlideSystem`
    (the source of truth for slide structure) and have SlideNavControls
    consume that mapping rather than re-deriving it via prefix sniffing.

- `8eb39cc` `src/components/report/SlideNavControls.tsx:96` — `(matchupsTab).target`
  resolves to `firstMatchupPhys` which is computed as the first key starting
  with `matchup-`. If only `matchup-sheet` exists (no individual plans), the
  tab jumps to the summary sheet — which is correct, but the comment claims
  this fallback intent (`// "matchup-sheet" also starts with "matchup-"...`)
  while the variable name `firstMatchupPhys` is misleading. Low-priority
  rename to `matchupsLandingPhys` for clarity.

- `1a30839` `src/app/api/webhooks/linear/route.ts:61,68-70` — `JSON.parse(rawBody)`
  inside the outer try, with the catch returning `{ ok: true }` (200). A
  malformed JSON body from a *valid HMAC sender* (i.e. Linear itself shipping
  a broken payload, or a body-content mismatch attack) will be silently
  swallowed with no log. The repair note in the commit body explicitly chose
  200 over 400 to prevent webhook auto-disable, but at minimum this should
  emit a `console.error` or a Sentry/PostHog tag so we don't lose visibility
  on legitimate failures. **Empty `catch {}` with no telemetry is a smell.**
  - **Suggested fix:** add `console.error("linear webhook handler error:", e)`
    inside the catch (the 19-05-26 swarm removed a similar one — bring it
    back in a non-payload-leaking form, e.g. `console.error(e?.message)`).

- `1a30839` orphan check passes for cleanup/migrate/setup (all wired through
  `verifyBearer`) and `src/lib/auth/verify-bearer.ts` has **zero unit tests**
  despite being a load-bearing security primitive used by 4+ admin routes.
  This is a Wave 2 candidate: a 15-line test file in
  `src/lib/auth/__tests__/verify-bearer.test.ts` covering: missing header,
  wrong scheme, empty env var, wrong-length string equality, correct match.

- `6981f23` shipped `src/lib/dynamic-imports/html2canvas.ts` — module-scope
  mutable `let html2canvasPromise` (singleton pattern). This is correct for
  bundling but is **not safe under fast refresh / HMR** during dev — the
  promise survives module reload and can race with the new module instance.
  Low-priority; only matters for dev ergonomics. Leave as-is unless a
  hot-reload bug surfaces.

## TODO/FIXME left in code

- **None.** `grep -E "TODO|FIXME|HACK|XXX"` across all `.ts/.tsx/.js/.mjs`
  files returned zero matches. The discipline of swarm runs cleaning these
  up nightly is holding.

## Unfinished or rushed changes

- `8eb39cc` DisplayTogglePill + useGlobalDisplayPrefs orphaned (covered
  above).
- `1a30839` merge commit body states: _"Items intentionally skipped (main
  already implements them, often via the shared verify-bearer helper):
  inline timing-safe comparisons in migrate/setup, GraphQL parameterization
  in weekly-report."_ Confirmed correct against current main — not a
  follow-up.
- `52437b8` (newsletter removal) notes: _"the Neon `newsletter_subscribers`
  table (if it exists) is not dropped here — run the DROP manually in the
  Neon SQL editor when ready."_ Still pending if the table exists. Should
  become a Linear ticket: "Drop newsletter_subscribers table in Neon if
  present" (zero-risk DROP IF EXISTS).
- `.env.example` is **missing 7+ env vars that the codebase reads**:
  `LINEAR_WEBHOOK_SIGNING_SECRET`, `CLERK_WEBHOOK_SIGNING_SECRET`,
  `POSTHOG_WEBHOOK_SECRET`, `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`,
  `MIGRATE_SECRET`, `RESEND_FROM_EMAIL`, `DISCORD_BOT_TOKEN`,
  `DISCORD_FEEDBACK_CHANNEL_ID`, `SUMMARY_EMAIL`, `NEXT_PUBLIC_APP_URL`,
  `NEXT_PUBLIC_CLARITY_ID`, `NEXT_PUBLIC_INTERNAL_USER_IDS`,
  `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
  `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`. New
  contributor onboarding (the `/onboard` command's deliverable) will
  silently produce a broken local dev unless these are added.

## Backlog ticket candidates

- **CHORE-1:** Delete orphaned `DisplayTogglePill.tsx` +
  `useGlobalDisplayPrefs.ts` (no consumers post-8eb39cc).
- **CHORE-2:** Refactor SlideNavControls section-detection: expose
  `sectionOfKey()` from `useSlideSystem.ts` instead of re-deriving via
  prefix sniffing in the nav component (fragile to future slide additions).
- **SECURITY-1:** Add unit tests for `src/lib/auth/verify-bearer.ts`
  (timing-safe, missing-env, wrong-length, valid-match, no-header) — this
  primitive guards `/api/cleanup`, `/api/migrate`, `/api/setup`, `/api/bot`.
- **OBSERVABILITY-1:** Restore minimal error logging in
  `src/app/api/webhooks/linear/route.ts:68-70` catch block (current empty
  `catch { return 200 }` blinds us to legitimate handler bugs).
- **DOCS-1:** Backfill `.env.example` with the ~17 env vars currently
  referenced by `src/` but undocumented. Group by integration (Linear,
  Clerk, PostHog, Resend, Discord, Upstash, AppUrl/PWA).
- **CHORE-3:** Run `localStorage.removeItem("vgc.display.pillSeen")` once on
  app load for one release cycle, then remove — cleans up the orphaned key
  set by users who saw the old DisplayTogglePill.
- **DB-1:** Verify and DROP `newsletter_subscribers` table in Neon
  (deferred from 52437b8 commit body, 18 days ago).
