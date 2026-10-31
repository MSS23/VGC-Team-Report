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
const body = {
  state: {
    paste: "Pikachu @ Light Ball\nAbility: Static\n- Protect",
    creatorName: "Trainer",
    matchupPlans: [],
  },
  existingId: "abcd1234",
  editToken: TOKEN,
};

function request(payload: unknown = body) {
  return new Request("https://x.test/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** A body whose commonModes carries one bring combination. */
function bodyWithCombination(leads: number[], back: number[]) {
  return {
    ...body,
    state: {
      ...body.state,
      commonModes: {
        combinations: [{ id: "combo-1", leads, back, strategy: "Set Trick Room" }],
      },
    },
  };
}

function makeSql(isCollaborator: boolean) {
  return (strings: TemplateStringsArray) => {
    const query = strings.join(" ? ");
    if (/SELECT data, COALESCE\(version/.test(query)) {
      return Promise.resolve([{
        data: body.state,
        version: 2,
        is_public: false,
        is_unlisted: true,
        owner_id: "owner-1",
      }]);
    }
    if (/FROM collaborators/.test(query)) {
      return Promise.resolve(isCollaborator ? [{ allowed: 1 }] : []);
    }
    if (/UPDATE shares/.test(query)) {
      return Promise.resolve([{ id: "abcd1234", version: 2, is_public: false, is_unlisted: true }]);
    }
    return Promise.resolve([]);
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/share — account authorization", () => {
  it("rejects every signed-out update even when the edit token is valid", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    vi.mocked(getDb).mockReturnValue(makeSql(false) as never);

    const response = await POST(request());
    expect(response.status).toBe(401);
  });

  it("rejects a different signed-in account holding a valid legacy token", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "outsider-1" } as never);
    vi.mocked(getDb).mockReturnValue(makeSql(false) as never);

    const response = await POST(request());
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("owner or an accepted collaborator"),
    });
  });

  it("allows an accepted account collaborator to update without owning the report", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "collab-1" } as never);
    vi.mocked(getDb).mockReturnValue(makeSql(true) as never);

    const response = await POST(request());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ id: "abcd1234", updated: true });
  });
});

describe("POST /api/share — bounded bring combinations", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue({ userId: "owner-1" } as never);
    vi.mocked(getDb).mockReturnValue(makeSql(false) as never);
  });

  it("accepts a full two-lead, two-back combination", async () => {
    const response = await POST(request(bodyWithCombination([0, 1], [2, 3])));
    expect(response.status).toBe(200);
  });

  it("accepts a partially filled combination", async () => {
    const response = await POST(request(bodyWithCombination([0], [])));
    expect(response.status).toBe(200);
  });

  it("rejects more than two leads — the slide only ever writes two", async () => {
    const response = await POST(request(bodyWithCombination([0, 1, 2], [3])));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "Invalid request body" });
  });

  it("rejects an unbounded index list padded to exhaust the validator", async () => {
    const response = await POST(
      request(bodyWithCombination([0, 1], Array.from({ length: 50_000 }, () => 0))),
    );
    expect(response.status).toBe(400);
  });
});

/**
 * Visibility is an owner-only decision. The stored row below is
 * `is_public: false, is_unlisted: true`, so sending `isUnlisted: false` is a
 * real flip and sending `isUnlisted: true` is a no-op echo.
 *
 * Regression: the owner-only guard covered `isPublic` but not `isUnlisted`, so
 * an accepted collaborator could flip the unlisted flag and change who could
 * reach the report through /s/{id} — a visibility decision, not a content edit.
 */
describe("POST /api/share — only the owner can change visibility", () => {
  it("rejects a collaborator flipping isUnlisted", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "collab-1" } as never);
    vi.mocked(getDb).mockReturnValue(makeSql(true) as never);

    const response = await POST(request({ ...body, isUnlisted: false }));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Only the report owner can change visibility.",
    });
  });

  it("rejects a collaborator flipping isPublic", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "collab-1" } as never);
    vi.mocked(getDb).mockReturnValue(makeSql(true) as never);

    const response = await POST(request({ ...body, isPublic: true }));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Only the report owner can change visibility.",
    });
  });

  it("lets the owner change isUnlisted", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "owner-1" } as never);
    vi.mocked(getDb).mockReturnValue(makeSql(false) as never);

    const response = await POST(request({ ...body, isUnlisted: false }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ id: "abcd1234", updated: true });
  });

  it("lets a collaborator save content while echoing the current flags back", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "collab-1" } as never);
    vi.mocked(getDb).mockReturnValue(makeSql(true) as never);

    // Same values as stored => no visibility change requested => allowed.
    const response = await POST(request({ ...body, isPublic: false, isUnlisted: true }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ id: "abcd1234", updated: true });
  });
});
