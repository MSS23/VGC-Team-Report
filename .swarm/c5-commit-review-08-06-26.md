# C5 — Commit Review (last 20 commits on main)

Date: 2026-06-08
Scope: `git log main -20` (range `8021723..8eb39cc`)
Reviewer: code-review (Claude)

## Commits reviewed

```
8eb39cc Redesign report bottom nav: segmented section tabs + cleanup + PWA
1a30839 Merge swarm-nightly PRs #48/#49 + repair corrupted main
1d6c3de swarm: nightly improvements 26-05-26 (#47)
484fa50 swarm: nightly improvements 25-05-26 (#46)
709ca2d swarm: nightly improvements 24-05-26 (#38)
6981f23 swarm: nightly improvements 23-05-26 (#37)
ae4b3b4 swarm: nightly improvements 22-05-26 (#36)
bcbda85 swarm: nightly improvements 21-05-26 (#35)
850e91c Delete share + reaction docks; persist duplicate-CTA dismissal
3ace051 Instagram-style dock UX + double-tap-to-like + owner pencil
b1af62f Streamline mobile shared-view UX
767ef07 swarm: nightly improvements 20-05-26 (#34)
52437b8 chore: remove newsletter signup component and API route
6f1e552 swarm: nightly improvements 19-05-26 (#33)
b1e95df swarm: nightly improvements 18-05-26 (#32)
90c57c2 swarm: nightly improvements 17-05-26 (#30)
7dd9900 swarm: nightly improvements 16-05-26 (#29)
83295c1 fix: posthog?.capture optional chain in anonymous share intent handler
cddad63 Merge branch 'claude-dev' into main
8021723 swarm: Discord notification payload (unsent — no .env.local) 15-05-26
```

Files marked off-limits by task brief (skipped from findings even when modified): `public/sw.js`, `src/app/globals.css`, `src/app/page.tsx`, `src/components/report/SlideNavControls.tsx`, `src/components/ui/SwipeHint.tsx`, `src/hooks/useHomePage.ts`.

---

## Follow-ups worth a commit tonight

### CT1 — Orphan files left behind by the bottom-nav redesign (8eb39cc)
- **SHA:** `8eb39cc`
- **Files:** `/home/user/VGC-Team-Report/src/components/display/DisplayTogglePill.tsx` (entire file, 240+ lines), `/home/user/VGC-Team-Report/src/lib/hooks/useGlobalDisplayPrefs.ts` (entire file, ~40 lines)
- **What's wrong:** The redesign removed the `<DisplayTogglePill>` import + render from `src/app/page.tsx` and dropped `useGlobalDisplayPrefs` from the destructure, but the component file and the hook file are still on disk. `Grep` confirms zero remaining importers anywhere in `src/` (only `.swarm/` audit notes reference them). They tree-shake out of the bundle but they keep showing up in dead-code audits and add CI noise.
- **1-line fix:** `git rm src/components/display/DisplayTogglePill.tsx src/lib/hooks/useGlobalDisplayPrefs.ts` and drop the now-empty `src/components/display/` directory if nothing else lives there.

### CT2 — Sample-team save guard only matches one of three sample teams
- **SHAs:** `7dd9900` introduced the `Kangaskhan-Mega @ Kangaskhanite` check; the multi-sample picker landed in `90c57c2` (VGC-188) but the guard was never widened.
- **Files:**
  - `/home/user/VGC-Team-Report/src/app/api/share/route.ts:98`
  - `/home/user/VGC-Team-Report/src/app/api/user/drafts/route.ts:135`
- **What's wrong:** Both routes do `state.paste.trimStart().startsWith("Kangaskhan-Mega @ Kangaskhanite\nAbility: Parental Bond")` to reject sample teams. After VGC-188, `CHAMPIONS_SAMPLE_TEAMS` ships three samples — `sample-groudon-sun`, `sample-kyogre-rain`, `sample-kangaskhan-goodstuffs`. A user who pastes (or sample-loads) the Groudon or Kyogre team can `POST /api/share` and pollute the public Explore feed with sample data. The intent comment ("Never save sample teams") promises something the code no longer delivers.
- **1-line fix:** Replace the hardcoded `startsWith(...)` check with a shared helper, e.g. `if (CHAMPIONS_SAMPLE_TEAMS.some(t => state.paste.trimStart().startsWith(t.paste.trimStart().split("\n").slice(0, 2).join("\n")))) { … }`, or compare the first two non-blank lines of every sample. Live in `src/lib/utils/sample-team.ts`.

