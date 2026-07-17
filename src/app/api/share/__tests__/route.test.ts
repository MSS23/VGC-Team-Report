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

function request() {
  return new Request("https://x.test/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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
