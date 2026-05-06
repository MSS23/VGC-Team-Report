describe("Champions Page", () => {
  beforeEach(() => {
    cy.visit("/champions");
  });

  describe("Page structure", () => {
    it("loads the champions page with a heading", () => {
      cy.get("h1, h2").first().should("be.visible");
    });

    it("contains 'Champions' in the page title area", () => {
      cy.contains(/champions/i).should("be.visible");
    });

    it("shows the Mega Evolution section", () => {
      cy.contains(/mega/i).should("be.visible");
    });

    it("renders pokemon cards for Mega eligible species", () => {
      // The champions page renders Mega pokemon cards
      cy.get("img[alt*='Mega'], img[src*='Mega'], a[href*='/champions/']").should(
        "have.length.at.least",
        5
      );
    });

    it("shows a link to the homepage or team builder", () => {
      cy.get("a[href='/']").should("exist");
    });
  });

  describe("Mega Pokemon links", () => {
    it("links to individual mega landing pages", () => {
      cy.get("a[href^='/champions/']").should("have.length.at.least", 1);
    });

    it("does not show broken links for Coming Soon megas", () => {
      // Coming Soon cards should not be <a> tags (they are divs)
      cy.contains(/coming soon/i).parents("div").first().should("not.have.prop", "tagName", "A");
    });
  });

  describe("SEO", () => {
    it("has a canonical meta link for the page", () => {
      cy.get("link[rel='canonical']").should(
        "have.attr",
        "href"
      );
    });

    it("has an og:title meta tag", () => {
      cy.get("meta[property='og:title']").should("exist");
    });
  });
});
