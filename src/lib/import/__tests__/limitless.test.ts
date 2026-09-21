import { describe, expect, it } from "vitest";
import { normalizeLimitlessUrl, parseLimitlessTeam, parseLimitlessTournament } from "../limitless";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { ShareableStateSchema } from "@/lib/sharing/url-codec.schemas";

// The source's data-id is the canonical species; its display text can put
// regional forms first ("Alolan Ninetales") and must not become the paste name.
const html = `<div class="teamlist-pokemon"><div class="pkmn" data-id="ninetales-alola">
<div class="name">Alolan Ninetales</div><div class="details"><div class="item">Focus Sash</div>
<div class="ability">Ability: Snow Warning</div><div class="tera">Tera Type: Ghost</div></div>
<ul class="moves"><li>Blizzard</li><li>Protect</li></ul></div></div>
<div class="teamlist-results"><ul><li>1st Place <a href="/tournaments/400">Regional Frankfurt</a> - <a href="/players/1">Trainer &amp; Co</a></li></ul></div>`;

describe("Limitless team import", () => {
  it("preserves canonical forms and omits undisclosed spreads", () => {
    const imported = parseLimitlessTeam(html);
    const pokemon = parseShowdownPaste(imported.paste).pokemon[0];
    expect(pokemon.species).toBe("Ninetales-Alola");
    expect(Object.values(pokemon.evs).reduce((a, b) => a + b, 0)).toBe(0);
    expect(pokemon.ability).toBe("Snow Warning");
    expect(imported.results[0]).toEqual({ tournamentName: "Regional Frankfurt", tournamentUrl: "https://limitlessvgc.com/tournaments/400", placement: "1st", player: "Trainer & Co" });
  });
  it("rejects malformed sheets instead of importing an empty team", () => {
    expect(() => parseLimitlessTeam("<html>not found</html>")).toThrow("No single team");
    expect(() => parseLimitlessTeam(html.replace('data-id="ninetales-alola"', 'data-id="unknown-species"'))).toThrow("Unsupported species");
  });
  it.each([
    "http://limitlessvgc.com/teams/1", "https://limitlessvgc.com.evil.test/teams/1",
    "https://limitlessvgc.com@127.0.0.1/teams/1", "https://limitlessvgc.com:8443/teams/1",
    "https://limitlessvgc.com/tournaments/1", "https://limitlessvgc.com/teams/../admin",
  ])("blocks non-team or unsafe fetch targets: %s", (url) => {
    expect(() => normalizeLimitlessUrl(url)).toThrow();
  });
  it("normalizes safe team URLs without propagating query or fragment data", () => {
    expect(normalizeLimitlessUrl("https://limitlessvgc.com/teams/1/?utm_source=x#foo")).toBe("https://limitlessvgc.com/teams/1");
  });
  it("extracts event date, region, player count, and regulation", () => {
    expect(parseLimitlessTournament(`<div class="infobox"><div class="infobox-heading">Frankfurt <img class="flag" alt="DE" data-tooltip="Germany"></div><div class="infobox-line">13th September 2025 • 742 Players • Scarlet &amp; Violet - Regulation H</div></div>`)).toEqual({ regulation: "Reg H", tournamentDate: "13th September 2025", tournamentPlayers: 742, tournamentRegion: "Germany" });
  });
  it("keeps tournament context through share-state validation", () => {
    const tags = { tournamentUrl: "https://limitlessvgc.com/tournaments/400", tournamentDate: "13th September 2025", tournamentPlayers: 742, tournamentRegion: "Germany" };
    expect(ShareableStateSchema.parse({ paste: "", notes: {}, matchupPlans: [], tags }).tags).toEqual(tags);
    expect(ShareableStateSchema.safeParse({ paste: "", notes: {}, matchupPlans: [], tags: { tournamentUrl: "javascript:alert(1)" } }).success).toBe(false);
  });
});
