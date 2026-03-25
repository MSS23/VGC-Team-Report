describe("Privacy Page", () => {
  it("loads the privacy policy page", () => {
    cy.visit("/privacy");
    cy.contains("Privacy").should("be.visible");
  });

  it("navigates to privacy from home page", () => {
    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.setItem("vgc-whats-new-v2", "1");
      },
    });
    cy.contains("a", "Privacy").click();
    cy.url().should("include", "/privacy");
  });
});
