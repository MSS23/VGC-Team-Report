import type { AnalyzedPokemon } from "@/lib/types/analysis";

/**
 * Auto-detect team archetypes based on abilities, moves, and Pokemon composition.
 * Returns an array of detected archetype strings matching the ARCHETYPES constant.
 */
export function detectArchetypes(pokemon: AnalyzedPokemon[]): string[] {
  const detected: string[] = [];

  const abilities = pokemon.map((p) => p.parsed.ability?.toLowerCase() ?? "");
  const allMoves = pokemon.flatMap((p) => p.parsed.moves.map((m) => m.toLowerCase()));
  const species = pokemon.map((p) => p.parsed.species.toLowerCase());

  // Weather: Rain
  if (
    abilities.includes("drizzle") ||
    abilities.includes("primordial sea") ||
    species.some((s) => s.includes("kyogre") || s.includes("pelipper") || s.includes("politoed"))
  ) {
    detected.push("Rain");
  }

  // Weather: Sun
  if (
    abilities.includes("drought") ||
    abilities.includes("desolate land") ||
    abilities.includes("orichalcum pulse") ||
    species.some((s) => s.includes("groudon") || s.includes("torkoal") || s.includes("koraidon"))
  ) {
    detected.push("Sun");
  }

  // Weather: Sand
  if (
    abilities.includes("sand stream") ||
    species.some((s) => s.includes("tyranitar") || s.includes("hippowdon") || s.includes("gigalith"))
  ) {
    detected.push("Sand");
  }

  // Weather: Snow
  if (
    abilities.includes("snow warning") ||
    species.some((s) => s.includes("abomasnow") || s.includes("ninetales-alola") || s.includes("alolan ninetales"))
  ) {
    detected.push("Snow");
  }

  // Primal Weather
  if (species.some((s) => s.includes("-primal"))) {
    detected.push("Primal Weather");
  }

  // Mega Offense
  const hasMega = species.some((s) => s.includes("-mega"));
  const items = pokemon.map((p) => p.parsed.item?.toLowerCase() ?? "");
  const hasMegaStone = items.some((item) => item.endsWith("ite") || item.endsWith("ite x") || item.endsWith("ite y"));
  if (hasMega || hasMegaStone) {
    detected.push("Mega Offense");
  }

  // Trick Room
  const hasTrickRoom = allMoves.includes("trick room");
  const slowCount = pokemon.filter((p) => {
    const spe = p.data?.baseStats?.spe ?? p.calculatedStats.spe;
    return spe <= 50;
  }).length;

  if (hasTrickRoom && slowCount >= 3) {
    detected.push("Trick Room");
  } else if (hasTrickRoom && slowCount >= 1) {
    detected.push("Semi-TR");
  }

  // Tailwind
  if (allMoves.includes("tailwind")) {
    detected.push("Tailwind");
  }

  // Hyper Offense: lots of max speed/attack investment, few defensive moves
  const offensiveCount = pokemon.filter((p) => {
    const atkEvs = (p.parsed.evs?.atk ?? 0) + (p.parsed.evs?.spa ?? 0);
    const speEvs = p.parsed.evs?.spe ?? 0;
    return atkEvs >= 200 && speEvs >= 200;
  }).length;

  const protectCount = allMoves.filter((m) => m === "protect" || m === "detect" || m === "wide guard" || m === "quick guard").length;

  if (offensiveCount >= 4 && protectCount <= 2) {
    detected.push("Hyper Offense");
  }

  // Bulky Offense: mix of investment
  const bulkyOffenseCount = pokemon.filter((p) => {
    const hpEvs = p.parsed.evs?.hp ?? 0;
    const atkEvs = (p.parsed.evs?.atk ?? 0) + (p.parsed.evs?.spa ?? 0);
    return hpEvs >= 100 && atkEvs >= 100;
  }).length;

  if (bulkyOffenseCount >= 3 && !detected.includes("Hyper Offense")) {
    detected.push("Bulky Offense");
  }

  // Balance: if nothing else strongly detected, and team has a mix
  if (detected.length === 0 || (detected.length === 1 && detected[0] === "Tailwind")) {
    const hasSupport = pokemon.some((p) =>
      p.parsed.moves.some((m) => {
        const ml = m.toLowerCase();
        return ["fake out", "follow me", "rage powder", "helping hand", "icy wind", "snarl", "will-o-wisp"].includes(ml);
      })
    );
    const hasOffense = pokemon.some((p) => {
      const atkEvs = (p.parsed.evs?.atk ?? 0) + (p.parsed.evs?.spa ?? 0);
      return atkEvs >= 200;
    });
    if (hasSupport && hasOffense) {
      // Only add if not already covered
      if (!detected.includes("Bulky Offense") && !detected.includes("Hyper Offense")) {
        detected.push("Balance");
      }
    }
  }

  // Goodstuffs: strong individual Pokemon without a coherent archetype strategy
  if (detected.length === 0) {
    detected.push("Goodstuffs");
  }

  return detected;
}
