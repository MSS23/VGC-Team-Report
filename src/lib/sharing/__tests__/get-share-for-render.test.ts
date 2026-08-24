import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { getDb } from "@/lib/db";
import {
  buildRenderableShare,
  getShareForRender,
} from "@/lib/sharing/get-share-for-render";

const PASTE = [
  "Incineroar @ Assault Vest",
  "Ability: Intimidate",
  "Level: 50",
  "Tera Type: Grass",
  "EVs: 252 HP / 4 Atk / 252 SpD",
  "Careful Nature",
  "- Fake Out",
  "- Knock Off",
].join("\n");

function shareRow(overrides: Record<string, unknown> = {}) {
  return {
    data: { paste: PASTE, teamSummary: "Sun team", creatorName: "Ash" },
    is_public: true,
    is_unlisted: false,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-02-01T00:00:00.000Z"),
    ...overrides,
  };
}

/** Tagged-template `sql` stand-in that routes by query text. */
function makeSql(rows: Record<string, unknown>[], collabRows: Record<string, unknown>[] = []) {
  return (strings: TemplateStringsArray) => {
    const q = strings.join(" ? ");
    if (/FROM shares/.test(q)) return Promise.resolve(rows);
    if (/FROM collaborators/.test(q)) return Promise.resolve(collabRows);
    return Promise.resolve([]);
  };
}

beforeEach(() => {
  vi.mocked(getDb).mockReset();
});

describe("buildRenderableShare — server-render visibility gate (VGC-275)", () => {
  it("reports not-found when no row matches", () => {
    expect(buildRenderableShare([])).toEqual({ status: "not-found" });
  });

  it("renders a public report", () => {
    const result = buildRenderableShare([shareRow()]);
    expect(result.status).toBe("visible");
    if (result.status !== "visible") throw new Error("unreachable");
    expect(result.share.isPublic).toBe(true);
    expect(result.share.data.paste).toContain("Incineroar");
    expect(result.share.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(result.share.updatedAt).toBe("2026-02-01T00:00:00.000Z");
  });

  it("renders an unlisted report (link-shareable by design)", () => {
    const result = buildRenderableShare([shareRow({ is_public: false, is_unlisted: true })]);
    expect(result.status).toBe("visible");
    if (result.status !== "visible") throw new Error("unreachable");
    expect(result.share.isPublic).toBe(false);
    expect(result.share.isUnlisted).toBe(true);
  });

  it("REGRESSION: a private report is never server-rendered and leaks no data", () => {
    // Private = neither public nor unlisted. This must match the anonymous
    // branch of GET /api/share/[id], which 404s. If this ever returns the
    // share, the team lands in public, CDN-cacheable HTML.
    const result = buildRenderableShare([shareRow({ is_public: false, is_unlisted: false })]);
    expect(result).toEqual({ status: "private" });
    expect(JSON.stringify(result)).not.toContain("Incineroar");
    expect(JSON.stringify(result)).not.toContain("Sun team");
  });

  it("REGRESSION: null visibility columns are treated as private, not public", () => {
    // A row that never had its flags written must fail closed.
    const result = buildRenderableShare([shareRow({ is_public: null, is_unlisted: null })]);
    expect(result).toEqual({ status: "private" });
  });

  it("applies tiered-publishing redaction — the HTML is the public view", () => {
    const result = buildRenderableShare([
      shareRow({
        data: { paste: PASTE, privateFields: ["evs", "item"] },
      }),
    ]);
    if (result.status !== "visible") throw new Error("expected visible");
    expect(result.share.redactedFields).toEqual(["evs", "item"]);
    expect(result.share.data.paste).not.toContain("252 HP / 4 Atk / 252 SpD");
    expect(result.share.data.paste).not.toContain("Assault Vest");
    // Non-private fields survive.
    expect(result.share.data.paste).toContain("Fake Out");
  });

  it("returns accepted collaborator names", () => {
    const result = buildRenderableShare(
      [shareRow()],
      [{ user_name: "Misty" }, { user_name: "" }, { user_name: 42 }],
    );
    if (result.status !== "visible") throw new Error("expected visible");
    expect(result.share.collaborators).toEqual(["Misty"]);
  });

  it("normalizes legacy report data so the renderer sees current shapes", () => {
    const result = buildRenderableShare([
      shareRow({ data: { paste: PASTE, calcs: { Incineroar: ["252+ Atk hits"] } } }),
    ]);
    if (result.status !== "visible") throw new Error("expected visible");
    expect(result.share.data.calcs).toEqual({
      Incineroar: [{ text: "252+ Atk hits", category: "offensive" }],
    });
    expect(result.share.data.matchupPlans).toEqual([]);
  });
});

describe("getShareForRender", () => {
  it("gates a private row before it ever reaches the renderer", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql([shareRow({ is_public: false, is_unlisted: false })]) as never,
    );
    await expect(getShareForRender("abcd1234")).resolves.toEqual({ status: "private" });
  });

  it("loads a public row with its collaborators", async () => {
    vi.mocked(getDb).mockReturnValue(makeSql([shareRow()], [{ user_name: "Brock" }]) as never);
    const result = await getShareForRender("abcd1234");
    if (result.status !== "visible") throw new Error("expected visible");
    expect(result.share.collaborators).toEqual(["Brock"]);
  });

  it("degrades to not-found instead of throwing when the DB is unavailable", async () => {
    vi.mocked(getDb).mockImplementation(() => {
      throw new Error("no DATABASE_URL");
    });
    await expect(getShareForRender("abcd1234")).resolves.toEqual({ status: "not-found" });
  });
});
