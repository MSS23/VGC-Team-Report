# VGC Team Report – Performance & Bundle Size Analysis

## Executive Summary
The codebase demonstrates solid lazy-loading patterns for heavy modules (PDF export, QR code, share modals), but faces multiple bundle bloat issues. Key concerns: (1) Heavy data files (420 KB total) bundled at compile time on every route; (2) Multiple monitoring/analytics libraries loaded at layout level; (3) Undersized chunk boundaries for image export utilities; (4) Motion/react used on explore pages despite optimization hint; (5) Clerk+Sentry+OpenTelemetry overhead on unauthenticated routes.

---

## Performance Issues by Impact

### 1. CRITICAL: Data Files Bundled Globally (420 KB)
**Category:** Bundle Bloat  
**Files:** 
- `/src/lib/data/pokemon.ts` (236 KB)
- `/src/lib/data/moves.ts` (84 KB)
- `/src/lib/data/pokemon-types-map.ts` (44 KB)
- `/src/lib/data/mega-pokemon.ts` (28 KB)
- `/src/lib/data/move-names.ts` (20 KB)

**Impact:** HIGH  
**Issue:** Static Pokémon and moves data is imported directly into client components (SpeedTierChart, PokemonCard, OffensiveCoverageChart, DefensiveCoverageChart, PokemonDetailSlide). These files are bundled on every route, even pages that don't render reports (explore, home, changelog, champions).

**Estimate:** ~420 KB of redundant data shipped to all users visiting non-team pages.

**Recommended Fix:**
```typescript
// Convert to lazy imports in components that actually need the data
// Before (in SpeedTierChart.tsx):
import { POKEMON_DATA } from "@/lib/data/pokemon";

// After:
const { POKEMON_DATA } = await import("@/lib/data/pokemon");
// Or use dynamic imports at the client component boundary
```

Or move data-heavy lookups to server endpoints so they're never in the client bundle:
```typescript
// Create /api/pokemon/[species] endpoint instead
// Client calls it only when needed (e.g., during team analysis)
```

**Priority:** Fix in next sprint – save ~200 KB initial page load.

---

### 2. CRITICAL: Multiple Analytics Libraries at Root Layout Level
**Category:** Unnecessary Early Loading  
**Files:** `/src/app/layout.tsx`