### CT3 — `useShareUrl.ts` strips internal flags via a 9-variable destructure with eslint-disable
- **SHA:** Touched in `90c57c2` (VGC-190 added `_isUnlisted`).
- **File:** `/home/user/VGC-Team-Report/src/hooks/useShareUrl.ts:191-193`
- **What's wrong:**
  ```ts
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _editable, _isPublic: _ip, _editToken: _et, _isOwner: _io, _version: _v, _collaborators: _c, _forkedFrom: _ff, _redactedFields: _rf, ...state } = data;
  ```
  Every new internal flag added (`_isUnlisted` was the last one) requires editing this line and renaming a new alias. It also clashes with the destructure block above that already pulled `_editToken`/`_isOwner` out — three of the eight aliases are now redundant reads.
- **1-line fix:** Replace the whole line with `const state = Object.fromEntries(Object.entries(data).filter(([k]) => !k.startsWith("_"))) as ShareableState;` — drops the eslint-disable, future-proofs against new internal flags, and removes the duplicate destructure with line 184-190.

### CT4 — Linear webhook handler verifies signature then does nothing with the event
- **SHAs:** Touched on every nightly run since `7dd9900` (8 separate commits "fixing" the header / env var / status codes).
- **File:** `/home/user/VGC-Team-Report/src/app/api/webhooks/linear/route.ts:23-72`
- **What's wrong:** The route now correctly reads `linear-signature`, accepts both env-var names, force-dynamic, returns 200 on the setup ping — but after verifying the HMAC it falls straight through to `return NextResponse.json({ ok: true })` for every event. There's no dispatch table, no handling of `Issue` create/update, no notification path. The route is functionally a 200-echo. Every nightly swarm rediscovers and re-"fixes" the same wiring because there's no working handler downstream to confirm the fix.
- **1-line fix:** Either delete the route (Linear webhook is unused) or add a one-line `console.log(body.type, body.action)` and a TODO so the next swarm doesn't churn on it again. Recommend deletion — keep the file out of the swarm's re-fix loop.

### CT5 — Magic body-size literal repeated instead of imported
- **SHAs:** `b1e95df` (VGC-127), `6981f23` (touched share/route again).
- **Files:** `/home/user/VGC-Team-Report/src/app/api/share/route.ts:11` (`const MAX_BODY_SIZE = 512_000`) and `/home/user/VGC-Team-Report/src/app/api/user/drafts/route.ts:117` (inline `maxBodySize: 512_000`).
- **What's wrong:** Two routes accept the same body size cap; one names the constant, the other inlines the literal. If we bump the cap in one place we'll forget the other.
- **1-line fix:** Export `MAX_SHARE_BODY_SIZE` from `src/lib/security/api-guard.ts` (or a new `src/lib/constants.ts`) and import in both routes.

---

## Follow-ups worth a Backlog ticket

### BL1 — Linear webhook: implement an actual handler or delete the route
- **Description:** The route at `src/app/api/webhooks/linear/route.ts` has been "fixed" eight times in eight nightly runs (commits `7dd9900`, `bcbda85`, `ae4b3b4`, `6981f23`, `709ca2d`, `484fa50`, `1d6c3de`, `1a30839`) — header name, env var name, status codes, force-dynamic, runtime — but the body of the handler still just returns `{ ok: true }`. Decide whether we actually consume Linear events or not. If yes, implement a dispatch on `body.type` / `body.action`; if no, delete the route and revoke the webhook in Linear so we stop generating phantom audit findings.
- **Cited commits:** All of `7dd9900`, `bcbda85`, `ae4b3b4`, `6981f23`, `709ca2d`, `484fa50`, `1d6c3de`, `1a30839`.

