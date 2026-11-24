describe("Navbar", () => {
  beforeEach(() => {
    // loadSampleTeam pre-marks the walkthrough as seen, so no overlay to dismiss.
    cy.loadSampleTeam();
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

  // Dark mode, editing and Present now live in the overflow menu (aria-label "Settings").
  it("shows dark mode toggle", () => {
    cy.openSettingsMenu();
    cy.get("[role='switch'][aria-label='Dark mode']").should("be.visible");
  });

  it("toggles dark mode", () => {
    cy.openSettingsMenu();
    cy.get("[role='switch'][aria-label='Dark mode']").click();
    cy.get("html").should("have.attr", "data-dark-mode");
    cy.get("[role='switch'][aria-label='Dark mode']").click();
    cy.get("html").should("not.have.attr", "data-dark-mode");
  });

  it("shows creator mode toggle", () => {
    cy.openSettingsMenu();
    cy.contains("button", "Unlock Editing").should("be.visible");
  });

  it("toggles creator mode to show editing UI", () => {
    cy.openSettingsMenu();
    cy.contains("button", "Unlock Editing").click();
    cy.get("[data-walkthrough='tournament-info']").should("be.visible");
    cy.openSettingsMenu();
    cy.contains("button", "Lock Editing").click();
  });

  it("shows present button", () => {
    cy.openSettingsMenu();
    cy.contains("button", /^\s*Present\s*$/).should("be.visible");
  });

  it("enters and exits presentation mode", () => {
    cy.openSettingsMenu();
    cy.contains("button", /^\s*Present\s*$/).click();
    // A local draft's presentation exit is the "Edit" button (it also unlocks editing).
    cy.contains("button", /^\s*Edit\s*$/).should("be.visible");
    cy.contains("button", /^\s*Edit\s*$/).click();
    cy.contains("button", "New Team").should("be.visible");
  });

  it("navigates back to paste input on New Team click", () => {
    cy.contains("New Team").click();
    cy.get("textarea").should("be.visible");
    cy.contains("h1", "VGC Team").should("be.visible");
  });
});