**Impact:** HIGH  
**Issue:** 
- `@sentry/nextjs` (>150 KB, fully parsed at layout level)
- `@microsoft/clarity` (telemetry wrapper)
- `posthog-js` (150 KB, was recently deferred per changelog, but verify it's actually lazy-loaded)
- `@opentelemetry/*` (4 packages, ~80 KB combined)
- `@upstash/ratelimit` + `@upstash/redis` (backend but declared as dependencies)

**Current State:**
```typescript
// In layout.tsx
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { ClarityProvider } from "@/components/providers/ClarityProvider";
```

Changelog notes posthog-js is deferred to idle, but verification needed.

**Recommended Fix:**
- **Verify PostHog is truly deferred.** Check if `usePostHog()` hook actually delays import until `requestIdleCallback`.
- **Defer Clarity initialization.** Load after first paint:
```typescript
// In ClarityProvider.tsx
useEffect(() => {
  // Load only after component mounts and browser is idle
  requestIdleCallback(() => {
    import("@microsoft/clarity").then(mod => {
      mod.default.init("...");
    });
  }, { timeout: 5000 });
}, []);
```
- **Remove @opentelemetry/* from production bundle** — move to separate server-side logger package, or load via dynamic import on error only.

**Priority:** URGENT – this blocks initial JS parse time.

---

### 3. HIGH: Oversized Dependencies for Niche Features
**Category:** Dependency Analysis  
**Issue:** Several dependencies are heavy relative to their use case:

| Dependency | Size | Issue | Alternative |
|---|---|---|---|
| `html2canvas-pro` | ~200 KB | Loaded only for PNG export, already lazy-loaded but consider native Canvas API | @html2canvas/common or lightweight canvas-to-blob |
| `jspdf` | ~300 KB | Loaded only for PDF export, already lazy-loaded | Use print CSS + browser's print-to-PDF (zero bundle cost) |
| `qrcode` | ~45 KB | Dynamically loaded, good | Acceptable – inline QR generation with canvas unlikely to beat this |
| `motion` | ~50 KB gzipped | Explore pages only, has optimization hint | Verify next.config optimizePackageImports works; fallback to Framer Motion subset |
| `tweetnacl` | ~30 KB | Used for signing? Check actual usage | Verify necessity; large for crypto |
| `axios` | ~15 KB | HTTP client | Replace with native `fetch` to save ~15 KB |

**Recommended Fix:**
1. **For PDF export:** Replace jsPDF + html2canvas with print CSS. Users click Export → browser print dialog → save as PDF. Zero bundle cost.
2. **For PNG export:** Keep html2canvas-pro (already lazy-loaded), but move to a deferred route handler.
3. **Replace axios with fetch** for simple HTTP needs.

**Priority:** MEDIUM – ~50 KB savings if all removed, but print CSS change requires UX overhaul.

---

### 4. HIGH: Chunk Split Issues – Large Lazy Components Not Separated
**Category:** Code Splitting  
**Files:**
- `/src/components/ui/PdfExport.tsx` imports 5 sibling chart/detail components (SpeedTierChart, MatchupPlanSlide, MatchupSheet, TeamOverview, PokemonDetailSlide)
- `/src/components/ui/ShareModal.tsx` likely imports form components
- `/src/app/page.tsx` dynamically imports 8+ components but they're bundled together

**Impact:** HIGH  
**Issue:** Even though components are wrapped in `dynamic()`, they're still importing sibling components that aren't code-split. Example:
```typescript
// In PdfExport.tsx (dynamically loaded)
import { TeamOverview } from "./TeamOverview";     // ← bundled with PdfExport chunk
import { SpeedTierChart } from "./SpeedTierChart"; // ← bundled with PdfExport chunk
```

This means when user triggers PDF export, they download PdfExport + all 5 report slides in one chunk (~200 KB estimated).

**Recommended Fix:**
```typescript
// In PdfExport.tsx - move imports to dynamic
const TeamOverview = dynamic(() => 
  import("./TeamOverview").then(m => ({ default: m.TeamOverview }))
);
const SpeedTierChart = dynamic(() => 
  import("./SpeedTierChart").then(m => ({ default: m.SpeedTierChart }))
);
```

Result: PDF export triggers 6 separate small chunks instead of one monolithic chunk.

**Priority:** MEDIUM – depends on usage; if <5% of users export PDFs, deprioritize.

---

### 5. HIGH: Root Layout Renders Too Many Providers/Components
**Category:** Root Level Bloat  
**File:** `/src/app/layout.tsx`

**Impact:** HIGH  
**Issue:**
```typescript
export default function RootLayout({ children }: {...}) {
  return (
    <html>
      <body>
        <ClerkProvider>
          <CookieBanner />
          <PostHogProvider>
            <PersistentNavbar />  // ← Forces navbar bundle on every route
            {children}
          </PostHogProvider>
          <ClarityProvider />
          <InstallPrompt />
          <ConnectivityStatus />
          <ServiceWorkerRegistration />
          <ChunkErrorReloader />
        </ClerkProvider>
      </body>
    </html>
  );
}
```

Every child route loads:
- `PersistentNavbar` (always present, even on embed pages `/embed/[id]`)
- `CookieBanner` (lightweight, OK)
- `ServiceWorkerRegistration`, `ConnectivityStatus`, `ChunkErrorReloader` (all fine)

**Recommended Fix:**
1. **Conditionally render PersistentNavbar** — skip on `/embed/*` and `/s/*` (shared reports):
```typescript
const pathname = usePathname();
const hideNav = pathname.startsWith('/embed/') || pathname.startsWith('/s/');

return (
  <ClerkProvider>
    {!hideNav && <PersistentNavbar />}
    {children}
  </ClerkProvider>
);
```

2. **Move analytics providers to route segments** — only load on pages that use them:
```typescript
// /src/app/(with-analytics)/layout.tsx
export default function WithAnalytics({ children }) {
  return (
    <PostHogProvider>
      <ClarityProvider>
        {children}
      </ClarityProvider>
    </PostHogProvider>
  );
}

// /src/app/(embed)/layout.tsx
export default function EmbedLayout({ children }) {
  return children; // No analytics, lighter
}
```

**Priority:** MEDIUM – ~30 KB savings if navbar lazy-loaded correctly.

---

### 6. MEDIUM: Motion/React Usage on Explore Routes
**Category:** Animation Library Bloat  
**Files:**
- `/src/components/explore/ExploreContent.tsx` (motion)
- `/src/components/explore/ExploreFilters.tsx` (motion, AnimatePresence)
- `/src/components/explore/SpotlightCard.tsx` (motion)
- `/src/components/explore/ReportCard.tsx` (motion)

**Impact:** MEDIUM  
**Issue:** `motion` (~50 KB gzipped) is used for transitions on explore page. Next.config has optimization hint:
```typescript
experimental: {
  optimizePackageImports: ["motion/react"],
}
```

However, **verify this is actually working**. If not, consider:
1. CSS Transitions/Keyframes instead (~5 KB vs 50 KB)
2. React Transition Group (~10 KB) — more minimal
3. Native CSS `@supports (animation: ...)` for graceful degradation

**Recommended Fix:**
```typescript
// Before:
import { motion } from "motion/react";
<motion.div animate={{ opacity: 1 }}>...</motion.div>

// After (CSS-based, tree-shakeable):
import styles from "./card.module.css"; // Uses CSS animations
<div className={styles.fadeIn}>...</div>
```

**Priority:** LOW – only if optimizePackageImports isn't working. Run `next build --analyze` to verify.

---

### 7. MEDIUM: Data Files Imported in Client-Side Only Components
**Category:** Unnecessary Client Overhead  
**Files Affected:**
- `/src/components/report/PokemonCard.tsx` imports `NATURES`, `lookupPokemon` (needed for display)
- `/src/components/report/SpeedTierChart.tsx` imports `POKEMON_DATA`, `MEGA_POKEMON_LIST` (needed for calculations)
- `/src/components/report/OffensiveCoverageChart.tsx` imports `getEffectiveness`, `lookupMove`
- `/src/components/report/DefensiveCoverageChart.tsx` imports `getDefensiveProfile`

**Impact:** MEDIUM  
**Issue:** These components are rendered on the main team report page (not lazy-loaded). They import data files that could be precomputed on the server instead.

Example:
```typescript
// Current (client-side calculation):
const effectiveness = getEffectiveness(moveType, targetType);

// Better (server could pre-compute type chart):
// API endpoint: GET /api/type-chart returns cached effectiveness matrix
```

**Recommended Fix:**
- Move `type-chart.ts` functions to a server endpoint (`/api/type-chart`) with Redis caching (already have @upstash/redis)
- Client calls endpoint once on team load, memoizes result
- For Pokémon lookups: keep client-side (too frequent to server-call)

**Priority:** LOW – optimize only after #1-#3 are addressed.

---

### 8. LOW: Clerk + Sentry Overhead on Public Routes
**Category:** Authentication/Monitoring Bloat  
**Files:** `/src/app/layout.tsx` (ClerkProvider), `/src/components/providers/PostHogProvider.tsx` (Sentry)

**Impact:** LOW  
**Issue:** Both Clerk and Sentry are loaded on every route, including public pages like `/explore`, `/s/:id` (shared reports), and `/creators/:slug` (public profiles).

For public routes, Clerk client SDK is unnecessary.

**Recommended Fix:**
```typescript
// In middleware.ts or layout.tsx
const isPublicRoute = usePathname().match(/^\/s\/|^\/embed\/|^\/explore/);

if (isPublicRoute) {
  // Skip ClerkProvider, load lightweight auth stub
  return <>{children}</>;
}

return (
  <ClerkProvider>
    {children}
  </ClerkProvider>
);
```

**Priority:** LOW – Clerk SDK likely tree-shakes unused code, but worth measuring.

---

## Summary Table

| Issue | File(s) | Category | Impact | Estimate | Fix Complexity |
|---|---|---|---|---|---|
| Data files bundled globally | `/src/lib/data/*.ts` | Bundle Bloat | HIGH | 420 KB | HIGH (requires refactor) |
| Analytics at root level | `/src/app/layout.tsx` | Load Speed | HIGH | ~150 KB parse time | MEDIUM |
| html2canvas-pro/jsPDF oversized | `package.json` | Dep Weight | MEDIUM | 500 KB total (lazy) | MEDIUM (replace jsPDF) |
| Chunk splits in dynamic imports | `/src/components/ui/*.tsx` | Code Splitting | HIGH | ~100 KB per export | MEDIUM |
| Root layout bloat | `/src/app/layout.tsx` | Architecture | HIGH | ~30 KB | MEDIUM |
| Motion library weight | `/src/components/explore/*.tsx` | Animation | MEDIUM | 50 KB | LOW (verify config) |
| Type-chart calculations client-side | `/src/components/report/*.tsx` | Data Logic | MEDIUM | ~20 KB overhead | LOW (cache optimization) |
| Clerk on public routes | `/src/app/layout.tsx` | Auth Overhead | LOW | ~50 KB (SDK) | LOW |

---

## Recommendations Priority Order

### Sprint 1 (Immediate – 5 pts)
1. **Lazy-load data files** — move pokemon.ts, moves.ts imports to dynamic chunks or server endpoints
2. **Defer analytics libraries** — verify PostHog idle callback, defer Clarity and OpenTelemetry
3. **Replace jsPDF with print CSS** — eliminate 300 KB lazy bundle (users use browser's native print-to-PDF instead)

### Sprint 2 (This Month – 5 pts)
4. **Split lazy component imports** — dynamic() wrap SpeedTierChart, MatchupPlanSlide in PdfExport.tsx
5. **Conditionally load navbar** — skip on `/embed/*` and `/s/*` routes
6. **Replace axios with fetch** — save 15 KB

### Sprint 3+ (Backlog – Lower ROI)
7. **Verify motion/react optimization** — run build --analyze, switch to CSS if not working
8. **Server-side type-chart API** — cache effectiveness matrix in Redis
9. **Route-based provider layout** — separate with/without-analytics route groups

---

## Testing & Validation

Run after each fix:
```bash
next build --analyze
# Look for: Total gzip bundle size, largest chunks

npm run build
# Check build output for "Optimized package imports" message for motion/react
```

Monitor metrics:
- **First Contentful Paint (FCP)** on homepage
- **Largest Contentful Paint (LCP)** on team report page
- **Total Page Download Size** (Network tab, Chrome DevTools)

---

## Code Snippets for Quick Wins

### 1. Defer PostHog (Verify it's already done)
```typescript
// /src/components/providers/PostHogProvider.tsx
let _posthog: typeof PostHog | null = null;

async function getPostHog() {
  if (_posthog) return _posthog;
  const mod = await import("posthog-js");
  _posthog = new mod.PostHog(...);
  return _posthog;
}

useEffect(() => {
  requestIdleCallback(() => getPostHog(), { timeout: 5000 });
}, []);
```

### 2. Conditional Navbar
```typescript
// /src/app/layout.tsx
'use client';

import { usePathname } from 'next/navigation';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const showNav = !pathname.startsWith('/embed/') && !pathname.startsWith('/s/');

  return (
    <html>
      <body>
        {showNav && <PersistentNavbar />}
        {children}
      </body>
    </html>
  );
}
```

### 3. Lazy-Load Data
```typescript
// Before:
import { POKEMON_DATA } from "@/lib/data/pokemon";

// After:
const POKEMON_DATA = useMemo(async () => {
  const mod = await import("@/lib/data/pokemon");
  return mod.POKEMON_DATA;
}, []);
```

---

## Appendix: Dependency Sizes (npm install estimate)

These are approximate unpacked sizes; gzipped typically 30-40% of this:

- @sentry/nextjs: ~800 KB (includes all SDKs)
- html2canvas-pro: ~200 KB
- jspdf: ~300 KB
- motion: ~50 KB (gzipped ~15 KB, but entire package included)
- @clerk/nextjs: ~400 KB (SDK + UI components)
- posthog-js: ~150 KB
- @opentelemetry/sdk-logs + exports: ~80 KB combined
- axios: ~15 KB
- qrcode: ~45 KB

Total dev/runtime overhead: ~2 MB unpacked, ~500-600 KB gzipped.

---

**Analysis Date:** 2026-05-13  
**Codebase:** VGC Team Report (Next.js 16.2.2)  
**Analyst:** Performance Engineering Team