### BL2 — Extract a `searchVectorSql` helper to dedupe the 4×3-line tsvector blocks
- **Description:** The `setweight(to_tsvector('english', ...), 'A') || setweight(...) || …` block appears 28 times across 4 files: `src/app/api/share/route.ts` (12 occurrences in INSERT + 2× UPDATE + dedup UPDATE), `src/app/api/share/[id]/fork/route.ts` (4), `src/app/api/migrate/route.ts` (8), `src/lib/db.ts` (4). Any change to weights or fields needs 4 edits. Wrap in a single helper that returns the SQL fragment via the same `sql\`…\`` tag.
- **Cited commits:** `b1e95df` (VGC-127 share route shuffle), `6981f23` (VGC-218 species column drop touched all three blocks).

### BL3 — Replace "fetch all saved reports" lookup in Navbar with a single-share endpoint
- **Description:** On every shared-view mount, `Navbar.tsx:209` does `fetch("/api/user/saved")` and downloads the user's entire saved-reports list just to check whether the current `activeShareId` is in it (`Navbar.tsx:216`). For users with hundreds of saves this scales linearly in payload size on every report open. Add `GET /api/user/saved/[shareId]` returning a `{ saved: boolean }` body, or include `_savedByCurrentUser` in the `/api/share/[id]` response payload, then use that.
- **Cited commits:** `850e91c` (introduced the single-source-of-truth Save toggle), `ae4b3b4` (added the `savedTouchedRef` + AbortController race fix on top — but kept the full-list fetch).

### BL4 — Audit the share/reaction-dock churn: track UI work that ships and ships-back within two weeks
- **Description:** `b1af62f` (May 20) introduces `useTouchIdleHide` + `ShareDock` + `FloatingReactionDock` brief-flash UX. `3ace051` (May 20) rewrites the same hook a few hours later. `850e91c` (May 20) deletes all three files. Net: ~570 lines added then deleted in <24h. Worth a retro ticket on how the no-floating-dock rule (now codified in `8eb39cc`) reached the codebase: catch the rule earlier, save ~3 swarm cycles.
- **Cited commits:** `b1af62f`, `3ace051`, `850e91c`, `8eb39cc`.

### BL5 — Standardise the Linear webhook env var name in Vercel (close the fallback)
- **Description:** Multiple webhook handler commits keep a dual-read of `LINEAR_WEBHOOK_SIGNING_SECRET ?? LINEAR_WEBHOOK_SECRET` "until we standardise". Standardise now: pick `LINEAR_WEBHOOK_SIGNING_SECRET`, rename in Vercel Production env, drop the fallback. Same pattern shows up in commit messages of `7dd9900`, `bcbda85`, `ae4b3b4`, `6981f23` — everyone keeps deferring it. Pairs naturally with BL1.
- **Cited commits:** `7dd9900`, `bcbda85`, `ae4b3b4`, `6981f23`, `709ca2d`, `484fa50`, `1d6c3de`.

### BL6 — Repeat-merge corruption: PR squash flow allowed unreviewed nightly PRs to ship broken main
- **Description:** Commit `1a30839` describes repairing pre-existing corruption in `JsonLd.tsx`, `cleanup/route.ts`, `explore/page.tsx`, `tournaments/page.tsx` from "prior botched nightly merges" that "did not compile and were blocking deploys". The same PR also notes the swarm re-proposed the same fixes 8 nights running. Root cause likely lives in how the swarm-nightly squash-merges replay prior diffs onto a moving base. Worth a Backlog ticket to add a `tsc --noEmit` check in the swarm-nightly PR workflow that hard-fails before opening the PR.
- **Cited commits:** `1a30839`.

### BL7 — `Object.entries(...).every(...)` on a sample-team paste detection — adopt a single source of truth
- **Description:** Same issue as CT2 but viewed structurally. `state.paste.trimStart().startsWith(...)` checks for sample identity live in two routes (`share/route.ts`, `user/drafts/route.ts`), and the paste-input UI uses `SAMPLE_TEAMS` IDs. Centralise an `isSampleTeamPaste(paste: string): boolean` helper next to `CHAMPIONS_SAMPLE_TEAMS` so any new sample-team add automatically updates the save guards.
- **Cited commits:** `7dd9900` (guard introduced), `90c57c2` (third sample added without updating the guard).

