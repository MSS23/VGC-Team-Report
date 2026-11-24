import { describe, expect, it, vi } from "vitest";

import { POKEMON_DATA } from "@/lib/data/pokemon";
import {
  aggregateSpeciesSpreads,
  buildSpeciesSpreadQuery,
  EXAMPLES_PER_SPREAD,
  formatSpread,
  isKnownSpeciesSlug,
  speciesDisplayName,
  speciesSlug,
  SPREAD_CANDIDATE_LIMIT,
  TOP_SPREAD_COUNT,
  type SpreadShareRow,
} from "@/lib/spreads/species-spreads";

// ── Fixtures ────────────────────────────────────────────────────────────────

/** Build a Showdown paste for one Incineroar with the given spread line. */
function incineroarPaste(evLine: string, nature = "Careful", item = "Safety Goggles"): string {
  return [
    `Incineroar @ ${item}`,
    "Ability: Intimidate",
    "Level: 50",
    "Tera Type: Grass",
    `EVs: ${evLine}`,
    `${nature} Nature`,
    "- Fake Out",
    "- Knock Off",
    "- Parting Shot",
    "- Flare Blitz",
  ].join("\n");
}

function row(
  id: string,
  paste: string,
  extra: Record<string, unknown> = {},
): SpreadShareRow {
  return { id, data: { paste, ...extra } };
}

/** Three reports on `252 HP / 4 Atk / 252 Def`, two on `252 HP / 252 SpD / 4 Spe`. */
const EV_ROWS: SpreadShareRow[] = [
  row("a1", incineroarPaste("252 HP / 4 Atk / 252 Def"), { creatorName: "Ada" }),
  row("a2", incineroarPaste("252 HP / 4 Atk / 252 Def"), { creatorName: "Bo", placement: "1st" }),
  row("a3", incineroarPaste("252 HP / 4 Atk / 252 Def"), { creatorName: "Cy" }),
  row("b1", incineroarPaste("252 HP / 252 SpD / 4 Spe", "Careful", "Sitrus Berry")),
  row("b2", incineroarPaste("252 HP / 252 SpD / 4 Spe", "Careful", "Sitrus Berry")),
];

/** Minimal tagged-template stand-in that records text + bound params. */
function makeSql(result: unknown[] = []) {
  const calls: { text: string; params: unknown[] }[] = [];
  const sql = (strings: TemplateStringsArray, ...params: unknown[]) => {
    calls.push({ text: strings.join(" ? ").replace(/\s+/g, " ").trim(), params });
    return Promise.resolve(result);
  };
  return { sql, calls };
}

// ── Slug handling / untrusted input ─────────────────────────────────────────

describe("species slugs", () => {
  it("round-trips every catalogue entry's display name back to its key", () => {
    // `speciesSlug` mirrors the key derivation inside `lookupPokemon`. If that
    // ever drifts, a slug that resolves in one place stops resolving in the
    // other and the landing pages 404 on valid species.
    const broken = Object.entries(POKEMON_DATA)
      .filter(([key, entry]) => speciesSlug(entry.name) !== key)
      .map(([key, entry]) => `${key} -> ${entry.name} -> ${speciesSlug(entry.name)}`);
    expect(broken).toEqual([]);
  });

  it("accepts known slugs and rejects everything else", () => {
    expect(isKnownSpeciesSlug("incineroar")).toBe(true);
    expect(isKnownSpeciesSlug("calyrex-shadow")).toBe(true);
    expect(isKnownSpeciesSlug("not-a-pokemon")).toBe(false);
    expect(isKnownSpeciesSlug("")).toBe(false);
  });

  it("does not treat inherited Object properties as species", () => {
    // `"constructor" in POKEMON_DATA` is true via the prototype chain, which
    // would let a crafted URL past the allowlist and into a query.
    expect(isKnownSpeciesSlug("constructor")).toBe(false);
    expect(isKnownSpeciesSlug("toString")).toBe(false);
    expect(isKnownSpeciesSlug("__proto__")).toBe(false);
  });

  it("resolves display names only for known slugs", () => {
    expect(speciesDisplayName("incineroar")).toBe("Incineroar");
    expect(speciesDisplayName("not-a-pokemon")).toBeNull();
  });
});

describe("formatSpread", () => {
  it("writes a Showdown-style stat line, skipping uninvested stats", () => {
    expect(formatSpread({ hp: 252, atk: 0, def: 4, spa: 0, spd: 0, spe: 252 })).toBe(
      "252 HP / 4 Def / 252 Spe",
    );
  });

  it("labels an all-zero spread instead of rendering an empty string", () => {
    expect(formatSpread({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 })).toBe("No investment");
  });
});

