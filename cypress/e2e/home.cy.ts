describe("Home / Paste Input", () => {
  beforeEach(() => {
    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.setItem("vgc-whats-new-v10", "1");
      },
    });
  });

  it("renders the paste input screen with title", () => {
    cy.get("h1").should("be.visible");
    cy.get("textarea").should("be.visible");
  });

  it("has animated pokemon sprites", () => {
    // Only the landing hero uses <picture>; the sample-team cards also load ani sprites.
    cy.get("picture img[src*='sprites/ani']").should("have.length", 6);
  });

  it("shows disabled analyze button when textarea is empty", () => {
    cy.get("button").contains(/analyze|submit/i)
      .should("have.class", "cursor-not-allowed");
  });

  it("loads a sample team from the sample picker", () => {
    cy.get("button[aria-label='Try Mega Kangaskhan Goodstuffs sample team']").click();
    cy.get("[data-walkthrough='slide-nav']", { timeout: 15000 }).should("be.visible");
    cy.contains("Arcanine").should("be.visible");
  });

  // Skipped: the "Load sample" button that filled the textarea without analyzing is gone;
  // the sample-team cards analyze immediately.
  it.skip("enables analyze button after loading sample", () => {
    cy.get("button").contains(/sample|load/i).click();
    cy.get("button").contains(/analyze|submit/i)
      .should("not.have.class", "cursor-not-allowed");
  });

  it("detects PokePaste URL and shows badge", () => {
    cy.get("textarea").type("https://pokepast.es/abc123", { delay: 0 });
    cy.contains(/pokepaste/i).should("be.visible");
    cy.get("button").contains(/fetch/i).should("be.visible");
  });

  it("shows validation error for invalid paste", () => {
    cy.get("textarea").type("this is not a valid team paste", { delay: 0 });
    cy.get("button").contains(/analyze|submit/i).click();
    cy.contains(/invalid/i).should("be.visible");
  });

  it("shows footer credits", () => {
    cy.contains("Manraj Sidhu").should("be.visible");
    cy.get("a[href='/privacy']").should("exist");
  });

  // Skipped: the home page no longer has a "Community" section (the /explore link now lives in the navbar).
  it.skip("shows community section with Explore link", () => {
    cy.contains("Community").should("be.visible");
    cy.get("a[href='/explore']").should("exist");
  });

  // Skipped: the feature pills ("Team Analysis", "Share & Explore", "Matchup Plans") were removed from the home page.
  it.skip("shows feature pills", () => {
    cy.contains("Team Analysis").should("be.visible");
    cy.contains("Share & Explore").should("be.visible");
    cy.contains("Matchup Plans").should("be.visible");
  });
});