---

## Patterns to watch

### P1 — The "Linear webhook" treadmill (8 commits, zero progress)
Every nightly swarm rediscovers that the Linear webhook handler "needs fixing" and proposes the same set of changes (header name, env var, force-dynamic, status codes). The fix lands every time. Then the next swarm finds the same issue and proposes the same fix. Root cause: the body of the handler doesn't do anything useful so there's no positive signal that the fix worked. The swarm's audit-rediscover-fix loop is locked. Address via BL1+BL5 together.

### P2 — UI added and then ripped out within days
`b1af62f` → `3ace051` → `850e91c` → `8eb39cc` is a chain where the `ShareDock` / `FloatingReactionDock` / `useTouchIdleHide` / `DisplayTogglePill` / `useGlobalDisplayPrefs` files churn through addition and deletion across <3 weeks. Net code wasted: ~900 lines. The "no permanent overlays on shared views" rule that drove the final cleanup wasn't articulated until the rip-out commit. Spending one Friday writing down design-rules to put in `.claude/skills/ui-ux-pro-max/SKILL.md` would have saved 4 commits and ~6 swarm cycles. Also leaves orphan files behind (CT1).

### P3 — Copy-pasted SQL fragments instead of helpers
The `setweight(to_tsvector(...), ...)` block (BL2) and the timing-safe Bearer compare (factored only after 4 separate routes had identical code — see `6981f23` VGC-216) both show the same pattern: code gets copy-pasted into 3-5 routes, only after a security/correctness audit is the helper extracted. Worth a soft norm: if a query block exceeds 4 lines and is repeated, extract immediately.

### P4 — Hardcoded magic strings for identity checks
`Kangaskhan-Mega @ Kangaskhanite\nAbility: Parental Bond` (CT2) is the worst offender, but the same pattern shows up in the auto-generated `applicationCategory: "SportsApplication"` JSON-LD repair (1a30839) and the "Sample teams cannot be saved" branches. Switch to enum or id-based detection where the source data already has IDs (sample teams have `id`s).

### P5 — Catch-and-swallow with comments doing the heavy lifting
`/* silent */` and `/* silent — use defaults */` empty catches appear 4× in `src/app/dashboard/notifications/NotificationsContent.tsx` and 2× in `src/app/dashboard/profile/page.tsx` plus the `.catch(() => {})` chain in `DashboardContent.tsx`. None of these were introduced in the review window, but they're a quietly growing class — worth flagging if any new ones land. None did in this window (the rest were properly logged via `console.error`).

### P6 — Optional-chaining drift between Android / iOS branches in InstallPrompt
The 17-05-26 swarm added a `pageIsShort` rescue for iOS in `90c57c2` and noted the Android branch was missing it. `709ca2d` then fixed Android. Same diff, two days apart. If you find yourself patching the iOS branch of a paired iOS/Android handler, patch both — diff-pairing has been a recurring class.

---

## Items NOT flagged (already addressed, intentionally left, or in the avoid-list)

- `SlideNavControls.tsx` was the biggest churn target of the window — explicitly excluded by brief.
- The "Save toggle race" was already closed in `ae4b3b4` (savedTouchedRef + AbortController).
- The `species[]` write-only column was already dropped in `6981f23` (VGC-218).
- The fire-and-forget `sql\`…\`.catch()` regression was already fixed in `6981f23` (VGC-218 Part B).
- The XSS in welcome / comment emails was already fixed in `709ca2d` (`escapeHtml` lifted to `lib/email`).
- The verifyBearer helper was already factored in `6981f23` (VGC-216).
- Timing-safe compare in cleanup/migrate was already landed in `484fa50` and `bcbda85`.
- `console.warn`/`console.error` in `src/lib/**` are all on error paths and are intentional production logging — not flagged.
