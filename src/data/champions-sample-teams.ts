/**
 * Pre-built Champions format sample team archetypes (VGC-77).
 * These represent iconic archetypes from the Champions Series format
 * featuring Mega Evolutions and Primal Pokemon.
 */

export interface ChampionsSampleTeam {
  id: string;
  name: string;
  description: string;
  pokemon: [string, string, string, string, string, string];
  regulation: "Champions";
  paste: string;
}

export const CHAMPIONS_SAMPLE_TEAMS: ChampionsSampleTeam[] = [
  {
    id: "sample-groudon-sun",
    name: "Primal Groudon Sun",
    description: "Hyper-offense built around Primal Groudon's Desolate Land, abusing sun-boosted Fire moves and a fast Mode-2 offense package.",
    pokemon: ["groudon", "xerneas", "bronzong", "incineroar", "landorus-therian", "amoonguss"],
    regulation: "Champions",
    paste: `Groudon-Primal @ Red Orb
Ability: Desolate Land
Level: 50
EVs: 4 HP / 252 Atk / 252 Spe
Adamant Nature
- Precipice Blades
- Fire Punch
- Rock Slide
- Protect

Xerneas @ Power Herb
Ability: Fairy Aura
Level: 50
EVs: 4 HP / 252 SpA / 252 Spe
Modest Nature
- Geomancy
- Moonblast
- Dazzling Gleam
- Protect

Bronzong @ Sitrus Berry
Ability: Levitate
Level: 50
EVs: 252 HP / 4 Def / 252 SpD
Sassy Nature
IVs: 0 Spe
- Trick Room
- Gyro Ball
- Imprison
- Safeguard

Incineroar @ Assault Vest
Ability: Intimidate
Level: 50
EVs: 252 HP / 4 Atk / 76 Def / 108 SpD / 68 Spe
Careful Nature
- Fake Out
- Knock Off
- Flare Blitz
- U-turn

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
- Protect`,
  },
  {
    id: "sample-kyogre-rain",
    name: "Primal Kyogre Rain",
    description: "Rain archetype anchored by Primal Kyogre's Primordial Sea, pairing Water Spout with speed control and defensive backbone.",
    pokemon: ["kyogre", "lunala", "incineroar", "amoonguss", "bronzong", "tapu-fini"],
    regulation: "Champions",
    paste: `Kyogre-Primal @ Blue Orb
Ability: Primordial Sea
Level: 50
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Water Spout
- Origin Pulse
- Thunder
- Protect

Lunala @ Lunalium Z
Ability: Shadow Shield
Level: 50
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Moongeist Beam
- Psyshock
- Wide Guard
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

Amoonguss @ Rocky Helmet
Ability: Regenerator
Level: 50
EVs: 252 HP / 148 Def / 108 SpD
Relaxed Nature
IVs: 0 Spe
- Spore
- Rage Powder
- Giga Drain
- Protect

Bronzong @ Sitrus Berry
Ability: Levitate
Level: 50
EVs: 252 HP / 4 Def / 252 SpD
Sassy Nature
IVs: 0 Spe
- Trick Room
- Gyro Ball
- Imprison
- Safeguard

Tapu Fini @ Leftovers
Ability: Misty Surge
Level: 50
EVs: 252 HP / 4 Def / 68 SpA / 108 SpD / 76 Spe
Calm Nature
- Muddy Water
- Moonblast
- Calm Mind
- Protect`,
  },
  {
    id: "sample-kangaskhan-goodstuffs",
    name: "Mega Kangaskhan Goodstuffs",
    description: "Balanced goodstuffs team featuring Mega Kangaskhan's Parental Bond for consistent double-hit damage with flexible team support.",
    pokemon: ["kangaskhan", "incineroar", "amoonguss", "landorus-therian", "tapu-koko", "arcanine"],
    regulation: "Champions",
    paste: `Kangaskhan-Mega @ Kangaskhanite
Ability: Parental Bond
Level: 50
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Fake Out
- Return
- Sucker Punch
- Power-Up Punch

Incineroar @ Assault Vest
Ability: Intimidate
Level: 50
EVs: 252 HP / 4 Atk / 76 Def / 108 SpD / 68 Spe
Careful Nature
- Fake Out
- Knock Off
- Flare Blitz
- U-turn

Amoonguss @ Sitrus Berry
Ability: Regenerator
Level: 50
EVs: 252 HP / 148 Def / 108 SpD
Relaxed Nature
IVs: 0 Spe
- Spore
- Rage Powder
- Giga Drain
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

Tapu Koko @ Life Orb
Ability: Electric Surge
Level: 50
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Thunderbolt
- Dazzling Gleam
- Volt Switch
- Protect

Arcanine @ Sitrus Berry
Ability: Intimidate
Level: 50
EVs: 252 HP / 76 Atk / 4 Def / 124 SpD / 52 Spe
Adamant Nature
- Extreme Speed
- Flare Blitz
- Will-O-Wisp
- Protect`,
  },
];
