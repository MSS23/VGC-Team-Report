# Testing Patterns

**Analysis Date:** 2026-04-02

## Test Framework

**Unit Test Runner:**
- Vitest 4.1.1
- Config: `vitest.config.ts`
- Globals enabled (`globals: true` — no need to import `describe`/`it`/`expect` but tests do import them explicitly)
- Path alias: `@/` mapped to `./src/`

**E2E Test Runner:**
- Cypress 15.11.0
- Config: `cypress.config.ts`
- Base URL: `http://localhost:3000`
- Viewport: 1280x800
- Video disabled, screenshots on failure enabled
- Server startup helper: `start-server-and-test` package

**Assertion Library:**
- Vitest built-in `expect` (Jest-compatible API)
- Cypress built-in assertions (Chai + jQuery)

**Run Commands:**
```bash
npm test                # Run all Vitest unit tests (vitest run)
npm run test:watch      # Vitest in watch mode
npm run cy:open         # Open Cypress interactive runner
npm run cy:run          # Run Cypress headless
npm run test:e2e        # Start dev server + run Cypress headless
npm run test:e2e:open   # Start dev server + open Cypress interactive
```

## Test File Organization

**Unit Tests — Location:**
- Co-located `__tests__/` directories next to source modules
- Pattern: `src/lib/{module}/__tests__/{file}.test.ts`

**Unit Test Directory Map:**
- `src/lib/__tests__/` — top-level lib tests (cron-auth, rate-limit)
- `src/lib/analysis/__tests__/` — stat calculator, item boosts
- `src/lib/parser/__tests__/` — showdown paste parser
- `src/lib/sharing/__tests__/` — URL codec
- `src/lib/utils/__tests__/` — sanitize, sprite-slug, word-filter, export-paste, extract-species, relative-time

**E2E Tests — Location:**
- `cypress/e2e/` — all E2E specs
- `cypress/support/e2e.ts` — support file with custom commands
- `cypress/fixtures/` — test fixture data (directory exists)

**Naming:**
- Unit: `{module-name}.test.ts` (e.g., `showdown-parser.test.ts`, `rate-limit.test.ts`)
- E2E: `{feature}.cy.ts` (e.g., `home.cy.ts`, `team-report.cy.ts`, `creator-mode.cy.ts`)

## Test Structure

**Unit Test Organization:**
```typescript
import { describe, it, expect } from "vitest";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";

// Constants for test data defined at module level
const GARCHOMP_BLOCK = `Garchomp @ Life Orb\n...`;

describe("parseShowdownPaste", () => {
  describe("basic single Pokemon parse", () => {
    it("parses species, item, ability, nature, moves, EVs", () => {
      const result = parseShowdownPaste(GARCHOMP_BLOCK);
      expect(result.pokemon).toHaveLength(1);
      expect(result.pokemon[0].species).toBe("Garchomp");
    });
  });
});
```

**Patterns:**
- Nested `describe` blocks for logical grouping (e.g., "HP calculation", "nature modifiers")
- Descriptive `it` labels stating expected behavior
- Test data as module-level constants (not fixtures files for unit tests)
- Each test focuses on a single assertion or closely related assertions
- Mathematical formulas included as comments for stat calculation tests

**Setup/Teardown (when needed):**
```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});
```

**Environment mocking:**
```typescript
const originalEnv = process.env;
beforeEach(() => { process.env = { ...originalEnv }; });
afterEach(() => { process.env = originalEnv; });
```

## E2E Test Structure

**Custom Commands (defined in `cypress/support/e2e.ts`):**
```typescript
// Load sample team and navigate to report view
cy.loadSampleTeam();

// Paste custom data and analyze
cy.pasteAndAnalyze(paste);

// Slide navigation
cy.goToSlide(index);
cy.nextSlide();
cy.prevSlide();
```

**E2E Pattern:**
```typescript
describe("Home / Paste Input", () => {
  beforeEach(() => {
    cy.visit("/", {
      onBeforeLoad(win) {
        // Dismiss modals by setting localStorage
        win.localStorage.setItem("vgc-whats-new-v3", "1");
      },
    });
  });

  it("renders the paste input screen with title", () => {
    cy.get("h1").should("be.visible");
    cy.get("textarea").should("be.visible");
  });
});
```

**E2E Specs:**
| File | What it tests | Lines |
|------|---------------|-------|
| `cypress/e2e/home.cy.ts` | Paste input, sample loading, validation, footer | 63 |
| `cypress/e2e/team-report.cy.ts` | Overview slide, navigation, pokemon cards, stats | 131 |
| `cypress/e2e/creator-mode.cy.ts` | Creator mode toggle, editing features | 103 |
| `cypress/e2e/navbar.cy.ts` | Navigation bar, links, responsive behavior | 62 |
| `cypress/e2e/visual-design.cy.ts` | Visual design consistency, styling | 81 |
| `cypress/e2e/privacy.cy.ts` | Privacy page content | 16 |

## Mocking

**Framework:** Vitest `vi` (built-in)

