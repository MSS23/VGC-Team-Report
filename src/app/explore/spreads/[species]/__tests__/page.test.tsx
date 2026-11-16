import { describe, expect, it, vi } from "vitest";

/**
 * Render-level cover for the two states the landing page can be in. The
 * aggregation maths lives in `src/lib/spreads/__tests__/species-spreads.test.ts`;
 * what matters here is that the populated page actually prints the
 * percentages and `Dataset` JSON-LD, and that the no-database path renders an
 * honest empty state with NO Dataset markup — an empty Dataset node, or one
 * built from placeholder numbers, would be structured-data spam.
 *
 * No live database: `@/lib/db` is mocked in every case.
 */

const INCINEROAR_PASTE = [
  "Incineroar @ Safety Goggles",
  "Ability: Intimidate",
  "EVs: 252 HP / 4 Atk / 252 Def",
  "Impish Nature",
  "- Fake Out",
  "- Knock Off",
].join("\n");

async function renderPage(slug: string) {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { default: Page } = await import("@/app/explore/spreads/[species]/page");
  const element = await Page({ params: Promise.resolve({ species: slug }) });
  return renderToStaticMarkup(element);
}

function mockDbRows(rows: unknown[]) {
  vi.doMock("@/lib/db", () => ({ getDb: () => () => Promise.resolve(rows) }));
}

function mockDbDown() {
  vi.doMock("@/lib/db", () => ({
    getDb: () => {
      throw new Error("No database connection string was provided");
    },
  }));
}

describe("/explore/spreads/[species] — populated", () => {
  it("prints the spread, its share of reports and an example report link", async () => {
    vi.resetModules();
    mockDbRows([
      { id: "rep-aaa", data: { paste: INCINEROAR_PASTE, creatorName: "Ada" } },
      { id: "rep-bbb", data: { paste: INCINEROAR_PASTE, creatorName: "Bo" } },
      {
        id: "rep-ccc",
        data: { paste: INCINEROAR_PASTE.replace("252 Def", "252 SpD"), creatorName: "Cy" },
      },
    ]);

    const html = await renderPage("incineroar");

    expect(html).toContain("Incineroar EV Spreads");
    expect(html).toContain("252 HP / 4 Atk / 252 Def");
    expect(html).toContain("66.7%");
    expect(html).toContain("2 of 3 reports");
    expect(html).toContain("Impish");
    expect(html).toContain("Safety Goggles");
    expect(html).toContain("/s/rep-aaa");
    // Aggregated from 3 public reports — the honest denominator.
    expect(html).toContain("Aggregated from 3 public reports");
    // Exactly one h1.
    expect(html.match(/<h1/g)).toHaveLength(1);

    vi.doUnmock("@/lib/db");
    vi.resetModules();
  });

  it("emits Dataset JSON-LD whose percentages match the rendered rows", async () => {
    vi.resetModules();
    mockDbRows([
      { id: "rep-aaa", data: { paste: INCINEROAR_PASTE } },
      { id: "rep-bbb", data: { paste: INCINEROAR_PASTE } },
    ]);

    const html = await renderPage("incineroar");
    const payloads = [
      // `[\s\S]` rather than the `s` flag — tsconfig targets pre-ES2018.
      ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
    ].map((m) => m[1]);
    const raw = payloads.find((p) => p.includes('"Dataset"'));
    expect(raw).toBeDefined();

    const dataset = JSON.parse(raw!.replace(/\\u003c/g, "<"));
    expect(dataset["@type"]).toBe("Dataset");
    expect(dataset.url).toBe(
      "https://pokemonvgcteamreport.com/explore/spreads/incineroar",
    );
    const measured = dataset.variableMeasured as { name: string; value: number }[];
    expect(measured[0]).toMatchObject({ name: "Reports fielding this species", value: 2 });
    expect(measured[1]).toMatchObject({
      name: "252 HP / 4 Atk / 252 Def (EVs)",
      value: 100,
      unitText: "PERCENT",
    });

    vi.doUnmock("@/lib/db");
    vi.resetModules();
  });
});

describe("/explore/spreads/[species] — no data", () => {
  it("renders an honest unavailable state and no Dataset markup when the database is down", async () => {
    vi.resetModules();
    mockDbDown();

    const html = await renderPage("incineroar");

    expect(html).toContain("temporarily unavailable");
    expect(html).not.toContain('"Dataset"');
    // No invented aggregate: no report count, and no spread rows at all.
    expect(html).not.toContain("Aggregated from");
    expect(html).not.toContain("<ol");
    // No usage bars either — nothing to draw a bar from.
    expect(html).not.toContain("h-full rounded-full bg-accent");

    vi.doUnmock("@/lib/db");
    vi.resetModules();
  });

  it("says plainly that no reports field the species when the query returns nothing", async () => {
    vi.resetModules();
    mockDbRows([]);

    const html = await renderPage("incineroar");

    expect(html).toContain("No public team reports");
    expect(html).not.toContain('"Dataset"');

    vi.doUnmock("@/lib/db");
    vi.resetModules();
  });
});

describe("/explore/spreads/[species] — untrusted segment", () => {
  it("404s on a slug outside the species catalogue without touching the database", async () => {
    vi.resetModules();
    const getDb = vi.fn();
    vi.doMock("@/lib/db", () => ({ getDb }));

    await expect(renderPage("'; DROP TABLE shares; --")).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/);
    expect(getDb).not.toHaveBeenCalled();

    vi.doUnmock("@/lib/db");
    vi.resetModules();
  });
});
