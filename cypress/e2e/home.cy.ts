describe("Home / Paste Input", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("renders the paste input screen with title", () => {
    cy.get("h1").should("be.visible");
    cy.get("textarea").should("be.visible");
  });

  it("has animated pokemon sprites", () => {
    cy.get("img[src*='sprites/ani']").should("have.length", 6);
  });

  it("shows disabled analyze button when textarea is empty", () => {
    // The analyze/submit button should exist with disabled styling
    cy.get("textarea").siblings().find("button").last()
      .should("have.class", "cursor-not-allowed");
  });

  it("loads sample paste on button click", () => {
    // Click the first action button (Load sample)
    cy.get("button").contains(/sample|load/i).click();
    cy.get("textarea").should("contain.value", "Incineroar @ Sitrus Berry");
    cy.get("textarea").should("contain.value", "Landorus-Therian @ Life Orb");
  });

  it("enables analyze button after loading sample", () => {
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
});
