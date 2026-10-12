# C4 — Security audit, 12 Oct 2026

## 🔴 P0: Next.js 16.3.0 carries three critical RCE advisories — and the fix needs no version-range change

`npm audit`: **29 vulnerabilities — 1 critical, 13 high, 14 moderate, 1 low.**

Installed: **next 16.3.0**. `package.json` declares `"next": "^16.3.0"`, so the caret
**already permits** the patched release. **The lockfile is simply stale.** This is a
lockfile refresh, not a dependency upgrade — no breaking-change risk from a range bump.

Advisories against 16.3.0, all fixed by **16.3.8**:

| Severity | Advisory | Fixed in |
|---|---|---|
| 🔴 critical | Unauthenticated RCE on Windows-hosted servers ([GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36)) | 16.3.3 |
| 🔴 critical | Unauthenticated RCE in Image Optimization API via AVIF ([GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4)) | 16.3.3 |
| 🔴 critical | RCE in `next/og` `ImageResponse` ([GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j)) | 16.3.6 |
| 🟠 high | SSRF in Image Optimization ([GHSA-cjq9-62q9-8jv4](https://github.com/advisories/GHSA-cjq9-62q9-8jv4)) | 16.3.8 |
| 🟡 moderate | Cache poisoning of SSG/ISR → cross-user content substitution + persistent DoS ([GHSA-mcj8-r9mp-w47p](https://github.com/advisories/GHSA-mcj8-r9mp-w47p)) | 16.3.8 |
| 🟡 moderate | Cache poisoning of SSG/ISR, self-hosted ([GHSA-4jqv-mc3x-m676](https://github.com/advisories/GHSA-4jqv-mc3x-m676)) | 16.3.8 |
| 🟡 moderate | Pending `use cache` fill leaks Draft Mode content into regular responses ([GHSA-3w37-wq28-93x7](https://github.com/advisories/GHSA-3w37-wq28-93x7)) | 16.3.8 |
| 🟡 moderate | Info disclosure in App Router metadata image routes via `dynamicParams` bypass ([GHSA-f87g-xv8r-7p7x](https://github.com/advisories/GHSA-f87g-xv8r-7p7x)) | 16.3.8 |
| 🔵 low | Info disclosure in dev server's MCP endpoint ([GHSA-39w2-rjm5-chcv](https://github.com/advisories/GHSA-39w2-rjm5-chcv)) | 16.3.8 |

### Exploitability against this app specifically

Not theoretical. Two of the three criticals plausibly reach production:

- **Image Optimization AVIF RCE + the Image Optimization SSRF** — `next.config.ts` configures
  `images` (line 32); the optimizer is live.
- **`next/og` `ImageResponse` RCE** — this app generates OG share images (there is a
  `scripts/generate-og-default.mjs`, and OG previews are a core share feature), so the
  `next/og` path is reachable by unauthenticated visitors hitting a share URL.
- **Windows RCE** — not applicable. Production is Vercel (Linux).
- **SSG/ISR cache poisoning** — the 72 prerendered `/champions/[pokemon]` pages and the
  sitemap are exactly the SSG surface these describe. The "self-hosted" advisory is
  lower-risk on Vercel, but GHSA-mcj8-r9mp-w47p is not scoped to self-hosted.

**Acted on this run:** lockfile refreshed to next 16.3.8 as its own commit, verified
through the full tsc + vitest + build gate.

## Remaining, NOT fixed this run

All require major-version bumps that need their own PR and a human-driven regression pass —
deliberately not attempted at 1am inside a 15-agent run:

- **`axios`** (high) — prototype-pollution gadgets in the fetch adapter and default instance.
  Transitive; find the owner before bumping.
- **`sharp`** (high) — libheif + librsvg CVEs, including CVE-2026-96889.
- **`undici`** (high) — two DoS paths (WebSocket permessage-deflate, orphaned RetryHandler body).
- **`joi`** (high) — prototype pollution via `__proto__` language key; `object().rename()`
  prototype write.
- **Build-time-only, not production-reachable** (`@next/eslint-plugin-next`,
  `eslint-config-next`, `fast-glob`, `micromatch`, `braces`, `brace-expansion`,
  `browserslist`, `js-yaml`, `source-map-js`) — DoS-class issues in dev/CI tooling, fed only
  by this repo's own trusted inputs. Low real risk; clear them opportunistically.

Already tracked: **VGC-221** (Clerk major bump for js-cookie advisories) and **VGC-248**
(clear remaining moderate npm vulns via breaking dep upgrades). A new ticket was filed for
the `axios`/`sharp`/`undici`/`joi` high-severity set, which neither existing ticket covers.

## Hardcoded-secret scan: ✅ clean

Grepped `src/`, `public/` and `scripts/` for literal assignments to `LINEAR_WEBHOOK*` and
for common secret prefixes (`lin_api_`, `sk_live_`, `sk_test_`, `whsec_`, `ghp_`, `xoxb-`).
**No hits.** Every webhook secret reference goes through `process.env`. The P0
secret-in-repo guardrail did not trigger.
