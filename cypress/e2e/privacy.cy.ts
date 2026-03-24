describe("Privacy Page", () => {
  it("loads the privacy policy page", () => {
    cy.visit("/privacy");
    cy.contains("Privacy").should("be.visible");
  });

  it("navigates to privacy from home page", () => {
    cy.visit("/");
    cy.contains("a", "Privacy").click();
    cy.url().should("include", "/privacy");
  });
});
