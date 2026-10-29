import { describe, it, expect, vi, beforeEach } from "vitest";

// generateMetadata's only external boundary is the DB — mock it and exercise
// the real metadata-shaping logic.
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/sharing/og-image", async (orig) => ({
  ...(await orig<typeof import("@/lib/sharing/og-image")>()),
  getShareOgCard: vi.fn(async () => null),
  scheduleOgImageBackfill: vi.fn(),
}));

import { getDb } from "@/lib/db";
import { getShareOgCard, scheduleOgImageBackfill, ogCardFingerprint } from "@/lib/sharing/og-image";
import { generateMetadata } from "@/app/s/[id]/page";

type Row = Record<string, unknown>;

/** Minimal tagged-template `sql` stand-in: one share row, no collaborators. */
function makeSql(row: Row | null) {
  return (strings: TemplateStringsArray) => {
    const q = strings.join(" ? ");
    if (/FROM shares WHERE id/.test(q)) return Promise.resolve(row ? [row] : []);
    if (/FROM collaborators/.test(q)) return Promise.resolve([]);
    return Promise.resolve([]);
  };
}

const VALID_ID = "abcd1234";

function args(id = VALID_ID, key?: string) {
  return {
    params: Promise.resolve({ id }),
    searchParams: Promise.resolve(key ? { key } : {}),
  };
}

function shareRow(overrides: Row = {}): Row {
  return {
    data: { paste: "Garchomp @ Life Orb\n", creatorName: "Ash" },
    is_public: true,
    is_unlisted: false,
    ...overrides,
  };
}

/** The `types` map Next renders as <link rel="alternate" type=… href=… />. */
function oembedAlternate(meta: Awaited<ReturnType<typeof generateMetadata>>) {
  const types = meta.alternates?.types as
    | Record<string, Array<{ url: string; title?: string }> | undefined>
    | undefined;
  return types?.["application/json+oembed"];
}

beforeEach(() => {
  vi.mocked(getDb).mockReset();
  vi.mocked(scheduleOgImageBackfill).mockClear();
});

describe("generateMetadata /s/[id] — oEmbed discovery link", () => {
  it("advertises /api/oembed with the share URL as the `url` query param", async () => {
    vi.mocked(getDb).mockReturnValue(makeSql(shareRow()) as never);
    const meta = await generateMetadata(args());

    const alternate = oembedAlternate(meta);
    expect(alternate).toHaveLength(1);
    expect(alternate![0].url).toBe(
      `https://pokemonvgcteamreport.com/api/oembed?url=${encodeURIComponent(
        `https://pokemonvgcteamreport.com/s/${VALID_ID}`,
      )}`,
    );
    // Titled so unfurlers can label the endpoint; matches the page title.
    expect(alternate![0].title).toBe(meta.title);
  });

  it("emits a href whose `url` param is a share URL /api/oembed accepts", async () => {
    vi.mocked(getDb).mockReturnValue(makeSql(shareRow()) as never);
    const meta = await generateMetadata(args());

    const href = new URL(oembedAlternate(meta)![0].url);
    expect(href.pathname).toBe("/api/oembed");
    const target = href.searchParams.get("url");
    expect(target).not.toBeNull();
    // The route rejects anything its /\/s\/([A-Za-z0-9]{6,12})/ probe misses.
    expect(target).toMatch(/\/s\/([A-Za-z0-9]{6,12})/);
  });

  it("omits the discovery link for unlisted shares (/api/oembed is public-only)", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql(shareRow({ is_public: false, is_unlisted: true })) as never,
    );
    const meta = await generateMetadata(args());

    expect(oembedAlternate(meta)).toBeUndefined();
    // The canonical is unaffected.
    expect(meta.alternates?.canonical).toBe(
      `https://pokemonvgcteamreport.com/s/${VALID_ID}`,
    );
  });

  it("keeps images empty when no card has been pre-rendered", async () => {
    // `images: []` is load-bearing: it blocks inheritance of the root
    // opengraph-image. Guard it so the oembed work can't regress it.
    vi.mocked(getDb).mockReturnValue(makeSql(shareRow()) as never);
    const meta = await generateMetadata(args());

    expect(meta.openGraph?.images).toEqual([]);
    expect(meta.twitter?.images).toEqual([]);
  });

  it("points og:image at the pre-rendered Blob card when one exists", async () => {
    const row = shareRow();
    const fp = ogCardFingerprint(row.data as Record<string, unknown>);
    vi.mocked(getShareOgCard).mockResolvedValueOnce({ url: `https://blob.example/og/${VALID_ID}.png?v=${fp}`, fp });
    vi.mocked(getDb).mockReturnValue(makeSql(row) as never);
    const meta = await generateMetadata(args());

    const images = meta.openGraph?.images as Array<{ url: string; width: number }>;
    expect(images[0].url).toBe(`https://blob.example/og/${VALID_ID}.png?v=${fp}`);
    expect(images[0].width).toBe(1200);
    expect((meta.twitter as { card?: string }).card).toBe("summary_large_image");
    expect(scheduleOgImageBackfill).not.toHaveBeenCalled();
  });

  it("queues a backfill render when the share has no card yet", async () => {
    vi.mocked(getDb).mockReturnValue(makeSql(shareRow()) as never);
    await generateMetadata(args());
    expect(scheduleOgImageBackfill).toHaveBeenCalledWith(VALID_ID, expect.any(Object), { isPublic: true, isUnlisted: false });
  });
});
