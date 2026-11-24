/**
 * VGC-318 (first half): /s/[id] must server-render the team, and must not
 * server-render anything for a report the creator did not make public.
 *
 * `/s/[id]` was a client-redirect shell: ~5,000 sitemapped share URLs resolved
 * to a spinner with no crawlable content, and a recipient on a cold mobile
 * connection saw nothing until the bundle and a Neon round trip had landed.
 * These tests pin both halves of the fix — content for public reports, silence
 * for everything else — plus the redaction and degradation behaviour that make
 * it safe.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Children, isValidElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
// Only useRouter is stubbed — notFound/unstable_rethrow stay real, because the
// page's degradation behaviour depends on them.
vi.mock("next/navigation", async (orig) => ({
  ...(await orig<typeof import("next/navigation")>()),
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/lib/sharing/og-image", async (orig) => ({
  ...(await orig<typeof import("@/lib/sharing/og-image")>()),
  getShareOgCard: vi.fn(async () => null),
  scheduleOgImageBackfill: vi.fn(),
}));

import { getDb } from "@/lib/db";
import SharePage from "@/app/s/[id]/page";
import { ShareHero, buildShareHeroProps, type ShareHeroProps } from "@/app/s/[id]/hero";
import { ShareRedirectClient } from "@/app/s/[id]/redirect";

type Row = Record<string, unknown>;

const VALID_ID = "abcd1234";

const PASTE = [
  "Incineroar @ Safety Goggles",
  "Ability: Intimidate",
  "Level: 50",
  "EVs: 252 HP / 4 Atk / 252 SpD",
  "Careful Nature",
  "- Fake Out",
  "",
  "Flutter Mane @ Booster Energy",
  "Ability: Protosynthesis",
  "Timid Nature",
  "- Moonblast",
].join("\n");

/** Minimal tagged-template `sql` stand-in: one share row, named collaborators. */
function makeSql(row: Row | null, collaborators: string[] = []) {
  return (strings: TemplateStringsArray) => {
    const q = strings.join(" ? ");
    if (/FROM shares WHERE id/.test(q)) return Promise.resolve(row ? [row] : []);
    if (/FROM collaborators/.test(q)) {
      return Promise.resolve(collaborators.map((user_name) => ({ user_name })));
    }
    return Promise.resolve([]);
  };
}

function shareRow(overrides: Row = {}): Row {
  return {
    data: {
      paste: PASTE,
      creatorName: "Ash",
      tournamentName: "Stockholm Regional",
      placement: "Top 8",
      record: "7-2",
      teamSummary: "Trick Room Incineroar balance built for the Flutter Mane matchup.",
      tags: { regulation: "Reg M-C" },
    },
    is_public: true,
    is_unlisted: false,
    created_at: new Date("2026-11-01T00:00:00Z"),
    updated_at: new Date("2026-11-02T00:00:00Z"),
    ...overrides,
  };
}

/** Every element in a returned server-component tree, depth first. */
function flatten(node: unknown): ReactElement[] {
  const out: ReactElement[] = [];
  for (const child of Children.toArray(node as never)) {
    if (!isValidElement(child)) continue;
    out.push(child);
    out.push(...flatten((child.props as { children?: unknown }).children));
  }
  return out;
}

function findByType(tree: unknown, type: unknown): ReactElement | undefined {
  return flatten(tree).find((el) => el.type === type);
}

async function renderPage(row: Row | null, collaborators: string[] = []) {
  vi.mocked(getDb).mockReturnValue(makeSql(row, collaborators) as never);
  const tree = await SharePage({ params: Promise.resolve({ id: VALID_ID }) });
  const heroElement = findByType(tree, ShareHero);
  const redirectElement = findByType(tree, ShareRedirectClient);
  return {
    heroProps: (heroElement?.props ?? null) as ShareHeroProps | null,
    redirectProps: (redirectElement?.props ?? null) as
      | { to: string; heading?: string; silent?: boolean }
      | null,
  };
}

beforeEach(() => {
  vi.mocked(getDb).mockReset();
});

