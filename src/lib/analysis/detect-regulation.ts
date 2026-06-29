/**
 * Auto-detect the competitive regulation from a parsed team.
 *
 * Detection works on *positive* signals — we only tag a regulation when
 * the team carries a species (or item) whose presence narrows the format
 * to a small, unambiguous set. Absence of a signal is treated as
 * genuinely ambiguous and we return null so the user picks manually.
 *
 * Signal hierarchy (highest priority first):
 *
 *   1. Mega / Primal / Champions-exclusive form → "Reg M-A"
 *      Pokémon Champions format. Catches Mega Stone held, Mega species,
 *      Primal Orb held, Primal species suffix, and event-only forms
 *      like Floette-Eternal that only exist in the Champions dex.
 *
 *   2. Restricted Legendary present → "Reg G"
 *      Reg G and Reg I are the only Gen 9 regs that permit Restricted
 *      Legendaries. We default to Reg G; user overrides to Reg I when
 *      the event uses the 2-restricted ruleset.
 *
 *   3. Clean of Paradox / Sub-Legendary / Mythical + has DLC species → "Reg H"
 *      Reg H bans every Legendary, Paradox, and Mythical. A team clean
 *      of those banned categories with at least one non-Paldea species
 *      (Ursaluna, Archaludon, Incineroar, any Hisuian form) positively
 *      distinguishes Reg H from the Paldea-only Reg A.
 *
 *   4. Paradox or Sub-Legendary present + no Restricted → "Reg F"
 *      Reg F is the "everything but Restricted" open format. Paradox
 *      and Sub-Legendaries are legal, cover legendaries are not. This
 *      path tags the team Reg F because it's the longest-running active
 *      non-restricted paradox format; users can downshift manually to
 *      C/D/E for older metagames.
 *
 *   5. Otherwise → null
 *      A Paldea-only team with no Legendary/Paradox/Mega/DLC signals
 *      could be Reg A or a Reg H team that happens to be all-native.
 *      Falls through — the caller tags it "Custom".
 *
 * Authoritative sources cross-referenced in
 * lib/data/gen9-regulation-signals.ts.
 */

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { ParsedPokemon } from "@/lib/types/pokemon";
import { detectMegaFromItem, isMegaForm, getMegaEntryFromSpecies } from "@/lib/utils/mega-detect";
import { CHAMPIONS_REG_MB_ONLY_MEGAS } from "@/lib/data/mega-pokemon";
import { validateChampionsTeam } from "@/lib/validation/champions-legality";
import { isChampionsFormat } from "@/lib/data/tags";
import {
  RESTRICTED_LEGENDARIES,
  PARADOX_POKEMON,
  SUB_LEGENDARIES,
  DLC_ERA_SPECIES,
  MYTHICAL_POKEMON,
  CHAMPIONS_EXCLUSIVE_SPECIES,
  getRegulationLookupKey,
} from "@/lib/data/gen9-regulation-signals";

const PRIMAL_ORB_ITEMS = new Set(["red orb", "blue orb"]);

/**
 * Detection result. Callers can use `regulation` for the tag and
 * `signals` for diagnostic display (e.g. "detected because Calyrex is
 * a Restricted Legendary").
 */
interface RegulationDetection {
  regulation: string | null;
  signals: string[];
}

/**
 * Detect regulation with full signal diagnostics. Most callers only
 * need {@link detectRegulation} which returns the tag string.
 */
