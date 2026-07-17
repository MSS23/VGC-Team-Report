// Custom commands for VGC Team Report testing

const SAMPLE_PASTE = `Incineroar @ Sitrus Berry
Ability: Intimidate
Level: 50
Tera Type: Ghost
EVs: 252 HP / 4 Atk / 76 Def / 108 SpD / 68 Spe
Careful Nature
- Fake Out
- Knock Off
- Flare Blitz
- Parting Shot

Flutter Mane @ Choice Specs
Ability: Protosynthesis
Level: 50
Tera Type: Fairy
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Moonblast
- Shadow Ball
- Dazzling Gleam
- Mystical Fire

Rillaboom @ Assault Vest
Ability: Grassy Surge
Level: 50
Tera Type: Fire
EVs: 252 HP / 116 Atk / 4 Def / 92 SpD / 44 Spe
Adamant Nature
- Grassy Glide
- Wood Hammer
- U-turn
- Fake Out

Urshifu-Rapid-Strike @ Focus Sash
Ability: Unseen Fist
Level: 50
Tera Type: Water
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Surging Strikes
- Close Combat
- Aqua Jet
- Detect

Tornadus (M) @ Covert Cloak
Ability: Prankster
Level: 50
Tera Type: Steel
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Tailwind
- Hurricane
- Icy Wind
- Taunt

Landorus-Therian @ Life Orb
Ability: Intimidate
Level: 50
Tera Type: Steel
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Earthquake
- Rock Slide
- U-turn
- Protect`;

declare global {
  // Cypress exposes its custom command surface through namespace augmentation.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Load a sample team and navigate to the report view */
      loadSampleTeam(): Chainable<void>;
      /** Paste custom team data and analyze */
      pasteAndAnalyze(paste: string): Chainable<void>;
      /** Navigate to a specific slide by index */
      goToSlide(index: number): Chainable<void>;
      /** Click the next slide button */
      nextSlide(): Chainable<void>;
      /** Click the previous slide button */
      prevSlide(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("loadSampleTeam", () => {
  // Set localStorage to skip WhatsNew modal
  cy.visit("/", {
    onBeforeLoad(win) {
      win.localStorage.setItem("vgc-whats-new-v3", "1");
    },
  });
  cy.contains("button", "Load sample").click();
  cy.contains("button", "Analyze Team").click();
  // Wait for report to render
  cy.get("[data-walkthrough='slide-nav']", { timeout: 15000 }).should("be.visible");
});

Cypress.Commands.add("pasteAndAnalyze", (paste: string) => {
  cy.visit("/");
  cy.get("textarea").type(paste, { delay: 0 });
  cy.contains("button", "Analyze Team").click();
  cy.get("[data-walkthrough='slide-nav']", { timeout: 15000 }).should("be.visible");
});

Cypress.Commands.add("goToSlide", (index: number) => {
  cy.get("[data-walkthrough='slide-nav']")
    .find("button[aria-label^='Go to']")
    .eq(index)
    .click();
});

Cypress.Commands.add("nextSlide", () => {
  cy.get("[aria-label='Next slide']").click();
});

Cypress.Commands.add("prevSlide", () => {
  cy.get("[aria-label='Previous slide']").click();
});

export { SAMPLE_PASTE };
