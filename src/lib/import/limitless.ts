import { load } from "cheerio";
import { lookupPokemon } from "@/lib/data/pokemon";
import { REGULATIONS, type ReportTags } from "@/lib/data/tags";

export interface LimitlessResult {
  paste: string;
  results: { tournamentName: string; tournamentUrl: string; placement: string; player: string }[];
}

export function normalizeLimitlessUrl(input: string, kind: "team" | "tournament" = "team"): string {
  const url = new URL(input.trim());
  const path = kind === "team" ? /^\/teams\/\d+\/?$/ : /^\/tournaments\/\d+\/?$/;
  if (url.protocol !== "https:" || url.hostname !== "limitlessvgc.com" || url.port || url.username || url.password || !path.test(url.pathname)) {
    throw new Error(`Enter an HTTPS Limitless ${kind} URL.`);
  }
  return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
}

export function parseLimitlessTeam(html: string): LimitlessResult {
  const $ = load(html);
  const blocks = $(".teamlist-pokemon .pkmn").toArray();
  if (blocks.length < 1 || blocks.length > 6) throw new Error("No single team sheet was found on this page.");
  const paste = blocks.map((block) => {
    const el = $(block);
    const id = el.attr("data-id") ?? "";
    const species = lookupPokemon(id)?.name;
    if (!species) throw new Error(`Unsupported species: ${id}`);
    const item = el.find(".details .item").text().trim();
    const ability = el.find(".ability").text().trim();
    const tera = el.find(".tera").text().trim();
    const nature = el.find(".nature").text().trim();
    const moves = el.find(".moves li").toArray().map((move) => $(move).text().trim());
    if (!ability || moves.length < 1 || moves.length > 4) throw new Error("The team sheet is incomplete.");
    return [species + (item ? ` @ ${item}` : ""), ability, tera, nature, ...moves.map((move) => `- ${move}`)].filter(Boolean).join("\n");
  }).join("\n\n");
  const results = $(".teamlist-results li").toArray().map((entry) => {
    const el = $(entry);
    const tournament = el.find('a[href^="/tournaments/"]').first();
    const url = new URL(tournament.attr("href") ?? "", "https://limitlessvgc.com").href;
    return {
      tournamentName: tournament.text().trim(),
      tournamentUrl: normalizeLimitlessUrl(url, "tournament"),
      placement: el.text().trim().match(/^\d+(?:st|nd|rd|th)?/)?.[0] ?? "",
      player: el.find('a[href^="/players/"]').text().trim(),
    };
  });
  if (!results.length) throw new Error("This team has no linked tournament result.");
  return { paste, results };
}

export function parseLimitlessTournament(html: string): Partial<ReportTags> {
  const $ = load(html);
  const details = $(".infobox").text().replace(/\s+/g, " ").trim();
  const page = details || $(".before-content").parent().find(".heading").text().replace(/\s+/g, " ").trim();
  const reg = (details || $("body").text()).match(/Regulation\s+(?:Set\s+)?(M-[A-Z]|[A-I])\b/i)?.[1]?.toUpperCase();
  const regulation = reg ? `Reg ${reg}` : undefined;
  return {
    regulation: regulation && REGULATIONS.some((value) => value === regulation) ? regulation : "Custom",
    tournamentDate: page.match(/\d{1,2}(?:st|nd|rd|th)\s+[A-Za-z]+\s+\d{4}/)?.[0],
    tournamentPlayers: Number(page.match(/([\d,]+)\s+Players/i)?.[1]?.replace(/,/g, "")) || undefined,
    tournamentRegion: $(".flag").first().attr("data-tooltip") ?? $(".flag").first().attr("alt"),
  };
}