function detectRegulationWithSignals(
  pokemon: AnalyzedPokemon[],
): RegulationDetection {
  if (pokemon.length === 0) {
    return { regulation: null, signals: [] };
  }

  const signals: string[] = [];

  // ── Signal 0: Reg M-B (Pokémon Champions, newer format) ──────────
  // M-B is a superset of M-A, so the only unambiguous "this is M-B, not
  // M-A" signal is a Mega that's exclusive to M-B (Mega Metagross, Mega
  // Staraptor, etc.). Megas only exist in the Champions formats, and these
  // specific ones aren't M-A legal — so their presence pins the team to
  // M-B. Checked across the whole team before the M-A pass so an M-B Mega
  // in any slot wins. (The new M-B *base* forms — Gholdengo, Annihilape,
  // etc. — are NOT used as signals: they're also legal in SV Reg F/G/H/I.)
  for (const p of pokemon) {
    const megaEntry =
      (isMegaForm(p.parsed.species) ? getMegaEntryFromSpecies(p.parsed.species) : null) ??
      detectMegaFromItem(p.parsed.item, p.parsed.species);
    if (megaEntry && CHAMPIONS_REG_MB_ONLY_MEGAS.has(megaEntry.dataKey)) {
      return {
        regulation: "Reg M-B",
        signals: [`${megaEntry.displayName} is a Reg M-B Mega Evolution (not legal in Reg M-A)`],
      };
    }
  }

  // ── Signal 1: Reg M-A (Pokémon Champions) ────────────────────────
  // Any Mega Stone, Mega form, Primal Orb, Primal species, or
  // Champions-exclusive event form (e.g. Floette-Eternal) means the
  // team can only battle in Reg M-A.
  for (const p of pokemon) {
    const species = p.parsed.species;
    const item = p.parsed.item;
    const rawKey = species.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (isMegaForm(species)) {
      return {
        regulation: "Reg M-A",
        signals: [`${species} is a Mega Evolution (Reg M-A only)`],
      };
    }
    if (detectMegaFromItem(item, species)) {
      return {
        regulation: "Reg M-A",
        signals: [`${species} holds ${item} (Mega Stone — Reg M-A only)`],
      };
    }
    if (item && PRIMAL_ORB_ITEMS.has(item.toLowerCase())) {
      return {
        regulation: "Reg M-A",
        signals: [`${species} holds ${item} (Primal Reversion — Reg M-A only)`],
      };
    }
    if (/-primal$/i.test(species)) {
      return {
        regulation: "Reg M-A",
        signals: [`${species} is a Primal form (Reg M-A only)`],
      };
    }
    if (CHAMPIONS_EXCLUSIVE_SPECIES.has(rawKey)) {
      return {
        regulation: "Reg M-A",
        signals: [`${species} is a Champions-exclusive form (Reg M-A only)`],
      };
    }
  }

  // ── Signal 2: Restricted Legendary ──────────────────────────────
  // Calyrex, Miraidon, Koraidon, etc. are the "cover" legendaries. They
  // are banned in every current Gen 9 regulation EXCEPT Reg G and Reg I.
  // We default to Reg G (the longer-running established format); user
  // can manually override to Reg I when their event uses that ruleset.
  const restrictedHolders: string[] = [];
  for (const p of pokemon) {
    const key = getRegulationLookupKey(p.parsed.species);
    if (RESTRICTED_LEGENDARIES.has(key)) {
      restrictedHolders.push(p.parsed.species);
    }
  }
  if (restrictedHolders.length > 0) {
    signals.push(
      `Restricted Legendary: ${restrictedHolders.join(", ")} (allowed in Reg G / Reg I)`,
    );
    return { regulation: "Reg G", signals };
  }

  // ── Collect disqualifying signals for Reg H detection ───────────
  // Reg H bans Paradox, Sub-Legendary, and Mythical outright. If the
  // team runs any of those we cannot tag Reg H, regardless of DLC
  // species presence. (Restricted Legendaries already short-circuited
  // above into Reg G.)
  const paradoxHolders: string[] = [];
  const subLegendaryHolders: string[] = [];
  const mythicalHolders: string[] = [];
  const dlcEraHolders: string[] = [];
  for (const p of pokemon) {
    const key = getRegulationLookupKey(p.parsed.species);
    if (PARADOX_POKEMON.has(key)) paradoxHolders.push(p.parsed.species);
    if (SUB_LEGENDARIES.has(key)) subLegendaryHolders.push(p.parsed.species);
    if (MYTHICAL_POKEMON.has(key)) mythicalHolders.push(p.parsed.species);
    // DLC lookup intentionally uses the raw normalized key (no form
    // stripping) because entries like "ursaluna-bloodmoon" and
    // "urshifu-rapid-strike" are form-specific and legitimate signals.
    const rawKey = p.parsed.species.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (DLC_ERA_SPECIES.has(rawKey) || DLC_ERA_SPECIES.has(key)) {
      dlcEraHolders.push(p.parsed.species);
    }
  }

  // ── Signal 3: Reg H positive detection ──────────────────────────
  // Clean of all Reg-H-banned categories + has a DLC/HOME species that
  // rules out Paldea-only Reg A → confidently Reg H.
  const regHClean =
    paradoxHolders.length === 0 &&
    subLegendaryHolders.length === 0 &&
    mythicalHolders.length === 0;
  if (regHClean && dlcEraHolders.length > 0) {
    return {
      regulation: "Reg H",
      signals: [
        `${dlcEraHolders.join(", ")}: not in Paldea native dex (rules out Reg A)`,
        "No Legendary / Paradox / Mythical on the team (Reg H compatible)",
      ],
    };
  }

  // ── Signal 4: Reg F (Paradox / Sub-Legendary, no Restricted) ────
  // Reg F is the open "everything but Restricted" format — Paradox and
  // Sub-Legendaries are legal, but the cover legendaries are not. A
  // team with Paradox or a Sub-Legendary and no Restricted rules out
  // Reg A (Paldea-only native), Reg G / Reg I (those require Restricted
  // to be a distinguishing signal but those branches already returned
  // above), and Reg H (bans Paradox + Sub-Legendaries). That leaves
  // Reg C / D / E / F, and among those Reg F is the longest-running
  // active ruleset and the most sensible default tag. Users running
  // an older reg can manually override.
  if (paradoxHolders.length > 0 || subLegendaryHolders.length > 0) {
    const reasons: string[] = [];
    if (paradoxHolders.length > 0) {
      reasons.push(`Paradox: ${paradoxHolders.join(", ")}`);
    }
    if (subLegendaryHolders.length > 0) {
      reasons.push(`Sub-Legendary: ${subLegendaryHolders.join(", ")}`);
    }
    reasons.push("No Restricted Legendary (rules out Reg G / Reg I)");
    return { regulation: "Reg F", signals: reasons };
  }

  // ── Signal 5: Mythical diagnostic ───────────────────────────────
  if (mythicalHolders.length > 0) {
    signals.push(
      `Mythical: ${mythicalHolders.join(", ")} (banned in every VGC regulation)`,
    );
  }

  return { regulation: null, signals };
}

