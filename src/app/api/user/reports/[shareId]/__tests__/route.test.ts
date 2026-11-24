import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Regression: flipping a shared report to Private used to leave its already
// published og:image card live on a public, constructible Blob URL
// (og/<shareId>.png), so the species, items, abilities, tera types and event
// placement stayed unfurlable after the owner revoked access. Only the DELETE
// path removed the card. The real removeShareOgImage runs here so the test
// asserts the Blob delete itself, not a stubbed helper.
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: vi.fn() }));

const store = new Map<string, unknown>();
vi.mock("@/lib/cache", () => ({
  cacheGet: vi.fn(async (k: string) => store.get(k) ?? null),
  cacheSet: vi.fn(async (k: string, v: unknown) => { store.set(k, v); }),
  cacheDel: vi.fn(async (k: string) => { store.delete(k); }),
  cacheInvalidatePrefix: vi.fn(async () => undefined),
  CacheKeys: { share: (id: string) => `share:${id}` },
}));
vi.mock("@vercel/blob", () => ({
  put: vi.fn(async (path: string) => ({ url: `https://blob.example/${path}` })),
  del: vi.fn(async () => {}),
}));
// `after()` needs a request scope; the card re-publish is asserted on the spy.
vi.mock("@/lib/sharing/og-image", async (orig) => ({
  ...(await orig<typeof import("@/lib/sharing/og-image")>()),
  schedulePublishShareOgImage: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { del } from "@vercel/blob";
import { schedulePublishShareOgImage } from "@/lib/sharing/og-image";
import { PATCH } from "../route";

const SHARE_ID = "abcd1234";
const TEAM = { paste: "Garchomp @ Life Orb\n", creatorName: "Ash" };

/** Minimal tagged-template `sql` stand-in for the visibility-flip queries. */
function makeSql(resulting: { isPublic: boolean; isUnlisted: boolean }, current = { is_public: true }) {
  return (strings: TemplateStringsArray) => {
    const q = strings.join(" ? ");
    if (/SELECT is_public/.test(q)) {
      return Promise.resolve([{ ...current, tags: { regulation: "M-C" } }]);
    }
    if (/UPDATE shares/.test(q)) {
      return Promise.resolve([{
        id: SHARE_ID,
        is_public: resulting.isPublic,
        is_unlisted: resulting.isUnlisted,
        data: TEAM,
      }]);
    }
    return Promise.resolve([]);
  };
}

function patch(body: unknown) {
  const request = new Request(`https://x.test/api/user/reports/${SHARE_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return PATCH(request, { params: Promise.resolve({ shareId: SHARE_ID }) });
}

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
  process.env.BLOB_READ_WRITE_TOKEN = "test-token";
  vi.mocked(auth).mockResolvedValue({ userId: "owner-1" } as never);
});
afterEach(() => {
  delete process.env.BLOB_READ_WRITE_TOKEN;
});

describe("PATCH /api/user/reports/[shareId] — og:image card revocation", () => {
  it("deletes the published card Blob when a shared report is flipped to Private", async () => {
    store.set(`og:${SHARE_ID}`, { url: `https://blob.example/og/${SHARE_ID}.png?v=abc`, fp: "abc" });
    vi.mocked(getDb).mockReturnValue(makeSql({ isPublic: false, isUnlisted: false }) as never);

    const response = await patch({ isPublic: false, isUnlisted: false });

    expect(response.status).toBe(200);
    expect(del).toHaveBeenCalledWith(`https://blob.example/og/${SHARE_ID}.png`);
    expect(store.has(`og:${SHARE_ID}`)).toBe(false);
    expect(schedulePublishShareOgImage).not.toHaveBeenCalled();
  });

  it("deletes the card Blob by constructed path when the Redis pointer is gone", async () => {
    vi.mocked(getDb).mockReturnValue(makeSql({ isPublic: false, isUnlisted: false }) as never);

    await patch({ isPublic: false });

    expect(del).toHaveBeenCalledWith(`og/${SHARE_ID}.png`);
  });

  it("keeps the card when a partial flip leaves the report unlisted and link-viewable", async () => {
    store.set(`og:${SHARE_ID}`, { url: `https://blob.example/og/${SHARE_ID}.png?v=abc`, fp: "abc" });
    vi.mocked(getDb).mockReturnValue(makeSql({ isPublic: false, isUnlisted: true }) as never);

    await patch({ isPublic: false });

    expect(del).not.toHaveBeenCalled();
    expect(store.has(`og:${SHARE_ID}`)).toBe(true);
  });

  it("re-renders the card when a private report is published again", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({ isPublic: true, isUnlisted: false }, { is_public: false }) as never,
    );

    await patch({ isPublic: true });

    expect(del).not.toHaveBeenCalled();
    expect(schedulePublishShareOgImage).toHaveBeenCalledWith(SHARE_ID, TEAM, {
      isPublic: true,
      isUnlisted: false,
    });
  });
});