// ── Grouping + percentage maths ─────────────────────────────────────────────

describe("aggregateSpeciesSpreads — grouping and percentages", () => {
  it("groups identical spreads and divides by the confirmed report count", () => {
    const result = aggregateSpeciesSpreads("incineroar", EV_ROWS);

    expect(result.species).toBe("Incineroar");
    expect(result.unavailable).toBe(false);
    expect(result.totalReports).toBe(5);
    expect(result.spreads).toHaveLength(2);

    const [first, second] = result.spreads;
    expect(first.label).toBe("252 HP / 4 Atk / 252 Def");
    expect(first.count).toBe(3);
    expect(first.percentage).toBe(60);
    expect(second.label).toBe("252 HP / 252 SpD / 4 Spe");
    expect(second.count).toBe(2);
    expect(second.percentage).toBe(40);
  });

  it("rounds percentages to one decimal place", () => {
    const rows = [
      ...Array.from({ length: 2 }, (_, i) => row(`x${i}`, incineroarPaste("252 HP / 252 Atk"))),
      row("y0", incineroarPaste("4 HP / 252 Atk / 252 Spe")),
    ];
    const result = aggregateSpeciesSpreads("incineroar", rows);
    expect(result.totalReports).toBe(3);
    expect(result.spreads[0].percentage).toBe(66.7);
    expect(result.spreads[1].percentage).toBe(33.3);
  });

  it("percentages of the returned groups never exceed 100", () => {
    const total = aggregateSpeciesSpreads("incineroar", EV_ROWS).spreads.reduce(
      (sum, s) => sum + s.percentage,
      0,
    );
    expect(total).toBeLessThanOrEqual(100);
  });

  it("sorts by usage and caps the list at the top N", () => {
    // Six distinct spreads, with descending counts 6..1.
    const rows: SpreadShareRow[] = [];
    const spreads = [
      "252 HP / 252 Atk",
      "252 HP / 252 Def",
      "252 HP / 252 SpD",
      "4 HP / 252 Atk / 252 Spe",
      "252 Atk / 252 Spe",
      "252 Def / 252 SpD",
    ];
    spreads.forEach((line, i) => {
      for (let n = 0; n < 6 - i; n++) rows.push(row(`${i}-${n}`, incineroarPaste(line)));
    });

    const result = aggregateSpeciesSpreads("incineroar", rows);
    expect(result.totalReports).toBe(21);
    expect(result.spreads).toHaveLength(TOP_SPREAD_COUNT);
    expect(result.spreads.map((s) => s.count)).toEqual([6, 5, 4, 3, 2]);
  });

  it("breaks count ties deterministically so cached HTML does not flap", () => {
    const rows = [
      row("t1", incineroarPaste("252 HP / 252 SpD")),
      row("t2", incineroarPaste("252 HP / 252 Atk")),
    ];
    const forward = aggregateSpeciesSpreads("incineroar", rows).spreads.map((s) => s.label);
    const reversed = aggregateSpeciesSpreads("incineroar", [...rows].reverse()).spreads.map(
      (s) => s.label,
    );
    expect(forward).toEqual(reversed);
    expect(forward).toEqual(["252 HP / 252 Atk", "252 HP / 252 SpD"]);
  });

  it("attaches at most the allowed number of example reports, in row order", () => {
    const result = aggregateSpeciesSpreads("incineroar", EV_ROWS);
    const examples = result.spreads[0].examples;
    expect(examples).toHaveLength(EXAMPLES_PER_SPREAD);
    expect(examples.map((e) => e.id)).toEqual(["a1", "a2"]);
    expect(examples[0].creatorName).toBe("Ada");
    expect(examples[1].placement).toBe("1st");
  });

  it("reports the most common nature and item per group", () => {
    const rows = [
      row("n1", incineroarPaste("252 HP / 252 Def", "Impish", "Rocky Helmet")),
      row("n2", incineroarPaste("252 HP / 252 Def", "Impish", "Sitrus Berry")),
      row("n3", incineroarPaste("252 HP / 252 Def", "Careful", "Sitrus Berry")),
      row("n4", incineroarPaste("252 HP / 252 Def", "Impish", "Sitrus Berry")),
    ];
    const [group] = aggregateSpeciesSpreads("incineroar", rows).spreads;
    expect(group.count).toBe(4);
    expect(group.nature).toBe("Impish");
    expect(group.item).toBe("Sitrus Berry");
  });
});