describe("/s/[id] — public reports render real content on the server", () => {
  it("renders a content hero instead of only a redirect shell", async () => {
    const { heroProps, redirectProps } = await renderPage(shareRow(), ["Brock"]);

    expect(heroProps).not.toBeNull();
    expect(heroProps!.species).toEqual(["Incineroar", "Flutter Mane"]);
    expect(heroProps!.heading).toBe("Stockholm Regional");
    expect(heroProps!.collaborators).toEqual(["Brock"]);
    // The redirect to the interactive report must still be mounted.
    expect(redirectProps?.to).toBe(`/?s=${VALID_ID}`);
  });

  it("hands the redirect no UI of its own, so the hero is not replaced by a spinner", async () => {
    const { redirectProps } = await renderPage(shareRow());

    expect(redirectProps?.silent).toBe(true);
    expect(renderToStaticMarkup(<ShareRedirectClient to="/?s=x" heading="T" silent />)).toBe("");
  });

  it("puts the team in the HTML: one h1, sprites, byline, summary and a link to the report", async () => {
    const { heroProps } = await renderPage(shareRow(), ["Brock"]);
    const html = renderToStaticMarkup(<ShareHero {...heroProps!} />);

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("Stockholm Regional");
    expect(html).toContain("Incineroar");
    expect(html).toContain("Flutter Mane");
    expect(html).toContain("sprites/home/incineroar.png");
    expect(html).toContain("sprites/home/fluttermane.png");
    expect(html).toContain("Top 8");
    expect(html).toContain("7-2");
    expect(html).toContain("by Ash with Brock");
    expect(html).toContain("Reg M-C");
    expect(html).toContain("Trick Room Incineroar balance");
    expect(html).toContain(`href="/?s=${VALID_ID}"`);
    expect(html).not.toContain("undefined");
  });

  it("keeps the CTA keyboard-reachable at a 44px target", async () => {
    const { heroProps } = await renderPage(shareRow());
    const html = renderToStaticMarkup(<ShareHero {...heroProps!} />);

    // Global focus styling is applied via globals.css :focus-visible; the
    // touch target is the part that has to live on the element.
    expect(html).toContain("min-h-[44px]");
    expect(html).toContain("max-w-5xl");
  });

  it("truncates a long creator summary rather than dumping it into the page", async () => {
    const summary = `${"Sun teams fold to this lead ".repeat(20)}end`;
    const { heroProps } = await renderPage(shareRow({ data: { paste: PASTE, teamSummary: summary } }));

    expect(heroProps!.summary.length).toBeLessThanOrEqual(221);
    expect(heroProps!.summary.endsWith("…")).toBe(true);
  });
});

describe("/s/[id] — privacy gate on the server-rendered hero", () => {
  it("renders no hero for a private report, and keeps the old redirect shell", async () => {
    const { heroProps, redirectProps } = await renderPage(
      shareRow({ is_public: false, is_unlisted: false }),
    );

    expect(heroProps).toBeNull();
    expect(redirectProps?.silent).toBe(false);
    expect(redirectProps?.to).toBe(`/?s=${VALID_ID}`);
    // Not even the team name leaks into the fallback heading.
    expect(redirectProps?.heading).toBe("VGC Team Report");
  });

  it("renders no hero for an unlisted report (link-only by design, and noindex)", async () => {
    const { heroProps, redirectProps } = await renderPage(
      shareRow({ is_public: false, is_unlisted: true }),
    );

    expect(heroProps).toBeNull();
    expect(redirectProps?.silent).toBe(false);
  });

  it("never renders fields the creator marked private", () => {
    const props = buildShareHeroProps({
      shareId: VALID_ID,
      row: {
        is_public: true,
        data: { paste: PASTE, privateFields: ["item", "evs", "nature"] },
      },
      collaborators: [],
      heading: "Incineroar / Flutter Mane",
    });
    const html = renderToStaticMarkup(<ShareHero {...props!} />);

    expect(props!.species).toEqual(["Incineroar", "Flutter Mane"]);
    for (const hidden of ["Safety Goggles", "Booster Energy", "252", "Careful", "Timid"]) {
      expect(html).not.toContain(hidden);
    }
  });

  it("refuses to build props for any row that is not explicitly public", () => {
    for (const is_public of [false, undefined, null, "true", 1]) {
      expect(
        buildShareHeroProps({
          shareId: VALID_ID,
          row: { is_public, is_unlisted: true, data: { paste: PASTE } },
          collaborators: [],
          heading: "Leaked",
        }),
      ).toBeNull();
    }
  });
});

describe("/s/[id] — degradation", () => {
  it("still renders the redirect shell when the database is unreachable", async () => {
    vi.mocked(getDb).mockImplementation(() => {
      throw new Error("DATABASE_URL is not set");
    });
    const tree = await SharePage({ params: Promise.resolve({ id: VALID_ID }) });
    const redirectProps = findByType(tree, ShareRedirectClient)?.props as
      | { silent?: boolean }
      | undefined;

    expect(findByType(tree, ShareHero)).toBeUndefined();
    expect(redirectProps?.silent).toBe(false);
  });

  it("renders a hero with no sprites when the share has no parseable paste", async () => {
    const { heroProps } = await renderPage(shareRow({ data: { paste: "", creatorName: "Ash" } }));

    expect(heroProps!.species).toEqual([]);
    const html = renderToStaticMarkup(<ShareHero {...heroProps!} />);
    expect(html).toContain("by Ash");
    expect(html).not.toContain("sprites/home");
  });
});