**Timer Mocking:**
```typescript
vi.useFakeTimers();
vi.advanceTimersByTime(1001);
vi.useRealTimers();
```

**Environment Variable Mocking:**
```typescript
process.env = { ...originalEnv };
process.env.CRON_SECRET = "my-secret";
```

**What is Mocked:**
- Timers (for rate limiter window expiry)
- Environment variables (for auth/secret checks)
- Node.js `zlib` used directly in URL codec tests (instead of browser Compression API)

**What is NOT Mocked:**
- Pure functions (parsers, calculators, validators) — tested with real inputs
- Database, HTTP calls — not tested at unit level
- React components — no component-level unit tests

## Fixtures and Factories

**Unit Test Data:**
- Inline constants at module scope (Pokemon paste strings, stat values)
- Real-world examples used (actual Pokemon species, moves, EVs)
- No factory functions or faker libraries

**E2E Test Data:**
- Sample team paste defined in `cypress/support/e2e.ts` (`SAMPLE_PASTE` constant)
- Full 6-Pokemon VGC team with realistic spreads
- `localStorage` manipulation for dismissing modals in `beforeEach`

## Coverage

**Requirements:** None enforced. No coverage thresholds configured.

**View Coverage:**
```bash
npx vitest run --coverage    # Requires @vitest/coverage-v8 (not currently installed)
```

## Test Types

**Unit Tests (12 files, ~943 lines):**
- Pure function testing: parsers, calculators, validators, utilities
- Scope: individual functions with deterministic inputs/outputs
- No React component tests, no hook tests
- Located in: `src/lib/*/__tests__/`

**E2E Tests (6 files, ~456 lines):**
- Full browser tests via Cypress
- Scope: user workflows from paste input through team report display
- Tests UI rendering, navigation, interactive features
- Located in: `cypress/e2e/`

**Integration Tests:** Not present as a separate category. E2E tests serve as integration verification.

**Component Tests:** Not present. No React Testing Library, no Storybook, no component-level tests.

## Common Patterns

**Testing Pure Functions:**
```typescript
it("calculates standard HP at level 50", () => {
  // floor(((2*108 + 31 + 0) * 50) / 100) + 50 + 10 = 183
  expect(calculateStat("hp", 108, 31, 0, 50, "Jolly")).toBe(183);
});
```

**Testing Validation/Security:**
```typescript
it("blocks obvious profanity", () => {
  expect(containsBlockedWords("this is shit")).toBe(true);
});

it("allows Pokemon names that could be false positives", () => {
  expect(containsBlockedWords("Assault Vest")).toBe(false);
});
```

**Testing Auth:**
```typescript
it("allows Vercel cron user-agent", () => {
  const req = new Request("http://localhost/api/cron/test", {
    headers: { "user-agent": "vercel-cron/1.0" },
  });
  expect(isCronAuthorized(req)).toBe(true);
});
```

**Testing Encoding/Decoding (roundtrip):**
```typescript
// Uses Node.js zlib as polyfill for browser CompressionStream
function encodeSync(state: ShareableState): string {
  const json = JSON.stringify(state);
  const compressed = zlib.deflateRawSync(Buffer.from(json, "utf-8"));
  return "1:" + toBase64Url(new Uint8Array(compressed));
}
```

## CI/CD Test Gates

**Pre-push gates (manual, per CLAUDE.md):**
```bash
npx tsc --noEmit    # TypeScript type checking
npm run build        # Next.js production build
```

**Automated CI:** No GitHub Actions workflow detected. No automated test runs in CI.

**Deployment:** Vercel auto-deploys from `main`. Build must pass (`next build`) but tests are not run as part of the deploy pipeline.

## Test Coverage Gaps

**Not Tested — High Priority:**
- API routes (`src/app/api/`) — 20+ route handlers with no unit tests for request/response logic
- Database operations (`src/lib/db.ts`) — no tests for schema migrations or query logic
- React hooks (`src/hooks/`) — 23 hooks with no unit tests
- React components — no component-level tests (only E2E coverage)

**Not Tested — Medium Priority:**
- `src/lib/cache.ts` — Redis cache layer (graceful degradation untested)
- `src/lib/discord-webhook.ts`, `src/lib/discord-bot.ts` — external integrations
- `src/lib/notifications.ts` — notification system
- `src/lib/linear.ts` — Linear API integration
- `src/lib/security/cors.ts`, `csrf.ts` — security middleware

**Not Tested — Lower Priority:**
- `src/lib/analysis/detect-archetype.ts` — team archetype detection
- `src/lib/data/` files — static data lookups (pokemon, moves, items, abilities)
- Error boundary behavior and error recovery paths

**Summary:**
- ~12 unit test files covering core pure logic (parser, calculator, utilities, auth)
- ~6 E2E specs covering primary user workflows
- ~241 source files total; test coverage is concentrated on `src/lib/` pure functions
- No component tests, no hook tests, no API route tests
- No CI pipeline running tests automatically
- No coverage thresholds or enforcement

---

*Testing analysis: 2026-04-02*
