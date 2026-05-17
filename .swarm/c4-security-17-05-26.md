# Security Audit — VGC-191: Next.js 16.2.2 → 16.2.6 Upgrade
**Date:** 2026-05-17
**Auditor:** Claude Code (Sonnet 4.6) — Overnight Swarm
**Scope:** VGC-191 — Next.js security patch upgrade; full npm audit analysis

---

## 1. Current State

**package.json spec:** `"next": "^16.2.2"`
**Installed version (package-lock.json):** `16.2.2`
**Target version:** `16.2.6`

The `^16.2.2` semver range already allows upgrading to `16.2.6` without modifying `package.json`. The version bump will be resolved in `package-lock.json` only.

---

## 2. Next.js CVEs Fixed by Upgrading to 16.2.6

All 14 advisories confirmed by live `npm audit` run against installed `16.2.2`:

| Advisory | Title | CVSS | Fixed in |
|----------|-------|------|----------|
| GHSA-c4j6-fc7j-m34r | **SSRF via WebSocket upgrades** | **8.6** | 16.2.5 |
| GHSA-492v-c6pp-mqqv | **Middleware/proxy bypass via dynamic route param injection** | **8.1** | 16.2.5 |
| GHSA-26hh-7cqf-hhc6 | Middleware/proxy bypass (segment-prefetch) — incomplete fix follow-up | 7.5 | **16.2.6** |
| GHSA-267c-6grr-h53f | Middleware/proxy bypass via segment-prefetch routes | 7.5 | 16.2.5 |
| GHSA-36qx-fr4f-26g5 | Middleware/proxy bypass via i18n pages router | 7.5 | 16.2.5 |
| GHSA-q4gf-8mx6-v5v3 | DoS via Server Components | 7.5 | 16.2.3 |
| GHSA-8h8q-6873-q5fj | DoS via Server Components (second variant) | 7.5 | 16.2.5 |
| GHSA-mg66-mrh9-m8jx | DoS via Cache Components connection exhaustion | 7.5 | 16.2.5 |
| GHSA-h64f-5h5j-jqjh | DoS in Image Optimization API | 5.9 | 16.2.5 |
| GHSA-gx5p-jg67-6x7h | XSS in `beforeInteractive` scripts with untrusted input | 6.1 | 16.2.5 |
| GHSA-ffhc-5mcf-pf4q | XSS in App Router applications using CSP nonces | 4.7 | 16.2.5 |
| GHSA-wfc6-r584-vfw7 | Cache poisoning in React Server Component responses | 5.4 | 16.2.5 |
| GHSA-3g8h-86w9-wvmq | Middleware/proxy redirect cache poisoning | 3.7 | 16.2.5 |
| GHSA-vfv6-92ff-j949 | Cache poisoning via RSC cache-busting collisions | 3.7 | 16.2.5 |

**All 14 are patched by upgrading to 16.2.6.** The most critical (SSRF CVSS 8.6 and auth bypass CVSS 8.1) are confirmed present in 16.2.2 and fixed in 16.2.5. GHSA-26hh-7cqf-hhc6 is the sole advisory requiring exactly 16.2.6 (it's a follow-up incomplete-fix patch).

---

## 3. Full npm audit Results (2026-05-17)

**Total vulnerabilities: 8 unique packages**

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 4 |
| Moderate | 3 |
| Low | 0 |
| **Total** | **8** |

### Critical
- **protobufjs** (transitive via `@opentelemetry/*`) — arbitrary code execution CVSS 9.8 (GHSA-xq3m-2v4x-88gg) + 7 additional advisories. Server-side telemetry code only. `npm audit fix` resolves.

### High
- **next** (direct dep) — 14 advisories as listed above. `npm audit fix` resolves to 16.2.6.
- **fast-uri** (transitive) — path traversal CVSS 7.5 + host confusion CVSS 7.5. `npm audit fix` resolves.
- **systeminformation** (transitive) — Linux command injection CVSS 7.8. `npm audit fix` resolves.
- **vite** (dev-only transitive via `vitest`) — arbitrary file read, path traversal (all in dev server). Not deployed to Vercel. `npm audit fix` resolves.

### Moderate
- **dompurify** (transitive) — FORBID_TAGS bypass, prototype pollution XSS bypass. `npm audit fix` resolves.
- **@protobufjs/utf8** (transitive) — overlong UTF-8 decoding CVSS 5.3. `npm audit fix` resolves.
- **postcss** (transitive via `next`) — XSS via unescaped `</style>` in CSS stringify CVSS 6.1. Fixed by upgrading next.

---

## 4. Breaking Changes: 16.2.2 → 16.2.6

**No breaking changes.** This is a patch-level series (16.2.x). All releases 16.2.3 through 16.2.6 are security-only patch releases with no API changes.

**next.config.ts compatibility check:** The current config uses:
- `experimental.optimizePackageImports` — stable since 14.x, no change
- `images.remotePatterns` / `minimumCacheTTL` — unchanged
- `rewrites()` — unchanged
- `headers()` — unchanged

No config migration needed.

**eslint-config-next is pinned to `16.1.6`** (not `^16.2.x`) in devDependencies. This is intentional and does not need to change — it is unaffected by the next runtime upgrade.

---

## 5. Exact Package.json Change Needed

**None required.** The existing spec `"^16.2.2"` already covers 16.2.6.

The fix is entirely in `package-lock.json` — run either:

```bash
# Option A: npm audit fix (recommended — fixes next + all other vulns in one pass)
npm audit fix

# Option B: Targeted next-only bump
npm install next@16.2.6
```

**`npm audit fix` is the right approach** — it resolves all 8 vulnerable packages simultaneously (next, protobufjs, fast-uri, systeminformation, vite, dompurify, @protobufjs/utf8, postcss) in a single lockfile update. Dry-run confirms it does not perform any semver-breaking upgrades.

After running `npm audit fix`:
1. Verify with `npx tsc --noEmit` — no API changes expected
2. Verify with `npm run build` — should pass cleanly
3. Commit `package-lock.json` (package.json unchanged)

---

## 6. Risk Assessment

| Factor | Assessment |
|--------|------------|
| Breaking changes | None (patch series) |
| Config changes needed | None |
| Test impact | None expected |
| Build impact | None expected |
| Deployment risk | Very low — lockfile-only change |

**Safe to upgrade: YES**

---

## 7. Estimated Implementation Scope

| Step | Time |
|------|------|
| Run `npm audit fix` | 1 min |
| Run `npx tsc --noEmit` | 1 min |
| Run `npm run build` | 3-5 min |
| Commit `package-lock.json` | 1 min |
| **Total** | **~7-8 minutes** |

This is the lowest-risk security upgrade possible: patch-only bump, lockfile-only change, no API surface modifications, all 14 Next.js CVEs resolved.

---

## 8. Post-Upgrade Residual Vulnerabilities

After `npm audit fix`, zero vulnerabilities should remain. All 8 current findings have fixes available via `npm audit fix` with no semver-breaking changes required.
