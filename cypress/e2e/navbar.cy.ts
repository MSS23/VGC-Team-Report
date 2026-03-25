describe("Navbar", () => {
  beforeEach(() => {
    cy.loadSampleTeam();
    // Dismiss walkthrough if it appears
    cy.get("body").then(($body) => {
      if ($body.text().includes("Skip tour") || $body.text().includes("Skip")) {
        cy.contains("button", /skip/i).click({ force: true });
      }
    });
    cy.wait(300);
  });

  it("shows the navbar with controls", () => {
    cy.get("header").should("be.visible");
  });

  it("shows New Team button", () => {
    cy.contains("New Team").should("be.visible");
  });

  it("shows Share button (disabled for sample team)", () => {
    cy.get("[data-walkthrough='share-button']").should("be.visible").and("be.disabled");
  });

  it("shows dark mode toggle", () => {
    cy.get("[role='switch']").should("be.visible");
  });

  it("toggles dark mode", () => {
    cy.get("[role='switch']").click();
    cy.get("[data-dark-mode]").should("exist");
    cy.get("[role='switch']").click();
    cy.get("[data-dark-mode]").should("not.exist");
  });

  it("shows creator mode toggle", () => {
    cy.get("[data-walkthrough='creator-toggle']").should("be.visible");
  });

  it("toggles creator mode to show editing UI", () => {
    cy.get("[data-walkthrough='creator-toggle'] button").click();
    cy.get("[data-walkthrough='tournament-info']").should("be.visible");
    cy.get("[data-walkthrough='creator-toggle'] button").click();
  });

  it("shows present button", () => {
    cy.get("[data-walkthrough='present-button']").should("be.visible");
  });

  it("enters and exits presentation mode", () => {
    cy.get("[data-walkthrough='present-button']").click();
    cy.contains("button", "Exit").should("be.visible");
    cy.contains("button", "Exit").click();
    cy.get("[data-walkthrough='present-button']").should("be.visible");
  });

  it("navigates back to paste input on New Team click", () => {
    cy.contains("New Team").click();
    cy.get("textarea").should("be.visible");
    cy.contains("h1", "VGC Team").should("be.visible");
  });
});
