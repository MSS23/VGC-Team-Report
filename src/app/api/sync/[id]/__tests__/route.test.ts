import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock every external boundary the SSE handler touches so we exercise the real
// poll → fetch → serialize path against an in-memory "database".
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { GET } from "@/app/api/sync/[id]/route";

type Row = Record<string, unknown>;

const VALID_ID = "abcd1234";

/**
 * A minimal tagged-template `sql` stand-in, routed by query text:
 * - presence counts         → zero collaborators
 * - the full `data` read    → the stored share row
 * - the version/is_public meta read → version + visibility
 * - everything else (`SELECT 1 FROM shares s` access checks) → allowed
 */
function makeSql(row: Row, version = 2) {
  return (strings: TemplateStringsArray) => {
    const q = strings.join(" ? ");
    if (/collaboration_presence/.test(q)) return Promise.resolve([{ count: 0 }]);
    if (/SELECT\s+data/.test(q)) return Promise.resolve([{ data: row, version }]);
    if (/is_public/.test(q)) return Promise.resolve([{ version, is_public: true }]);
    return Promise.resolve([{ ok: 1 }]);
  };
}

function req(url = `https://x.test/api/sync/${VALID_ID}?session=abc`) {
  return new Request(url);
}
function params(id = VALID_ID) {
  return { params: Promise.resolve({ id }) };
}

/**
 * Drive one 5s poll cycle and return the parsed `version` frame, or null if the
 * stream emitted no version event.
 */
async function firstVersionFrame(res: Response): Promise<Record<string, unknown> | null> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let stop = false;
  const pump = (async () => {
    while (!stop) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
    }
  })();
  await vi.advanceTimersByTimeAsync(5000);
  // Unblock the pending read(): a cancelled reader resolves it with done.
  stop = true;
  await reader.cancel().catch(() => {});
  await pump;

  const match = buffer.match(/event: version\ndata: (.*)\n\n/);
  return match ? (JSON.parse(match[1]) as Record<string, unknown>) : null;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(auth).mockReset();
  vi.mocked(getDb).mockReset();
  vi.mocked(auth).mockResolvedValue({ userId: "user_1" } as never);
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("GET /api/sync/[id] — access control", () => {
  it("rejects a malformed share id", async () => {
    vi.mocked(getDb).mockReturnValue(makeSql({}) as never);
    const res = await GET(req("https://x.test/api/sync/BAD"), params("BAD"));
    expect(res.status).toBe(400);
  });

  it("requires a signed-in account", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    vi.mocked(getDb).mockReturnValue(makeSql({}) as never);
    const res = await GET(req(), params());
    expect(res.status).toBe(401);
  });
});

describe("GET /api/sync/[id] — BUG-SYNC-UNNORMALIZED: unmigrated legacy data reached the live editor over SSE", () => {
  /**
   * Regression for the bug: `/api/sync` shipped the raw `shares.data` jsonb as
   * `state`, skipping `normalizeReportData()` — which both other access paths
   * (`GET /api/share/{id}` and the batch migration route) run. A legacy-shaped
   * row therefore reached the live collaborative editor unmigrated and was
   * saved back in that shape, silently reverting the migration.
   */
  it("normalises a legacy-shaped stored row before it goes on the wire", async () => {
    const legacyRow = {
      paste: "Garchomp @ Life Orb\nAbility: Rough Skin\n",
      // Legacy: calcs stored as plain strings, not {text, category}
      calcs: { Garchomp: ["252+ Atk Garchomp EQ vs 0 HP Flutter Mane: 110%"] },
      // Legacy: pre-gamePlans planA/planB shape
      matchupPlans: [
        {
          opponentPaste: "Miraidon @ Choice Specs\n",
          opponentLabel: "Miraidon",
          planA: { lead: [0, 1], back: [2, 3] },
          notes: "Lead Chomp",
        },
      ],
      // Legacy: spreadNotes not yet merged into notes
      notes: { Garchomp: "Max speed" },
      spreadNotes: { Garchomp: "Outspeeds base 100s" },
    };
    vi.mocked(getDb).mockReturnValue(makeSql(legacyRow) as never);

    const res = await GET(req(), params());
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");

    const frame = await firstVersionFrame(res);
    expect(frame).not.toBeNull();
    const state = frame!.state as Record<string, unknown>;

    // calcs migrated to {text, category}
    expect(state.calcs).toEqual({
      Garchomp: [{ text: "252+ Atk Garchomp EQ vs 0 HP Flutter Mane: 110%", category: "offensive" }],
    });

    // planA migrated into gamePlans[0].bring
    expect(state.matchupPlans).toEqual([
      {
        opponentPaste: "Miraidon @ Choice Specs\n",
        opponentLabel: "Miraidon",
        showSlide: undefined,
        gamePlans: [{ bring: [0, 1, 2, 3], notes: "Lead Chomp" }],
      },
    ]);

    // spreadNotes merged into notes and removed from the payload
    expect(state.notes).toEqual({ Garchomp: "Max speed\n\nOutspeeds base 100s" });
    expect(state).not.toHaveProperty("spreadNotes");
  });

  it("round-trips a current-shaped row unchanged (no regression)", async () => {
    const currentRow = {
      paste: "Garchomp @ Life Orb\n",
      notes: { Garchomp: "Max speed" },
      calcs: { Garchomp: [{ text: "110%", category: "offensive" }] },
      roles: { Garchomp: "Physical attacker" },
      teamSummary: "Sand",
      mvpIndex: 0,
      hiddenSlides: [],
      allowComments: false,
      matchupPlans: [
        {
          opponentPaste: "Miraidon @ Choice Specs\n",
          opponentLabel: "Miraidon",
          gamePlans: [{ bring: [0, 1, 2, 3], notes: "Lead Chomp" }],
        },
      ],
    };
    vi.mocked(getDb).mockReturnValue(makeSql(currentRow) as never);

    const frame = await firstVersionFrame(await GET(req(), params()));
    const state = frame!.state as Record<string, unknown>;

    expect(state.paste).toBe(currentRow.paste);
    expect(state.notes).toEqual(currentRow.notes);
    expect(state.calcs).toEqual(currentRow.calcs);
    expect(state.roles).toEqual(currentRow.roles);
    expect(state.teamSummary).toBe("Sand");
    expect(state.mvpIndex).toBe(0);
    expect(state.matchupPlans).toEqual([
      {
        opponentPaste: "Miraidon @ Choice Specs\n",
        opponentLabel: "Miraidon",
        showSlide: undefined,
        gamePlans: [{ bring: [0, 1, 2, 3], notes: "Lead Chomp", result: undefined }],
      },
    ]);
  });

  it("keeps the version/isPublic envelope intact so client catch-up still works", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({ paste: "x", notes: {}, matchupPlans: [] }, 7) as never,
    );
    const frame = await firstVersionFrame(await GET(req(), params()));
    expect(frame!.version).toBe(7);
    expect(frame!.isPublic).toBe(true);
  });

  it("sends nothing when the client already knows the server version (?since)", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({ paste: "x", notes: {}, matchupPlans: [] }, 7) as never,
    );
    const res = await GET(
      req(`https://x.test/api/sync/${VALID_ID}?session=abc&since=7`),
      params(),
    );
    expect(await firstVersionFrame(res)).toBeNull();
  });
});
