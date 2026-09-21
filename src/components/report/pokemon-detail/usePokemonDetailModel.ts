"use client";
import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import { isChampionsFormat } from "@/lib/data/tags";
import { NATURES } from "@/lib/data/natures";
import { getRelevantStats } from "@/lib/utils/stat-relevance";
import { detectMegaFromItem, isMegaForm, getMegaEntryFromSpecies } from "@/lib/utils/mega-detect";
import { lookupPokemon } from "@/lib/data/pokemon";
import { calculateAllStats, calculateAllChampionsStats, convertToChampionsSp } from "@/lib/analysis/stat-calculator";
import type { PokemonDetailSlideProps } from "./types";
export function usePokemonDetailModel({ pokemon, regulation, isMega, onToggleMega }: Pick<PokemonDetailSlideProps, "pokemon" | "regulation" | "isMega" | "onToggleMega">) {
  const { t } = useTranslation();
  const { parsed, data, calculatedStats, itemBoost } = pokemon;

  // ── Mega Evolution resolution ────────────────────────────────────
  // Mirrors PokemonCard. Two paste shapes collapse into the same "mega
  // capable" concept: base+stone (Kangaskhan @ Kangaskhanite) and already
  // in Mega form (Kangaskhan-Mega @ Kangaskhanite). Both allow flipping
  // between forms so the user can compare stats, types, and ability.
  const alreadyMega = isMegaForm(parsed.species);
  const megaEntry = useMemo(() => {
    if (alreadyMega) return getMegaEntryFromSpecies(parsed.species);
    return detectMegaFromItem(parsed.item, parsed.species);
  }, [alreadyMega, parsed.item, parsed.species]);
  const isMegaCapable = !!megaEntry;

  // Base form data — resolved first so the toggle logic below can know
  // whether we actually have a base side to flip to. For base+stone
  // pastes the parsed `data` is already the base form.
  const baseFormData = useMemo(() => {
    if (!alreadyMega || !megaEntry) return null;
    return lookupPokemon(megaEntry.baseName);
  }, [alreadyMega, megaEntry]);

  // Can this slide actually flip to its base side? alreadyMega pastes
  // require baseFormData to resolve in the Pokemon DB, otherwise the
  // base view would render empty. If not, lock to Mega and hide toggle.
  const canFlipToBase = isMegaCapable && (!alreadyMega || !!baseFormData);

  // Mirrors PokemonCard's two-gate rule: toggle (and default Mega rendering)
  // require BOTH a Reg M-A regulation (or undefined for legacy reports)
  // AND the Pokemon actually carrying a Mega Stone for its species. Without
  // either, no toggle and no auto-Mega rendering.
  const isExplicitlyNonMA = !!regulation && !isChampionsFormat(regulation);
  const hasMegaStone = useMemo(
    () => !!detectMegaFromItem(parsed.item, parsed.species),
    [parsed.item, parsed.species],
  );
  const defaultShowMega = !isExplicitlyNonMA && hasMegaStone;
  const showMega = isMegaCapable && (canFlipToBase ? (isMega ?? defaultShowMega) : true);
  const showMegaToggle =
    canFlipToBase && hasMegaStone && !isExplicitlyNonMA && !!onToggleMega;

  const megaData = useMemo(() => {
    if (!showMega || !megaEntry) return null;
    return lookupPokemon(megaEntry.dataKey);
  }, [showMega, megaEntry]);

  // Resolve "base side" data for this slide. For base+stone pastes the
  // parsed Pokemon's own data already IS the base; for alreadyMega it
  // comes from the explicit lookup. `?? data` is a defensive safety net
  // — canFlipToBase blocks the path that reaches this when baseFormData
  // is null, but it guards against future reordering churn.
  const effectiveBaseData = alreadyMega ? (baseFormData ?? data) : data;

  const megaStats = useMemo(() => {
    if (!megaData) return null;
    return calculateAllStats(
      megaData.baseStats,
      parsed.ivs,
      parsed.evs,
      parsed.level,
      parsed.nature,
    );
  }, [megaData, parsed.ivs, parsed.evs, parsed.level, parsed.nature]);

  // Base-form stats when alreadyMega is flipped to base.
  const baseFormStats = useMemo(() => {
    if (!alreadyMega || showMega || !baseFormData) return null;
    return calculateAllStats(
      baseFormData.baseStats,
      parsed.ivs,
      parsed.evs,
      parsed.level,
      parsed.nature,
    );
  }, [alreadyMega, showMega, baseFormData, parsed.ivs, parsed.evs, parsed.level, parsed.nature]);

  // Base-form stats used for the Mega delta comparison strip (shown when mega is active).
  // For base+stone pastes, effectiveBaseData IS the base form already.
  // For already-Mega pastes, effectiveBaseData resolves to baseFormData.
  // Champions format uses SP-based calculation to match the displayStats source.
  const baseStatsForComparison = useMemo(() => {
    if (!showMega || !megaData || !effectiveBaseData) return null;
    if (isChampionsFormat(regulation)) {
      const sp = convertToChampionsSp(parsed.evs);
      return calculateAllChampionsStats(effectiveBaseData.baseStats, sp, parsed.nature);
    }
    return calculateAllStats(
      effectiveBaseData.baseStats,
      parsed.ivs,
      parsed.evs,
      parsed.level,
      parsed.nature,
    );
  }, [showMega, megaData, effectiveBaseData, regulation, parsed.ivs, parsed.evs, parsed.level, parsed.nature]);

  // Champions (Reg M-A) recomputes stats from the SP budget — must run
  // against whichever side (Mega or base) is currently displayed.
  const championsStats = useMemo(() => {
    if (!isChampionsFormat(regulation)) return null;
    const sourceData = showMega ? megaData : effectiveBaseData;
    if (!sourceData) return null;
    const sp = convertToChampionsSp(parsed.evs);
    return calculateAllChampionsStats(sourceData.baseStats, sp, parsed.nature);
  }, [regulation, showMega, megaData, effectiveBaseData, parsed.evs, parsed.nature]);

  const displaySpecies = showMega && megaEntry
    ? megaEntry.displayName
    : (alreadyMega && megaEntry ? megaEntry.baseName : parsed.species);
  const displayTypes = (
    showMega && megaData ? megaData.types : effectiveBaseData?.types
  ) ?? [];
  // Base-form ability fallback: paste carries the Mega ability, so when
  // flipping alreadyMega cards to base we show the base Pokemon's primary
  // ability with an asterisk to flag it's a best guess.
  const displayAbility = showMega && megaEntry
    ? megaEntry.ability
    : (alreadyMega && baseFormData
        ? `${baseFormData.abilities[0] ?? parsed.ability} *`
        : parsed.ability);
  const displayData = showMega ? megaData : effectiveBaseData;
  const displayStats = championsStats
    ?? (showMega ? megaStats : baseFormStats)
    ?? calculatedStats;
  // Sprite: Mega uses the mega data key; base uses the resolved base name
  // so already-Mega flips to the real base sprite, not the mega slug.
  const spriteSpecies = showMega && megaEntry
    ? megaEntry.dataKey
    : (alreadyMega && megaEntry ? megaEntry.baseName : parsed.species);

  const types = displayTypes;
  const natureData = NATURES[parsed.nature];
  const relevantStats = getRelevantStats(parsed);
  const statLabels = {
    hp: t.statHp,
    atk: t.statAtk,
    def: t.statDef,
    spa: t.statSpa,
    spd: t.statSpd,
    spe: t.statSpe,
  } as const;

  // Champions (Reg M-A / M-B): no Tera, IVs locked to 31. Gate both displays.
  const isRegMA = isChampionsFormat(regulation);

  // Non-default IVs (not 31) — hidden entirely in Reg M-A since IVs are locked.
  const nonDefaultIvs = isRegMA
    ? []
    : (["hp", "atk", "def", "spa", "spd", "spe"] as const).filter(
        (stat) => parsed.ivs[stat] !== 31
      );

  return { parsed, itemBoost, displaySpecies, displayTypes, displayAbility, displayData, displayStats, spriteSpecies, types, natureData, relevantStats, statLabels, isRegMA, nonDefaultIvs, showMega, showMegaToggle, baseStatsForComparison, championsStats, megaStats };
}
export type PokemonDetailModel = ReturnType<typeof usePokemonDetailModel>;
