/**
 * VGC-245 — "The information in the Modes' section seems not to be saving".
 *
 * The /api/share POST body used to be validated by a hand-maintained zod schema
 * that duplicated `ShareableStateSchema` (src/lib/sharing/url-codec.ts).
 * z.object() strips unknown keys, so any key present on the client state but
 * absent from the API schema was silently deleted before the row was written —
 * the request still returned 200 and the client still showed "saved", but the
 * data was gone on the next load.
 *
 * This bit `commonModes` wholesale once (fixed in v5.23) and then bit the
 * nested `commonModes.combinations` array when the Common Combinations table
 * shipped in v5.24 without updating the duplicate. Drafts had already been
 * switched to the canonical schema, so drafts persisted and shares did not —
 * which is why the user experienced it as intermittent.
 *
 * These tests pin the full round trip of the Modes payload through the route's
 * validation and into the JSON handed to Postgres, and pin the share/draft
 * schemas together so they cannot drift apart again.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(), currentUser: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ notifyFollowers: vi.fn() }));
vi.mock("@/lib/utils/diff-state", () => ({ detectChangedSections: vi.fn(() => []) }));
vi.mock("@/lib/cache", () => ({
  cacheInvalidatePrefix: vi.fn(async () => undefined),
  cacheDel: vi.fn(async () => undefined),
  CacheKeys: { share: (id: string) => `share:${id}` },
}));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { POST } from "@/app/api/share/route";

const TOKEN = "a".repeat(64);
const SHARE_ID = "abcd1234";

/** A Modes section exactly as CommonModesSlide emits it after v5.24. */
const COMMON_MODES = {
  combinations: [
    {
      id: "1f0f6a2e-0000-4000-8000-000000000001",
      leads: [0, 3],
      back: [1, 4],
      strategy: "Lead Trick Room, bring the bulky back once Tailwind is up.",
    },
    {
      id: "1f0f6a2e-0000-4000-8000-000000000002",
      leads: [2],
      back: [],
      strategy: "Speed-control mirror.",
    },
  ],
  strengths: "Great into Trick Room.",
  weaknesses: "Struggles vs sun.",
  gameplan: "Win the speed war, then chip.",
  // Legacy free-text kept by the v5.24 "Legacy notes" block — must survive too.
  leads: "Old leads text",
  modes: "Old modes text",
};

function buildBody(commonModes: unknown) {
  return {
    state: {
      paste: "Pikachu @ Light Ball\nAbility: Static\n- Protect",
      creatorName: "Trainer",
      matchupPlans: [],
      commonModes,
    },
    existingId: SHARE_ID,
    editToken: TOKEN,
  };
}

function request(commonModes: unknown) {
  return new Request("https://x.test/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildBody(commonModes)),
  });
}

/**
 * Neon's `sql` tagged template. Captures the JSON blob handed to the
 * `UPDATE shares SET data = ...` statement so we can assert on exactly what
 * would land in Postgres.
 */
