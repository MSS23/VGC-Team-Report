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

function request(overrides: Record<string, unknown> = {}) {
  return new Request("https://x.test/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, ...overrides }),
  });
}

/**
 * `current` is the stored row's visibility, so a test can start from a
 * Private report and check what a collaborator is allowed to change.
 */
function makeSql(
  isCollaborator: boolean,
  current: { is_public?: boolean; is_unlisted?: boolean } = {},
  writes?: Record<string, unknown>[],
) {
  const isPublic = current.is_public ?? false;
  const isUnlisted = current.is_unlisted ?? true;
  return (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.join(" ? ");
    if (/SELECT data, COALESCE\(version/.test(query)) {
      return Promise.resolve([{
        data: body.state,
        version: 2,
        is_public: isPublic,
        is_unlisted: isUnlisted,
        owner_id: "owner-1",
      }]);
    }
    if (/FROM collaborators/.test(query)) {
      return Promise.resolve(isCollaborator ? [{ allowed: 1 }] : []);
    }
    if (/UPDATE shares/.test(query)) {
      writes?.push({ query, values });
      return Promise.resolve([{ id: "abcd1234", version: 2, is_public: isPublic, is_unlisted: isUnlisted }]);
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

/**
 * Regression: "a collaborator can change a report's unlisted status".
 * The owner-only visibility guard covered `isPublic` but not `isUnlisted`, so
 * an accepted collaborator could POST `{ isUnlisted: true }` and publish the
 * owner's Private report by link — or un-unlist one the owner deliberately
 * shared. Visibility is the owner's decision alone.
 */
describe("POST /api/share — is_unlisted is owner-gated like is_public", () => {
  it("rejects a collaborator flipping a private report to unlisted", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "collab-1" } as never);
    vi.mocked(getDb).mockReturnValue(
      makeSql(true, { is_public: false, is_unlisted: false }) as never,
    );

    const response = await POST(request({ isUnlisted: true }));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("Only the report owner can change visibility"),
    });
  });

  it("rejects a collaborator un-unlisting a report the owner shared by link", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "collab-1" } as never);
    vi.mocked(getDb).mockReturnValue(
      makeSql(true, { is_public: false, is_unlisted: true }) as never,
    );

    const response = await POST(request({ isUnlisted: false }));
    expect(response.status).toBe(403);
  });

  it("still lets a collaborator autosave content, preserving the unlisted flag", async () => {
    // The guard must only fire on an explicit CHANGE — a plain content save
    // that omits the flag has to keep working, and must not demote the report.
    const writes: Record<string, unknown>[] = [];
    vi.mocked(auth).mockResolvedValue({ userId: "collab-1" } as never);
    vi.mocked(getDb).mockReturnValue(
      makeSql(true, { is_public: false, is_unlisted: true }, writes) as never,
    );

    const response = await POST(request());
    expect(response.status).toBe(200);
    // is_public, is_unlisted are the 3rd and 4th bound values of the UPDATE.
    expect((writes[0].values as unknown[])[3]).toBe(true);
  });

  it("lets a collaborator echo the unchanged unlisted value back", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "collab-1" } as never);
    vi.mocked(getDb).mockReturnValue(
      makeSql(true, { is_public: false, is_unlisted: true }) as never,
    );

    const response = await POST(request({ isUnlisted: true }));
    expect(response.status).toBe(200);
  });

  it("lets the owner change the unlisted flag", async () => {
    const writes: Record<string, unknown>[] = [];
    vi.mocked(auth).mockResolvedValue({ userId: "owner-1" } as never);
    vi.mocked(getDb).mockReturnValue(
      makeSql(false, { is_public: false, is_unlisted: true }, writes) as never,
    );

    const response = await POST(request({ isUnlisted: false }));
    expect(response.status).toBe(200);
    expect((writes[0].values as unknown[])[3]).toBe(false);
  });
});
