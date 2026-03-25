describe("Visual Design System", () => {
  beforeEach(() => {
    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.setItem("vgc-whats-new-v2", "1");
      },
    });
  });

  it("uses Sora font family (not Inter)", () => {
    cy.get("body").should("have.css", "font-family").and("match", /Sora/i);
  });

  it("has warm background color in light mode", () => {
    cy.get("body").should("have.css", "background-color").and("not.eq", "rgb(248, 250, 252)");
  });

  it("has accent color on primary buttons (not indigo)", () => {
    cy.contains("button", "Load sample").click();
    cy.contains("button", "Analyze Team").then(($btn) => {
      const bg = window.getComputedStyle($btn[0]).backgroundColor;
      expect(bg).to.not.match(/rgb\(99,\s*102,\s*241\)/);
    });
  });

  it("applies dot grid background texture on desktop", () => {
    cy.viewport(1280, 800);
    cy.window().then((win) => {
      const before = win.getComputedStyle(win.document.body, "::before");
      const bgImage = before.backgroundImage;
      expect(bgImage).to.include("radial-gradient");
    });
  });

  describe("Dark Mode", () => {
    beforeEach(() => {
      cy.loadSampleTeam();
      cy.get("[role='switch']").first().click();
    });

    it("applies dark background", () => {
      cy.get("body").should("have.css", "background-color").and("not.eq", "rgb(255, 255, 255)");
    });

    it("applies dark mode data attribute", () => {
      cy.get("[data-dark-mode]").should("exist");
    });
  });

  describe("Pokemon Stat Colors", () => {
    beforeEach(() => {
      cy.loadSampleTeam();
      cy.nextSlide();
    });

    it("uses distinct colors per stat bar (not all the same)", () => {
      cy.get("[role='progressbar']").then(($bars) => {
        const colors = new Set<string>();
        $bars.each((_, bar) => {
          const innerBar = bar.querySelector("div");
          if (innerBar) {
            colors.add(window.getComputedStyle(innerBar).backgroundColor);
          }
        });
        expect(colors.size).to.be.greaterThan(1);
      });
    });
  });

  describe("Typography", () => {
    it("uses extrabold for main heading", () => {
      cy.get("h1").should("have.css", "font-weight").and("match", /800|900/);
    });

    it("uses monospace font for stat numbers", () => {
      cy.loadSampleTeam();
      cy.nextSlide();
      cy.get(".tabular-nums").first().should("have.css", "font-family").and("match", /JetBrains/i);
    });
  });
});
