import { describe, it, expect } from "vitest";
import { parseFiltersFromUrl, buildUrlSearch } from "../useExploreUrlSync";

describe("parseFiltersFromUrl", () => {
  it("returns default values when URL has no search params", () => {
    const result = parseFiltersFromUrl("");
    expect(result.query).toBe("");
    expect(result.sort).toBe("newest");
    expect(result.searchCategory).toBe("all");
    expect(result.regulation).toBe("");
    expect(result.eventType).toBe("");
    expect(result.archetype).toBe("");
    expect(result.species).toBe("");
    expect(result.placement).toBe("");
    expect(result.followingOnly).toBe(false);
  });

  it("parses all filter params from URL", () => {
    const search =
      "?q=flutter+mane&sort=popular&searchType=pokemon&regulation=Reg+H&eventType=international&archetype=Rain&species=Flutter+Mane&placement=top8&following=1";
    const result = parseFiltersFromUrl(search);
    expect(result.query).toBe("flutter mane");
    expect(result.sort).toBe("popular");
    expect(result.searchCategory).toBe("pokemon");
    expect(result.regulation).toBe("Reg H");
    expect(result.eventType).toBe("international");
    expect(result.archetype).toBe("Rain");
    expect(result.species).toBe("Flutter Mane");
    expect(result.placement).toBe("top8");
    expect(result.followingOnly).toBe(true);
  });

  it("boolean following param: '1' in URL -> true, absent -> false", () => {
    expect(parseFiltersFromUrl("?following=1").followingOnly).toBe(true);
    expect(parseFiltersFromUrl("?following=0").followingOnly).toBe(false);
    expect(parseFiltersFromUrl("").followingOnly).toBe(false);
  });
});

describe("buildUrlSearch", () => {
  it("returns empty string when all values are defaults", () => {
    const result = buildUrlSearch({
      query: "",
      sort: "newest",
      searchCategory: "all",
      regulation: "",
      eventType: "",
      archetype: "",
      species: "",
      placement: "",
      followingOnly: false,
    });
    expect(result).toBe("");
  });

  it("includes only non-default values in the URL", () => {
    const result = buildUrlSearch({
      query: "test",
      sort: "popular",
      searchCategory: "pokemon",
      regulation: "Reg H",
      eventType: "",
      archetype: "",
      species: "",
      placement: "",
      followingOnly: false,
    });
    const params = new URLSearchParams(result);
    expect(params.get("q")).toBe("test");
    expect(params.get("sort")).toBe("popular");
    expect(params.get("searchType")).toBe("pokemon");
    expect(params.get("regulation")).toBe("Reg H");
    expect(params.has("eventType")).toBe(false);
    expect(params.has("following")).toBe(false);
  });

  it("encodes following as '1' when true", () => {
    const result = buildUrlSearch({
      query: "",
      sort: "newest",
      searchCategory: "all",
      regulation: "",
      eventType: "",
      archetype: "",
      species: "",
      placement: "",
      followingOnly: true,
    });
    const params = new URLSearchParams(result);
    expect(params.get("following")).toBe("1");
  });

  it("round-trips: buildUrlSearch -> parseFiltersFromUrl returns original values", () => {
    const original = {
      query: "test team",
      sort: "views" as const,
      searchCategory: "tournament" as const,
      regulation: "Reg G",
      eventType: "regional",
      archetype: "Trick Room",
      species: "Calyrex Shadow",
      placement: "winner",
      followingOnly: true,
    };
    const search = buildUrlSearch(original);
    const parsed = parseFiltersFromUrl("?" + search);
    expect(parsed).toEqual(original);
  });
});
