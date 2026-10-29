import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const store = new Map<string, unknown>();
vi.mock("@/lib/cache", () => ({
  cacheGet: vi.fn(async (k: string) => store.get(k) ?? null),
  cacheSet: vi.fn(async (k: string, v: unknown) => { store.set(k, v); }),
  cacheDel: vi.fn(async (k: string) => { store.delete(k); }),
  cacheSetIfAbsent: vi.fn(async () => true),
}));
vi.mock("@vercel/blob", () => ({
  put: vi.fn(async (path: string) => ({ url: `https://blob.example/${path}` })),
  del: vi.fn(async () => {}),
}));
vi.mock("@/lib/sharing/team-graphic-image", () => ({
  renderTeamGraphic: vi.fn(() => ({ arrayBuffer: async () => new ArrayBuffer(8) })),
}));
vi.mock("next/server", () => ({ after: vi.fn() }));

import { put, del } from "@vercel/blob";
import { after } from "next/server";
import {
  publishShareOgImage,
  removeShareOgImage,
  getShareOgCard,
  ogCardFingerprint,
  schedulePublishShareOgImage,
} from "@/lib/sharing/og-image";

const data = { paste: "Garchomp @ Life Orb\n", creatorName: "Ash" };
const PUBLIC = { isPublic: true, isUnlisted: false };

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
  process.env.BLOB_READ_WRITE_TOKEN = "test-token";
});
afterEach(() => {
  delete process.env.BLOB_READ_WRITE_TOKEN;
});

describe("og image pre-render", () => {
  it("renders once, stores the Blob URL with a cache-busting version, and skips unchanged cards", async () => {
    await publishShareOgImage("abc", data, PUBLIC);
    expect(put).toHaveBeenCalledTimes(1);
    expect(vi.mocked(put).mock.calls[0][0]).toBe("og/abc.png");
    const card = await getShareOgCard("abc");
    expect(card?.url).toBe(`https://blob.example/og/abc.png?v=${ogCardFingerprint(data)}`);

    // An autosave that doesn't change what the card shows does no work.
    await publishShareOgImage("abc", { ...data, notes: { x: 1 } }, PUBLIC);
    expect(put).toHaveBeenCalledTimes(1);

    // A change the card shows re-renders it.
    await publishShareOgImage("abc", { ...data, placement: "1st" }, PUBLIC);
    expect(put).toHaveBeenCalledTimes(2);
  });

  it("deletes the public Blob when a report goes private", async () => {
    await publishShareOgImage("abc", data, PUBLIC);
    await publishShareOgImage("abc", data, { isPublic: false, isUnlisted: false });
    expect(del).toHaveBeenCalledWith("https://blob.example/og/abc.png");
    expect(await getShareOgCard("abc")).toBeNull();
  });

  it("renders unlisted reports, since they are link-viewable", async () => {
    await publishShareOgImage("abc", data, { isPublic: false, isUnlisted: true });
    expect(put).toHaveBeenCalledTimes(1);
  });

  it("is a no-op without a Blob token (text-only unfurl fallback)", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    await publishShareOgImage("abc", data, PUBLIC);
    schedulePublishShareOgImage("abc", data, PUBLIC);
    await removeShareOgImage("abc");
    expect(put).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
    expect(await getShareOgCard("abc")).toBeNull();
  });

  it("never lets a Blob failure escape", async () => {
    vi.mocked(put).mockRejectedValueOnce(new Error("blob down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(publishShareOgImage("abc", data, PUBLIC)).resolves.toBeUndefined();
    expect(await getShareOgCard("abc")).toBeNull();
    spy.mockRestore();
  });
});