describe("aggregateSpeciesSpreads — what counts as a report for this species", () => {
  it("ignores reports whose paste only name-drops the species in a nickname", () => {
    const decoy = [
      "Rillaboom (Incineroar Hater) @ Assault Vest",
      "Ability: Grassy Surge",
      "EVs: 252 HP / 252 Atk",
      "Adamant Nature",
      "- Grassy Glide",
    ].join("\n");
    const result = aggregateSpeciesSpreads("incineroar", [row("d1", decoy)]);
    expect(result.totalReports).toBe(0);
    expect(result.spreads).toEqual([]);
  });

  it("finds the species anywhere in the team, not just the first slot", () => {
    const paste = [
      "Rillaboom @ Assault Vest",
      "Ability: Grassy Surge",
      "EVs: 252 HP / 252 Atk",
      "Adamant Nature",
      "- Grassy Glide",
      "",
      incineroarPaste("252 HP / 4 Atk / 252 Def"),
    ].join("\n");
    const result = aggregateSpeciesSpreads("incineroar", [row("m1", paste)]);
    expect(result.totalReports).toBe(1);
    expect(result.spreads[0].label).toBe("252 HP / 4 Atk / 252 Def");
  });

  it("skips rows with a missing or blank paste", () => {
    const rows: SpreadShareRow[] = [
      { id: "e1", data: {} },
      { id: "e2", data: { paste: "   " } },
      { id: "e3", data: { paste: 42 } },
      ...EV_ROWS,
    ];
    expect(aggregateSpeciesSpreads("incineroar", rows).totalReports).toBe(5);
  });

  it("returns an empty aggregate for an unknown slug without inventing a species", () => {
    const result = aggregateSpeciesSpreads("not-a-pokemon", EV_ROWS);
    expect(result).toEqual({
      species: "not-a-pokemon",
      slug: "not-a-pokemon",
      totalReports: 0,
      spreads: [],
      unavailable: false,
    });
  });

  it("returns zero totals — not NaN percentages — when no row matches", () => {
    const result = aggregateSpeciesSpreads("incineroar", []);
    expect(result.totalReports).toBe(0);
    expect(result.spreads).toEqual([]);
  });
});

// ── EV vs Champions SP units ────────────────────────────────────────────────

describe("aggregateSpeciesSpreads — EV and Champions SP never share a bucket", () => {
  const champions = { tags: { regulation: "Reg M-C" } };

  it("reads Champions reports in SP and labels the unit", () => {
    const rows = [
      row("c1", incineroarPaste("32 HP / 32 Def / 2 Spe"), champions),
      row("c2", incineroarPaste("32 HP / 32 Def / 2 Spe"), champions),
    ];
    const [group] = aggregateSpeciesSpreads("incineroar", rows).spreads;
    expect(group.unit).toBe("sp");
    expect(group.label).toBe("32 HP / 32 Def / 2 Spe");
    expect(group.count).toBe(2);
  });

  it("keeps non-Champions reports in EVs, verbatim from the paste", () => {
    const [group] = aggregateSpeciesSpreads("incineroar", [
      row("v1", incineroarPaste("252 HP / 4 Atk / 252 Def"), {
        tags: { regulation: "Reg I" },
      }),
    ]).spreads;
    expect(group.unit).toBe("ev");
    expect(group.label).toBe("252 HP / 4 Atk / 252 Def");
  });

  it("does not pool a 252-style spread with an SP spread of the same shape", () => {
    const rows = [
      row("s1", incineroarPaste("32 HP / 32 Def"), champions),
      row("s2", incineroarPaste("252 HP / 252 Def"), { tags: { regulation: "Reg I" } }),
    ];
    const result = aggregateSpeciesSpreads("incineroar", rows);
    expect(result.totalReports).toBe(2);
    expect(result.spreads).toHaveLength(2);
    expect(new Set(result.spreads.map((s) => s.unit))).toEqual(new Set(["ev", "sp"]));
  });

  it("reads a legacy top-level regulation field as well as the nested tag", () => {
    const [group] = aggregateSpeciesSpreads("incineroar", [
      row("l1", incineroarPaste("32 HP / 32 Def"), { regulation: "Reg M-A" }),
    ]).spreads;
    expect(group.unit).toBe("sp");
  });
});

// ── Query shape ─────────────────────────────────────────────────────────────

