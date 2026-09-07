# DRAFT — NOT POSTED

**Status: DRAFT. This has NOT been posted to Reddit or anywhere else. R3 has no posting capability and made no outbound submissions.**
Author: R3 research agent · Date drafted: 2026-09-07 · Requires human review before any use.

---

## Intended trigger
Any r/VGC, r/stunfisk or r/PokemonChampions thread in the days around the **Regulation M-C launch (8 Sep 2026)** asking one of:
- "how do I convert my old EV spread to SP / stat points?"
- "why does my Showdown paste show weird numbers in [tool]?"
- "do Champions Pokémon still have IVs / can I still run 0 Atk IV?"
- "where do I post my team report now?"

Tone: answer the question completely first, mention the tool once, only if it is actually the answer. No link if the question is purely a rules question.

---

## Draft A — reply to "how do I convert my SV EV spread to Champions SP?"

> The rule is the same one Pokémon HOME uses on transfer: **the first stat point in a stat costs 4 EVs, and every point after that costs 8.** So the ladder is 4 EVs = 1 SP, 12 = 2, 20 = 3 … 248 = 32.
>
> Quick mental math: **(EVs + 4) ÷ 8**, rounded down to the ladder. 164 SpD → 168 ÷ 8 = 21 SP. 252 → 32 SP (the per-stat cap).
>
> Two things that trip people up:
>
> 1. **Your converted spread will usually not add up to 66.** SV spreads only spent 508 EVs and a lot of them dumped 4 EVs into a junk stat, which is worth a full SP here. Champions has no leftover currency — you spend all 66 every time — so after converting you'll normally have real points left to place. Put them somewhere deliberate rather than leaving them idle.
> 2. **32 SP is very slightly more than 252 EVs**, so a converted mon can end up one stat point richer than its SV original. Usually irrelevant, occasionally matters if you were sitting on a specific HP threshold for a berry or Substitute.
>
> And no, there are no IVs any more — they're locked at max, so 0 Atk IV to soften Foul Play / confusion damage is gone. That's a real nerf to special attackers that used to run it.

*(Optional final line, only if the thread is explicitly asking for a tool — otherwise cut it:)*

> If you'd rather not do it by hand there are a few converters around; I use pokemonvgcteamreport.com/tools/ev-to-sp because it converts the whole paste at once and then keeps the spread attached to the team report, but any of them will do the arithmetic.

---

## Draft B — reply to "do Champions teams still have IVs?"

> No. IVs are gone in Champions — every Pokémon is effectively at max in all six stats, and all the customisation lives in the 66 Stat Points (max 32 per stat).
>
> The practical fallout: you can no longer run 0 Attack IVs, so special attackers take full confusion damage and eat much bigger Foul Play. If you had a spread that leaned on minimised Attack, that assumption doesn't survive the move over.
>
> Tera is also gone in Champions regs, so if you're porting an SV team, both of those lines in your old paste are dead weight.

---

## Draft C — standalone post, ONLY if no existing thread covers M-C (needs human sign-off before posting)

**Title:** Reg M-C starts today — here's what changes for spreads and imported SV teams

> Regulation Set M-C runs 8 Sep 2026 – 1 Dec 2026. Everything legal in M-A/M-B stays legal, plus 24 more Pokémon (Rillaboom among them), six new Megas including Salamence, Golisopod and Baxcalibur, and the new **Z Mega Evolutions**: Mega Absol Z (Dark/Ghost, Sharpness), Mega Lucario Z (Fighting/Steel, Aura Guard — halves contact damage), and Mega Garchomp Z (Dragon, Levitate, so it ignores Ground moves and hazards).
>
> Team-building rule that keeps getting misquoted: you can pack **more than one Mega Stone** on a team; you just can't Mega Evolve more than one Pokémon in a battle.
>
> Two things to re-check on anything you're porting in from an older reg:
> - Garchomp Z having **Levitate** breaks a lot of inherited Ground calcs and Spikes/Sticky Web assumptions.
> - Aura Guard means your contact-move damage numbers into Lucario are half what your old calcs say.
>
> Spreads carry over unchanged — SP budget is still 66 total / 32 per stat, no IVs, no Tera.

---

## Do-not-do notes for whoever reviews this
- Do not post Draft C if it duplicates an existing megathread — reply in the megathread instead.
- Do not post the tool link in more than one thread per week; both r/VGC and r/stunfisk treat repeat tool links as self-promo.
- Verify M-C's exact legal species list against pokemon.com before posting Draft C; the "24 Pokémon" figure came from launch coverage, not a full published list.
- Verify our own `/tools/ev-to-sp` handles a `Reg M-C` paste before linking it anywhere — as of this draft the codebase only recognises Reg M-A and Reg M-B, so an M-C team may render as a classic EV team. **Linking the tool before that ticket lands would be actively embarrassing.**