function makeSql(captured: { data?: Record<string, unknown> }) {
  return (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.join(" ? ");
    if (/SELECT data, COALESCE\(version/.test(query)) {
      return Promise.resolve([{
        data: { paste: "", creatorName: "Trainer" },
        version: 2,
        is_public: false,
        is_unlisted: true,
        owner_id: "owner-1",
      }]);
    }
    if (/UPDATE shares/.test(query)) {
      captured.data = JSON.parse(values[0] as string);
      return Promise.resolve([{ id: SHARE_ID, version: 2, is_public: false, is_unlisted: true }]);
    }
    return Promise.resolve([]);
  };
}

async function saveAndCapture(commonModes: unknown) {
  const captured: { data?: Record<string, unknown> } = {};
  vi.mocked(auth).mockResolvedValue({ userId: "owner-1" } as never);
  vi.mocked(getDb).mockReturnValue(makeSql(captured) as never);

  const response = await POST(request(commonModes));
  expect(response.status).toBe(200);
  return captured.data;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("VGC-245: the Modes section must survive the save round trip", () => {
  it("persists commonModes.combinations instead of silently stripping it", async () => {
    const written = await saveAndCapture(COMMON_MODES);

    // The regression: the API schema listed only the free-text keys, so zod
    // dropped `combinations` here while the response still said 200/saved.
    expect(written?.commonModes).toEqual(COMMON_MODES);
    const combos = (written?.commonModes as typeof COMMON_MODES).combinations;
    expect(combos).toHaveLength(2);
    expect(combos[0]).toEqual(COMMON_MODES.combinations[0]);
  });

  it("keeps the legacy leads/modes free text for pre-v5.24 reports", async () => {
    const legacyOnly = { leads: "Old leads text", modes: "Old modes text" };
    const written = await saveAndCapture(legacyOnly);

    expect(written?.commonModes).toEqual(legacyOnly);
  });

  it("round-trips an empty combinations list without dropping the key", async () => {
    const written = await saveAndCapture({ combinations: [], gameplan: "TBD" });

    expect(written?.commonModes).toEqual({ combinations: [], gameplan: "TBD" });
  });

  it("stays in lockstep with ShareableStateSchema's commonModes keys", async () => {
    // A structural guard: if url-codec grows another commonModes key, this
    // fails unless the route accepts it too — the exact drift that caused this
    // bug twice. It passes for free now that the route derives its schema from
    // ShareableStateSchema instead of redeclaring it.
    const { ShareableStateSchema } = await vi.importActual<
      typeof import("@/lib/sharing/url-codec")
    >("@/lib/sharing/url-codec");

    const canonical = ShareableStateSchema.shape.commonModes.unwrap();
    const canonicalKeys = Object.keys(canonical.shape).sort();

    const probe = Object.fromEntries(
      canonicalKeys.map((key) => [key, key === "combinations" ? [] : `${key} value`]),
    );
    const written = await saveAndCapture(probe);

    expect(Object.keys(written?.commonModes as object).sort()).toEqual(canonicalKeys);
  });
});

describe("VGC-245: shares and drafts must not diverge", () => {
  /**
   * The user hit this as an intermittent bug: /api/user/drafts validates with
   * ShareableStateSchema (canonical) and kept `combinations`, while /api/share
   * used a stale local copy and dropped it. Assert both paths agree on the
   * same payload.
   */
  it("the draft schema and the share route preserve the identical Modes payload", async () => {
    const { ShareableStateSchema } = await vi.importActual<
      typeof import("@/lib/sharing/url-codec")
    >("@/lib/sharing/url-codec");

    const draftParsed = ShareableStateSchema.parse({
      paste: "Pikachu @ Light Ball\nAbility: Static\n- Protect",
      notes: {},
      matchupPlans: [],
      creatorName: "Trainer",
      commonModes: COMMON_MODES,
    });

    const sharedWritten = await saveAndCapture(COMMON_MODES);

    expect(draftParsed.commonModes).toEqual(COMMON_MODES);
    expect(sharedWritten?.commonModes).toEqual(draftParsed.commonModes);
  });
});

describe("VGC-245: deriving from the canonical schema must not tighten the write path", () => {
  /**
   * The route's schema is deliberately looser than the canonical one for a few
   * fields. A save must never 400 because an older client sent a legacy shape —
   * that would turn a silent-drop bug into a total save outage.
   */
  it("still accepts legacy state shapes (numeric hiddenSlides, planA matchup plans)", async () => {
    const captured: { data?: Record<string, unknown> } = {};
    vi.mocked(auth).mockResolvedValue({ userId: "owner-1" } as never);
    vi.mocked(getDb).mockReturnValue(makeSql(captured) as never);

    const legacy = {
      state: {
        paste: "Pikachu @ Light Ball\nAbility: Static\n- Protect",
        creatorName: "Trainer",
        notes: { Pikachu: { text: "object-shaped legacy note" } },
        hiddenSlides: [0, 2, "matchup-1"],
        matchupPlans: [
          { opponentPaste: "", opponentLabel: "Rain", planA: { lead: [0, 1], back: [2, 3] } },
        ],
        commonModes: COMMON_MODES,
      },
      existingId: SHARE_ID,
      editToken: TOKEN,
    };

    const response = await POST(
      new Request("https://x.test/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(legacy),
      }),
    );

    expect(response.status).toBe(200);
    expect(captured.data?.commonModes).toEqual(COMMON_MODES);
    expect(captured.data?.hiddenSlides).toEqual([0, 2, "matchup-1"]);
  });
});

describe("VGC-245: a combinations-only edit still registers as a change", () => {
  it("detectChangedSections reports 'How to play' when only combinations differ", async () => {
    const { detectChangedSections } = await vi.importActual<
      typeof import("@/lib/utils/diff-state")
    >("@/lib/utils/diff-state");

    const oldState = { paste: "p", commonModes: { combinations: [] } };
    const newState = { paste: "p", commonModes: { combinations: COMMON_MODES.combinations } };

    expect(detectChangedSections(oldState, newState)).toContain("How to play");
  });
});
