// TODO(VGC-224): selector drift, verify against current UI.
// The whole suite is gated on `[data-walkthrough='creator-toggle']`, which no longer
// exists anywhere in src/ — the creator-mode toggle moved into the Navbar overflow menu
// (see src/components/layout/Navbar.tsx, "Creator mode toggle — in overflow menu").
// Every test below will fail in beforeEach until the selector is re-pointed.
describe("Creator Mode", () => {
  beforeEach(() => {
    cy.loadSampleTeam();
    // Dismiss walkthrough if it appears
    cy.get("body").then(($body) => {
      if ($body.text().includes("Skip tour") || $body.text().includes("Skip")) {
        cy.contains("button", /skip/i).click({ force: true });
      }
    });
    cy.wait(300);
    // Enable creator mode
    // TODO(VGC-224): selector drift, verify against current UI — 'creator-toggle' is gone.
    cy.get("[data-walkthrough='creator-toggle'] button").click();
    cy.wait(300);
  });

  describe("Tournament Info", () => {
    it("shows editable tournament fields", () => {
      cy.get("[data-walkthrough='tournament-info']").should("be.visible");
      cy.get("input[placeholder*='Event name']").should("be.visible");
    });

    it("can type tournament name", () => {
      cy.get("input[placeholder*='Event name']").type("EUIC 2025");
      cy.get("input[placeholder*='Event name']").should("have.value", "EUIC 2025");
    });

    it("can type placement and record", () => {
      cy.get("input[placeholder='Placement']").type("Top 8");
      cy.get("input[placeholder='Placement']").should("have.value", "Top 8");
      cy.get("input[placeholder='Record']").type("7-2");
      cy.get("input[placeholder='Record']").should("have.value", "7-2");
    });

    it("uppercases rental code", () => {
      cy.get("input[placeholder='Rental']").type("abc123");
      cy.get("input[placeholder='Rental']").should("have.value", "ABC123");
    });
  });

  describe("Team Summary", () => {
    it("shows editable team summary textarea", () => {
      cy.get("textarea[placeholder*='Summarize your team']").should("be.visible");
    });

    it("can type a team summary", () => {
      cy.get("textarea[placeholder*='Summarize your team']").type("Balance team with Incineroar.");
      cy.get("textarea[placeholder*='Summarize your team']").should("contain.value", "Balance team");
    });
  });

  describe("Pokemon Roles", () => {
    it("shows role input fields on pokemon cards", () => {
      cy.get("input[placeholder*='Role']").should("have.length.at.least", 1);
    });

    it("can set a role for a pokemon", () => {
      cy.get("input[placeholder*='Role']").first().type("Fake Out Support");
      cy.get("input[placeholder*='Role']").first().should("have.value", "Fake Out Support");
    });
  });

  describe("MVP Selection", () => {
    it("shows MVP star buttons on pokemon cards", () => {
      cy.get("[aria-label='Set as MVP']").should("have.length", 6);
    });

    it("can set and unset MVP", () => {
      cy.get("[aria-label='Set as MVP']").first().click();
      cy.contains("Team MVP").should("be.visible");
      cy.get("[aria-label='Remove MVP']").first().click();
      cy.contains("Team MVP").should("not.exist");
    });
  });

  describe("Pokemon Detail Editing", () => {
    beforeEach(() => {
      cy.nextSlide();
      cy.wait(500);
    });

    it("shows editable notes textarea", () => {
      cy.get("textarea[placeholder*='Explain']").should("be.visible");
    });

    it("can type pokemon notes", () => {
      cy.get("textarea[placeholder*='Explain']").type("Incineroar is the glue.");
      cy.get("textarea[placeholder*='Explain']").should("contain.value", "glue");
    });
  });

  describe("Slide Visibility", () => {
    it("shows visibility toggle in nav", () => {
      cy.contains("Visible").should("be.visible");
    });

    it("can hide and show a slide", () => {
      cy.contains("button", "Visible").click();
      cy.contains("button", "Hidden").should("be.visible");
      cy.contains("button", "Hidden").click();
      cy.contains("button", "Visible").should("be.visible");
    });
  });
});
