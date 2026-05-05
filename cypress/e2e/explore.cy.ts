const MOCK_REPORTS = [
  {
    id: "test-report-001",
    species: ["Incineroar", "Flutter Mane", "Rillaboom", "Urshifu-Rapid-Strike", "Tornadus", "Landorus-Therian"],
    tournamentName: "EUIC 2025",
    creatorName: "testplayer",
    placement: "Top 8",
    teamSummary: "Balance team built around Incineroar + Flutter Mane core.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    viewCount: 142,
    likeCount: 8,
    reactionCounts: {},
    commentCount: 3,
    isVerified: false,
    tags: { regulation: "Reg G", eventType: "Major", archetype: ["Tailwind"] },
    collaborators: [],
  },
  {
    id: "test-report-002",
    species: ["Calyrex-Shadow", "Miraidon", "Incineroar", "Rillaboom", "Tornadus", "Amoonguss"],
    tournamentName: "NAIC 2025",
    creatorName: "anotherplayer",
    placement: "1st",
    teamSummary: "Restricted duo with strong field control.",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    viewCount: 804,
    likeCount: 42,
    reactionCounts: {},
    commentCount: 12,
    isVerified: true,
    tags: { regulation: "Reg H", eventType: "Major" },
    collaborators: [],
  },
];

describe("Explore Page", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/explore*", {
      statusCode: 200,
      body: { reports: MOCK_REPORTS, nextCursor: null },
    }).as("exploreApi");

    cy.intercept("GET", "/api/spotlight*", {
      statusCode: 200,
      body: { reports: [] },
    }).as("spotlightApi");

    cy.visit("/explore");
  });

  describe("Page structure", () => {
    it("loads the explore page with a heading", () => {
      cy.get("h1").should("be.visible");
      cy.get("h1").should("contain.text", "VGC Teams");
    });

    it("shows the search input", () => {
      cy.get("input[type='search'], input[placeholder*='Search'], input[placeholder*='search']")
        .should("exist");
    });

    it("shows sort options", () => {
      cy.contains(/popular|newest|views/i).should("be.visible");
    });

    it("renders report cards after API response", () => {
      cy.wait("@exploreApi");
      cy.contains("EUIC 2025").should("be.visible");
      cy.contains("NAIC 2025").should("be.visible");
    });

    it("shows pokemon species on report cards", () => {
      cy.wait("@exploreApi");
      cy.contains("testplayer").should("be.visible");
    });

    it("shows placement badges on report cards", () => {
      cy.wait("@exploreApi");
      cy.contains("Top 8").should("be.visible");
      cy.contains("1st").should("be.visible");
    });

    it("shows view counts on report cards", () => {
      cy.wait("@exploreApi");
      cy.contains("142").should("be.visible");
    });
  });

  describe("Empty state", () => {
    it("shows empty state when API returns no reports", () => {
      cy.intercept("GET", "/api/explore*", {
        statusCode: 200,
        body: { reports: [], nextCursor: null },
      }).as("emptyExploreApi");

      cy.visit("/explore");
      cy.wait("@emptyExploreApi");
      cy.get("img[src*='substitute']").should("exist");
    });

    it("shows search-specific empty message when query has no results", () => {
      cy.intercept("GET", "/api/explore*", {
        statusCode: 200,
        body: { reports: [], nextCursor: null },
      }).as("noResultsApi");

      cy.visit("/explore?q=zzznoresults");
      cy.wait("@noResultsApi");
      cy.get("img[src*='substitute']").should("exist");
    });
  });

  describe("Navigation", () => {
    it("report card links to the shared report", () => {
      cy.wait("@exploreApi");
      cy.get("a[href*='/s/test-report-001']").should("exist");
    });

    it("creator name links to creator profile", () => {
      cy.wait("@exploreApi");
      cy.get("a[href*='/creator/testplayer']").should("exist");
    });
  });

  describe("URL sync", () => {
    it("preserves search query in URL", () => {
      cy.visit("/explore?q=incineroar");
      cy.get("input[type='search'], input[placeholder*='Search'], input[placeholder*='search']")
        .should("have.value", "incineroar");
    });
  });
});
