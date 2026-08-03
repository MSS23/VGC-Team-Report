// Cypress ships its own type definitions (node_modules/cypress/types) — there is no
// @types/cypress package for modern Cypress. Those types live outside node_modules/@types,
// so TypeScript will not pick them up automatically.
//
// The root tsconfig.json includes this tree (VGC-224 re-included cypress/ after b1e95df
// excluded it), and the root tsconfig deliberately sets no "types" array, so this
// triple-slash reference is what makes the Cypress globals (cy, Cypress, describe, it,
// expect) resolve during `tsc --noEmit`.
//
// cypress/tsconfig.json does the same job via "types": ["cypress"] for tools that
// type-check this directory standalone (editors, `tsc -p cypress/tsconfig.json`).
/// <reference types="cypress" />