describe("buildSpeciesSpreadQuery", () => {
  it("binds the species and limit as parameters, never as SQL text", () => {
    const { sql, calls } = makeSql();
    void buildSpeciesSpreadQuery(sql as never, "Calyrex-Shadow");
    expect(calls).toHaveLength(1);
    expect(calls[0].params).toEqual(["%Calyrex-Shadow%", SPREAD_CANDIDATE_LIMIT]);
    expect(calls[0].text).not.toContain("Calyrex-Shadow");
  });

  it("only ever reads public, undeleted shares", () => {
    const { sql, calls } = makeSql();
    void buildSpeciesSpreadQuery(sql as never, "Incineroar");
    expect(calls[0].text).toContain("s.is_public = TRUE");
    expect(calls[0].text).toContain("s.deleted_at IS NULL");
    expect(calls[0].text).toMatch(/^SELECT /);
  });
});

// ── Database-down / empty paths ─────────────────────────────────────────────

describe("getSpeciesSpreads — degrades without a database", () => {
  it("reports unavailable instead of throwing when the client cannot connect", async () => {
    vi.resetModules();
    vi.doMock("@/lib/db", () => ({
      getDb: () => {
        throw new Error("No database connection string was provided");
      },
    }));
    const mod = await import("@/lib/spreads/species-spreads");
    const result = await mod.getSpeciesSpreads("incineroar");
    expect(result).toEqual({
      species: "Incineroar",
      slug: "incineroar",
      totalReports: 0,
      spreads: [],
      unavailable: true,
    });
    vi.doUnmock("@/lib/db");
    vi.resetModules();
  });

  it("reports unavailable when the query itself fails", async () => {
    vi.resetModules();
    vi.doMock("@/lib/db", () => ({
      getDb: () => () => Promise.reject(new Error("relation \"shares\" does not exist")),
    }));
    const mod = await import("@/lib/spreads/species-spreads");
    const result = await mod.getSpeciesSpreads("incineroar");
    expect(result.unavailable).toBe(true);
    expect(result.spreads).toEqual([]);
    vi.doUnmock("@/lib/db");
    vi.resetModules();
  });

  it("never queries for an unvalidated slug", async () => {
    vi.resetModules();
    const getDb = vi.fn();
    vi.doMock("@/lib/db", () => ({ getDb }));
    const mod = await import("@/lib/spreads/species-spreads");
    const result = await mod.getSpeciesSpreads("'; DROP TABLE shares; --");
    expect(getDb).not.toHaveBeenCalled();
    expect(result.unavailable).toBe(false);
    expect(result.totalReports).toBe(0);
    vi.doUnmock("@/lib/db");
    vi.resetModules();
  });

  it("aggregates rows returned by the client", async () => {
    vi.resetModules();
    vi.doMock("@/lib/db", () => ({
      getDb: () => () => Promise.resolve(EV_ROWS.map((r) => ({ id: r.id, data: r.data }))),
    }));
    const mod = await import("@/lib/spreads/species-spreads");
    const result = await mod.getSpeciesSpreads("incineroar");
    expect(result.unavailable).toBe(false);
    expect(result.totalReports).toBe(5);
    expect(result.spreads[0].percentage).toBe(60);
    vi.doUnmock("@/lib/db");
    vi.resetModules();
  });
});

describe("getSpeciesWithSpreadData — sitemap species list", () => {
  it("returns an empty list when the database is unreachable", async () => {
    vi.resetModules();
    vi.doMock("@/lib/db", () => ({
      getDb: () => {
        throw new Error("No database connection string was provided");
      },
    }));
    const mod = await import("@/lib/spreads/species-spreads");
    await expect(mod.getSpeciesWithSpreadData()).resolves.toEqual([]);
    vi.doUnmock("@/lib/db");
    vi.resetModules();
  });

  it("lists only species at or above the report threshold, most used first", async () => {
    const pastes = [
      // Incineroar x3, Rillaboom x2, Pelipper x1
      "Incineroar @ Sitrus Berry\nEVs: 252 HP\n\nRillaboom @ Assault Vest\nEVs: 252 Atk",
      "Incineroar @ Sitrus Berry\nEVs: 252 HP\n\nRillaboom @ Assault Vest\nEVs: 252 Atk",
      "Incineroar @ Sitrus Berry\nEVs: 252 HP\n\nPelipper @ Focus Sash\nEVs: 252 SpA",
    ].map((paste) => ({ paste }));

    vi.resetModules();
    vi.doMock("@/lib/db", () => ({ getDb: () => () => Promise.resolve(pastes) }));
    const mod = await import("@/lib/spreads/species-spreads");
    expect(await mod.getSpeciesWithSpreadData({ minReports: 2 })).toEqual([
      "incineroar",
      "rillaboom",
    ]);
    expect(await mod.getSpeciesWithSpreadData({ minReports: 4 })).toEqual([]);
    vi.doUnmock("@/lib/db");
    vi.resetModules();
  });
});
