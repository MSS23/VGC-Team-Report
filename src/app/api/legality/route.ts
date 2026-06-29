/**
 * Public, unauthenticated legality lookup.
 *
 *   GET /api/legality?paste=<showdown-paste>&regulation=Reg M-B
 *   GET /api/legality?team=<json-array>&regulation=Reg M-B
 *
 * Returns `{ regulation, legal, reasons }` for the given team / regulation,
 * defaulting to Reg M-B (the badge format) when `regulation` is omitted.
 *
 * Built so external tools — Discord bots, browser extensions, anyone who
 * already has a paste — can check legality without going through the app.
 * Rate-limited via the existing apiGuard / Upstash pattern at 30 req/min
 * per IP, matching the other public read endpoints.
 */

import { apiGuard } from "@/lib/security/api-guard";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { getLegalityFor } from "@/lib/analysis/detect-regulation";
import type { ParsedPokemon, StatSpread } from "@/lib/types/pokemon";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_PASTE_BYTES = 50_000;
const MAX_TEAM_BYTES = 20_000;

function emptyStats(): StatSpread {
  return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
}

function fullIvs(): StatSpread {
  return { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
}

/**
 * Accept any JSON shape that looks like a team and normalize to the
 * minimal `ParsedPokemon[]` the legality helper needs. We fill in safe
 * defaults for missing fields so a bot can post `[{ species: "..." }]`
 * and still get an answer.
 */
function normalizeTeamPayload(raw: unknown): ParsedPokemon[] | null {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { pokemon?: unknown[] })?.pokemon)
      ? (raw as { pokemon: unknown[] }).pokemon
      : null;
  if (!list || list.length === 0) return null;

  const out: ParsedPokemon[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") return null;
    const e = entry as Record<string, unknown>;
    const species = typeof e.species === "string" ? e.species : null;
    if (!species) return null;
    out.push({
      species,
      nickname: typeof e.nickname === "string" ? e.nickname : null,
      gender: e.gender === "M" || e.gender === "F" ? e.gender : null,
      item: typeof e.item === "string" ? e.item : null,
      ability: typeof e.ability === "string" ? e.ability : null,
      level: typeof e.level === "number" ? e.level : 50,
      teraType: null,
      shiny: e.shiny === true,
      evs: { ...emptyStats(), ...(typeof e.evs === "object" && e.evs ? (e.evs as Partial<StatSpread>) : {}) },
      ivs: { ...fullIvs(), ...(typeof e.ivs === "object" && e.ivs ? (e.ivs as Partial<StatSpread>) : {}) },
      nature: typeof e.nature === "string" ? e.nature : "Serious",
      moves: Array.isArray(e.moves) ? (e.moves as unknown[]).filter((m): m is string => typeof m === "string") : [],
    });
  }
  return out;
}

export async function GET(request: NextRequest) {
  // Reuse the standard rate-limit pattern so an open endpoint can't be
  // weaponized for DoS-by-curl. 30/min mirrors /api/explore.
  const guard = await apiGuard(request, { rateLimit: { key: "legality", max: 30 } });
  if (guard) return guard;

  const url = request.nextUrl;
  const paste = url.searchParams.get("paste");
  const teamParam = url.searchParams.get("team");
  const regulation = url.searchParams.get("regulation")?.trim() || "Reg M-B";

  if (!paste && !teamParam) {
    return NextResponse.json(
      { error: "Provide either ?paste=<showdown-paste> or ?team=<json>" },
      { status: 400 },
    );
  }

  let team: ParsedPokemon[] | null = null;

  if (paste) {
    if (paste.length > MAX_PASTE_BYTES) {
      return NextResponse.json({ error: "Paste too large" }, { status: 413 });
    }
    try {
      const parsedTeam = parseShowdownPaste(paste);
      team = parsedTeam.pokemon;
    } catch {
      return NextResponse.json({ error: "Failed to parse paste" }, { status: 400 });
    }
  } else if (teamParam) {
    if (teamParam.length > MAX_TEAM_BYTES) {
      return NextResponse.json({ error: "Team payload too large" }, { status: 413 });
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(teamParam);
    } catch {
      return NextResponse.json({ error: "Invalid JSON in team parameter" }, { status: 400 });
    }
    team = normalizeTeamPayload(parsed);
    if (!team) {
      return NextResponse.json(
        { error: "team must be an array of { species: string, ... } objects" },
        { status: 400 },
      );
    }
  }

  if (!team || team.length === 0) {
    return NextResponse.json(
      { error: "Team is empty after parsing" },
      { status: 400 },
    );
  }

  const result = getLegalityFor(team, regulation);

  // Public endpoint — short cache so bot polling doesn't hammer the rate
  // limit; the inputs are deterministic so caching is safe.
  const response = NextResponse.json(result);
  response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return response;
}
