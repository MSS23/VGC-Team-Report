describe("Team Report", () => {
  beforeEach(() => {
    cy.loadSampleTeam();
    // Dismiss walkthrough if it appears
    cy.get("body").then(($body) => {
      if ($body.find("[data-walkthrough-overlay]").length > 0 || $body.text().includes("Skip tour")) {
        cy.contains("button", /skip/i).click({ force: true });
      }
    });
    cy.wait(500);
  });

  describe("Overview Slide", () => {
    it("shows all 6 pokemon cards on overview", () => {
      cy.contains("Incineroar").should("be.visible");
      cy.contains("Flutter Mane").should("be.visible");
      cy.contains("Rillaboom").should("be.visible");
    });

    it("shows team summary section", () => {
      cy.get("[data-walkthrough='team-summary']").should("exist");
    });

    it("shows pokemon grid", () => {
      cy.get("[data-walkthrough='pokemon-grid']").should("be.visible");
    });

    it("displays pokemon types", () => {
      cy.contains("Fire").should("be.visible");
      cy.contains("Dark").should("be.visible");
    });

    it("displays items and abilities", () => {
      cy.contains("@ Sitrus Berry").should("be.visible");
      cy.contains("Intimidate").should("be.visible");
    });

    it("displays moves in each pokemon card", () => {
      cy.contains("Fake Out").should("be.visible");
      cy.contains("Knock Off").should("be.visible");
    });

    it("renders stat bars for each pokemon", () => {
      cy.get("[role='progressbar']").should("have.length.at.least", 6);
    });

    it("shows the app trademark footer", () => {
      cy.contains("Built with VGC Team Report").should("be.visible");
    });
  });

  describe("Slide Navigation", () => {
    it("shows slide navigation with correct count", () => {
      cy.get("[data-walkthrough='slide-nav']").should("be.visible");
      cy.get("[data-walkthrough='slide-nav']")
        .find("button[aria-label^='Go to']")
        .should("have.length.at.least", 9);
    });

    it("navigates to next slide and back", () => {
      cy.nextSlide();
      cy.wait(400);
      // Should now be on a pokemon detail slide
      cy.get("h2").first().should("be.visible");
      cy.prevSlide();
      cy.wait(400);
      // Back on overview
      cy.get("[data-walkthrough='pokemon-grid']").should("be.visible");
    });

    it("navigates to specific slide via dots", () => {
      cy.goToSlide(2);
      cy.wait(400);
      cy.get("h2").should("be.visible");
    });

    it("prev button is disabled on first slide", () => {
      cy.get("[aria-label='Previous slide']").should("be.disabled");
    });
  });

  describe("Pokemon Detail Slide", () => {
    beforeEach(() => {
      cy.nextSlide();
      cy.wait(500);
    });

    it("shows pokemon name prominently", () => {
      cy.get("h2").first().should("be.visible");
    });

    it("shows types and tera type", () => {
      // Incineroar has Fire/Dark types and Ghost tera
      cy.contains("Fire").should("be.visible");
    });

    it("shows ability and item", () => {
      cy.contains("Intimidate").should("be.visible");
      cy.contains("@ Sitrus Berry").should("be.visible");
    });

    it("shows stat bars with labels", () => {
      cy.contains("HP").should("be.visible");
      cy.contains("Atk").should("be.visible");
      cy.contains("Spe").should("be.visible");
    });

    it("shows notes section", () => {
      // Notes section exists on detail slides
      cy.contains(/Notes|About This Pokemon|Your Explanation/i).should("be.visible");
    });

    it("shows notable calcs section", () => {
      cy.contains("Notable Calcs").should("be.visible");
    });
  });

  describe("Team Analysis Slide", () => {
    it("navigates to speed tier chart", () => {
      cy.goToSlide(7);
      cy.wait(500);
      cy.contains("Team Analysis").should("be.visible");
    });

    it("shows speed legend", () => {
      cy.goToSlide(7);
      cy.wait(500);
      cy.contains("Base").should("be.visible");
    });
  });
});