/**
 * Convenience wrapper returning just the regulation tag (or null) with
 * no diagnostic info. This is the function the home-page effect calls.
 */
export function detectRegulation(pokemon: AnalyzedPokemon[]): string | null {
  return detectRegulationWithSignals(pokemon).regulation;
}

// ── Legality helper (Reg M-B badge, public API endpoint) ───────────────────

/**
 * Compact legality result for a team in a given regulation. Used by the
 * `LegalityBadge` UI component and the public `/api/legality` endpoint.
 *
 * `legal` is true when the team passes the regulation's hard rules.
 * `reasons` enumerates the *blocking* problems in plain English ("uses
 * Mega Metagross, which is not legal in Reg M-A") — empty when legal.
 */
export interface LegalityFor {
  regulation: string;
  legal: boolean;
  reasons: string[];
}

type LegalityTeamInput =
  | AnalyzedPokemon[]
  | ParsedPokemon[]
  | { pokemon: AnalyzedPokemon[] }
  | { pokemon: ParsedPokemon[] };

function toParsedTeam(team: LegalityTeamInput): ParsedPokemon[] {
  // Accept both raw arrays and wrapper objects (`{ pokemon: [...] }`).
  const arr = Array.isArray(team) ? team : team.pokemon;
  if (!arr || arr.length === 0) return [];
  // AnalyzedPokemon carries `.parsed`; ParsedPokemon is the leaf.
  return arr.map((p) => {
    if (p && typeof p === "object" && "parsed" in p && (p as AnalyzedPokemon).parsed) {
      return (p as AnalyzedPokemon).parsed;
    }
    return p as ParsedPokemon;
  });
}

/**
 * Determine whether `team` is legal in `regulation` and surface short,
 * human-readable reasons when it isn't.
 *
 * Pure helper — does not mutate inputs and does not call any external
 * services, so it is safe to invoke from server components, route
 * handlers, and client effects.
 *
 * Today this only enforces the Champions formats (Reg M-A / Reg M-B) by
 * delegating to {@link validateChampionsTeam}. For non-Champions
 * regulations we report `legal: true` with an empty `reasons` array
 * because the M-B-only Mega-Stone gates this helper was built for don't
 * apply — callers that want full SV-format validation should reach for
 * the regulation-specific validators directly.
 */
export function getLegalityFor(
  team: LegalityTeamInput,
  regulation: string,
): LegalityFor {
  const parsed = toParsedTeam(team);
  const reasons: string[] = [];

  if (parsed.length === 0) {
    return { regulation, legal: false, reasons: ["Team is empty"] };
  }

  if (!isChampionsFormat(regulation)) {
    // Out of scope for this helper — treat as legal so the badge stays
    // green for SV formats rather than blocking on rules we don't check.
    return { regulation, legal: true, reasons: [] };
  }

  const championsReg: "Reg M-A" | "Reg M-B" =
    regulation === "Reg M-B" ? "Reg M-B" : "Reg M-A";

  // When validating M-A, surface M-B-only Megas as a tailored, top-line
  // reason — that's the single most common reason an otherwise-fine team
  // is rejected and the badge's "uses unlisted Mega" copy speaks to it.
  if (championsReg === "Reg M-A") {
    for (const p of parsed) {
      const megaEntry =
        (isMegaForm(p.species) ? getMegaEntryFromSpecies(p.species) : null) ??
        detectMegaFromItem(p.item, p.species);
      if (megaEntry && CHAMPIONS_REG_MB_ONLY_MEGAS.has(megaEntry.dataKey)) {
        reasons.push(
          `${megaEntry.displayName} is a Reg M-B Mega Evolution (not legal in Reg M-A)`,
        );
      }
    }
  }

  const result = validateChampionsTeam(parsed, championsReg);
  for (const issue of result.issues) {
    if (issue.severity === "error") {
      reasons.push(issue.message);
    }
  }

  // De-duplicate so the M-B-only Mega callout doesn't appear twice when
  // the underlying validator also flags it as not in the M-A dex.
  const seen = new Set<string>();
  const deduped = reasons.filter((r) => {
    if (seen.has(r)) return false;
    seen.add(r);
    return true;
  });

  return {
    regulation: championsReg,
    legal: deduped.length === 0,
    reasons: deduped,
  };
}
