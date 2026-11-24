// Custom commands for VGC Team Report testing

// Verbatim copy of SAMPLE_PASTE in src/components/input/PasteInput.tsx. The app
// flags a report as the sample team (Share disabled, nothing persisted) only when
// the analyzed paste equals that constant, so keep the two identical.
const SAMPLE_PASTE = `Kangaskhan-Mega @ Kangaskhanite
Ability: Parental Bond
Level: 50
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Fake Out
- Return
- Sucker Punch
- Power-Up Punch

Salamence-Mega @ Salamencite
Ability: Aerilate
Level: 50
EVs: 4 Atk / 252 SpA / 252 Spe
Naive Nature
- Hyper Voice
- Double-Edge
- Flamethrower
- Protect

Incineroar @ Assault Vest
Ability: Intimidate
Level: 50
EVs: 252 HP / 4 Atk / 76 Def / 108 SpD / 68 Spe
Careful Nature
- Fake Out
- Knock Off
- Flare Blitz
- U-turn

Tapu Fini @ Leftovers
Ability: Misty Surge
Level: 50
EVs: 252 HP / 4 Def / 68 SpA / 108 SpD / 76 Spe
Calm Nature
- Muddy Water
- Moonblast
- Calm Mind
- Protect

Landorus-Therian @ Choice Scarf
Ability: Intimidate
Level: 50
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Earthquake
- Rock Slide
- U-turn
- Superpower

Amoonguss @ Sitrus Berry
Ability: Regenerator
Level: 50
EVs: 252 HP / 148 Def / 108 SpD
Relaxed Nature
IVs: 0 Spe
- Spore
- Rage Powder
- Giga Drain
- Protect`;

/** Fixed localStorage keys the specs seed (values from STORAGE_KEYS in src/lib/utils/safe-storage.ts). */
const WHATS_NEW_SEEN_KEY = "vgc-whats-new-v10";
const WALKTHROUGH_SEEN_KEY = "vgc-walkthrough-seen";

declare global {
  // Cypress exposes its custom command surface through namespace augmentation.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Load a sample team and navigate to the report view */
      loadSampleTeam(): Chainable<void>;
      /** Paste custom team data and analyze */
      pasteAndAnalyze(paste: string): Chainable<void>;
      /** Navigate to a slide by dot index, or by its label (the dot's "Go to <label>" aria-label) */
      goToSlide(target: number | string): Chainable<void>;
      /** Open the report navbar's overflow menu (aria-label "Settings") */
      openSettingsMenu(): Chainable<void>;
      /** Click the next slide button */
      nextSlide(): Chainable<void>;
      /** Click the previous slide button */
      prevSlide(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("loadSampleTeam", () => {
  // Skip the WhatsNew modal and the first-report walkthrough overlay
  cy.visit("/", {
    onBeforeLoad(win) {
      win.localStorage.setItem(WHATS_NEW_SEEN_KEY, "1");
      win.localStorage.setItem(WALKTHROUGH_SEEN_KEY, "true");
    },
  });
  // There is no "Load sample" button any more; typing the exact sample paste
  // is what makes the app treat the report as the sample team.
  cy.get("textarea").type(SAMPLE_PASTE, { delay: 0 });
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

Cypress.Commands.add("goToSlide", (target: number | string) => {
  if (typeof target === "string") {
    cy.get("[data-walkthrough='slide-nav']").find(`button[aria-label='Go to ${target}']`).click();
  } else {
    cy.get("[data-walkthrough='slide-nav']").find("button[aria-label^='Go to']").eq(target).click();
  }
});

Cypress.Commands.add("openSettingsMenu", () => {
  cy.get("button[aria-label='Settings']").click();
});

Cypress.Commands.add("nextSlide", () => {
  cy.get("[aria-label='Next slide']").click();
});

Cypress.Commands.add("prevSlide", () => {
  cy.get("[aria-label='Previous slide']").click();
});

export { SAMPLE_PASTE };
