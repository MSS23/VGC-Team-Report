import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Regression tests for the tiered-publishing redaction bypass via
 * POST /api/share/[id]/fork (security audit 16-11-26, HIGH-2).
 *
 * The bug: the fork route spread the raw source `data` into the new share, so
 * the forked row carried the creator's UNREDACTED paste. Because the forker
 * owns the fork, GET /api/share/{forkId} takes the owner branch — which does
 * not redact — and the items / EVs / IVs / nature the creator deliberately hid
 * before an event rendered immediately. One click, no tooling.
 *
 * The fix: a fork made by anyone other than the source owner copies only what
 * that viewer was entitled to see. The owner forking their own report keeps
 * full fidelity.
 */

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/security/input-validation", () => ({ getClientIp: vi.fn(() => "127.0.0.1") }));
vi.mock("@/lib/cache", () => ({ cacheInvalidatePrefix: vi.fn() }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { POST } from "@/app/api/share/[id]/fork/route";

const SOURCE_ID = "src12345";
const SOURCE_OWNER = "user-creator";
const FORKER = "user-forker";

const SECRET_PASTE = `Miraidon @ Choice Specs
Ability: Hadron Engine
Tera Type: Electric
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
IVs: 0 Atk
- Electro Drift
- Draco Meteor
- Volt Switch
- Protect`;

/** The creator hid everything tiered publishing allows. */
const SOURCE_DATA: Record<string, unknown> = {
  paste: SECRET_PASTE,
  creatorName: "SourceCreator",
  tournamentName: "Secret Regional",
  teamSummary: "Hard trick room matchups",
  privateFields: ["item", "evs", "ivs", "nature"],
};

type Captured = { dataJson: string | null };

/**
 * Tagged-template `sql` stand-in that answers the source SELECT and captures
 * the JSON payload the fork INSERT writes into `shares.data`.
 */
function makeSql(captured: Captured, sourceData: Record<string, unknown> = SOURCE_DATA) {
  return (strings: TemplateStringsArray, ...values: unknown[]) => {
    const q = strings.join(" ? ");
    if (/SELECT\s+data, owner_id, is_public/.test(q)) {
      return Promise.resolve([
        { data: sourceData, owner_id: SOURCE_OWNER, is_public: true },
      ]);
    }
    if (/INSERT INTO shares/.test(q)) {
      const json = values.find(
        (v) => typeof v === "string" && v.startsWith("{") && v.includes("paste"),
      );
      captured.dataJson = (json as string) ?? null;
      return Promise.resolve([]);
    }
    return Promise.resolve([]);
  };
}

function req() {
  return new Request(`https://x.test/api/share/${SOURCE_ID}/fork`, { method: "POST" });
}
function params() {
  return { params: Promise.resolve({ id: SOURCE_ID }) };
}

async function fork(
  userId: string,
  sourceData?: Record<string, unknown>,
): Promise<{ res: Response; forkedData: Record<string, unknown> }> {
  const captured: Captured = { dataJson: null };
  vi.mocked(auth).mockResolvedValue({ userId } as never);
  vi.mocked(getDb).mockReturnValue(makeSql(captured, sourceData) as never);
  const res = await POST(req(), params());
  expect(captured.dataJson).toBeTruthy();
  return { res, forkedData: JSON.parse(captured.dataJson as string) };
}

beforeEach(() => {
  vi.mocked(auth).mockReset();
  vi.mocked(getDb).mockReset();
});

describe("POST /api/share/[id]/fork — tiered-publishing redaction", () => {
  it("does not copy the creator's hidden item / EVs / IVs / nature into someone else's fork", async () => {
    const { res, forkedData } = await fork(FORKER);
    expect(res.status).toBe(200);

    const paste = forkedData.paste as string;
    // The concealed values must be absent from the stored fork entirely —
    // the forker owns the row, so nothing downstream will redact it.
    expect(paste).not.toContain("Choice Specs");
    expect(paste).not.toContain("EVs:");
    expect(paste).not.toContain("IVs:");
    expect(paste).not.toContain("Timid Nature");
    // ...and the public shell the viewer could already see is preserved.
    expect(paste).toContain("Miraidon");
    expect(paste).toContain("Ability: Hadron Engine");
    expect(paste).toContain("- Electro Drift");

    // Nothing hidden may survive anywhere else in the payload either.
    expect(JSON.stringify(forkedData)).not.toContain("Choice Specs");

    // A redacted copy has nothing left to hide, so the fork does not inherit
    // the source's privateFields and claim to conceal values it lacks.
    expect(forkedData.privateFields).toBeUndefined();
  });

  it("keeps full fidelity when the owner forks their own report", async () => {
    const { res, forkedData } = await fork(SOURCE_OWNER);
    expect(res.status).toBe(200);

    expect(forkedData.paste).toBe(SECRET_PASTE);
    expect(forkedData.privateFields).toEqual(["item", "evs", "ivs", "nature"]);
  });

  it("copies the paste verbatim for any forker when nothing was marked private", async () => {
    const open = { ...SOURCE_DATA, privateFields: [] };
    const { forkedData } = await fork(FORKER, open);
    expect(forkedData.paste).toBe(SECRET_PASTE);
  });

  it("fails closed when privateFields is not an array (malformed row)", async () => {
    // A string (or any non-array) used to normalize to "nothing is private",
    // silently disabling redaction for the whole report.
    const malformed = { ...SOURCE_DATA, privateFields: "item,evs" };
    const { forkedData } = await fork(FORKER, malformed);
    const paste = forkedData.paste as string;
    expect(paste).not.toContain("Choice Specs");
    expect(paste).not.toContain("EVs:");
    expect(paste).toContain("Miraidon");
  });

  it("still clears the event-specific fields and the creator name", async () => {
    const { forkedData } = await fork(FORKER);
    expect(forkedData.creatorName).toBe("");
    expect(forkedData.tournamentName).toBe("");
    expect(forkedData.teamSummary).toBe("Hard trick room matchups");
  });
});
