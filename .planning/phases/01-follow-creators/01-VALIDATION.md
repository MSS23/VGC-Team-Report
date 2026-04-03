---
phase: 1
slug: follow-creators
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript build check (tsc) + Next.js build |
| **Config file** | tsconfig.json |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | Follows table | build | `npx tsc --noEmit` | N/A (DB) | ⬜ pending |
| 01-01-02 | 01 | 1 | Follow/unfollow API | build+curl | `npx tsc --noEmit && npm run build` | ✅ exists | ⬜ pending |
| 01-01-03 | 01 | 2 | Follow button UI | build | `npx tsc --noEmit` | ✅ exists | ⬜ pending |
| 01-01-04 | 01 | 2 | Follow counts | build | `npx tsc --noEmit` | ✅ exists | ⬜ pending |
| 01-01-05 | 01 | 3 | Explore Following filter | build | `npx tsc --noEmit && npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers most phase requirements
- [ ] Verify `follows` table exists via `ensureTable()` in db.ts
- [ ] Verify existing follow API routes work (`/api/user/follow`)

*Most of the follow system is already implemented — Wave 0 focuses on verification of existing code and filling the explore filter gap.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Follow button visual state | Follow button UI | CSS visual state requires browser | Click follow button, verify toggle state |
| Following filter results | Explore Following filter | Requires authenticated session + DB data | Sign in, follow a creator, toggle Following filter on explore |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
